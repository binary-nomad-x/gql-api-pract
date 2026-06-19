import type { Context } from "@gql-prisma-api/types/context.js";
import type { Wishlist as WishlistModel, WishlistItem as WishlistItemModel } from "@prisma/client";
import type {
  CreateWishlistInput,
  AddToWishlistInput,
} from "./inputs.js";
import {
  createWishlist,
  addToWishlist,
  removeFromWishlist,
  deleteWishlist,
  getMyWishlists,
  getWishlist,
  resolveWishlistUser,
  resolveWishlistItems,
  resolveWishlistItemCount,
  resolveWishlistItemWishlist,
  resolveWishlistItemProduct,
} from "./service.js";

export const Wishlist = {
  user: (parent: WishlistModel, _args: unknown, ctx: Context) =>
    resolveWishlistUser(ctx.prisma, parent.userId),
  items: (parent: WishlistModel, _args: unknown, ctx: Context) =>
    resolveWishlistItems(ctx.prisma, parent.id),
  itemCount: (parent: WishlistModel, _args: unknown, ctx: Context) =>
    resolveWishlistItemCount(ctx.prisma, parent.id),
};

export const WishlistItem = {
  wishlist: (parent: WishlistItemModel, _args: unknown, ctx: Context) =>
    resolveWishlistItemWishlist(ctx.prisma, parent.wishlistId),
  product: (parent: WishlistItemModel, _args: unknown, ctx: Context) =>
    resolveWishlistItemProduct(ctx.prisma, parent.productId),
};

export const Query = {
  myWishlists: (_parent: unknown, _args: unknown, ctx: Context) =>
    getMyWishlists(ctx.prisma, ctx.userId),

  wishlist: (_parent: unknown, { id }: { id: string }, ctx: Context) =>
    getWishlist(ctx.prisma, ctx.userId, id),
};

export const Mutation = {
  createWishlist: (
    _parent: unknown,
    { input }: { input: CreateWishlistInput },
    ctx: Context,
  ) => createWishlist(ctx.prisma, ctx.userId, input),

  addToWishlist: (
    _parent: unknown,
    { input }: { input: AddToWishlistInput },
    ctx: Context,
  ) => addToWishlist(ctx.prisma, ctx.userId, input),

  removeFromWishlist: (
    _parent: unknown,
    args: { wishlistId: string; productId: string },
    ctx: Context,
  ) =>
    removeFromWishlist(ctx.prisma, ctx.userId, args.wishlistId, args.productId),

  deleteWishlist: (_parent: unknown, { id }: { id: string }, ctx: Context) =>
    deleteWishlist(ctx.prisma, ctx.userId, id),
};
