import type { Context } from "@gql-prisma-api/types/context.js";
import type { Discount as DiscountModel } from "@prisma/client";
import type { CreateDiscountInput, UpdateDiscountInput } from "./inputs.js";
import {
  createDiscount, updateDiscount, deleteDiscount,
  getActiveDiscounts, getProductDiscounts,
  resolveDiscountProduct,
} from "./service.js";

export const Discount = {
  product: (parent: DiscountModel, _args: unknown, ctx: Context) =>
    resolveDiscountProduct(ctx.prisma, parent.productId),
};

export const Query = {
  activeDiscounts: (_parent: unknown, _args: unknown, ctx: Context) =>
    getActiveDiscounts(ctx.prisma),

  productDiscounts: (_parent: unknown, { productId }: { productId: string }, ctx: Context) =>
    getProductDiscounts(ctx.prisma, productId),
};

export const Mutation = {
  createDiscount: (_parent: unknown, { input }: { input: CreateDiscountInput }, ctx: Context) =>
    createDiscount(ctx.prisma, ctx.userId, input),

  updateDiscount: (_parent: unknown, { id, input }: { id: string; input: UpdateDiscountInput }, ctx: Context) =>
    updateDiscount(ctx.prisma, ctx.userId, id, input),

  deleteDiscount: (_parent: unknown, { id }: { id: string }, ctx: Context) =>
    deleteDiscount(ctx.prisma, ctx.userId, id),
};
