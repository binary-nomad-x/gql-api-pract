import type { Prisma } from "@prisma/client";
import type { CreateCouponInput } from "./inputs.js";
import { requireAuth } from "@gql-prisma-api/utils/errors.js";
import { BaseService } from "@gql-prisma-api/lib/BaseService.js";

export class CouponService extends BaseService {
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
    const { clean } = await import("@gql-prisma-api/utils/clean.js");
    const data: Prisma.CouponCreateInput = clean(input as unknown as Record<string, unknown>) as Prisma.CouponCreateInput;
    return this.core.coupon.create({ data });
  }

  getCouponByCode(code: string) {
    return this.core.coupon.findUnique({ where: { code } });
  }
}
