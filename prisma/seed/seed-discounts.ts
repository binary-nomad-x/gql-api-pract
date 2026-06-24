import { faker } from "@faker-js/faker";
import type { SeedContext, SeedCounts } from "./types.js";

const DISCOUNT_TYPES = ["PERCENTAGE", "FIXED"];

export async function seedDiscounts(
  ctx: SeedContext,
  counts: SeedCounts,
  productIds: string[],
): Promise<void> {
  const pickRandom = <T>(arr: T[]): T =>
    arr[Math.floor(Math.random() * arr.length)];

  const data: Array<{
    productId: string;
    name: string;
    type: string;
    value: number;
    startDate: Date;
    endDate: Date;
    isActive: boolean;
    maxUsage: number;
  }> = [];

  for (const productId of productIds) {
    const hasDiscount = Math.random() > 0.6;
    if (!hasDiscount) continue;

    const type = pickRandom(DISCOUNT_TYPES);
    data.push({
      productId,
      name: faker.lorem.words(3),
      type,
      value: type === "PERCENTAGE"
        ? pickRandom([10, 15, 20, 25, 30, 40, 50])
        : parseFloat(faker.commerce.price({ min: 5, max: 50 })),
      startDate: faker.date.past(),
      endDate: faker.date.future(),
      isActive: Math.random() > 0.2,
      maxUsage: faker.number.int({ min: 10, max: 200 }),
    });
  }

  if (data.length > 0) {
    await ctx.prisma.discount.createMany({ data });
  }
  counts.discounts += data.length;
}
