import type { Context } from "@gql-prisma-api/types/context.js";
import type { Cart as CartModel, CartItem as CartItemModel } from "@prisma/client";
import type { AddToCartInput, UpdateCartItemInput } from "./inputs.js";
import {
  resolveCartUser,
  resolveCartItems,
  resolveCartTotalAmount,
  resolveCartItemCount,
  resolveCartItemCart,
  resolveCartItemProduct,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
  getMyCart,
} from "./service.js";

export const Cart = {
  user: (parent: CartModel, _args: unknown, ctx: Context) =>
    resolveCartUser(ctx.prisma, parent.userId),
  items: (parent: CartModel, _args: unknown, ctx: Context) =>
    resolveCartItems(ctx.prisma, parent.id),
  totalAmount: (parent: CartModel, _args: unknown, ctx: Context) =>
    resolveCartTotalAmount(ctx.prisma, parent.id),
  itemCount: (parent: CartModel, _args: unknown, ctx: Context) =>
    resolveCartItemCount(ctx.prisma, parent.id),
};

export const CartItem = {
  cart: (parent: CartItemModel, _args: unknown, ctx: Context) =>
    resolveCartItemCart(ctx.prisma, parent.cartId),
  product: (parent: CartItemModel, _args: unknown, ctx: Context) =>
    resolveCartItemProduct(ctx.prisma, parent.productId),
};

export const Query = {
  myCart: (_parent: unknown, _args: unknown, ctx: Context) =>
    getMyCart(ctx.prisma, ctx.userId),
};

export const Mutation = {
  addToCart: (_parent: unknown, { input }: { input: AddToCartInput }, ctx: Context) =>
    addToCart(ctx.prisma, ctx.userId, input),
  updateCartItem: (_parent: unknown, { input }: { input: UpdateCartItemInput }, ctx: Context) =>
    updateCartItem(ctx.prisma, ctx.userId, input),
  removeFromCart: (_parent: unknown, { productId }: { productId: string }, ctx: Context) =>
    removeFromCart(ctx.prisma, ctx.userId, productId),
  clearCart: (_parent: unknown, _args: unknown, ctx: Context) =>
    clearCart(ctx.prisma, ctx.userId),
};
