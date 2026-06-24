import { faker } from "@faker-js/faker";
import type { SeedContext, SeedCounts } from "./types.js";

const CATEGORIES = ["general", "billing", "technical", "account"];
const PRIORITIES = ["LOW", "MEDIUM", "HIGH", "URGENT"];

export async function seedTickets(
  ctx: SeedContext,
  counts: SeedCounts,
  userIds: string[],
): Promise<void> {
  const pickRandom = <T>(arr: T[]): T =>
    arr[Math.floor(Math.random() * arr.length)];

  const ticketCount = Math.floor(userIds.length * 0.6);

  for (let i = 0; i < ticketCount; i++) {
    const userId = pickRandom(userIds);
    const status = pickRandom(["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"]);

    const ticket = await ctx.prisma.supportTicket.create({
      data: {
        userId,
        subject: faker.lorem.sentence({ min: 4, max: 8 }),
        description: faker.lorem.paragraphs(2),
        status,
        priority: pickRandom(PRIORITIES),
        category: pickRandom(CATEGORIES),
      },
    });
    counts.tickets++;

    const replyCount = faker.number.int({ min: 1, max: 4 });
    const replies: Array<{
      ticketId: string;
      userId: string;
      content: string;
      isStaff: boolean;
    }> = [];

    for (let r = 0; r < replyCount; r++) {
      replies.push({
        ticketId: ticket.id,
        userId: r === 0 ? userId : pickRandom(userIds),
        content: faker.lorem.paragraph(),
        isStaff: r > 0 && Math.random() > 0.5,
      });
    }

    await ctx.prisma.ticketReply.createMany({ data: replies });
    counts.ticketReplies += replies.length;
  }
}
