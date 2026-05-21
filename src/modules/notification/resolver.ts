import type { Context } from "@gql-prisma-api/types/context.js";
import type { Parent, IdArg, PaginationArgs } from "@gql-prisma-api/types/graphql.js";
import {
  markNotificationRead, markAllNotificationsRead,
  getMyNotifications, getUnreadNotificationCount,
} from "./service.js";

export const NotificationResolver = {
  user: (parent: Parent, _args: unknown, ctx: Context) =>
    ctx.prisma.user.findUnique({ where: { id: parent.userId as string } }),
};

export const NotificationQueries = {
  myNotifications: async (_parent: unknown, args: PaginationArgs, ctx: Context) =>
    getMyNotifications(ctx.prisma, ctx.userId, args),

  unreadNotificationCount: async (_parent: unknown, _args: unknown, ctx: Context) =>
    getUnreadNotificationCount(ctx.prisma, ctx.userId),
};

export const NotificationMutations = {
  markNotificationRead: async (_parent: unknown, { id }: IdArg, ctx: Context) =>
    markNotificationRead(ctx.prisma, ctx.userId, id),

  markAllNotificationsRead: async (_parent: unknown, _args: unknown, ctx: Context) =>
    markAllNotificationsRead(ctx.prisma, ctx.userId),
};
