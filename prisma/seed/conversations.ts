import { faker } from "@faker-js/faker";
import type { SeedContext, SeedCounts } from "./types.js";
import { generateIds, bulkInsert } from "./utils.js";

const SEED_CONVERSATIONS = 500;
const MSGS_PER_CONV = 40;

export async function seedConversations(
  ctx: SeedContext,
  counts: SeedCounts,
  userIds: string[],
): Promise<void> {
  const convIds = generateIds(SEED_CONVERSATIONS);
  await bulkInsert(ctx.pool, "conversations", convIds.map((id) => ({
    id,
    title: faker.datatype.boolean(0.5) ? faker.lorem.words({ min: 2, max: 6 }) : undefined,
    updatedAt: new Date(),
  })));
  counts.conversations = convIds.length;
  console.log(`Created ${convIds.length} conversations`);

  // Conversation participants — 2 per conversation
  const cpSet = new Set<string>();
  const cpRows: Array<{ id: string; conversationId: string; userId: string; lastReadAt?: Date }> = [];
  const cpIds = generateIds(convIds.length * 2);
  let cpIdx = 0;
  for (const cid of convIds) {
    const [u1, u2] = faker.helpers.arrayElements(userIds, 2);
    for (const u of [u1, u2]) {
      const key = `${cid}_${u}`;
      if (cpSet.has(key)) continue;
      cpSet.add(key);
      cpRows.push({
        id: cpIds[cpIdx++], conversationId: cid, userId: u,
        lastReadAt: faker.datatype.boolean(0.6) ? faker.date.recent() : undefined,
      });
    }
  }
  await bulkInsert(ctx.pool, "conversation_participants", cpRows);

  // Messages
  const msgRows: Array<{ id: string; conversationId: string; senderId: string; content: string; updatedAt: Date }> = [];
  for (const cid of convIds) {
    const participants = cpRows.filter((cp) => cp.conversationId === cid);
    if (participants.length < 2) continue;
    const n = faker.number.int({ min: 10, max: MSGS_PER_CONV });
    const msgIds = generateIds(n);
    for (let j = 0; j < n; j++) {
      msgRows.push({
        id: msgIds[j], conversationId: cid,
        senderId: faker.helpers.arrayElement(participants).userId,
        content: faker.lorem.sentences({ min: 1, max: 4 }),
        updatedAt: new Date(),
      });
    }
  }
  await bulkInsert(ctx.pool, "messages", msgRows, 2000);
  counts.messages = msgRows.length;
  console.log(`Created ${msgRows.length} messages`);
}
