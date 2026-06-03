import { faker } from "@faker-js/faker";
import type { SeedContext, SeedCounts } from "./types.js";
import type { User, Product } from "@prisma/client";

/**
 * Seed product reviews.
 * Creates 1-5 reviewers per product for ~400 products.
 * Skips duplicate (user + product) constraint violations silently.
 */
export async function seedReviews(
  ctx: SeedContext,
  counts: SeedCounts,
  users: User[],
  products: Product[],
): Promise<void> {
  const reviewableProducts = faker.helpers.arrayElements(products, 400);
  let reviewCount = 0;

  for (const product of reviewableProducts) {
    const numReviews = faker.number.int({ min: 1, max: 5 });
    const reviewers = faker.helpers.arrayElements(users, numReviews);

    for (const reviewer of reviewers) {
      try {
        await ctx.prisma.review.create({
          data: {
            rating: faker.number.int({ min: 1, max: 5 }),
            title: faker.helpers.maybe(() => faker.lorem.sentence({ min: 3, max: 8 })) ?? undefined,
            content: faker.helpers.maybe(() => faker.lorem.paragraph()) ?? undefined,
            productId: product.id,
            userId: reviewer.id,
          },
        });
        reviewCount++;
      } catch {
        // Skip duplicate (productId_userId unique constraint)
      }
    }
  }
  counts.reviews = reviewCount;
  console.log(`Created ${reviewCount} reviews`);
}
