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

  const pickRandom = <T>(arr: T[]): T =>
    arr[Math.floor(Math.random() * arr.length)];

  const pickRandomN = <T>(arr: T[], n: number): T[] => {
    const shuffled = [...arr].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, Math.min(n, shuffled.length));
  };

  for (let i = 0; i < count; i++) {
    const id = postIds[i];
    const published = Math.random() > 0.3;
    const selectedTags = pickRandomN(tagIds, faker.number.int({ min: 1, max: 4 }));
    const selectedCategories = pickRandomN(categoryIds, faker.number.int({ min: 1, max: 2 }));

    await ctx.prisma.post.create({
      data: {
        id,
        title: faker.lorem.sentence({ min: 4, max: 10 }),
        content: faker.lorem.paragraphs({ min: 2, max: 6 }),
        published,
        authorId: pickRandom(userIds),
        tags: { connect: selectedTags.map((id) => ({ id })) },
        categories: { connect: selectedCategories.map((id) => ({ id })) },
      },
    });
  }

  counts.posts += count;
  return postIds;
}
