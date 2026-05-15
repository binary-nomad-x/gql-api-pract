import type { Context } from "../../types/context.js";
import { requireAuth } from "../../utils/errors.js";

export const CouponResolver = {
  orders: (parent: any, _args: unknown, ctx: Context) =>
    ctx.prisma.order.findMany({ where: { couponId: parent.id } }),
};

export const CouponQueries = {
  couponByCode: (_parent: unknown, { code }: { code: string }, ctx: Context) =>
    ctx.prisma.coupon.findUnique({ where: { code } }),
};

export const CouponMutations = {
  createCoupon: async (_parent: unknown, { input }: any, ctx: Context) => {
    requireAuth(ctx.userId);
    return ctx.prisma.coupon.create({ data: input });
  },
};
