import type { SeedContext, SeedCounts } from "./types.js";

const TAG_DATA = [
  { name: "JavaScript", slug: "javascript", description: "Modern JavaScript including ES6+ features", color: "#f7df1e", icon: "js", isFeatured: true },
  { name: "TypeScript", slug: "typescript", description: "Typed superset of JavaScript", color: "#3178c6", icon: "ts", isFeatured: true },
  { name: "React", slug: "react", description: "UI component library by Facebook", color: "#61dafb", icon: "react", isFeatured: true },
  { name: "Node.js", slug: "nodejs", description: "JavaScript runtime built on V8", color: "#339933", icon: "node", isFeatured: true },
  { name: "Python", slug: "python", description: "High-level general-purpose language", color: "#3776ab", icon: "py", isFeatured: false },
  { name: "GraphQL", slug: "graphql", description: "API query language and runtime", color: "#e535ab", icon: "gql", isFeatured: true },
  { name: "Database", slug: "database", description: "Data storage and retrieval systems", color: "#336791", icon: "db", isFeatured: false },
  { name: "DevOps", slug: "devops", description: "Development and operations automation", color: "#fc6d26", icon: "devops", isFeatured: false },
  { name: "CSS", slug: "css", description: "Cascading Style Sheets", color: "#1572b6", icon: "css", isFeatured: false },
  { name: "Testing", slug: "testing", description: "Software testing methodologies and tools", color: "#ff6f00", icon: "test", isFeatured: false },
  { name: "Security", slug: "security", description: "Application and data security", color: "#ff0000", icon: "lock", isFeatured: false },
  { name: "Performance", slug: "performance", description: "Performance optimization techniques", color: "#00bcd4", icon: "perf", isFeatured: false },
  { name: "Architecture", slug: "architecture", description: "Software design and architecture patterns", color: "#9c27b0", icon: "arch", isFeatured: false },
  { name: "API Design", slug: "api-design", description: "REST, GraphQL and API best practices", color: "#4caf50", icon: "api", isFeatured: false },
  { name: "Machine Learning", slug: "machine-learning", description: "AI and ML algorithms and frameworks", color: "#f44336", icon: "ml", isFeatured: false },
  { name: "Docker", slug: "docker", description: "Containerization platform", color: "#2496ed", icon: "docker", isFeatured: false },
  { name: "Kubernetes", slug: "kubernetes", description: "Container orchestration system", color: "#326ce5", icon: "k8s", isFeatured: false },
  { name: "Rust", slug: "rust", description: "Systems programming language", color: "#000000", icon: "rust", isFeatured: false },
  { name: "Go", slug: "go", description: "Compiled concurrent programming language", color: "#00add8", icon: "go", isFeatured: false },
  { name: "PostgreSQL", slug: "postgresql", description: "Advanced relational database", color: "#336791", icon: "pg", isFeatured: false },
];

export async function seedTags(
  ctx: SeedContext,
  counts: SeedCounts,
): Promise<string[]> {

  const tags = await Promise.all(
    TAG_DATA.map((data) =>
      ctx.prisma.tag.create({
        data: {
          name: data.name,
          slug: data.slug,
          description: data.description,
          color: data.color,
          icon: data.icon,
          isFeatured: data.isFeatured,
        },
      }),
    ),
  );

  counts.tags += tags.length;

  return tags.map((tag) => tag.id);
}
