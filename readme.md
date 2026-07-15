# GraphQL Prisma API

A full-featured **GraphQL API** combining a **blog platform**, **e-commerce system**, and **Novu notification workflow management**, built with Apollo Server 5, Prisma 7, and PostgreSQL.

**~90,000+ seed records** across **38 database models** — designed as a learning sandbox / starter for production-grade GraphQL APIs.

---

## Table of Contents

- [GraphQL Prisma API](#graphql-prisma-api)
  - [Table of Contents](#table-of-contents)
  - [Architecture](#architecture)
    - [Key Decisions](#key-decisions)
  - [Prerequisites](#prerequisites)
  - [Quick Start](#quick-start)
    - [1. Install dependencies](#1-install-dependencies)
    - [2. Configure environment](#2-configure-environment)
    - [3. Setup database](#3-setup-database)
    - [4. Start the server](#4-start-the-server)
    - [5. Login](#5-login)
  - [Test Accounts](#test-accounts)
  - [Scripts](#scripts)
  - [Seed Data](#seed-data)
  - [Novu Workflow Management](#novu-workflow-management)
    - [Features](#features)
    - [GraphQL Endpoints](#graphql-endpoints)
  - [API](#api)
  - [Project Structure](#project-structure)
  - [How to Improve This Project](#how-to-improve-this-project)
    - [Code Quality](#code-quality)
    - [Architecture](#architecture-1)
    - [Features](#features-1)
    - [DevOps](#devops)
    - [Novu](#novu)
  - [Learning Resources](#learning-resources)
    - [GraphQL](#graphql)
    - [Prisma](#prisma)
    - [PostgreSQL](#postgresql)
    - [TypeScript](#typescript)
    - [Novu](#novu-1)
    - [Project-specific](#project-specific)

---

## Architecture

```
src/
  index.ts             HTTP server + Apollo Server bootstrap
  context.ts           Context factory (Prisma + Services container)
  plugins/graphiql.ts  Custom GraphiQL sandbox landing page
  schema/              GraphQL SDL files (19 files, domain-split)
  lib/
    Services.ts        Central DI container — instantiates all services
    core.ts            Shared helpers: clean(), compact(), Prisma types
  modules/<domain>/    resolver.ts → service.ts → Prisma
  utils/               Auth, errors, logger, Novu client
  types/               Shared TypeScript types

prisma/
  schema.prisma        38 models
  data/                Reusable fixed seed data (users, tags, coupons, categories)
  seed/                30 seed files, 8 orchestrated phases
  migrations/          38 migration files

scripts/
  merge-schema.ts      Concatenates all .graphql files → schema.graphql
```

### Key Decisions

| Decision                    | Detail                                                                |
| --------------------------- | --------------------------------------------------------------------- |
| **Schema-first**            | GraphQL schema in `.graphql` files per domain, merged at runtime      |
| **`@auth` directive**       | Protects mutations/queries; JWT extracted from `Authorization` header |
| **Thin resolvers**          | Business logic pushed to service layer                                |
| **Services container**      | All services instantiated once in `Services` class, injected via ctx  |
| **Constructor injection**   | Each service receives `core: PrismaClient` directly (no BaseService)  |
| **Prisma 7 driver adapter** | Uses `@prisma/adapter-pg` with raw `pg` driver                        |
| **Manual HTTP**             | No Express; raw `http.createServer()` with manual CORS + body parsing |
| **No subscriptions**        | GraphQL subscriptions not yet implemented                             |

---

## Prerequisites

- **Node.js** 18+
- **PostgreSQL** 15+ (running locally or remotely)
- **npm** 9+

---

## Quick Start

### 1. Install dependencies

```bash
git clone <repo-url>
cd graphql-prisma-api
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

| Variable              | Description                           | Required |
| --------------------- | ------------------------------------- | -------- |
| `DATABASE_URL`        | PostgreSQL connection string          | Yes      |
| `PORT`                | Server port (default `4000`)          | No       |
| `JWT_SECRET`          | Secret for signing JWT tokens         | Yes      |
| `NOVU_API_SECRET_KEY` | Novu API key (optional notifications) | No       |

### 3. Setup database

```bash
npm run setup
```

This runs: `npm install` → `prisma generate` → `prisma migrate dev` → `npm run seed`.

Or step by step:

```bash
npm run generate        # Generate Prisma client
npm run migrate:dev     # Apply migrations (creates initial migration if needed)
npm run seed            # Seed 90,000+ records
```

### 4. Start the server

```bash
npm run dev
```

Open **http://localhost:4000** in your browser for the GraphQL sandbox.

### 5. Login

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

Seed accounts below.

---

## Test Accounts

| Email                | Role      | Password      |
| -------------------- | --------- | ------------- |
| `admin@test.com`     | ADMIN     | `password123` |
| `admin2@test.com`    | ADMIN     | `password123` |
| `moderator@test.com` | MODERATOR | `password123` |
| `manager@test.com`   | MANAGER   | `password123` |
| `seller@test.com`    | SELLER    | `password123` |
| `customer@test.com`  | USER      | `password123` |

---

## Scripts

| Command                | Description                                                        |
| ---------------------- | ------------------------------------------------------------------ |
| `npm run dev`          | Start dev server with hot-reload (`tsx watch`)                     |
| `npm run build`        | Compile TypeScript to `dist/`                                      |
| `npm run start`        | Run compiled server from `dist/`                                   |
| `npm run generate`     | Regenerate Prisma client from schema                               |
| `npm run migrate:dev`  | Create / apply Prisma migrations                                   |
| `npm run db:reset`     | Drop and re-apply all migrations                                   |
| `npm run db:rebuild`   | Full reset: drop tables → migrate → seed → generate → merge schema |
| `npm run seed`         | Seed sample data                                                   |
| `npm run seed:fresh`   | Reset database then re-seed                                        |
| `npm run seed:reset`   | Delete all data (no seed)                                          |
| `npm run studio`       | Open Prisma Studio (GUI database browser)                          |
| `npm run schema:merge` | Merge all `.graphql` files into `schema.graphql`                   |

---

## Seed Data

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

## Novu Workflow Management

The API includes a built-in **Novu Workflow Management** module for notification template design, payload validation, and subscriber management.

### Features

- **Workflow Metadata CRUD** — Create, update, archive, duplicate, and publish workflow configurations stored in the local database
- **Variable Registry** — Define reusable typed variables (`STRING`, `NUMBER`, `BOOLEAN`, `DATE`, `OBJECT`, `ARRAY`) organized in groups
- **Payload Builder** — Auto-generate JSON Schema and sample payloads from registered variables
- **Payload Validation** — Validate trigger payloads against variable definitions (required fields, type matching, null checks)
- **Trigger** — Send notification events via the Novu SDK with built-in payload validation
- **Subscriber Management** — Identify, update, delete, and retrieve subscribers from Novu

### GraphQL Endpoints

| Query / Mutation                              | Description                          |
| --------------------------------------------- | ------------------------------------ |
| `novuWorkflows`                               | List all workflow metadata           |
| `novuWorkflow(id)`                            | Get single workflow                  |
| `createNovuWorkflow`                          | Create workflow metadata             |
| `updateNovuWorkflow`                          | Update workflow metadata             |
| `deleteNovuWorkflow`                          | Delete workflow metadata             |
| `archiveNovuWorkflow` / `publishNovuWorkflow` | Change workflow status               |
| `duplicateNovuWorkflow`                       | Duplicate a workflow                 |
| `novuVariableGroups`                          | List variable groups                 |
| `novuVariableGroup(id)`                       | Get group with variables             |
| `createNovuVariableGroup`                     | Create variable group                |
| `createNovuVariable`                          | Create variable in a group           |
| `novuPayloadSchema(workflowId)`               | Get JSON Schema for workflow payload |
| `novuBuildPayload(workflowId)`                | Build sample payload                 |
| `novuValidatePayload`                         | Validate payload against definition  |
| `triggerNovuWorkflow`                         | Trigger a workflow via Novu SDK      |
| `createNovuSubscriber`                        | Identify a subscriber in Novu        |

---

## API

**Endpoint:** `POST http://localhost:4000/graphql`

**Sandbox (introspection):** `http://localhost:4000`

**Auth header:**

```json
{ "Authorization": "Bearer <jwt-token>" }
```

See the merged schema in [`schema.graphql`](./schema.graphql) for the complete API reference — ~100+ queries/mutations across all domains.

---

## Project Structure

```
.
├── prisma/
│   ├── schema.prisma          # 38 models
│   ├── data/                  # Reusable fixed seed data
│   │   ├── users.ts
│   │   ├── tags.ts
│   │   ├── coupons.ts
│   │   └── categories.ts
│   ├── seed/                  # 30 files in 8 phases
│   │   ├── index.ts           # Seed orchestrator
│   │   ├── types.ts           # Typed seed DTOs
│   │   ├── utils.ts           # Reset + timer utilities
│   │   ├── seed-users.ts
│   │   ├── seed-posts.ts
│   │   ├── seed-products.ts
│   │   └── ...                # (all other seed files)
│   └── migrations/            # 38 migration files
│
├── src/
│   ├── index.ts               # Server entry point
│   ├── context.ts             # Prisma + Services context factory
│   ├── plugins/
│   │   └── graphiql.ts        # Custom GraphiQL landing page
│   ├── schema/                # 19 .graphql SDL files
│   │   ├── base.graphql       # Scalars, directives, stubs
│   │   ├── auth.graphql
│   │   ├── post.graphql
│   │   ├── product.graphql
│   │   ├── order.graphql
│   │   ├── cart.graphql
│   │   ├── user.graphql
│   │   ├── novu.graphql       # Novu workflow management
│   │   ├── address.graphql
│   │   ├── conversation.graphql
│   │   ├── coupon.graphql
│   │   ├── discount.graphql
│   │   ├── follow.graphql
│   │   ├── invoice.graphql
│   │   ├── notification.graphql
│   │   ├── promotions.graphql
│   │   ├── return.graphql
│   │   ├── stats.graphql
│   │   ├── subscription.graphql
│   │   ├── support.graphql
│   │   └── wishlist.graphql
│   ├── lib/
│   │   ├── Services.ts        # DI container — service instantiation
│   │   ├── core.ts            # Shared helpers (clean, compact, Prisma types)
│   │   └── redis.ts           # Redis client (BullMQ)
│   ├── types/                 # Shared TS types
│   │   ├── context.ts
│   │   ├── enums.ts
│   │   └── graphql.ts
│   ├── utils/
│   │   ├── auth.ts            # JWT + bcrypt
│   │   ├── errors.ts          # AppError, NotFoundError, requireAuth
│   │   ├── logger.ts          # Structured logger (pino)
│   │   └── novu.ts            # Novu SDK client init
│   └── modules/               # 26 domain modules
│       ├── index.ts           # Central resolver aggregation
│       ├── auth/              # resolver.ts, service.ts, inputs.ts
│       ├── blog/
│       ├── product/
│       ├── order/
│       ├── novu/              # Novu workflow + variable registry
│       ├── ...                # (all other domains)
│       └── user/
│
├── scripts/
│   └── merge-schema.ts        # SDL merger
├── schema.graphql             # Merged schema output (auto-generated)
├── prisma.config.ts           # Prisma 7 driver adapter config
├── tsconfig.json
├── package.json
└── .env.example
```

Each domain module follows the same pattern: `resolver.ts` → `service.ts` (+ `inputs.ts` for typed arguments).

---

## How to Improve This Project

### Code Quality

| Area                      | What to do                                                                                                                                                                    |
| ------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Testing**               | Add Vitest / Jest. Unit-test services in isolation (mock Prisma). Integration-test resolvers with a test DB. E2E-test key flows (signup → login → create post → place order). |
| **TypeScript strictness** | Remove `skipLibCheck`, enable `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`. Add proper branded types for IDs.                                                     |
| **Error handling**        | Standardize error codes. Add a GraphQL error formatter in Apollo. Log errors with structured metadata.                                                                        |
| **Input validation**      | Add Zod or joi schemas in `inputs.ts` to validate before service calls.                                                                                                       |
| **Linting**               | Add ESLint with `@typescript-eslint` rules. Add Prettier for consistent formatting.                                                                                           |

### Architecture

| Area                         | What to do                                                                                         |
| ---------------------------- | -------------------------------------------------------------------------------------------------- |
| **DI / IoC**                 | Introduce a simple DI container or use `tsyringe` to decouple service instantiation.               |
| **Repository pattern**       | Abstract Prisma queries behind repository interfaces for testability.                              |
| **GraphQL schema stitching** | If this grows beyond a monolith, consider Apollo Federation or schema stitching for microservices. |
| **Dockerize**                | Add `Dockerfile` + `docker-compose.yml` with PostgreSQL + the API for one-command setup.           |

### Features

| Area                | What to do                                                                                  |
| ------------------- | ------------------------------------------------------------------------------------------- |
| **File uploads**    | Add `graphql-upload` for product images / avatars, stored on S3 or local disk.              |
| **Search**          | Integrate full-text search via PostgreSQL `tsvector` or use Meilisearch / Typesense.        |
| **Analytics**       | Add event tracking (PostHog, Mixpanel) or build in-app analytics using materialized views.  |
| **Admin dashboard** | Expose admin-only queries/mutations for user management, content moderation, sales reports. |
| **Multi-tenancy**   | Add organization/workspace support with row-level security in PostgreSQL.                   |
| **Rate limiting**   | Implement GraphQL query complexity analysis + rate limiting per user/IP.                    |
| **Caching**         | Use Apollo cache hints, Redis for session store, CDN for GraphQL responses.                 |

### DevOps

| Area           | What to do                                                                          |
| -------------- | ----------------------------------------------------------------------------------- |
| **Logging**    | Ship logs to a centralized service (Datadog, Grafana Loki, Logtail).                |
| **Monitoring** | Add Prometheus metrics endpoint, Sentry for error tracking.                         |
| **Migrations** | Use `prisma migrate deploy` in CI/CD; never run `prisma migrate dev` in production. |
| **Secrets**    | Use a secrets manager (Vault, AWS Secrets Manager) instead of `.env` files.         |

### Novu

| Area                        | What to do                                                                                    |
| --------------------------- | --------------------------------------------------------------------------------------------- |
| **Novu Framework**          | Upgrade to `@novu/framework` for TypeScript-based step definitions instead of the legacy SDK. |
| **Workflow sync**           | Implement bidirectional sync between local metadata and Novu cloud workflows.                 |
| **Template preview**        | Add email/SMS template rendering with test payload preview.                                   |
| **Delivery tracking**       | Store trigger transaction IDs and poll Novu for delivery status updates.                      |
| **Multi-channel templates** | Support in-app, email, SMS, and push notification templates per workflow.                     |

---

## Learning Resources

### GraphQL

| Resource                                                                | Description                         |
| ----------------------------------------------------------------------- | ----------------------------------- |
| [Apollo Server docs](https://www.apollographql.com/docs/apollo-server/) | Official docs for Apollo Server 5   |
| [GraphQL spec](https://spec.graphql.org/)                               | The official GraphQL specification  |
| [How to GraphQL](https://www.howtographql.com/)                         | Full-stack tutorial series          |
| [GraphQL Yoga](https://the-guild.dev/graphql/yoga-server)               | Alternative server (from The Guild) |

### Prisma

| Resource                                                                                                                | Description                      |
| ----------------------------------------------------------------------------------------------------------------------- | -------------------------------- |
| [Prisma docs](https://www.prisma.io/docs)                                                                               | Official Prisma documentation    |
| [Prisma 7 migration guide](https://www.prisma.io/docs/orm/more/upgrade-guides/upgrading-versions/upgrading-to-prisma-7) | What changed in Prisma 7         |
| [Driver adapters](https://www.prisma.io/docs/orm/overview/databases/database-drivers)                                   | Using Prisma with native drivers |
| [Prisma Data Platform](https://www.prisma.io/data-platform)                                                             | Cloud tools for Prisma           |

### PostgreSQL

| Resource                                               | Description                 |
| ------------------------------------------------------ | --------------------------- |
| [PostgreSQL docs](https://www.postgresql.org/docs/)    | Official documentation      |
| [PG Exercises](https://pgexercises.com/)               | Interactive SQL practice    |
| [Use the Index, Luke](https://use-the-index-luke.com/) | Deep dive into SQL indexing |

### TypeScript

| Resource                                                                    | Description                   |
| --------------------------------------------------------------------------- | ----------------------------- |
| [TypeScript handbook](https://www.typescriptlang.org/docs/handbook/)        | Official TS handbook          |
| [TypeScript challenges](https://github.com/type-challenges/type-challenges) | Advanced type exercises       |
| [Total TypeScript](https://www.totaltypescript.com/)                        | Free TS tutorials and courses |

### Novu

| Resource                                                    | Description                 |
| ----------------------------------------------------------- | --------------------------- |
| [Novu docs](https://docs.novu.co/)                          | Official Novu documentation |
| [Novu Framework](https://docs.novu.co/framework/quickstart) | TypeScript step definitions |

### Project-specific

- **Explore the merged schema**: [`schema.graphql`](./schema.graphql) — all queries, mutations, types, and fragments in one file
- **Browse the Prisma schema**: [`prisma/schema.prisma`](./prisma/schema.prisma) — all models, relations, and indexes
- **Read the seed orchestrator**: [`prisma/seed/index.ts`](./prisma/seed/index.ts) — understand the 8-phase seed flow
- **Study a module end-to-end**: Pick a domain (e.g. `src/modules/novu/`) and read `inputs.ts` → `resolver.ts` → `service.ts` to see the pattern
