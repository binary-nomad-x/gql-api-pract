import type { PrismaClient } from "@prisma/client";

export async function resetDatabase(prisma: PrismaClient): Promise<void> {
  console.log("Resetting database...");
  await prisma.$transaction([
    prisma.message.deleteMany(),
    prisma.conversationParticipant.deleteMany(),
    prisma.conversation.deleteMany(),
    prisma.discount.deleteMany(),
    prisma.subscription.deleteMany(),
    prisma.postView.deleteMany(),
    prisma.notification.deleteMany(),
    prisma.savedPost.deleteMany(),
    prisma.follow.deleteMany(),
    prisma.cartItem.deleteMany(),
    prisma.cart.deleteMany(),
    prisma.wishlistItem.deleteMany(),
    prisma.wishlist.deleteMany(),
    prisma.shipment.deleteMany(),
    prisma.refund.deleteMany(),
    prisma.payment.deleteMany(),
    prisma.orderItem.deleteMany(),
    prisma.order.deleteMany(),
    prisma.productImage.deleteMany(),
    prisma.review.deleteMany(),
    prisma.product.deleteMany(),
    prisma.coupon.deleteMany(),
    prisma.address.deleteMany(),
    prisma.like.deleteMany(),
    prisma.comment.deleteMany(),
    prisma.post.deleteMany(),
    prisma.tag.deleteMany(),
    prisma.profile.deleteMany(),
    prisma.category.deleteMany(),
    prisma.user.deleteMany(),
  ]);
}

/** Raw insert into Prisma implicit M2M join table for Post <-> Tag */
export async function attachPostTags(
  prisma: PrismaClient,
  data: Array<{ postId: string; tagId: string }>,
): Promise<void> {
  if (data.length === 0) return;
  const values = data.map((r) => `('${r.postId}','${r.tagId}')`).join(",");
  await prisma.$executeRawUnsafe(
    `INSERT INTO "_PostToTag" ("A","B") VALUES ${values} ON CONFLICT DO NOTHING`,
  );
}

/** Raw insert into Prisma implicit M2M join table for Post <-> Category */
export async function attachPostCategories(
  prisma: PrismaClient,
  data: Array<{ postId: string; categoryId: string }>,
): Promise<void> {
  if (data.length === 0) return;
  const values = data.map((r) => `('${r.postId}','${r.categoryId}')`).join(",");
  await prisma.$executeRawUnsafe(
    `INSERT INTO "_PostToCategory" ("A","B") VALUES ${values} ON CONFLICT DO NOTHING`,
  );
}

export function printElapsed(start: number): void {
  const elapsed = ((Date.now() - start) / 1000).toFixed(1);
  console.log(`Seeding complete in ${elapsed}s`);
}
