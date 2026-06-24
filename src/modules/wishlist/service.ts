import type { PrismaClient } from "@prisma/client";
import type { CreateWishlistInput, AddToWishlistInput } from "./inputs.js";
import { requireAuth } from "@gql-prisma-api/utils/errors.js";

// --- Type-field resolver functions ---
export function resolveWishlistUser(prisma: PrismaClient, userId: string) {
  return prisma.user.findUnique({ where: { id: userId } });
}

export function resolveWishlistItems(prisma: PrismaClient, wishlistId: string) {
  return prisma.wishlistItem.findMany({
    where: { wishlistId },
    include: { product: true },
  });
}

export function resolveWishlistItemCount(prisma: PrismaClient, wishlistId: string) {
  return prisma.wishlistItem.count({ where: { wishlistId } });
}

export function resolveWishlistItemWishlist(prisma: PrismaClient, wishlistId: string) {
  return prisma.wishlist.findUnique({ where: { id: wishlistId } });
}

export function resolveWishlistItemProduct(prisma: PrismaClient, productId: string) {
  return prisma.product.findUnique({ where: { id: productId } });
}

// --- Existing business logic functions ---
export async function createWishlist(
  prisma: PrismaClient,
  userId: string | undefined,
  input: CreateWishlistInput,
) {
  requireAuth(userId);
  return prisma.wishlist.create({
    data: { name: input.name ?? "Default", userId: userId! },
  });
}

export async function addToWishlist(
  prisma: PrismaClient,
  userId: string | undefined,
  input: AddToWishlistInput,
) {
  requireAuth(userId);
  const wishlist = await prisma.wishlist.findFirst({
    where: { id: input.wishlistId, userId: userId! },
  });
  if (!wishlist) throw new Error("Wishlist not found");

  await prisma.wishlistItem.upsert({
    where: { wishlistId_productId: { wishlistId: input.wishlistId, productId: input.productId } },
    update: { note: input.note ?? null },
    create: { wishlistId: input.wishlistId, productId: input.productId, note: input.note ?? null },
  });

  return prisma.wishlist.findUnique({ where: { id: input.wishlistId } });
}

export async function removeFromWishlist(
  prisma: PrismaClient,
  userId: string | undefined,
  wishlistId: string,
  productId: string,
) {
  requireAuth(userId);
  const item = await prisma.wishlistItem.findUnique({
    where: { wishlistId_productId: { wishlistId, productId } },
  });
  if (item) await prisma.wishlistItem.delete({ where: { id: item.id } });
  return prisma.wishlist.findUnique({ where: { id: wishlistId } });
}

export async function deleteWishlist(
  prisma: PrismaClient,
  userId: string | undefined,
  id: string,
) {
  requireAuth(userId);
  await prisma.wishlist.deleteMany({ where: { id, userId: userId! } });
  return true;
}

export function getMyWishlists(prisma: PrismaClient, userId: string | undefined) {
  requireAuth(userId);
  return prisma.wishlist.findMany({ where: { userId: userId! } });
}

export async function getWishlist(prisma: PrismaClient, userId: string | undefined, id: string) {
  requireAuth(userId);
  return prisma.wishlist.findFirst({ where: { id, userId: userId! } });
}
