// Strongly-typed input shapes matching GraphQL input types

export interface CreateUserInput {
  email: string;
  name?: string | null;
  password: string;
}

export interface UpdateUserInput {
  name?: string | null;
  email?: string | null;
  password?: string | null;
}

export interface CreatePostInput {
  title: string;
  content?: string | null;
  published?: boolean | null;
  tags?: string[];
  categories?: string[];
}

export interface UpdatePostInput {
  title?: string | null;
  content?: string | null;
  published?: boolean | null;
}

export interface CreateCommentInput {
  content: string;
  postId: string;
}

export interface CreateCategoryInput {
  name: string;
  slug: string;
  description?: string | null;
}

export interface CreateProductInput {
  name: string;
  description?: string | null;
  price: number;
  stock: number;
  sku: string;
  imageUrl?: string | null;
  categorySlug?: string | null;
}

export interface UpdateProductInput {
  name?: string | null;
  description?: string | null;
  price?: number | null;
  stock?: number | null;
  imageUrl?: string | null;
  isActive?: boolean | null;
  categorySlug?: string | null;
}

export interface CreateReviewInput {
  rating: number;
  title?: string | null;
  content?: string | null;
  productId: string;
}

export interface OrderItemInput {
  productId: string;
  quantity: number;
}

export interface PlaceOrderInput {
  items: OrderItemInput[];
  shippingAddress?: string | null;
  couponCode?: string | null;
}

export interface ProcessPaymentInput {
  orderId: string;
  method: string;
}

export interface CreateRefundInput {
  paymentId: string;
  orderId: string;
  amount: number;
  reason?: string | null;
}

export interface CreateAddressInput {
  label?: string | null;
  street: string;
  city: string;
  state?: string | null;
  zip: string;
  country?: string | null;
  isDefault?: boolean | null;
}

export interface UpdateAddressInput {
  label?: string | null;
  street?: string | null;
  city?: string | null;
  state?: string | null;
  zip?: string | null;
  country?: string | null;
  isDefault?: boolean | null;
}

export interface CreateWishlistInput {
  name?: string | null;
}

export interface AddToWishlistInput {
  wishlistId: string;
  productId: string;
  note?: string | null;
}

export interface AddToCartInput {
  productId: string;
  quantity?: number | null;
}

export interface UpdateCartItemInput {
  productId: string;
  quantity: number;
}

export interface CreateCouponInput {
  code: string;
  description?: string | null;
  discountPercent?: number | null;
  discountAmount?: number | null;
  minPurchase?: number | null;
  maxUses?: number | null;
  isActive?: boolean | null;
  expiresAt?: string | null;
}

export interface CreateShipmentInput {
  orderId: string;
  carrier: string;
  trackingNumber: string;
  estimatedDelivery?: string | null;
}

export interface CreateDiscountInput {
  productId: string;
  name: string;
  type: string;
  value: number;
  startDate: string;
  endDate: string;
  maxUsage?: number | null;
}

export interface UpdateDiscountInput {
  name?: string | null;
  value?: number | null;
  startDate?: string | null;
  endDate?: string | null;
  isActive?: boolean | null;
  maxUsage?: number | null;
}
