import type { PrismaClient } from "@prisma/client";

export function recordPostView(
  prisma: PrismaClient,
  postId: string,
  userId?: string,
) {
  return prisma.postView.create({ data: { postId, userId } });
}
