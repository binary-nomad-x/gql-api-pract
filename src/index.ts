import "dotenv/config";
import { ApolloServer } from "apollo-server";
import { ApolloServerPluginLandingPageLocalDefault } from "apollo-server-core";
import { createContext } from "./context.js";
import { typeDefs } from "./schema/typeDefs.js";
import { resolvers } from "./modules/index.js";

const server = new ApolloServer({
  typeDefs,
  resolvers,
  context: createContext,
  introspection: true,
  plugins: [ApolloServerPluginLandingPageLocalDefault({ embed: true })],
});

const port = process.env.PORT || 4000;

server.listen(port).then(({ url }) => {
  console.log(`🚀 Server ready at ${url}`);
});
