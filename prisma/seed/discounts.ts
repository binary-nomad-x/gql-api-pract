import { faker } from "@faker-js/faker";
import type { SeedContext, SeedCounts } from "./types.js";
import { generateIds, bulkInsert } from "./utils.js";

const DISCOUNT_NAMES = [
  "Summer Sale", "Flash Deal", "Weekend Special", "Clearance",
  "Holiday Discount", "Bundle Offer", "Member Price", "Seasonal Sale",
];

export async function seedDiscounts(
  ctx: SeedContext,
  counts: SeedCounts,
  productIds: string[],
): Promise<void> {
  const discounted = faker.helpers.arrayElements(productIds, 1000);
  const ids = generateIds(discounted.length);
  await bulkInsert(ctx.pool, "discounts", discounted.map((pid, i) => ({
    id: ids[i], productId: pid,
    name: faker.helpers.arrayElement(DISCOUNT_NAMES),
    type: faker.helpers.arrayElement(["FIXED_AMOUNT", "PERCENTAGE"]),
    value: faker.helpers.arrayElement([10, 15, 20, 25, 30, 50]),
    startDate: faker.date.between({ from: new Date(Date.now() - 30 * 86400000), to: new Date() }),
    endDate: faker.date.between({ from: new Date(), to: new Date(Date.now() + 60 * 86400000) }),
    isActive: faker.datatype.boolean({ probability: 0.8 }),
    maxUsage: faker.number.int({ min: 10, max: 500 }),
    usedCount: faker.number.int({ min: 0, max: 50 }),
    updatedAt: new Date(),
  })));
  counts.discounts = discounted.length;
}
