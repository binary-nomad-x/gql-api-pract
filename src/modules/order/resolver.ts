import type { Context } from "@gql-prisma-api/types/context.js";
import type { Order as OrderModel, OrderItem as OrderItemModel } from "@prisma/client";
import type { PlaceOrderInput, OrderFilterInput } from "./inputs.js";
import {
  resolveOrderUser,
  resolveOrderItems,
  resolveOrderPayment,
  resolveOrderRefunds,
  resolveOrderShipments,
  resolveOrderCoupon,
  resolveOrderItemCount,
  resolveOrderItemOrder,
  resolveOrderItemProduct,
  placeOrder,
  cancelOrder,
  updateOrderStatus,
  getMyOrders,
  getOrder,
} from "./service.js";

export const Order = {
  user: (parent: OrderModel, _args: unknown, ctx: Context) =>
    resolveOrderUser(ctx.prisma, parent.userId),
  items: (parent: OrderModel, _args: unknown, ctx: Context) =>
    resolveOrderItems(ctx.prisma, parent.id),
  payment: (parent: OrderModel, _args: unknown, ctx: Context) =>
    resolveOrderPayment(ctx.prisma, parent.id),
  refunds: (parent: OrderModel, _args: unknown, ctx: Context) =>
    resolveOrderRefunds(ctx.prisma, parent.id),
  shipments: (parent: OrderModel, _args: unknown, ctx: Context) =>
    resolveOrderShipments(ctx.prisma, parent.id),
  coupon: (parent: OrderModel, _args: unknown, ctx: Context) =>
    resolveOrderCoupon(ctx.prisma, parent.couponId),
  itemCount: (parent: OrderModel, _args: unknown, ctx: Context) =>
    resolveOrderItemCount(ctx.prisma, parent.id),
};

export const OrderItem = {
  order: (parent: OrderItemModel, _args: unknown, ctx: Context) =>
    resolveOrderItemOrder(ctx.prisma, parent.orderId),
  product: (parent: OrderItemModel, _args: unknown, ctx: Context) =>
    resolveOrderItemProduct(ctx.prisma, parent.productId),
};

export const Query = {
  myOrders: async (
    _parent: unknown,
    args: OrderFilterInput,
    ctx: Context,
  ) => getMyOrders(ctx.prisma, ctx.userId, args),

  order: async (_parent: unknown, { id }: { id: string }, ctx: Context) =>
    getOrder(ctx.prisma, ctx.userId, id),

  orderShipments: (_parent: unknown, { orderId }: { orderId: string }, ctx: Context) =>
    ctx.prisma.shipment.findMany({ where: { orderId } }),
};

export const Mutation = {
  placeOrder: async (
    _parent: unknown,
    { input }: { input: PlaceOrderInput },
    ctx: Context,
  ) => placeOrder(ctx.prisma, ctx.userId, input),

  cancelOrder: async (_parent: unknown, { id }: { id: string }, ctx: Context) =>
    cancelOrder(ctx.prisma, ctx.userId, id),

  updateOrderStatus: async (
    _parent: unknown,
    { id, status }: { id: string; status: string },
    ctx: Context,
  ) => updateOrderStatus(ctx.prisma, ctx.userId, id, status),
};
