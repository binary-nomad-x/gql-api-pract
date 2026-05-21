import type { Context } from "@gql-prisma-api/types/context.js";
import type { Parent, PaginationArgs } from "@gql-prisma-api/types/graphql.js";
import { toggleSavePost, getMySavedPosts } from "./service.js";

export const SavedPostResolver = {
  user: (parent: Parent, _args: unknown, ctx: Context) =>
    ctx.prisma.user.findUnique({ where: { id: parent.userId as string } }),
  post: (parent: Parent, _args: unknown, ctx: Context) =>
    ctx.prisma.post.findUnique({ where: { id: parent.postId as string } }),
};

export const SavedPostQueries = {
  mySavedPosts: (_parent: unknown, args: PaginationArgs, ctx: Context) =>
    getMySavedPosts(ctx.prisma, ctx.userId, args),
};

export const SavedPostMutations = {
  toggleSavePost: async (_parent: unknown, { postId }: { postId: string }, ctx: Context) =>
    toggleSavePost(ctx.prisma, ctx.userId, postId),
};
