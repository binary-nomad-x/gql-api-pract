import { faker } from "@faker-js/faker";
import type { SeedContext, SeedCounts } from "./types.js";

export async function seedConversations(
  ctx: SeedContext,
  counts: SeedCounts,
  userIds: string[],
): Promise<void> {
  const pickRandom = <T>(arr: T[]): T =>
    arr[Math.floor(Math.random() * arr.length)];

  const conversationCount = Math.floor(userIds.length * 0.5);
  const usedPairs = new Set<string>();

  for (let i = 0; i < conversationCount; i++) {
    let userA: string;
    let userB: string;
    let pairKey: string;

    do {
      userA = pickRandom(userIds);
      userB = pickRandom(userIds);
      pairKey = [userA, userB].sort().join(":");
    } while (userA === userB || usedPairs.has(pairKey));

    usedPairs.add(pairKey);

    const conversation = await ctx.prisma.conversation.create({
      data: {
        title: faker.lorem.words(3),
      },
    });
    counts.conversations++;

    await ctx.prisma.conversationParticipant.createMany({
      data: [
        { conversationId: conversation.id, userId: userA },
        { conversationId: conversation.id, userId: userB },
      ],
    });
    counts.participants += 2;

    const messageCount = faker.number.int({ min: 3, max: 10 });
    const messages: Array<{
      conversationId: string;
      senderId: string;
      content: string;
    }> = [];

    for (let m = 0; m < messageCount; m++) {
      messages.push({
        conversationId: conversation.id,
        senderId: m % 2 === 0 ? userA : userB,
        content: faker.lorem.sentences({ min: 1, max: 3 }),
      });
    }

    await ctx.prisma.message.createMany({ data: messages });
    counts.messages += messages.length;
  }
}
