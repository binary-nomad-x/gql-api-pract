import type { Context } from "@gql-prisma-api/types/context.js";
import type { Parent } from "@gql-prisma-api/types/graphql.js";
import type { SubscriptionPlan } from "@prisma/client";
import {
  createSubscription, cancelSubscription,
  getMySubscription, getAllSubscriptions,
  triggerTrialEndingNotification,
} from "./service.js";
import type { TrialEndingInput } from "./service.js";

export const SubscriptionResolver = {
  user: (parent: Parent, _args: unknown, ctx: Context) =>
    ctx.prisma.user.findUnique({ where: { id: parent.userId as string } }),
};

export const SubscriptionQueries = {
  mySubscription: async (_parent: unknown, _args: unknown, ctx: Context) =>
    getMySubscription(ctx.prisma, ctx.userId),

  subscriptions: async (_parent: unknown, _args: unknown, ctx: Context) =>
    getAllSubscriptions(ctx.prisma, ctx.userId),
};

export const SubscriptionMutations = {
  createSubscription: async (_parent: unknown, { plan }: { plan: SubscriptionPlan }, ctx: Context) =>
    createSubscription(ctx.prisma, ctx.userId, plan),

  cancelSubscription: async (_parent: unknown, _args: unknown, ctx: Context) =>
    cancelSubscription(ctx.prisma, ctx.userId),

  triggerTrialEndingNotification: async (
    _parent: unknown,
    { input }: { input: TrialEndingInput },
    ctx: Context,
  ) => triggerTrialEndingNotification(ctx.prisma, ctx.userId, input),
};
