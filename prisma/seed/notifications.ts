import { faker } from "@faker-js/faker";
import type { SeedContext, SeedCounts } from "./types.js";
import { randomUUID } from "node:crypto";
import { generateIds, bulkInsert } from "./utils.js";

const NOTIFICATION_TYPES = [
  "SYSTEM", "ORDER_UPDATE", "PAYMENT_RECEIVED", "SHIPMENT_UPDATE",
  "NEW_FOLLOWER", "NEW_COMMENT", "NEW_LIKE", "REVIEW_REPLY",
  "PROMOTION", "NEW_MESSAGE", "SUBSCRIPTION_EXPIRING", "DISCOUNT_AVAILABLE",
] as const;

const BATCH_SZ = 2000;

export async function seedRemaining(
  ctx: SeedContext,
  counts: SeedCounts,
  userIds: string[],
  postIds: string[],
  productIds: string[],
): Promise<void> {
  await Promise.all([
    seedNotifications(ctx, counts, userIds),
    seedFollows(ctx, counts, userIds),
    seedSavedPosts(ctx, counts, userIds, postIds),
    seedPostViews(ctx, counts, postIds, userIds),
    seedProductImages(ctx, counts, productIds),
  ]);
}

async function seedNotifications(
  ctx: SeedContext,
  counts: SeedCounts,
  userIds: string[],
): Promise<void> {
  const rows: Array<{
    id: string; userId: string; type: string; title: string;
    message?: string; link?: string; isRead: boolean; readAt?: Date;
  }> = [];
  for (const uid of userIds) {
    const n = faker.number.int({ min: 3, max: 12 });
    const ids = generateIds(n);
    for (let j = 0; j < n; j++) {
      rows.push({
        id: ids[j], userId: uid,
        type: faker.helpers.arrayElement(NOTIFICATION_TYPES),
        title: faker.lorem.sentence({ min: 3, max: 6 }),
        ...(faker.datatype.boolean(0.5) && { message: faker.lorem.paragraph() }),
        ...(faker.datatype.boolean(0.3) && { link: `/${faker.helpers.arrayElement(["orders", "posts", "products"])}` }),
        isRead: faker.datatype.boolean(0.5),
        ...(faker.datatype.boolean(0.3) && { readAt: faker.date.recent() }),
      });
    }
  }
  await bulkInsert(ctx.pool, "notifications", rows, BATCH_SZ);
  counts.notifications = rows.length;
}

async function seedFollows(
  ctx: SeedContext,
  counts: SeedCounts,
  userIds: string[],
): Promise<void> {
  const follows = new Set<string>();
  const rows: Array<{ id: string; followerId: string; followingId: string }> = [];
  while (rows.length < 500 && follows.size < userIds.length * (userIds.length - 1)) {
    const a = faker.helpers.arrayElement(userIds);
    const b = faker.helpers.arrayElement(userIds);
    if (a === b) continue;
    const key = `${a}_${b}`;
    if (!follows.has(key)) {
      follows.add(key);
      rows.push({ id: randomUUID(), followerId: a, followingId: b });
    }
  }
  await bulkInsert(ctx.pool, "follows", rows);
  counts.follows = rows.length;
}

async function seedSavedPosts(
  ctx: SeedContext,
  counts: SeedCounts,
  userIds: string[],
  postIds: string[],
): Promise<void> {
  const used = new Set<string>();
  const rows: Array<{ id: string; userId: string; postId: string }> = [];
  while (rows.length < 500 && used.size < userIds.length * postIds.length) {
    const u = faker.helpers.arrayElement(userIds);
    const p = faker.helpers.arrayElement(postIds);
    const key = `${u}_${p}`;
    if (!used.has(key)) {
      used.add(key);
      rows.push({ id: randomUUID(), userId: u, postId: p });
    }
  }
  await bulkInsert(ctx.pool, "saved_posts", rows);
  counts.savedPosts = rows.length;
}

async function seedPostViews(
  ctx: SeedContext,
  counts: SeedCounts,
  postIds: string[],
  userIds: string[],
): Promise<void> {
  const rows: Array<{ id: string; postId: string; userId?: string; ip: string }> = [];
  for (const pid of postIds) {
    const n = faker.number.int({ min: 10, max: 80 });
    const ids = generateIds(n);
    for (let j = 0; j < n; j++) {
      rows.push({
        id: ids[j], postId: pid,
        ...(faker.datatype.boolean(0.7) && { userId: faker.helpers.arrayElement(userIds) }),
        ip: faker.internet.ip(),
      });
    }
  }
  await bulkInsert(ctx.pool, "post_views", rows, BATCH_SZ);
  counts.postViews = rows.length;
}

async function seedProductImages(
  ctx: SeedContext,
  counts: SeedCounts,
  productIds: string[],
): Promise<void> {
  const rows: Array<{ id: string; productId: string; url: string; alt: string; sortOrder: number }> = [];
  for (const pid of productIds) {
    const n = faker.number.int({ min: 1, max: 4 });
    const ids = generateIds(n);
    for (let j = 0; j < n; j++) {
      rows.push({
        id: ids[j], productId: pid,
        url: `https://picsum.photos/seed/${pid}-${j}/400/400`,
        alt: `Product Image ${j + 1}`,
        sortOrder: j,
      });
    }
  }
  await bulkInsert(ctx.pool, "product_images", rows, BATCH_SZ);
  counts.productImages = rows.length;
}
