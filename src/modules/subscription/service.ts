import type { PrismaClient, SubscriptionPlan } from "@prisma/client";
import { requireAuth } from "@gql-prisma-api/utils/errors.js";

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
  return prisma.subscription.create({
    data: { userId: userId!, plan, startDate: new Date() },
  });
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
  return prisma.subscription.update({
    where: { id: sub.id },
    data: { status: "CANCELLED", cancelledAt: new Date(), autoRenew: false },
  });
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
