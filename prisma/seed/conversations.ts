import { faker } from "@faker-js/faker";
import type { SeedContext, SeedCounts } from "./types.js";
import { User } from "@prisma/client";

const SEED_CONVERSATIONS = 500;
const MSGS_PER_CONV = 40;

export async function seedConversations(
  ctx: SeedContext,
  counts: SeedCounts,
  users: User[],
): Promise<void> {
  // Conversations (no participants yet — need IDs back)
  const convData = Array.from({ length: SEED_CONVERSATIONS }, () => ({
    title: faker.datatype.boolean(0.5)
      ? faker.lorem.words({ min: 2, max: 6 })
      : undefined,
  }));

  await ctx.prisma.conversation.createMany({ data: convData });
  const conversations = await ctx.prisma.conversation.findMany();
  counts.conversations = conversations.length;
  console.log(`Created ${conversations.length} conversations`);

  // Conversation participants — 2 per conversation
  const cpSet = new Set<string>();
  const cpData: Array<{
    conversationId: string;
    userId: string;
    lastReadAt?: Date;
  }> = [];
  for (const conv of conversations) {
    const [u1, u2] = faker.helpers.arrayElements(users, 2);
    for (const u of [u1, u2]) {
      const key = `${conv.id}_${u.id}`;
      if (cpSet.has(key)) continue;
      cpSet.add(key);
      cpData.push({
        conversationId: conv.id,
        userId: u.id,
        lastReadAt: faker.datatype.boolean(0.6)
          ? faker.date.recent()
          : undefined,
      });
    }
  }

  await ctx.prisma.conversationParticipant.createMany({ data: cpData });

  // Messages — bulk insert in batches
  const msgData: Array<{
    conversationId: string;
    senderId: string;
    content: string;
  }> = [];
  for (const conv of conversations) {
    const participants = cpData.filter((cp) => cp.conversationId === conv.id);
    if (participants.length < 2) continue;
    const n = faker.number.int({ min: 10, max: MSGS_PER_CONV });
    for (let i = 0; i < n; i++) {
      const sender = faker.helpers.arrayElement(participants);
      msgData.push({
        conversationId: conv.id,
        senderId: sender.userId,
        content: faker.lorem.sentences({ min: 1, max: 4 }),
      });
    }
  }

  for (let i = 0; i < msgData.length; i += 2000) {
    await ctx.prisma.message.createMany({ data: msgData.slice(i, i + 2000) });
  }

  counts.messages = msgData.length;
  console.log(`Created ${msgData.length} messages`);
}
