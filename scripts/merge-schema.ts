import { readdirSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";

const schemaDir = join(import.meta.dirname, "..", "src", "schema");
const outFile = join(import.meta.dirname, "..", "schema.graphql");

const files = readdirSync(schemaDir).filter((f) => f.endsWith(".graphql"));

const order = ["base.graphql", ...files.filter((f) => f !== "base.graphql").sort()];

let combined = "";
for (const file of order) {
  const content = readFileSync(join(schemaDir, file), "utf-8");
  combined += `# === ${file} ===\n${content.trim()}\n\n`;
}

writeFileSync(outFile, combined.trim() + "\n");
console.log(`Merged ${files.length} schema files → ${outFile}`);
