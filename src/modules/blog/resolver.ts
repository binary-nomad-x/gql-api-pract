import type { Context } from "@gql-prisma-api/types/context.js";
import type { Parent, IdArg, PostFilterArgs } from "@gql-prisma-api/types/graphql.js";
import type { CreatePostInput, UpdatePostInput, CreateCommentInput, CreateCategoryInput } from "@gql-prisma-api/types/inputs.js";
import {
  createPost, updatePost, deletePost, publishPost, unpublishPost,
  createTag, createCategory, createComment, deleteComment, toggleLike,
  getPosts, getPost,
} from "./service.js";

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
  posts: async (_parent: unknown, args: PostFilterArgs, ctx: Context) =>
    getPosts(ctx.prisma, args),

  post: (_parent: unknown, { id }: IdArg, ctx: Context) =>
    getPost(ctx.prisma, id),
};

export const PostMutations = {
  createPost: async (_parent: unknown, { input }: { input: CreatePostInput }, ctx: Context) =>
    createPost(ctx.prisma, ctx.userId, input),

  updatePost: async (_parent: unknown, { id, input }: { id: string; input: UpdatePostInput }, ctx: Context) =>
    updatePost(ctx.prisma, ctx.userId, id, input),

  deletePost: async (_parent: unknown, { id }: IdArg, ctx: Context) =>
    deletePost(ctx.prisma, ctx.userId, id),

  publishPost: async (_parent: unknown, { id }: IdArg, ctx: Context) =>
    publishPost(ctx.prisma, ctx.userId, id),

  unpublishPost: async (_parent: unknown, { id }: IdArg, ctx: Context) =>
    unpublishPost(ctx.prisma, ctx.userId, id),

  createTag: (_parent: unknown, { name }: { name: string }, ctx: Context) =>
    createTag(ctx.prisma, name),

  createCategory: (_parent: unknown, { input }: { input: CreateCategoryInput }, ctx: Context) =>
    createCategory(ctx.prisma, input),

  createComment: async (_parent: unknown, { input }: { input: CreateCommentInput }, ctx: Context) =>
    createComment(ctx.prisma, ctx.userId, input),

  deleteComment: async (_parent: unknown, { id }: IdArg, ctx: Context) =>
    deleteComment(ctx.prisma, ctx.userId, id),

  toggleLike: async (_parent: unknown, { postId }: { postId: string }, ctx: Context) =>
    toggleLike(ctx.prisma, ctx.userId, postId),
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
