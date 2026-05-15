import type { Context } from "@graphql-prisma-api/types/context.js";
import type { Parent, IdArg, ProductFilterArgs, PaginationArgs } from "@graphql-prisma-api/types/graphql.js";
import type {
  CreateProductInput, UpdateProductInput, PlaceOrderInput,
  ProcessPaymentInput, CreateRefundInput,
} from "@graphql-prisma-api/types/inputs.js";
import { requireAuth, requireOwner } from "@graphql-prisma-api/utils/errors.js";
import { clean } from "@graphql-prisma-api/utils/clean.js";

export const ProductResolver = {
  seller: (parent: Parent, _args: unknown, ctx: Context) =>
    ctx.prisma.user.findUnique({ where: { id: parent.sellerId as string } }),
  category: (parent: Parent, _args: unknown, ctx: Context) =>
    parent.categoryId ? ctx.prisma.category.findUnique({ where: { id: parent.categoryId as string } }) : null,
  orderItems: (parent: Parent, _args: unknown, ctx: Context) =>
    ctx.prisma.orderItem.findMany({ where: { productId: parent.id } }),
  reviews: (parent: Parent, _args: unknown, ctx: Context) =>
    ctx.prisma.review.findMany({ where: { productId: parent.id } }),
  images: (parent: Parent, _args: unknown, ctx: Context) =>
    ctx.prisma.productImage.findMany({ where: { productId: parent.id }, orderBy: { sortOrder: "asc" } }),
  wishlistItems: (parent: Parent, _args: unknown, ctx: Context) =>
    ctx.prisma.wishlistItem.findMany({ where: { productId: parent.id } }),
  reviewCount: (parent: Parent, _args: unknown, ctx: Context) =>
    ctx.prisma.review.count({ where: { productId: parent.id } }),
  averageRating: async (parent: Parent, _args: unknown, ctx: Context) => {
    const agg = await ctx.prisma.review.aggregate({
      where: { productId: parent.id },
      _avg: { rating: true },
    });
    return agg._avg.rating;
  },
};

export const CommerceQueries = {
  products: async (_parent: unknown, args: ProductFilterArgs, ctx: Context) => {
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
      if (args.minPrice !== undefined) (where.price as Record<string, unknown>).gte = args.minPrice;
      if (args.maxPrice !== undefined) (where.price as Record<string, unknown>).lte = args.maxPrice;
    }
    return ctx.prisma.product.findMany({
      where,
      take: args.limit ?? 20,
      skip: args.offset ?? 0,
      orderBy: { createdAt: "desc" },
    });
  },

  product: (_parent: unknown, { id }: IdArg, ctx: Context) =>
    ctx.prisma.product.findUnique({ where: { id } }),

  productBySku: (_parent: unknown, { sku }: { sku: string }, ctx: Context) =>
    ctx.prisma.product.findUnique({ where: { sku } }),
};

export const CommerceMutations = {
  createProduct: async (_parent: unknown, { input }: { input: CreateProductInput }, ctx: Context) => {
    requireAuth(ctx.userId);
    const { categorySlug, ...data } = input;
    return ctx.prisma.product.create({
      data: clean({
        ...data,
        stock: input.stock ?? 0,
        sellerId: ctx.userId!,
        category: categorySlug ? { connect: { slug: categorySlug } } : undefined,
      }) as any,
    });
  },

  updateProduct: async (_parent: unknown, { id, input }: { id: string; input: UpdateProductInput }, ctx: Context) => {
    const product = await ctx.prisma.product.findUnique({ where: { id } });
    if (!product) throw new Error("Product not found");
    requireOwner(product.sellerId, ctx.userId);
    const { categorySlug, ...data } = input;
    return ctx.prisma.product.update({
      where: { id },
      data: clean({
        ...data,
        ...(categorySlug !== undefined
          ? { category: categorySlug ? { connect: { slug: categorySlug } } : { disconnect: true } }
          : {}),
      }) as any,
    });
  },

  deleteProduct: async (_parent: unknown, { id }: IdArg, ctx: Context) => {
    const product = await ctx.prisma.product.findUnique({ where: { id } });
    if (!product) throw new Error("Product not found");
    requireOwner(product.sellerId, ctx.userId);
    await ctx.prisma.product.delete({ where: { id } });
    return true;
  },

  placeOrder: async (_parent: unknown, { input }: { input: PlaceOrderInput }, ctx: Context) => {
    requireAuth(ctx.userId);

    const products = await ctx.prisma.product.findMany({
      where: { id: { in: input.items.map((i) => i.productId) } },
    });
    const productMap = new Map(products.map((p) => [p.id, p]));

    let totalAmount = 0;
    for (const item of input.items) {
      const p = productMap.get(item.productId);
      if (!p) throw new Error(`Product ${item.productId} not found`);
      if (!p.isActive) throw new Error(`${p.name} is inactive`);
      if (p.stock < item.quantity) throw new Error(`Insufficient stock for ${p.name}`);
      totalAmount += p.price * item.quantity;
    }

    let discountAmount = 0;
    if (input.couponCode) {
      const coupon = await ctx.prisma.coupon.findUnique({ where: { code: input.couponCode } });
      if (coupon?.isActive && coupon.usedCount < coupon.maxUses && totalAmount >= coupon.minPurchase) {
        discountAmount = coupon.discountAmount > 0
          ? coupon.discountAmount
          : totalAmount * (coupon.discountPercent / 100);
      }
    }

    return ctx.prisma.$transaction(async (tx: any) => {
      const order = await tx.order.create({
        data: {
          userId: ctx.userId!,
          totalAmount,
          discountAmount,
          shippingAddress: input.shippingAddress ?? null,
          ...(input.couponCode ? { coupon: { connect: { code: input.couponCode } } } : {}),
          items: {
            create: input.items.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
              unitPrice: productMap.get(item.productId)!.price,
            })),
          },
        },
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

      return order;
    });
  },

  cancelOrder: async (_parent: unknown, { id }: IdArg, ctx: Context) => {
    requireAuth(ctx.userId);
    const order = await ctx.prisma.order.findUnique({ where: { id }, include: { items: true } });
    if (!order) throw new Error("Order not found");
    requireOwner(order.userId, ctx.userId);
    if (["DELIVERED", "SHIPPED"].includes(order.status)) {
      throw new Error("Cannot cancel shipped or delivered order");
    }

    return ctx.prisma.$transaction(async (tx: any) => {
      const updated = await tx.order.update({ where: { id }, data: { status: "CANCELLED" } });
      for (const item of order.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { increment: item.quantity } },
        });
      }
      return updated;
    });
  },

  updateOrderStatus: async (_parent: unknown, { id, status }: { id: string; status: string }, ctx: Context) => {
    requireAuth(ctx.userId);
    const order = await ctx.prisma.order.findUnique({ where: { id } });
    if (!order) throw new Error("Order not found");
    requireOwner(order.userId, ctx.userId);
    return ctx.prisma.order.update({ where: { id }, data: { status } as any });
  },

  processPayment: async (_parent: unknown, { input }: { input: ProcessPaymentInput }, ctx: Context) => {
    requireAuth(ctx.userId);
    const order = await ctx.prisma.order.findUnique({ where: { id: input.orderId } });
    if (!order) throw new Error("Order not found");
    requireOwner(order.userId, ctx.userId);

    const existing = await ctx.prisma.payment.findUnique({ where: { orderId: input.orderId } });
    if (existing) throw new Error("Payment already exists");

    const transactionId = `TXN-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
    return ctx.prisma.payment.create({
      data: { orderId: input.orderId, amount: order.totalAmount, method: input.method as any, status: "COMPLETED" as any, transactionId },
    });
  },

  createRefund: async (_parent: unknown, { input }: { input: CreateRefundInput }, ctx: Context) => {
    requireAuth(ctx.userId);
    const order = await ctx.prisma.order.findUnique({ where: { id: input.orderId } });
    if (!order) throw new Error("Order not found");
    requireOwner(order.userId, ctx.userId);
    return ctx.prisma.refund.create({ data: { paymentId: input.paymentId, orderId: input.orderId, amount: input.amount, reason: input.reason ?? null } });
  },

  updateRefundStatus: async (_parent: unknown, { id, status }: { id: string; status: string }, ctx: Context) => {
    requireAuth(ctx.userId);
    const refund = await ctx.prisma.refund.findUnique({
      where: { id },
      include: { payment: true, order: true },
    });
    if (!refund) throw new Error("Refund not found");
    requireOwner(refund.order.userId, ctx.userId);

    const updated = await ctx.prisma.refund.update({ where: { id }, data: { status } as any });

    if (status === "COMPLETED") {
      const completedRefunds = await ctx.prisma.refund.findMany({
        where: { paymentId: refund.paymentId, status: "COMPLETED" },
      });
      const totalRefunded = completedRefunds.reduce((s, r) => s + r.amount, 0);
      if (totalRefunded >= refund.payment.amount) {
        await ctx.prisma.payment.update({ where: { id: refund.paymentId }, data: { status: "REFUNDED" } });
      }
    }
    return updated;
  },
};

export const PaymentResolver = {
  order: (parent: Parent, _args: unknown, ctx: Context) =>
    ctx.prisma.order.findUnique({ where: { id: parent.orderId as string } }),
  refunds: (parent: Parent, _args: unknown, ctx: Context) =>
    ctx.prisma.refund.findMany({ where: { paymentId: parent.id } }),
};

export const RefundResolver = {
  payment: (parent: Parent, _args: unknown, ctx: Context) =>
    ctx.prisma.payment.findUnique({ where: { id: parent.paymentId as string } }),
  order: (parent: Parent, _args: unknown, ctx: Context) =>
    ctx.prisma.order.findUnique({ where: { id: parent.orderId as string } }),
};

export const OrderResolver = {
  user: (parent: Parent, _args: unknown, ctx: Context) =>
    ctx.prisma.user.findUnique({ where: { id: parent.userId as string } }),
  items: (parent: Parent, _args: unknown, ctx: Context) =>
    ctx.prisma.orderItem.findMany({ where: { orderId: parent.id } }),
  payment: (parent: Parent, _args: unknown, ctx: Context) =>
    ctx.prisma.payment.findUnique({ where: { orderId: parent.id } }),
  refunds: (parent: Parent, _args: unknown, ctx: Context) =>
    ctx.prisma.refund.findMany({ where: { orderId: parent.id } }),
  shipments: (parent: Parent, _args: unknown, ctx: Context) =>
    ctx.prisma.shipment.findMany({ where: { orderId: parent.id } }),
  coupon: (parent: Parent, _args: unknown, ctx: Context) =>
    parent.couponId ? ctx.prisma.coupon.findUnique({ where: { id: parent.couponId as string } }) : null,
  itemCount: (parent: Parent, _args: unknown, ctx: Context) =>
    ctx.prisma.orderItem.count({ where: { orderId: parent.id } }),
};

export const OrderItemResolver = {
  order: (parent: Parent, _args: unknown, ctx: Context) =>
    ctx.prisma.order.findUnique({ where: { id: parent.orderId as string } }),
  product: (parent: Parent, _args: unknown, ctx: Context) =>
    ctx.prisma.product.findUnique({ where: { id: parent.productId as string } }),
};

export const CommerceQueriesExtra = {
  myOrders: async (_parent: unknown, args: { status?: string } & PaginationArgs, ctx: Context) => {
    requireAuth(ctx.userId);
    const where: Record<string, unknown> = { userId: ctx.userId! };
    return ctx.prisma.order.findMany({ where, take: args.limit ?? 20, skip: args.offset ?? 0, orderBy: { createdAt: "desc" } });
  },

  order: async (_parent: unknown, { id }: IdArg, ctx: Context) => {
    requireAuth(ctx.userId);
    return ctx.prisma.order.findFirst({ where: { id, userId: ctx.userId! } });
  },

  myPayments: async (_parent: unknown, args: { status?: string } & PaginationArgs, ctx: Context) => {
    requireAuth(ctx.userId);
    const where: Record<string, unknown> = { order: { userId: ctx.userId! } };
    if (args.status) where.status = args.status;
    return ctx.prisma.payment.findMany({ where, take: args.limit ?? 20, skip: args.offset ?? 0, orderBy: { createdAt: "desc" } });
  },

  payment: async (_parent: unknown, { id }: IdArg, ctx: Context) => {
    requireAuth(ctx.userId);
    return ctx.prisma.payment.findFirst({ where: { id, order: { userId: ctx.userId! } } });
  },

  myRefunds: async (_parent: unknown, args: { status?: string } & PaginationArgs, ctx: Context) => {
    requireAuth(ctx.userId);
    const where: Record<string, unknown> = { order: { userId: ctx.userId! } };
    if (args.status) where.status = args.status;
    return ctx.prisma.refund.findMany({ where, take: args.limit ?? 20, skip: args.offset ?? 0, orderBy: { createdAt: "desc" } });
  },

  refund: async (_parent: unknown, { id }: IdArg, ctx: Context) => {
    requireAuth(ctx.userId);
    return ctx.prisma.refund.findFirst({ where: { id, order: { userId: ctx.userId! } } });
  },
};
