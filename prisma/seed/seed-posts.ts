import { faker } from "@faker-js/faker";
import type { SeedContext, SeedCounts } from "./types.js";
import { randomUUID } from "node:crypto";

export async function seedPosts(
  ctx: SeedContext,
  counts: SeedCounts,
  userIds: string[],
  tagIds: string[],
  categoryIds: string[],
  count: number,
): Promise<string[]> {
  const postIds = Array.from({ length: count }, () => randomUUID());

  for (let i = 0; i < count; i++) {
    const id = postIds[i];
    const published = Math.random() > 0.3;

    await ctx.prisma.post.create({
      data: {
        id,
        title: faker.lorem.sentence({ min: 4, max: 10 }),
        content: faker.lorem.paragraphs({ min: 2, max: 6 }),
        published,
        authorId: faker.helpers.arrayElement(userIds),
        tags: {
          connect: faker.helpers
            .arrayElements(tagIds, { min: 1, max: 4 })
            .map((id) => ({ id })),
        },
        categories: {
          connect: faker.helpers
            .arrayElements(categoryIds, { min: 1, max: 2 })
            .map((id) => ({ id })),
        },
      },
    });
  }

  counts.posts += count;
  return postIds;
}
