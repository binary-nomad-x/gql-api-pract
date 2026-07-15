import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const schemaDir = join(__dirname, "..", "src", "schema");
const outFile = join(__dirname, "..", "schema.graphql");

const files = readdirSync(schemaDir).filter((f) => f.endsWith(".graphql"));

const order = ["base.graphql", ...files.filter((f) => f !== "base.graphql").sort()];

let combined = "";
for (const file of order) {
  const content = readFileSync(join(schemaDir, file), "utf-8");
  combined += `${content.trim()}\n\n`;
}

writeFileSync(outFile, combined.trim() + "\n");
console.log(`Merged ${files.length} schema files → ${outFile}`);
