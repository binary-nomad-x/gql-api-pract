import { faker } from "@faker-js/faker";
import type { SeedContext, SeedCounts } from "./types.js";
import type { User, Post, Product } from "@prisma/client";

const NT = [
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
];

export async function seedRemaining(
  ctx: SeedContext,
  counts: SeedCounts,
  users: User[],
  posts: Post[],
  products: Product[],
): Promise<void> {

  // Notifications
  const notifData: Array<{
    userId: string;
    type: string;
    title: string;
    message?: string;
    link?: string;
    isRead: boolean;
    readAt?: Date;
  }> = [];

  for (const u of users) {
    const n = faker.number.int({ min: 3, max: 12 });
    for (let i = 0; i < n; i++) {
      notifData.push({
        userId: u.id,
        type: faker.helpers.arrayElement(NT),
        title: faker.lorem.sentence({ min: 3, max: 6 }),
        message:
          faker.helpers.maybe(() => faker.lorem.paragraph()) ?? undefined,
        link:
          faker.helpers.maybe(
            () =>
              `/${faker.helpers.arrayElement(["orders", "posts", "products"])}`,
          ) ?? undefined,
        isRead: faker.datatype.boolean(0.5),
        readAt: faker.datatype.boolean(0.3) ? faker.date.recent() : undefined,
      });
    }
  }

  await ctx.prisma.notification.createMany({ data: notifData });
  counts.notifications = notifData.length;

  // Follows
  const followSet = new Set<string>();
  const followData: Array<{ followerId: string; followingId: string }> = [];
  for (let i = 0; i < 500; i++) {
    const f1 = faker.helpers.arrayElement(users);
    const f2 = faker.helpers.arrayElement(users);
    if (f1.id === f2.id) continue;
    const key = `${f1.id}_${f2.id}`;
    if (followSet.has(key)) continue;
    followSet.add(key);
    followData.push({ followerId: f1.id, followingId: f2.id });
  }
  await ctx.prisma.follow.createMany({ data: followData });
  counts.follows = followData.length;

  // SavedPosts
  const spSet = new Set<string>();
  const spData: Array<{ userId: string; postId: string }> = [];
  for (let i = 0; i < 500; i++) {
    const u = faker.helpers.arrayElement(users);
    const p = faker.helpers.arrayElement(posts);
    const key = `${u.id}_${p.id}`;
    if (spSet.has(key)) continue;
    spSet.add(key);
    spData.push({ userId: u.id, postId: p.id });
  }

  await ctx.prisma.savedPost.createMany({ data: spData });
  counts.savedPosts = spData.length;

  // PostViews — generate and insert in batches of 2000
  const pvData: Array<{ postId: string; userId?: string; ip: string }> = [];
  for (const post of posts) {
    const n = faker.number.int({ min: 10, max: 80 });
    for (let i = 0; i < n; i++) {
      pvData.push({
        postId: post.id,
        userId: faker.datatype.boolean(0.7)
          ? faker.helpers.arrayElement(users).id
          : undefined,
        ip: faker.internet.ip(),
      });
    }
  }

  for (let i = 0; i < pvData.length; i += 2000) {
    await ctx.prisma.postView.createMany({ data: pvData.slice(i, i + 2000) });
  }

  counts.postViews = pvData.length;

  // ProductImages
  const piData: Array<{
    productId: string;
    url: string;
    alt?: string;
    sortOrder: number;
  }> = [];

  for (const product of products) {
    const n = faker.number.int({ min: 1, max: 4 });
    for (let i = 0; i < n; i++) {
      piData.push({
        productId: product.id,
        url: `https://picsum.photos/seed/${product.sku}-${i}/400/400`,
        alt: `${product.name} - Image ${i + 1}`,
        sortOrder: i,
      });
    }
  }

  for (let i = 0; i < piData.length; i += 1000) {
    await ctx.prisma.productImage.createMany({
      data: piData.slice(i, i + 1000),
    });
  }

  counts.productImages = piData.length;
}
