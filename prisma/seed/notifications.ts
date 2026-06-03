import { faker } from "@faker-js/faker";
import type { SeedContext, SeedCounts } from "./types.js";
import type { User, Post, Product } from "@prisma/client";

const NOTIF_TYPES: Array<"SYSTEM" | "ORDER_UPDATE" | "PAYMENT_RECEIVED" | "SHIPMENT_UPDATE" | "NEW_FOLLOWER" | "NEW_COMMENT" | "PROMOTION"> = [
  "SYSTEM", "ORDER_UPDATE", "PAYMENT_RECEIVED", "SHIPMENT_UPDATE",
  "NEW_FOLLOWER", "NEW_COMMENT", "PROMOTION",
];

/**
 * Seed notifications, follows, saved posts, post views, and product images.
 */
export async function seedRemaining(
  ctx: SeedContext,
  counts: SeedCounts,
  users: User[],
  posts: Post[],
  products: Product[],
): Promise<void> {
  // Notifications: 2-8 per user
  let notificationCount = 0;
  for (const user of users) {
    const numNotifs = faker.number.int({ min: 2, max: 8 });
    for (let i = 0; i < numNotifs; i++) {
      await ctx.prisma.notification.create({
        data: {
          userId: user.id,
          type: faker.helpers.arrayElement(NOTIF_TYPES),
          title: faker.lorem.sentence({ min: 3, max: 6 }),
          message: faker.helpers.maybe(() => faker.lorem.paragraph()) ?? undefined,
          link: faker.helpers.maybe(() =>
            `/${faker.helpers.arrayElement(["orders", "posts", "products"])}`
          ) ?? undefined,
          isRead: faker.datatype.boolean(0.5),
          readAt: faker.datatype.boolean(0.3) ? faker.date.recent() : undefined,
        },
      });
      notificationCount++;
    }
  }
  counts.notifications = notificationCount;

  // Follows: 150 unique pairs, skip self-follows
  let followCount = 0;
  const followPairs = new Set<string>();
  for (let i = 0; i < 150; i++) {
    const follower = faker.helpers.arrayElement(users);
    const following = faker.helpers.arrayElement(users);
    if (follower.id === following.id) continue;
    const key = `${follower.id}_${following.id}`;
    if (followPairs.has(key)) continue;
    followPairs.add(key);
    await ctx.prisma.follow.create({
      data: { followerId: follower.id, followingId: following.id },
    });
    followCount++;
  }
  counts.follows = followCount;

  // Saved posts: 200 unique user+post pairs
  let savedPostCount = 0;
  const savedPostPairs = new Set<string>();
  for (let i = 0; i < 200; i++) {
    const user = faker.helpers.arrayElement(users);
    const post = faker.helpers.arrayElement(posts);
    const key = `${user.id}_${post.id}`;
    if (savedPostPairs.has(key)) continue;
    savedPostPairs.add(key);
    await ctx.prisma.savedPost.create({ data: { userId: user.id, postId: post.id } });
    savedPostCount++;
  }
  counts.savedPosts = savedPostCount;

  // Post views: 5-50 per post
  let postViewCount = 0;
  for (const post of posts) {
    const numViews = faker.number.int({ min: 5, max: 50 });
    for (let i = 0; i < numViews; i++) {
      await ctx.prisma.postView.create({
        data: {
          postId: post.id,
          userId: faker.datatype.boolean(0.7) ? faker.helpers.arrayElement(users).id : undefined,
          ip: faker.internet.ip(),
        },
      });
      postViewCount++;
    }
  }
  counts.postViews = postViewCount;

  // Product images: 1-4 per product
  let productImageCount = 0;
  for (const product of products) {
    const numImages = faker.number.int({ min: 1, max: 4 });
    for (let i = 0; i < numImages; i++) {
      await ctx.prisma.productImage.create({
        data: {
          productId: product.id,
          url: `https://picsum.photos/seed/${product.sku}-${i}/400/400`,
          alt: `${product.name} - Image ${i + 1}`,
          sortOrder: i,
        },
      });
      productImageCount++;
    }
  }
  counts.productImages = productImageCount;
}
