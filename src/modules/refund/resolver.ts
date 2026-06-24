import type { Context } from "@gql-prisma-api/types/context.js";
import type { Refund as RefundModel } from "@prisma/client";
import type { CreateRefundInput, RefundFilterInput } from "./inputs.js";
import {
  resolveRefundPayment,
  resolveRefundOrder,
  createRefund,
  updateRefundStatus,
  getMyRefunds,
  getRefund,
} from "./service.js";

export const Refund = {
  payment: (parent: RefundModel, _args: unknown, ctx: Context) =>
    resolveRefundPayment(ctx.prisma, parent.paymentId),
  order: (parent: RefundModel, _args: unknown, ctx: Context) =>
    resolveRefundOrder(ctx.prisma, parent.orderId),
};

export const Query = {
  myRefunds: async (
    _parent: unknown,
    args: RefundFilterInput,
    ctx: Context,
  ) => getMyRefunds(ctx.prisma, ctx.userId, args),

  refund: async (_parent: unknown, { id }: { id: string }, ctx: Context) =>
    getRefund(ctx.prisma, ctx.userId, id),
};

export const Mutation = {
  createRefund: async (
    _parent: unknown,
    { input }: { input: CreateRefundInput },
    ctx: Context,
  ) => createRefund(ctx.prisma, ctx.userId, input),

  updateRefundStatus: async (
    _parent: unknown,
    { id, status }: { id: string; status: string },
    ctx: Context,
  ) => updateRefundStatus(ctx.prisma, ctx.userId, id, status),
};
