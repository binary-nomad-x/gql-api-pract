import type { PrismaClient, Prisma } from "@prisma/client";
import type { CreatePostInput, UpdatePostInput, CreateCommentInput, CreateCategoryInput, PostFilterInput } from "@gql-prisma-api/modules/blog/inputs.js";
import { requireAuth, requireOwner } from "@gql-prisma-api/utils/errors.js";
import { triggerNovuWorkflow } from "@gql-prisma-api/utils/novu.js";
import { logger } from "@gql-prisma-api/utils/logger.js";

export async function createPost(
  prisma: PrismaClient,
  userId: string | undefined,
  input: CreatePostInput,
) {
  requireAuth(userId);
  const post = await prisma.post.create({
    data: {
      title: input.title,
      content: input.content ?? null,
      published: input.published ?? false,
      authorId: userId!,
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
  logger.info("Post created", { postId: post.id, authorId: userId! });
  return post;
}

export async function updatePost(
  prisma: PrismaClient,
  userId: string | undefined,
  id: string,
  input: UpdatePostInput,
) {
  const post = await prisma.post.findUnique({ where: { id } });
  if (!post) throw new Error("Post not found");
  requireOwner(post.authorId, userId);
  const { clean } = await import("@gql-prisma-api/utils/clean.js");
  const data: Prisma.PostUpdateInput = clean(input as unknown as Record<string, unknown>) as Prisma.PostUpdateInput;
  return prisma.post.update({ where: { id }, data });
}

export async function deletePost(
  prisma: PrismaClient,
  userId: string | undefined,
  id: string,
) {
  const post = await prisma.post.findUnique({ where: { id } });
  if (!post) throw new Error("Post not found");
  requireOwner(post.authorId, userId);
  await prisma.post.delete({ where: { id } });
  logger.info("Post deleted", { postId: id });
  return true;
}

export async function publishPost(
  prisma: PrismaClient,
  userId: string | undefined,
  id: string,
) {
  const post = await prisma.post.findUnique({ where: { id } });
  if (!post) throw new Error("Post not found");
  requireOwner(post.authorId, userId);
  const updated = await prisma.post.update({ where: { id }, data: { published: true } });
  await triggerNovuWorkflow(post.authorId, "post-published", { postId: id, postTitle: updated.title });
  return updated;
}

export async function unpublishPost(
  prisma: PrismaClient,
  userId: string | undefined,
  id: string,
) {
  const post = await prisma.post.findUnique({ where: { id } });
  if (!post) throw new Error("Post not found");
  requireOwner(post.authorId, userId);
  return prisma.post.update({ where: { id }, data: { published: false } });
}

export function createTag(prisma: PrismaClient, name: string) {
  return prisma.tag.upsert({ where: { name }, update: {}, create: { name } });
}

export function createCategory(prisma: PrismaClient, input: CreateCategoryInput) {
  return prisma.category.upsert({
    where: { slug: input.slug },
    update: { name: input.name, description: input.description ?? null },
    create: input,
  });
}

export async function createComment(
  prisma: PrismaClient,
  userId: string | undefined,
  input: CreateCommentInput,
) {
  requireAuth(userId);
  const post = await prisma.post.findUnique({ where: { id: input.postId } });
  if (!post) throw new Error("Post not found");
  const comment = await prisma.comment.create({
    data: { content: input.content, authorId: userId!, postId: input.postId },
  });
  if (post.authorId !== userId) {
    await triggerNovuWorkflow(post.authorId, "comment-on-post", { postId: input.postId, commentId: comment.id, commenterId: userId! });
  }
  logger.info("Comment created", { commentId: comment.id, postId: input.postId, authorId: userId! });
  return comment;
}

export async function deleteComment(
  prisma: PrismaClient,
  userId: string | undefined,
  id: string,
) {
  requireAuth(userId);
  const comment = await prisma.comment.findUnique({ where: { id } });
  if (!comment) throw new Error("Comment not found");
  requireOwner(comment.authorId, userId);
  await prisma.comment.delete({ where: { id } });
  return true;
}

export async function toggleLike(
  prisma: PrismaClient,
  userId: string | undefined,
  postId: string,
) {
  requireAuth(userId);
  const existing = await prisma.like.findUnique({
    where: { userId_postId: { userId: userId!, postId } },
  });
  if (existing) {
    await prisma.like.delete({ where: { id: existing.id } });
    return existing;
  }
  return prisma.like.create({ data: { userId: userId!, postId } });
}

export function getPosts(
  prisma: PrismaClient,
  args: PostFilterInput,
) {
  const conditions: Prisma.PostWhereInput[] = [];

  if (args.published !== undefined) {
    conditions.push({ published: args.published });
  }

  if (args.search) {
    conditions.push({
      OR: [
        { title: { contains: args.search, mode: "insensitive" } },
        { content: { contains: args.search, mode: "insensitive" } },
      ],
    });
  }

  const where: Prisma.PostWhereInput = conditions.length > 0 ? { AND: conditions } : {};

  return prisma.post.findMany({
    where,
    take: args.limit ?? 10,
    skip: args.offset ?? 0,
    orderBy: { createdAt: "desc" },
  });
}

export function getPost(prisma: PrismaClient, id: string) {
  return prisma.post.findUnique({ where: { id } });
}
