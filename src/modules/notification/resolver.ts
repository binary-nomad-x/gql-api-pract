import type { Context } from "../../types/context.js";
import { requireAuth } from "../../utils/errors.js";

export const NotificationResolver = {
  user: (parent: any, _args: unknown, ctx: Context) =>
    ctx.prisma.user.findUnique({ where: { id: parent.userId } }),
};

export const NotificationQueries = {
  myNotifications: async (_parent: unknown, { limit = 20, offset = 0 }: any, ctx: Context) => {
    requireAuth(ctx.userId);
    return ctx.prisma.notification.findMany({
      where: { userId: ctx.userId! },
      take: limit, skip: offset,
      orderBy: { createdAt: "desc" },
    });
  },

  unreadNotificationCount: async (_parent: unknown, _args: unknown, ctx: Context) => {
    requireAuth(ctx.userId);
    return ctx.prisma.notification.count({ where: { userId: ctx.userId!, isRead: false } });
  },
};

export const NotificationMutations = {
  markNotificationRead: async (_parent: unknown, { id }: any, ctx: Context) => {
    requireAuth(ctx.userId);
    return ctx.prisma.notification.update({
      where: { id },
      data: { isRead: true, readAt: new Date() },
    });
  },

  markAllNotificationsRead: async (_parent: unknown, _args: unknown, ctx: Context) => {
    requireAuth(ctx.userId);
    await ctx.prisma.notification.updateMany({
      where: { userId: ctx.userId!, isRead: false },
      data: { isRead: true, readAt: new Date() },
    });
    return true;
  },
};
