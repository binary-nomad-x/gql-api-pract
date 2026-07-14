import { faker } from "@faker-js/faker";
import type { SeedContext, SeedCounts, LikeSeed } from "./types.js";

const LIKE_TYPES = ["LIKE", "LOVE", "HAHA", "WOW", "SAD", "ANGRY"];

export async function seedLikes(ctx: SeedContext, counts: SeedCounts, userIds: string[], postIds: string[]): Promise<void> {
  const seen = new Set<string>();
  const data: LikeSeed[] = [];

  for (const postId of postIds) {
    const likesCountPeruser = Math.floor(Math.random() * userIds.length * 0.5);
    for (let j = 0; j < likesCountPeruser; j++) {
      const userId = faker.helpers.arrayElement(userIds);
      const key = `${userId}:${postId}`;
      if (!seen.has(key)) {
        seen.add(key);
        data.push({
          userId,
          postId,
          type: faker.helpers.arrayElement(LIKE_TYPES),
        });
      }
    }
  }

  if (data.length > 0) {
    await ctx.prisma.like.createMany({ data, skipDuplicates: true });
  }

  counts.likes += data.length;
}
