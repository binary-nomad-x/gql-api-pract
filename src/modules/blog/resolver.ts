import type { Context } from "../../types/context.js";
import { requireAuth, requireOwner } from "../../utils/errors.js";

export const PostResolver = {
  author: (parent: any, _args: unknown, ctx: Context) =>
    ctx.prisma.user.findUnique({ where: { id: parent.authorId } }),
  tags: (parent: any, _args: unknown, ctx: Context) =>
    ctx.prisma.tag.findMany({ where: { posts: { some: { id: parent.id } } } }),
  categories: (parent: any, _args: unknown, ctx: Context) =>
    ctx.prisma.category.findMany({ where: { posts: { some: { id: parent.id } } } }),
  comments: (parent: any, _args: unknown, ctx: Context) =>
    ctx.prisma.comment.findMany({ where: { postId: parent.id } }),
  likes: (parent: any, _args: unknown, ctx: Context) =>
    ctx.prisma.like.findMany({ where: { postId: parent.id } }),
  savedBy: (parent: any, _args: unknown, ctx: Context) =>
    ctx.prisma.savedPost.findMany({ where: { postId: parent.id } }),
  views: (parent: any, _args: unknown, ctx: Context) =>
    ctx.prisma.postView.findMany({ where: { postId: parent.id } }),
  likeCount: (parent: any, _args: unknown, ctx: Context) =>
    ctx.prisma.like.count({ where: { postId: parent.id } }),
  commentCount: (parent: any, _args: unknown, ctx: Context) =>
    ctx.prisma.comment.count({ where: { postId: parent.id } }),
  viewCount: (parent: any, _args: unknown, ctx: Context) =>
    ctx.prisma.postView.count({ where: { postId: parent.id } }),
  saveCount: (parent: any, _args: unknown, ctx: Context) =>
    ctx.prisma.savedPost.count({ where: { postId: parent.id } }),
};

export const PostQueries = {
  posts: async (
    _parent: unknown,
    { published, search, limit = 10, offset = 0 }: any,
    ctx: Context,
  ) => {
    const where: any = {};
    if (published !== undefined) where.published = published;
    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { content: { contains: search, mode: "insensitive" } },
      ];
    }
    return ctx.prisma.post.findMany({ where, take: limit, skip: offset, orderBy: { createdAt: "desc" } });
  },

  post: (_parent: unknown, { id }: { id: string }, ctx: Context) =>
    ctx.prisma.post.findUnique({ where: { id } }),
};

export const PostMutations = {
  createPost: async (_parent: unknown, { input }: any, ctx: Context) => {
    requireAuth(ctx.userId);
    const { tags = [], categories: categorySlugs = [], ...data } = input;
    return ctx.prisma.post.create({
      data: {
        ...data,
        published: data.published ?? false,
        authorId: ctx.userId!,
        tags: { connectOrCreate: tags.map((t: string) => ({ where: { name: t }, create: { name: t } })) },
        categories: { connect: categorySlugs.map((s: string) => ({ slug: s })) },
      },
    });
  },

  updatePost: async (_parent: unknown, { id, input }: any, ctx: Context) => {
    const post = await ctx.prisma.post.findUnique({ where: { id } });
    if (!post) throw new Error("Post not found");
    requireOwner(post.authorId, ctx.userId);
    return ctx.prisma.post.update({ where: { id }, data: input });
  },

  deletePost: async (_parent: unknown, { id }: any, ctx: Context) => {
    const post = await ctx.prisma.post.findUnique({ where: { id } });
    if (!post) throw new Error("Post not found");
    requireOwner(post.authorId, ctx.userId);
    await ctx.prisma.post.delete({ where: { id } });
    return true;
  },

  publishPost: async (_parent: unknown, { id }: any, ctx: Context) => {
    const post = await ctx.prisma.post.findUnique({ where: { id } });
    if (!post) throw new Error("Post not found");
    requireOwner(post.authorId, ctx.userId);
    return ctx.prisma.post.update({ where: { id }, data: { published: true } });
  },

  unpublishPost: async (_parent: unknown, { id }: any, ctx: Context) => {
    const post = await ctx.prisma.post.findUnique({ where: { id } });
    if (!post) throw new Error("Post not found");
    requireOwner(post.authorId, ctx.userId);
    return ctx.prisma.post.update({ where: { id }, data: { published: false } });
  },

  createTag: (_parent: unknown, { name }: any, ctx: Context) =>
    ctx.prisma.tag.upsert({ where: { name }, update: {}, create: { name } }),

  createCategory: (_parent: unknown, { input }: any, ctx: Context) =>
    ctx.prisma.category.upsert({
      where: { slug: input.slug },
      update: { name: input.name, description: input.description },
      create: input,
    }),

  createComment: async (_parent: unknown, { input }: any, ctx: Context) => {
    requireAuth(ctx.userId);
    const post = await ctx.prisma.post.findUnique({ where: { id: input.postId } });
    if (!post) throw new Error("Post not found");
    return ctx.prisma.comment.create({
      data: { content: input.content, authorId: ctx.userId!, postId: input.postId },
    });
  },

  deleteComment: async (_parent: unknown, { id }: any, ctx: Context) => {
    requireAuth(ctx.userId);
    const comment = await ctx.prisma.comment.findUnique({ where: { id } });
    if (!comment) throw new Error("Comment not found");
    requireOwner(comment.authorId, ctx.userId);
    await ctx.prisma.comment.delete({ where: { id } });
    return true;
  },

  toggleLike: async (_parent: unknown, { postId }: any, ctx: Context) => {
    requireAuth(ctx.userId);
    const existing = await ctx.prisma.like.findUnique({
      where: { userId_postId: { userId: ctx.userId!, postId } },
    });
    if (existing) {
      await ctx.prisma.like.delete({ where: { id: existing.id } });
      return existing;
    }
    return ctx.prisma.like.create({ data: { userId: ctx.userId!, postId } });
  },
};

export const TagResolver = {
  postCount: (parent: any, _args: unknown, ctx: Context) =>
    ctx.prisma.post.count({ where: { tags: { some: { id: parent.id } } } }),
};

export const CategoryResolver = {
  postCount: (parent: any, _args: unknown, ctx: Context) =>
    ctx.prisma.post.count({ where: { categories: { some: { id: parent.id } } } }),
  productCount: (parent: any, _args: unknown, ctx: Context) =>
    ctx.prisma.product.count({ where: { categoryId: parent.id } }),
};
