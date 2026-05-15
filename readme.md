# GraphQL Prisma API

A GraphQL API built with Apollo Server, Prisma (v7), and PostgreSQL. Features a blog domain plus a full e-commerce domain with products, orders, payments, and refunds.

## Models (23 tables)

### Core / Auth
- **User** — roles (USER, ADMIN, MODERATOR)
- **Profile** — One-to-one with User

### Blog / Content
- **Post** — Belongs to User; has Tags, Categories, Comments, Likes, SavedPosts, PostViews
- **Tag** — Many-to-many with Post
- **Category** — Many-to-many with Post; also linked to Products
- **Comment** — Belongs to User and Post
- **Like** — Belongs to User and Post (unique pair)
- **SavedPost** — Bookmark posts (unique per user+post)
- **PostView** — Anonymous or user-tracked post views

### E-Commerce
- **Product** — Belongs to Seller (User) and Category; has Images, OrderItems, Reviews
- **ProductImage** — Multiple images per Product
- **Order** — Belongs to Buyer (User); has Items, Payment, Refunds, Shipments, Coupon
- **OrderItem** — Line items (quantity + unitPrice)
- **Payment** — One-to-one per Order; supports multiple methods
- **Refund** — Belongs to Payment and Order
- **Review** — Belongs to Product and User (unique pair, rating 1-5)
- **Coupon** — Discount codes applied to Orders
- **Shipment** — Tracking per Order

### Social / Account
- **Address** — User has many (Home/Work/Other)
- **Wishlist** — User has many; WishlistItem links to Products
- **Cart** — One per User; CartItem links to Products
- **Notification** — User notifications with types (ORDER_UPDATE, NEW_FOLLOWER, etc.)
- **Follow** — User follows User (self-referential, unique pair)

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

## Seed Data

The seed script (`prisma/seed.ts`) uses `@faker-js/faker` to generate realistic data:

| Table | Records |
|-------|---------|
| Users | 50 (5 fixed + 45 random) |
| Products | 500 |
| Orders | 500 |
| Order Items | ~2000 (avg 4 per order) |
| Payments | ~450 (one per non-cancelled order) |
| Refunds | ~100 |
| Reviews | ~1500 (avg 3-4 per product) |
| Posts | 50 |
| Comments | 200 |
| Likes | ~300 |

### Flags

```
npm run seed          — Append seed data to existing database
npm run seed:reset    — Delete all data, do not re-seed
npm run seed:fresh    — Delete all data, then re-seed
```

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

## API Reference

See [API.md](./API.md) for the full API reference with all queries, mutations, examples, and fragments.
