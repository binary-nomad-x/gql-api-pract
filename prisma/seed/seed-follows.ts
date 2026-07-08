import { faker } from "@faker-js/faker";
import type { SeedContext, SeedCounts, FollowSeed } from "./types.js";

export async function seedFollows(
  ctx: SeedContext,
  counts: SeedCounts,
  userIds: string[],
): Promise<void> {
  const seen = new Set<string>();
  const data: FollowSeed[] = [];

  for (const userId of userIds) {
    const followCount = Math.floor(Math.random() * 10) + 1;
    for (let j = 0; j < followCount; j++) {
      const targetId = faker.helpers.arrayElement(userIds);
      if (targetId === userId) continue;
      const key = `${userId}:${targetId}`;
      if (!seen.has(key)) {
        seen.add(key);
        data.push({ followerId: userId, followingId: targetId });
      }
    }
  }

  if (data.length > 0) {
    await ctx.prisma.follow.createMany({ data, skipDuplicates: true });
  }
  counts.follows += data.length;
}
