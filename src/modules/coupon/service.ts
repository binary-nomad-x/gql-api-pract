import type { Prisma, PrismaClient } from "@prisma/client";
import type { CreateCouponInput } from "./inputs.js";
import { requireAuth } from "@gql-prisma-api/utils/errors.js";
import { clean } from "@gql-prisma-api/lib/core.js";

export class CouponService {
  constructor(private readonly core: PrismaClient) {}

  // --- Type-field resolver functions ---
  resolveCouponOrders(couponId: string) {
    return this.core.order.findMany({ where: { couponId } });
  }

  // --- Existing business logic functions ---
  async createCoupon(
    userId: string | undefined,
    input: CreateCouponInput,
  ) {
    requireAuth(userId);
    const data: Prisma.CouponCreateInput = clean(input as unknown as Record<string, unknown>) as Prisma.CouponCreateInput;
    return this.core.coupon.create({ data });
  }

  getCouponByCode(code: string) {
    return this.core.coupon.findUnique({ where: { code } });
  }
}
