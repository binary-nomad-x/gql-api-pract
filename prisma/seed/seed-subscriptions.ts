import { faker } from "@faker-js/faker";
import type { SeedContext, SeedCounts } from "./types.js";

const PLANS = ["FREE", "BASIC", "PRO", "ENTERPRISE"];
const BILLING_CYCLES = ["monthly", "quarterly", "annual"];
const PAYMENT_METHODS = ["credit_card", "paypal", "stripe", "bank_transfer"];

export async function seedSubscriptions(ctx: SeedContext, counts: SeedCounts, userIds: string[]): Promise<void> {
  const data: {
    userId: string;
    plan: string;
    status: string;
    startDate: Date;
    endDate: Date | null;
    trialStartDate: Date | null;
    trialEndDate: Date | null;
    autoRenew: boolean;
    billingCycle: string;
    paymentMethod: string | null;
    cancelledBy: string | null;
    cancellationReason: string | null;
    cancelledAt: Date | null;
    lastBillingAt: Date | null;
    nextBillingAt: Date | null;
    currentPeriodStart: Date | null;
    currentPeriodEnd: Date | null;
    metadata: object;
  }[] = [];

  for (const userId of userIds) {
    const plan = faker.helpers.arrayElement(PLANS);
    const startDate = faker.date.past();
    const isActive = Math.random() > 0.15;
    const nextBilling = faker.date.future();
    const currentPeriodStart = faker.date.past({ years: 1 });
    const currentPeriodEnd = faker.date.future({ years: 2 });

    data.push({
      userId,
      plan,
      status: isActive ? "ACTIVE" : "CANCELLED",
      startDate,
      endDate: isActive ? faker.date.future() : faker.date.past(),
      trialStartDate: plan !== "FREE" ? faker.date.past({ years: 1 }) : null,
      trialEndDate: plan !== "FREE" ? faker.date.past({ years: 1 }) : null,
      autoRenew: isActive && Math.random() > 0.3,
      billingCycle: plan === "FREE" ? "monthly" : faker.helpers.arrayElement(BILLING_CYCLES),
      paymentMethod: plan === "FREE" ? null : faker.helpers.arrayElement(PAYMENT_METHODS),
      cancelledBy: isActive ? null : faker.helpers.arrayElement(["user", "system", "admin"]),
      cancellationReason: isActive
        ? null
        : faker.helpers.arrayElement(["Too expensive", "Not using enough", "Found alternative", "Technical issues", "No longer needed"]),
      cancelledAt: isActive ? null : faker.date.past(),
      lastBillingAt: isActive ? faker.date.recent({ days: 30 }) : faker.date.past(),
      nextBillingAt: nextBilling,
      currentPeriodStart,
      currentPeriodEnd,
      metadata: {
        planTier: plan,
        discountApplied: plan !== "FREE",
        referrer: Math.random() > 0.7 ? faker.internet.email() : null,
      },
    });
  }

  await ctx.prisma.subscription.createMany({ data });
  counts.subscriptions += data.length;
}
