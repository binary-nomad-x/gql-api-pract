import type { Context } from "@gql-prisma-api/types/context.js";
import type { Post as PostModel, Tag as TagModel, Category as CategoryModel } from "@prisma/client";
import type { IdArg, PostFilterArgs } from "@gql-prisma-api/types/graphql.js";
import type { CreatePostInput, UpdatePostInput, CreateCommentInput, CreateCategoryInput } from "./inputs.js";
import {
  createPost, updatePost, deletePost, publishPost, unpublishPost,
  createTag, createCategory, createComment, deleteComment, toggleLike,
  getPosts, getPost,
  resolvePostAuthor, resolvePostTags, resolvePostCategories, resolvePostComments,
  resolvePostLikes, resolvePostSavedBy, resolvePostViews, resolvePostLikeCount,
  resolvePostCommentCount, resolvePostViewCount, resolvePostSaveCount,
  resolveTagPostCount,
  resolveCategoryPosts, resolveCategoryProducts, resolveCategoryPostCount, resolveCategoryProductCount,
} from "./service.js";

export const Post = {
  author: (parent: PostModel, _args: unknown, ctx: Context) =>
    resolvePostAuthor(ctx.prisma, parent.authorId),
  tags: (parent: PostModel, _args: unknown, ctx: Context) =>
    resolvePostTags(ctx.prisma, parent.id),
  categories: (parent: PostModel, _args: unknown, ctx: Context) =>
    resolvePostCategories(ctx.prisma, parent.id),
  comments: (parent: PostModel, _args: unknown, ctx: Context) =>
    resolvePostComments(ctx.prisma, parent.id),
  likes: (parent: PostModel, _args: unknown, ctx: Context) =>
    resolvePostLikes(ctx.prisma, parent.id),
  savedBy: (parent: PostModel, _args: unknown, ctx: Context) =>
    resolvePostSavedBy(ctx.prisma, parent.id),
  views: (parent: PostModel, _args: unknown, ctx: Context) =>
    resolvePostViews(ctx.prisma, parent.id),
  likeCount: (parent: PostModel, _args: unknown, ctx: Context) =>
    resolvePostLikeCount(ctx.prisma, parent.id),
  commentCount: (parent: PostModel, _args: unknown, ctx: Context) =>
    resolvePostCommentCount(ctx.prisma, parent.id),
  viewCount: (parent: PostModel, _args: unknown, ctx: Context) =>
    resolvePostViewCount(ctx.prisma, parent.id),
  saveCount: (parent: PostModel, _args: unknown, ctx: Context) =>
    resolvePostSaveCount(ctx.prisma, parent.id),
};

export const Query = {
  posts: (_parent: unknown, args: PostFilterArgs, ctx: Context) =>
    getPosts(ctx.prisma, args),

  post: (_parent: unknown, { id }: IdArg, ctx: Context) =>
    getPost(ctx.prisma, id),
};

export const Mutation = {
  createPost: (_parent: unknown, { input }: { input: CreatePostInput }, ctx: Context) =>
    createPost(ctx.prisma, ctx.userId, input),

  updatePost: (_parent: unknown, { id, input }: { id: string; input: UpdatePostInput }, ctx: Context) =>
    updatePost(ctx.prisma, ctx.userId, id, input),

  deletePost: (_parent: unknown, { id }: IdArg, ctx: Context) =>
    deletePost(ctx.prisma, ctx.userId, id),

  publishPost: (_parent: unknown, { id }: IdArg, ctx: Context) =>
    publishPost(ctx.prisma, ctx.userId, id),

  unpublishPost: (_parent: unknown, { id }: IdArg, ctx: Context) =>
    unpublishPost(ctx.prisma, ctx.userId, id),

  createTag: (_parent: unknown, { name }: { name: string }, ctx: Context) =>
    createTag(ctx.prisma, name),

  createCategory: (_parent: unknown, { input }: { input: CreateCategoryInput }, ctx: Context) =>
    createCategory(ctx.prisma, input),

  createComment: (_parent: unknown, { input }: { input: CreateCommentInput }, ctx: Context) =>
    createComment(ctx.prisma, ctx.userId, input),

  deleteComment: (_parent: unknown, { id }: IdArg, ctx: Context) =>
    deleteComment(ctx.prisma, ctx.userId, id),

  toggleLike: (_parent: unknown, { postId }: { postId: string }, ctx: Context) =>
    toggleLike(ctx.prisma, ctx.userId, postId),
};

export const Tag = {
  postCount: (parent: TagModel, _args: unknown, ctx: Context) =>
    resolveTagPostCount(ctx.prisma, parent.id),
};

export const Category = {
  posts: (parent: CategoryModel, _args: unknown, ctx: Context) =>
    resolveCategoryPosts(ctx.prisma, parent.id),
  products: (parent: CategoryModel, _args: unknown, ctx: Context) =>
    resolveCategoryProducts(ctx.prisma, parent.id),
  postCount: (parent: CategoryModel, _args: unknown, ctx: Context) =>
    resolveCategoryPostCount(ctx.prisma, parent.id),
  productCount: (parent: CategoryModel, _args: unknown, ctx: Context) =>
    resolveCategoryProductCount(ctx.prisma, parent.id),
};
