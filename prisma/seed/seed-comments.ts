import { faker } from "@faker-js/faker";
import type { SeedContext, SeedCounts, CommentSeed } from "./types.js";

export async function seedComments(
  ctx: SeedContext,
  counts: SeedCounts,
  userIds: string[],
  postIds: string[],
): Promise<void> {
  const data: CommentSeed[] = [];

  for (const postId of postIds) {
    const commentCount = faker.number.int({ min: 2, max: 10 });
    for (let j = 0; j < commentCount; j++) {
      data.push({
        content: faker.lorem.sentences({ min: 1, max: 3 }),
        authorId: faker.helpers.arrayElement(userIds),
        postId,
      });
    }
  }

  await ctx.prisma.comment.createMany({ data });
  counts.comments += data.length;
}
