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

// --- Seed Data Transfer Objects ---

export interface AddressSeed {
  userId: string;
  label: string;
  street: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  isDefault: boolean;
}

export interface CartItemSeed {
  cartId: string;
  productId: string;
  quantity: number;
}

export interface CommentSeed {
  content: string;
  authorId: string;
  postId: string;
}

export interface MessageSeed {
  conversationId: string;
  senderId: string;
  content: string;
}

export interface DiscountSeed {
  productId: string;
  name: string;
  type: string;
  value: number;
  startDate: Date;
  endDate: Date;
  isActive: boolean;
  maxUsage: number;
  usedCount: number;
}

export interface FollowSeed {
  followerId: string;
  followingId: string;
}

export interface InvoiceSeed {
  orderId: string;
  invoiceNumber: string;
  amount: number;
  status: string;
  dueDate: Date;
  paidAt: Date | null;
}

export interface LikeSeed {
  userId: string;
  postId: string;
}

export interface NotificationSeed {
  userId: string;
  type: string;
  title: string;
  message: string | null;
  isRead: boolean;
  link: string | null;
  readAt: Date | null;
}

export interface OrderSeed {
  id: string;
  userId: string;
  status: string;
  shippingAddress: string | null;
  couponId: string | null;
}

export interface OrderItemSeed {
  orderId: string;
  productId: string;
  quantity: number;
  unitPrice: number;
}

export interface PaymentSeed {
  orderId: string;
  amount: number;
  method: string;
  status: string;
  transactionId: string;
}

export interface PostViewSeed {
  postId: string;
  userId: string;
  ip: string;
}

export interface RefundSeed {
  paymentId: string;
  orderId: string;
  amount: number;
  reason: string;
  status: string;
}

export interface ReturnSeed {
  orderItemId: string;
  userId: string;
  reason: string;
  status: string;
  quantity: number;
  resolvedAt: Date;
}

export interface ReviewSeed {
  rating: number;
  title: string | null;
  content: string;
  productId: string;
  userId: string;
}

export interface SavedPostSeed {
  userId: string;
  postId: string;
}

export interface ShipmentSeed {
  orderId: string;
  carrier: string;
  trackingNumber: string;
  status: string;
  estimatedDelivery: Date;
  deliveredAt: Date | null;
}

export interface SubscriptionSeed {
  userId: string;
  plan: string;
  status: string;
  startDate: Date;
  endDate: Date | null;
  autoRenew: boolean;
  cancelledAt: Date | null;
}

export interface TicketReplySeed {
  ticketId: string;
  userId: string;
  content: string;
  isStaff: boolean;
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
