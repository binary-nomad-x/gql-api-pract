import type { Context } from "@gql-prisma-api/types/context.js";
import type { SavedPost as SavedPostModel } from "@prisma/client";
import { requireAuth } from "@gql-prisma-api/utils/errors.js";

export const SavedPost = {
  user: (parent: SavedPostModel, _args: unknown, ctx: Context) => ctx.services.savedPost.resolveSavedPostUser(parent.userId),
  post: (parent: SavedPostModel, _args: unknown, ctx: Context) => ctx.services.savedPost.resolveSavedPostPost(parent.postId),
};

export const Query = {
  mySavedPosts: (_parent: unknown, args: { limit?: number; offset?: number }, ctx: Context) => {
    requireAuth(ctx.userId);
    return ctx.services.savedPost.getMySavedPosts(ctx.userId, args);
  },
};

export const Mutation = {
  toggleSavePost: (_parent: unknown, { postId }: { postId: string }, ctx: Context) => {
    requireAuth(ctx.userId);
    return ctx.services.savedPost.toggleSavePost(ctx.userId, postId);
  },
};
