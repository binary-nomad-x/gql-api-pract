import { faker } from "@faker-js/faker";
import type { SeedContext, SeedCounts } from "./types.js";
import type { User, Post, Product } from "@prisma/client";

const NOTIFICATION_TYPES = [
  "SYSTEM",
  "ORDER_UPDATE",
  "PAYMENT_RECEIVED",
  "SHIPMENT_UPDATE",
  "NEW_FOLLOWER",
  "NEW_COMMENT",
  "NEW_LIKE",
  "REVIEW_REPLY",
  "PROMOTION",
  "NEW_MESSAGE",
  "SUBSCRIPTION_EXPIRING",
  "DISCOUNT_AVAILABLE",
] as const;

const BATCH_SIZE = 2000;

type NotificationData = {
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
  users: User[],
  posts: Post[],
  products: Product[],
): Promise<void> {
  await Promise.all([
    seedNotifications(ctx, counts, users),
    seedFollows(ctx, counts, users),
    seedSavedPosts(ctx, counts, users, posts),
    seedPostViews(ctx, counts, posts, users),
    seedProductImages(ctx, counts, products),
  ]);
}

async function seedNotifications(
  ctx: SeedContext,
  counts: SeedCounts,
  users: User[],
): Promise<void> {
  const notifications = users.flatMap((user) => {
    const count = faker.number.int({ min: 3, max: 12 });
    return Array.from({ length: count }, () => ({
      userId: user.id,
      type: faker.helpers.arrayElement(NOTIFICATION_TYPES),
      title: faker.lorem.sentence({ min: 3, max: 6 }),
      ...(faker.datatype.boolean(0.5) && { message: faker.lorem.paragraph() }),
      ...(faker.datatype.boolean(0.3) && {
        link: `/${faker.helpers.arrayElement(["orders", "posts", "products"])}`,
      }),
      isRead: faker.datatype.boolean(0.5),
      ...(faker.datatype.boolean(0.3) && {
        readAt: faker.date.recent(),
      }),
    })) as NotificationData[];
  });

  await insertInBatches(ctx.prisma.notification, notifications);
  counts.notifications = notifications.length;
}

async function seedFollows(
  ctx: SeedContext,
  counts: SeedCounts,
  users: User[],
): Promise<void> {
  const follows = new Set<string>();
  const data: Array<{ followerId: string; followingId: string }> = [];

  while (
    data.length < 500 &&
    follows.size < users.length * (users.length - 1)
  ) {
    const follower = faker.helpers.arrayElement(users);
    const following = faker.helpers.arrayElement(users);

    if (follower.id === following.id) continue;

    const key = `${follower.id}_${following.id}`;
    if (!follows.has(key)) {
      follows.add(key);
      data.push({ followerId: follower.id, followingId: following.id });
    }
  }

  await ctx.prisma.follow.createMany({ data });
  counts.follows = data.length;
}

async function seedSavedPosts(
  ctx: SeedContext,
  counts: SeedCounts,
  users: User[],
  posts: Post[],
): Promise<void> {
  const saved = new Set<string>();
  const data: Array<{ userId: string; postId: string }> = [];

  while (data.length < 500 && saved.size < users.length * posts.length) {
    const user = faker.helpers.arrayElement(users);
    const post = faker.helpers.arrayElement(posts);
    const key = `${user.id}_${post.id}`;

    if (!saved.has(key)) {
      saved.add(key);
      data.push({ userId: user.id, postId: post.id });
    }
  }

  await ctx.prisma.savedPost.createMany({ data });
  counts.savedPosts = data.length;
}

async function seedPostViews(
  ctx: SeedContext,
  counts: SeedCounts,
  posts: Post[],
  users: User[],
): Promise<void> {
  const views = posts.flatMap((post) => {
    const count = faker.number.int({ min: 10, max: 80 });
    return Array.from({ length: count }, () => ({
      postId: post.id,
      ...(faker.datatype.boolean(0.7) && {
        userId: faker.helpers.arrayElement(users).id,
      }),
      ip: faker.internet.ip(),
    }));
  });

  await insertInBatches(ctx.prisma.postView, views);
  counts.postViews = views.length;
}

async function seedProductImages(
  ctx: SeedContext,
  counts: SeedCounts,
  products: Product[],
): Promise<void> {
  const images = products.flatMap((product) => {
    const count = faker.number.int({ min: 1, max: 4 });
    return Array.from({ length: count }, (_, i) => ({
      productId: product.id,
      url: `https://picsum.photos/seed/${product.sku}-${i}/400/400`,
      alt: `${product.name} - Image ${i + 1}`,
      sortOrder: i,
    }));
  });

  await insertInBatches(ctx.prisma.productImage, images);
  counts.productImages = images.length;
}

async function insertInBatches<T>(
  model: { createMany: (args: { data: T[] }) => Promise<unknown> },
  data: T[],
): Promise<void> {
  for (let i = 0; i < data.length; i += BATCH_SIZE) {
    await model.createMany({ data: data.slice(i, i + BATCH_SIZE) });
  }
}
