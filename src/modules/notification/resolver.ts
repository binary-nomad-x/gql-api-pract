import type { Context } from "@gql-prisma-api/types/context.js";
import type { Notification as NotificationModel } from "@prisma/client";

export const Notification = {
  user: (parent: NotificationModel, _args: unknown, ctx: Context) =>
    ctx.services.notification.resolveNotificationUser(parent.userId),
};

export const Query = {
  myNotifications: (_parent: unknown, args: { limit?: number; offset?: number }, ctx: Context) =>
    ctx.services.notification.getMyNotifications(ctx.userId, args),
  unreadNotificationCount: (_parent: unknown, _args: unknown, ctx: Context) =>
    ctx.services.notification.getUnreadNotificationCount(ctx.userId),
};

export const Mutation = {
  markNotificationRead: (_parent: unknown, { id }: { id: string }, ctx: Context) =>
    ctx.services.notification.markNotificationRead(ctx.userId, id),
  markAllNotificationsRead: (_parent: unknown, _args: unknown, ctx: Context) =>
    ctx.services.notification.markAllNotificationsRead(ctx.userId),
};
