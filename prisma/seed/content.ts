import { faker } from "@faker-js/faker";
import type { SeedContext, SeedCounts } from "./types.js";
import { generateIds, batchInsertImplicitJoin } from "./utils.js";

const SEED_POSTS = 500;
const SEED_COMMENTS = 2000;
const SEED_LIKES = 3000;

const CATEGORY_DATA: Array<{
  name: string;
  slug: string;
  description: string;
}> = [
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
  "javascript", "typescript", "graphql", "prisma", "react",
  "nodejs", "python", "ai", "database", "api",
  "webdev", "tutorial", "docker", "devops", "testing",
  "performance", "security", "css", "html", "mobile",
];

export async function seedCategoriesAndTags(
  ctx: SeedContext,
  counts: SeedCounts,
) {
  const catIds = generateIds(CATEGORY_DATA.length);
  await ctx.prisma.category.createMany({
    data: CATEGORY_DATA.map((c, i) => ({ id: catIds[i], ...c })),
  });
  counts.categories = catIds.length;
  console.log(`Created ${catIds.length} categories`);

  const tagIds = generateIds(TAG_NAMES.length);
  await ctx.prisma.tag.createMany({
    data: TAG_NAMES.map((n, i) => ({ id: tagIds[i], name: n })),
  });
  counts.tags = tagIds.length;
  console.log(`Created ${tagIds.length} tags`);

  return { categories: catIds, tags: tagIds };
}

export async function seedPostsCommentsLikes(
  ctx: SeedContext,
  counts: SeedCounts,
  userIds: string[],
  catIds: string[],
  tagIds: string[],
) {
  console.log("Seeding posts...");
  const postIds = generateIds(SEED_POSTS);
  const postData = postIds.map((id) => ({
    id,
    title: faker.lorem.sentence({ min: 5, max: 12 }),
    content: faker.lorem.paragraphs({ min: 3, max: 8 }),
    published: faker.datatype.boolean(0.7),
    authorId: faker.helpers.arrayElement(userIds),
  }));

  await ctx.prisma.post.createMany({ data: postData });
  counts.posts = postData.length;
  console.log(`Created ${postData.length} posts`);

  // M2M joins — build and batch-insert via raw SQL
  const postTagPairs: Array<{ a: string; b: string }> = [];
  const postCatPairs: Array<{ a: string; b: string }> = [];
  for (const id of postIds) {
    const tags = faker.helpers.arrayElements(tagIds, faker.number.int({ min: 1, max: 4 }));
    for (const t of tags) postTagPairs.push({ a: id, b: t });
    const cats = faker.helpers.arrayElements(catIds.slice(0, 6), faker.number.int({ min: 1, max: 3 }));
    // A=Category, B=Post (alphabetical order in Prisma's join table)
    for (const c of cats) postCatPairs.push({ a: c, b: id });
  }

  await batchInsertImplicitJoin(ctx.prisma, "_PostToTag", "A", "B", postTagPairs);
  await batchInsertImplicitJoin(ctx.prisma, "_PostToCategory", "A", "B", postCatPairs);

  // Comments
  const commentData = Array.from({ length: SEED_COMMENTS }, () => ({
    content: faker.lorem.sentences({ min: 1, max: 3 }),
    authorId: faker.helpers.arrayElement(userIds),
    postId: faker.helpers.arrayElement(postIds),
  }));
  await ctx.prisma.comment.createMany({ data: commentData });
  counts.comments = SEED_COMMENTS;
  console.log(`Created ${SEED_COMMENTS} comments`);

  // Likes — deduped
  const likeSet = new Set<string>();
  const likeData: Array<{ userId: string; postId: string }> = [];
  for (let i = 0; i < SEED_LIKES; i++) {
    const userId = faker.helpers.arrayElement(userIds);
    const postId = faker.helpers.arrayElement(postIds);
    const key = `${userId}_${postId}`;
    if (likeSet.has(key)) continue;
    likeSet.add(key);
    likeData.push({ userId, postId });
  }

  await ctx.prisma.like.createMany({ data: likeData });
  counts.likes = likeData.length;
  console.log(`Created ${likeData.length} likes`);

  return postIds;
}
