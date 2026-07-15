import type { PrismaClient } from "@prisma/client";

export class NotificationService {

  constructor(private readonly core: PrismaClient) {}
  
  resolveNotificationUser(userId: string) {
    return this.core.user.findUnique({ where: { id: userId } });
  }

  async markNotificationRead(userId: string, id: string) {
    return this.core.notification.update({
      where: { id },
      data: { isRead: true, readAt: new Date() },
    });
  }

  async markAllNotificationsRead(userId: string) {
    await this.core.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true, readAt: new Date() },
    });
    return true;
  }

  getMyNotifications(userId: string, args: { limit?: number; offset?: number }) {
    return this.core.notification.findMany({
      where: { userId },
      take: args.limit ?? 20,
      skip: args.offset ?? 0,
      orderBy: { createdAt: "desc" },
    });
  }

  getUnreadNotificationCount(userId: string) {
    return this.core.notification.count({ where: { userId, isRead: false } });
  }

}
