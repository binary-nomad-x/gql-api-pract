import { faker } from "@faker-js/faker";
import type { SeedContext, SeedCounts } from "./types.js";

export async function seedLikes(
  ctx: SeedContext,
  counts: SeedCounts,
  userIds: string[],
  postIds: string[],
): Promise<void> {
  const seen = new Set<string>();
  const data: Array<{ userId: string; postId: string }> = [];

  for (const postId of postIds) {
    const likeCount = Math.floor(Math.random() * userIds.length * 0.4);
    for (let j = 0; j < likeCount; j++) {
      const userId = faker.helpers.arrayElement(userIds);
      const key = `${userId}:${postId}`;
      if (!seen.has(key)) {
        seen.add(key);
        data.push({ userId, postId });
      }
    }
  }

  if (data.length > 0) {
    await ctx.prisma.like.createMany({ data, skipDuplicates: true });
  }
  counts.likes += data.length;
}
