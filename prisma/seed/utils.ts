import type { PrismaClient } from "@prisma/client";
import type { Pool } from "pg";
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

/** Multi-row INSERT via direct pg Pool — bypasses Prisma ORM entirely */
export async function bulkInsert<T extends Record<string, unknown>>(
  pool: Pool,
  table: string,
  rows: T[],
  batchSize = 500,
): Promise<void> {
  if (rows.length === 0) return;
  const columns = Object.keys(rows[0]);
  const colList = columns.map((c) => `"${c}"`).join(", ");

  for (let i = 0; i < rows.length; i += batchSize) {
    const batch = rows.slice(i, i + batchSize);
    const values: unknown[] = [];
    const placeholders: string[] = [];

    for (let j = 0; j < batch.length; j++) {
      const row = batch[j];
      const offset = j * columns.length;
      placeholders.push(
        `(${columns.map((_, k) => `$${offset + k + 1}`).join(",")})`,
      );
      for (const col of columns) {
        values.push(row[col] ?? null);
      }
    }

    await pool.query(
      `INSERT INTO "${table}" (${colList}) VALUES ${placeholders.join(",")}`,
      values,
    );
  }
}

/** Batch insert into Prisma implicit M2M join tables (A/B columns) */
export async function bulkInsertJoin(
  pool: Pool,
  table: string,
  pairs: Array<{ a: string; b: string }>,
  batchSize = 500,
): Promise<void> {
  if (pairs.length === 0) return;
  for (let i = 0; i < pairs.length; i += batchSize) {
    const batch = pairs.slice(i, i + batchSize);
    const values: string[] = [];
    const params: string[] = [];
    for (let j = 0; j < batch.length; j++) {
      values.push(`($${j * 2 + 1},$${j * 2 + 2})`);
      params.push(batch[j].a, batch[j].b);
    }
    await pool.query(
      `INSERT INTO "${table}" ("A","B") VALUES ${values.join(",")} ON CONFLICT DO NOTHING`,
      params,
    );
  }
}

export function printElapsed(start: number): void {
  const elapsed = ((Date.now() - start) / 1000).toFixed(1);
  console.log(`Seeding complete in ${elapsed}s`);
}
