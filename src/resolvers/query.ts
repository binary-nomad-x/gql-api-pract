import { Context } from "../context.js";

export const Query = {
  // Users
  users: async (_parent: unknown, _args: unknown, ctx: Context) => {
    return ctx.prisma.user.findMany({
      include: { profile: true, posts: true },
    });
  },

  user: async (_parent: unknown, { id }: { id: string }, ctx: Context) => {
    return ctx.prisma.user.findUnique({
      where: { id },
      include: { profile: true, posts: true },
    });
  },

  me: async (_parent: unknown, _args: unknown, ctx: Context) => {
    if (!ctx.userId) return null;
    return ctx.prisma.user.findUnique({
      where: { id: ctx.userId },
      include: { profile: true, posts: true },
    });
  },

  // Posts
  posts: async (
    _parent: unknown,
    {
      published,
      search,
      limit,
      offset,
    }: { published?: boolean; search?: string; limit: number; offset: number },
    ctx: Context,
  ) => {
    const where: any = {};

    if (published !== undefined) {
      where.published = published;
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { content: { contains: search, mode: "insensitive" } },
      ];
    }

    return ctx.prisma.post.findMany({
      where,
      take: limit,
      skip: offset,
      include: { author: true, tags: true },
      orderBy: { createdAt: "desc" },
    });
  },

  post: async (_parent: unknown, { id }: { id: string }, ctx: Context) => {
    return ctx.prisma.post.findUnique({
      where: { id },
      include: { author: true, tags: true },
    });
  },

  // Tags
  tags: async (_parent: unknown, _args: unknown, ctx: Context) => {
    return ctx.prisma.tag.findMany({
      include: { posts: true },
    });
  },

  tag: async (_parent: unknown, { id }: { id: string }, ctx: Context) => {
    return ctx.prisma.tag.findUnique({
      where: { id },
      include: { posts: true },
    });
  },

  tagByName: async (
    _parent: unknown,
    { name }: { name: string },
    ctx: Context,
  ) => {
    return ctx.prisma.tag.findUnique({
      where: { name },
      include: { posts: true },
    });
  },

  // Stats
  stats: async (_parent: unknown, _args: unknown, ctx: Context) => {
    const [totalUsers, totalPosts, totalPublishedPosts, totalTags] =
      await Promise.all([
        ctx.prisma.user.count(),
        ctx.prisma.post.count(),
        ctx.prisma.post.count({ where: { published: true } }),
        ctx.prisma.tag.count(),
      ]);

    return { totalUsers, totalPosts, totalPublishedPosts, totalTags };
  },
};
