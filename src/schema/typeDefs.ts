import { readFileSync, readdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);

const __dirname = dirname(__filename);

function load(dir: string): string[] {
  const files = readdirSync(join(__dirname, dir)).filter((f) =>
    f.endsWith(".graphql"),
  );
  return files.map((f) => readFileSync(join(__dirname, dir, f), "utf8"));
}

export const typeDefs = load(".").join("\n");
