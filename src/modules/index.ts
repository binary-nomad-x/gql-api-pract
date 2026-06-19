import type { Context } from "@gql-prisma-api/types/context.js";

import { Mutation as AuthMutation } from "./auth/resolver.js";
import { User, Query as UserQuery, Mutation as UserMutation } from "./user/resolver.js";
import { Post, Tag, Category, Query as PostQuery, Mutation as PostMutation } from "./blog/resolver.js";
import { Product, Query as ProductQuery, Mutation as ProductMutation } from "./product/resolver.js";
import { Order, OrderItem, Query as OrderQuery, Mutation as OrderMutation } from "./order/resolver.js";
import { Payment, Query as PaymentQuery, Mutation as PaymentMutation } from "./payment/resolver.js";
import { Refund, Query as RefundQuery, Mutation as RefundMutation } from "./refund/resolver.js";
import { Review, Query as ReviewQuery, Mutation as ReviewMutation } from "./review/resolver.js";
import { Address, Query as AddressQuery, Mutation as AddressMutation } from "./address/resolver.js";
import { Cart, CartItem, Query as CartQuery, Mutation as CartMutation } from "./cart/resolver.js";
import { Wishlist, WishlistItem, Query as WishlistQuery, Mutation as WishlistMutation } from "./wishlist/resolver.js";
import { Coupon, Query as CouponQuery, Mutation as CouponMutation } from "./coupon/resolver.js";
import { Shipment, Query as ShipmentQuery, Mutation as ShipmentMutation } from "./shipment/resolver.js";
import { Notification, Query as NotificationQuery, Mutation as NotificationMutation } from "./notification/resolver.js";
import { Follow, Query as FollowQuery, Mutation as FollowMutation } from "./follow/resolver.js";
import { SavedPost, Query as SavedPostQuery, Mutation as SavedPostMutation } from "./savedPost/resolver.js";
import { PostView, Mutation as PostViewMutation } from "./postView/resolver.js";
import { ProductImage } from "./productImage/resolver.js";
import { Query as StatsQuery } from "./stats/resolver.js";
import { Subscription, Query as SubscriptionQuery, Mutation as SubscriptionMutation } from "./subscription/resolver.js";
import { Discount, Query as DiscountQuery, Mutation as DiscountMutation } from "./discount/resolver.js";
import { Invoice, Query as InvoiceQuery, Mutation as InvoiceMutation } from "./invoice/resolver.js";
import { ReturnRequest, Query as ReturnQuery, Mutation as ReturnMutation } from "./return/resolver.js";
import { SupportTicket, TicketReply, Query as SupportQuery, Mutation as SupportMutation } from "./support/resolver.js";
import { Conversation, ConversationParticipant, Message, Query as ConversationQuery, Mutation as ConversationMutation } from "./conversation/resolver.js";

export const resolvers = {
  Query: {
    ...UserQuery,
    ...PostQuery,
    ...ProductQuery,
    ...OrderQuery,
    ...PaymentQuery,
    ...RefundQuery,
    ...ReviewQuery,
    ...AddressQuery,
    ...CartQuery,
    ...WishlistQuery,
    ...CouponQuery,
    ...ShipmentQuery,
    ...NotificationQuery,
    ...FollowQuery,
    ...SavedPostQuery,
    ...StatsQuery,
    ...SubscriptionQuery,
    ...DiscountQuery,
    ...InvoiceQuery,
    ...ReturnQuery,
    ...SupportQuery,
    ...ConversationQuery,
  },

  Mutation: {
    ...AuthMutation,
    ...UserMutation,
    ...PostMutation,
    ...ProductMutation,
    ...OrderMutation,
    ...PaymentMutation,
    ...RefundMutation,
    ...ReviewMutation,
    ...AddressMutation,
    ...CartMutation,
    ...WishlistMutation,
    ...CouponMutation,
    ...ShipmentMutation,
    ...NotificationMutation,
    ...FollowMutation,
    ...SavedPostMutation,
    ...PostViewMutation,
    ...SubscriptionMutation,
    ...DiscountMutation,
    ...InvoiceMutation,
    ...ReturnMutation,
    ...SupportMutation,
    ...ConversationMutation,
  },

  User: { ...User },
  Post: { ...Post },
  Tag: { ...Tag },
  Category: { ...Category },
  Product: { ...Product },
  Review: { ...Review },
  Address: { ...Address },
  Cart: { ...Cart },
  CartItem: { ...CartItem },
  Wishlist: { ...Wishlist },
  WishlistItem: { ...WishlistItem },
  Coupon: { ...Coupon },
  Shipment: { ...Shipment },
  Notification: { ...Notification },
  Follow: { ...Follow },
  SavedPost: { ...SavedPost },
  PostView: { ...PostView },
  ProductImage: { ...ProductImage },
  Payment: { ...Payment },
  Refund: { ...Refund },
  Order: { ...Order },
  OrderItem: { ...OrderItem },
  Subscription: { ...Subscription },
  Discount: { ...Discount },
  Invoice: { ...Invoice },
  ReturnRequest: { ...ReturnRequest },
  SupportTicket: { ...SupportTicket },
  TicketReply: { ...TicketReply },
  Conversation: { ...Conversation },
  ConversationParticipant: { ...ConversationParticipant },
  Message: { ...Message },
};

export type ResolverContext = Context;
