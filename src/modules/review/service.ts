import type { PrismaClient } from "@prisma/client";
import type { CreateReviewInput } from "@gql-prisma-api/modules/review/inputs.js";
import { requireAuth, requireOwner } from "@gql-prisma-api/utils/errors.js";
import { triggerNovuWorkflow } from "@gql-prisma-api/utils/novu.js";

export async function createReview(
  prisma: PrismaClient,
  userId: string | undefined,
  input: CreateReviewInput,
) {
  requireAuth(userId);
  if (input.rating < 1 || input.rating > 5)
    throw new Error("Rating must be between 1 and 5");

  const product = await prisma.product.findUnique({ where: { id: input.productId } });
  if (!product) throw new Error("Product not found");

  const existing = await prisma.review.findUnique({
    where: { productId_userId: { productId: input.productId, userId: userId! } },
  });
  if (existing) throw new Error("Already reviewed this product");

  const review = await prisma.review.create({
    data: {
      rating: input.rating,
      title: input.title ?? null,
      content: input.content ?? null,
      productId: input.productId,
      userId: userId!,
    },
  });

  if (product.sellerId !== userId) {
    await triggerNovuWorkflow(product.sellerId, "review-received", { productId: input.productId, reviewId: review.id, rating: input.rating });
  }

  return review;
}

export async function deleteReview(
  prisma: PrismaClient,
  userId: string | undefined,
  id: string,
) {
  requireAuth(userId);
  const review = await prisma.review.findUnique({ where: { id } });
  if (!review) throw new Error("Review not found");
  requireOwner(review.userId, userId);
  await prisma.review.delete({ where: { id } });
  return true;
}

export function getReviews(
  prisma: PrismaClient,
  args: { productId: string; limit?: number; offset?: number },
) {
  return prisma.review.findMany({
    where: { productId: args.productId },
    take: args.limit ?? 20,
    skip: args.offset ?? 0,
    orderBy: { createdAt: "desc" },
  });
}

export function getReview(prisma: PrismaClient, id: string) {
  return prisma.review.findUnique({ where: { id } });
}
