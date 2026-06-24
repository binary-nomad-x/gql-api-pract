import { faker } from "@faker-js/faker";
import type { SeedContext, SeedCounts } from "./types.js";

export async function seedPostViews(
  ctx: SeedContext,
  counts: SeedCounts,
  postIds: string[],
): Promise<void> {
  const data: Array<{ postId: string; ip: string }> = [];

  for (const postId of postIds) {
    const n = faker.number.int({ min: 5, max: 30 });
    for (let i = 0; i < n; i++) {
      data.push({
        postId,
        ip: faker.internet.ip(),
      });
    }
  }

  await ctx.prisma.postView.createMany({ data });
  counts.postViews += data.length;
}
