import { faker } from "@faker-js/faker";
import type { SeedContext, SeedCounts } from "./types.js";

const CATEGORIES = ["general", "billing", "technical", "account"];
const PRIORITIES = ["LOW", "MEDIUM", "HIGH", "URGENT"];

export async function seedTickets(
  ctx: SeedContext,
  counts: SeedCounts,
  userIds: string[],
): Promise<void> {
  const ticketCount = Math.floor(userIds.length * 0.6);

  for (let i = 0; i < ticketCount; i++) {
    const userId = faker.helpers.arrayElement(userIds);
    const assignedToId = faker.helpers.arrayElement(userIds);

    const status = faker.helpers.arrayElement([
      "OPEN",
      "IN_PROGRESS",
      "RESOLVED",
      "CLOSED",
    ]);

    const ticket = await ctx.prisma.supportTicket.create({
      data: {
        userId,
        subject: faker.lorem.sentence({ min: 4, max: 8 }),
        description: faker.lorem.paragraphs(2),
        status,
        priority: faker.helpers.arrayElement(PRIORITIES),
        category: faker.helpers.arrayElement(CATEGORIES),
        assignedToId,
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
        userId: r === 0 ? userId : faker.helpers.arrayElement(userIds),
        content: faker.lorem.paragraph(),
        isStaff: r > 0 && Math.random() > 0.5,
      });
    }

    await ctx.prisma.ticketReply.createMany({ data: replies });
    counts.ticketReplies += replies.length;
  }
}
