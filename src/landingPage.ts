import type { ApolloServerPlugin } from "apollo-server-plugin-base";

const LANDING_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>GraphQL API</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #1a1a2e; color: #e0e0e0; height: 100vh; display: flex; flex-direction: column; }
  .toolbar { display: flex; align-items: center; gap: 12px; padding: 10px 16px; background: #16213e; border-bottom: 1px solid #0f3460; }
  .toolbar h1 { font-size: 15px; font-weight: 600; color: #e94560; }
  .toolbar button { background: #e94560; color: #fff; border: none; padding: 6px 18px; border-radius: 4px; cursor: pointer; font-size: 13px; font-weight: 500; }
  .toolbar button:hover { background: #d63851; }
  .toolbar .endpoint { color: #888; font-size: 12px; margin-left: auto; font-family: monospace; }
  .main { display: flex; flex: 1; overflow: hidden; }
  .sidebar { width: 280px; background: #16213e; border-right: 1px solid #0f3460; overflow-y: auto; padding: 12px; flex-shrink: 0; }
  .sidebar h3 { font-size: 11px; text-transform: uppercase; color: #e94560; margin-bottom: 8px; letter-spacing: 1px; }
  .sidebar .type-group { margin-bottom: 16px; }
  .sidebar .type-item { padding: 4px 8px; cursor: pointer; border-radius: 3px; font-size: 12px; font-family: monospace; color: #7ec8e3; }
  .sidebar .type-item:hover { background: #0f3460; }
  .sidebar .type-item .args { color: #f5c542; }
  .sidebar .type-item .ret { color: #7eca9c; }
  .editor-panel { flex: 1; display: flex; flex-direction: column; }
  .editor-panel textarea { flex: 1; background: #1a1a2e; color: #e0e0e0; border: none; padding: 16px; font-family: 'Cascadia Code', 'Fira Code', 'Consolas', monospace; font-size: 13px; resize: none; outline: none; line-height: 1.6; tab-size: 2; }
  .editor-panel textarea::placeholder { color: #555; }
  .result-panel { height: 40%; border-top: 1px solid #0f3460; background: #0d1117; overflow-y: auto; padding: 16px; font-family: 'Cascadia Code', 'Fira Code', 'Consolas', monospace; font-size: 13px; white-space: pre-wrap; }
  .result-panel .error { color: #e94560; }
  .result-panel .success { color: #7eca9c; }
  .variables-bar { display: flex; align-items: center; padding: 4px 16px; background: #16213e; border-top: 1px solid #0f3460; }
  .variables-bar span { font-size: 11px; color: #888; margin-right: 8px; }
  .variables-bar input { flex: 1; background: #1a1a2e; color: #e0e0e0; border: 1px solid #0f3460; padding: 4px 8px; border-radius: 3px; font-family: monospace; font-size: 12px; outline: none; }
  ::-webkit-scrollbar { width: 6px; }
  ::-webkit-scrollbar-track { background: #1a1a2e; }
  ::-webkit-scrollbar-thumb { background: #0f3460; border-radius: 3px; }
</style>
</head>
<body>
<div class="toolbar">
  <h1>⚡ GraphQL API</h1>
  <button id="runBtn">▶ Run</button>
  <button id="docsBtn" onclick="toggleDocs()">📖 Docs</button>
  <span class="endpoint">POST http://localhost:4000/graphql</span>
</div>
<div class="main">
  <div class="sidebar" id="sidebar" style="display:none">
    <div id="docsContent"></div>
  </div>
  <div class="editor-panel">
    <textarea id="queryEditor" placeholder="# Write your GraphQL query here...&#10;&#10;query {&#10;  __typename&#10;}"></textarea>
    <div class="variables-bar">
      <span>Variables:</span>
      <input id="variablesInput" placeholder='{ }' />
    </div>
    <div class="result-panel" id="resultPanel">Run a query to see the result</div>
  </div>
</div>
<script>
const endpoint = window.location.origin + '/graphql';
const editor = document.getElementById('queryEditor');
const resultPanel = document.getElementById('resultPanel');
const sidebar = document.getElementById('sidebar');
const docsContent = document.getElementById('docsContent');

async function runQuery() {
  const query = editor.value.trim();
  if (!query) return;
  resultPanel.textContent = 'Loading...';
  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query }),
    });
    const data = await res.json();
    resultPanel.innerHTML = '';
    if (data.errors) {
      resultPanel.innerHTML += '<div class="error">' + JSON.stringify(data.errors, null, 2) + '</div>';
    }
    if (data.data) {
      resultPanel.innerHTML += '<div class="success">' + JSON.stringify(data.data, null, 2) + '</div>';
    }
  } catch (e) {
    resultPanel.innerHTML = '<div class="error">' + JSON.stringify({ error: e.message }, null, 2) + '</div>';
  }
}

document.getElementById('runBtn').addEventListener('click', runQuery);
editor.addEventListener('keydown', function(e) {
  if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); runQuery(); }
});

async function loadDocs() {
  const q = \`query { __schema { queryType { name fields { name args { name type { name kind } } type { name kind } } } mutationType { name fields { name args { name type { name kind } } type { name kind } } } types { name kind fields { name args { name type { name kind } } type { name kind } } enumValues { name } } } }\`;
  try {
    const res = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ query: q }) });
    const { data } = await res.json();
    const schema = data.__schema;
    let html = '<h3>Queries</h3><div class="type-group">';
    if (schema.queryType) {
      for (const f of schema.queryType.fields) {
        html += '<div class="type-item" onclick="insertQuery(\\'' + f.name + '\\')">' + f.name;
        if (f.args.length) html += ' <span class="args">(' + f.args.map(a => a.name + ': ' + a.type.name).join(', ') + ')</span>';
        html += ': <span class="ret">' + f.type.name + '</span></div>';
      }
    }
    html += '</div><h3>Mutations</h3><div class="type-group">';
    if (schema.mutationType) {
      for (const f of schema.mutationType.fields) {
        html += '<div class="type-item" onclick="insertQuery(\\'' + f.name + '\\')">' + f.name;
        if (f.args.length) html += ' <span class="args">(' + f.args.map(a => a.name + ': ' + a.type.name).join(', ') + ')</span>';
        html += ': <span class="ret">' + f.type.name + '</span></div>';
      }
    }
    html += '</div>';
    docsContent.innerHTML = html;
  } catch (e) {
    docsContent.innerHTML = '<div class="error">Failed to load docs: ' + e.message + '</div>';
  }
}

function toggleDocs() {
  const show = sidebar.style.display === 'none';
  sidebar.style.display = show ? 'block' : 'none';
  if (show) loadDocs();
}

function insertQuery(name) {
  editor.value = name.includes('(') ? 'mutation {\\n  ' + name + '\\n}' : 'query {\\n  ' + name + '\\n}';
}

document.addEventListener('DOMContentLoaded', () => {
  const saved = localStorage.getItem('lastQuery');
  if (saved) editor.value = saved;
  editor.addEventListener('input', () => localStorage.setItem('lastQuery', editor.value));
});
<\/script>
</body>
</html>`;

export function ApolloServerPluginLandingPageModernLocal(): ApolloServerPlugin {
  return {
    async serverWillStart() {
      return {
        async renderLandingPage() {
          return { html: LANDING_HTML };
        },
      };
    },
  };
}
