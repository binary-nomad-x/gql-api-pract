import type { PrismaClient } from "@prisma/client";
import { randomUUID } from "node:crypto";

export function generateIds(n: number): string[] {
  const ids = new Array<string>(n);
  for (let i = 0; i < n; i++) ids[i] = randomUUID();
  return ids;
}

export async function resetDatabase(prisma: PrismaClient): Promise<void> {
  console.log("Resetting database...");
  await prisma.$transaction([
    prisma.ticketReply.deleteMany(),
    prisma.supportTicket.deleteMany(),
    prisma.returnRequest.deleteMany(),
    prisma.invoice.deleteMany(),
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

export async function batchInsertImplicitJoin(
  prisma: PrismaClient,
  table: string,
  colA: string,
  colB: string,
  pairs: Array<{ a: string; b: string }>,
  batchSize = 2000,
): Promise<void> {
  for (let i = 0; i < pairs.length; i += batchSize) {
    const chunk = pairs.slice(i, i + batchSize);
    const values = chunk.map((p) => `('${p.a}','${p.b}')`).join(",");
    await prisma.$executeRawUnsafe(
      `INSERT INTO "${table}" ("${colA}","${colB}") VALUES ${values} ON CONFLICT DO NOTHING`,
    );
  }
}

export function printElapsed(start: number): void {
  const elapsed = ((Date.now() - start) / 1000).toFixed(1);
  console.log(`Seeding complete in ${elapsed}s`);
}
