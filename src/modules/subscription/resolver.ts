import type { Context } from "@gql-prisma-api/types/context.js";
import type { Subscription as SubscriptionModel } from "@prisma/client";
import type { SubscriptionPlan } from "./types/index.js";
import type { TrialEndingInput } from "./service.js";

export const Subscription = {
  user: (parent: SubscriptionModel, _args: unknown, ctx: Context) =>
    ctx.services.subscription.resolveSubscriptionUser(parent.userId),
};

export const Query = {
  mySubscription: (_parent: unknown, _args: unknown, ctx: Context) =>
    ctx.services.subscription.getMySubscription(ctx.userId),

  subscriptions: (_parent: unknown, _args: unknown, ctx: Context) =>
    ctx.services.subscription.getAllSubscriptions(ctx.userId),
};

export const Mutation = {
  createSubscription: (_parent: unknown, { plan }: { plan: SubscriptionPlan }, ctx: Context) =>
    ctx.services.subscription.createSubscription(ctx.userId, plan),

  cancelSubscription: (_parent: unknown, _args: unknown, ctx: Context) =>
    ctx.services.subscription.cancelSubscription(ctx.userId),

  triggerTrialEndingNotification: (
    _parent: unknown,
    { input }: { input: TrialEndingInput },
    ctx: Context,
  ) => ctx.services.subscription.triggerTrialEndingNotification(ctx.userId, input),
};
