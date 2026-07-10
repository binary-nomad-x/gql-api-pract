import type { Context } from "@gql-prisma-api/types/context.js";
import type { PostView as PostViewModel } from "@prisma/client";

export const PostView = {
  post: (parent: PostViewModel, _args: unknown, ctx: Context) =>
    ctx.services.postView.resolvePostViewPost(parent.postId),
  user: (parent: PostViewModel, _args: unknown, ctx: Context) =>
    ctx.services.postView.resolvePostViewUser(parent.userId),
};

export const Mutation = {
  recordPostView: (_parent: unknown, { postId }: { postId: string }, ctx: Context) =>
    ctx.services.postView.recordPostView(postId, ctx.userId),
};
