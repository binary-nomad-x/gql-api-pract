import type { Context } from "@gql-prisma-api/types/context.js";
import type { Parent, IdArg } from "@gql-prisma-api/types/graphql.js";
import type {
  UpdateUserInput,
  UpdateProfileInput,
} from "@gql-prisma-api/modules/user/inputs.js";
import {
  updateUser,
  deleteUser,
  updateProfile,
  getUsers,
  getUser,
  getMe,
} from "./service.js";

export const UserResolver = {
  profile: (parent: Parent, _args: unknown, ctx: Context) =>
    ctx.prisma.profile.findUnique({ where: { userId: parent.id } }),
  posts: (parent: Parent, _args: unknown, ctx: Context) =>
    ctx.prisma.post.findMany({ where: { authorId: parent.id } }),
  comments: (parent: Parent, _args: unknown, ctx: Context) =>
    ctx.prisma.comment.findMany({ where: { authorId: parent.id } }),
  likes: (parent: Parent, _args: unknown, ctx: Context) =>
    ctx.prisma.like.findMany({ where: { userId: parent.id } }),
  products: (parent: Parent, _args: unknown, ctx: Context) =>
    ctx.prisma.product.findMany({ where: { sellerId: parent.id } }),
  orders: (parent: Parent, _args: unknown, ctx: Context) =>
    ctx.prisma.order.findMany({ where: { userId: parent.id } }),
  reviews: (parent: Parent, _args: unknown, ctx: Context) =>
    ctx.prisma.review.findMany({ where: { userId: parent.id } }),
  addresses: (parent: Parent, _args: unknown, ctx: Context) =>
    ctx.prisma.address.findMany({ where: { userId: parent.id } }),
  wishlists: (parent: Parent, _args: unknown, ctx: Context) =>
    ctx.prisma.wishlist.findMany({ where: { userId: parent.id } }),
  cart: (parent: Parent, _args: unknown, ctx: Context) =>
    ctx.prisma.cart.findUnique({ where: { userId: parent.id } }),
  notifications: (parent: Parent, _args: unknown, ctx: Context) =>
    ctx.prisma.notification.findMany({ where: { userId: parent.id } }),
  followers: (parent: Parent, _args: unknown, ctx: Context) =>
    ctx.prisma.follow.findMany({ where: { followingId: parent.id } }),
  following: (parent: Parent, _args: unknown, ctx: Context) =>
    ctx.prisma.follow.findMany({ where: { followerId: parent.id } }),
  savedPosts: (parent: Parent, _args: unknown, ctx: Context) =>
    ctx.prisma.savedPost.findMany({ where: { userId: parent.id } }),
  postViews: (parent: Parent, _args: unknown, ctx: Context) =>
    ctx.prisma.postView.findMany({ where: { userId: parent.id } }),
};

export const UserQueries = {
  users: (_parent: unknown, _args: unknown, ctx: Context) =>
    getUsers(ctx.prisma),

  user: (_parent: unknown, { id }: IdArg, ctx: Context) =>
    getUser(ctx.prisma, id),

  me: (_parent: unknown, _args: unknown, ctx: Context) =>
    getMe(ctx.prisma, ctx.userId),
};

export const UserMutations = {
  updateUser: async (
    _parent: unknown,
    args: { id: string; input: UpdateUserInput },
    ctx: Context,
  ) => updateUser(ctx.prisma, ctx.userId, args),

  deleteUser: async (_parent: unknown, { id }: IdArg, ctx: Context) =>
    deleteUser(ctx.prisma, ctx.userId, id),

  updateProfile: async (
    _parent: unknown,
    args: UpdateProfileInput,
    ctx: Context,
  ) => updateProfile(ctx.prisma, ctx.userId, args),
};
