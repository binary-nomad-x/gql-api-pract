import type { PrismaClient } from "@prisma/client";
import { requireAuth } from "@gql-prisma-api/utils/errors.js";

// --- Type-field resolver functions ---
export function resolveSavedPostUser(prisma: PrismaClient, userId: string) {
  return prisma.user.findUnique({ where: { id: userId } });
}

export function resolveSavedPostPost(prisma: PrismaClient, postId: string) {
  return prisma.post.findUnique({ where: { id: postId } });
}

// --- Existing business logic functions ---
export async function toggleSavePost(
  prisma: PrismaClient,
  userId: string | undefined,
  postId: string,
) {
  requireAuth(userId);
  const existing = await prisma.savedPost.findUnique({
    where: { userId_postId: { userId: userId!, postId } },
  });
  if (existing) {
    await prisma.savedPost.delete({ where: { id: existing.id } });
    return existing;
  }
  return prisma.savedPost.create({ data: { userId: userId!, postId } });
}

export function getMySavedPosts(
  prisma: PrismaClient,
  userId: string | undefined,
  args: { limit?: number; offset?: number },
) {
  requireAuth(userId);
  return prisma.savedPost.findMany({
    where: { userId: userId! },
    take: args.limit ?? 20,
    skip: args.offset ?? 0,
    orderBy: { createdAt: "desc" },
  });
}
