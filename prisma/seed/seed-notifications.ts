import { faker } from "@faker-js/faker";
import type { SeedContext, SeedCounts } from "./types.js";

const TYPES = ["info", "warning", "success", "error"] as const;

export async function seedNotifications(
  ctx: SeedContext,
  counts: SeedCounts,
  userIds: string[],
): Promise<void> {
  const data: Array<{
    userId: string;
    type: string;
    title: string;
    message: string | null;
    isRead: boolean;
    link: string | null;
    readAt: Date | null;
  }> = [];

  for (const userId of userIds) {
    const n = faker.number.int({ min: 3, max: 8 });
    for (let i = 0; i < n; i++) {
      data.push({
        userId,
        type: faker.helpers.arrayElement(TYPES),
        title: faker.lorem.sentence({ min: 3, max: 6 }),
        message: Math.random() > 0.5 ? faker.lorem.sentence() : null,
        isRead: Math.random() > 0.4,
        link: faker.internet.url(),
        readAt: faker.date.past(),
      });
    }
  }

  await ctx.prisma.notification.createMany({ data });
  counts.notifications += data.length;
}
