import type { Context } from "@gql-prisma-api/types/context.js";
import type { Follow as FollowModel } from "@prisma/client";
import type { UserIdArg } from "@gql-prisma-api/types/graphql.js";
import { toggleFollow, getFollowers, getFollowing, resolveFollowFollower, resolveFollowFollowing } from "./service.js";

export const Follow = {
  follower: (parent: FollowModel, _args: unknown, ctx: Context) =>
    resolveFollowFollower(ctx.prisma, parent.followerId),
  following: (parent: FollowModel, _args: unknown, ctx: Context) =>
    resolveFollowFollowing(ctx.prisma, parent.followingId),
};

export const Query = {
  followers: (_parent: unknown, { userId }: UserIdArg, ctx: Context) =>
    getFollowers(ctx.prisma, userId),

  following: (_parent: unknown, { userId }: UserIdArg, ctx: Context) =>
    getFollowing(ctx.prisma, userId),
};

export const Mutation = {
  toggleFollow: (_parent: unknown, { userId }: UserIdArg, ctx: Context) =>
    toggleFollow(ctx.prisma, ctx.userId, userId),
};
