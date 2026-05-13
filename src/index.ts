import "dotenv/config";
import { ApolloServer } from "apollo-server";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { createContext } from "./context.js";
import { resolvers } from "./resolvers/index.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const typeDefs = readFileSync(
  join(__dirname, "schema", "schema.graphql"),
  "utf8",
);

const server = new ApolloServer({
  typeDefs,
  resolvers,
  context: createContext,
  introspection: true,
});

const port = process.env.PORT || 4000;

server.listen(port).then(({ url }) => {
  console.log(`🚀 Server ready at ${url}`);
});
