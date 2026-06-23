import { faker } from "@faker-js/faker";
import type { SeedContext, SeedCounts } from "./types.js";
import { generateIds } from "./utils.js";

const NOTIFICATION_TYPES = [
  "SYSTEM", "ORDER_UPDATE", "PAYMENT_RECEIVED", "SHIPMENT_UPDATE",
  "NEW_FOLLOWER", "NEW_COMMENT", "NEW_LIKE", "REVIEW_REPLY",
  "PROMOTION", "NEW_MESSAGE", "SUBSCRIPTION_EXPIRING", "DISCOUNT_AVAILABLE",
] as const;

const BATCH_SIZE = 2000;

type NotificationData = {
  id: string;
  userId: string;
  type: (typeof NOTIFICATION_TYPES)[number];
  title: string;
  message?: string;
  link?: string;
  isRead: boolean;
  readAt?: Date;
};

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
  const notifications: NotificationData[] = [];
  for (const uid of userIds) {
    const count = faker.number.int({ min: 3, max: 12 });
    const ids = generateIds(count);
    for (let j = 0; j < count; j++) {
      notifications.push({
        id: ids[j],
        userId: uid,
        type: faker.helpers.arrayElement(NOTIFICATION_TYPES),
        title: faker.lorem.sentence({ min: 3, max: 6 }),
        ...(faker.datatype.boolean(0.5) && { message: faker.lorem.paragraph() }),
        ...(faker.datatype.boolean(0.3) && { link: `/${faker.helpers.arrayElement(["orders", "posts", "products"])}` }),
        isRead: faker.datatype.boolean(0.5),
        ...(faker.datatype.boolean(0.3) && { readAt: faker.date.recent() }),
      });
    }
  }

  for (let i = 0; i < notifications.length; i += BATCH_SIZE) {
    await ctx.prisma.notification.createMany({ data: notifications.slice(i, i + BATCH_SIZE) });
  }
  counts.notifications = notifications.length;
}

async function seedFollows(
  ctx: SeedContext,
  counts: SeedCounts,
  userIds: string[],
): Promise<void> {
  const follows = new Set<string>();
  const data: Array<{ followerId: string; followingId: string }> = [];

  while (data.length < 500 && follows.size < userIds.length * (userIds.length - 1)) {
    const follower = faker.helpers.arrayElement(userIds);
    const following = faker.helpers.arrayElement(userIds);
    if (follower === following) continue;
    const key = `${follower}_${following}`;
    if (!follows.has(key)) {
      follows.add(key);
      data.push({ followerId: follower, followingId: following });
    }
  }

  await ctx.prisma.follow.createMany({ data });
  counts.follows = data.length;
}

async function seedSavedPosts(
  ctx: SeedContext,
  counts: SeedCounts,
  userIds: string[],
  postIds: string[],
): Promise<void> {
  const saved = new Set<string>();
  const data: Array<{ userId: string; postId: string }> = [];

  while (data.length < 500 && saved.size < userIds.length * postIds.length) {
    const user = faker.helpers.arrayElement(userIds);
    const post = faker.helpers.arrayElement(postIds);
    const key = `${user}_${post}`;
    if (!saved.has(key)) {
      saved.add(key);
      data.push({ userId: user, postId: post });
    }
  }

  await ctx.prisma.savedPost.createMany({ data });
  counts.savedPosts = data.length;
}

async function seedPostViews(
  ctx: SeedContext,
  counts: SeedCounts,
  postIds: string[],
  userIds: string[],
): Promise<void> {
  const views: Array<{ postId: string; userId?: string; ip: string }> = [];
  for (const pid of postIds) {
    const count = faker.number.int({ min: 10, max: 80 });
    for (let j = 0; j < count; j++) {
      views.push({
        postId: pid,
        ...(faker.datatype.boolean(0.7) && { userId: faker.helpers.arrayElement(userIds) }),
        ip: faker.internet.ip(),
      });
    }
  }

  for (let i = 0; i < views.length; i += BATCH_SIZE) {
    await ctx.prisma.postView.createMany({ data: views.slice(i, i + BATCH_SIZE) });
  }
  counts.postViews = views.length;
}

async function seedProductImages(
  ctx: SeedContext,
  counts: SeedCounts,
  productIds: string[],
): Promise<void> {
  const images: Array<{ productId: string; url: string; alt: string; sortOrder: number }> = [];
  for (const pid of productIds) {
    const count = faker.number.int({ min: 1, max: 4 });
    for (let i = 0; i < count; i++) {
      images.push({
        productId: pid,
        url: `https://picsum.photos/seed/${pid}-${i}/400/400`,
        alt: `Product Image ${i + 1}`,
        sortOrder: i,
      });
    }
  }

  for (let i = 0; i < images.length; i += BATCH_SIZE) {
    await ctx.prisma.productImage.createMany({ data: images.slice(i, i + BATCH_SIZE) });
  }
  counts.productImages = images.length;
}
