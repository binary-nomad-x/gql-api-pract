import type { Context } from "@graphql-prisma-api/types/context.js";
import type { Parent, UserIdArg } from "@graphql-prisma-api/types/graphql.js";
import { requireAuth } from "@graphql-prisma-api/utils/errors.js";

export const FollowResolver = {
  follower: (parent: Parent, _args: unknown, ctx: Context) =>
    ctx.prisma.user.findUnique({ where: { id: parent.followerId as string } }),
  following: (parent: Parent, _args: unknown, ctx: Context) =>
    ctx.prisma.user.findUnique({ where: { id: parent.followingId as string } }),
};

export const FollowQueries = {
  followers: (_parent: unknown, { userId }: UserIdArg, ctx: Context) =>
    ctx.prisma.follow.findMany({ where: { followingId: userId }, include: { follower: true } }),

  following: (_parent: unknown, { userId }: UserIdArg, ctx: Context) =>
    ctx.prisma.follow.findMany({ where: { followerId: userId }, include: { following: true } }),
};

export const FollowMutations = {
  toggleFollow: async (_parent: unknown, { userId }: UserIdArg, ctx: Context) => {
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
