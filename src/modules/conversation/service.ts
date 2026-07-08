import { BaseService } from "@gql-prisma-api/lib/BaseService.js";
import { requireAuth } from "@gql-prisma-api/utils/errors.js";
import { logger } from "@gql-prisma-api/utils/logger.js";

export class ConversationService extends BaseService {
  resolveConversationParticipants(conversationId: string) {
    return this.core.conversationParticipant.findMany({
      where: { conversationId },
      include: { user: true },
    });
  }

  resolveConversationMessages(conversationId: string, limit?: number, offset?: number) {
    return this.core.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: "asc" },
      take: limit ?? 50,
      skip: offset ?? 0,
    });
  }

  resolveConversationLastMessage(conversationId: string) {
    return this.core.message.findFirst({
      where: { conversationId },
      orderBy: { createdAt: "desc" },
    });
  }

  resolveConversationMessageCount(conversationId: string) {
    return this.core.message.count({ where: { conversationId } });
  }

  resolveConversationParticipantConversation(conversationId: string) {
    return this.core.conversation.findUnique({ where: { id: conversationId } });
  }

  resolveConversationParticipantUser(userId: string) {
    return this.core.user.findUnique({ where: { id: userId } });
  }

  resolveMessageConversation(conversationId: string) {
    return this.core.conversation.findUnique({ where: { id: conversationId } });
  }

  resolveMessageSender(senderId: string) {
    return this.core.user.findUnique({ where: { id: senderId } });
  }

  async startConversation(
    userId: string | undefined,
    targetUserId: string,
    title?: string,
  ) {
    requireAuth(userId);
    if (targetUserId === userId)
      throw new Error("Cannot start conversation with yourself");
    const target = await this.core.user.findUnique({ where: { id: targetUserId } });
    if (!target) throw new Error("User not found");

    const conv = await this.core.conversation.create({
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
    const participant = await this.core.conversationParticipant.findUnique({
      where: { conversationId_userId: { conversationId, userId: userId! } },
    });

    if (!participant) throw new Error("Not a participant of this conversation");
    const message = await this.core.message.create({
      data: { conversationId, senderId: userId!, content },
      include: { sender: true },
    });

    await this.core.conversationParticipant.updateMany({
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
    await this.core.conversationParticipant.updateMany({
      where: { conversationId, userId: userId! },
      data: { lastReadAt: new Date() },
    });
    return true;
  }

  getMyConversations(userId: string | undefined) {
    requireAuth(userId);
    return this.core.conversation.findMany({
      where: { participants: { some: { userId: userId! } } },
      include: { participants: { include: { user: true } } },
      orderBy: { updatedAt: "desc" },
    });
  }

  async getConversation(userId: string | undefined, id: string) {
    requireAuth(userId);
    return this.core.conversation.findFirst({
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
    return this.core.message.findMany({
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
