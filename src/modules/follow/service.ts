import type { PrismaClient } from "@prisma/client";
import { requireAuth } from "@gql-prisma-api/utils/errors.js";
import { triggerNovuWorkflow } from "@gql-prisma-api/utils/novu.js";

export async function toggleFollow(
  prisma: PrismaClient,
  userId: string | undefined,
  targetUserId: string,
) {
  requireAuth(userId);
  if (targetUserId === userId) throw new Error("Cannot follow yourself");

  const existing = await prisma.follow.findUnique({
    where: { followerId_followingId: { followerId: userId!, followingId: targetUserId } },
  });

  if (existing) {
    await prisma.follow.delete({ where: { id: existing.id } });
    return existing;
  }

  const follow = await prisma.follow.create({ data: { followerId: userId!, followingId: targetUserId } });

  await triggerNovuWorkflow(targetUserId, "new-follower", { followerId: userId! });

  return follow;
}

export function getFollowers(prisma: PrismaClient, userId: string) {
  return prisma.follow.findMany({ where: { followingId: userId }, include: { follower: true } });
}

export function getFollowing(prisma: PrismaClient, userId: string) {
  return prisma.follow.findMany({ where: { followerId: userId }, include: { following: true } });
}
