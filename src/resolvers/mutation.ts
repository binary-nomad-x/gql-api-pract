import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { Context } from "../context.js";

const JWT_SECRET = process.env.JWT_SECRET || "secret";

export const Mutation = {
  // Auth
  signup: async (_parent: unknown, { input }: any, ctx: Context) => {
    const { email, name, password } = input;

    const existingUser = await ctx.prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      throw new Error("User already exists");
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await ctx.prisma.user.create({
      data: {
        email,
        name,
        password: hashedPassword,
      },
    });

    const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, {
      expiresIn: "7d",
    });

    return { token, user };
  },

  login: async (_parent: unknown, { email, password }: any, ctx: Context) => {
    const user = await ctx.prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new Error("User not found");
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      throw new Error("Invalid password");
    }

    const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, {
      expiresIn: "7d",
    });

    return { token, user };
  },

  // Users
  updateUser: async (_parent: unknown, { id, input }: any, ctx: Context) => {
    if (ctx.userId !== id) {
      throw new Error("Not authorized");
    }

    const data: any = {};
    if (input.name) data.name = input.name;
    if (input.email) data.email = input.email;
    if (input.password) data.password = await bcrypt.hash(input.password, 10);

    return ctx.prisma.user.update({
      where: { id },
      data,
    });
  },

  deleteUser: async (_parent: unknown, { id }: any, ctx: Context) => {
    if (ctx.userId !== id) {
      throw new Error("Not authorized");
    }

    await ctx.prisma.user.delete({ where: { id } });
    return true;
  },

  // Profile
  updateProfile: async (_parent: unknown, input: any, ctx: Context) => {
    if (!ctx.userId) {
      throw new Error("Not authenticated");
    }

    const profile = await ctx.prisma.profile.upsert({
      where: { userId: ctx.userId },
      update: input,
      create: { userId: ctx.userId, ...input },
    });

    return profile;
  },

  // Posts
  createPost: async (_parent: unknown, { input }: any, ctx: Context) => {
    if (!ctx.userId) {
      throw new Error("Not authenticated");
    }

    const { tags = [], categories: categorySlugs = [], ...postData } = input;

    const post = await ctx.prisma.post.create({
      data: {
        ...postData,
        published: postData.published ?? false,
        authorId: ctx.userId,
        tags: {
          connectOrCreate: tags.map((tagName: string) => ({
            where: { name: tagName },
            create: { name: tagName },
          })),
        },
        categories: {
          connect: categorySlugs.map((slug: string) => ({ slug })),
        },
      },
      include: { tags: true, author: true, categories: true },
    });

    return post;
  },

  updatePost: async (_parent: unknown, { id, input }: any, ctx: Context) => {
    const post = await ctx.prisma.post.findUnique({ where: { id } });
    if (!post) throw new Error("Post not found");
    if (post.authorId !== ctx.userId) throw new Error("Not authorized");

    return ctx.prisma.post.update({
      where: { id },
      data: input,
      include: { tags: true, author: true },
    });
  },

  deletePost: async (_parent: unknown, { id }: any, ctx: Context) => {
    const post = await ctx.prisma.post.findUnique({ where: { id } });
    if (!post) throw new Error("Post not found");
    if (post.authorId !== ctx.userId) throw new Error("Not authorized");

    await ctx.prisma.post.delete({ where: { id } });
    return true;
  },

  publishPost: async (_parent: unknown, { id }: any, ctx: Context) => {
    const post = await ctx.prisma.post.findUnique({ where: { id } });
    if (!post) throw new Error("Post not found");
    if (post.authorId !== ctx.userId) throw new Error("Not authorized");

    return ctx.prisma.post.update({
      where: { id },
      data: { published: true },
      include: { tags: true, author: true },
    });
  },

  unpublishPost: async (_parent: unknown, { id }: any, ctx: Context) => {
    const post = await ctx.prisma.post.findUnique({ where: { id } });
    if (!post) throw new Error("Post not found");
    if (post.authorId !== ctx.userId) throw new Error("Not authorized");

    return ctx.prisma.post.update({
      where: { id },
      data: { published: false },
      include: { tags: true, author: true },
    });
  },

  // Tags
  createTag: async (_parent: unknown, { name }: any, ctx: Context) => {
    return ctx.prisma.tag.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  },

  // Categories
  createCategory: async (_parent: unknown, { input }: any, ctx: Context) => {
    if (!ctx.userId) throw new Error("Not authenticated");

    return ctx.prisma.category.upsert({
      where: { slug: input.slug },
      update: { name: input.name, description: input.description },
      create: {
        name: input.name,
        slug: input.slug,
        description: input.description,
      },
    });
  },

  // Comments
  createComment: async (_parent: unknown, { input }: any, ctx: Context) => {
    if (!ctx.userId) throw new Error("Not authenticated");

    const post = await ctx.prisma.post.findUnique({
      where: { id: input.postId },
    });
    if (!post) throw new Error("Post not found");

    return ctx.prisma.comment.create({
      data: {
        content: input.content,
        authorId: ctx.userId,
        postId: input.postId,
      },
      include: { author: true, post: true },
    });
  },

  deleteComment: async (_parent: unknown, { id }: any, ctx: Context) => {
    if (!ctx.userId) throw new Error("Not authenticated");

    const comment = await ctx.prisma.comment.findUnique({ where: { id } });
    if (!comment) throw new Error("Comment not found");
    if (comment.authorId !== ctx.userId) throw new Error("Not authorized");

    await ctx.prisma.comment.delete({ where: { id } });
    return true;
  },

  // Likes
  toggleLike: async (_parent: unknown, { postId }: any, ctx: Context) => {
    if (!ctx.userId) throw new Error("Not authenticated");

    const existing = await ctx.prisma.like.findUnique({
      where: { userId_postId: { userId: ctx.userId, postId } },
    });

    if (existing) {
      await ctx.prisma.like.delete({ where: { id: existing.id } });
      return existing;
    }

    return ctx.prisma.like.create({
      data: { userId: ctx.userId, postId },
      include: { user: true, post: true },
    });
  },
};
