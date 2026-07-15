import { faker } from "@faker-js/faker";
import type { SeedContext, SeedCounts } from "./types.js";
import { COUPON_DATA } from "../data/coupons.js";

export async function seedCoupons(ctx: SeedContext, counts: SeedCounts): Promise<string[]> {
  const coupons = await Promise.all(
    COUPON_DATA.map((data) =>
      ctx.prisma.coupon.create({
        data: {
          ...data,
          isActive: true,
          usedCount: 0,
          startedAt: faker.date.past(),
          expiresAt: faker.date.future({ years: 2 }),
        },
      }),
    ),
  );

  counts.coupons += coupons.length;
  return coupons.map((c) => c.id);
}
