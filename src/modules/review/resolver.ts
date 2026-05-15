import type { Context } from "../../types/context.js";
import { requireAuth, requireOwner } from "../../utils/errors.js";

export const ReviewResolver = {
  product: (parent: any, _args: unknown, ctx: Context) =>
    ctx.prisma.product.findUnique({ where: { id: parent.productId } }),
  user: (parent: any, _args: unknown, ctx: Context) =>
    ctx.prisma.user.findUnique({ where: { id: parent.userId } }),
};

export const ReviewQueries = {
  reviews: (_parent: unknown, { productId, limit = 20, offset = 0 }: any, ctx: Context) =>
    ctx.prisma.review.findMany({ where: { productId }, take: limit, skip: offset, orderBy: { createdAt: "desc" } }),
  review: (_parent: unknown, { id }: { id: string }, ctx: Context) =>
    ctx.prisma.review.findUnique({ where: { id } }),
};

export const ReviewMutations = {
  createReview: async (_parent: unknown, { input }: any, ctx: Context) => {
    requireAuth(ctx.userId);
    const { rating, title, content, productId } = input;
    if (rating < 1 || rating > 5) throw new Error("Rating must be between 1 and 5");

    const product = await ctx.prisma.product.findUnique({ where: { id: productId } });
    if (!product) throw new Error("Product not found");

    const existing = await ctx.prisma.review.findUnique({ where: { productId_userId: { productId, userId: ctx.userId! } } });
    if (existing) throw new Error("Already reviewed this product");

    return ctx.prisma.review.create({ data: { rating, title, content, productId, userId: ctx.userId! } });
  },

  deleteReview: async (_parent: unknown, { id }: any, ctx: Context) => {
    requireAuth(ctx.userId);
    const review = await ctx.prisma.review.findUnique({ where: { id } });
    if (!review) throw new Error("Review not found");
    requireOwner(review.userId, ctx.userId);
    await ctx.prisma.review.delete({ where: { id } });
    return true;
  },
};
