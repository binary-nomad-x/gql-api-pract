import type { Context } from "@gql-prisma-api/types/context.js";
import type { Parent, PaginationArgs } from "@gql-prisma-api/types/graphql.js";
import {
  startConversation, sendMessage, markConversationRead,
  getMyConversations, getConversation, getConversationMessages,
} from "./service.js";

export const ConversationResolver = {
  participants: (parent: Parent, _args: unknown, ctx: Context) =>
    ctx.prisma.conversationParticipant.findMany({
      where: { conversationId: parent.id },
      include: { user: true },
    }),
  messages: (parent: Parent, args: PaginationArgs, ctx: Context) =>
    ctx.prisma.message.findMany({
      where: { conversationId: parent.id },
      orderBy: { createdAt: "asc" },
      take: args.limit ?? 50,
      skip: args.offset ?? 0,
    }),
  lastMessage: (parent: Parent, _args: unknown, ctx: Context) =>
    ctx.prisma.message.findFirst({
      where: { conversationId: parent.id },
      orderBy: { createdAt: "desc" },
    }),
  messageCount: (parent: Parent, _args: unknown, ctx: Context) =>
    ctx.prisma.message.count({ where: { conversationId: parent.id } }),
};

export const ConversationParticipantResolver = {
  conversation: (parent: Parent, _args: unknown, ctx: Context) =>
    ctx.prisma.conversation.findUnique({ where: { id: parent.conversationId as string } }),
  user: (parent: Parent, _args: unknown, ctx: Context) =>
    ctx.prisma.user.findUnique({ where: { id: parent.userId as string } }),
};

export const MessageResolver = {
  conversation: (parent: Parent, _args: unknown, ctx: Context) =>
    ctx.prisma.conversation.findUnique({ where: { id: parent.conversationId as string } }),
  sender: (parent: Parent, _args: unknown, ctx: Context) =>
    ctx.prisma.user.findUnique({ where: { id: parent.senderId as string } }),
};

export const ConversationQueries = {
  myConversations: async (_parent: unknown, _args: unknown, ctx: Context) =>
    getMyConversations(ctx.prisma, ctx.userId),

  conversation: async (_parent: unknown, { id }: { id: string }, ctx: Context) =>
    getConversation(ctx.prisma, ctx.userId, id),

  messages: async (
    _parent: unknown,
    args: { conversationId: string } & PaginationArgs,
    ctx: Context,
  ) => getConversationMessages(ctx.prisma, ctx.userId, args.conversationId, args.limit, args.offset),
};

export const ConversationMutations = {
  startConversation: async (
    _parent: unknown,
    { userId, title }: { userId: string; title?: string },
    ctx: Context,
  ) => startConversation(ctx.prisma, ctx.userId, userId, title),

  sendMessage: async (
    _parent: unknown,
    { conversationId, content }: { conversationId: string; content: string },
    ctx: Context,
  ) => sendMessage(ctx.prisma, ctx.userId, conversationId, content),

  markConversationRead: async (
    _parent: unknown,
    { conversationId }: { conversationId: string },
    ctx: Context,
  ) => markConversationRead(ctx.prisma, ctx.userId, conversationId),
};
