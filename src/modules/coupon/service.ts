import type { PrismaClient } from "@prisma/client";
import type { CreateCouponInput } from "@gql-prisma-api/types/inputs.js";
import { requireAuth } from "@gql-prisma-api/utils/errors.js";

export async function createCoupon(
  prisma: PrismaClient,
  userId: string | undefined,
  input: CreateCouponInput,
) {
  requireAuth(userId);
  const { clean } = await import("@gql-prisma-api/utils/clean.js");
  return prisma.coupon.create({ data: clean(input as any) as any });
}

export function getCouponByCode(prisma: PrismaClient, code: string) {
  return prisma.coupon.findUnique({ where: { code } });
}
