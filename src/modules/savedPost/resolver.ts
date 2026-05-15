import type { Context } from "../../types/context.js";
import { requireAuth } from "../../utils/errors.js";

export const SavedPostResolver = {
  user: (parent: any, _args: unknown, ctx: Context) =>
    ctx.prisma.user.findUnique({ where: { id: parent.userId } }),
  post: (parent: any, _args: unknown, ctx: Context) =>
    ctx.prisma.post.findUnique({ where: { id: parent.postId } }),
};

export const SavedPostQueries = {
  mySavedPosts: (_parent: unknown, { limit = 20, offset = 0 }: any, ctx: Context) => {
    requireAuth(ctx.userId);
    return ctx.prisma.savedPost.findMany({
      where: { userId: ctx.userId! },
      take: limit, skip: offset,
      orderBy: { createdAt: "desc" },
    });
  },
};

export const SavedPostMutations = {
  toggleSavePost: async (_parent: unknown, { postId }: { postId: string }, ctx: Context) => {
    requireAuth(ctx.userId);
    const existing = await ctx.prisma.savedPost.findUnique({
      where: { userId_postId: { userId: ctx.userId!, postId } },
    });
    if (existing) {
      await ctx.prisma.savedPost.delete({ where: { id: existing.id } });
      return existing;
    }
    return ctx.prisma.savedPost.create({ data: { userId: ctx.userId!, postId } });
  },
};
