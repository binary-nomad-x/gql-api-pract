import { faker } from "@faker-js/faker";
import type { SeedContext, SeedCounts } from "./types.js";

export async function seedSavedPosts(
  ctx: SeedContext,
  counts: SeedCounts,
  userIds: string[],
  postIds: string[],
): Promise<void> {
  const seen = new Set<string>();
  const data: Array<{ userId: string; postId: string }> = [];

  for (const userId of userIds) {
    const n = Math.floor(Math.random() * 5) + 1;
    for (let i = 0; i < n; i++) {
      const postId = faker.helpers.arrayElement(postIds);
      const key = `${userId}:${postId}`;
      if (!seen.has(key)) {
        seen.add(key);
        data.push({ userId, postId });
      }
    }
  }

  if (data.length > 0) {
    await ctx.prisma.savedPost.createMany({ data, skipDuplicates: true });
  }
  counts.savedPosts += data.length;
}
