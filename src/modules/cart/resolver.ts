import type { Context } from "@/types/context.js";
import type { Parent } from "@/types/graphql.js";
import type { AddToCartInput, UpdateCartItemInput } from "@/types/inputs.js";
import { requireAuth } from "@/utils/errors.js";

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
  myCart: async (_parent: unknown, _args: unknown, ctx: Context) => {
    requireAuth(ctx.userId);
    return ctx.prisma.cart.findUnique({ where: { userId: ctx.userId! } });
  },
};

async function getOrCreateCart(ctx: Context) {
  let cart = await ctx.prisma.cart.findUnique({ where: { userId: ctx.userId! } });
  if (!cart) cart = await ctx.prisma.cart.create({ data: { userId: ctx.userId! } });
  return cart;
}

export const CartMutations = {
  addToCart: async (_parent: unknown, { input }: { input: AddToCartInput }, ctx: Context) => {
    requireAuth(ctx.userId);
    const cart = await getOrCreateCart(ctx);
    const existing = await ctx.prisma.cartItem.findUnique({
      where: { cartId_productId: { cartId: cart.id, productId: input.productId } },
    });
    if (existing) {
      await ctx.prisma.cartItem.update({
        where: { id: existing.id },
        data: { quantity: existing.quantity + (input.quantity ?? 1) },
      });
    } else {
      await ctx.prisma.cartItem.create({
        data: { cartId: cart.id, productId: input.productId, quantity: input.quantity ?? 1 },
      });
    }
    return ctx.prisma.cart.findUnique({ where: { id: cart.id } });
  },

  updateCartItem: async (_parent: unknown, { input }: { input: UpdateCartItemInput }, ctx: Context) => {
    requireAuth(ctx.userId);
    const cart = await getOrCreateCart(ctx);
    const item = await ctx.prisma.cartItem.findUnique({
      where: { cartId_productId: { cartId: cart.id, productId: input.productId } },
    });
    if (!item) throw new Error("Item not in cart");
    await ctx.prisma.cartItem.update({ where: { id: item.id }, data: { quantity: input.quantity } });
    return ctx.prisma.cart.findUnique({ where: { id: cart.id } });
  },

  removeFromCart: async (_parent: unknown, { productId }: { productId: string }, ctx: Context) => {
    requireAuth(ctx.userId);
    const cart = await getOrCreateCart(ctx);
    const item = await ctx.prisma.cartItem.findUnique({
      where: { cartId_productId: { cartId: cart.id, productId } },
    });
    if (item) await ctx.prisma.cartItem.delete({ where: { id: item.id } });
    return ctx.prisma.cart.findUnique({ where: { id: cart.id } });
  },

  clearCart: async (_parent: unknown, _args: unknown, ctx: Context) => {
    requireAuth(ctx.userId);
    const cart = await getOrCreateCart(ctx);
    await ctx.prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
    return cart;
  },
};
