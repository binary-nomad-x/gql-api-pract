import type { PrismaClient } from "@prisma/client";
import { triggerNovuWorkflow } from "@gql-prisma-api/utils/novu.js";

export class FollowService {
  constructor(private readonly core: PrismaClient) {}
  resolveFollowFollower(followerId: string) {
    return this.core.user.findUnique({ where: { id: followerId } });
  }

  resolveFollowFollowing(followingId: string) {
    return this.core.user.findUnique({ where: { id: followingId } });
  }

  async toggleFollow(userId: string, targetUserId: string) {
    if (targetUserId === userId) throw new Error("Cannot follow yourself");

    const existing = await this.core.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: userId,
          followingId: targetUserId,
        },
      },
    });

    if (existing) {
      await this.core.follow.delete({ where: { id: existing.id } });
      return existing;
    }

    const follow = await this.core.follow.create({
      data: { followerId: userId, followingId: targetUserId },
    });

    await triggerNovuWorkflow(targetUserId, "new-follower", {
      followerId: userId,
    });

    return follow;
  }

  getFollowers(userId: string) {
    return this.core.follow.findMany({
      where: { followingId: userId },
      include: { follower: true },
    });
  }

  getFollowing(userId: string) {
    return this.core.follow.findMany({
      where: { followerId: userId },
      include: { following: true },
    });
  }
}
