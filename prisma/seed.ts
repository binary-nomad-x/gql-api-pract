import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const USERS = [
  { email: "alice@test.com", name: "Alice Johnson", password: "password123", role: "ADMIN" as const },
  { email: "bob@test.com", name: "Bob Smith", password: "password123", role: "USER" as const },
  { email: "charlie@test.com", name: "Charlie Brown", password: "password123", role: "USER" as const },
  { email: "diana@test.com", name: "Diana Prince", password: "password123", role: "MODERATOR" as const },
  { email: "eve@test.com", name: "Eve Adams", password: "password123", role: "USER" as const },
];

const CATEGORIES = [
  { name: "Technology", slug: "technology", description: "Posts about tech, software, and gadgets" },
  { name: "Science", slug: "science", description: "Scientific discoveries and research" },
  { name: "Travel", slug: "travel", description: "Travel experiences and guides" },
  { name: "Food", slug: "food", description: "Cooking, recipes, and food culture" },
  { name: "Health", slug: "health", description: "Health, fitness, and wellness" },
  { name: "Sports", slug: "sports", description: "Sports news and analysis" },
];

const POSTS_DATA = [
  { title: "Getting Started with Prisma", content: "Prisma is a next-generation ORM that makes database access easy. In this post, we'll explore the basics of Prisma and how to set it up with a GraphQL API.", tags: ["prisma", "graphql", "database"], categories: ["technology"] },
  { title: "Understanding GraphQL Resolvers", content: "Resolvers are the backbone of any GraphQL API. They tell the server how to fetch data for each field in your schema.", tags: ["graphql", "javascript"], categories: ["technology"] },
  { title: "The Future of AI", content: "Artificial intelligence is evolving rapidly. From large language models to computer vision, AI is transforming every industry.", tags: ["ai", "technology", "future"], categories: ["technology", "science"] },
  { title: "Top 10 Travel Destinations in 2026", content: "Looking for your next adventure? Here are the top 10 must-visit destinations for 2026, from hidden gems to classic favorites.", tags: ["travel", "adventure"], categories: ["travel"] },
  { title: "How to Stay Healthy While Working Remotely", content: "Remote work offers flexibility but can take a toll on your health. Follow these tips to stay active and healthy.", tags: ["health", "remote-work", "wellness"], categories: ["health"] },
  { title: "Delicious Pasta Recipes for Beginners", content: "Learn how to make perfect pasta from scratch with these simple recipes that will impress your family and friends.", tags: ["cooking", "pasta", "recipes"], categories: ["food"] },
  { title: "Quantum Computing Explained", content: "Quantum computing promises to revolutionize computation. But how does it actually work? Let's break it down in simple terms.", tags: ["quantum", "computing", "science"], categories: ["science", "technology"] },
  { title: "The Art of Mindful Meditation", content: "Meditation doesn't have to be complicated. Start with just 5 minutes a day and experience the benefits of mindfulness.", tags: ["meditation", "mindfulness", "health"], categories: ["health"] },
  { title: "Building REST APIs vs GraphQL APIs", content: "When should you choose REST over GraphQL? Compare the trade-offs and learn which approach fits your project.", tags: ["api", "graphql", "rest"], categories: ["technology"] },
  { title: "World Cup 2026 Preview", content: "With the World Cup approaching, here's everything you need to know about the teams, venues, and predictions.", tags: ["sports", "world-cup", "football"], categories: ["sports"] },
  { title: "A Food Lover's Guide to Italy", content: "From Rome to Florence, discover the best Italian dishes and where to find them on your next trip.", tags: ["travel", "food", "italy"], categories: ["travel", "food"] },
  { title: "Introduction to TypeScript Generics", content: "Generics in TypeScript can seem intimidating, but they're a powerful tool for writing reusable, type-safe code.", tags: ["typescript", "javascript", "programming"], categories: ["technology"] },
];

const PROFILE_BIO = [
  "Full-stack developer passionate about open source",
  "Writer and traveler exploring the world",
  "Science enthusiast and tech blogger",
  "Fitness coach and nutrition expert",
  "Food critic and amateur chef",
];

const COMMENTS = [
  { authorIndex: 1, content: "Great post! Really helpful information." },
  { authorIndex: 2, content: "Thanks for sharing this. I learned a lot." },
  { authorIndex: 3, content: "I have a question about this topic..." },
  { authorIndex: 4, content: "Could you expand on this in a follow-up post?" },
  { authorIndex: 0, content: "Excellent write-up! Keep it up." },
  { authorIndex: 2, content: "This is exactly what I was looking for." },
  { authorIndex: 3, content: "Nice article. Bookmarked for later!" },
  { authorIndex: 1, content: "I disagree with some points but well argued." },
  { authorIndex: 4, content: "Can you recommend any resources to learn more?" },
  { authorIndex: 0, content: "Well written and easy to understand." },
];

async function main() {
  const flag = process.argv[2] || "";

  if (flag === "--reset" || flag === "-r") {
    await resetDatabase();
    console.log("Database reset complete.");
    return;
  }

  if (flag === "--fresh" || flag === "-f") {
    await resetDatabase();
    console.log("Database reset. Now seeding...");
  }

  console.log("Seeding database...\n");

  const hashedPassword = await bcrypt.hash("password123", 10);

  const users = await Promise.all(
    USERS.map((u) =>
      prisma.user.create({
        data: { ...u, password: hashedPassword },
      })
    )
  );
  console.log(`Created ${users.length} users`);

  const categories = await Promise.all(
    CATEGORIES.map((c) =>
      prisma.category.create({ data: c })
    )
  );
  console.log(`Created ${categories.length} categories`);

  const allTags = new Set(POSTS_DATA.flatMap((p) => p.tags));
  const tagMap: Record<string, any> = {};
  for (const tagName of allTags) {
    tagMap[tagName] = await prisma.tag.upsert({
      where: { name: tagName },
      update: {},
      create: { name: tagName },
    });
  }
  console.log(`Created ${Object.keys(tagMap).length} tags`);

  const posts = await Promise.all(
    POSTS_DATA.map((p, i) =>
      prisma.post.create({
        data: {
          title: p.title,
          content: p.content,
          published: i % 3 !== 0,
          authorId: users[i % users.length].id,
          tags: {
            connect: p.tags.map((t) => ({ name: t })),
          },
          categories: {
            connect: p.categories.map((c) => ({ slug: c })),
          },
        },
      })
    )
  );
  console.log(`Created ${posts.length} posts`);

  for (let i = 0; i < users.length; i++) {
    await prisma.profile.upsert({
      where: { userId: users[i].id },
      update: {},
      create: {
        userId: users[i].id,
        bio: PROFILE_BIO[i],
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${users[i].name}`,
        phone: `+1-555-${String(1000 + i).slice(1)}`,
        address: `${100 + i * 100} Main Street, Cityville`,
      },
    });
  }
  console.log(`Created ${users.length} profiles`);

  const comments = await Promise.all(
    COMMENTS.map((c, i) =>
      prisma.comment.create({
        data: {
          content: c.content,
          authorId: users[c.authorIndex].id,
          postId: posts[i % posts.length].id,
        },
      })
    )
  );
  console.log(`Created ${comments.length} comments`);

  let totalLikes = 0;
  for (let i = 0; i < posts.length; i++) {
    const likers = new Set<number>();
    const numLikes = Math.floor(Math.random() * users.length) + 1;
    while (likers.size < numLikes) {
      likers.add(Math.floor(Math.random() * users.length));
    }
    for (const userIdx of likers) {
      await prisma.like.create({
        data: { userId: users[userIdx].id, postId: posts[i].id },
      });
      totalLikes++;
    }
  }
  console.log(`Created ${totalLikes} likes`);

  console.log("\n✅ Seeding complete!");
  console.log(`\n📊 Summary:
  Users:     ${users.length}
  Categories:${categories.length}
  Tags:      ${Object.keys(tagMap).length}
  Posts:     ${posts.length}
  Comments:  ${comments.length}
  Likes:     ${totalLikes}

🔑 Test accounts (all passwords: password123):
  - alice@test.com (ADMIN)
  - bob@test.com (USER)
  - charlie@test.com (USER)
  - diana@test.com (MODERATOR)
  - eve@test.com (USER)
`);
}

async function resetDatabase() {
  console.log("Resetting database...");
  await prisma.$transaction([
    prisma.like.deleteMany(),
    prisma.comment.deleteMany(),
    prisma.profile.deleteMany(),
    prisma.post.deleteMany(),
    prisma.category.deleteMany(),
    prisma.tag.deleteMany(),
    prisma.user.deleteMany(),
  ]);
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
