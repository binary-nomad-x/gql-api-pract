import type { Context } from "@gql-prisma-api/types/context.js";
import type { Subscription as SubscriptionModel } from "@prisma/client";
import type { SubscriptionPlan } from "./types/index.js";
import {
  createSubscription, cancelSubscription,
  getMySubscription, getAllSubscriptions,
  triggerTrialEndingNotification,
  resolveSubscriptionUser,
} from "./service.js";
import type { TrialEndingInput } from "./service.js";

export const Subscription = {
  user: (parent: SubscriptionModel, _args: unknown, ctx: Context) =>
    resolveSubscriptionUser(ctx.prisma, parent.userId),
};

export const Query = {
  mySubscription: (_parent: unknown, _args: unknown, ctx: Context) =>
    getMySubscription(ctx.prisma, ctx.userId),

  subscriptions: (_parent: unknown, _args: unknown, ctx: Context) =>
    getAllSubscriptions(ctx.prisma, ctx.userId),
};

export const Mutation = {
  createSubscription: (_parent: unknown, { plan }: { plan: SubscriptionPlan }, ctx: Context) =>
    createSubscription(ctx.prisma, ctx.userId, plan),

  cancelSubscription: (_parent: unknown, _args: unknown, ctx: Context) =>
    cancelSubscription(ctx.prisma, ctx.userId),

  triggerTrialEndingNotification: (
    _parent: unknown,
    { input }: { input: TrialEndingInput },
    ctx: Context,
  ) => triggerTrialEndingNotification(ctx.prisma, ctx.userId, input),
};
