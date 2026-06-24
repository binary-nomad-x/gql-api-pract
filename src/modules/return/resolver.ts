import type { Context } from "@gql-prisma-api/types/context.js";
import type { ReturnRequest as ReturnRequestModel } from "@prisma/client";
import type { CreateReturnInput, ReturnFilterInput } from "./inputs.js";
import {
  resolveReturnRequestOrderItem,
  resolveReturnRequestUser,
  findMyReturns,
  findReturnById,
  createReturn,
  approveReturn,
  rejectReturn,
} from "./service.js";

export const Query = {
  myReturns: (_parent: unknown, args: ReturnFilterInput, ctx: Context) =>
    findMyReturns(ctx.prisma, ctx.userId, args),
  returnRequest: (_parent: unknown, { id }: { id: string }, ctx: Context) =>
    findReturnById(ctx.prisma, ctx.userId, id),
};

export const Mutation = {
  createReturn: (_parent: unknown, { input }: { input: CreateReturnInput }, ctx: Context) =>
    createReturn(ctx.prisma, ctx.userId, input),
  approveReturn: (_parent: unknown, { id }: { id: string }, ctx: Context) =>
    approveReturn(ctx.prisma, ctx.userId, id),
  rejectReturn: (_parent: unknown, { id }: { id: string }, ctx: Context) =>
    rejectReturn(ctx.prisma, ctx.userId, id),
};

export const ReturnRequest = {
  orderItem: (parent: ReturnRequestModel, _args: unknown, ctx: Context) =>
    resolveReturnRequestOrderItem(ctx.prisma, parent.orderItemId),
  user: (parent: ReturnRequestModel, _args: unknown, ctx: Context) =>
    resolveReturnRequestUser(ctx.prisma, parent.userId),
};
