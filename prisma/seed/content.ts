import { faker } from "@faker-js/faker";
import type { SeedContext, SeedCounts } from "./types.js";
import type { User } from "@prisma/client";
import { attachPostTags, attachPostCategories } from "./utils.js";

const SEED_POSTS = 500;
const SEED_COMMENTS = 2000;
const SEED_LIKES = 3000;

const CATEGORY_DATA: Array<{ name: string; slug: string; description: string }> = [
  { name: "Technology", slug: "technology", description: "Tech, software, and gadgets" },
  { name: "Science", slug: "science", description: "Scientific discoveries" },
  { name: "Travel", slug: "travel", description: "Travel experiences" },
  { name: "Food", slug: "food", description: "Cooking and food culture" },
  { name: "Health", slug: "health", description: "Health and wellness" },
  { name: "Sports", slug: "sports", description: "Sports news and analysis" },
  { name: "Electronics", slug: "electronics", description: "Electronic devices and accessories" },
  { name: "Clothing", slug: "clothing", description: "Apparel and fashion" },
  { name: "Home & Garden", slug: "home-garden", description: "Home improvement and gardening" },
  { name: "Books", slug: "books", description: "Books and literature" },
  { name: "Music", slug: "music", description: "Music and audio" },
  { name: "Gaming", slug: "gaming", description: "Video games and accessories" },
  { name: "Photography", slug: "photography", description: "Cameras and photography" },
  { name: "Automotive", slug: "automotive", description: "Cars and automotive" },
  { name: "Pets", slug: "pets", description: "Pet supplies and care" },
];

const TAG_NAMES = [
  "javascript", "typescript", "graphql", "prisma", "react", "nodejs",
  "python", "ai", "database", "api", "webdev", "tutorial", "docker",
  "devops", "testing", "performance", "security", "css", "html", "mobile",
];

export async function seedCategoriesAndTags(ctx: SeedContext, counts: SeedCounts) {
  await ctx.prisma.category.createMany({ data: CATEGORY_DATA });
  const categories = await ctx.prisma.category.findMany();
  counts.categories = categories.length;
  console.log(`Created ${categories.length} categories`);

  await ctx.prisma.tag.createMany({ data: TAG_NAMES.map((n) => ({ name: n })) });
  const tags = await ctx.prisma.tag.findMany();
  counts.tags = tags.length;
  console.log(`Created ${tags.length} tags`);
  return { categories, tags };
}

export async function seedPostsCommentsLikes(
  ctx: SeedContext, counts: SeedCounts,
  users: User[], categories: { id: string }[], tags: { id: string }[],
) {
  console.log("Seeding posts...");
  // Bulk create posts without M2M relations
  const postBatch = 500;
  const allPostData: Array<{ title: string; content: string; published: boolean; authorId: string }> = [];
  const postTagData: Array<{ postId: string; tagId: string }> = [];
  const postCatData: Array<{ postId: string; categoryId: string }> = [];

  for (let i = 0; i < SEED_POSTS; i++) {
    allPostData.push({
      title: faker.lorem.sentence({ min: 5, max: 12 }),
      content: faker.lorem.paragraphs({ min: 3, max: 8 }),
      published: faker.datatype.boolean(0.7),
      authorId: faker.helpers.arrayElement(users).id,
    });
  }

  await ctx.prisma.post.createMany({ data: allPostData });
  const posts = await ctx.prisma.post.findMany();
  counts.posts = posts.length;
  console.log(`Created ${posts.length} posts`);

  // Build M2M join data — need post IDs which we now have
  for (const post of posts) {
    const postTags = faker.helpers.arrayElements(tags, faker.number.int({ min: 1, max: 4 }));
    for (const t of postTags) postTagData.push({ postId: post.id, tagId: t.id });
    const postCats = faker.helpers.arrayElements(categories.slice(0, 6), faker.number.int({ min: 1, max: 3 }));
    for (const c of postCats) postCatData.push({ postId: post.id, categoryId: c.id });
  }

  // Raw batch inserts into implicit join tables
  await attachPostTags(ctx.prisma, postTagData);
  await attachPostCategories(ctx.prisma, postCatData);

  // Comments — bulk
  const commentData = Array.from({ length: SEED_COMMENTS }, () => ({
    content: faker.lorem.sentences({ min: 1, max: 3 }),
    authorId: faker.helpers.arrayElement(users).id,
    postId: faker.helpers.arrayElement(posts).id,
  }));
  await ctx.prisma.comment.createMany({ data: commentData });
  counts.comments = SEED_COMMENTS;
  console.log(`Created ${SEED_COMMENTS} comments`);

  // Likes — deduped pairs, then bulk
  const likeSet = new Set<string>();
  const likeData: Array<{ userId: string; postId: string }> = [];
  for (let i = 0; i < SEED_LIKES; i++) {
    const userId = faker.helpers.arrayElement(users).id;
    const postId = faker.helpers.arrayElement(posts).id;
    const key = `${userId}_${postId}`;
    if (likeSet.has(key)) continue;
    likeSet.add(key);
    likeData.push({ userId, postId });
  }
  await ctx.prisma.like.createMany({ data: likeData });
  counts.likes = likeData.length;
  console.log(`Created ${likeData.length} likes`);

  return posts;
}
