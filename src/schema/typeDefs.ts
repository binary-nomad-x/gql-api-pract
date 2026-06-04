import { readFileSync, readdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const TYPES_DIR = join(__dirname, "types");

function load(file: string): string {
  return readFileSync(join(__dirname, file), "utf8");
}

function loadTypeFiles(): string[] {
  const files = readdirSync(TYPES_DIR).filter(
    (f) => f.endsWith(".graphql"),
  );
  return files.map((f) => readFileSync(join(TYPES_DIR, f), "utf8"));
}

export const typeDefs = [
  ...loadTypeFiles(),
  load("./queries.graphql"),
  load("./mutations.graphql"),
].join("\n");
