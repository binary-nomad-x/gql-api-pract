# 🚀 GraphQL Prisma API

<div align="center">

**A full-featured GraphQL API combining Blog, E-commerce & Notification Management**

[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)](https://www.typescriptlang.org/)
[![GraphQL](https://img.shields.io/badge/GraphQL-API-pink.svg)](https://graphql.org/)
[![Prisma](https://img.shields.io/badge/Prisma-7-2D3748.svg)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-336791.svg)](https://www.postgresql.org/)
[![Novu](https://img.shields.io/badge/Novu-Notifications-orange.svg)](https://novu.co/)

</div>

---

## ✨ Overview

This is a **production-ready GraphQL API** built with **Apollo Server 5**, **Prisma 7**, and **PostgreSQL**. It's designed as a complete learning sandbox and starter template featuring:

- 📝 **Blog Platform** — Posts, comments, likes, tags, and follows
- 🛒 **E-commerce System** — Products, orders, carts, payments, and reviews
- 🔔 **Novu Notification Management** — Workflow templates, variable registry, payload validation, and subscriber management

> **📊 90,000+ seed records** across **38 database models** — ready to explore and extend!

---

## 🏗️ Architecture

### Core Design Decisions

| Decision                    | Detail                                                                   |
| --------------------------- | ------------------------------------------------------------------------ |
| **Schema-first**            | GraphQL schema in `.graphql` files per domain, merged at runtime         |
| **`@auth` directive**       | Protects mutations/queries; JWT from `Authorization` header              |
| **Thin resolvers**          | Business logic pushed to dedicated service layer                         |
| **Services container**      | All services instantiated once in `Services` class, injected via context |
| **Constructor injection**   | Each service receives `core: PrismaClient` directly (no BaseService)     |
| **Prisma 7 driver adapter** | Uses `@prisma/adapter-pg` with raw `pg` driver for optimal performance   |
| **Manual HTTP**             | Raw `http.createServer()` with manual CORS + body parsing (no Express)   |

### Project Structure

```
graphql-prisma-api/
├── prisma/
│   ├── schema.prisma          # 38 database models
│   ├── data/                  # Reusable fixed seed data
│   ├── seed/                  # 30 seed files in 8 phases
│   └── migrations/            # 38 migration files
├── src/
│   ├── index.ts               # Server entry point
│   ├── context.ts             # Context factory (Prisma + Services)
│   ├── schema/                # 19 GraphQL SDL files (domain-split)
│   ├── lib/
│   │   ├── Services.ts        # DI container — service instantiation
│   │   └── core.ts            # Shared helpers: clean(), compact()
│   ├── modules/               # 26 domain modules
│   │   ├── auth/              # resolver.ts → service.ts
│   │   ├── blog/              # Posts, comments, likes, tags
│   │   ├── product/           # Products, categories, reviews
│   │   ├── order/             # Orders, payments, shipments
│   │   ├── novu/              # 🆕 Novu workflow management
│   │   └── ...                # All other domains
│   ├── utils/                 # Auth, errors, logger, Novu client
│   └── types/                 # Shared TypeScript types
├── scripts/
│   └── merge-schema.ts        # SDL merger script
├── schema.graphql             # Merged schema (auto-generated)
├── prisma.config.ts           # Prisma 7 driver adapter config
└── package.json
```

---

## 🚦 Prerequisites

- **Node.js** 18+ (LTS recommended)
- **PostgreSQL** 15+ (running locally or remotely)
- **npm** 9+ or **yarn** 1.22+

---

## ⚡ Quick Start

### 1. Clone & Install

```bash
git clone <repo-url>
cd graphql-prisma-api
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
```

| Variable              | Description                   | Required |
| --------------------- | ----------------------------- | -------- |
| `DATABASE_URL`        | PostgreSQL connection string  | ✅ Yes    |
| `PORT`                | Server port (default: `4000`) | ❌ No     |
| `JWT_SECRET`          | Secret for signing JWT tokens | ✅ Yes    |
| `NOVU_API_SECRET_KEY` | Novu API key (optional)       | ❌ No     |

### 3. Setup Database

```bash
npm run setup
```

> This runs: `prisma generate` → `prisma migrate dev` → `npm run seed`

Or step by step:

```bash
npm run generate        # Generate Prisma client
npm run migrate:dev     # Apply migrations
npm run seed            # Seed 90,000+ records
```

### 4. Start the Server

```bash
npm run dev
```

🌐 Open **http://localhost:4000** in your browser for the GraphQL sandbox.

### 5. 🔐 Login

```graphql
mutation {
  login(email: "admin@test.com", password: "password123") {
    token
    user {
      id
      email
      name
      role
    }
  }
}
```

---

## 👥 Test Accounts

| Email                | Role          | Password      |
| -------------------- | ------------- | ------------- |
| `admin@test.com`     | **ADMIN**     | `password123` |
| `admin2@test.com`    | **ADMIN**     | `password123` |
| `moderator@test.com` | **MODERATOR** | `password123` |
| `manager@test.com`   | **MANAGER**   | `password123` |
| `seller@test.com`    | **SELLER**    | `password123` |
| `customer@test.com`  | **USER**      | `password123` |

---

## 📜 Scripts

| Command                | Description                                        |
| ---------------------- | -------------------------------------------------- |
| `npm run dev`          | 🔥 Start dev server with hot-reload                 |
| `npm run build`        | 📦 Compile TypeScript to `dist/`                    |
| `npm run start`        | ▶️ Run compiled server                              |
| `npm run generate`     | 🔄 Regenerate Prisma client                         |
| `npm run migrate:dev`  | 🗄️ Create / apply Prisma migrations                 |
| `npm run db:reset`     | 🔄 Drop and re-apply all migrations                 |
| `npm run db:rebuild`   | 🏗️ Full reset: drop → migrate → seed → generate     |
| `npm run seed`         | 🌱 Seed sample data                                 |
| `npm run seed:fresh`   | 🧹 Reset database then re-seed                      |
| `npm run seed:reset`   | 🗑️ Delete all data (no seed)                        |
| `npm run studio`       | 🖥️ Open Prisma Studio (GUI browser)                 |
| `npm run schema:merge` | 🔗 Merge all `.graphql` files into `schema.graphql` |

---

## 🌱 Seed Data Breakdown

| Table             | Records  | Table           | Records  |
| ----------------- | -------- | --------------- | -------- |
| Users             | 65       | Profiles        | 65       |
| Categories        | 15       | Tags            | 10       |
| Posts             | 130      | Comments        | ~500     |
| Likes             | ~1,000   | Products        | 130      |
| Orders            | ~500     | Order Items     | ~1,500   |
| Payments          | ~400     | Refunds         | ~50      |
| Reviews           | ~500     | Addresses       | ~100     |
| Wishlists / Items | 20 / ~50 | Carts / Items   | 30 / ~80 |
| Coupons           | 10       | Shipments       | ~200     |
| Notifications     | ~500     | Follows         | ~150     |
| SavedPosts        | ~100     | PostViews       | ~5,000   |
| ProductImages     | ~300     | Subscriptions   | 65       |
| Discounts         | 130      | Conversations   | 30       |
| Messages          | ~500     | Invoices        | 500      |
| Return Requests   | ~50      | Support Tickets | 20       |
| Ticket Replies    | ~80      |                 |          |

---

## 🔔 Novu Workflow Management

The API includes a **built-in Novu Workflow Management** module for notification template design, payload validation, and subscriber management.

### ✨ Features

- 📋 **Workflow Metadata CRUD** — Create, update, archive, duplicate, and publish workflow configurations
- 📦 **Variable Registry** — Define reusable typed variables (`STRING`, `NUMBER`, `BOOLEAN`, `DATE`, `OBJECT`, `ARRAY`)
- 🛠️ **Payload Builder** — Auto-generate JSON Schema and sample payloads
- ✅ **Payload Validation** — Validate trigger payloads against variable definitions
- 🚀 **Trigger** — Send notification events via Novu SDK
- 👤 **Subscriber Management** — Identify, update, delete, and retrieve subscribers

### 📊 GraphQL Endpoints

| Query / Mutation                              | Description                            |
| --------------------------------------------- | -------------------------------------- |
| `novuWorkflows`                               | 📋 List all workflow metadata           |
| `novuWorkflow(id)`                            | 🔍 Get single workflow                  |
| `createNovuWorkflow`                          | ✨ Create workflow metadata             |
| `updateNovuWorkflow`                          | ✏️ Update workflow metadata             |
| `deleteNovuWorkflow`                          | 🗑️ Delete workflow metadata             |
| `archiveNovuWorkflow` / `publishNovuWorkflow` | 📦 Change workflow status               |
| `duplicateNovuWorkflow`                       | 📋 Duplicate a workflow                 |
| `novuVariableGroups`                          | 📂 List variable groups                 |
| `novuVariableGroup(id)`                       | 🔍 Get group with variables             |
| `createNovuVariableGroup`                     | ➕ Create variable group                |
| `createNovuVariable`                          | ➕ Create variable in a group           |
| `novuPayloadSchema(workflowId)`               | 📄 Get JSON Schema for workflow payload |
| `novuBuildPayload(workflowId)`                | 🏗️ Build sample payload                 |
| `novuValidatePayload`                         | ✅ Validate payload against definition  |
| `triggerNovuWorkflow`                         | 🚀 Trigger a workflow via Novu SDK      |
| `createNovuSubscriber`                        | 👤 Identify a subscriber in Novu        |

---

## 📡 API Endpoints

**Endpoint:** `POST http://localhost:4000/graphql`

**Sandbox (introspection):** `http://localhost:4000`

**Auth Header:**
```json
{
  "Authorization": "Bearer <jwt-token>"
}
```

📖 See the merged schema in [`schema.graphql`](./schema.graphql) for the complete API reference — **~100+ queries/mutations** across all domains.

---

## 🚀 How to Contribute & Improve

### Code Quality

| Area                        | What to do                                                                                  |
| --------------------------- | ------------------------------------------------------------------------------------------- |
| ✅ **Testing**               | Add Vitest/Jest. Unit-test services (mock Prisma). Integration-test resolvers with test DB. |
| ✅ **TypeScript strictness** | Remove `skipLibCheck`, enable `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`      |
| ✅ **Error handling**        | Standardize error codes. Add GraphQL error formatter in Apollo.                             |
| ✅ **Input validation**      | Add Zod or Joi schemas in `inputs.ts` before service calls.                                 |
| ✅ **Linting**               | Add ESLint with `@typescript-eslint` rules + Prettier for formatting.                       |

### Architecture

| Area                     | What to do                                                     |
| ------------------------ | -------------------------------------------------------------- |
| 🏗️ **DI / IoC**           | Use `tsyringe` to decouple service instantiation.              |
| 🗄️ **Repository pattern** | Abstract Prisma queries behind repository interfaces.          |
| 🔗 **GraphQL federation** | Consider Apollo Federation for microservices.                  |
| 🐳 **Dockerize**          | Add `Dockerfile` + `docker-compose.yml` for one-command setup. |

### Features

| Area                  | What to do                                                           |
| --------------------- | -------------------------------------------------------------------- |
| 📁 **File uploads**    | Add `graphql-upload` for product images / avatars (S3 or local).     |
| 🔍 **Search**          | Full-text search via PostgreSQL `tsvector` or Meilisearch/Typesense. |
| 📊 **Analytics**       | Event tracking (PostHog, Mixpanel) or materialized views.            |
| 🛡️ **Admin dashboard** | Admin-only queries for user management, content moderation, sales.   |
| 🔒 **Multi-tenancy**   | Organization/workspace support with row-level security.              |
| ⏱️ **Rate limiting**   | Query complexity analysis + rate limiting per user/IP.               |
| ⚡ **Caching**         | Apollo cache hints, Redis for session store, CDN for responses.      |

### DevOps

| Area             | What to do                                                          |
| ---------------- | ------------------------------------------------------------------- |
| 📝 **Logging**    | Ship logs to centralized service (Datadog, Grafana Loki).           |
| 📈 **Monitoring** | Prometheus metrics endpoint, Sentry for error tracking.             |
| 🚀 **Migrations** | Use `prisma migrate deploy` in CI/CD — never `migrate dev` in prod. |
| 🔐 **Secrets**    | Use Vault / AWS Secrets Manager instead of `.env` files.            |

### Novu

| Area                    | What to do                                                          |
| ----------------------- | ------------------------------------------------------------------- |
| 🔄 **Novu Framework**    | Upgrade to `@novu/framework` for TypeScript-based step definitions. |
| 🔁 **Workflow sync**     | Bidirectional sync between local metadata and Novu cloud workflows. |
| 👀 **Template preview**  | Email/SMS template rendering with test payload preview.             |
| 📬 **Delivery tracking** | Store transaction IDs and poll Novu for delivery status.            |
| 📱 **Multi-channel**     | Support in-app, email, SMS, and push notifications.                 |

---

## 📚 Learning Resources

### GraphQL

- [Apollo Server Docs](https://www.apollographql.com/docs/apollo-server/) — Official docs for Apollo Server 5
- [GraphQL Specification](https://spec.graphql.org/) — The official GraphQL spec
- [How to GraphQL](https://www.howtographql.com/) — Full-stack tutorial series
- [GraphQL Yoga](https://the-guild.dev/graphql/yoga-server) — Alternative server from The Guild

### Prisma

- [Prisma Docs](https://www.prisma.io/docs) — Official Prisma documentation
- [Prisma 7 Migration Guide](https://www.prisma.io/docs/orm/more/upgrade-guides/upgrading-versions/upgrading-to-prisma-7) — What changed in Prisma 7
- [Driver Adapters](https://www.prisma.io/docs/orm/overview/databases/database-drivers) — Native drivers with Prisma
- [Prisma Data Platform](https://www.prisma.io/data-platform) — Cloud tools for Prisma

### PostgreSQL

- [PostgreSQL Docs](https://www.postgresql.org/docs/) — Official documentation
- [PG Exercises](https://pgexercises.com/) — Interactive SQL practice
- [Use the Index, Luke](https://use-the-index-luke.com/) — Deep dive into SQL indexing

### TypeScript

- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/) — Official TS handbook
- [Type Challenges](https://github.com/type-challenges/type-challenges) — Advanced type exercises
- [Total TypeScript](https://www.totaltypescript.com/) — Free TS tutorials and courses

### Novu

- [Novu Docs](https://docs.novu.co/) — Official Novu documentation
- [Novu Framework](https://docs.novu.co/framework/quickstart) — TypeScript step definitions

### Project-Specific

- 📖 **Explore the merged schema:** [`schema.graphql`](./schema.graphql) — all queries, mutations, types, and fragments
- 🗄️ **Browse the Prisma schema:** [`prisma/schema.prisma`](./prisma/schema.prisma) — all models, relations, and indexes
- 🌱 **Read the seed orchestrator:** [`prisma/seed/index.ts`](./prisma/seed/index.ts) — understand the 8-phase seed flow
- 🔍 **Study a module end-to-end:** Pick a domain (e.g. `src/modules/novu/`) and read `inputs.ts` → `resolver.ts` → `service.ts`

---

## 📄 License

MIT — feel free to use, modify, and distribute!

---

<div align="center">

**Built with ❤️ by the Nomad-x**

⭐ **Star this repo** if you find it useful!

</div>
