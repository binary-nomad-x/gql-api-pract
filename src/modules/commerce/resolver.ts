import type { Context } from "@gql-prisma-api/types/context.js";
import type { Parent, IdArg, ProductFilterArgs, PaginationArgs } from "@gql-prisma-api/types/graphql.js";
import type {
  CreateProductInput, UpdateProductInput, PlaceOrderInput,
  ProcessPaymentInput, CreateRefundInput,
} from "@gql-prisma-api/types/inputs.js";
import {
  createProduct, updateProduct, deleteProduct,
  placeOrder, cancelOrder, updateOrderStatus,
  processPayment, createRefund, updateRefundStatus,
  getProducts, getProduct, getProductBySku,
  getMyOrders, getOrder,
  getMyPayments, getPayment,
  getMyRefunds, getRefund,
} from "./service.js";

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
  products: async (_parent: unknown, args: ProductFilterArgs, ctx: Context) =>
    getProducts(ctx.prisma, args),

  product: (_parent: unknown, { id }: IdArg, ctx: Context) =>
    getProduct(ctx.prisma, id),

  productBySku: (_parent: unknown, { sku }: { sku: string }, ctx: Context) =>
    getProductBySku(ctx.prisma, sku),
};

export const CommerceMutations = {
  createProduct: async (_parent: unknown, { input }: { input: CreateProductInput }, ctx: Context) =>
    createProduct(ctx.prisma, ctx.userId, input),

  updateProduct: async (_parent: unknown, { id, input }: { id: string; input: UpdateProductInput }, ctx: Context) =>
    updateProduct(ctx.prisma, ctx.userId, id, input),

  deleteProduct: async (_parent: unknown, { id }: IdArg, ctx: Context) =>
    deleteProduct(ctx.prisma, ctx.userId, id),

  placeOrder: async (_parent: unknown, { input }: { input: PlaceOrderInput }, ctx: Context) =>
    placeOrder(ctx.prisma, ctx.userId, input),

  cancelOrder: async (_parent: unknown, { id }: IdArg, ctx: Context) =>
    cancelOrder(ctx.prisma, ctx.userId, id),

  updateOrderStatus: async (_parent: unknown, { id, status }: { id: string; status: string }, ctx: Context) =>
    updateOrderStatus(ctx.prisma, ctx.userId, id, status),

  processPayment: async (_parent: unknown, { input }: { input: ProcessPaymentInput }, ctx: Context) =>
    processPayment(ctx.prisma, ctx.userId, input),

  createRefund: async (_parent: unknown, { input }: { input: CreateRefundInput }, ctx: Context) =>
    createRefund(ctx.prisma, ctx.userId, input),

  updateRefundStatus: async (_parent: unknown, { id, status }: { id: string; status: string }, ctx: Context) =>
    updateRefundStatus(ctx.prisma, ctx.userId, id, status),
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
  myOrders: async (_parent: unknown, args: { status?: string } & PaginationArgs, ctx: Context) =>
    getMyOrders(ctx.prisma, ctx.userId, args),

  order: async (_parent: unknown, { id }: IdArg, ctx: Context) =>
    getOrder(ctx.prisma, ctx.userId, id),

  myPayments: async (_parent: unknown, args: { status?: string } & PaginationArgs, ctx: Context) =>
    getMyPayments(ctx.prisma, ctx.userId, args),

  payment: async (_parent: unknown, { id }: IdArg, ctx: Context) =>
    getPayment(ctx.prisma, ctx.userId, id),

  myRefunds: async (_parent: unknown, args: { status?: string } & PaginationArgs, ctx: Context) =>
    getMyRefunds(ctx.prisma, ctx.userId, args),

  refund: async (_parent: unknown, { id }: IdArg, ctx: Context) =>
    getRefund(ctx.prisma, ctx.userId, id),
};
