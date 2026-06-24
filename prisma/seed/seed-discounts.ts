import { fa, faker } from "@faker-js/faker";
import type { SeedContext, SeedCounts } from "./types.js";

const DISCOUNT_TYPES = ["PERCENTAGE", "FIXED"];

export async function seedDiscounts(
  ctx: SeedContext,
  counts: SeedCounts,
  productIds: string[],
): Promise<void> {
  const data: Array<{
    productId: string;
    name: string;
    type: string;
    value: number;
    startDate: Date;
    endDate: Date;
    isActive: boolean;
    maxUsage: number;
    usedCount: number;
  }> = [];

  for (const productId of productIds) {
    const hasDiscount = Math.random() > 0.6;
    if (!hasDiscount) continue;

    const type = faker.helpers.arrayElement(DISCOUNT_TYPES);

    const maxUsage = faker.number.int({ min: 10, max: 200 });
    const usedCount = faker.number.int({ min: 0, max: maxUsage });

    data.push({
      productId,
      name: faker.lorem.words({ min: 3, max: 5 }),
      type,
      value:
        type === "PERCENTAGE"
          ? faker.helpers.arrayElement([10, 15, 20, 25, 30, 40, 50])
          : parseFloat(faker.commerce.price({ min: 5, max: 50 })),
      startDate: faker.date.past(),
      endDate: faker.date.future(),
      isActive: Math.random() > 0.2,
      maxUsage,
      usedCount,
    });
  }

  if (data.length > 0) {
    await ctx.prisma.discount.createMany({ data });
  }

  counts.discounts += data.length;
}
