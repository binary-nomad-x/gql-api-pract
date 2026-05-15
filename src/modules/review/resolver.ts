import type { Context } from "../../types/context.js";
import type { Parent, IdArg, PaginationArgs } from "../../types/graphql.js";
import type { CreateReviewInput } from "../../types/inputs.js";
import { requireAuth, requireOwner } from "../../utils/errors.js";

export const ReviewResolver = {
  product: (parent: Parent, _args: unknown, ctx: Context) =>
    ctx.prisma.product.findUnique({ where: { id: parent.productId as string } }),
  user: (parent: Parent, _args: unknown, ctx: Context) =>
    ctx.prisma.user.findUnique({ where: { id: parent.userId as string } }),
};

export const ReviewQueries = {
  reviews: (_parent: unknown, args: { productId: string } & PaginationArgs, ctx: Context) =>
    ctx.prisma.review.findMany({
      where: { productId: args.productId },
      take: args.limit ?? 20,
      skip: args.offset ?? 0,
      orderBy: { createdAt: "desc" },
    }),

  review: (_parent: unknown, { id }: IdArg, ctx: Context) =>
    ctx.prisma.review.findUnique({ where: { id } }),
};

export const ReviewMutations = {
  createReview: async (_parent: unknown, { input }: { input: CreateReviewInput }, ctx: Context) => {
    requireAuth(ctx.userId);
    if (input.rating < 1 || input.rating > 5) throw new Error("Rating must be between 1 and 5");

    const product = await ctx.prisma.product.findUnique({ where: { id: input.productId } });
    if (!product) throw new Error("Product not found");

    const existing = await ctx.prisma.review.findUnique({
      where: { productId_userId: { productId: input.productId, userId: ctx.userId! } },
    });
    if (existing) throw new Error("Already reviewed this product");

    return ctx.prisma.review.create({
      data: {
        rating: input.rating,
        title: input.title ?? null,
        content: input.content ?? null,
        productId: input.productId,
        userId: ctx.userId!,
      },
    });
  },

  deleteReview: async (_parent: unknown, { id }: IdArg, ctx: Context) => {
    requireAuth(ctx.userId);
    const review = await ctx.prisma.review.findUnique({ where: { id } });
    if (!review) throw new Error("Review not found");
    requireOwner(review.userId, ctx.userId);
    await ctx.prisma.review.delete({ where: { id } });
    return true;
  },
};
