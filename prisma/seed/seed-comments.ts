import { faker } from "@faker-js/faker";
import type { SeedContext, SeedCounts } from "./types.js";

export async function seedComments(
  ctx: SeedContext,
  counts: SeedCounts,
  userIds: string[],
  postIds: string[],
): Promise<void> {
  const data: Array<{
    content: string;
    authorId: string;
    postId: string;
  }> = [];

  const pickRandom = <T>(arr: T[]): T =>
    arr[Math.floor(Math.random() * arr.length)];

  for (const postId of postIds) {
    const commentCount = faker.number.int({ min: 1, max: 5 });
    for (let j = 0; j < commentCount; j++) {
      data.push({
        content: faker.lorem.sentences({ min: 1, max: 3 }),
        authorId: pickRandom(userIds),
        postId,
      });
    }
  }

  await ctx.prisma.comment.createMany({ data });
  counts.comments += data.length;
}
