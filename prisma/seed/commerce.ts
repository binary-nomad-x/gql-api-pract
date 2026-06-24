import { faker } from "@faker-js/faker";
import type { SeedContext, SeedCounts } from "./types.js";
import { generateIds, bulkInsert } from "./utils.js";

const SEED_PRODUCTS = 5000;
const SEED_ORDERS = 5000;

const ORDER_STATUSES = ["PENDING", "CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"];
const PAYMENT_METHODS = ["CREDIT_CARD", "DEBIT_CARD", "PAYPAL", "BANK_TRANSFER", "CASH_ON_DELIVERY"] as const;
const PAYMENT_STATUSES = ["COMPLETED", "COMPLETED", "COMPLETED", "FAILED", "REFUNDED"] as const;
const REFUND_REASONS = ["Defective product", "Wrong item shipped", "Changed mind", "Item not as described", "Damaged during shipping"];
const REFUND_STATUSES = ["PENDING", "APPROVED", "COMPLETED", "REJECTED"] as const;

export async function seedCommerce(
  ctx: SeedContext,
  counts: SeedCounts,
  userIds: string[],
  catIds: string[],
): Promise<{ productIds: string[] }> {
  const prodCatIds = catIds.slice(6);

  // Products
  console.log("Seeding products...");
  const productIds = generateIds(SEED_PRODUCTS);
  const usedSkus = new Set<string>();
  const productData = productIds.map((id) => {
    let sku: string;
    do { sku = faker.string.alphanumeric({ length: 10, casing: "upper" }); } while (usedSkus.has(sku));
    usedSkus.add(sku);
    return {
      id,
      name: faker.commerce.productName(),
      description: faker.commerce.productDescription(),
      price: parseFloat(faker.commerce.price({ min: 5, max: 500 })),
      stock: faker.number.int({ min: 0, max: 200 }),
      sku,
      imageUrl: `https://picsum.photos/seed/${sku}/400/400`,
      isActive: faker.datatype.boolean(0.95),
      sellerId: faker.helpers.arrayElement(userIds),
      categoryId: faker.helpers.arrayElement(
        faker.datatype.boolean(0.7) ? prodCatIds : catIds,
      ),
      updatedAt: new Date(),
    };
  });
  await bulkInsert(ctx.pool, "products", productData, 500);
  counts.products = productIds.length;
  console.log(`Created ${productIds.length} products`);

  // Orders + OrderItems — build inline with pre-generated IDs
  console.log("Seeding orders...");
  const orderIds = generateIds(SEED_ORDERS);
  const orderData: Array<{
    id: string; userId: string; status: string;
    totalAmount: number; discountAmount: number; shippingAddress: string;
  }> = [];

  const orderItemsByOrder = new Map<string, Array<{ productId: string; quantity: number; unitPrice: number }>>();
  const productPriceMap = new Map(productData.map((p) => [p.id, p.price]));

  for (const oid of orderIds) {
    const numItems = faker.number.int({ min: 1, max: 6 });
    const selectedProducts = faker.helpers.arrayElements(productIds, numItems);
    const items = selectedProducts.map((pid) => ({
      productId: pid,
      quantity: faker.number.int({ min: 1, max: 4 }),
      unitPrice: productPriceMap.get(pid) ?? 0,
    }));
    const total = items.reduce((s, it) => s + it.unitPrice * it.quantity, 0);
    orderItemsByOrder.set(oid, items);
    orderData.push({
      id: oid,
      userId: faker.helpers.arrayElement(userIds),
      status: faker.helpers.arrayElement(ORDER_STATUSES),
      totalAmount: total,
      discountAmount: 0,
      shippingAddress: faker.location.streetAddress(),
      updatedAt: new Date(),
    });
  }

  await bulkInsert(ctx.pool, "orders", orderData, 500);
  counts.orders = orderData.length;
  console.log(`Created ${orderData.length} orders`);

  // Order items — build once from the map
  const orderItemCount = Array.from(orderItemsByOrder.values()).reduce((s, items) => s + items.length, 0);
  const orderItemIds = generateIds(orderItemCount);
  let oiIdx = 0;
  const orderItemData: Array<{ id: string; orderId: string; productId: string; quantity: number; unitPrice: number }> = [];
  for (const [oid, items] of orderItemsByOrder) {
    for (const item of items) {
      orderItemData.push({ id: orderItemIds[oiIdx++], orderId: oid, ...item });
    }
  }
  await bulkInsert(ctx.pool, "order_items", orderItemData, 1000);
  counts.orderItems = orderItemData.length;

  // Stock decrement — aggregate per product, batch update
  const stockChanges = new Map<string, number>();
  for (const [oid, items] of orderItemsByOrder) {
    const status = orderData.find((o) => o.id === oid)!.status;
    if (status === "CANCELLED") continue;
    for (const item of items) {
      stockChanges.set(item.productId, (stockChanges.get(item.productId) ?? 0) + item.quantity);
    }
  }
  // Use direct parameterized UPDATE for each product
  for (const [pid, qty] of stockChanges) {
    await ctx.pool.query(
      `UPDATE "products" SET "stock" = "stock" - $1 WHERE "id" = $2`,
      [qty, pid],
    );
  }

  // Payments
  const nonCancelled = orderData.filter((o) => o.status !== "CANCELLED");
  const paymentIds = generateIds(nonCancelled.length);
  const paymentData = nonCancelled.map((o, i) => ({
    id: paymentIds[i],
    orderId: o.id,
    amount: o.totalAmount,
    method: faker.helpers.arrayElement(PAYMENT_METHODS),
    status: faker.helpers.arrayElement(PAYMENT_STATUSES),
    transactionId: `TXN-${faker.string.alphanumeric({ length: 12, casing: "upper" })}`,
    updatedAt: new Date(),
  }));
  await bulkInsert(ctx.pool, "payments", paymentData, 1000);
  counts.payments = paymentData.length;

  // Refunds
  const completedPayments = paymentData.filter((p) => p.status === "COMPLETED").slice(0, 200);
  const refundIds = generateIds(completedPayments.length);
  const refundData = completedPayments.map((p, i) => {
    const amt = parseFloat(faker.commerce.price({ min: 10, max: Math.min(p.amount, 200) }));
    return {
      id: refundIds[i],
      paymentId: p.id,
      orderId: p.orderId,
      amount: Math.min(amt, p.amount),
      reason: faker.helpers.arrayElement(REFUND_REASONS),
      status: faker.helpers.arrayElement(REFUND_STATUSES),
      updatedAt: new Date(),
    };
  });
  await bulkInsert(ctx.pool, "refunds", refundData);
  counts.refunds = refundData.length;

  return { productIds };
}
