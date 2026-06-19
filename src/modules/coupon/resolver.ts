import type { Context } from "@gql-prisma-api/types/context.js";
import type { Coupon as CouponModel } from "@prisma/client";
import type { CreateCouponInput } from "./inputs.js";
import { createCoupon, getCouponByCode, resolveCouponOrders } from "./service.js";

export const Coupon = {
  orders: (parent: CouponModel, _args: unknown, ctx: Context) =>
    resolveCouponOrders(ctx.prisma, parent.id),
};

export const Query = {
  couponByCode: (_parent: unknown, { code }: { code: string }, ctx: Context) =>
    getCouponByCode(ctx.prisma, code),
};

export const Mutation = {
  createCoupon: (_parent: unknown, { input }: { input: CreateCouponInput }, ctx: Context) =>
    createCoupon(ctx.prisma, ctx.userId, input),
};
