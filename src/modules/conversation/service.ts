import type { PrismaClient } from "@prisma/client";
import { requireAuth } from "@gql-prisma-api/utils/errors.js";
import { logger } from "@gql-prisma-api/utils/logger.js";

// --- Type-field resolver functions ---
export function resolveConversationParticipants(prisma: PrismaClient, conversationId: string) {
  return prisma.conversationParticipant.findMany({
    where: { conversationId },
    include: { user: true },
  });
}

export function resolveConversationMessages(prisma: PrismaClient, conversationId: string, limit?: number, offset?: number) {
  return prisma.message.findMany({
    where: { conversationId },
    orderBy: { createdAt: "asc" },
    take: limit ?? 50,
    skip: offset ?? 0,
  });
}

export function resolveConversationLastMessage(prisma: PrismaClient, conversationId: string) {
  return prisma.message.findFirst({
    where: { conversationId },
    orderBy: { createdAt: "desc" },
  });
}

export function resolveConversationMessageCount(prisma: PrismaClient, conversationId: string) {
  return prisma.message.count({ where: { conversationId } });
}

export function resolveConversationParticipantConversation(prisma: PrismaClient, conversationId: string) {
  return prisma.conversation.findUnique({ where: { id: conversationId } });
}

export function resolveConversationParticipantUser(prisma: PrismaClient, userId: string) {
  return prisma.user.findUnique({ where: { id: userId } });
}

export function resolveMessageConversation(prisma: PrismaClient, conversationId: string) {
  return prisma.conversation.findUnique({ where: { id: conversationId } });
}

export function resolveMessageSender(prisma: PrismaClient, senderId: string) {
  return prisma.user.findUnique({ where: { id: senderId } });
}

// --- Existing business logic functions ---
export async function startConversation(
  prisma: PrismaClient,
  userId: string | undefined,
  targetUserId: string,
  title?: string,
) {
  requireAuth(userId);
  if (targetUserId === userId)
    throw new Error("Cannot start conversation with yourself");
  const target = await prisma.user.findUnique({ where: { id: targetUserId } });
  if (!target) throw new Error("User not found");

  const conv = await prisma.conversation.create({
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

export async function sendMessage(
  prisma: PrismaClient,
  userId: string | undefined,
  conversationId: string,
  content: string,
) {
  requireAuth(userId);
  const participant = await prisma.conversationParticipant.findUnique({
    where: { conversationId_userId: { conversationId, userId: userId! } },
  });

  if (!participant) throw new Error("Not a participant of this conversation");
  const message = await prisma.message.create({
    data: { conversationId, senderId: userId!, content },
    include: { sender: true },
  });

  await prisma.conversationParticipant.updateMany({
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

export async function markConversationRead(
  prisma: PrismaClient,
  userId: string | undefined,
  conversationId: string,
) {
  requireAuth(userId);
  await prisma.conversationParticipant.updateMany({
    where: { conversationId, userId: userId! },
    data: { lastReadAt: new Date() },
  });
  return true;
}

export function getMyConversations(
  prisma: PrismaClient,
  userId: string | undefined,
) {
  requireAuth(userId);
  return prisma.conversation.findMany({
    where: { participants: { some: { userId: userId! } } },
    include: { participants: { include: { user: true } } },
    orderBy: { updatedAt: "desc" },
  });
}

export async function getConversation(
  prisma: PrismaClient,
  userId: string | undefined,
  id: string,
) {
  requireAuth(userId);
  return prisma.conversation.findFirst({
    where: { id, participants: { some: { userId: userId! } } },
    include: { participants: { include: { user: true } } },
  });
}

export function getConversationMessages(
  prisma: PrismaClient,
  userId: string | undefined,
  conversationId: string,
  limit?: number,
  offset?: number,
) {
  requireAuth(userId);
  return prisma.message.findMany({
    where: {
      conversationId,
      conversation: { participants: { some: { userId: userId! } } },
    },
    orderBy: { createdAt: "asc" },
    take: limit ?? 50,
    skip: offset ?? 0,
  });
}
