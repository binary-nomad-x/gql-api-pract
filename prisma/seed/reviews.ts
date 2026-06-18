import { faker } from "@faker-js/faker";
import type { SeedContext, SeedCounts } from "./types.js";
import type { User, Product } from "@prisma/client";

export async function seedReviews(
  ctx: SeedContext,
  counts: SeedCounts,
  users: User[],
  products: Product[],
): Promise<void> {
  const reviewed = faker.helpers.arrayElements(products, 800);
  const used = new Set<string>();

  const data: Array<{
    rating: number;
    title?: string;
    content?: string;
    productId: string;
    userId: string;
  }> = [];

  for (const product of reviewed) {
    const n = faker.number.int({ min: 1, max: 5 });
    const reviewers = faker.helpers.arrayElements(users, n);
    for (const r of reviewers) {
      const key = `${product.id}_${r.id}`;
      if (used.has(key)) continue;
      used.add(key);
      data.push({
        rating: faker.number.int({ min: 1, max: 5 }),
        title:
          faker.helpers.maybe(() => faker.lorem.sentence({ min: 3, max: 8 })) ??
          undefined,
        content:
          faker.helpers.maybe(() => faker.lorem.paragraph()) ?? undefined,
        productId: product.id,
        userId: r.id,
      });
    }
  }

  await ctx.prisma.review.createMany({ data });
  counts.reviews = data.length;
  console.log(`Created ${data.length} reviews`);
}
