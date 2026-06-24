import type { SeedContext, SeedCounts } from "./types.js";

const TAG_NAMES = [
  "JavaScript",
  "TypeScript",
  "React",
  "Node.js",
  "Python",
  "GraphQL",
  "Database",
  "DevOps",
  "CSS",
  "Testing",
  "Security",
  "Performance",
  "Architecture",
  "API Design",
  "Machine Learning",
];

export async function seedTags(
  ctx: SeedContext,
  counts: SeedCounts,
): Promise<string[]> {
  const tags = await Promise.all(
    TAG_NAMES.map((name) =>
      ctx.prisma.tag.create({ data: { name } }),
    ),
  );

  counts.tags += tags.length;
  return tags.map((t) => t.id);
}
