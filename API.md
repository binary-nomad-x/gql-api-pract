# API Reference

**Endpoint:** `POST http://localhost:4000/`

All GraphQL operations go through this single endpoint.

## Auth

### `signup(input: CreateUserInput!): AuthPayload`
Creates a new user account.
```graphql
mutation SignUp {
  signup(input: { email: "user@test.com", name: "User", password: "pass123" }) {
    token
    user { id email name role }
  }
}
```

### `login(email: String!, password: String!): AuthPayload`
Authenticates and returns a JWT token.
```graphql
mutation Login {
  login(email: "alice@test.com", password: "password123") {
    token
    user { id email role }
  }
}
```

**Set auth header:** `Authorization: Bearer <token>`

---

## Users

### Queries
| Operation | Auth | Returns |
|-----------|------|---------|
| `users` | Yes | `[User!]!` |
| `user(id: ID!)` | Yes | `User` |
| `me` | No | `User` |

### Mutations
| Operation | Auth | Returns |
|-----------|------|---------|
| `updateUser(id: ID!, input: UpdateUserInput!)` | Yes | `User!` |
| `deleteUser(id: ID!)` | Yes | `Boolean!` |
| `updateProfile(bio, avatar, phone, address)` | Yes | `Profile!` |

### Fragment
```graphql
fragment UserBasic on User {
  id email name role
}
```

---

## Posts

### Queries
| Operation | Auth | Returns |
|-----------|------|---------|
| `posts(published, search, limit, offset)` | No | `[Post!]!` |
| `post(id: ID!)` | No | `Post` |

### Mutations
| Operation | Auth | Returns |
|-----------|------|---------|
| `createPost(input: CreatePostInput!)` | Yes | `Post!` |
| `updatePost(id: ID!, input: UpdatePostInput!)` | Yes | `Post!` |
| `deletePost(id: ID!)` | Yes | `Boolean!` |
| `publishPost(id: ID!)` | Yes | `Post!` |
| `unpublishPost(id: ID!)` | Yes | `Post!` |

### Fragment
```graphql
fragment PostFull on Post {
  id title published likeCount commentCount viewCount saveCount
  author { ...UserBasic }
  tags { id name }
  categories { id name slug }
}
```

### Example Query with Fragment
```graphql
query GetPosts {
  posts(limit: 5) {
    ...PostFull
  }
}
```

---

## Products

### Queries
| Operation | Auth | Returns |
|-----------|------|---------|
| `products(categorySlug, search, minPrice, maxPrice, limit, offset)` | No | `[Product!]!` |
| `product(id: ID!)` | No | `Product` |
| `productBySku(sku: String!)` | No | `Product` |

### Mutations
| Operation | Auth | Returns |
|-----------|------|---------|
| `createProduct(input: CreateProductInput!)` | Yes | `Product!` |
| `updateProduct(id: ID!, input: UpdateProductInput!)` | Yes | `Product!` |
| `deleteProduct(id: ID!)` | Yes | `Boolean!` |

### Fragment
```graphql
fragment ProductFull on Product {
  id name price stock sku imageUrl isActive
  reviewCount averageRating
  seller { id name }
  category { id name slug }
  images { id url alt sortOrder }
}
```

---

## Orders

### Queries
| Operation | Auth | Returns |
|-----------|------|---------|
| `myOrders(status, limit, offset)` | Yes | `[Order!]!` |
| `order(id: ID!)` | Yes | `Order` |

### Mutations
| Operation | Auth | Returns |
|-----------|------|---------|
| `placeOrder(input: PlaceOrderInput!)` | Yes | `Order!` |
| `cancelOrder(id: ID!)` | Yes | `Order!` |
| `updateOrderStatus(id: ID!, status: OrderStatus!)` | Yes | `Order!` |

### Example: Place Order
```graphql
mutation PlaceOrder {
  placeOrder(input: {
    items: [{ productId: "<id>", quantity: 2 }],
    shippingAddress: "123 Main St",
    couponCode: "WELCOME10"
  }) {
    id status totalAmount discountAmount
    items { id quantity unitPrice product { name price } }
  }
}
```

### Fragment
```graphql
fragment OrderFull on Order {
  id status totalAmount discountAmount itemCount
  user { id name }
  items { id quantity unitPrice product { name sku } }
  payment { id amount method status }
  shipments { id carrier trackingNumber status }
  coupon { id code discountPercent }
}
```

---

## Payments

| Operation | Auth | Returns |
|-----------|------|---------|
| `myPayments(status, limit, offset)` | Yes | `[Payment!]!` |
| `payment(id: ID!)` | Yes | `Payment` |
| `processPayment(input: ProcessPaymentInput!)` | Yes | `Payment!` |

---

## Refunds

| Operation | Auth | Returns |
|-----------|------|---------|
| `myRefunds(status, limit, offset)` | Yes | `[Refund!]!` |
| `refund(id: ID!)` | Yes | `Refund` |
| `createRefund(input: CreateRefundInput!)` | Yes | `Refund!` |
| `updateRefundStatus(id: ID!, status: RefundStatus!)` | Yes | `Refund!` |

---

## Reviews

| Operation | Auth | Returns |
|-----------|------|---------|
| `reviews(productId, limit, offset)` | No | `[Review!]!` |
| `review(id: ID!)` | No | `Review` |
| `createReview(input: CreateReviewInput!)` | Yes | `Review!` |
| `deleteReview(id: ID!)` | Yes | `Boolean!` |

---

## Addresses

| Operation | Auth | Returns |
|-----------|------|---------|
| `myAddresses` | Yes | `[Address!]!` |
| `address(id: ID!)` | Yes | `Address` |
| `createAddress(input: CreateAddressInput!)` | Yes | `Address!` |
| `updateAddress(id: ID!, input: UpdateAddressInput!)` | Yes | `Address!` |
| `deleteAddress(id: ID!)` | Yes | `Boolean!` |
| `setDefaultAddress(id: ID!)` | Yes | `Address!` |

---

## Cart

| Operation | Auth | Returns |
|-----------|------|---------|
| `myCart` | Yes | `Cart` |
| `addToCart(input: AddToCartInput!)` | Yes | `Cart!` |
| `updateCartItem(input: UpdateCartItemInput!)` | Yes | `Cart!` |
| `removeFromCart(productId: ID!)` | Yes | `Cart!` |
| `clearCart` | Yes | `Cart!` |

---

## Wishlists

| Operation | Auth | Returns |
|-----------|------|---------|
| `myWishlists` | Yes | `[Wishlist!]!` |
| `wishlist(id: ID!)` | Yes | `Wishlist` |
| `createWishlist(input: CreateWishlistInput!)` | Yes | `Wishlist!` |
| `addToWishlist(input: AddToWishlistInput!)` | Yes | `Wishlist!` |
| `removeFromWishlist(wishlistId, productId)` | Yes | `Wishlist!` |
| `deleteWishlist(id: ID!)` | Yes | `Boolean!` |

---

## Coupons

| Operation | Auth | Returns |
|-----------|------|---------|
| `couponByCode(code: String!)` | No | `Coupon` |
| `createCoupon(input: CreateCouponInput!)` | Yes | `Coupon!` |

---

## Notifications

| Operation | Auth | Returns |
|-----------|------|---------|
| `myNotifications(limit, offset)` | Yes | `[Notification!]!` |
| `unreadNotificationCount` | Yes | `Int!` |
| `markNotificationRead(id: ID!)` | Yes | `Notification!` |
| `markAllNotificationsRead` | Yes | `Boolean!` |

---

## Social

| Operation | Auth | Returns |
|-----------|------|---------|
| `followers(userId: ID!)` | No | `[Follow!]!` |
| `following(userId: ID!)` | No | `[Follow!]!` |
| `toggleFollow(userId: ID!)` | No | `Follow!` |
| `mySavedPosts(limit, offset)` | Yes | `[SavedPost!]!` |
| `toggleSavePost(postId: ID!)` | Yes | `SavedPost!` |
| `recordPostView(postId: ID!)` | No | `PostView!` |

---

## Stats

| Operation | Auth | Returns |
|-----------|------|---------|
| `stats` | No | `Stats!` |

```graphql
query GetAllStats {
  stats {
    totalUsers totalPosts totalProducts totalOrders
    totalPayments totalReviews totalNotifications
  }
}
```

---

## Enums Reference

```
Role: USER | ADMIN | MODERATOR
OrderStatus: PENDING | CONFIRMED | PROCESSING | SHIPPED | DELIVERED | CANCELLED
PaymentMethod: CREDIT_CARD | DEBIT_CARD | PAYPAL | BANK_TRANSFER | CASH_ON_DELIVERY
PaymentStatus: PENDING | COMPLETED | FAILED | REFUNDED
RefundStatus: PENDING | APPROVED | REJECTED | COMPLETED
ShipmentStatus: PENDING | PICKED_UP | IN_TRANSIT | OUT_FOR_DELIVERY | DELIVERED | FAILED
NotificationType: SYSTEM | ORDER_UPDATE | PAYMENT_RECEIVED | SHIPMENT_UPDATE | NEW_FOLLOWER | NEW_COMMENT | NEW_LIKE | REVIEW_REPLY | PROMOTION
```
