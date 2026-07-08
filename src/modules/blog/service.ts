import type { Prisma } from "@prisma/client";
import type { CreatePostInput, UpdatePostInput, CreateCommentInput, CreateCategoryInput, PostFilterInput } from "./inputs.js";
import { requireAuth, requireOwner } from "@gql-prisma-api/utils/errors.js";
import { triggerNovuWorkflow } from "@gql-prisma-api/utils/novu.js";
import { logger } from "@gql-prisma-api/utils/logger.js";
import { BaseService } from "@gql-prisma-api/lib/BaseService.js";

export class BlogService extends BaseService {
  // --- Type-field resolver functions ---
  resolvePostAuthor(authorId: string) {
    return this.core.user.findUnique({ where: { id: authorId } });
  }

  resolvePostTags(postId: string) {
    return this.core.tag.findMany({ where: { posts: { some: { id: postId } } } });
  }

  resolvePostCategories(postId: string) {
    return this.core.category.findMany({ where: { posts: { some: { id: postId } } } });
  }

  resolvePostComments(postId: string) {
    return this.core.comment.findMany({ where: { postId } });
  }

  resolvePostLikes(postId: string) {
    return this.core.like.findMany({ where: { postId } });
  }

  resolvePostSavedBy(postId: string) {
    return this.core.savedPost.findMany({ where: { postId } });
  }

  resolvePostViews(postId: string) {
    return this.core.postView.findMany({ where: { postId } });
  }

  resolvePostLikeCount(postId: string) {
    return this.core.like.count({ where: { postId } });
  }

  resolvePostCommentCount(postId: string) {
    return this.core.comment.count({ where: { postId } });
  }

  resolvePostViewCount(postId: string) {
    return this.core.postView.count({ where: { postId } });
  }

  resolvePostSaveCount(postId: string) {
    return this.core.savedPost.count({ where: { postId } });
  }

  resolveTagPostCount(tagId: string) {
    return this.core.post.count({ where: { tags: { some: { id: tagId } } } });
  }

  resolveCategoryPosts(categoryId: string) {
    return this.core.post.findMany({ where: { categories: { some: { id: categoryId } } } });
  }

  resolveCategoryProducts(categoryId: string) {
    return this.core.product.findMany({ where: { categoryId } });
  }

  resolveCategoryPostCount(categoryId: string) {
    return this.core.post.count({ where: { categories: { some: { id: categoryId } } } });
  }

  resolveCategoryProductCount(categoryId: string) {
    return this.core.product.count({ where: { categoryId } });
  }

  // --- Existing business logic functions ---
  async createPost(
    userId: string | undefined,
    input: CreatePostInput,
  ) {
    requireAuth(userId);
    const post = await this.core.post.create({
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

  async updatePost(
    userId: string | undefined,
    id: string,
    input: UpdatePostInput,
  ) {
    const post = await this.core.post.findUnique({ where: { id } });
    if (!post) throw new Error("Post not found");
    requireOwner(post.authorId, userId);
    const { clean } = await import("@gql-prisma-api/utils/clean.js");
    const data: Prisma.PostUpdateInput = clean(input as unknown as Record<string, unknown>) as Prisma.PostUpdateInput;
    return this.core.post.update({ where: { id }, data });
  }

  async deletePost(
    userId: string | undefined,
    id: string,
  ) {
    const post = await this.core.post.findUnique({ where: { id } });
    if (!post) throw new Error("Post not found");
    requireOwner(post.authorId, userId);
    await this.core.post.delete({ where: { id } });
    logger.info("Post deleted", { postId: id });
    return true;
  }

  async publishPost(
    userId: string | undefined,
    id: string,
  ) {
    const post = await this.core.post.findUnique({ where: { id } });
    if (!post) throw new Error("Post not found");
    requireOwner(post.authorId, userId);
    const updated = await this.core.post.update({ where: { id }, data: { published: true } });
    await triggerNovuWorkflow(post.authorId, "post-published", { postId: id, postTitle: updated.title });
    return updated;
  }

  async unpublishPost(
    userId: string | undefined,
    id: string,
  ) {
    const post = await this.core.post.findUnique({ where: { id } });
    if (!post) throw new Error("Post not found");
    requireOwner(post.authorId, userId);
    return this.core.post.update({ where: { id }, data: { published: false } });
  }

  createTag(name: string) {
    return this.core.tag.upsert({ where: { name }, update: {}, create: { name } });
  }

  createCategory(input: CreateCategoryInput) {
    return this.core.category.upsert({
      where: { slug: input.slug },
      update: { name: input.name, description: input.description ?? null },
      create: input,
    });
  }

  async createComment(
    userId: string | undefined,
    input: CreateCommentInput,
  ) {
    requireAuth(userId);
    const post = await this.core.post.findUnique({ where: { id: input.postId } });
    if (!post) throw new Error("Post not found");
    const comment = await this.core.comment.create({
      data: { content: input.content, authorId: userId!, postId: input.postId },
    });
    if (post.authorId !== userId) {
      await triggerNovuWorkflow(post.authorId, "comment-on-post", { postId: input.postId, commentId: comment.id, commenterId: userId! });
    }
    logger.info("Comment created", { commentId: comment.id, postId: input.postId, authorId: userId! });
    return comment;
  }

  async deleteComment(
    userId: string | undefined,
    id: string,
  ) {
    requireAuth(userId);
    const comment = await this.core.comment.findUnique({ where: { id } });
    if (!comment) throw new Error("Comment not found");
    requireOwner(comment.authorId, userId);
    await this.core.comment.delete({ where: { id } });
    return true;
  }

  async toggleLike(
    userId: string | undefined,
    postId: string,
  ) {
    requireAuth(userId);
    const existing = await this.core.like.findUnique({
      where: { userId_postId: { userId: userId!, postId } },
    });
    if (existing) {
      await this.core.like.delete({ where: { id: existing.id } });
      return existing;
    }
    return this.core.like.create({ data: { userId: userId!, postId } });
  }

  getPosts(
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

    return this.core.post.findMany({
      where,
      take: args.limit ?? 10,
      skip: args.offset ?? 0,
      orderBy: { createdAt: "desc" },
    });
  }

  getPost(id: string) {
    return this.core.post.findUnique({ where: { id } });
  }
}
