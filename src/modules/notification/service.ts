import type { PrismaClient } from "@prisma/client";
import { requireAuth } from "@gql-prisma-api/utils/errors.js";

export class NotificationService {
  constructor(private readonly core: PrismaClient) {}
  resolveNotificationUser(userId: string) {
    return this.core.user.findUnique({ where: { id: userId } });
  }

  async markNotificationRead(
    userId: string | undefined,
    id: string,
  ) {
    requireAuth(userId);
    return this.core.notification.update({
      where: { id },
      data: { isRead: true, readAt: new Date() },
    });
  }

  async markAllNotificationsRead(
    userId: string | undefined,
  ) {
    requireAuth(userId);
    await this.core.notification.updateMany({
      where: { userId: userId!, isRead: false },
      data: { isRead: true, readAt: new Date() },
    });
    return true;
  }

  getMyNotifications(
    userId: string | undefined,
    args: { limit?: number; offset?: number },
  ) {
    requireAuth(userId);
    return this.core.notification.findMany({
      where: { userId: userId! },
      take: args.limit ?? 20,
      skip: args.offset ?? 0,
      orderBy: { createdAt: "desc" },
    });
  }

  getUnreadNotificationCount(
    userId: string | undefined,
  ) {
    requireAuth(userId);
    return this.core.notification.count({ where: { userId: userId!, isRead: false } });
  }
}
