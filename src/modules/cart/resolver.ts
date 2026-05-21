import type { Context } from "@gql-prisma-api/types/context.js";
import type { Parent } from "@gql-prisma-api/types/graphql.js";
import type { AddToCartInput, UpdateCartItemInput } from "@gql-prisma-api/types/inputs.js";
import {
  addToCart, updateCartItem, removeFromCart, clearCart,
  getMyCart,
} from "./service.js";

export const CartResolver = {
  user: (parent: Parent, _args: unknown, ctx: Context) =>
    ctx.prisma.user.findUnique({ where: { id: parent.userId as string } }),
  items: (parent: Parent, _args: unknown, ctx: Context) =>
    ctx.prisma.cartItem.findMany({ where: { cartId: parent.id }, include: { product: true } }),
  totalAmount: async (parent: Parent, _args: unknown, ctx: Context) => {
    const items = await ctx.prisma.cartItem.findMany({
      where: { cartId: parent.id },
      include: { product: true },
    });
    return items.reduce((sum, i) => sum + i.product.price * i.quantity, 0);
  },
  itemCount: (parent: Parent, _args: unknown, ctx: Context) =>
    ctx.prisma.cartItem.count({ where: { cartId: parent.id } }),
};

export const CartItemResolver = {
  cart: (parent: Parent, _args: unknown, ctx: Context) =>
    ctx.prisma.cart.findUnique({ where: { id: parent.cartId as string } }),
  product: (parent: Parent, _args: unknown, ctx: Context) =>
    ctx.prisma.product.findUnique({ where: { id: parent.productId as string } }),
};

export const CartQueries = {
  myCart: async (_parent: unknown, _args: unknown, ctx: Context) =>
    getMyCart(ctx.prisma, ctx.userId),
};

export const CartMutations = {
  addToCart: async (_parent: unknown, { input }: { input: AddToCartInput }, ctx: Context) =>
    addToCart(ctx.prisma, ctx.userId, input),

  updateCartItem: async (_parent: unknown, { input }: { input: UpdateCartItemInput }, ctx: Context) =>
    updateCartItem(ctx.prisma, ctx.userId, input),

  removeFromCart: async (_parent: unknown, { productId }: { productId: string }, ctx: Context) =>
    removeFromCart(ctx.prisma, ctx.userId, productId),

  clearCart: async (_parent: unknown, _args: unknown, ctx: Context) =>
    clearCart(ctx.prisma, ctx.userId),
};
