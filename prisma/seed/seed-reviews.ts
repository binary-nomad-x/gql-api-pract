import { faker } from "@faker-js/faker";
import type { SeedContext, SeedCounts, ReviewSeed } from "./types.js";

export async function seedReviews(
  ctx: SeedContext,
  counts: SeedCounts,
  userIds: string[],
  productIds: string[],
): Promise<void> {
  const seen = new Set<string>();

  const data: ReviewSeed[] = [];

  for (const productId of productIds) {
    const n = Math.floor(Math.random() * 8) + 1;
    for (let i = 0; i < n; i++) {
      const userId = faker.helpers.arrayElement(userIds);
      const key = `${userId}:${productId}`;
      if (seen.has(key)) continue;
      seen.add(key);

      const rating = faker.number.int({ min: 1, max: 5 });

      data.push({
        rating,
        title: rating >= 4 ? faker.lorem.sentence({ min: 3, max: 6 }) : null,
        content: faker.lorem.sentences({ min: 1, max: 4 }),
        productId,
        userId,
      });
    }
  }

  await ctx.prisma.review.createMany({ data, skipDuplicates: true });
  counts.reviews += data.length;
}
