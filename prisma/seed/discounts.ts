import { faker } from "@faker-js/faker";
import type { SeedContext, SeedCounts } from "./types.js";
import { Product } from "@prisma/client";

export async function seedDiscounts(
  ctx: SeedContext,
  counts: SeedCounts,
  products: Product[],
): Promise<void> {
  const discounted = faker.helpers.arrayElements(products, 1000);
  await ctx.prisma.discount.createMany({
    data: discounted.map((p) => ({
      productId: p.id,
      name: faker.helpers.arrayElement([
        "Summer Sale",
        "Flash Deal",
        "Weekend Special",
        "Clearance",
        "Holiday Discount",
        "Bundle Offer",
        "Member Price",
        "Seasonal Sale",
      ]),
      type: faker.helpers.arrayElement(["FIXED_AMOUNT", "PERCENTAGE"]),
      value: faker.helpers.arrayElement([10, 15, 20, 25, 30, 50]),
      startDate: faker.date.between({
        from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
        to: new Date(),
      }),
      endDate: faker.date.between({
        from: new Date(),
        to: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days future
      }),
      isActive: faker.datatype.boolean({ probability: 0.8 }),
      maxUsage: faker.number.int({ min: 10, max: 500 }),
      usedCount: faker.number.int({ min: 0, max: 50 }),
    })),
  });
  counts.discounts = discounted.length;
}
