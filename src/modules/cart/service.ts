import type { PrismaClient, Product } from "@prisma/client";
import type { AddToCartInput, UpdateCartItemInput } from "./inputs.js";
import { requireAuth } from "@gql-prisma-api/utils/errors.js";

export function resolveCartUser(prisma: PrismaClient, userId: string) {
  return prisma.user.findUnique({ where: { id: userId } });
}

export function resolveCartItems(prisma: PrismaClient, cartId: string) {
  return prisma.cartItem.findMany({ where: { cartId }, include: { product: true } });
}

export async function resolveCartTotalAmount(prisma: PrismaClient, cartId: string) {
  const items = await prisma.cartItem.findMany({
    where: { cartId },
    include: { product: true },
  });
  return items.reduce((sum: number, i: { product: Product; quantity: number }) => sum + i.product.price * i.quantity, 0);
}

export function resolveCartItemCount(prisma: PrismaClient, cartId: string) {
  return prisma.cartItem.count({ where: { cartId } });
}

export function resolveCartItemCart(prisma: PrismaClient, cartId: string) {
  return prisma.cart.findUnique({ where: { id: cartId } });
}

export function resolveCartItemProduct(prisma: PrismaClient, productId: string) {
  return prisma.product.findUnique({ where: { id: productId } });
}

async function getOrCreateCart(prisma: PrismaClient, userId: string) {
  let cart = await prisma.cart.findUnique({ where: { userId } });
  if (!cart) cart = await prisma.cart.create({ data: { userId } });
  return cart;
}

export async function addToCart(
  prisma: PrismaClient,
  userId: string | undefined,
  input: AddToCartInput,
) {
  requireAuth(userId);
  const cart = await getOrCreateCart(prisma, userId!);
  const existing = await prisma.cartItem.findUnique({
    where: { cartId_productId: { cartId: cart.id, productId: input.productId } },
  });
  if (existing) {
    await prisma.cartItem.update({
      where: { id: existing.id },
      data: { quantity: existing.quantity + (input.quantity ?? 1) },
    });
  } else {
    await prisma.cartItem.create({
      data: { cartId: cart.id, productId: input.productId, quantity: input.quantity ?? 1 },
    });
  }
  return prisma.cart.findUnique({ where: { id: cart.id } });
}

export async function updateCartItem(
  prisma: PrismaClient,
  userId: string | undefined,
  input: UpdateCartItemInput,
) {
  requireAuth(userId);
  const cart = await getOrCreateCart(prisma, userId!);
  const item = await prisma.cartItem.findUnique({
    where: { cartId_productId: { cartId: cart.id, productId: input.productId } },
  });
  if (!item) throw new Error("Item not in cart");
  await prisma.cartItem.update({ where: { id: item.id }, data: { quantity: input.quantity } });
  return prisma.cart.findUnique({ where: { id: cart.id } });
}

export async function removeFromCart(
  prisma: PrismaClient,
  userId: string | undefined,
  productId: string,
) {
  requireAuth(userId);
  const cart = await getOrCreateCart(prisma, userId!);
  const item = await prisma.cartItem.findUnique({
    where: { cartId_productId: { cartId: cart.id, productId } },
  });
  if (item) await prisma.cartItem.delete({ where: { id: item.id } });
  return prisma.cart.findUnique({ where: { id: cart.id } });
}

export async function clearCart(
  prisma: PrismaClient,
  userId: string | undefined,
) {
  requireAuth(userId);
  const cart = await getOrCreateCart(prisma, userId!);
  await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
  return cart;
}

export async function getMyCart(prisma: PrismaClient, userId: string | undefined) {
  requireAuth(userId);
  return prisma.cart.findUnique({ where: { userId: userId! } });
}
