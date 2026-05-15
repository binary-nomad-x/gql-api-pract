import type { Context } from "@gql-prisma-api/types/context.js";

// Auth
import { AuthMutations } from "./auth/resolver.js";

// User
import { UserResolver, UserQueries, UserMutations } from "./user/resolver.js";

// Blog
import {
  PostResolver,
  PostQueries,
  PostMutations,
  TagResolver,
  CategoryResolver,
} from "./blog/resolver.js";

// Commerce
import {
  ProductResolver,
  CommerceQueries,
  CommerceMutations,
  PaymentResolver,
  RefundResolver,
  OrderResolver,
  OrderItemResolver,
  CommerceQueriesExtra,
} from "./commerce/resolver.js";

// Review
import {
  ReviewResolver,
  ReviewQueries,
  ReviewMutations,
} from "./review/resolver.js";

// Address
import {
  AddressResolver,
  AddressQueries,
  AddressMutations,
} from "./address/resolver.js";

// Cart
import {
  CartResolver,
  CartItemResolver,
  CartQueries,
  CartMutations,
} from "./cart/resolver.js";

// Wishlist
import {
  WishlistResolver,
  WishlistItemResolver,
  WishlistQueries,
  WishlistMutations,
} from "./wishlist/resolver.js";

// Coupon
import {
  CouponResolver,
  CouponQueries,
  CouponMutations,
} from "./coupon/resolver.js";

// Shipment
import {
  ShipmentResolver,
  ShipmentQueries,
  ShipmentMutations,
} from "./shipment/resolver.js";

// Notification
import {
  NotificationResolver,
  NotificationQueries,
  NotificationMutations,
} from "./notification/resolver.js";

// Follow
import {
  FollowResolver,
  FollowQueries,
  FollowMutations,
} from "./follow/resolver.js";

// SavedPost
import {
  SavedPostResolver,
  SavedPostQueries,
  SavedPostMutations,
} from "./savedPost/resolver.js";

// PostView
import { PostViewResolver, PostViewMutations } from "./postView/resolver.js";

// ProductImage
import { ProductImageResolver } from "./productImage/resolver.js";

// Stats
import { StatsQueries } from "./stats/resolver.js";

export const resolvers = {
  Query: {
    ...UserQueries,
    ...PostQueries,
    ...CommerceQueries,
    ...CommerceQueriesExtra,
    ...ReviewQueries,
    ...AddressQueries,
    ...CartQueries,
    ...WishlistQueries,
    ...CouponQueries,
    ...ShipmentQueries,
    ...NotificationQueries,
    ...FollowQueries,
    ...SavedPostQueries,
    ...StatsQueries,
  },

  Mutation: {
    ...AuthMutations,
    ...UserMutations,
    ...PostMutations,
    ...CommerceMutations,
    ...ReviewMutations,
    ...AddressMutations,
    ...CartMutations,
    ...WishlistMutations,
    ...CouponMutations,
    ...ShipmentMutations,
    ...NotificationMutations,
    ...FollowMutations,
    ...SavedPostMutations,
    ...PostViewMutations,
  },

  User: { ...UserResolver },
  Post: { ...PostResolver },
  Tag: { ...TagResolver },
  Category: { ...CategoryResolver },
  Product: { ...ProductResolver },
  Review: { ...ReviewResolver },
  Address: { ...AddressResolver },
  Cart: { ...CartResolver },
  CartItem: { ...CartItemResolver },
  Wishlist: { ...WishlistResolver },
  WishlistItem: { ...WishlistItemResolver },
  Coupon: { ...CouponResolver },
  Shipment: { ...ShipmentResolver },
  Notification: { ...NotificationResolver },
  Follow: { ...FollowResolver },
  SavedPost: { ...SavedPostResolver },
  PostView: { ...PostViewResolver },
  ProductImage: { ...ProductImageResolver },
  Payment: { ...PaymentResolver },
  Refund: { ...RefundResolver },
  Order: { ...OrderResolver },
  OrderItem: { ...OrderItemResolver },
};

export type ResolverContext = Context;
