import type { SeedContext, SeedCounts } from "./types.js";

const CATEGORY_DATA = [
  { name: "Electronics", slug: "electronics", description: "Gadgets, devices, and tech accessories" },
  { name: "Clothing", slug: "clothing", description: "Apparel, footwear, and accessories" },
  { name: "Books", slug: "books", description: "Fiction, non-fiction, and educational" },
  { name: "Home & Kitchen", slug: "home-kitchen", description: "Furniture, decor, and kitchenware" },
  { name: "Sports & Outdoors", slug: "sports-outdoors", description: "Sports equipment and outdoor gear" },
  { name: "Beauty & Health", slug: "beauty-health", description: "Skincare, cosmetics, and wellness" },
  { name: "Toys & Games", slug: "toys-games", description: "Toys, board games, and puzzles" },
  { name: "Automotive", slug: "automotive", description: "Car parts, accessories, and tools" },
];

export async function seedCategories(
  ctx: SeedContext,
  counts: SeedCounts,
): Promise<string[]> {

  const categories = await Promise.all(
    CATEGORY_DATA.map((data) => ctx.prisma.category.create({ data })),
  );

  counts.categories += categories.length;
  return categories.map((c) => c.id);

}
