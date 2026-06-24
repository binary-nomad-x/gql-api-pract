import { faker } from "@faker-js/faker";
import type { SeedContext, SeedCounts } from "./types.js";

const COUPON_DATA = [
  { code: "WELCOME10", description: "10% off your first order", discountPercent: 10, discountAmount: 0, minPurchase: 50, maxUses: 100 },
  { code: "SAVE20", description: "$20 off orders over $100", discountPercent: 0, discountAmount: 20, minPurchase: 100, maxUses: 50 },
  { code: "SUMMER25", description: "25% off summer sale", discountPercent: 25, discountAmount: 0, minPurchase: 75, maxUses: 200 },
  { code: "FLASH15", description: "15% off flash sale", discountPercent: 15, discountAmount: 0, minPurchase: 30, maxUses: 150 },
  { code: "FREESHIP", description: "Free shipping on any order", discountPercent: 0, discountAmount: 15, minPurchase: 0, maxUses: 300 },
  { code: "VIP50", description: "50% off for VIP members", discountPercent: 50, discountAmount: 0, minPurchase: 200, maxUses: 20 },
  { code: "HOLIDAY20", description: "20% off holiday special", discountPercent: 20, discountAmount: 0, minPurchase: 60, maxUses: 100 },
];

export async function seedCoupons(
  ctx: SeedContext,
  counts: SeedCounts,
): Promise<string[]> {
  const coupons = await Promise.all(
    COUPON_DATA.map((data) =>
      ctx.prisma.coupon.create({
        data: {
          ...data,
          isActive: true,
          usedCount: 0,
          expiresAt: faker.date.future(),
        },
      }),
    ),
  );

  counts.coupons += coupons.length;
  return coupons.map((c) => c.id);
}
