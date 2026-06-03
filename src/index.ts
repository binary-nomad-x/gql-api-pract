import "dotenv/config";
import { ApolloServer } from "apollo-server";
import { ApolloServerPluginLandingPageLocalDefault } from "apollo-server-core";
import { createContext } from "./context.js";
import { typeDefs } from "./schema/typeDefs.js";
import { resolvers } from "./modules/index.js";
import { logger } from "./utils/logger.js";

const server = new ApolloServer({
  typeDefs,
  resolvers,
  context: createContext,
  introspection: true,
  plugins: [ApolloServerPluginLandingPageLocalDefault({ embed: true })],
});

const port = process.env.PORT || 4000;

server.listen(port).then(({ url }) => {
  logger.info("Server started", { url, port });
  console.log(`\n  GraphQL endpoint: ${url}\n`);
});

process.on("uncaughtException", (err) => {
  logger.critical("Uncaught exception", { message: err.message, stack: err.stack });
  process.exit(1);
});

process.on("unhandledRejection", (reason) => {
  logger.error("Unhandled promise rejection", { reason: String(reason) });
});
