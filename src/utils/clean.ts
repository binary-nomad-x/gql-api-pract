// Remove null values so Prisma doesn't reject them
// GraphQL sends `null` for omitted optional fields, Prisma wants `undefined`
export function clean<T extends Record<string, unknown>>(obj: T): T {
  const result = { ...obj };
  for (const key of Object.keys(result)) {
    if (result[key] === null) {
      delete result[key];
    }
  }
  return result;
}

// Remove null and also remove keys with undefined values
export function compact<T extends Record<string, unknown>>(obj: T): Partial<T> {
  return clean(obj);
}

// Prisma enum types
export type OrderStatusEnum = "PENDING" | "CONFIRMED" | "PROCESSING" | "SHIPPED" | "DELIVERED" | "CANCELLED";
export type RefundStatusEnum = "PENDING" | "APPROVED" | "REJECTED" | "COMPLETED";
export type PaymentMethodEnum = "CREDIT_CARD" | "DEBIT_CARD" | "PAYPAL" | "BANK_TRANSFER" | "CASH_ON_DELIVERY";
export type ShipmentStatusEnum = "PENDING" | "PICKED_UP" | "IN_TRANSIT" | "OUT_FOR_DELIVERY" | "DELIVERED" | "FAILED";
