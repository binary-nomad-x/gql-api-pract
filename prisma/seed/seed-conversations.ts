import { faker } from "@faker-js/faker";
import type { SeedContext, SeedCounts, MessageSeed } from "./types.js";

export async function seedConversations(
  ctx: SeedContext,
  counts: SeedCounts,
  userIds: string[],
): Promise<void> {

  const conversationCount = Math.floor(userIds.length * 0.6);
  const usedPairs = new Set<string>();

  for (let i = 0; i < conversationCount; i++) {
    let userA: string;
    let userB: string;
    let pairKey: string;

    do {
      userA = faker.helpers.arrayElement(userIds);
      userB = faker.helpers.arrayElement(userIds);
      pairKey = [userA, userB].sort().join(":");
    } while (userA === userB || usedPairs.has(pairKey));

    usedPairs.add(pairKey);

    const conversation = await ctx.prisma.conversation.create({
      data: {
        title: faker.lorem.words(3),
        type: "direct",
        isArchived: false,
        isMuted: Math.random() > 0.85,
        participantCount: 2,
        metadata: {
          initiatedBy: userA,
          topic: faker.lorem.word(),
        },
      },
    });

    counts.conversations++;

    await ctx.prisma.conversationParticipant.createMany({
      data: [
        {
          conversationId: conversation.id,
          userId: userA,
          nickname: "",
          role: "member",
          isMuted: false,
          notificationsEnabled: true,
          lastReadAt: faker.date.past(),
          pinnedAt: Math.random() > 0.9 ? faker.date.past() : null,
        },
        {
          conversationId: conversation.id,
          userId: userB,
          nickname: "",
          role: "member",
          isMuted: Math.random() > 0.9,
          notificationsEnabled: true,
          lastReadAt: faker.date.past(),
          pinnedAt: null,
        },
      ],
    });

    counts.participants += 2;

    const messageCount = faker.number.int({ min: 5, max: 15 });
    const messages: MessageSeed[] = [];

    for (let m = 0; m < messageCount; m++) {
      const sender = m % 2 === 0 ? userA : userB;
      const isRead = m < messageCount - 1;

      messages.push({
        conversationId: conversation.id,
        senderId: sender,
        content: faker.lorem.sentences({ min: 1, max: 4 }),
        type: "text",
        isRead,
        readAt: isRead ? faker.date.past() : null,
        deliveredAt: faker.date.past(),
        attachments: [],
        reactions: {},
        parentId: null,
      });
    }

    await ctx.prisma.message.createMany({ data: messages });
    counts.messages += messages.length;

    // Update last message info
    const lastMsg = messages[messages.length - 1];
    await ctx.prisma.conversation.update({
      where: { id: conversation.id },
      data: {
        lastMessageAt: new Date(),
        lastMessageContent: lastMsg.content,
        lastMessageSenderId: lastMsg.senderId,
      },
    });
  }
}
