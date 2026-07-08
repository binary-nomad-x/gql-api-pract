# GraphQL Prisma API

A full-featured **GraphQL API** combining a **blog platform** and **e-commerce system**, built with Apollo Server 5, Prisma 7, and PostgreSQL.

**~90,000+ seed records** across **34 database models** — designed as a learning sandbox / starter for production-grade GraphQL APIs.

---

## Table of Contents

- [Architecture](#architecture)
- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Scripts](#scripts)
- [Seed Data](#seed-data)
- [Test Accounts](#test-accounts)
- [API](#api)
- [Enums](#enums)
- [Project Structure](#project-structure)
- [TODO](#todo)
- [How to Improve This Project](#how-to-improve-this-project)
- [Learning Resources](#learning-resources)

---

## Architecture

```
src/
  index.ts             HTTP server + Apollo Server bootstrap
  context.ts           Context factory (Prisma client + JWT auth)
  plugins/graphiql.ts  Custom GraphiQL sandbox landing page
  schema/              GraphQL SDL files (18 files, domain-split)
  modules/<domain>/    resolver.ts → service.ts → Prisma
  utils/               Auth, errors, logger, Novu, clean
  types/               Shared TypeScript types

prisma/
  schema.prisma        34 models, 8 enums
  seed/                26 seed files, 8 orchestrated phases

scripts/
  merge-schema.ts      Concatenates all .graphql files → schema.graphql
```

### Key Decisions

| Decision                    | Detail                                                                |
| --------------------------- | --------------------------------------------------------------------- |
| **Schema-first**            | GraphQL schema in `.graphql` files per domain, merged at runtime      |
| **`@auth` directive**       | Protects mutations/queries; JWT extracted from `Authorization` header |
| **Thin resolvers**          | Business logic pushed to service layer                                |
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
  login(email: "alice@test.com", password: "password123") {
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

| Email            | Role      | Password      |
| ---------------- | --------- | ------------- |
| alice@test.com   | ADMIN     | `password123` |
| bob@test.com     | USER      | `password123` |
| charlie@test.com | USER      | `password123` |
| diana@test.com   | MODERATOR | `password123` |
| eve@test.com     | USER      | `password123` |

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

| Table             | Records    | Table           | Records    |
| ----------------- | ---------- | --------------- | ---------- |
| Users             | 500        | Profiles        | 500        |
| Categories        | 15         | Tags            | 20         |
| Posts             | 500        | Comments        | 2,000      |
| Likes             | ~3,000     | Products        | 5,000      |
| Orders            | 5,000      | Order Items     | ~15,000    |
| Payments          | ~4,000     | Refunds         | ~200       |
| Reviews           | ~2,500     | Addresses       | ~1,000     |
| Wishlists / Items | 100 / ~300 | Carts / Items   | 150 / ~400 |
| Coupons           | 11         | Shipments       | ~500       |
| Notifications     | ~3,500     | Follows         | 500        |
| SavedPosts        | 500        | PostViews       | ~20,000    |
| ProductImages     | ~12,000    | Subscriptions   | 500        |
| Discounts         | 1,000      | Conversations   | 500        |
| Messages          | ~20,000    | Invoices        | 5,000      |
| Return Requests   | ~300       | Support Tickets | 100        |
| Ticket Replies    | ~400       |                 |            |

---

## API

**Endpoint:** `POST http://localhost:4000/`

**Sandbox (introspection):** `http://localhost:4000`

**Auth header:**

```json
{ "Authorization": "Bearer <jwt-token>" }
```

See the merged schema in [`schema.graphql`](./schema.graphql) for the complete API reference — ~90+ queries/mutations across all domains.

---

## Enums

| Enum                 | Values                                                                                                                                                                                                |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Role`               | `USER`, `ADMIN`, `MODERATOR`                                                                                                                                                                          |
| `OrderStatus`        | `PENDING`, `CONFIRMED`, `PROCESSING`, `SHIPPED`, `DELIVERED`, `CANCELLED`                                                                                                                             |
| `PaymentMethod`      | `CREDIT_CARD`, `DEBIT_CARD`, `PAYPAL`, `BANK_TRANSFER`, `CASH_ON_DELIVERY`                                                                                                                            |
| `PaymentStatus`      | `PENDING`, `COMPLETED`, `FAILED`, `REFUNDED`                                                                                                                                                          |
| `RefundStatus`       | `PENDING`, `APPROVED`, `REJECTED`, `COMPLETED`                                                                                                                                                        |
| `ShipmentStatus`     | `PENDING`, `PICKED_UP`, `IN_TRANSIT`, `OUT_FOR_DELIVERY`, `DELIVERED`, `FAILED`                                                                                                                       |
| `NotificationType`   | `SYSTEM`, `ORDER_UPDATE`, `PAYMENT_RECEIVED`, `SHIPMENT_UPDATE`, `NEW_FOLLOWER`, `NEW_COMMENT`, `NEW_LIKE`, `REVIEW_REPLY`, `PROMOTION`, `NEW_MESSAGE`, `SUBSCRIPTION_EXPIRING`, `DISCOUNT_AVAILABLE` |
| `SubscriptionPlan`   | `FREE`, `BASIC`, `PREMIUM`, `ENTERPRISE`                                                                                                                                                              |
| `SubscriptionStatus` | `ACTIVE`, `CANCELLED`, `PAST_DUE`, `EXPIRED`                                                                                                                                                          |
| `DiscountType`       | `PERCENTAGE`, `FIXED_AMOUNT`                                                                                                                                                                          |
| `InvoiceStatus`      | `PENDING`, `PAID`, `OVERDUE`, `CANCELLED`, `REFUNDED`                                                                                                                                                 |
| `ReturnReason`       | `DEFECTIVE`, `WRONG_ITEM`, `NOT_AS_DESCRIBED`, `SIZE_ISSUE`, `LATE_DELIVERY`, `NO_LONGER_NEEDED`, `OTHER`                                                                                             |
| `ReturnStatus`       | `PENDING`, `APPROVED`, `REJECTED`, `ITEM_RECEIVED`, `REFUND_ISSUED`, `CLOSED`                                                                                                                         |
| `TicketStatus`       | `OPEN`, `IN_PROGRESS`, `WAITING_ON_CUSTOMER`, `RESOLVED`, `CLOSED`                                                                                                                                    |
| `TicketPriority`     | `LOW`, `MEDIUM`, `HIGH`, `URGENT`                                                                                                                                                                     |

---

## Project Structure

```
.
├── prisma/
│   ├── schema.prisma          # 34 models, 8 enums
│   ├── seed/                  # 26 seed files in 8 phases
│   └── migrations/            # Created by prisma migrate dev
│
├── src/
│   ├── index.ts               # Server entry point
│   ├── context.ts             # Prisma + JWT context factory
│   ├── plugins/
│   │   └── graphiql.ts        # Custom GraphiQL landing page
│   ├── schema/                # 18 .graphql SDL files
│   │   ├── base.graphql       # Scalars, directives, enums, stubs
│   │   ├── auth.graphql       # Auth types + mutations
│   │   ├── post.graphql       # Blog types + queries/mutations
│   │   ├── product.graphql    # Product + review types
│   │   ├── order.graphql      # Order, payment, refund, shipment
│   │   ├── cart.graphql       # Cart + cart items
│   │   ├── user.graphql       # User + profile
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
│   ├── types/                 # Shared TS types
│   │   ├── context.ts
│   │   ├── enums.ts
│   │   └── graphql.ts
│   ├── utils/                 # Shared utilities
│   │   ├── auth.ts            # JWT + bcrypt
│   │   ├── clean.ts           # Prisma-safe object cleaners
│   │   ├── errors.ts          # Custom error classes
│   │   ├── logger.ts          # Structured logger
│   │   └── novu.ts            # Novu notification triggers
│   └── modules/               # Domain modules (26 domains)
│       ├── index.ts           # Central resolver aggregation
│       ├── auth/              # resolver.ts, service.ts, inputs.ts
│       ├── blog/
│       ├── product/
│       ├── order/
│       ├── ...                # (all other domains)
│       └── user/
│
├── scripts/
│   └── merge-schema.ts        # SDL merger
├── schema.graphql             # Merged schema output
├── prisma.config.ts           # Prisma 7 config
├── tsconfig.json
├── package.json
└── .env.example
```

Each domain module follows the same pattern: `inputs.ts` → `resolver.ts` → `service.ts` (+ optional `types/index.ts`).

---

## TODO

### Short-term

- [ ] **Generate initial Prisma migration** — Run `npx prisma migrate dev --name init` to create `prisma/migrations/` so `db:rebuild` works correctly
- [ ] **Enable offline GraphQL sandbox** — Currently Apollo sandbox uses CDN scripts; bundle GraphiQL locally or use a local asset for offline dev
- [ ] **Add schema/model change workflow** — Document or script the process of adding/removing columns without migrations (using `prisma db push`)

### Medium-term

- [ ] **Make Novu notifications work** — Implement the new code-level workflow approach (Novu's `@novu/framework` with TypeScript step definitions)
- [ ] **Reusable src exports in seed** — Extract shared utilities (auth helpers, type constants) from `src/` so `prisma/seed/` can import them without duplication
- [ ] **Add more auth helpers** — Password reset flow, email verification, refresh tokens, rate limiting on login
- [ ] **Improve test data realism** — Use Mockaroo or more sophisticated faker patterns for production-like data distributions
- [ ] **Add tests** — Unit tests for services, integration tests for resolvers, e2e tests for critical flows

### Long-term

- [ ] **Database-level features** — Materialized views (reporting dashboards), stored procedures (complex aggregations), triggers (audit logging), functions (custom business logic)
- [ ] **Payment integration** — Stripe, PayPal, Apple Pay, local methods (JazzCash, etc.)
- [ ] **MCP (Model Context Protocol) integration** — Add MCP server for AI-assisted tooling and pgsql MCP for database interaction
- [ ] **GraphQL subscriptions** — Real-time notifications, live order tracking, chat via WebSocket
- [ ] **Performance optimization** — DataLoader for N+1 prevention, Redis caching, query complexity analysis, pagination depth limits
- [ ] **CI/CD pipeline** — GitHub Actions for linting, type-checking, test running, and deployment

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

### Advanced Topics

| Topic                  | Resource                                                                                                           |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------ |
| **GraphQL Federation** | [Apollo Federation docs](https://www.apollographql.com/docs/federation/)                                           |
| **DataLoader**         | [GraphQL N+1 problem & DataLoader](https://www.apollographql.com/docs/apollo-server/data/data-sources/#dataloader) |
| **Docker + Node**      | [Node.js Docker best practices](https://github.com/nodejs/docker-node/blob/main/docs/BestPractices.md)             |
| **CI/CD**              | [GitHub Actions docs](https://docs.github.com/en/actions)                                                          |
| **Stripe integration** | [Stripe API docs](https://stripe.com/docs/api)                                                                     |
| **Novu notifications** | [Novu framework docs](https://docs.novu.co/)                                                                       |
| **MCP**                | [Model Context Protocol](https://modelcontextprotocol.io/)                                                         |
| **Row-level security** | [PostgreSQL RLS docs](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)                                |

### Project-specific

- **Explore the merged schema**: [`schema.graphql`](./schema.graphql) — all queries, mutations, types, and fragments in one file
- **Browse the Prisma schema**: [`prisma/schema.prisma`](./prisma/schema.prisma) — all models, relations, and indexes
- **Read the seed orchestrator**: [`prisma/seed/index.ts`](./prisma/seed/index.ts) — understand the 8-phase seed flow
- **Study a module end-to-end**: Pick a domain (e.g. `src/modules/product/`) and read `inputs.ts` → `resolver.ts` → `service.ts` to see the pattern
