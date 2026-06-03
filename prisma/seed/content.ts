import { faker } from "@faker-js/faker";
import type { SeedContext, SeedCounts } from "./types.js";
import type { User, Tag, Category, Post } from "@prisma/client";

const SEED_POSTS = 200;
const SEED_COMMENTS = 800;
const SEED_LIKES = 1200;

/** Pre-defined category fixtures mapped to the schema */
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

/**
 * Seed categories and tags (independent of other tables).
 */
export async function seedCategoriesAndTags(
  ctx: SeedContext,
  counts: SeedCounts,
): Promise<{ categories: Category[]; tags: Tag[] }> {
  // Categories
  const categories: Category[] = [];
  for (const c of CATEGORY_DATA) {
    categories.push(await ctx.prisma.category.create({ data: c }));
  }
  counts.categories = categories.length;
  console.log(`Created ${categories.length} categories`);

  // Tags
  const tags: Tag[] = [];
  for (const name of TAG_NAMES) {
    tags.push(await ctx.prisma.tag.create({ data: { name } }));
  }
  counts.tags = tags.length;
  console.log(`Created ${tags.length} tags`);

  return { categories, tags };
}

/**
 * Seed posts, comments, and likes.
 * Relies on users, categories, and tags already being seeded.
 */
export async function seedPostsCommentsLikes(
  ctx: SeedContext,
  counts: SeedCounts,
  users: User[],
  categories: Category[],
  tags: Tag[],
): Promise<Post[]> {
  // Posts
  const posts: Post[] = [];
  for (let i = 0; i < SEED_POSTS; i++) {
    const postTags = faker.helpers.arrayElements(tags, faker.number.int({ min: 1, max: 4 }));
    const postCategories = faker.helpers.arrayElements(
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
          tags: { connect: postTags.map((t: Tag) => ({ id: t.id })) },
          categories: { connect: postCategories.map((c: Category) => ({ id: c.id })) },
        },
      }),
    );
  }
  counts.posts = posts.length;
  console.log(`Created ${posts.length} posts`);

  // Comments
  for (let i = 0; i < SEED_COMMENTS; i++) {
    await ctx.prisma.comment.create({
      data: {
        content: faker.lorem.sentences({ min: 1, max: 3 }),
        authorId: faker.helpers.arrayElement(users).id,
        postId: faker.helpers.arrayElement(posts).id,
      },
    });
  }
  counts.comments = SEED_COMMENTS;
  console.log(`Created ${SEED_COMMENTS} comments`);

  // Likes (enforce unique user+post pairs via Set)
  const likePairs = new Set<string>();
  for (let i = 0; i < SEED_LIKES; i++) {
    const userId = faker.helpers.arrayElement(users).id;
    const postId = faker.helpers.arrayElement(posts).id;
    const key = `${userId}_${postId}`;
    if (likePairs.has(key)) continue;
    likePairs.add(key);
    await ctx.prisma.like.create({ data: { userId, postId } });
  }
  counts.likes = likePairs.size;
  console.log(`Created ${likePairs.size} likes`);

  return posts;
}
