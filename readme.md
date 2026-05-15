# GraphQL Prisma API

A GraphQL API built with Apollo Server, Prisma (v7), and PostgreSQL. Blog + e-commerce with 23 models.

## Project Structure

```
src/
  index.ts              # Server entry - ApolloServer setup
  context.ts            # Prisma adapter + auth context
  schema/
    typeDefs.ts         # Loads all .graphql files
    types/              # 23 type definitions (one per model)
    inputs.graphql      # All input types for mutations
    queries.graphql     # All Query operations
    mutations.graphql   # All Mutation operations
    fragments.graphql   # Reusable field fragments
  modules/              # Domain modules
    auth/               # signup, login
    user/               # User CRUD + Profile
    blog/               # Post, Tag, Category, Comment, Like
    commerce/           # Product, Order, Payment, Refund
    address/ cart/ wishlist/ coupon/ shipment/
    notification/ follow/ savedPost/ postView/ productImage/
    stats/              # Aggregate counts
    index.ts            # Merges all resolvers
  types/                # TS types (context, graphql helpers, input shapes)
    context.ts          # Context interface
    graphql.ts          # Parent, PaginationArgs, IdArg, etc.
    inputs.ts           # CreateUserInput, CreatePostInput, etc.
  utils/
    auth.ts             # JWT, bcrypt helpers
    errors.ts           # AppError, requireAuth, requireOwner
    clean.ts            # Clean null values for Prisma
API.md                  # Complete API reference with examples
```

## Making API Calls

The API is a single GraphQL endpoint:

**Endpoint:** `POST http://localhost:4000/`

**Headers:**
```json
{
  "Content-Type": "application/json"
}
```

**Authenticated requests** (add JWT token from `login` or `signup`):
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer <your-jwt-token>"
}
```

### Request Shape

Every GraphQL request follows this structure:

```json
{
  "query": "mutation { login(email:\"...\", password:\"...\") { token user { id email name role } } }",
  "variables": {}
}
```

Or with variables:

```json
{
  "query": "mutation Login($email: String!, $password: String!) { login(email: $email, password: $password) { token user { id email name role } } }",
  "variables": {
    "email": "alice@test.com",
    "password": "password123"
  }
}
```

### Response Shape

Every response follows this structure:

```json
{
  "data": {
    "login": {
      "token": "eyJhbGci...",
      "user": {
        "id": "cmpxxx...",
        "email": "alice@test.com",
        "name": "Alice Johnson",
        "role": "ADMIN"
      }
    }
  }
}
```

Error response:

```json
{
  "errors": [
    {
      "message": "Email already in use",
      "extensions": { "code": "BAD_REQUEST" }
    }
  ]
}
```

## Quick Examples

### 1. Login (get a JWT token)

```graphql
mutation Login {
  login(email: "alice@test.com", password: "password123") {
    token
    user { id email name role }
  }
}
```

### 2. Get my orders (authenticated)

```graphql
query MyOrders {
  myOrders(limit: 5) {
    id status totalAmount itemCount
    items { id quantity product { name price } }
    payment { id amount method status }
  }
}
```

### 3. Create a product (authenticated, seller role)

```graphql
mutation CreateProduct {
  createProduct(input: {
    name: "Wireless Headphones",
    price: 79.99,
    stock: 100,
    sku: "WH-001",
    categorySlug: "electronics"
  }) {
    id name price sku
    category { name slug }
  }
}
```

### 4. Place an order (authenticated)

```graphql
mutation PlaceOrder {
  placeOrder(input: {
    items: [{ productId: "<product-id>", quantity: 2 }],
    shippingAddress: "123 Main St, New York, NY 10001"
  }) {
    id status totalAmount
    items { id quantity unitPrice product { name } }
  }
}
```

### 5. Using fragments

```graphql
fragment UserInfo on User {
  id email name role
}

fragment ProductInfo on Product {
  id name price stock sku
  seller { ...UserInfo }
  category { id name slug }
}

query GetProducts {
  products(limit: 3) {
    ...ProductInfo
  }
}
```

## Input Shapes (for mutations)

All mutation inputs follow the `input` keyword in GraphQL. Here are the key ones:

### CreateUserInput
```graphql
input CreateUserInput {
  email: String!
  name: String
  password: String!
}
```

### CreatePostInput
```graphql
input CreatePostInput {
  title: String!
  content: String
  published: Boolean
  tags: [String!]
  categories: [String!]
}
```

### CreateProductInput
```graphql
input CreateProductInput {
  name: String!
  description: String
  price: Float!
  stock: Int!
  sku: String!
  imageUrl: String
  categorySlug: String
}
```

### PlaceOrderInput
```graphql
input PlaceOrderInput {
  items: [OrderItemInput!]!
  shippingAddress: String
  couponCode: String
}

input OrderItemInput {
  productId: ID!
  quantity: Int!
}
```

### CreateReviewInput
```graphql
input CreateReviewInput {
  rating: Int!        # 1-5
  title: String
  content: String
  productId: ID!
}
```

See [API.md](./API.md) for the full input reference.

## Response Shapes (types)

### User
```graphql
type User {
  id: ID!
  email: String!
  name: String
  role: Role!
  profile: Profile
  posts: [Post!]!
  products: [Product!]!
  orders: [Order!]!
  addresses: [Address!]!
  cart: Cart
  notifications: [Notification!]!
  followers: [Follow!]!
  following: [Follow!]!
  createdAt: DateTime!
  updatedAt: DateTime!
}
```

### Product
```graphql
type Product {
  id: ID!
  name: String!
  price: Float!
  stock: Int!
  sku: String!
  isActive: Boolean!
  seller: User!
  category: Category
  images: [ProductImage!]!
  reviews: [Review!]!
  reviewCount: Int!
  averageRating: Float
}
```

### Order
```graphql
type Order {
  id: ID!
  status: OrderStatus!
  totalAmount: Float!
  discountAmount: Float!
  items: [OrderItem!]!
  payment: Payment
  shipments: [Shipment!]!
  coupon: Coupon
  itemCount: Int!
}
```

### AuthPayload
```graphql
type AuthPayload {
  token: String!
  user: User!
}
```

## Query Parameters

Most list queries accept pagination and filters:

```graphql
# Pagination args (available on all list queries)
limit: Int   # default varies (10-20)
offset: Int  # default 0

# Post filters
posts(published: Boolean, search: String, limit: Int, offset: Int): [Post!]!

# Product filters
products(categorySlug: String, search: String, minPrice: Float, maxPrice: Float, limit: Int, offset: Int): [Product!]!

# Order filters
myOrders(status: OrderStatus, limit: Int, offset: Int): [Order!]!
```

## Seed Data

`npm run seed:fresh` generates 10K+ records:

| Table | Records |
|-------|---------|
| Users | 50 |
| Products | 500 |
| ProductImages | ~1500 |
| Orders | 500 |
| OrderItems | ~2000 |
| Payments | ~400 |
| Refunds | ~100 |
| Reviews | ~1200 |
| Addresses | ~120 |
| Wishlists | ~30 |
| Carts | ~40 |
| Coupons | 8 |
| Shipments | ~150 |
| Notifications | ~250 |
| Follows | ~150 |
| SavedPosts | ~200 |
| PostViews | ~1300 |
| Posts/Comments/Likes | 50/200/280 |

## Test Accounts

All use password `password123`:

| Email | Role |
|-------|------|
| alice@test.com | ADMIN |
| bob@test.com | USER |
| charlie@test.com | USER |
| diana@test.com | MODERATOR |
| eve@test.com | USER |

## Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start dev server |
| `npm run seed` | Seed with sample data |
| `npm run seed:fresh` | Reset + re-seed |
| `npm run seed:reset` | Delete all data |
| `npm run db:rebuild` | Full reset + migrate + seed |
| `npm run setup` | Install + generate + migrate + seed |
| `npm run studio` | Open Prisma Studio |
| `npm run migrate:dev` | Run pending migrations |
| `npm run generate` | Regenerate Prisma client |

## Enums

```
Role: USER | ADMIN | MODERATOR
OrderStatus: PENDING | CONFIRMED | PROCESSING | SHIPPED | DELIVERED | CANCELLED
PaymentMethod: CREDIT_CARD | DEBIT_CARD | PAYPAL | BANK_TRANSFER | CASH_ON_DELIVERY
PaymentStatus: PENDING | COMPLETED | FAILED | REFUNDED
RefundStatus: PENDING | APPROVED | REJECTED | COMPLETED
ShipmentStatus: PENDING | PICKED_UP | IN_TRANSIT | OUT_FOR_DELIVERY | DELIVERED | FAILED
NotificationType: SYSTEM | ORDER_UPDATE | PAYMENT_RECEIVED | SHIPMENT_UPDATE | NEW_FOLLOWER | NEW_COMMENT | NEW_LIKE | REVIEW_REPLY | PROMOTION
```

## Full API Reference

See [API.md](./API.md) for every query, mutation, and fragment with examples.
