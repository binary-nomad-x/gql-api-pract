import type { Context } from "@/types/context.js";
import type { Parent } from "@/types/graphql.js";

export const PostViewResolver = {
  post: (parent: Parent, _args: unknown, ctx: Context) =>
    ctx.prisma.post.findUnique({ where: { id: parent.postId as string } }),
  user: (parent: Parent, _args: unknown, ctx: Context) =>
    parent.userId ? ctx.prisma.user.findUnique({ where: { id: parent.userId as string } }) : null,
};

export const PostViewMutations = {
  recordPostView: (_parent: unknown, { postId }: { postId: string }, ctx: Context) =>
    ctx.prisma.postView.create({ data: { postId, userId: ctx.userId } }),
};
