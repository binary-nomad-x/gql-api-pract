import { faker } from "@faker-js/faker";
import type { SeedContext, SeedCounts, SavedPostSeed } from "./types.js";

const FOLDERS = ["Default", "Read Later", "Favorites", "Archive", "Learning", "Inspiration"];

export async function seedSavedPosts(
  ctx: SeedContext,
  counts: SeedCounts,
  userIds: string[],
  postIds: string[],
): Promise<void> {
  const seen = new Set<string>();
  const data: SavedPostSeed[] = [];

  for (const userId of userIds) {
    const n = Math.floor(Math.random() * 8) + 1;
    for (let i = 0; i < n; i++) {
      const postId = faker.helpers.arrayElement(postIds);
      const key = `${userId}:${postId}`;
      if (!seen.has(key)) {
        seen.add(key);
        data.push({
          userId,
          postId,
          note: Math.random() > 0.5 ? faker.lorem.sentence() : "",
          folder: faker.helpers.arrayElement(FOLDERS),
        });
      }
    }
  }

  if (data.length > 0) {
    await ctx.prisma.savedPost.createMany({ data, skipDuplicates: true });
  }
  counts.savedPosts += data.length;
}
