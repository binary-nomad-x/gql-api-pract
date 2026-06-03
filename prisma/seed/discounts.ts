import { faker } from "@faker-js/faker";
import type { SeedContext, SeedCounts } from "./types.js";
import type { Product, DiscountType } from "@prisma/client";

const DT: DiscountType[] = ["PERCENTAGE", "FIXED_AMOUNT"];

export async function seedDiscounts(ctx: SeedContext, counts: SeedCounts, products: Product[]): Promise<void> {
  const discounted = faker.helpers.arrayElements(products, 1000);
  await ctx.prisma.discount.createMany({
    data: discounted.map((p) => ({
      productId: p.id,
      name: faker.helpers.arrayElement([
        "Summer Sale", "Flash Deal", "Weekend Special", "Clearance",
        "Holiday Discount", "Bundle Offer", "Member Price", "Seasonal Sale",
      ]),
      type: faker.helpers.arrayElement(DT),
      value: faker.helpers.arrayElement([10, 15, 20, 25, 30, 50]),
      startDate: faker.date.recent({ days: 30 }),
      endDate: faker.date.future({ days: 60 }),
      isActive: faker.datatype.boolean(0.8),
      maxUsage: faker.number.int({ min: 10, max: 500 }),
      usedCount: faker.number.int({ min: 0, max: 50 }),
    })),
  });
  counts.discounts = discounted.length;
}
