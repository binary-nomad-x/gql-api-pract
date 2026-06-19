import type { PrismaClient, Prisma } from "@prisma/client";
import type { CreateAddressInput, UpdateAddressInput } from "./inputs.js";
import { requireAuth } from "@gql-prisma-api/utils/errors.js";
import { unescape } from "querystring";

// --- Type-field resolver functions ---
export function resolveAddressUser(prisma: PrismaClient, userId: string) {
  return prisma.user.findUnique({ where: { id: userId } });
}

// --- Existing business logic functions ---
export async function createAddress(
  prisma: PrismaClient,
  userId: string | undefined,
  input: CreateAddressInput,
) {
  requireAuth(userId);
  const { clean } = await import("@gql-prisma-api/utils/clean.js");
  const data: Prisma.AddressCreateInput = clean({
    ...input,
    userId: userId!,
    country: input.country ?? "US",
    label: input.label ?? "Home",
  }) as unknown as Prisma.AddressCreateInput;
  return prisma.address.create({ data });
}

export async function updateAddress(
  prisma: PrismaClient,
  userId: string | undefined,
  id: string,
  input: UpdateAddressInput,
) {
  requireAuth(userId);

  const addr = await prisma.address.findFirst({
    where: { id, userId: userId! },
  });

  if (!addr) throw new Error("Address not found");
  return prisma.address.update({
    where: { id },
    data: {
      label: input?.label || undefined,
      street: input?.street || undefined,
      city: input.city || undefined,
      zip: input.zip || undefined,
      country: input.country || undefined,
      isDefault: input.isDefault || undefined,
    },
  });
}

export async function deleteAddress(
  prisma: PrismaClient,
  userId: string | undefined,
  id: string,
) {
  requireAuth(userId);
  const addr = await prisma.address.findFirst({
    where: { id, userId: userId! },
  });
  if (!addr) throw new Error("Address not found");
  await prisma.address.delete({ where: { id } });
  return true;
}

export async function setDefaultAddress(
  prisma: PrismaClient,
  userId: string | undefined,
  id: string,
) {
  requireAuth(userId);
  await prisma.address.updateMany({
    where: { userId: userId!, isDefault: true },
    data: { isDefault: false },
  });
  return prisma.address.update({ where: { id }, data: { isDefault: true } });
}

export function getMyAddresses(
  prisma: PrismaClient,
  userId: string | undefined,
) {
  requireAuth(userId);
  return prisma.address.findMany({ where: { userId: userId! } });
}

export async function getAddress(
  prisma: PrismaClient,
  userId: string | undefined,
  id: string,
) {
  requireAuth(userId);
  return prisma.address.findFirst({ where: { id, userId: userId! } });
}
