import type { Context } from "@gql-prisma-api/types/context.js";
import type { Parent, IdArg, PaginationArgs } from "@gql-prisma-api/types/graphql.js";
import type { CreateReviewInput } from "@gql-prisma-api/types/inputs.js";
import {
  createReview, deleteReview,
  getReviews, getReview,
} from "./service.js";

export const ReviewResolver = {
  product: (parent: Parent, _args: unknown, ctx: Context) =>
    ctx.prisma.product.findUnique({ where: { id: parent.productId as string } }),
  user: (parent: Parent, _args: unknown, ctx: Context) =>
    ctx.prisma.user.findUnique({ where: { id: parent.userId as string } }),
};

export const ReviewQueries = {
  reviews: (_parent: unknown, args: { productId: string } & PaginationArgs, ctx: Context) =>
    getReviews(ctx.prisma, args),

  review: (_parent: unknown, { id }: IdArg, ctx: Context) =>
    getReview(ctx.prisma, id),
};

export const ReviewMutations = {
  createReview: async (_parent: unknown, { input }: { input: CreateReviewInput }, ctx: Context) =>
    createReview(ctx.prisma, ctx.userId, input),

  deleteReview: async (_parent: unknown, { id }: IdArg, ctx: Context) =>
    deleteReview(ctx.prisma, ctx.userId, id),
};
