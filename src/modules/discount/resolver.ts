import type { Context } from "@gql-prisma-api/types/context.js";
import type { Discount as DiscountModel } from "@prisma/client";
import type { CreateDiscountInput, UpdateDiscountInput } from "./inputs.js";

export const Discount = {
  product: (parent: DiscountModel, _args: unknown, ctx: Context) =>
    ctx.services.discount.resolveDiscountProduct(parent.productId),
};

export const Query = {
  activeDiscounts: (_parent: unknown, _args: unknown, ctx: Context) =>
    ctx.services.discount.getActiveDiscounts(),

  productDiscounts: (_parent: unknown, { productId }: { productId: string }, ctx: Context) =>
    ctx.services.discount.getProductDiscounts(productId),
};

export const Mutation = {
  createDiscount: (_parent: unknown, { input }: { input: CreateDiscountInput }, ctx: Context) =>
    ctx.services.discount.createDiscount(ctx.userId, input),

  updateDiscount: (_parent: unknown, { id, input }: { id: string; input: UpdateDiscountInput }, ctx: Context) =>
    ctx.services.discount.updateDiscount(ctx.userId, id, input),

  deleteDiscount: (_parent: unknown, { id }: { id: string }, ctx: Context) =>
    ctx.services.discount.deleteDiscount(ctx.userId, id),
};
