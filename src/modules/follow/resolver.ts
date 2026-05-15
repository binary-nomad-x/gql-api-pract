import type { Context } from "../../types/context.js";
import { requireAuth } from "../../utils/errors.js";

export const FollowResolver = {
  follower: (parent: any, _args: unknown, ctx: Context) =>
    ctx.prisma.user.findUnique({ where: { id: parent.followerId } }),
  following: (parent: any, _args: unknown, ctx: Context) =>
    ctx.prisma.user.findUnique({ where: { id: parent.followingId } }),
};

export const FollowQueries = {
  followers: (_parent: unknown, { userId }: { userId: string }, ctx: Context) =>
    ctx.prisma.follow.findMany({ where: { followingId: userId }, include: { follower: true } }),

  following: (_parent: unknown, { userId }: { userId: string }, ctx: Context) =>
    ctx.prisma.follow.findMany({ where: { followerId: userId }, include: { following: true } }),
};

export const FollowMutations = {
  toggleFollow: async (_parent: unknown, { userId }: { userId: string }, ctx: Context) => {
    requireAuth(ctx.userId);
    if (userId === ctx.userId) throw new Error("Cannot follow yourself");

    const existing = await ctx.prisma.follow.findUnique({
      where: { followerId_followingId: { followerId: ctx.userId!, followingId: userId } },
    });

    if (existing) {
      await ctx.prisma.follow.delete({ where: { id: existing.id } });
      return existing;
    }

    return ctx.prisma.follow.create({ data: { followerId: ctx.userId!, followingId: userId } });
  },
};
