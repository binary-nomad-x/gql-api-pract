import type { PrismaClient } from "@prisma/client";
import { BaseService } from "@gql-prisma-api/lib/BaseService.js";
import { requireAuth } from "@gql-prisma-api/utils/errors.js";
import { triggerNovuWorkflow } from "@gql-prisma-api/utils/novu.js";

export class FollowService {
  constructor(private readonly base: BaseService) {}
  resolveFollowFollower(followerId: string) {
    return this.base.core.user.findUnique({ where: { id: followerId } });
  }

  resolveFollowFollowing(followingId: string) {
    return this.base.core.user.findUnique({ where: { id: followingId } });
  }

  async toggleFollow(
    userId: string | undefined,
    targetUserId: string,
  ) {
    requireAuth(userId);
    if (targetUserId === userId) throw new Error("Cannot follow yourself");

    const existing = await this.base.core.follow.findUnique({
      where: { followerId_followingId: { followerId: userId!, followingId: targetUserId } },
    });

    if (existing) {
      await this.base.core.follow.delete({ where: { id: existing.id } });
      return existing;
    }

    const follow = await this.base.core.follow.create({ data: { followerId: userId!, followingId: targetUserId } });

    await triggerNovuWorkflow(targetUserId, "new-follower", { followerId: userId! });

    return follow;
  }

  getFollowers(userId: string) {
    return this.base.core.follow.findMany({ where: { followingId: userId }, include: { follower: true } });
  }

  getFollowing(userId: string) {
    return this.base.core.follow.findMany({ where: { followerId: userId }, include: { following: true } });
  }
}
