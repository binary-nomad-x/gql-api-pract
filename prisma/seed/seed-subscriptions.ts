import { faker } from "@faker-js/faker";
import type { SeedContext, SeedCounts } from "./types.js";

const PLANS = ["FREE", "BASIC", "PRO", "ENTERPRISE"];

export async function seedSubscriptions(
  ctx: SeedContext,
  counts: SeedCounts,
  userIds: string[],
): Promise<void> {
  const data: Array<{
    userId: string;
    plan: string;
    status: string;
    startDate: Date;
    endDate: Date | null;
    autoRenew: boolean;
  }> = [];

  for (const userId of userIds) {
    const plan = faker.helpers.arrayElement(PLANS);
    const startDate = faker.date.past();
    const isActive = Math.random() > 0.2;

    data.push({
      userId,
      plan,
      status: isActive ? "ACTIVE" : "CANCELLED",
      startDate,
      endDate: isActive ? faker.date.future() : faker.date.past(),
      autoRenew: Math.random() > 0.3,
    });
  }

  await ctx.prisma.subscription.createMany({ data });
  counts.subscriptions += data.length;
}
