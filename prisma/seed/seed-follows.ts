import { faker } from "@faker-js/faker";
import type { SeedContext, SeedCounts, FollowSeed } from "./types.js";

export async function seedFollows(
  ctx: SeedContext,
  counts: SeedCounts,
  userIds: string[],
): Promise<void> {
  const seen = new Set<string>();
  // Pre-compute follow relationships to determine mutuals
  const allPairs: { followerId: string; followingId: string }[] = [];

  for (const userId of userIds) {
    const followCount = Math.floor(Math.random() * 12) + 1;
    for (let j = 0; j < followCount; j++) {
      const targetId = faker.helpers.arrayElement(userIds);
      if (targetId === userId) continue;
      const key = `${userId}:${targetId}`;
      const reverseKey = `${targetId}:${userId}`;
      if (!seen.has(key)) {
        seen.add(key);
        allPairs.push({ followerId: userId, followingId: targetId });
      }
    }
  }

  // Determine mutual follows
  const followSet = new Set(allPairs.map((p) => `${p.followerId}:${p.followingId}`));
  const data: FollowSeed[] = allPairs.map((p) => {
    const reverseKey = `${p.followingId}:${p.followerId}`;
    return {
      followerId: p.followerId,
      followingId: p.followingId,
      isMutual: followSet.has(reverseKey),
      notifyOnPost: faker.datatype.boolean({ probability: 0.7 }),
      notifyOnStory: faker.datatype.boolean({ probability: 0.5 }),
    };
  });

  if (data.length > 0) {
    await ctx.prisma.follow.createMany({ data, skipDuplicates: true });
  }
  counts.follows += data.length;
}
