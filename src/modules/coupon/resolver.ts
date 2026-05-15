import type { Context } from "@graphql-prisma-api/types/context.js";
import type { Parent } from "@graphql-prisma-api/types/graphql.js";
import type { CreateCouponInput } from "@graphql-prisma-api/types/inputs.js";
import { requireAuth } from "@graphql-prisma-api/utils/errors.js";
import { clean } from "@graphql-prisma-api/utils/clean.js";

export const CouponResolver = {
  orders: (parent: Parent, _args: unknown, ctx: Context) =>
    ctx.prisma.order.findMany({ where: { couponId: parent.id } }),
};

export const CouponQueries = {
  couponByCode: (_parent: unknown, { code }: { code: string }, ctx: Context) =>
    ctx.prisma.coupon.findUnique({ where: { code } }),
};

export const CouponMutations = {
  createCoupon: async (_parent: unknown, { input }: { input: CreateCouponInput }, ctx: Context) => {
    requireAuth(ctx.userId);
    return ctx.prisma.coupon.create({ data: clean(input as any) as any });
  },
};
