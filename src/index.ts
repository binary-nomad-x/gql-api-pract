import "dotenv/config";
import { ApolloServer } from "apollo-server";
import { createContext } from "./context.js";
import { typeDefs } from "./schema/typeDefs.js";
import { resolvers } from "./modules/index.js";

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
