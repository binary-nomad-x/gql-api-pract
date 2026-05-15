import type { Context } from "../../types/context.js";
import { requireAuth, requireOwner } from "../../utils/errors.js";

export const ProductResolver = {
  seller: (parent: any, _args: unknown, ctx: Context) =>
    ctx.prisma.user.findUnique({ where: { id: parent.sellerId } }),
  category: (parent: any, _args: unknown, ctx: Context) =>
    parent.categoryId ? ctx.prisma.category.findUnique({ where: { id: parent.categoryId } }) : null,
  orderItems: (parent: any, _args: unknown, ctx: Context) =>
    ctx.prisma.orderItem.findMany({ where: { productId: parent.id } }),
  reviews: (parent: any, _args: unknown, ctx: Context) =>
    ctx.prisma.review.findMany({ where: { productId: parent.id } }),
  images: (parent: any, _args: unknown, ctx: Context) =>
    ctx.prisma.productImage.findMany({ where: { productId: parent.id }, orderBy: { sortOrder: "asc" } }),
  wishlistItems: (parent: any, _args: unknown, ctx: Context) =>
    ctx.prisma.wishlistItem.findMany({ where: { productId: parent.id } }),
  reviewCount: (parent: any, _args: unknown, ctx: Context) =>
    ctx.prisma.review.count({ where: { productId: parent.id } }),
  averageRating: async (parent: any, _args: unknown, ctx: Context) => {
    const agg = await ctx.prisma.review.aggregate({ where: { productId: parent.id }, _avg: { rating: true } });
    return agg._avg.rating;
  },
};

export const CommerceQueries = {
  products: async (_parent: unknown, { categorySlug, search, minPrice, maxPrice, limit = 20, offset = 0 }: any, ctx: Context) => {
    const where: any = {};
    if (categorySlug) where.category = { slug: categorySlug };
    if (search) where.OR = [{ name: { contains: search, mode: "insensitive" } }, { description: { contains: search, mode: "insensitive" } }];
    if (minPrice !== undefined || maxPrice !== undefined) {
      where.price = {};
      if (minPrice !== undefined) where.price.gte = minPrice;
      if (maxPrice !== undefined) where.price.lte = maxPrice;
    }
    return ctx.prisma.product.findMany({ where, take: limit, skip: offset, orderBy: { createdAt: "desc" } });
  },

  product: (_parent: unknown, { id }: { id: string }, ctx: Context) =>
    ctx.prisma.product.findUnique({ where: { id } }),

  productBySku: (_parent: unknown, { sku }: { sku: string }, ctx: Context) =>
    ctx.prisma.product.findUnique({ where: { sku } }),
};

export const CommerceMutations = {
  createProduct: async (_parent: unknown, { input }: any, ctx: Context) => {
    requireAuth(ctx.userId);
    const { categorySlug, ...data } = input;
    return ctx.prisma.product.create({
      data: { ...data, sellerId: ctx.userId!, ...(categorySlug ? { category: { connect: { slug: categorySlug } } } : {}) },
    });
  },

  updateProduct: async (_parent: unknown, { id, input }: any, ctx: Context) => {
    const product = await ctx.prisma.product.findUnique({ where: { id } });
    if (!product) throw new Error("Product not found");
    requireOwner(product.sellerId, ctx.userId);
    const { categorySlug, ...data } = input;
    return ctx.prisma.product.update({
      where: { id },
      data: { ...data, ...(categorySlug !== undefined ? { category: categorySlug ? { connect: { slug: categorySlug } } : { disconnect: true } } : {}) },
    });
  },

  deleteProduct: async (_parent: unknown, { id }: any, ctx: Context) => {
    const product = await ctx.prisma.product.findUnique({ where: { id } });
    if (!product) throw new Error("Product not found");
    requireOwner(product.sellerId, ctx.userId);
    await ctx.prisma.product.delete({ where: { id } });
    return true;
  },

  placeOrder: async (_parent: unknown, { input }: any, ctx: Context) => {
    requireAuth(ctx.userId);
    const { items, shippingAddress, couponCode } = input;

    const products = await ctx.prisma.product.findMany({ where: { id: { in: items.map((i: any) => i.productId) } } });
    const productMap = new Map(products.map((p: any) => [p.id, p]));

    let totalAmount = 0;
    for (const item of items) {
      const p = productMap.get(item.productId);
      if (!p) throw new Error(`Product ${item.productId} not found`);
      if (!p.isActive) throw new Error(`${p.name} is inactive`);
      if (p.stock < item.quantity) throw new Error(`Insufficient stock for ${p.name}`);
      totalAmount += p.price * item.quantity;
    }

    let discountAmount = 0;
    if (couponCode) {
      const coupon = await ctx.prisma.coupon.findUnique({ where: { code: couponCode } });
      if (coupon && coupon.isActive && coupon.usedCount < coupon.maxUses) {
        if (totalAmount >= coupon.minPurchase) {
          discountAmount = coupon.discountAmount > 0 ? coupon.discountAmount : totalAmount * (coupon.discountPercent / 100);
        }
      }
    }

    return ctx.prisma.$transaction(async (tx: any) => {
      const order = await tx.order.create({
        data: {
          userId: ctx.userId!,
          totalAmount,
          discountAmount,
          shippingAddress,
          ...(couponCode ? { coupon: { connect: { code: couponCode } } } : {}),
          items: { create: items.map((i: any) => ({ productId: i.productId, quantity: i.quantity, unitPrice: productMap.get(i.productId).price })) },
        },
        include: { items: { include: { product: true } } },
      });

      for (const item of items) {
        await tx.product.update({ where: { id: item.productId }, data: { stock: { decrement: item.quantity } } });
      }

      if (couponCode) {
        await tx.coupon.update({ where: { code: couponCode }, data: { usedCount: { increment: 1 } } });
      }

      return order;
    });
  },

  cancelOrder: async (_parent: unknown, { id }: any, ctx: Context) => {
    requireAuth(ctx.userId);
    const order = await ctx.prisma.order.findUnique({ where: { id }, include: { items: true } });
    if (!order) throw new Error("Order not found");
    requireOwner(order.userId, ctx.userId);
    if (["DELIVERED", "SHIPPED"].includes(order.status)) throw new Error("Cannot cancel shipped/delivered order");

    return ctx.prisma.$transaction(async (tx: any) => {
      const updated = await tx.order.update({ where: { id }, data: { status: "CANCELLED" } });
      for (const item of order.items) {
        await tx.product.update({ where: { id: item.productId }, data: { stock: { increment: item.quantity } } });
      }
      return updated;
    });
  },

  updateOrderStatus: async (_parent: unknown, { id, status }: any, ctx: Context) => {
    requireAuth(ctx.userId);
    const order = await ctx.prisma.order.findUnique({ where: { id } });
    if (!order) throw new Error("Order not found");
    requireOwner(order.userId, ctx.userId);
    return ctx.prisma.order.update({ where: { id }, data: { status } });
  },

  processPayment: async (_parent: unknown, { input }: any, ctx: Context) => {
    requireAuth(ctx.userId);
    const { orderId, method } = input;
    const order = await ctx.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new Error("Order not found");
    requireOwner(order.userId, ctx.userId);

    const existing = await ctx.prisma.payment.findUnique({ where: { orderId } });
    if (existing) throw new Error("Payment already exists");

    const transactionId = `TXN-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
    return ctx.prisma.payment.create({
      data: { orderId, amount: order.totalAmount, method, status: "COMPLETED", transactionId },
    });
  },

  createRefund: async (_parent: unknown, { input }: any, ctx: Context) => {
    requireAuth(ctx.userId);
    const { paymentId, orderId, amount, reason } = input;
    const order = await ctx.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new Error("Order not found");
    requireOwner(order.userId, ctx.userId);
    return ctx.prisma.refund.create({ data: { paymentId, orderId, amount, reason } });
  },

  updateRefundStatus: async (_parent: unknown, { id, status }: any, ctx: Context) => {
    requireAuth(ctx.userId);
    const refund = await ctx.prisma.refund.findUnique({
      where: { id },
      include: { payment: true, order: true },
    });
    if (!refund) throw new Error("Refund not found");
    requireOwner(refund.order.userId, ctx.userId);

    const updated = await ctx.prisma.refund.update({ where: { id }, data: { status } });

    if (status === "COMPLETED") {
      const completedRefunds = await ctx.prisma.refund.findMany({ where: { paymentId: refund.paymentId, status: "COMPLETED" } });
      const totalRefunded = completedRefunds.reduce((s: number, r: any) => s + r.amount, 0);
      if (totalRefunded >= refund.payment.amount) {
        await ctx.prisma.payment.update({ where: { id: refund.paymentId }, data: { status: "REFUNDED" } });
      }
    }
    return updated;
  },
};

export const PaymentResolver = {
  order: (parent: any, _args: unknown, ctx: Context) =>
    ctx.prisma.order.findUnique({ where: { id: parent.orderId } }),
  refunds: (parent: any, _args: unknown, ctx: Context) =>
    ctx.prisma.refund.findMany({ where: { paymentId: parent.id } }),
};

export const RefundResolver = {
  payment: (parent: any, _args: unknown, ctx: Context) =>
    ctx.prisma.payment.findUnique({ where: { id: parent.paymentId } }),
  order: (parent: any, _args: unknown, ctx: Context) =>
    ctx.prisma.order.findUnique({ where: { id: parent.orderId } }),
};

export const OrderResolver = {
  user: (parent: any, _args: unknown, ctx: Context) =>
    ctx.prisma.user.findUnique({ where: { id: parent.userId } }),
  items: (parent: any, _args: unknown, ctx: Context) =>
    ctx.prisma.orderItem.findMany({ where: { orderId: parent.id } }),
  payment: (parent: any, _args: unknown, ctx: Context) =>
    ctx.prisma.payment.findUnique({ where: { orderId: parent.id } }),
  refunds: (parent: any, _args: unknown, ctx: Context) =>
    ctx.prisma.refund.findMany({ where: { orderId: parent.id } }),
  shipments: (parent: any, _args: unknown, ctx: Context) =>
    ctx.prisma.shipment.findMany({ where: { orderId: parent.id } }),
  coupon: (parent: any, _args: unknown, ctx: Context) =>
    parent.couponId ? ctx.prisma.coupon.findUnique({ where: { id: parent.couponId } }) : null,
  itemCount: (parent: any, _args: unknown, ctx: Context) =>
    ctx.prisma.orderItem.count({ where: { orderId: parent.id } }),
};

export const OrderItemResolver = {
  order: (parent: any, _args: unknown, ctx: Context) =>
    ctx.prisma.order.findUnique({ where: { id: parent.orderId } }),
  product: (parent: any, _args: unknown, ctx: Context) =>
    ctx.prisma.product.findUnique({ where: { id: parent.productId } }),
};

export const CommerceQueriesExtra = {
  myOrders: async (_parent: unknown, { status, limit = 20, offset = 0 }: any, ctx: Context) => {
    requireAuth(ctx.userId);
    const where: any = { userId: ctx.userId! };
    if (status) where.status = status;
    return ctx.prisma.order.findMany({ where, take: limit, skip: offset, orderBy: { createdAt: "desc" } });
  },

  order: async (_parent: unknown, { id }: { id: string }, ctx: Context) => {
    requireAuth(ctx.userId);
    return ctx.prisma.order.findFirst({ where: { id, userId: ctx.userId! } });
  },

  myPayments: async (_parent: unknown, { status, limit = 20, offset = 0 }: any, ctx: Context) => {
    requireAuth(ctx.userId);
    const where: any = { order: { userId: ctx.userId! } };
    if (status) where.status = status;
    return ctx.prisma.payment.findMany({ where, take: limit, skip: offset, orderBy: { createdAt: "desc" } });
  },

  payment: async (_parent: unknown, { id }: { id: string }, ctx: Context) => {
    requireAuth(ctx.userId);
    return ctx.prisma.payment.findFirst({ where: { id, order: { userId: ctx.userId! } } });
  },

  myRefunds: async (_parent: unknown, { status, limit = 20, offset = 0 }: any, ctx: Context) => {
    requireAuth(ctx.userId);
    const where: any = { order: { userId: ctx.userId! } };
    if (status) where.status = status;
    return ctx.prisma.refund.findMany({ where, take: limit, skip: offset, orderBy: { createdAt: "desc" } });
  },

  refund: async (_parent: unknown, { id }: { id: string }, ctx: Context) => {
    requireAuth(ctx.userId);
    return ctx.prisma.refund.findFirst({ where: { id, order: { userId: ctx.userId! } } });
  },
};
