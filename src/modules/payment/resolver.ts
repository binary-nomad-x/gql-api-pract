import type { Context } from "@gql-prisma-api/types/context.js";
import type { Payment as PaymentModel } from "@prisma/client";
import type { ProcessPaymentInput, PaymentFilterInput } from "./inputs.js";
import {
  resolvePaymentOrder,
  resolvePaymentRefunds,
  processPayment,
  getMyPayments,
  getPayment,
} from "./service.js";

export const Payment = {
  order: (parent: PaymentModel, _args: unknown, ctx: Context) =>
    resolvePaymentOrder(ctx.prisma, parent.orderId),
  refunds: (parent: PaymentModel, _args: unknown, ctx: Context) =>
    resolvePaymentRefunds(ctx.prisma, parent.id),
};

export const Query = {
  myPayments: async (
    _parent: unknown,
    args: PaymentFilterInput,
    ctx: Context,
  ) => getMyPayments(ctx.prisma, ctx.userId, args),

  payment: async (_parent: unknown, { id }: { id: string }, ctx: Context) =>
    getPayment(ctx.prisma, ctx.userId, id),
};

export const Mutation = {
  processPayment: async (
    _parent: unknown,
    { input }: { input: ProcessPaymentInput },
    ctx: Context,
  ) => processPayment(ctx.prisma, ctx.userId, input),
};
