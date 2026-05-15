import type { Context } from "../../types/context.js";
import type { Parent, IdArg, PostFilterArgs } from "../../types/graphql.js";
import type { CreatePostInput, UpdatePostInput, CreateCommentInput, CreateCategoryInput } from "../../types/inputs.js";
import { requireAuth, requireOwner } from "../../utils/errors.js";
import { clean } from "../../utils/clean.js";

export const PostResolver = {
  author: (parent: Parent, _args: unknown, ctx: Context) =>
    ctx.prisma.user.findUnique({ where: { id: parent.authorId as string } }),
  tags: (parent: Parent, _args: unknown, ctx: Context) =>
    ctx.prisma.tag.findMany({ where: { posts: { some: { id: parent.id } } } }),
  categories: (parent: Parent, _args: unknown, ctx: Context) =>
    ctx.prisma.category.findMany({ where: { posts: { some: { id: parent.id } } } }),
  comments: (parent: Parent, _args: unknown, ctx: Context) =>
    ctx.prisma.comment.findMany({ where: { postId: parent.id } }),
  likes: (parent: Parent, _args: unknown, ctx: Context) =>
    ctx.prisma.like.findMany({ where: { postId: parent.id } }),
  savedBy: (parent: Parent, _args: unknown, ctx: Context) =>
    ctx.prisma.savedPost.findMany({ where: { postId: parent.id } }),
  views: (parent: Parent, _args: unknown, ctx: Context) =>
    ctx.prisma.postView.findMany({ where: { postId: parent.id } }),
  likeCount: (parent: Parent, _args: unknown, ctx: Context) =>
    ctx.prisma.like.count({ where: { postId: parent.id } }),
  commentCount: (parent: Parent, _args: unknown, ctx: Context) =>
    ctx.prisma.comment.count({ where: { postId: parent.id } }),
  viewCount: (parent: Parent, _args: unknown, ctx: Context) =>
    ctx.prisma.postView.count({ where: { postId: parent.id } }),
  saveCount: (parent: Parent, _args: unknown, ctx: Context) =>
    ctx.prisma.savedPost.count({ where: { postId: parent.id } }),
};

export const PostQueries = {
  posts: async (_parent: unknown, args: PostFilterArgs, ctx: Context) => {
    const where: Record<string, unknown> = {};
    if (args.published !== undefined) where.published = args.published;
    if (args.search) {
      where.OR = [
        { title: { contains: args.search, mode: "insensitive" } },
        { content: { contains: args.search, mode: "insensitive" } },
      ];
    }
    return ctx.prisma.post.findMany({
      where,
      take: args.limit ?? 10,
      skip: args.offset ?? 0,
      orderBy: { createdAt: "desc" },
    });
  },

  post: (_parent: unknown, { id }: IdArg, ctx: Context) =>
    ctx.prisma.post.findUnique({ where: { id } }),
};

export const PostMutations = {
  createPost: async (_parent: unknown, { input }: { input: CreatePostInput }, ctx: Context) => {
    requireAuth(ctx.userId);
    return ctx.prisma.post.create({
      data: {
        title: input.title,
        content: input.content ?? null,
        published: input.published ?? false,
        authorId: ctx.userId!,
        tags: {
          connectOrCreate: (input.tags ?? []).map((t: string) => ({
            where: { name: t },
            create: { name: t },
          })),
        },
        categories: {
          connect: (input.categories ?? []).map((s: string) => ({ slug: s })),
        },
      },
    });
  },

  updatePost: async (_parent: unknown, { id, input }: { id: string; input: UpdatePostInput }, ctx: Context) => {
    const post = await ctx.prisma.post.findUnique({ where: { id } });
    if (!post) throw new Error("Post not found");
    requireOwner(post.authorId, ctx.userId);
    return ctx.prisma.post.update({ where: { id }, data: clean(input as any) });
  },

  deletePost: async (_parent: unknown, { id }: IdArg, ctx: Context) => {
    const post = await ctx.prisma.post.findUnique({ where: { id } });
    if (!post) throw new Error("Post not found");
    requireOwner(post.authorId, ctx.userId);
    await ctx.prisma.post.delete({ where: { id } });
    return true;
  },

  publishPost: async (_parent: unknown, { id }: IdArg, ctx: Context) => {
    const post = await ctx.prisma.post.findUnique({ where: { id } });
    if (!post) throw new Error("Post not found");
    requireOwner(post.authorId, ctx.userId);
    return ctx.prisma.post.update({ where: { id }, data: { published: true } });
  },

  unpublishPost: async (_parent: unknown, { id }: IdArg, ctx: Context) => {
    const post = await ctx.prisma.post.findUnique({ where: { id } });
    if (!post) throw new Error("Post not found");
    requireOwner(post.authorId, ctx.userId);
    return ctx.prisma.post.update({ where: { id }, data: { published: false } });
  },

  createTag: (_parent: unknown, { name }: { name: string }, ctx: Context) =>
    ctx.prisma.tag.upsert({ where: { name }, update: {}, create: { name } }),

  createCategory: (_parent: unknown, { input }: { input: CreateCategoryInput }, ctx: Context) =>
    ctx.prisma.category.upsert({
      where: { slug: input.slug },
      update: { name: input.name, description: input.description ?? null },
      create: input,
    }),

  createComment: async (_parent: unknown, { input }: { input: CreateCommentInput }, ctx: Context) => {
    requireAuth(ctx.userId);
    const post = await ctx.prisma.post.findUnique({ where: { id: input.postId } });
    if (!post) throw new Error("Post not found");
    return ctx.prisma.comment.create({
      data: { content: input.content, authorId: ctx.userId!, postId: input.postId },
    });
  },

  deleteComment: async (_parent: unknown, { id }: IdArg, ctx: Context) => {
    requireAuth(ctx.userId);
    const comment = await ctx.prisma.comment.findUnique({ where: { id } });
    if (!comment) throw new Error("Comment not found");
    requireOwner(comment.authorId, ctx.userId);
    await ctx.prisma.comment.delete({ where: { id } });
    return true;
  },

  toggleLike: async (_parent: unknown, { postId }: { postId: string }, ctx: Context) => {
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
  postCount: (parent: Parent, _args: unknown, ctx: Context) =>
    ctx.prisma.post.count({ where: { tags: { some: { id: parent.id } } } }),
};

export const CategoryResolver = {
  posts: (parent: Parent, _args: unknown, ctx: Context) =>
    ctx.prisma.post.findMany({ where: { categories: { some: { id: parent.id } } } }),
  products: (parent: Parent, _args: unknown, ctx: Context) =>
    ctx.prisma.product.findMany({ where: { categoryId: parent.id } }),
  postCount: (parent: Parent, _args: unknown, ctx: Context) =>
    ctx.prisma.post.count({ where: { categories: { some: { id: parent.id } } } }),
  productCount: (parent: Parent, _args: unknown, ctx: Context) =>
    ctx.prisma.product.count({ where: { categoryId: parent.id } }),
};
