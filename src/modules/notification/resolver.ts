import type { Context } from "@gql-prisma-api/types/context.js";
import type { Notification as NotificationModel } from "@prisma/client";
import {
  resolveNotificationUser,
  markNotificationRead,
  markAllNotificationsRead,
  getMyNotifications,
  getUnreadNotificationCount,
} from "./service.js";

export const Notification = {
  user: (parent: NotificationModel, _args: unknown, ctx: Context) =>
    resolveNotificationUser(ctx.prisma, parent.userId),
};

export const Query = {
  myNotifications: (_parent: unknown, args: { limit?: number; offset?: number }, ctx: Context) =>
    getMyNotifications(ctx.prisma, ctx.userId, args),
  unreadNotificationCount: (_parent: unknown, _args: unknown, ctx: Context) =>
    getUnreadNotificationCount(ctx.prisma, ctx.userId),
};

export const Mutation = {
  markNotificationRead: (_parent: unknown, { id }: { id: string }, ctx: Context) =>
    markNotificationRead(ctx.prisma, ctx.userId, id),
  markAllNotificationsRead: (_parent: unknown, _args: unknown, ctx: Context) =>
    markAllNotificationsRead(ctx.prisma, ctx.userId),
};
