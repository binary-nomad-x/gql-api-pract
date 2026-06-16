import type { PrismaClient, Prisma } from "@prisma/client";
import type { CreateProductInput, UpdateProductInput, PlaceOrderInput, ProcessPaymentInput, CreateRefundInput } from "@gql-prisma-api/modules/commerce/inputs.js";
import { requireAuth, requireOwner } from "@gql-prisma-api/utils/errors.js";
import { triggerNovuWorkflow } from "@gql-prisma-api/utils/novu.js";
import { logger } from "@gql-prisma-api/utils/logger.js";

export async function createProduct(
  prisma: PrismaClient,
  userId: string | undefined,
  input: CreateProductInput,
) {
  requireAuth(userId);
  const { categorySlug, ...data } = input;
  const { clean } = await import("@gql-prisma-api/utils/clean.js");
  const createData: Prisma.ProductCreateInput = clean({
    ...data,
    stock: input.stock ?? 0,
    sellerId: userId!,
    category: categorySlug ? { connect: { slug: categorySlug } } : undefined,
  }) as unknown as Prisma.ProductCreateInput;
  return prisma.product.create({ data: createData });
}

export async function updateProduct(
  prisma: PrismaClient,
  userId: string | undefined,
  id: string,
  input: UpdateProductInput,
) {
  const product = await prisma.product.findUnique({ where: { id } });
  if (!product) throw new Error("Product not found");
  requireOwner(product.sellerId, userId);
  const { categorySlug, ...data } = input;
  const { clean } = await import("@gql-prisma-api/utils/clean.js");
  const updateData: Prisma.ProductUpdateInput = clean({
    ...data,
    ...(categorySlug !== undefined
      ? {
          category: categorySlug
            ? { connect: { slug: categorySlug } }
            : { disconnect: true },
        }
      : {}),
  }) as unknown as Prisma.ProductUpdateInput;
  return prisma.product.update({ where: { id }, data: updateData });
}

export async function deleteProduct(
  prisma: PrismaClient,
  userId: string | undefined,
  id: string,
) {
  const product = await prisma.product.findUnique({ where: { id } });
  if (!product) throw new Error("Product not found");
  requireOwner(product.sellerId, userId);
  await prisma.product.delete({ where: { id } });
  return true;
}

export async function placeOrder(
  prisma: PrismaClient,
  userId: string | undefined,
  input: PlaceOrderInput,
) {
  requireAuth(userId);

  const products = await prisma.product.findMany({
    where: { id: { in: input.items.map((i) => i.productId) } },
  });
  const productMap = new Map(products.map((p) => [p.id, p]));

  let totalAmount = 0;
  for (const item of input.items) {
    const p = productMap.get(item.productId);
    if (!p) throw new Error(`Product ${item.productId} not found`);
    if (!p.isActive) throw new Error(`${p.name} is inactive`);
    if (p.stock < item.quantity)
      throw new Error(`Insufficient stock for ${p.name}`);
    totalAmount += p.price * item.quantity;
  }

  let discountAmount = 0;
  if (input.couponCode) {
    const coupon = await prisma.coupon.findUnique({
      where: { code: input.couponCode },
    });
    if (
      coupon?.isActive &&
      coupon.usedCount < coupon.maxUses &&
      totalAmount >= coupon.minPurchase
    ) {
      discountAmount =
        coupon.discountAmount > 0
          ? coupon.discountAmount
          : totalAmount * (coupon.discountPercent / 100);
    }
  }

  const order = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const orderData: Prisma.OrderCreateInput = {
      user: { connect: { id: userId! } },
      totalAmount,
      discountAmount,
      shippingAddress: input.shippingAddress ?? null,
      items: {
        create: input.items.map((item) => ({
          product: { connect: { id: item.productId } },
          quantity: item.quantity,
          unitPrice: productMap.get(item.productId)!.price,
        })),
      },
    };
    if (input.couponCode) {
      orderData.coupon = { connect: { code: input.couponCode } };
    }
    const o = await tx.order.create({
      data: orderData,
      include: { items: { include: { product: true } } },
    });

    for (const item of input.items) {
      await tx.product.update({
        where: { id: item.productId },
        data: { stock: { decrement: item.quantity } },
      });
    }

    if (input.couponCode) {
      await tx.coupon.update({
        where: { code: input.couponCode },
        data: { usedCount: { increment: 1 } },
      });
    }

    return o;
  });

  await triggerNovuWorkflow(userId!, "order-placed", {
    orderId: order.id,
    totalAmount,
    itemCount: input.items.length,
  });

  logger.info("Order placed", { orderId: order.id, userId: userId!, totalAmount, itemCount: input.items.length });
  return order;
}

export async function cancelOrder(
  prisma: PrismaClient,
  userId: string | undefined,
  id: string,
) {
  requireAuth(userId);
  const order = await prisma.order.findUnique({
    where: { id },
    include: { items: true },
  });
  if (!order) throw new Error("Order not found");
  requireOwner(order.userId, userId);
  if (["DELIVERED", "SHIPPED"].includes(order.status)) {
    throw new Error("Cannot cancel shipped or delivered order");
  }

  const updated = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const o = await tx.order.update({
      where: { id },
      data: { status: "CANCELLED" },
    });
    for (const item of order.items) {
      await tx.product.update({
        where: { id: item.productId },
        data: { stock: { increment: item.quantity } },
      });
    }
    return o;
  });

  await triggerNovuWorkflow(userId!, "order-cancelled", { orderId: id });

  logger.info("Order cancelled", { orderId: id, userId: userId! });
  return updated;
}

export async function updateOrderStatus(
  prisma: PrismaClient,
  userId: string | undefined,
  id: string,
  status: string,
) {
  requireAuth(userId);
  const order = await prisma.order.findUnique({ where: { id } });
  if (!order) throw new Error("Order not found");
  requireOwner(order.userId, userId);
  return prisma.order.update({ where: { id }, data: { status } });
}

export async function processPayment(
  prisma: PrismaClient,
  userId: string | undefined,
  input: ProcessPaymentInput,
) {
  requireAuth(userId);
  const order = await prisma.order.findUnique({ where: { id: input.orderId } });
  if (!order) throw new Error("Order not found");
  requireOwner(order.userId, userId);

  const existing = await prisma.payment.findUnique({
    where: { orderId: input.orderId },
  });
  if (existing) throw new Error("Payment already exists");

  const transactionId = `TXN-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
  const payment = await prisma.payment.create({
    data: {
      orderId: input.orderId,
      amount: order.totalAmount,
      method: input.method,
      status: "COMPLETED",
      transactionId,
    },
  });

  await triggerNovuWorkflow(userId!, "payment-processed", {
    orderId: input.orderId,
    paymentId: payment.id,
    amount: order.totalAmount,
  });

  return payment;
}

export async function createRefund(
  prisma: PrismaClient,
  userId: string | undefined,
  input: CreateRefundInput,
) {
  requireAuth(userId);
  const order = await prisma.order.findUnique({ where: { id: input.orderId } });
  if (!order) throw new Error("Order not found");
  requireOwner(order.userId, userId);
  return prisma.refund.create({
    data: {
      paymentId: input.paymentId,
      orderId: input.orderId,
      amount: input.amount,
      reason: input.reason ?? null,
    },
  });
}

export async function updateRefundStatus(
  prisma: PrismaClient,
  userId: string | undefined,
  id: string,
  status: string,
) {
  requireAuth(userId);
  const refund = await prisma.refund.findUnique({
    where: { id },
    include: { payment: true, order: true },
  });
  if (!refund) throw new Error("Refund not found");
  requireOwner(refund.order.userId, userId);

  const updated = await prisma.refund.update({
    where: { id },
    data: { status },
  });

  if (status === "COMPLETED") {
    const completedRefunds = await prisma.refund.findMany({
      where: { paymentId: refund.paymentId, status: "COMPLETED" },
    });
    const totalRefunded = completedRefunds.reduce((s, r) => s + r.amount, 0);
    if (totalRefunded >= refund.payment.amount) {
      await prisma.payment.update({
        where: { id: refund.paymentId },
        data: { status: "REFUNDED" },
      });
    }

    await triggerNovuWorkflow(userId!, "refund-processed", {
      refundId: id,
      orderId: refund.orderId,
      amount: updated.amount,
    });
  }

  return updated;
}

export function getProducts(
  prisma: PrismaClient,
  args: {
    categorySlug?: string;
    search?: string;
    minPrice?: number;
    maxPrice?: number;
    limit?: number;
    offset?: number;
  },
) {
  const where: Record<string, unknown> = {};
  if (args.categorySlug) where.category = { slug: args.categorySlug };
  if (args.search) {
    where.OR = [
      { name: { contains: args.search, mode: "insensitive" as const } },
      { description: { contains: args.search, mode: "insensitive" as const } },
    ];
  }
  if (args.minPrice !== undefined || args.maxPrice !== undefined) {
    where.price = {};
    if (args.minPrice !== undefined)
      (where.price as Record<string, unknown>).gte = args.minPrice;
    if (args.maxPrice !== undefined)
      (where.price as Record<string, unknown>).lte = args.maxPrice;
  }
  return prisma.product.findMany({
    where,
    take: args.limit ?? 20,
    skip: args.offset ?? 0,
    orderBy: { createdAt: "desc" },
  });
}

export function getProduct(prisma: PrismaClient, id: string) {
  return prisma.product.findUnique({ where: { id } });
}

export function getProductBySku(prisma: PrismaClient, sku: string) {
  return prisma.product.findUnique({ where: { sku } });
}

export async function getMyOrders(
  prisma: PrismaClient,
  userId: string | undefined,
  args: { status?: string; limit?: number; offset?: number },
) {
  requireAuth(userId);
  const where: Record<string, unknown> = { userId: userId! };
  if (args.status) where.status = args.status;
  return prisma.order.findMany({
    where,
    take: args.limit ?? 20,
    skip: args.offset ?? 0,
    orderBy: { createdAt: "desc" },
  });
}

export async function getOrder(
  prisma: PrismaClient,
  userId: string | undefined,
  id: string,
) {
  requireAuth(userId);
  return prisma.order.findFirst({ where: { id, userId: userId! } });
}

export async function getMyPayments(
  prisma: PrismaClient,
  userId: string | undefined,
  args: { status?: string; limit?: number; offset?: number },
) {
  requireAuth(userId);
  const where: Record<string, unknown> = { order: { userId: userId! } };
  if (args.status) where.status = args.status;
  return prisma.payment.findMany({
    where,
    take: args.limit ?? 20,
    skip: args.offset ?? 0,
    orderBy: { createdAt: "desc" },
  });
}

export async function getPayment(
  prisma: PrismaClient,
  userId: string | undefined,
  id: string,
) {
  requireAuth(userId);
  return prisma.payment.findFirst({
    where: { id, order: { userId: userId! } },
  });
}

export async function getMyRefunds(
  prisma: PrismaClient,
  userId: string | undefined,
  args: { status?: string; limit?: number; offset?: number },
) {
  requireAuth(userId);
  const where: Record<string, unknown> = { order: { userId: userId! } };
  if (args.status) where.status = args.status;
  return prisma.refund.findMany({
    where,
    take: args.limit ?? 20,
    skip: args.offset ?? 0,
    orderBy: { createdAt: "desc" },
  });
}

export async function getRefund(
  prisma: PrismaClient,
  userId: string | undefined,
  id: string,
) {
  requireAuth(userId);
  return prisma.refund.findFirst({ where: { id, order: { userId: userId! } } });
}
