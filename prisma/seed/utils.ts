import type { PrismaClient } from "@prisma/client";

/**
 * Delete every row from every table in dependency order.
 * Uses a single transaction so the reset is atomic.
 */
export async function resetDatabase(prisma: PrismaClient): Promise<void> {
  console.log("Resetting database...");
  await prisma.$transaction([
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

/** Print elapsed time in seconds */
export function printElapsed(start: number): void {
  const elapsed = ((Date.now() - start) / 1000).toFixed(1);
  console.log(`Seeding complete in ${elapsed}s`);
}
