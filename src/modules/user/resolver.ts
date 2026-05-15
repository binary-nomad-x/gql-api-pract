import type { Context } from "../../types/context.js";
import type { Parent, IdArg } from "../../types/graphql.js";
import type { UpdateUserInput } from "../../types/inputs.js";
import { hashPassword } from "../../utils/auth.js";
import { requireAuth, requireOwner } from "../../utils/errors.js";

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
    ctx.prisma.user.findMany(),

  user: (_parent: unknown, { id }: IdArg, ctx: Context) =>
    ctx.prisma.user.findUnique({ where: { id } }),

  me: (_parent: unknown, _args: unknown, ctx: Context) => {
    if (!ctx.userId) return null;
    return ctx.prisma.user.findUnique({ where: { id: ctx.userId } });
  },
};

export const UserMutations = {
  updateUser: async (_parent: unknown, args: { id: string; input: UpdateUserInput }, ctx: Context) => {
    requireOwner(args.id, ctx.userId);
    const data: Record<string, unknown> = {};
    const { name, email, password } = args.input;
    if (name) data.name = name;
    if (email) data.email = email;
    if (password) data.password = await hashPassword(password);
    return ctx.prisma.user.update({ where: { id: args.id }, data });
  },

  deleteUser: async (_parent: unknown, { id }: IdArg, ctx: Context) => {
    requireOwner(id, ctx.userId);
    await ctx.prisma.user.delete({ where: { id } });
    return true;
  },

  updateProfile: async (_parent: unknown, args: Record<string, unknown>, ctx: Context) => {
    requireAuth(ctx.userId);
    return ctx.prisma.profile.upsert({
      where: { userId: ctx.userId! },
      update: args,
      create: { userId: ctx.userId!, ...args },
    });
  },
};
