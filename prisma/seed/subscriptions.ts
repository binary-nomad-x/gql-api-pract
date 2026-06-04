import { faker } from "@faker-js/faker";
import type { SeedContext, SeedCounts } from "./types.js";
import type { User, SubscriptionPlan, SubscriptionStatus } from "@prisma/client";

const PLANS: SubscriptionPlan[] = ["FREE", "BASIC", "PREMIUM", "ENTERPRISE"];
const STATUSES: SubscriptionStatus[] = ["ACTIVE", "ACTIVE", "ACTIVE", "CANCELLED", "PAST_DUE", "EXPIRED"];

export async function seedSubscriptions(ctx: SeedContext, counts: SeedCounts, users: User[]): Promise<void> {
  await ctx.prisma.subscription.createMany({
    data: users.map((u) => ({
      userId: u.id,
      plan: faker.helpers.arrayElement(PLANS),
      status: faker.helpers.arrayElement(STATUSES),
      startDate: faker.date.past({ years: 1 }),
      endDate: faker.datatype.boolean(0.6) ? faker.date.future({ years: 1 }) : undefined,
      autoRenew: faker.datatype.boolean(0.7),
      cancelledAt: faker.datatype.boolean(0.2) ? faker.date.recent() : undefined,
    })),
  });
  
  counts.subscriptions = users.length;
}
