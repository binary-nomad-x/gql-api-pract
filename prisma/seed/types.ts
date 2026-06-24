import type { PrismaClient } from "@prisma/client";

export interface SeedContext {
  prisma: PrismaClient;
}

export interface SeedCounts {
  users: number;
  profiles: number;
  addresses: number;
  tags: number;
  categories: number;
  posts: number;
  comments: number;
  likes: number;
  follows: number;
  notifications: number;
  savedPosts: number;
  postViews: number;
  products: number;
  productImages: number;
  reviews: number;
  wishlists: number;
  wishlistItems: number;
  carts: number;
  cartItems: number;
  coupons: number;
  orders: number;
  orderItems: number;
  payments: number;
  shipments: number;
  refunds: number;
  discounts: number;
  subscriptions: number;
  conversations: number;
  participants: number;
  messages: number;
  invoices: number;
  returns: number;
  tickets: number;
  ticketReplies: number;
}

export function createEmptyCounts(): SeedCounts {
  return {
    users: 0, profiles: 0, addresses: 0, tags: 0, categories: 0,
    posts: 0, comments: 0, likes: 0, follows: 0, notifications: 0,
    savedPosts: 0, postViews: 0, products: 0, productImages: 0,
    reviews: 0, wishlists: 0, wishlistItems: 0, carts: 0, cartItems: 0,
    coupons: 0, orders: 0, orderItems: 0, payments: 0, shipments: 0,
    refunds: 0, discounts: 0, subscriptions: 0, conversations: 0,
    participants: 0, messages: 0, invoices: 0, returns: 0, tickets: 0,
    ticketReplies: 0,
  };
}
