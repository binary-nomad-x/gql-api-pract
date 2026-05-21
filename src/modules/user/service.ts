import type { PrismaClient } from "@prisma/client";
import type { UpdateUserInput } from "@gql-prisma-api/types/inputs.js";
import { hashPassword } from "@gql-prisma-api/utils/auth.js";
import { requireAuth, requireOwner } from "@gql-prisma-api/utils/errors.js";

export async function updateUser(
  prisma: PrismaClient,
  userId: string | undefined,
  args: { id: string; input: UpdateUserInput },
) {
  requireOwner(args.id, userId);
  const data: Record<string, unknown> = {};
  const { name, email, password } = args.input;
  if (name) data.name = name;
  if (email) data.email = email;
  if (password) data.password = await hashPassword(password);
  return prisma.user.update({ where: { id: args.id }, data });
}

export async function deleteUser(
  prisma: PrismaClient,
  userId: string | undefined,
  id: string,
) {
  requireOwner(id, userId);
  await prisma.user.delete({ where: { id } });
  return true;
}

export async function updateProfile(
  prisma: PrismaClient,
  userId: string | undefined,
  args: Record<string, unknown>,
) {
  requireAuth(userId);
  return prisma.profile.upsert({
    where: { userId: userId! },
    update: args,
    create: { userId: userId!, ...args },
  });
}

export function getUsers(prisma: PrismaClient) {
  return prisma.user.findMany();
}

export function getUser(prisma: PrismaClient, id: string) {
  return prisma.user.findUnique({ where: { id } });
}

export function getMe(prisma: PrismaClient, userId?: string) {
  if (!userId) return null;
  return prisma.user.findUnique({ where: { id: userId } });
}
