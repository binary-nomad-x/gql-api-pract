import type { PrismaClient } from "@prisma/client";

export interface SeedContext {
  prisma: PrismaClient;
}

export interface SeedCounts {
  users: number; profiles: number; categories: number; tags: number;
  posts: number; comments: number; likes: number;
  products: number; orders: number; orderItems: number;
  payments: number; refunds: number; reviews: number;
  addresses: number; wishlists: number; wishlistItems: number;
  carts: number; cartItems: number; coupons: number;
  shipments: number; notifications: number; follows: number;
  savedPosts: number; postViews: number; productImages: number;
  subscriptions: number; discounts: number;
  conversations: number; messages: number;
  invoices: number; returns: number; tickets: number; ticketReplies: number;
}

export function createEmptyCounts(): SeedCounts {
  return {
    users: 0, profiles: 0, categories: 0, tags: 0,
    posts: 0, comments: 0, likes: 0,
    products: 0, orders: 0, orderItems: 0,
    payments: 0, refunds: 0, reviews: 0,
    addresses: 0, wishlists: 0, wishlistItems: 0,
    carts: 0, cartItems: 0, coupons: 0,
    shipments: 0, notifications: 0, follows: 0,
    savedPosts: 0, postViews: 0, productImages: 0,
    subscriptions: 0, discounts: 0,
    conversations: 0, messages: 0,
    invoices: 0, returns: 0, tickets: 0, ticketReplies: 0,
  };
}
