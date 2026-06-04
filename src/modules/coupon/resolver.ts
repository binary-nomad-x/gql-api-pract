import type { Context } from "@gql-prisma-api/types/context.js";
import type { Parent } from "@gql-prisma-api/types/graphql.js";
import type { CreateCouponInput } from "@gql-prisma-api/modules/coupon/inputs.js";
import { createCoupon, getCouponByCode } from "./service.js";

export const CouponResolver = {
  orders: (parent: Parent, _args: unknown, ctx: Context) =>
    ctx.prisma.order.findMany({ where: { couponId: parent.id } }),
};

export const CouponQueries = {
  couponByCode: (_parent: unknown, { code }: { code: string }, ctx: Context) =>
    getCouponByCode(ctx.prisma, code),
};

export const CouponMutations = {
  createCoupon: async (_parent: unknown, { input }: { input: CreateCouponInput }, ctx: Context) =>
    createCoupon(ctx.prisma, ctx.userId, input),
};
