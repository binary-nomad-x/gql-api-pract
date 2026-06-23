import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { createEmptyCounts, type SeedCounts } from "./types.js";
import { resetDatabase, printElapsed } from "./utils.js";
import { seedUsers } from "./users.js";
import { seedCategoriesAndTags, seedPostsCommentsLikes } from "./content.js";
import { seedCommerce } from "./commerce.js";
import { seedReviews } from "./reviews.js";
import { seedAccountRelated } from "./account.js";
import { seedPromotions } from "./promotions.js";
import { seedRemaining } from "./notifications.js";
import { seedSubscriptions } from "./subscriptions.js";
import { seedDiscounts } from "./discounts.js";
import { seedConversations } from "./conversations.js";
import { seedExtras } from "./extras.js";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main(): Promise<void> {
  const flag = process.argv[2] ?? "";

  if (flag === "--reset" || flag === "-r") {
    await resetDatabase(prisma);
    console.log("Database reset complete.");
    return;
  }

  if (flag === "--fresh" || flag === "-f") {
    await resetDatabase(prisma);
    console.log("Database reset complete. Now seeding...\n");
  }

  console.log("Seeding database...\n");
  const start = Date.now();
  const counts: SeedCounts = createEmptyCounts();

  // Phase 1 — independent
  console.log("[Phase 1] Users, Categories, Tags...");
  const [userIds, { categories: catIds, tags: tagIds }] = await Promise.all([
    seedUsers({ prisma }, counts),
    seedCategoriesAndTags({ prisma }, counts),
  ]);

  // Phase 2 — posts, products (depend on users+categories+tags)
  console.log("[Phase 2] Posts, Products...");
  const [postIds, { productIds }] = await Promise.all([
    seedPostsCommentsLikes({ prisma }, counts, userIds, catIds, tagIds),
    seedCommerce({ prisma }, counts, userIds, catIds),
  ]);

  // Phase 3 — reviews, address/account (from products+users)
  console.log("[Phase 3] Reviews, Addresses, Account-related...");
  await Promise.all([
    seedReviews({ prisma }, counts, userIds, productIds),
    seedAccountRelated({ prisma }, counts, userIds, productIds),
  ]);

  // Phase 4 — promotions (from orders)
  console.log("[Phase 4] Coupons, Shipments...");
  const orders = await prisma.order.findMany();
  await seedPromotions({ prisma }, counts, orders);

  // Phase 5 — everything else
  console.log(
    "[Phase 5] Notifications, Follows, SavedPosts, PostViews, ProductImages, Subscriptions, Discounts...",
  );
  await Promise.all([
    seedRemaining({ prisma }, counts, userIds, postIds, productIds),
    seedSubscriptions({ prisma }, counts, userIds),
    seedDiscounts({ prisma }, counts, productIds),
  ]);

  // Phase 6 — conversations + messages
  console.log("[Phase 6] Conversations, Messages...");
  await seedConversations({ prisma }, counts, userIds);

  // Phase 7 — extras: invoices, returns, support tickets, ticket replies
  console.log("[Phase 7] Invoices, Return Requests, Support Tickets...");
  await seedExtras({ prisma }, counts, userIds);

  // Summary
  printElapsed(start);
  console.log(
    `Summary: ${counts.users} users, ${counts.products} products, ${counts.orders} orders, ` +
      `${counts.messages} messages, ${counts.postViews} post views, ${counts.productImages} product images, ` +
      `${counts.invoices} invoices, ${counts.returns} returns, ${counts.tickets} tickets, ${counts.ticketReplies} replies`,
  );

  console.log(
    "\nTest accounts (password123): alice@test.com (ADMIN), bob@test.com (USER), " +
      "charlie@test.com (USER), diana@test.com (MODERATOR), eve@test.com (USER)",
  );
}

main()
  .catch((e: unknown) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
