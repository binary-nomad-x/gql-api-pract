import "dotenv/config";
import { ApolloServer } from "apollo-server";
import { createContext } from "./context.js";
import { typeDefs } from "./schema/typeDefs.js";
import { resolvers } from "./modules/index.js";
import { logger } from "./utils/logger.js";
import { ApolloServerPluginLandingPageModernLocal } from "./landingPage.js";

const server = new ApolloServer({
  typeDefs,
  resolvers,
  context: createContext,
  introspection: true,
  plugins: [ApolloServerPluginLandingPageModernLocal()],
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
