import type { Context } from "@gql-prisma-api/types/context.js";
import type { SavedPost as SavedPostModel } from "@prisma/client";
import {
  resolveSavedPostUser,
  resolveSavedPostPost,
  toggleSavePost,
  getMySavedPosts,
} from "./service.js";

export const SavedPost = {
  user: (parent: SavedPostModel, _args: unknown, ctx: Context) =>
    resolveSavedPostUser(ctx.prisma, parent.userId),
  post: (parent: SavedPostModel, _args: unknown, ctx: Context) =>
    resolveSavedPostPost(ctx.prisma, parent.postId),
};

export const Query = {
  mySavedPosts: (_parent: unknown, args: { limit?: number; offset?: number }, ctx: Context) =>
    getMySavedPosts(ctx.prisma, ctx.userId, args),
};

export const Mutation = {
  toggleSavePost: (_parent: unknown, { postId }: { postId: string }, ctx: Context) =>
    toggleSavePost(ctx.prisma, ctx.userId, postId),
};
