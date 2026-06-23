import { faker } from "@faker-js/faker";
import type { SeedContext, SeedCounts } from "./types.js";
import { generateIds } from "./utils.js";

const SEED_PRODUCTS = 5000;
const SEED_ORDERS = 5000;

const ORDER_STATUSES = [
  "PENDING", "CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED",
];
const PAYMENT_METHODS = [
  "CREDIT_CARD", "DEBIT_CARD", "PAYPAL", "BANK_TRANSFER", "CASH_ON_DELIVERY",
] as const;
const PAYMENT_STATUSES = [
  "COMPLETED", "COMPLETED", "COMPLETED", "FAILED", "REFUNDED",
] as const;
const REFUND_REASONS = [
  "Defective product", "Wrong item shipped", "Changed mind",
  "Item not as described", "Damaged during shipping",
];
const REFUND_STATUSES = ["PENDING", "APPROVED", "COMPLETED", "REJECTED"] as const;

export async function seedCommerce(
  ctx: SeedContext,
  counts: SeedCounts,
  userIds: string[],
  catIds: string[],
): Promise<{ productIds: string[] }> {
  const prodCatIds = catIds.slice(6);

  // Products — pre-generate IDs
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
    };
  });

  for (let i = 0; i < productIds.length; i += 500) {
    await ctx.prisma.product.createMany({ data: productData.slice(i, i + 500) });
  }
  counts.products = productIds.length;
  console.log(`Created ${productIds.length} products`);

  // Orders — pre-generate IDs and build items inline
  console.log("Seeding orders...");
  const orderIds = generateIds(SEED_ORDERS);
  const orderData: Array<{
    id: string;
    userId: string;
    status: string;
    totalAmount: number;
    discountAmount: number;
    shippingAddress: string;
  }> = [];

  // Build items grouped by order in a Map to avoid O(n²) later
  const orderItemsByOrder = new Map<string, Array<{
    productId: string;
    quantity: number;
    unitPrice: number;
  }>>();

  for (let i = 0; i < SEED_ORDERS; i++) {
    const buyerId = faker.helpers.arrayElement(userIds);
    const numItems = faker.number.int({ min: 1, max: 6 });
    const selectedProducts = faker.helpers.arrayElements(productIds, numItems);
    const items = selectedProducts.map((pid) => ({
      productId: pid,
      quantity: faker.number.int({ min: 1, max: 4 }),
      unitPrice: 0, // filled after we know products
    }));
    orderItemsByOrder.set(orderIds[i], items);
  }

  // Resolve prices from productData
  const productPriceMap = new Map(productData.map((p) => [p.id, p.price]));
  for (const [, items] of orderItemsByOrder) {
    for (const item of items) {
      item.unitPrice = productPriceMap.get(item.productId) ?? 0;
    }
  }

  for (const [oid, items] of orderItemsByOrder) {
    const total = items.reduce((s, it) => s + it.unitPrice * it.quantity, 0);
    orderData.push({
      id: oid,
      userId: faker.helpers.arrayElement(userIds),
      status: faker.helpers.arrayElement(ORDER_STATUSES),
      totalAmount: total,
      discountAmount: 0,
      shippingAddress: faker.location.streetAddress(),
    });
  }

  for (let i = 0; i < orderData.length; i += 500) {
    await ctx.prisma.order.createMany({ data: orderData.slice(i, i + 500) });
  }
  counts.orders = orderData.length;
  console.log(`Created ${orderData.length} orders`);

  // Order items — bulk insert from the pre-built map
  const orderItemData: Array<{
    orderId: string;
    productId: string;
    quantity: number;
    unitPrice: number;
  }> = [];
  for (const [oid, items] of orderItemsByOrder) {
    for (const item of items) {
      orderItemData.push({
        orderId: oid,
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
      });
    }
  }

  for (let i = 0; i < orderItemData.length; i += 1000) {
    await ctx.prisma.orderItem.createMany({ data: orderItemData.slice(i, i + 1000) });
  }
  counts.orderItems = orderItemData.length;

  // Stock decrement — aggregate per product, batch update
  const stockChanges = new Map<string, number>();
  for (const [oid, items] of orderItemsByOrder) {
    const orderStatus = orderData.find((o) => o.id === oid)!.status;
    if (orderStatus === "CANCELLED") continue;
    for (const item of items) {
      const prev = stockChanges.get(item.productId) ?? 0;
      stockChanges.set(item.productId, prev + item.quantity);
    }
  }
  await Promise.all(
    Array.from(stockChanges.entries()).map(([pid, qty]) =>
      ctx.prisma.product.update({
        where: { id: pid },
        data: { stock: { decrement: qty } },
      }),
    ),
  );

  // Payments — pre-generate IDs, bulk from non-cancelled orders
  const nonCancelled = orderData.filter((o) => o.status !== "CANCELLED");
  const paymentIds = generateIds(nonCancelled.length);
  const paymentData = nonCancelled.map((o, i) => ({
    id: paymentIds[i],
    orderId: o.id,
    amount: o.totalAmount,
    method: faker.helpers.arrayElement(PAYMENT_METHODS),
    status: faker.helpers.arrayElement(PAYMENT_STATUSES),
    transactionId: `TXN-${faker.string.alphanumeric({ length: 12, casing: "upper" })}`,
  }));

  for (let i = 0; i < paymentData.length; i += 1000) {
    await ctx.prisma.payment.createMany({ data: paymentData.slice(i, i + 1000) });
  }
  counts.payments = paymentData.length;

  // Refunds — bulk from a limited sample of completed payments
  const completedPayments = paymentData.filter((p) => p.status === "COMPLETED").slice(0, 200);
  const refundData = completedPayments.map((p) => {
    const amt = parseFloat(faker.commerce.price({ min: 10, max: Math.min(p.amount, 200) }));
    return {
      paymentId: p.id,
      orderId: p.orderId,
      amount: Math.min(amt, p.amount),
      reason: faker.helpers.arrayElement(REFUND_REASONS),
      status: faker.helpers.arrayElement(REFUND_STATUSES),
    };
  });

  await ctx.prisma.refund.createMany({ data: refundData });
  counts.refunds = refundData.length;

  return { productIds };
}
