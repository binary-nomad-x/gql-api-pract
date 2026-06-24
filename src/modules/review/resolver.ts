import type { Context } from "@gql-prisma-api/types/context.js";
import type { Review as ReviewModel } from "@prisma/client";
import type { CreateReviewInput } from "./inputs.js";
import {
  resolveReviewProduct,
  resolveReviewUser,
  createReview,
  deleteReview,
  getReviews,
  getReview,
} from "./service.js";

export const Review = {
  product: (parent: ReviewModel, _args: unknown, ctx: Context) =>
    resolveReviewProduct(ctx.prisma, parent.productId),
  user: (parent: ReviewModel, _args: unknown, ctx: Context) =>
    resolveReviewUser(ctx.prisma, parent.userId),
};

export const Query = {
  reviews: (_parent: unknown, args: { productId: string; limit?: number; offset?: number }, ctx: Context) =>
    getReviews(ctx.prisma, args),
  review: (_parent: unknown, { id }: { id: string }, ctx: Context) =>
    getReview(ctx.prisma, id),
};

export const Mutation = {
  createReview: (_parent: unknown, { input }: { input: CreateReviewInput }, ctx: Context) =>
    createReview(ctx.prisma, ctx.userId, input),
  deleteReview: (_parent: unknown, { id }: { id: string }, ctx: Context) =>
    deleteReview(ctx.prisma, ctx.userId, id),
};
