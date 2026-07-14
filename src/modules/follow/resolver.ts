import type { Context } from "@gql-prisma-api/types/context.js";
import type { Follow as FollowModel } from "@prisma/client";
import type { UserIdArg } from "@gql-prisma-api/types/graphql.js";
import { requireAuth } from "@gql-prisma-api/utils/errors.js";

export const Follow = {
  follower: (parent: FollowModel, _args: unknown, ctx: Context) => ctx.services.follow.resolveFollowFollower(parent.followerId),
  following: (parent: FollowModel, _args: unknown, ctx: Context) => ctx.services.follow.resolveFollowFollowing(parent.followingId),
};

export const Query = {
  followers: (_parent: unknown, { userId }: UserIdArg, ctx: Context) => ctx.services.follow.getFollowers(userId),

  following: (_parent: unknown, { userId }: UserIdArg, ctx: Context) => ctx.services.follow.getFollowing(userId),
};

export const Mutation = {
  toggleFollow: (_parent: unknown, { userId }: UserIdArg, ctx: Context) => {
    requireAuth(ctx.userId);
    return ctx.services.follow.toggleFollow(ctx.userId, userId);
  },
};
