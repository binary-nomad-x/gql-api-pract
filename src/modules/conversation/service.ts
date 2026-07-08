import { BaseService } from "@gql-prisma-api/lib/BaseService.js";
import { requireAuth } from "@gql-prisma-api/utils/errors.js";
import { logger } from "@gql-prisma-api/utils/logger.js";

export class ConversationService {
  constructor(private readonly base: BaseService) {}
  resolveConversationParticipants(conversationId: string) {
    return this.base.core.conversationParticipant.findMany({
      where: { conversationId },
      include: { user: true },
    });
  }

  resolveConversationMessages(conversationId: string, limit?: number, offset?: number) {
    return this.base.core.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: "asc" },
      take: limit ?? 50,
      skip: offset ?? 0,
    });
  }

  resolveConversationLastMessage(conversationId: string) {
    return this.base.core.message.findFirst({
      where: { conversationId },
      orderBy: { createdAt: "desc" },
    });
  }

  resolveConversationMessageCount(conversationId: string) {
    return this.base.core.message.count({ where: { conversationId } });
  }

  resolveConversationParticipantConversation(conversationId: string) {
    return this.base.core.conversation.findUnique({ where: { id: conversationId } });
  }

  resolveConversationParticipantUser(userId: string) {
    return this.base.core.user.findUnique({ where: { id: userId } });
  }

  resolveMessageConversation(conversationId: string) {
    return this.base.core.conversation.findUnique({ where: { id: conversationId } });
  }

  resolveMessageSender(senderId: string) {
    return this.base.core.user.findUnique({ where: { id: senderId } });
  }

  async startConversation(
    userId: string | undefined,
    targetUserId: string,
    title?: string,
  ) {
    requireAuth(userId);
    if (targetUserId === userId)
      throw new Error("Cannot start conversation with yourself");
    const target = await this.base.core.user.findUnique({ where: { id: targetUserId } });
    if (!target) throw new Error("User not found");

    const conv = await this.base.core.conversation.create({
      data: {
        title,
        participants: {
          createMany: {
            data: [
              { userId: userId!, lastReadAt: new Date() },
              { userId: targetUserId },
            ],
          },
        },
      },
      include: { participants: { include: { user: true } } },
    });

    logger.info("Conversation started", {
      conversationId: conv.id,
      userId: userId!,
      targetUserId,
    });
    return conv;
  }

  async sendMessage(
    userId: string | undefined,
    conversationId: string,
    content: string,
  ) {
    requireAuth(userId);
    const participant = await this.base.core.conversationParticipant.findUnique({
      where: { conversationId_userId: { conversationId, userId: userId! } },
    });

    if (!participant) throw new Error("Not a participant of this conversation");
    const message = await this.base.core.message.create({
      data: { conversationId, senderId: userId!, content },
      include: { sender: true },
    });

    await this.base.core.conversationParticipant.updateMany({
      where: { conversationId, userId: userId! },
      data: { lastReadAt: new Date() },
    });

    logger.info("Message sent", {
      messageId: message.id,
      conversationId,
      senderId: userId!,
    });

    return message;
  }

  async markConversationRead(
    userId: string | undefined,
    conversationId: string,
  ) {
    requireAuth(userId);
    await this.base.core.conversationParticipant.updateMany({
      where: { conversationId, userId: userId! },
      data: { lastReadAt: new Date() },
    });
    return true;
  }

  getMyConversations(userId: string | undefined) {
    requireAuth(userId);
    return this.base.core.conversation.findMany({
      where: { participants: { some: { userId: userId! } } },
      include: { participants: { include: { user: true } } },
      orderBy: { updatedAt: "desc" },
    });
  }

  async getConversation(userId: string | undefined, id: string) {
    requireAuth(userId);
    return this.base.core.conversation.findFirst({
      where: { id, participants: { some: { userId: userId! } } },
      include: { participants: { include: { user: true } } },
    });
  }

  getConversationMessages(
    userId: string | undefined,
    conversationId: string,
    limit?: number,
    offset?: number,
  ) {
    requireAuth(userId);
    return this.base.core.message.findMany({
      where: {
        conversationId,
        conversation: { participants: { some: { userId: userId! } } },
      },
      orderBy: { createdAt: "asc" },
      take: limit ?? 50,
      skip: offset ?? 0,
    });
  }
}
