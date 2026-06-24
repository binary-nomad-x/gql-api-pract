import type { Context } from "@gql-prisma-api/types/context.js";
import type { Conversation as ConversationModel, ConversationParticipant as ConversationParticipantModel, Message as MessageModel } from "@prisma/client";
import type { PaginationArgs } from "@gql-prisma-api/types/graphql.js";
import {
  startConversation, sendMessage, markConversationRead,
  getMyConversations, getConversation, getConversationMessages,
  resolveConversationParticipants, resolveConversationMessages,
  resolveConversationLastMessage, resolveConversationMessageCount,
  resolveConversationParticipantConversation, resolveConversationParticipantUser,
  resolveMessageConversation, resolveMessageSender,
} from "./service.js";

export const Conversation = {
  participants: (parent: ConversationModel, _args: unknown, ctx: Context) =>
    resolveConversationParticipants(ctx.prisma, parent.id),
  messages: (parent: ConversationModel, args: PaginationArgs, ctx: Context) =>
    resolveConversationMessages(ctx.prisma, parent.id, args.limit, args.offset),
  lastMessage: (parent: ConversationModel, _args: unknown, ctx: Context) =>
    resolveConversationLastMessage(ctx.prisma, parent.id),
  messageCount: (parent: ConversationModel, _args: unknown, ctx: Context) =>
    resolveConversationMessageCount(ctx.prisma, parent.id),
};

export const ConversationParticipant = {
  conversation: (parent: ConversationParticipantModel, _args: unknown, ctx: Context) =>
    resolveConversationParticipantConversation(ctx.prisma, parent.conversationId),
  user: (parent: ConversationParticipantModel, _args: unknown, ctx: Context) =>
    resolveConversationParticipantUser(ctx.prisma, parent.userId),
};

export const Message = {
  conversation: (parent: MessageModel, _args: unknown, ctx: Context) =>
    resolveMessageConversation(ctx.prisma, parent.conversationId),
  sender: (parent: MessageModel, _args: unknown, ctx: Context) =>
    resolveMessageSender(ctx.prisma, parent.senderId),
};

export const Query = {
  myConversations: (_parent: unknown, _args: unknown, ctx: Context) =>
    getMyConversations(ctx.prisma, ctx.userId),

  conversation: (_parent: unknown, { id }: { id: string }, ctx: Context) =>
    getConversation(ctx.prisma, ctx.userId, id),

  messages: (
    _parent: unknown,
    args: { conversationId: string } & PaginationArgs,
    ctx: Context,
  ) => getConversationMessages(ctx.prisma, ctx.userId, args.conversationId, args.limit, args.offset),
};

export const Mutation = {
  startConversation: (
    _parent: unknown,
    { userId, title }: { userId: string; title?: string },
    ctx: Context,
  ) => startConversation(ctx.prisma, ctx.userId, userId, title),

  sendMessage: (
    _parent: unknown,
    { conversationId, content }: { conversationId: string; content: string },
    ctx: Context,
  ) => sendMessage(ctx.prisma, ctx.userId, conversationId, content),

  markConversationRead: (
    _parent: unknown,
    { conversationId }: { conversationId: string },
    ctx: Context,
  ) => markConversationRead(ctx.prisma, ctx.userId, conversationId),
};
