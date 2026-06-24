import { faker } from "@faker-js/faker";
import type { SeedContext, SeedCounts } from "./types.js";
import { generateIds, bulkInsert, bulkInsertJoin } from "./utils.js";

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
  await bulkInsert(ctx.pool, "categories",
    CATEGORY_DATA.map((c, i) => ({ id: catIds[i], ...c, updatedAt: new Date() })),
  );
  counts.categories = catIds.length;
  console.log(`Created ${catIds.length} categories`);

  const tagIds = generateIds(TAG_NAMES.length);
  await bulkInsert(ctx.pool, "tags",
    TAG_NAMES.map((n, i) => ({ id: tagIds[i], name: n })),
  );
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
  await bulkInsert(ctx.pool, "posts", postIds.map((id) => ({
    id,
    title: faker.lorem.sentence({ min: 5, max: 12 }),
    content: faker.lorem.paragraphs({ min: 3, max: 8 }),
    published: faker.datatype.boolean(0.7),
    authorId: faker.helpers.arrayElement(userIds),
    updatedAt: new Date(),
  })));
  counts.posts = postIds.length;
  console.log(`Created ${postIds.length} posts`);

  // M2M joins via parameterized batch INSERT
  const postTagPairs: Array<{ a: string; b: string }> = [];
  const postCatPairs: Array<{ a: string; b: string }> = [];
  for (const id of postIds) {
    const tags = faker.helpers.arrayElements(tagIds, faker.number.int({ min: 1, max: 4 }));
    for (const t of tags) postTagPairs.push({ a: id, b: t });
    const cats = faker.helpers.arrayElements(catIds.slice(0, 6), faker.number.int({ min: 1, max: 3 }));
    // _PostToCategory: A=categoryId, B=postId (alphabetical: C < P)
    for (const c of cats) postCatPairs.push({ a: c, b: id });
  }
  await bulkInsertJoin(ctx.pool, "_PostToTag", postTagPairs);
  await bulkInsertJoin(ctx.pool, "_PostToCategory", postCatPairs);

  // Comments — need explicit IDs (Prisma cuid() has no PG default)
  const commentIds = generateIds(SEED_COMMENTS);
  await bulkInsert(ctx.pool, "comments", Array.from({ length: SEED_COMMENTS }, (_, i) => ({
    id: commentIds[i],
    content: faker.lorem.sentences({ min: 1, max: 3 }),
    authorId: faker.helpers.arrayElement(userIds),
    postId: faker.helpers.arrayElement(postIds),
    updatedAt: new Date(),
  })));
  counts.comments = SEED_COMMENTS;
  console.log(`Created ${SEED_COMMENTS} comments`);

  // Likes — deduped, with explicit IDs
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
  const likeIds = generateIds(likeData.length);
  await bulkInsert(ctx.pool, "likes", likeData.map((d, i) => ({ id: likeIds[i], ...d })));
  counts.likes = likeData.length;
  console.log(`Created ${likeData.length} likes`);

  return postIds;
}
