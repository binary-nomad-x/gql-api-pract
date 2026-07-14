import type { Context } from "@gql-prisma-api/types/context.js";
import type {
  Conversation as ConversationModel,
  ConversationParticipant as ConversationParticipantModel,
  Message as MessageModel,
} from "@prisma/client";
import type { PaginationArgs } from "@gql-prisma-api/types/graphql.js";
import { requireAuth } from "@gql-prisma-api/utils/errors.js";

export const Conversation = {
  participants: (parent: ConversationModel, _args: unknown, ctx: Context) =>
    ctx.services.conversation.resolveConversationParticipants(parent.id),
  messages: (parent: ConversationModel, args: PaginationArgs, ctx: Context) =>
    ctx.services.conversation.resolveConversationMessages(
      parent.id,
      args.limit,
      args.offset,
    ),
  lastMessage: (parent: ConversationModel, _args: unknown, ctx: Context) =>
    ctx.services.conversation.resolveConversationLastMessage(parent.id),
  messageCount: (parent: ConversationModel, _args: unknown, ctx: Context) =>
    ctx.services.conversation.resolveConversationMessageCount(parent.id),
};

export const ConversationParticipant = {
  conversation: (
    parent: ConversationParticipantModel,
    _args: unknown,
    ctx: Context,
  ) =>
    ctx.services.conversation.resolveConversationParticipantConversation(
      parent.conversationId,
    ),
  user: (parent: ConversationParticipantModel, _args: unknown, ctx: Context) =>
    ctx.services.conversation.resolveConversationParticipantUser(parent.userId),
};

export const Message = {
  conversation: (parent: MessageModel, _args: unknown, ctx: Context) =>
    ctx.services.conversation.resolveMessageConversation(parent.conversationId),
  sender: (parent: MessageModel, _args: unknown, ctx: Context) =>
    ctx.services.conversation.resolveMessageSender(parent.senderId),
};

export const Query = {
  myConversations: (_parent: unknown, _args: unknown, ctx: Context) => {
    requireAuth(ctx.userId);
    return ctx.services.conversation.getMyConversations(ctx.userId);
  },

  conversation: (_parent: unknown, { id }: { id: string }, ctx: Context) => {
    requireAuth(ctx.userId);
    return ctx.services.conversation.getConversation(ctx.userId, id);
  },

  messages: (
    _parent: unknown,
    args: { conversationId: string } & PaginationArgs,
    ctx: Context,
  ) => {
    requireAuth(ctx.userId);
    return ctx.services.conversation.getConversationMessages(
      ctx.userId,
      args.conversationId,
      args.limit,
      args.offset,
    );
  },
};

export const Mutation = {
  startConversation: (
    _parent: unknown,
    { userId, title }: { userId: string; title?: string },
    ctx: Context,
  ) => {
    requireAuth(ctx.userId);
    return ctx.services.conversation.startConversation(
      ctx.userId,
      userId,
      title,
    );
  },

  sendMessage: (
    _parent: unknown,
    { conversationId, content }: { conversationId: string; content: string },
    ctx: Context,
  ) => {
    requireAuth(ctx.userId);
    return ctx.services.conversation.sendMessage(
      ctx.userId,
      conversationId,
      content,
    );
  },

  markConversationRead: (
    _parent: unknown,
    { conversationId }: { conversationId: string },
    ctx: Context,
  ) => {
    requireAuth(ctx.userId);
    return ctx.services.conversation.markConversationRead(
      ctx.userId,
      conversationId,
    );
  },
};
