import type { PrismaClient, Prisma } from "@prisma/client";
import type { CreateCouponInput } from "./inputs.js";
import { requireAuth } from "@gql-prisma-api/utils/errors.js";

// --- Type-field resolver functions ---
export function resolveCouponOrders(prisma: PrismaClient, couponId: string) {
  return prisma.order.findMany({ where: { couponId } });
}

// --- Existing business logic functions ---
export async function createCoupon(
  prisma: PrismaClient,
  userId: string | undefined,
  input: CreateCouponInput,
) {
  requireAuth(userId);
  const { clean } = await import("@gql-prisma-api/utils/clean.js");
  const data: Prisma.CouponCreateInput = clean(input as unknown as Record<string, unknown>) as Prisma.CouponCreateInput;
  return prisma.coupon.create({ data });
}

export function getCouponByCode(prisma: PrismaClient, code: string) {
  return prisma.coupon.findUnique({ where: { code } });
}
