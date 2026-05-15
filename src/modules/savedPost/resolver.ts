import type { Context } from "@graphql-prisma-api/types/context.js";
import type { Parent, PaginationArgs } from "@graphql-prisma-api/types/graphql.js";
import { requireAuth } from "@graphql-prisma-api/utils/errors.js";

export const SavedPostResolver = {
  user: (parent: Parent, _args: unknown, ctx: Context) =>
    ctx.prisma.user.findUnique({ where: { id: parent.userId as string } }),
  post: (parent: Parent, _args: unknown, ctx: Context) =>
    ctx.prisma.post.findUnique({ where: { id: parent.postId as string } }),
};

export const SavedPostQueries = {
  mySavedPosts: (_parent: unknown, args: PaginationArgs, ctx: Context) => {
    requireAuth(ctx.userId);
    return ctx.prisma.savedPost.findMany({
      where: { userId: ctx.userId! },
      take: args.limit ?? 20,
      skip: args.offset ?? 0,
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
