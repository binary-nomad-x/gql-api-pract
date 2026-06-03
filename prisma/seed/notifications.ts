import { faker } from "@faker-js/faker";
import type { SeedContext, SeedCounts } from "./types.js";
import type { User, Post, Product, NotificationType } from "@prisma/client";

const NOTIF_TYPES: NotificationType[] = [
  "SYSTEM", "ORDER_UPDATE", "PAYMENT_RECEIVED", "SHIPMENT_UPDATE",
  "NEW_FOLLOWER", "NEW_COMMENT", "NEW_LIKE", "REVIEW_REPLY", "PROMOTION",
];

export async function seedRemaining(
  ctx: SeedContext,
  counts: SeedCounts,
  users: User[],
  posts: Post[],
  products: Product[],
): Promise<void> {
  // Notifications — bulk insert
  const notifData: Array<{
    userId: string; type: NotificationType; title: string;
    message?: string; link?: string; isRead: boolean; readAt?: Date;
  }> = [];
  for (const user of users) {
    const numNotifs = faker.number.int({ min: 2, max: 8 });
    for (let i = 0; i < numNotifs; i++) {
      notifData.push({
        userId: user.id,
        type: faker.helpers.arrayElement(NOTIF_TYPES),
        title: faker.lorem.sentence({ min: 3, max: 6 }),
        message: faker.helpers.maybe(() => faker.lorem.paragraph()) ?? undefined,
        link: faker.helpers.maybe(() => `/${faker.helpers.arrayElement(["orders", "posts", "products"])}`) ?? undefined,
        isRead: faker.datatype.boolean(0.5),
        readAt: faker.datatype.boolean(0.3) ? faker.date.recent() : undefined,
      });
    }
  }
  await ctx.prisma.notification.createMany({ data: notifData });
  counts.notifications = notifData.length;

  // Follows — bulk insert
  const followPairSet = new Set<string>();
  const followData: Array<{ followerId: string; followingId: string }> = [];
  for (let i = 0; i < 150; i++) {
    const follower = faker.helpers.arrayElement(users);
    const following = faker.helpers.arrayElement(users);
    if (follower.id === following.id) continue;
    const key = `${follower.id}_${following.id}`;
    if (followPairSet.has(key)) continue;
    followPairSet.add(key);
    followData.push({ followerId: follower.id, followingId: following.id });
  }
  await ctx.prisma.follow.createMany({ data: followData });
  counts.follows = followData.length;

  // Saved posts — bulk insert
  const savedPostPairSet = new Set<string>();
  const savedPostData: Array<{ userId: string; postId: string }> = [];
  for (let i = 0; i < 200; i++) {
    const user = faker.helpers.arrayElement(users);
    const post = faker.helpers.arrayElement(posts);
    const key = `${user.id}_${post.id}`;
    if (savedPostPairSet.has(key)) continue;
    savedPostPairSet.add(key);
    savedPostData.push({ userId: user.id, postId: post.id });
  }
  await ctx.prisma.savedPost.createMany({ data: savedPostData });
  counts.savedPosts = savedPostData.length;

  // Post views — bulk insert
  const postViewData: Array<{ postId: string; userId?: string; ip: string }> = [];
  for (const post of posts) {
    const numViews = faker.number.int({ min: 5, max: 50 });
    for (let i = 0; i < numViews; i++) {
      postViewData.push({
        postId: post.id,
        userId: faker.datatype.boolean(0.7) ? faker.helpers.arrayElement(users).id : undefined,
        ip: faker.internet.ip(),
      });
    }
  }
  await ctx.prisma.postView.createMany({ data: postViewData });
  counts.postViews = postViewData.length;

  // Product images — bulk insert
  const productImageData: Array<{
    productId: string; url: string; alt?: string; sortOrder: number;
  }> = [];
  for (const product of products) {
    const numImages = faker.number.int({ min: 1, max: 4 });
    for (let i = 0; i < numImages; i++) {
      productImageData.push({
        productId: product.id,
        url: `https://picsum.photos/seed/${product.sku}-${i}/400/400`,
        alt: `${product.name} - Image ${i + 1}`,
        sortOrder: i,
      });
    }
  }
  // Insert product images in batches
  for (let i = 0; i < productImageData.length; i += 500) {
    await ctx.prisma.productImage.createMany({ data: productImageData.slice(i, i + 500) });
  }
  counts.productImages = productImageData.length;
}
