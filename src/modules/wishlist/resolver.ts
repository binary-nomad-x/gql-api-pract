import type { Context } from "@gql-prisma-api/types/context.js";
import type { Parent, IdArg } from "@gql-prisma-api/types/graphql.js";
import type { CreateWishlistInput, AddToWishlistInput } from "@gql-prisma-api/types/inputs.js";
import {
  createWishlist, addToWishlist, removeFromWishlist, deleteWishlist,
  getMyWishlists, getWishlist,
} from "./service.js";

export const WishlistResolver = {
  user: (parent: Parent, _args: unknown, ctx: Context) =>
    ctx.prisma.user.findUnique({ where: { id: parent.userId as string } }),
  items: (parent: Parent, _args: unknown, ctx: Context) =>
    ctx.prisma.wishlistItem.findMany({
      where: { wishlistId: parent.id },
      include: { product: true },
    }),
  itemCount: (parent: Parent, _args: unknown, ctx: Context) =>
    ctx.prisma.wishlistItem.count({ where: { wishlistId: parent.id } }),
};

export const WishlistItemResolver = {
  wishlist: (parent: Parent, _args: unknown, ctx: Context) =>
    ctx.prisma.wishlist.findUnique({ where: { id: parent.wishlistId as string } }),
  product: (parent: Parent, _args: unknown, ctx: Context) =>
    ctx.prisma.product.findUnique({ where: { id: parent.productId as string } }),
};

export const WishlistQueries = {
  myWishlists: (_parent: unknown, _args: unknown, ctx: Context) =>
    getMyWishlists(ctx.prisma, ctx.userId),

  wishlist: async (_parent: unknown, { id }: IdArg, ctx: Context) =>
    getWishlist(ctx.prisma, ctx.userId, id),
};

export const WishlistMutations = {
  createWishlist: async (_parent: unknown, { input }: { input: CreateWishlistInput }, ctx: Context) =>
    createWishlist(ctx.prisma, ctx.userId, input),

  addToWishlist: async (_parent: unknown, { input }: { input: AddToWishlistInput }, ctx: Context) =>
    addToWishlist(ctx.prisma, ctx.userId, input),

  removeFromWishlist: async (_parent: unknown, args: { wishlistId: string; productId: string }, ctx: Context) =>
    removeFromWishlist(ctx.prisma, ctx.userId, args.wishlistId, args.productId),

  deleteWishlist: async (_parent: unknown, { id }: IdArg, ctx: Context) =>
    deleteWishlist(ctx.prisma, ctx.userId, id),
};
