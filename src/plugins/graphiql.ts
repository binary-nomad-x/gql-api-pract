import type { ApolloServerPlugin } from "@apollo/server";

const GRAPHIQL_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>GraphQL API</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/graphiql@3/graphiql.min.css" />
</head>
<body style="margin:0;width:100vw;height:100vh;overflow:hidden">
  <div id="graphiql" style="height:100vh">Loading...</div>
  <script crossorigin src="https://cdn.jsdelivr.net/npm/react@18/umd/react.production.min.js"></script>
  <script crossorigin src="https://cdn.jsdelivr.net/npm/react-dom@18/umd/react-dom.production.min.js"></script>
  <script crossorigin src="https://cdn.jsdelivr.net/npm/graphiql@3/graphiql.min.js"></script>
  <script>
    const fetcher = GraphiQL.createFetcher({ url: window.location.href });
    const root = ReactDOM.createRoot(document.getElementById('graphiql'));
    root.render(React.createElement(GraphiQL, { fetcher, defaultEditorToolsVisibility: true }));
  </script>
</body>
</html>`;

export function ApolloServerPluginGraphiQL(): ApolloServerPlugin {
  return {
    async serverWillStart() {
      return {
        async renderLandingPage() {
          return { html: GRAPHIQL_HTML };
        },
      };
    },
  };
}
