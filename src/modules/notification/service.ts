import type { PrismaClient } from "@prisma/client";
import { requireAuth } from "@gql-prisma-api/utils/errors.js";

// --- Type-field resolver functions ---
export function resolveNotificationUser(prisma: PrismaClient, userId: string) {
  return prisma.user.findUnique({ where: { id: userId } });
}

// --- Existing business logic functions ---
export async function markNotificationRead(
  prisma: PrismaClient,
  userId: string | undefined,
  id: string,
) {
  requireAuth(userId);
  return prisma.notification.update({
    where: { id },
    data: { isRead: true, readAt: new Date() },
  });
}

export async function markAllNotificationsRead(
  prisma: PrismaClient,
  userId: string | undefined,
) {
  requireAuth(userId);
  await prisma.notification.updateMany({
    where: { userId: userId!, isRead: false },
    data: { isRead: true, readAt: new Date() },
  });
  return true;
}

export function getMyNotifications(
  prisma: PrismaClient,
  userId: string | undefined,
  args: { limit?: number; offset?: number },
) {
  requireAuth(userId);
  return prisma.notification.findMany({
    where: { userId: userId! },
    take: args.limit ?? 20,
    skip: args.offset ?? 0,
    orderBy: { createdAt: "desc" },
  });
}

export function getUnreadNotificationCount(
  prisma: PrismaClient,
  userId: string | undefined,
) {
  requireAuth(userId);
  return prisma.notification.count({ where: { userId: userId!, isRead: false } });
}
