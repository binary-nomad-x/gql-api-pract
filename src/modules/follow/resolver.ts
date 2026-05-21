import type { Context } from "@gql-prisma-api/types/context.js";
import type { Parent, UserIdArg } from "@gql-prisma-api/types/graphql.js";
import { toggleFollow, getFollowers, getFollowing } from "./service.js";

export const FollowResolver = {
  follower: (parent: Parent, _args: unknown, ctx: Context) =>
    ctx.prisma.user.findUnique({ where: { id: parent.followerId as string } }),
  following: (parent: Parent, _args: unknown, ctx: Context) =>
    ctx.prisma.user.findUnique({ where: { id: parent.followingId as string } }),
};

export const FollowQueries = {
  followers: (_parent: unknown, { userId }: UserIdArg, ctx: Context) =>
    getFollowers(ctx.prisma, userId),

  following: (_parent: unknown, { userId }: UserIdArg, ctx: Context) =>
    getFollowing(ctx.prisma, userId),
};

export const FollowMutations = {
  toggleFollow: async (_parent: unknown, { userId }: UserIdArg, ctx: Context) =>
    toggleFollow(ctx.prisma, ctx.userId, userId),
};
