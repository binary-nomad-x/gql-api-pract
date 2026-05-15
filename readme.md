# GraphQL Prisma API

A GraphQL API built with Apollo Server, Prisma (v7), and PostgreSQL.

## Models

- **User** — Authentication, roles (USER, ADMIN, MODERATOR)
- **Profile** — One-to-one with User
- **Post** — Belongs to User; has many Tags, Categories, Comments, and Likes
- **Tag** — Many-to-many with Post
- **Category** — Many-to-many with Post
- **Comment** — Belongs to User and Post
- **Like** — Belongs to User and Post (unique per user+post)

## Prerequisites

- Node.js >= 18
- PostgreSQL running on `localhost:5433` (or update `.env`)

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Generate Prisma client
npm run generate

# 3. Run migrations
npm run migrate:dev

# 4. Seed the database
npm run seed

# 5. Start dev server
npm run dev
```

Or use the all-in-one setup:

```bash
npm run setup
```

## Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server with hot reload |
| `npm run build` | Compile TypeScript to `dist/` |
| `npm run start` | Start compiled server |
| `npm run seed` | Seed database with sample data |
| `npm run seed:reset` | Delete all data (no re-seed) |
| `npm run seed:fresh` | Reset + re-seed database |
| `npm run db:reset` | Reset database via Prisma migrate |
| `npm run db:rebuild` | Full reset + migrate + seed |
| `npm run generate` | Regenerate Prisma client |
| `npm run migrate:dev` | Run pending migrations |
| `npm run studio` | Open Prisma Studio |
| `npm run setup` | Full setup: install + generate + migrate + seed |

## Seed Command Flags

The seed script (`prisma/seed.ts`) accepts optional flags:

- No flag — Append seed data to existing database
- `--reset` or `-r` — Delete all data, do not re-seed
- `--fresh` or `-f` — Delete all data, then re-seed

## Environment Variables

See `.env.example`:

```
DATABASE_URL="postgresql://postgres:admin@localhost:5433/graphql_api?schema=public"
PORT=4000
NODE_ENV=development
JWT_SECRET=your-secret-key
```

## Test Accounts

All seeded accounts use password `password123`:

| Email | Role |
|-------|------|
| alice@test.com | ADMIN |
| bob@test.com | USER |
| charlie@test.com | USER |
| diana@test.com | MODERATOR |
| eve@test.com | USER |
