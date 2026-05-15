import type { Context } from "../../types/context.js";

export const PostViewResolver = {
  post: (parent: any, _args: unknown, ctx: Context) =>
    ctx.prisma.post.findUnique({ where: { id: parent.postId } }),
  user: (parent: any, _args: unknown, ctx: Context) =>
    parent.userId ? ctx.prisma.user.findUnique({ where: { id: parent.userId } }) : null,
};

export const PostViewMutations = {
  recordPostView: (_parent: unknown, { postId }: { postId: string }, ctx: Context) =>
    ctx.prisma.postView.create({
      data: { postId, userId: ctx.userId },
    }),
};
