import type { PrismaClient, SubscriptionPlan } from "@prisma/client";
import { requireAuth } from "@gql-prisma-api/utils/errors.js";
import { logger } from "@gql-prisma-api/utils/logger.js";
import { triggerTrialEndingNotification as triggerNovu } from "@gql-prisma-api/utils/novu.js";

export interface TrialEndingInput {
  planName: string;
  trialEnd: string;
  nextBillingDate: string;
  daysUntilAction: string;
  nextChargeDisplayAmount: string;
  paymentMethodType: string;
  notifyPatient: boolean;
  notifyDoctor: boolean;
  notifyAdmin: boolean;
}

export async function createSubscription(
  prisma: PrismaClient,
  userId: string | undefined,
  plan: SubscriptionPlan,
) {
  requireAuth(userId);
  const existing = await prisma.subscription.findFirst({
    where: { userId: userId!, status: "ACTIVE" },
  });
  if (existing) throw new Error("Already have an active subscription");
  const sub = await prisma.subscription.create({
    data: { userId: userId!, plan, startDate: new Date() },
  });
  logger.info("Subscription created", { userId: userId!, plan, subscriptionId: sub.id });
  return sub;
}

export async function cancelSubscription(
  prisma: PrismaClient,
  userId: string | undefined,
) {
  requireAuth(userId);
  const sub = await prisma.subscription.findFirst({
    where: { userId: userId!, status: "ACTIVE" },
  });
  if (!sub) throw new Error("No active subscription found");
  const updated = await prisma.subscription.update({
    where: { id: sub.id },
    data: { status: "CANCELLED", cancelledAt: new Date(), autoRenew: false },
  });
  logger.info("Subscription cancelled", { userId: userId!, subscriptionId: sub.id });
  return updated;
}

export async function triggerTrialEndingNotification(
  prisma: PrismaClient,
  userId: string | undefined,
  input: TrialEndingInput,
): Promise<boolean> {
  requireAuth(userId);

  await triggerNovu(userId!, {
    subscription: {
      plan: { name: input.planName },
      trialEnd: input.trialEnd,
      nextBillingDate: input.nextBillingDate,
    },
    notification: {
      daysUntilAction: input.daysUntilAction,
    },
    billing: {
      nextChargeDisplayAmount: input.nextChargeDisplayAmount,
    },
    payment: {
      method: { type: input.paymentMethodType },
    },
    notify: {
      patient: input.notifyPatient,
      doctor: input.notifyDoctor,
      admin: input.notifyAdmin,
    },
  });

  logger.info("Trial ending notification triggered", { userId: userId!, planName: input.planName });
  return true;
}

export async function getMySubscription(
  prisma: PrismaClient,
  userId: string | undefined,
) {
  requireAuth(userId);
  return prisma.subscription.findFirst({ where: { userId: userId! }, orderBy: { createdAt: "desc" } });
}

export async function getAllSubscriptions(
  prisma: PrismaClient,
  userId: string | undefined,
) {
  requireAuth(userId);
  return prisma.subscription.findMany({ where: { userId: userId! } });
}
