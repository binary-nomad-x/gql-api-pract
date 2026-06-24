import type { Context } from "@gql-prisma-api/types/context.js";
import type { User as UserModel } from "@prisma/client";
import type { IdArg } from "@gql-prisma-api/types/graphql.js";
import type { UpdateUserInput, UpdateProfileInput } from "./inputs.js";
import {
  resolveUserProfile,
  resolveUserPosts,
  resolveUserComments,
  resolveUserLikes,
  resolveUserProducts,
  resolveUserOrders,
  resolveUserReviews,
  resolveUserAddresses,
  resolveUserWishlists,
  resolveUserCart,
  resolveUserNotifications,
  resolveUserFollowers,
  resolveUserFollowing,
  resolveUserSavedPosts,
  resolveUserPostViews,
  updateUser,
  deleteUser,
  updateProfile,
  getUsers,
  getUser,
  getMe,
} from "./service.js";

export const User = {
  profile: (parent: UserModel, _args: unknown, ctx: Context) =>
    resolveUserProfile(ctx.prisma, parent.id),
  posts: (parent: UserModel, _args: unknown, ctx: Context) =>
    resolveUserPosts(ctx.prisma, parent.id),
  comments: (parent: UserModel, _args: unknown, ctx: Context) =>
    resolveUserComments(ctx.prisma, parent.id),
  likes: (parent: UserModel, _args: unknown, ctx: Context) =>
    resolveUserLikes(ctx.prisma, parent.id),
  products: (parent: UserModel, _args: unknown, ctx: Context) =>
    resolveUserProducts(ctx.prisma, parent.id),
  orders: (parent: UserModel, _args: unknown, ctx: Context) =>
    resolveUserOrders(ctx.prisma, parent.id),
  reviews: (parent: UserModel, _args: unknown, ctx: Context) =>
    resolveUserReviews(ctx.prisma, parent.id),
  addresses: (parent: UserModel, _args: unknown, ctx: Context) =>
    resolveUserAddresses(ctx.prisma, parent.id),
  wishlists: (parent: UserModel, _args: unknown, ctx: Context) =>
    resolveUserWishlists(ctx.prisma, parent.id),
  cart: (parent: UserModel, _args: unknown, ctx: Context) =>
    resolveUserCart(ctx.prisma, parent.id),
  notifications: (parent: UserModel, _args: unknown, ctx: Context) =>
    resolveUserNotifications(ctx.prisma, parent.id),
  followers: (parent: UserModel, _args: unknown, ctx: Context) =>
    resolveUserFollowers(ctx.prisma, parent.id),
  following: (parent: UserModel, _args: unknown, ctx: Context) =>
    resolveUserFollowing(ctx.prisma, parent.id),
  savedPosts: (parent: UserModel, _args: unknown, ctx: Context) =>
    resolveUserSavedPosts(ctx.prisma, parent.id),
  postViews: (parent: UserModel, _args: unknown, ctx: Context) =>
    resolveUserPostViews(ctx.prisma, parent.id),
};

export const Query = {
  users: (_parent: unknown, _args: unknown, ctx: Context) =>
    getUsers(ctx.prisma),
  user: (_parent: unknown, { id }: IdArg, ctx: Context) =>
    getUser(ctx.prisma, id),
  me: (_parent: unknown, _args: unknown, ctx: Context) =>
    getMe(ctx.prisma, ctx.userId),
};

export const Mutation = {
  updateUser: (
    _parent: unknown,
    args: { id: string; input: UpdateUserInput },
    ctx: Context,
  ) => updateUser(ctx.prisma, ctx.userId, args),
  deleteUser: (_parent: unknown, { id }: IdArg, ctx: Context) =>
    deleteUser(ctx.prisma, ctx.userId, id),
  updateProfile: (
    _parent: unknown,
    args: UpdateProfileInput,
    ctx: Context,
  ) => updateProfile(ctx.prisma, ctx.userId, args),
};
