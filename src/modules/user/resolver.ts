import type { Context } from "../../types/context.js";
import { requireAuth, requireOwner } from "../../utils/errors.js";
import { hashPassword } from "../../utils/auth.js";

export const UserResolver = {
  profile: (parent: any, _args: unknown, ctx: Context) =>
    ctx.prisma.profile.findUnique({ where: { userId: parent.id } }),
  posts: (parent: any, _args: unknown, ctx: Context) =>
    ctx.prisma.post.findMany({ where: { authorId: parent.id } }),
  comments: (parent: any, _args: unknown, ctx: Context) =>
    ctx.prisma.comment.findMany({ where: { authorId: parent.id } }),
  likes: (parent: any, _args: unknown, ctx: Context) =>
    ctx.prisma.like.findMany({ where: { userId: parent.id } }),
  products: (parent: any, _args: unknown, ctx: Context) =>
    ctx.prisma.product.findMany({ where: { sellerId: parent.id } }),
  orders: (parent: any, _args: unknown, ctx: Context) =>
    ctx.prisma.order.findMany({ where: { userId: parent.id } }),
  reviews: (parent: any, _args: unknown, ctx: Context) =>
    ctx.prisma.review.findMany({ where: { userId: parent.id } }),
  addresses: (parent: any, _args: unknown, ctx: Context) =>
    ctx.prisma.address.findMany({ where: { userId: parent.id } }),
  wishlists: (parent: any, _args: unknown, ctx: Context) =>
    ctx.prisma.wishlist.findMany({ where: { userId: parent.id } }),
  cart: (parent: any, _args: unknown, ctx: Context) =>
    ctx.prisma.cart.findUnique({ where: { userId: parent.id } }),
  notifications: (parent: any, _args: unknown, ctx: Context) =>
    ctx.prisma.notification.findMany({ where: { userId: parent.id } }),
  followers: (parent: any, _args: unknown, ctx: Context) =>
    ctx.prisma.follow.findMany({ where: { followingId: parent.id } }),
  following: (parent: any, _args: unknown, ctx: Context) =>
    ctx.prisma.follow.findMany({ where: { followerId: parent.id } }),
  savedPosts: (parent: any, _args: unknown, ctx: Context) =>
    ctx.prisma.savedPost.findMany({ where: { userId: parent.id } }),
  postViews: (parent: any, _args: unknown, ctx: Context) =>
    ctx.prisma.postView.findMany({ where: { userId: parent.id } }),
};

export const UserQueries = {
  users: (_parent: unknown, _args: unknown, ctx: Context) =>
    ctx.prisma.user.findMany(),

  user: (_parent: unknown, { id }: { id: string }, ctx: Context) =>
    ctx.prisma.user.findUnique({ where: { id } }),

  me: (_parent: unknown, _args: unknown, ctx: Context) => {
    if (!ctx.userId) return null;
    return ctx.prisma.user.findUnique({ where: { id: ctx.userId } });
  },
};

export const UserMutations = {
  updateUser: async (_parent: unknown, { id, input }: any, ctx: Context) => {
    requireOwner(id, ctx.userId);
    const data: any = {};
    if (input.name) data.name = input.name;
    if (input.email) data.email = input.email;
    if (input.password) data.password = await hashPassword(input.password);
    return ctx.prisma.user.update({ where: { id }, data });
  },

  deleteUser: async (_parent: unknown, { id }: any, ctx: Context) => {
    requireOwner(id, ctx.userId);
    await ctx.prisma.user.delete({ where: { id } });
    return true;
  },

  updateProfile: async (_parent: unknown, input: any, ctx: Context) => {
    requireAuth(ctx.userId);
    return ctx.prisma.profile.upsert({
      where: { userId: ctx.userId },
      update: input,
      create: { userId: ctx.userId!, ...input },
    });
  },
};
