import type { PrismaClient } from "@prisma/client";

// --- Type-field resolver functions ---
export function resolvePostViewPost(prisma: PrismaClient, postId: string) {
  return prisma.post.findUnique({ where: { id: postId } });
}

export function resolvePostViewUser(prisma: PrismaClient, userId: string | null) {
  return userId ? prisma.user.findUnique({ where: { id: userId } }) : null;
}

// --- Existing business logic functions ---
export function recordPostView(
  prisma: PrismaClient,
  postId: string,
  userId?: string,
) {
  return prisma.postView.create({ data: { postId, userId } });
}
