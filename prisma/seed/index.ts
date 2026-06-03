import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import type { SeedCounts } from "./types.js";
import { createEmptyCounts } from "./types.js";
import { resetDatabase, printElapsed } from "./utils.js";
import { seedUsers } from "./users.js";
import { seedCategoriesAndTags, seedPostsCommentsLikes } from "./content.js";
import { seedCommerce } from "./commerce.js";
import { seedReviews } from "./reviews.js";
import { seedAccountRelated } from "./account.js";
import { seedPromotions } from "./promotions.js";
import { seedRemaining } from "./notifications.js";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main(): Promise<void> {
  const flag = process.argv[2] ?? "";
  const shouldReset = flag === "--reset" || flag === "-r";
  const shouldFresh = flag === "--fresh" || flag === "-f";

  // --reset: delete all data and exit
  if (shouldReset) {
    await resetDatabase(prisma);
    console.log("Database reset complete.");
    return;
  }

  // --fresh: delete all data before seeding
  if (shouldFresh) {
    await resetDatabase(prisma);
    console.log("Database reset complete. Now seeding...\n");
  }

  console.log("Seeding database...\n");
  const start = Date.now();
  const counts: SeedCounts = createEmptyCounts();

  const users = await seedUsers({ prisma }, counts);

  const { categories, tags } = await seedCategoriesAndTags({ prisma }, counts);

  const posts = await seedPostsCommentsLikes({ prisma }, counts, users, categories, tags);

  const { products, orders } = await seedCommerce({ prisma }, counts, users, categories);

  await seedReviews({ prisma }, counts, users, products);

  await seedAccountRelated({ prisma }, counts, users, products);

  await seedPromotions({ prisma }, counts, orders);

  await seedRemaining({ prisma }, counts, users, posts, products);

  // Summary
  printElapsed(start);
  console.log(
    `Summary: ${counts.users} users, ${counts.products} products, ${counts.orders} orders, ` +
    `${counts.reviews} reviews, ${counts.notifications} notifications, ${counts.postViews} post views`,
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
