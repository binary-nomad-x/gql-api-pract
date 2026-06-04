import type { Context } from "@gql-prisma-api/types/context.js";
import type { CreateReturnInput, ReturnFilterInput } from "@gql-prisma-api/modules/return/inputs.js";
import {
  findMyReturns,
  findReturnById,
  createReturn,
  approveReturn,
  rejectReturn,
} from "@gql-prisma-api/modules/return/service.js";

export const returnResolver = {
  Query: {
    myReturns: (_: unknown, args: ReturnFilterInput, ctx: Context) =>
      findMyReturns(ctx.prisma, ctx.userId, args),
    returnRequest: (_: unknown, args: { id: string }, ctx: Context) =>
      findReturnById(ctx.prisma, ctx.userId, args.id),
  },
  Mutation: {
    createReturn: (_: unknown, args: { input: CreateReturnInput }, ctx: Context) =>
      createReturn(ctx.prisma, ctx.userId, args.input),
    approveReturn: (_: unknown, args: { id: string }, ctx: Context) =>
      approveReturn(ctx.prisma, ctx.userId, args.id),
    rejectReturn: (_: unknown, args: { id: string }, ctx: Context) =>
      rejectReturn(ctx.prisma, ctx.userId, args.id),
  },
  ReturnRequest: {
    orderItem: (parent: any) => parent.orderItem,
    user: (parent: any) => parent.user,
  },
};
