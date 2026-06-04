import type { PrismaClient, Prisma } from "@prisma/client";
import type { CreateAddressInput, UpdateAddressInput } from "@gql-prisma-api/modules/address/inputs.js";
import { requireAuth } from "@gql-prisma-api/utils/errors.js";

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
  const addr = await prisma.address.findFirst({ where: { id, userId: userId! } });
  if (!addr) throw new Error("Address not found");
  const { clean } = await import("@gql-prisma-api/utils/clean.js");
  const data: Prisma.AddressUpdateInput = clean(input as unknown as Record<string, unknown>) as Prisma.AddressUpdateInput;
  return prisma.address.update({ where: { id }, data });
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
