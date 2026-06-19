import type { Context } from "@gql-prisma-api/types/context.js";
import type { PostView as PostViewModel } from "@prisma/client";
import { resolvePostViewPost, resolvePostViewUser, recordPostView } from "./service.js";

export const PostView = {
  post: (parent: PostViewModel, _args: unknown, ctx: Context) =>
    resolvePostViewPost(ctx.prisma, parent.postId),
  user: (parent: PostViewModel, _args: unknown, ctx: Context) =>
    resolvePostViewUser(ctx.prisma, parent.userId),
};

export const Mutation = {
  recordPostView: (_parent: unknown, { postId }: { postId: string }, ctx: Context) =>
    recordPostView(ctx.prisma, postId, ctx.userId),
};
