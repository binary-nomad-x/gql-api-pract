# 🎯 OmniGraph API — Complete GitHub Issues Roadmap

Here's a **production-grade issue breakdown** organized by milestones, labels, priorities, and dependencies. Copy-paste directly into GitHub.

---

## 🏷️ Labels to Create First

Go to **Settings → Labels** and create these:

### Priority Labels

| Label                | Color     | Description                    |
| -------------------- | --------- | ------------------------------ |
| `priority: critical` | `#B60205` | Blocks everything, must do now |
| `priority: high`     | `#D93F0B` | Do this sprint                 |
| `priority: medium`   | `#FBCA04` | Next sprint                    |
| `priority: low`      | `#0E8A16` | Backlog                        |

### Type Labels

| Label            | Color     | Description             |
| ---------------- | --------- | ----------------------- |
| `type: feature`  | `#1D76DB` | New capability          |
| `type: perf`     | `#5319E7` | Performance improvement |
| `type: refactor` | `#C5DEF5` | Code quality            |
| `type: bug`      | `#B60205` | Something is broken     |
| `type: docs`     | `#0075CA` | Documentation           |
| `type: test`     | `#F9D0C4` | Testing                 |
| `type: chore`    | `#EDEDED` | Maintenance             |
| `type: security` | `#D4C5F9` | Security                |

### Area Labels

| Label                 | Color     |
| --------------------- | --------- |
| `area: graphql`       | `#E99695` |
| `area: prisma`        | `#BFD4F2` |
| `area: database`      | `#F9D0C4` |
| `area: redis`         | `#DC382D` |
| `area: queues`        | `#FFA500` |
| `area: auth`          | `#7057FF` |
| `area: observability` | `#00BFFF` |
| `area: devops`        | `#B60205` |
| `area: testing`       | `#0E8A16` |
| `area: novu`          | `#FF6B6B` |
| `area: security`      | `#8B0000` |

### Difficulty Labels (effort estimation)

| Label      | Color     | Description |
| ---------- | --------- | ----------- |
| `size: XS` | `#C2E0C6` | < 1 hour    |
| `size: S`  | `#B4D8B4` | Half day    |
| `size: M`  | `#A8D8A8` | 1 day       |
| `size: L`  | `#9CD49C` | 2–3 days    |
| `size: XL` | `#90D090` | 1 week+     |

### Status Labels

| Label              | Color     |
| ------------------ | --------- |
| `good first issue` | `#7057FF` |
| `help wanted`      | `#008672` |
| `blocked`          | `#E11D21` |
| `needs discussion` | `#D4C5F9` |

---

## 🏁 Milestones

Create these 9 milestones in **Issues → Milestones**:

| #   | Milestone                                   | Description                               | Target     |
| --- | ------------------------------------------- | ----------------------------------------- | ---------- |
| 1   | **Phase 1: Performance & Data Correctness** | Fix N+1, indexing, query plans            | Week 1–2   |
| 2   | **Phase 2: Caching & Background Work**      | Redis, BullMQ, cache invalidation         | Week 3–4   |
| 3   | **Phase 3: Scale & Resilience**             | Pooling, rate limiting, graceful shutdown | Week 5–6   |
| 4   | **Phase 4: Observability**                  | Logging, tracing, metrics, alerts         | Week 7–8   |
| 5   | **Phase 5: Database Engineering**           | Partitioning, materialized views, backups | Week 9–10  |
| 6   | **Phase 6: Testing & Quality**              | Vitest, Testcontainers, k6, chaos         | Week 11–12 |
| 7   | **Phase 7: Security & Multi-Tenancy**       | Zod, RLS, refresh tokens, audit logs      | Week 13–14 |
| 8   | **Phase 8: DevOps & Delivery**              | Docker, CI/CD, blue/green                 | Week 15–16 |
| 9   | **Phase 9: Product & Platform**             | Uploads, webhooks, search, i18n           | Week 17+   |

---

## 📋 Phase 1 — Performance & Data Correctness

### Issue #1: Add DataLoader for `post.author` and `post.comments`

```markdown
## 🎯 Goal

Eliminate N+1 queries when resolving `post.author` and `post.comments` in list queries.

## 📖 Why

When fetching 100 posts, each `post.author` currently triggers a separate DB query — resulting in 100+ queries per request. DataLoader batches these into 1 query.

## ✅ Tasks

- [ ] Install `dataloader` package
- [ ] Create `src/loaders/authorLoader.ts` with batch function
- [ ] Create `src/loaders/commentLoader.ts` with batch function
- [ ] Wire loaders into Apollo context (per-request)
- [ ] Update `Post.author` resolver to use `context.loaders.author.load(id)`
- [ ] Update `Post.comments` resolver to use `context.loaders.comments.load(id)`

## 🧪 Verification

- [ ] Enable Prisma query logging
- [ ] Fire a `posts(limit: 100)` query
- [ ] Count queries before/after — should drop from ~200 to ~3

## 📚 Resources

- [DataLoader GitHub](https://github.com/graphql/dataloader)
- [Apollo DataLoader Guide](https://www.apollographql.com/docs/apollo-server/data/data-sources/#dataloader)

**Labels:** `type: perf`, `area: graphql`, `priority: critical`, `size: M`
**Milestone:** Phase 1: Performance & Data Correctness
```

---

### Issue #2: Add missing composite indexes on hot query paths

```markdown
## 🎯 Goal

Add indexes to eliminate sequential scans on frequently queried columns.

## 📖 Why

`orders(status, created_at)` and `posts(user_id, created_at)` are filtered constantly but lack composite indexes → table scans on large tables.

## ✅ Tasks

- [ ] Audit slow queries via `EXPLAIN ANALYZE` on:
  - `orders(status, created_at)`
  - `posts(user_id, created_at)`
  - `products(category_id, is_active)`
  - `notifications(user_id, is_read, created_at)`
- [ ] Create migration adding composite indexes
- [ ] Re-run `EXPLAIN` to verify `Index Scan` replaces `Seq Scan`
- [ ] Document benchmark before/after in issue

## 🧪 Verification

- [ ] Query latency drops by >50%
- [ ] `pg_stat_user_indexes` shows hits

**Labels:** `type: perf`, `area: database`, `priority: critical`, `size: S`
**Milestone:** Phase 1: Performance & Data Correctness
```

---

### Issue #3: Add PostgreSQL full-text search for posts and products

```markdown
## 🎯 Goal

Replace `LIKE '%term%'` with PostgreSQL `tsvector` + GIN indexes.

## 📖 Why

`LIKE` cannot use indexes and is O(n). Full-text search is sub-100ms on millions of rows.

## ✅ Tasks

- [ ] Add `search_vector tsvector` column to `Post` and `Product`
- [ ] Create GIN indexes on both
- [ ] Add trigger to auto-update `search_vector` on insert/update
- [ ] Add GraphQL queries: `searchPosts(query: String!)` and `searchProducts(query: String!)`
- [ ] Rank results with `ts_rank`
- [ ] Support phrase search and prefix matching (`websearch_to_tsquery`)

## 🧪 Verification

- [ ] Search 100k posts in < 100ms
- [ ] Benchmark vs. old `LIKE` implementation

## 📚 Resources

- [PostgreSQL Full-Text Search](https://www.postgresql.org/docs/current/textsearch.html)

**Labels:** `type: feature`, `area: database`, `priority: high`, `size: M`
**Milestone:** Phase 1: Performance & Data Correctness
```

---

### Issue #4: Add `npm run db:explain` script to profile slow queries

```markdown
## 🎯 Goal

Automate slow query discovery.

## ✅ Tasks

- [ ] Create `scripts/db-explain.ts`
- [ ] Enable `pg_stat_statements` extension
- [ ] Query top-20 slowest queries by total time
- [ ] Print `EXPLAIN ANALYZE` output for each
- [ ] Add npm script: `"db:explain": "tsx scripts/db-explain.ts"`

**Labels:** `type: chore`, `area: database`, `priority: medium`, `size: S`
**Milestone:** Phase 1: Performance & Data Correctness
```

---

### Issue #5: Wrap order creation in a transaction with retry on deadlock

```markdown
## 🎯 Goal

Ensure order + orderItems + payment are created atomically.

## 📖 Why

Multi-step order creation currently has no rollback protection. A partial failure leaves orphaned data.

## ✅ Tasks

- [ ] Wrap in `prisma.$transaction`
- [ ] Add retry logic with exponential backoff for serialization failures
- [ ] Test concurrent order creation from 10 parallel clients
- [ ] Add integration test asserting atomicity

**Labels:** `type: feature`, `area: prisma`, `priority: high`, `size: M`
**Milestone:** Phase 1: Performance & Data Correctness
```

---

## 📋 Phase 2 — Caching & Background Work

### Issue #6: Add Redis client + cache helper module

```markdown
## 🎯 Goal

Introduce Redis caching layer with a clean abstraction.

## ✅ Tasks

- [ ] Install `ioredis`
- [ ] Create `src/lib/redis.ts` with singleton client
- [ ] Add `cache.get<T>(key)`, `cache.set(key, value, ttl)`, `cache.del(key)`, `cache.delPrefix(prefix)`
- [ ] Add cache hit/miss metrics counters
- [ ] Add `REDIS_URL` to `.env.example`
- [ ] Handle Redis connection errors gracefully (fall back to no-cache)

**Labels:** `type: feature`, `area: redis`, `priority: high`, `size: M`
**Milestone:** Phase 2: Caching & Background Work
```

---

### Issue #7: Cache `novuWorkflows`, `categories`, and `topProducts` queries

```markdown
## 🎯 Goal

Use cache-aside pattern for hot reads.

## ✅ Tasks

- [ ] Add cache wrapper to `NovuWorkflowService.list()`
- [ ] Add cache to `CategoryService.list()`
- [ ] Add cache to `ProductService.topProducts()` (5-min TTL)
- [ ] Invalidate cache on create/update/delete mutations
- [ ] Use key naming: `v1:novu:workflows:all`

## 🧪 Verification

- [ ] Repeat identical query 100x — should hit Redis after first
- [ ] Cache invalidation on write works

**Labels:** `type: perf`, `area: redis`, `priority: high`, `size: M`
**Milestone:** Phase 2: Caching & Background Work
```

---

### Issue #8: Move email sending to BullMQ worker

```markdown
## 🎯 Goal

Make email sending async so HTTP requests stay fast.

## ✅ Tasks

- [ ] Install `bullmq` (already in `package.json`)
- [ ] Create `src/queues/emails/queue.ts`
- [ ] Create `src/queues/emails/worker.ts` with retry + backoff
- [ ] Move all `sendEmail(...)` calls to `emailQueue.add(...)`
- [ ] Add npm script: `"worker:emails": "tsx src/queues/emails/worker.ts"`
- [ ] Log job lifecycle (started/completed/failed)

## 🧪 Verification

- [ ] Send 1,000 emails via queue
- [ ] Observe HTTP request latency drop to <50ms
- [ ] Retry on failure works

## 📚 Resources

- [BullMQ Docs](https://docs.bullmq.io/)

**Labels:** `type: feature`, `area: queues`, `priority: high`, `size: M`
**Milestone:** Phase 2: Caching & Background Work
```

---

### Issue #9: Add nightly scheduled jobs (cron)

```markdown
## 🎯 Goal

Add recurring maintenance tasks.

## ✅ Tasks

- [ ] Use `node-cron` (already installed)
- [ ] Create `src/jobs/scheduler.ts`
- [ ] Jobs:
  - **Cleanup stale carts** (daily 3 AM)
  - **Reindex full-text search** (daily 4 AM)
  - **Refresh stats cache** (hourly)
  - **Purge old PostViews** (> 90 days, daily 5 AM)
- [ ] Add npm script: `"worker:cron": "tsx src/jobs/scheduler.ts"`

**Labels:** `type: feature`, `area: queues`, `priority: medium`, `size: M`
**Milestone:** Phase 2: Caching & Background Work
```

---

### Issue #10: Add idempotency keys to all mutating jobs

```markdown
## 🎯 Goal

Prevent duplicate job execution on retries.

## ✅ Tasks

- [ ] Add `idempotencyKey` field to job payloads
- [ ] Store processed keys in Redis with 24h TTL
- [ ] Skip execution if key already processed
- [ ] Test with duplicate enqueue

**Labels:** `type: feature`, `area: queues`, `priority: medium`, `size: S`
**Milestone:** Phase 2: Caching & Background Work
```

---

### Issue #11: Add dead-letter queue for failed jobs

```markdown
## 🎯 Goal

Isolate poisoned jobs so they don't block the queue.

## ✅ Tasks

- [ ] Configure BullMQ failed queue
- [ ] Create `src/queues/dlq/` with inspection UI
- [ ] Add admin GraphQL query: `failedJobs`
- [ ] Add `retryJob(id)` mutation
- [ ] Alert when DLQ depth > threshold

**Labels:** `type: feature`, `area: queues`, `priority: medium`, `size: M`
**Milestone:** Phase 2: Caching & Background Work
```

---

## 📋 Phase 3 — Scale & Resilience

### Issue #12: Tune connection pool size + add PgBouncer

```markdown
## 🎯 Goal

Optimize DB connection handling for high concurrency.

## ✅ Tasks

- [ ] Analyze current `pg.Pool` size vs. Postgres `max_connections`
- [ ] Add PgBouncer to `docker-compose.yml`
- [ ] Configure transaction mode (safe for Prisma)
- [ ] Add `/health/db` endpoint checking pool health
- [ ] Benchmark before/after with 100 concurrent clients

**Labels:** `type: perf`, `area: database`, `priority: high`, `size: M`
**Milestone:** Phase 3: Scale & Resilience
```

---

### Issue #13: Add read replica support for analytics queries

```markdown
## 🎯 Goal

Route read-only/analytics queries to a replica.

## ✅ Tasks

- [ ] Add `DATABASE_URL_REPLICA` to env
- [ ] Create second Prisma client `prismaReadOnly`
- [ ] Route analytics queries (e.g., `dailySales`, `topProducts`) to replica
- [ ] Add Docker Compose service for replica
- [ ] Document replica lag handling

**Labels:** `type: feature`, `area: database`, `priority: medium`, `size: L`
**Milestone:** Phase 3: Scale & Resilience
```

---

### Issue #14: Add Redis-backed rate limiting per user/IP

```markdown
## 🎯 Goal

Prevent abuse with sliding-window rate limiting.

## ✅ Tasks

- [ ] Create `src/middleware/rateLimit.ts`
- [ ] Use Redis `INCR` + `EXPIRE` (token bucket)
- [ ] Limits:
  - Anonymous: 60 req/min
  - Authenticated: 300 req/min
  - Admin: 1000 req/min
- [ ] Return `429` with `Retry-After` header
- [ ] Bypass for `/health` and `/metrics`

**Labels:** `type: feature`, `area: security`, `priority: high`, `size: M`
**Milestone:** Phase 3: Scale & Resilience
```

---

### Issue #15: Add GraphQL query complexity + depth limits

```markdown
## 🎯 Goal

Prevent malicious deep queries from DoS-ing the API.

## ✅ Tasks

- [ ] Install `graphql-depth-limit` and `graphql-query-complexity`
- [ ] Configure max depth: 8
- [ ] Configure max complexity: 1000
- [ ] Add custom cost per field (e.g., list fields cost ×limit)
- [ ] Return structured error with usage details

**Labels:** `type: security`, `area: graphql`, `priority: high`, `size: M`
**Milestone:** Phase 3: Scale & Resilience
```

---

### Issue #16: Implement graceful shutdown

```markdown
## 🎯 Goal

Zero dropped requests during deploys.

## ✅ Tasks

- [ ] On `SIGTERM`/`SIGINT`:
  1. Stop accepting new connections
  2. Finish in-flight requests (with timeout)
  3. Drain BullMQ workers (finish current job)
  4. Close Redis connection
  5. Close Prisma + pg pools
- [ ] Log each phase
- [ ] Test: `kill -TERM <pid>` during load test

**Labels:** `type: feature`, `area: devops`, `priority: high`, `size: M`
**Milestone:** Phase 3: Scale & Resilience
```

---

### Issue #17: Add circuit breaker for external API calls (Novu, email)

```markdown
## 🎯 Goal

Fail fast when external deps are down.

## ✅ Tasks

- [ ] Install `opossum` circuit breaker
- [ ] Wrap Novu SDK calls
- [ ] Wrap email provider calls
- [ ] Config: 50% failure rate over 10s → open for 30s
- [ ] Add fallback behavior (queue for retry)
- [ ] Expose breaker state via `/metrics`

**Labels:** `type: feature`, `area: observability`, `priority: medium`, `size: M`
**Milestone:** Phase 3: Scale & Resilience
```

---

## 📋 Phase 4 — Observability

### Issue #18: Replace `console.log` with structured Pino logging

```markdown
## 🎯 Goal

JSON logs with correlation IDs for every request.

## ✅ Tasks

- [ ] Install `pino` + `pino-http`
- [ ] Replace all `console.log/error` with `logger.info/error`
- [ ] Attach `requestId` (UUID) to every log
- [ ] Log shape: `{ level, time, requestId, userId, message, ...meta }`
- [ ] Add `LOG_LEVEL` env var

**Labels:** `type: chore`, `area: observability`, `priority: high`, `size: M`
**Milestone:** Phase 4: Observability
```

---

### Issue #19: Add OpenTelemetry tracing

```markdown
## 🎯 Goal

Trace requests end-to-end: HTTP → GraphQL → Prisma → Redis.

## ✅ Tasks

- [ ] Install `@opentelemetry/sdk-node`
- [ ] Auto-instrument: `http`, `express`, `graphql`, `ioredis`
- [ ] Add Prisma instrumentation
- [ ] Export traces to Jaeger (in Docker Compose)
- [ ] Add `trace_id` to logs

**Labels:** `type: feature`, `area: observability`, `priority: high`, `size: L`
**Milestone:** Phase 4: Observability
```

---

### Issue #20: Add Prometheus `/metrics` endpoint

```markdown
## 🎯 Goal

Expose app metrics for scraping.

## ✅ Tasks

- [ ] Install `prom-client`
- [ ] Metrics:
  - `http_request_duration_seconds` (histogram)
  - `graphql_query_duration_seconds` (histogram)
  - `cache_hits_total` / `cache_misses_total` (counter)
  - `queue_depth` (gauge)
  - `db_pool_active_connections` (gauge)
- [ ] Expose at `/metrics`
- [ ] Add Grafana dashboard JSON

**Labels:** `type: feature`, `area: observability`, `priority: high`, `size: M`
**Milestone:** Phase 4: Observability
```

---

### Issue #21: Add Sentry error tracking

```markdown
## 🎯 Goal

Centralized error grouping and alerting.

## ✅ Tasks

- [ ] Install `@sentry/node`
- [ ] Initialize with DSN from env
- [ ] Capture unhandled errors + GraphQL errors
- [ ] Add user context (userId, role)
- [ ] Source maps for TS stack traces
- [ ] Release tagging via git SHA

**Labels:** `type: feature`, `area: observability`, `priority: high`, `size: S`
**Milestone:** Phase 4: Observability
```

---

### Issue #22: Split `/health/live` vs `/health/ready`

```markdown
## 🎯 Goal

Proper liveness vs readiness for Kubernetes.

## ✅ Tasks

- [ ] `/health/live` — returns 200 if process alive
- [ ] `/health/ready` — checks DB + Redis + queue workers
- [ ] Add response times per check
- [ ] Return 503 if any dependency down

**Labels:** `type: feature`, `area: devops`, `priority: high`, `size: S`
**Milestone:** Phase 4: Observability
```

---

## 📋 Phase 5 — Database Engineering

### Issue #23: Partition `PostViews`, `Messages`, and `Notifications` by month

```markdown
## 🎯 Goal

Keep large tables fast and manageable.

## ✅ Tasks

- [ ] Convert to `PARTITION BY RANGE (created_at)`
- [ ] Create monthly partitions for last 12 months
- [ ] Automate partition creation via cron
- [ ] Add partition pruning to hot queries
- [ ] Benchmark: SELECT on 5M+ rows stays < 50ms

**Labels:** `type: perf`, `area: database`, `priority: medium`, `size: L`
**Milestone:** Phase 5: Database Engineering
```

---

### Issue #24: Add materialized views for `daily_sales` and `top_products_30d`

```markdown
## 🎯 Goal

Precompute expensive aggregations.

## ✅ Tasks

- [ ] Create `mv_daily_sales` (grouped by day + category)
- [ ] Create `mv_top_products_30d`
- [ ] Add `REFRESH MATERIALIZED VIEW CONCURRENTLY` to cron (hourly)
- [ ] Add GraphQL queries hitting MVs
- [ ] Benchmark: analytics queries drop from 5s → 50ms

**Labels:** `type: perf`, `area: database`, `priority: medium`, `size: M`
**Milestone:** Phase 5: Database Engineering
```

---

### Issue #25: Set up streaming replica + backup/restore scripts

```markdown
## 🎯 Goal

Protect data and enable read scaling.

## ✅ Tasks

- [ ] Add Postgres replica to Docker Compose
- [ ] Enable streaming replication
- [ ] Add `npm run db:backup` (pg_dump + S3 upload)
- [ ] Add `npm run db:restore <file>`
- [ ] Document PITR procedure

**Labels:** `type: chore`, `area: database`, `priority: high`, `size: L`
**Milestone:** Phase 5: Database Engineering
```

---

### Issue #26: Add `jsonb` + GIN indexes for event payloads

```markdown
## 🎯 Goal

Query JSON fields efficiently.

## ✅ Tasks

- [ ] Move Novu event payloads to `jsonb` columns
- [ ] Add GIN index with `jsonb_path_ops`
- [ ] Add queries filtering by payload keys
- [ ] Benchmark: key lookup < 20ms on 1M rows

**Labels:** `type: perf`, `area: database`, `priority: medium`, `size: M`
**Milestone:** Phase 5: Database Engineering
```

---

## 📋 Phase 6 — Testing & Quality

### Issue #27: Set up Vitest + service unit tests (80% coverage)

```markdown
## 🎯 Goal

Fast, reliable unit tests for all services.

## ✅ Tasks

- [ ] Install `vitest` + `@vitest/coverage-v8`
- [ ] Add `vitest.config.ts`
- [ ] Mock Prisma with `vitest-mock-extended`
- [ ] Write tests for every `*.service.ts`
- [ ] Aim for 80% line coverage
- [ ] Add `npm run test:unit`

**Labels:** `type: test`, `area: testing`, `priority: high`, `size: L`
**Milestone:** Phase 6: Testing & Quality
```

---

### Issue #28: Add integration tests with Testcontainers

```markdown
## 🎯 Goal

Test against real Postgres + Redis, not mocks.

## ✅ Tasks

- [ ] Install `testcontainers`
- [ ] Spin up Postgres + Redis per test suite
- [ ] Run migrations before tests
- [ ] Test full GraphQL request lifecycle
- [ ] Add `npm run test:integration`

**Labels:** `type: test`, `area: testing`, `priority: high`, `size: L`
**Milestone:** Phase 6: Testing & Quality
```

---

### Issue #29: Add k6 load testing scripts

```markdown
## 🎯 Goal

Find the breaking point.

## ✅ Tasks

- [ ] Install `k6`
- [ ] Script 1: `posts(limit:50)` — 100 → 1,000 RPS ramp
- [ ] Script 2: `createOrder` mutation — 50 → 500 RPS
- [ ] Script 3: Auth flow — login + query chain
- [ ] Record p50, p95, p99 latencies
- [ ] Document capacity limits

**Labels:** `type: test`, `area: testing`, `priority: medium`, `size: M`
**Milestone:** Phase 6: Testing & Quality
```

---

### Issue #30: Enable strict TypeScript flags

```markdown
## 🎯 Goal

Catch bugs at compile time.

## ✅ Tasks

- [ ] Enable `noUncheckedIndexedAccess`
- [ ] Enable `exactOptionalPropertyTypes`
- [ ] Enable `noImplicitOverride`
- [ ] Remove `skipLibCheck`
- [ ] Fix all resulting errors

**Labels:** `type: refactor`, `priority: medium`, `size: L`
**Milestone:** Phase 6: Testing & Quality
```

---

### Issue #31: Add ESLint + Prettier with CI enforcement

```markdown
## 🎯 Goal

Consistent code style.

## ✅ Tasks

- [ ] Install `eslint` + `@typescript-eslint` + `prettier`
- [ ] Add `eslint.config.js`
- [ ] Add pre-commit hook (husky + lint-staged)
- [ ] Fail CI on lint errors

**Labels:** `type: chore`, `priority: medium`, `size: S`
**Milestone:** Phase 6: Testing & Quality
```

---

## 📋 Phase 7 — Security & Multi-Tenancy

### Issue #32: Add Zod validation to all `inputs.ts`

```markdown
## 🎯 Goal

Never trust client input.

## ✅ Tasks

- [ ] Install `zod`
- [ ] Create Zod schemas for every mutation input
- [ ] Validate in resolvers before service calls
- [ ] Return friendly validation errors
- [ ] Add tests for edge cases (empty, oversized, wrong type)

**Labels:** `type: security`, `area: graphql`, `priority: high`, `size: L`
**Milestone:** Phase 7: Security & Multi-Tenancy
```

---

### Issue #33: Add refresh token flow with rotation + revocation

```markdown
## 🎯 Goal

Secure long-lived sessions.

## ✅ Tasks

- [ ] Short-lived access token (15 min)
- [ ] Long-lived refresh token (7 days)
- [ ] Store `jti` in Redis for revocation
- [ ] Rotate refresh token on each use
- [ ] Detect replay attacks (revoke all on reuse)

**Labels:** `type: security`, `area: auth`, `priority: high`, `size: M`
**Milestone:** Phase 7: Security & Multi-Tenancy
```

---

### Issue #34: Add multi-tenancy with Row-Level Security

```markdown
## 🎯 Goal

Workspace/org isolation with DB-level guarantees.

## ✅ Tasks

- [ ] Add `Workspace` model
- [ ] Add `workspaceId` to root models
- [ ] Enable RLS on tenant-scoped tables
- [ ] Set `app.current_workspace_id` per request
- [ ] Add tests proving cross-workspace data leak is impossible

**Labels:** `type: feature`, `area: security`, `priority: high`, `size: XL`
**Milestone:** Phase 7: Security & Multi-Tenancy
```

---

### Issue #35: Add AuditLog model + middleware

```markdown
## 🎯 Goal

Track who did what, when.

## ✅ Tasks

- [ ] Add `AuditLog` model (userId, action, entity, entityId, before, after, ip)
- [ ] Add middleware to log all mutations
- [ ] Add admin query: `auditLogs(filter)`
- [ ] Retention policy: 2 years

**Labels:** `type: feature`, `area: security`, `priority: medium`, `size: M`
**Milestone:** Phase 7: Security & Multi-Tenancy
```

---

### Issue #36: Add GDPR data export + deletion

```markdown
## 🎯 Goal

Comply with right-to-access and right-to-be-forgotten.

## ✅ Tasks

- [ ] `exportUserData(userId)` → JSON dump
- [ ] `deleteUserData(userId)` → cascading deletion
- [ ] Anonymize audit logs (keep action, remove PII)
- [ ] Send confirmation email
- [ ] Log all DSAR requests

**Labels:** `type: feature`, `area: security`, `priority: medium`, `size: M`
**Milestone:** Phase 7: Security & Multi-Tenancy
```

---

## 📋 Phase 8 — DevOps & Delivery

### Issue #37: Add multi-stage Dockerfile + docker-compose

```markdown
## 🎯 Goal

One-command dev environment.

## ✅ Tasks

- [ ] `Dockerfile` (multi-stage: deps → build → runtime)
- [ ] `docker-compose.yml`: app, postgres, redis, jaeger, prometheus, grafana
- [ ] Health checks for each service
- [ ] `docker compose up` starts everything
- [ ] Document in README

**Labels:** `type: chore`, `area: devops`, `priority: high`, `size: L`
**Milestone:** Phase 8: DevOps & Delivery
```

---

### Issue #38: Add CI/CD pipeline with GitHub Actions

```markdown
## 🎯 Goal

Automated test + migrate + deploy.

## ✅ Tasks

- [ ] `.github/workflows/ci.yml`:
  - Lint
  - Type check
  - Unit + integration tests
  - Build
- [ ] `.github/workflows/deploy.yml`:
  - `prisma migrate deploy` (never `migrate dev` in prod)
  - Push Docker image
  - Deploy
- [ ] Block PRs on failing tests

**Labels:** `type: chore`, `area: devops`, `priority: high`, `size: L`
**Milestone:** Phase 8: DevOps & Delivery
```

---

### Issue #39: Add feature flags (DB-backed)

```markdown
## 🎯 Goal

Ship dark, enable gradually.

## ✅ Tasks

- [ ] Add `FeatureFlag` model
- [ ] Add `isEnabled(flag, userId)` helper
- [ ] Add admin mutations: enable/disable/rollout %
- [ ] Cache flags in Redis (30s TTL)
- [ ] Use for one risky feature

**Labels:** `type: feature`, `area: devops`, `priority: medium`, `size: M`
**Milestone:** Phase 8: DevOps & Delivery
```

---

## 📋 Phase 9 — Product & Platform

### Issue #40: Add file uploads with S3 presigned URLs

```markdown
## 🎯 Goal

Upload product images and avatars.

## ✅ Tasks

- [ ] Add mutation: `generateUploadUrl(filename, contentType)`
- [ ] Return presigned PUT URL + objectKey
- [ ] Add S3 config to env
- [ ] Use MinIO in Docker Compose for local dev
- [ ] Validate file size/type server-side

**Labels:** `type: feature`, `priority: medium`, `size: L`
**Milestone:** Phase 9: Product & Platform
```

---

### Issue #41: Add inbound webhooks (`/webhooks/stripe`, `/webhooks/novu`)

```markdown
## 🎯 Goal

React to external events.

## ✅ Tasks

- [ ] Verify signature (Stripe, Novu)
- [ ] Handle events: `payment.succeeded`, `subscription.updated`, `email.delivered`
- [ ] Queue heavy work
- [ ] Add idempotency check (event ID)
- [ ] Log all events

**Labels:** `type: feature`, `priority: medium`, `size: M`
**Milestone:** Phase 9: Product & Platform
```

---

### Issue #42: Add Meilisearch/Typesense for instant search

```markdown
## 🎯 Goal

Sub-50ms search across millions of docs.

## ✅ Tasks

- [ ] Add Meilisearch service to Docker Compose
- [ ] Sync posts + products to index on write
- [ ] Add GraphQL: `instantSearch(query)`
- [ ] Add typo tolerance, facets, ranking rules
- [ ] Benchmark vs. PostgreSQL FTS

**Labels:** `type: feature`, `priority: low`, `size: L`
**Milestone:** Phase 9: Product & Platform
```

---

### Issue #43: Add admin-only queries (users, moderation, sales)

```markdown
## 🎯 Goal

Elevated access for admins.

## ✅ Tasks

- [ ] Add `@auth(role: ADMIN)` directive usage
- [ ] Queries: `adminUsers`, `adminOrders`, `adminSalesReport`, `adminModerationQueue`
- [ ] Add rate limit bypass for admins
- [ ] Log every admin query in AuditLog

**Labels:** `type: feature`, `area: security`, `priority: medium`, `size: M`
**Milestone:** Phase 9: Product & Platform
```

---

### Issue #44: Add i18n for multi-language content

```markdown
## 🎯 Goal

Serve content in user's language.

## ✅ Tasks

- [ ] Add `PostTranslation` model (postId, locale, title, body)
- [ ] Add `Accept-Language` header handling
- [ ] Add locale to user profile
- [ ] Fallback to default locale

**Labels:** `type: feature`, `priority: low`, `size: M`
**Milestone:** Phase 9: Product & Platform
```

---

### Issue #45: Add API versioning (`v2` namespace)

```markdown
## 🎯 Goal

Evolve without breaking clients.

## ✅ Tasks

- [ ] Add `@deprecated` markers to old fields
- [ ] Create `v2` SDL directory
- [ ] Version by header: `X-API-Version: 2`
- [ ] Document migration path

**Labels:** `type: feature`, `priority: low`, `size: L`
**Milestone:** Phase 9: Product & Platform
```

---

## 🎯 Recommended Sprint Plan

| Sprint       | Duration | Issues                  | Focus                      |
| ------------ | -------- | ----------------------- | -------------------------- |
| **Sprint 1** | 2 weeks  | #1, #2, #3, #4, #5      | Phase 1 — Performance      |
| **Sprint 2** | 2 weeks  | #6, #7, #8, #9, #10     | Phase 2 — Caching + Queues |
| **Sprint 3** | 2 weeks  | #11, #12, #14, #15, #16 | Phase 3 — Resilience       |
| **Sprint 4** | 2 weeks  | #18, #20, #21, #22      | Phase 4 — Observability    |
| **Sprint 5** | 2 weeks  | #23, #24, #25           | Phase 5 — DB Engineering   |
| **Sprint 6** | 2 weeks  | #27, #28, #29           | Phase 6 — Testing          |
| **Sprint 7** | 2 weeks  | #32, #33, #34           | Phase 7 — Security         |
| **Sprint 8** | 2 weeks  | #37, #38                | Phase 8 — DevOps           |
| **Sprint 9** | 2 weeks  | #40, #41, #43           | Phase 9 — Platform         |

---

## 📌 How to Add These to GitHub

### Option A: Manual (Faster for small batches)

1. Go to **Issues → New Issue**
2. Paste the markdown content
3. Set **Labels**, **Milestone**, **Assignee**
4. Repeat

### Option B: GitHub CLI (Bulk)

Install `gh` CLI, then:

```bash
# Create a single issue
gh issue create \
  --title "Add DataLoader for post.author and post.comments" \
  --body-file issues/01-dataloader.md \
  --label "type: perf,area: graphql,priority: critical,size: M" \
  --milestone "Phase 1: Performance & Data Correctness"
```

### Option C: Bulk via Bash Script

```bash
#!/bin/bash
# create-issues.sh
while IFS='|' read -r title labels milestone body_file; do
  gh issue create \
    --title "$title" \
    --label "$labels" \
    --milestone "$milestone" \
    --body-file "$body_file"
done < issues.csv
```

With `issues.csv`:

```csv
Add DataLoader for post.author and post.comments|type: perf,area: graphql,priority: critical,size: M|Phase 1: Performance & Data Correctness|issues/01-dataloader.md
Add missing composite indexes|type: perf,area: database,priority: critical,size: S|Phase 1: Performance & Data Correctness|issues/02-indexes.md
```

---

## 🎁 Bonus: GitHub Project Board Template

Create a **GitHub Project** with these columns:

| Column             | Automation                |
| ------------------ | ------------------------- |
| 📥 **Backlog**     | New issues default        |
| 🎯 **This Sprint** | Manually assigned         |
| 🚧 **In Progress** | Auto when PR opened       |
| 👀 **In Review**   | Auto when PR marked ready |
| ✅ **Done**        | Auto when PR merged       |
| ⏸️ **Blocked**     | Label `blocked`           |

### Filters to Save

- `is:open label:"priority: critical"` — must do now
- `is:open label:"good first issue"` — contributor-friendly
- `is:open milestone:"Phase 1: Performance & Data Correctness"` — current sprint
- `is:open assignee:@me` — my work

---

## 🚀 What This Gives You

1. **Structured learning path** — 45 issues × 9 phases × clear "what to learn" + "what to build"
2. **Portfolio-ready** — Your commit history and closed issues tell a story of a disciplined, senior-level engineer
3. **Velocity tracking** — GitHub Insights → Burndown charts
4. **Future contributions** — `good first issue` labels invite others
5. **Interview talking points** — "I solved N+1 with DataLoader, cut p99 by 60%, added partitioning..."
