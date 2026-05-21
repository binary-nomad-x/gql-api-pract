import type { PrismaClient } from "@prisma/client";
import type { CreateAddressInput, UpdateAddressInput } from "@gql-prisma-api/types/inputs.js";
import { requireAuth } from "@gql-prisma-api/utils/errors.js";

export async function createAddress(
  prisma: PrismaClient,
  userId: string | undefined,
  input: CreateAddressInput,
) {
  requireAuth(userId);
  const { clean } = await import("@gql-prisma-api/utils/clean.js");
  return prisma.address.create({
    data: clean({
      ...input,
      userId: userId!,
      country: input.country ?? "US",
      label: input.label ?? "Home",
    }) as any,
  });
}

export async function updateAddress(
  prisma: PrismaClient,
  userId: string | undefined,
  id: string,
  input: UpdateAddressInput,
) {
  requireAuth(userId);
  const addr = await prisma.address.findFirst({ where: { id, userId: userId! } });
  if (!addr) throw new Error("Address not found");
  const { clean } = await import("@gql-prisma-api/utils/clean.js");
  return prisma.address.update({ where: { id }, data: clean(input as any) });
}

export async function deleteAddress(
  prisma: PrismaClient,
  userId: string | undefined,
  id: string,
) {
  requireAuth(userId);
  const addr = await prisma.address.findFirst({ where: { id, userId: userId! } });
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

export function getMyAddresses(prisma: PrismaClient, userId: string | undefined) {
  requireAuth(userId);
  return prisma.address.findMany({ where: { userId: userId! } });
}

export async function getAddress(prisma: PrismaClient, userId: string | undefined, id: string) {
  requireAuth(userId);
  return prisma.address.findFirst({ where: { id, userId: userId! } });
}
