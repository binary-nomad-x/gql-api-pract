import "dotenv/config";
import { ApolloServer } from "@apollo/server";
import { startStandaloneServer } from "@apollo/server/standalone";
import { createContext } from "./context.js";
import { typeDefs } from "./schema/typeDefs.js";
import { resolvers } from "./modules/index.js";
import { logger } from "./utils/logger.js";
import { ApolloServerPluginGraphiQL } from "./plugins/graphiql.js";

const server = new ApolloServer({
  typeDefs,
  resolvers,
  introspection: true,
  csrfPrevention: false,
  plugins: [ApolloServerPluginGraphiQL()],
});

const { url } = await startStandaloneServer(server, {
  context: async ({ req }) => createContext({ req }),
  listen: { port: Number(process.env.PORT) || 4000 },
});

logger.info("Server started", { url });
console.log(`\n  GraphQL endpoint: ${url}\n`);

process.on("uncaughtException", (err) => {
  logger.critical("Uncaught exception", { message: err.message, stack: err.stack });
  process.exit(1);
});

process.on("unhandledRejection", (reason) => {
  logger.error("Unhandled promise rejection", { reason: String(reason) });
});
