import { faker } from "@faker-js/faker";
import type { SeedContext, SeedCounts } from "./types.js";
import type { User, Tag, Category, Post } from "@prisma/client";

const SEED_POSTS = 200;
const SEED_COMMENTS = 800;
const SEED_LIKES = 1200;

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
];

const TAG_NAMES = [
  "javascript", "typescript", "graphql", "prisma", "react",
  "nodejs", "python", "ai", "database", "api", "webdev", "tutorial",
];

export async function seedCategoriesAndTags(
  ctx: SeedContext,
  counts: SeedCounts,
): Promise<{ categories: Category[]; tags: Tag[] }> {
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
  ctx: SeedContext,
  counts: SeedCounts,
  users: User[],
  categories: Category[],
  tags: Tag[],
): Promise<Post[]> {
  // Build post data in batches with relations handled via connect
  const posts: Post[] = [];
  for (let i = 0; i < SEED_POSTS; i++) {
    const tagIds = faker.helpers.arrayElements(tags, faker.number.int({ min: 1, max: 4 }));
    const catIds = faker.helpers.arrayElements(
      categories.slice(0, 6),
      faker.number.int({ min: 1, max: 3 }),
    );
    posts.push(
      await ctx.prisma.post.create({
        data: {
          title: faker.lorem.sentence({ min: 5, max: 12 }),
          content: faker.lorem.paragraphs({ min: 3, max: 8 }),
          published: faker.datatype.boolean(0.7),
          authorId: faker.helpers.arrayElement(users).id,
          tags: { connect: tagIds.map((t) => ({ id: t.id })) },
          categories: { connect: catIds.map((c) => ({ id: c.id })) },
        },
      }),
    );
  }
  counts.posts = posts.length;
  console.log(`Created ${posts.length} posts`);

  // Comments — bulk insert
  const commentData = Array.from({ length: SEED_COMMENTS }, () => ({
    content: faker.lorem.sentences({ min: 1, max: 3 }),
    authorId: faker.helpers.arrayElement(users).id,
    postId: faker.helpers.arrayElement(posts).id,
  }));
  await ctx.prisma.comment.createMany({ data: commentData });
  counts.comments = SEED_COMMENTS;
  console.log(`Created ${SEED_COMMENTS} comments`);

  // Likes — generate unique pairs upfront, then bulk insert
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
