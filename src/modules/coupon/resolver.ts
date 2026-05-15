import type { Context } from "@/types/context.js";
import type { Parent } from "@/types/graphql.js";
import type { CreateCouponInput } from "@/types/inputs.js";
import { requireAuth } from "@/utils/errors.js";
import { clean } from "@/utils/clean.js";

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
