import type { Context } from "@gql-prisma-api/types/context.js";
import type { Parent } from "@gql-prisma-api/types/graphql.js";
import type { CreateDiscountInput, UpdateDiscountInput } from "@gql-prisma-api/types/inputs.js";
import {
  createDiscount, updateDiscount, deleteDiscount,
  getActiveDiscounts, getProductDiscounts,
} from "./service.js";

export const DiscountResolver = {
  product: (parent: Parent, _args: unknown, ctx: Context) =>
    ctx.prisma.product.findUnique({ where: { id: parent.productId as string } }),
};

export const DiscountQueries = {
  activeDiscounts: async (_parent: unknown, _args: unknown, ctx: Context) =>
    getActiveDiscounts(ctx.prisma),

  productDiscounts: async (_parent: unknown, { productId }: { productId: string }, ctx: Context) =>
    getProductDiscounts(ctx.prisma, productId),
};

export const DiscountMutations = {
  createDiscount: async (_parent: unknown, { input }: { input: CreateDiscountInput }, ctx: Context) =>
    createDiscount(ctx.prisma, ctx.userId, input),

  updateDiscount: async (_parent: unknown, { id, input }: { id: string; input: UpdateDiscountInput }, ctx: Context) =>
    updateDiscount(ctx.prisma, ctx.userId, id, input),

  deleteDiscount: async (_parent: unknown, { id }: { id: string }, ctx: Context) =>
    deleteDiscount(ctx.prisma, ctx.userId, id),
};
