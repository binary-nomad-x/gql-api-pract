import { faker } from "@faker-js/faker";
import type { SeedContext, SeedCounts } from "./types.js";

export async function seedUserCategoryFollows(ctx: SeedContext, counts: SeedCounts, userIds: string[], categoryIds: string[]): Promise<void> {
  const seen = new Set<string>();
  const data: { userId: string; categoryId: string; notifyOnNew: boolean }[] = [];

  for (const userId of userIds) {
    const followCount = faker.number.int({ min: 1, max: 5 });
    for (let i = 0; i < followCount; i++) {
      const categoryId = faker.helpers.arrayElement(categoryIds);
      const key = `${userId}:${categoryId}`;
      if (seen.has(key)) continue;
      seen.add(key);
      data.push({
        userId,
        categoryId,
        notifyOnNew: faker.datatype.boolean({ probability: 0.7 }),
      });
    }
  }

  if (data.length > 0) {
    await ctx.prisma.userCategoryFollow.createMany({ data, skipDuplicates: true });
  }
  counts.userCategoryFollows += data.length;
}
