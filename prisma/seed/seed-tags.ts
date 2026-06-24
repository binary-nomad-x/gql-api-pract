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

  await ctx.prisma.tag.createMany({
    data: TAG_NAMES.map((name) => ({ name })),
    skipDuplicates: true,
  });

  const tags = await ctx.prisma.tag.findMany({
    where: {
      name: {
        in: TAG_NAMES,
      },
    },
    select: {
      id: true,
    },
  });

  counts.tags += tags.length;

  return tags.map((tag) => tag.id);
}
