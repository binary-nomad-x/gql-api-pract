import type { PrismaClient, Prisma } from "@prisma/client";
import type { CreateDiscountInput, UpdateDiscountInput } from "./inputs.js";
import { requireAuth } from "@gql-prisma-api/utils/errors.js";

// --- Type-field resolver functions ---
export function resolveDiscountProduct(prisma: PrismaClient, productId: string) {
  return prisma.product.findUnique({ where: { id: productId } });
}

// --- Helper functions ---
function toDiscountCreate(input: CreateDiscountInput): Prisma.DiscountUncheckedCreateInput {
  return {
    productId: input.productId,
    name: input.name,
    type: input.type,
    value: input.value,
    startDate: new Date(input.startDate),
    endDate: new Date(input.endDate),
    maxUsage: input.maxUsage ?? 0,
  };
}

function toDiscountUpdate(input: UpdateDiscountInput): Prisma.DiscountUpdateInput {
  const data: Prisma.DiscountUpdateInput = {};
  if (input.name !== undefined && input.name !== null) data.name = input.name;
  if (input.value !== undefined && input.value !== null) data.value = input.value;
  if (input.startDate !== undefined && input.startDate !== null) data.startDate = new Date(input.startDate);
  if (input.endDate !== undefined && input.endDate !== null) data.endDate = new Date(input.endDate);
  if (input.isActive !== undefined && input.isActive !== null) data.isActive = input.isActive;
  if (input.maxUsage !== undefined && input.maxUsage !== null) data.maxUsage = input.maxUsage;
  return data;
}

// --- Existing business logic functions ---
export async function createDiscount(
  prisma: PrismaClient,
  userId: string | undefined,
  input: CreateDiscountInput,
) {
  requireAuth(userId);
  const product = await prisma.product.findUnique({ where: { id: input.productId } });
  if (!product) throw new Error("Product not found");
  return prisma.discount.create({ data: toDiscountCreate(input) });
}

export async function updateDiscount(
  prisma: PrismaClient,
  userId: string | undefined,
  id: string,
  input: UpdateDiscountInput,
) {
  requireAuth(userId);
  return prisma.discount.update({ where: { id }, data: toDiscountUpdate(input) });
}

export async function deleteDiscount(
  prisma: PrismaClient,
  userId: string | undefined,
  id: string,
) {
  requireAuth(userId);
  await prisma.discount.delete({ where: { id } });
  return true;
}

export function getActiveDiscounts(prisma: PrismaClient) {
  const now = new Date();
  return prisma.discount.findMany({
    where: { isActive: true, startDate: { lte: now }, endDate: { gte: now } },
    orderBy: { createdAt: "desc" },
  });
}

export function getProductDiscounts(prisma: PrismaClient, productId: string) {
  const now = new Date();
  return prisma.discount.findMany({
    where: { productId, isActive: true, startDate: { lte: now }, endDate: { gte: now } },
  });
}
