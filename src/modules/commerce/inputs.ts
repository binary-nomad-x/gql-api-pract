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
