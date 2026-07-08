import { faker } from "@faker-js/faker";
import type { SeedContext, SeedCounts, SubscriptionSeed } from "./types.js";

const PLANS = ["FREE", "BASIC", "PRO", "ENTERPRISE"];

export async function seedSubscriptions(
  ctx: SeedContext,
  counts: SeedCounts,
  userIds: string[],
): Promise<void> {
  const data: SubscriptionSeed[] = [];

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
      cancelledAt: isActive ? null : faker.date.past(),
    });
  }

  await ctx.prisma.subscription.createMany({ data });
  counts.subscriptions += data.length;
}
