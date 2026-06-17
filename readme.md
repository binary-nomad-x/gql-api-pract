# GraphQL Prisma API

A GraphQL API built with Apollo Server, Prisma (v7), and PostgreSQL. Covers blog + e-commerce with 23 database models.

## Prerequisites

- **Node.js** 18+
- **PostgreSQL** 13+ running locally or remotely
- **npm** 9+

## Quick Start

### 1. Clone and install

```bash
git clone <repo-url>
cd graphql-prisma-api
npm install
```

### 2. Configure environment

Copy the example env file and fill in your values:

```bash
cp .env.example .env
```

Required variables in `.env`:

| Variable       | Description                                                                             |
| -------------- | --------------------------------------------------------------------------------------- |
| `DATABASE_URL` | PostgreSQL connection string (e.g. `postgresql://user:pass@localhost:5432/graphql_api`) |
| `PORT`         | Server port (default `4000`)                                                            |
| `JWT_SECRET`   | Secret key for signing JWT tokens                                                       |

Optional for Novu notifications:

| Variable              | Description                                   |
| --------------------- | --------------------------------------------- |
| `NOVU_API_SECRET_KEY` | Novu API secret key (get from Novu dashboard) |

### 3. Setup database

This runs migrations, generates the Prisma client, and seeds sample data:

```bash
npm run setup
```

If you prefer to run each step manually:

```bash
# Generate Prisma client from schema
npm run generate

# Apply database migrations
npm run migrate:dev

# Seed with sample data
npm run seed
```

### 4. Start the server

```bash
npm run dev
```

Open **http://localhost:4000** in your browser to use the GraphQL sandbox.

### 5. Login

Use one of the seeded test accounts (password: `password123`):

| Email            | Role      |
| ---------------- | --------- |
| alice@test.com   | ADMIN     |
| bob@test.com     | USER      |
| charlie@test.com | USER      |
| diana@test.com   | MODERATOR |
| eve@test.com     | USER      |

Example login mutation:

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

## Scripts

| Command               | What it does                              |
| --------------------- | ----------------------------------------- |
| `npm run dev`         | Start the GraphQL server (hot-reload)     |
| `npm run seed`        | Insert sample data                        |
| `npm run seed:fresh`  | Delete all data then re-seed              |
| `npm run seed:reset`  | Delete all data (no seed)                 |
| `npm run db:rebuild`  | Full reset: drop tables + migrate + seed  |
| `npm run studio`      | Open Prisma Studio (GUI database browser) |
| `npm run migrate:dev` | Apply pending Prisma migrations           |
| `npm run generate`    | Regenerate Prisma client from schema      |

## Seed Data

Running `npm run seed` creates approximately 90,000+ records across 26 tables:

| Table             | Records         |
| ----------------- | --------------- |
| Users             | 500             |
| Profiles          | 500             |
| Categories        | 15              |
| Tags              | 20              |
| Posts             | 500             |
| Comments          | 2,000           |
| Likes             | ~3,000          |
| Products          | 5,000           |
| Orders + Items    | 5,000 / ~15,000 |
| Payments          | ~4,000          |
| Refunds           | ~200            |
| Reviews           | ~2,500          |
| Addresses         | ~1,000          |
| Wishlists + Items | 100 / ~300      |
| Carts + Items     | 150 / ~400      |
| Coupons           | 11              |
| Shipments         | ~500            |
| Notifications     | ~3,500          |
| Follows           | 500             |
| SavedPosts        | 500             |
| PostViews         | ~20,000         |
| ProductImages     | ~12,000         |
| Subscriptions     | 500             |
| Discounts         | 1,000           |
| Conversations     | 500             |
| Messages          | ~20,000         |

## API

The GraphQL endpoint is available at `POST http://localhost:4000/`.

Use the GraphQL sandbox at **http://localhost:4000** to explore queries, mutations, and types interactively.

For authenticated requests, include the JWT token from `login`/`signup` in the `Authorization` header:

```json
{
  "Authorization": "Bearer <your-jwt-token>"
}
```

See [API.md](./API.md) for a complete reference of all queries, mutations, inputs, and fragments.

## Enums

- `Role`: `USER | ADMIN | MODERATOR`
- `OrderStatus`: `PENDING | CONFIRMED | PROCESSING | SHIPPED | DELIVERED | CANCELLED`
- `PaymentMethod`: `CREDIT_CARD | DEBIT_CARD | PAYPAL | BANK_TRANSFER | CASH_ON_DELIVERY`
- `PaymentStatus`: `PENDING | COMPLETED | FAILED | REFUNDED`
- `RefundStatus`: `PENDING | APPROVED | REJECTED | COMPLETED`
- `ShipmentStatus`: `PENDING | PICKED_UP | IN_TRANSIT | OUT_FOR_DELIVERY | DELIVERED | FAILED`
- `NotificationType`: `SYSTEM | ORDER_UPDATE | PAYMENT_RECEIVED | SHIPMENT_UPDATE | NEW_FOLLOWER | NEW_COMMENT | NEW_LIKE | REVIEW_REPLY | PROMOTION | NEW_MESSAGE | SUBSCRIPTION_EXPIRING | DISCOUNT_AVAILABLE`
- `SubscriptionPlan`: `FREE | BASIC | PREMIUM | ENTERPRISE`
- `SubscriptionStatus`: `ACTIVE | CANCELLED | PAST_DUE | EXPIRED`
- `DiscountType`: `PERCENTAGE | FIXED_AMOUNT`




### TODO'S : 
* Grow the project to even more data (real looking and fake real data that mockaroo generates)
* Introduce database level things like materialized views, views, procedures, functions in the codebase
* Introduce more helpers in auth
* Ability to use /src methods into /prisma/seed files (like exported methods and constants)
* Make the novu working (use the new approach that supports the ts files - code level workflows and steps)
* Introduce mcp in the project
* Use pgsql mcp for the project
* introduce stripe
* when i hit localhost:4000 port and im offline, it does not open graphql appollo server for me to play with offline
*
