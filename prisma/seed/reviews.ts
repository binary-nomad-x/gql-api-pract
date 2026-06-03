import { faker } from "@faker-js/faker";
import type { SeedContext, SeedCounts } from "./types.js";
import type { User, Product } from "@prisma/client";

/**
 * Seed product reviews using bulk insert.
 * Generates unique (productId + userId) pairs to avoid constraint violations.
 */
export async function seedReviews(
  ctx: SeedContext,
  counts: SeedCounts,
  users: User[],
  products: Product[],
): Promise<void> {
  const reviewableProducts = faker.helpers.arrayElements(products, 400);
  const usedPairs = new Set<string>();
  const reviewData: Array<{
    rating: number; title?: string; content?: string;
    productId: string; userId: string;
  }> = [];

  for (const product of reviewableProducts) {
    const numReviews = faker.number.int({ min: 1, max: 5 });
    const reviewers = faker.helpers.arrayElements(users, numReviews);
    for (const reviewer of reviewers) {
      const key = `${product.id}_${reviewer.id}`;
      if (usedPairs.has(key)) continue;
      usedPairs.add(key);
      reviewData.push({
        rating: faker.number.int({ min: 1, max: 5 }),
        title: faker.helpers.maybe(() => faker.lorem.sentence({ min: 3, max: 8 })) ?? undefined,
        content: faker.helpers.maybe(() => faker.lorem.paragraph()) ?? undefined,
        productId: product.id,
        userId: reviewer.id,
      });
    }
  }

  await ctx.prisma.review.createMany({ data: reviewData });
  counts.reviews = reviewData.length;
  console.log(`Created ${reviewData.length} reviews`);
}
