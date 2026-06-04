import { faker } from "@faker-js/faker";
import type { SeedContext, SeedCounts } from "./types.js";
import type { User, Category, Product, OrderStatus } from "@prisma/client";

const SEED_PRODUCTS = 5000;
const SEED_ORDERS = 5000;

const ORDER_STATUSES: OrderStatus[] = [
  "PENDING", "CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED",
];
const PAYMENT_METHODS = ["CREDIT_CARD", "DEBIT_CARD", "PAYPAL", "BANK_TRANSFER", "CASH_ON_DELIVERY"] as const;
const PAYMENT_STATUSES = ["COMPLETED", "COMPLETED", "COMPLETED", "FAILED", "REFUNDED"] as const;
const REFUND_REASONS = [
  "Defective product", "Wrong item shipped", "Changed mind",
  "Item not as described", "Damaged during shipping",
];
const REFUND_STATUSES = ["PENDING", "APPROVED", "COMPLETED", "REJECTED"] as const;

export async function seedCommerce(
  ctx: SeedContext, counts: SeedCounts,
  users: User[], categories: Category[],
): Promise<{ products: Product[] }> {
  const prodCatIds = categories.slice(6).map((c) => c.id);
  const allCatIds = categories.map((c) => c.id);

  // Products — bulk insert in batches
  console.log("Seeding products...");
  const usedSkus = new Set<string>();
  const productData: Array<{
    name: string; description: string; price: number; stock: number;
    sku: string; imageUrl: string; isActive: boolean;
    sellerId: string; categoryId: string | undefined;
  }> = [];

  for (let i = 0; i < SEED_PRODUCTS; i++) {
    let sku: string;
    do { sku = faker.string.alphanumeric({ length: 10, casing: "upper" }); }
    while (usedSkus.has(sku));
    usedSkus.add(sku);
    productData.push({
      name: faker.commerce.productName(),
      description: faker.commerce.productDescription(),
      price: parseFloat(faker.commerce.price({ min: 5, max: 500 })),
      stock: faker.number.int({ min: 0, max: 200 }),
      sku,
      imageUrl: `https://picsum.photos/seed/${sku}/400/400`,
      isActive: faker.datatype.boolean(0.95),
      sellerId: faker.helpers.arrayElement(users).id,
      categoryId: faker.helpers.arrayElement(
        faker.datatype.boolean(0.7) ? prodCatIds : allCatIds,
      ),
    });
  }

  for (let i = 0; i < productData.length; i += 500) {
    await ctx.prisma.product.createMany({ data: productData.slice(i, i + 500) });
  }

  const products = await ctx.prisma.product.findMany();
  counts.products = products.length;
  console.log(`Created ${products.length} products`);

  // Orders + OrderItems — create orders first, then items in bulk
  console.log("Seeding orders...");
  const orderData: Array<{
    userId: string; status: OrderStatus; totalAmount: number; discountAmount: number; shippingAddress: string;
  }> = [];

  const orderItemData: Array<{ orderId: string; productId: string; quantity: number; unitPrice: number }> = [];

  // Pre-generate order items data grouped by order
  const tempOrderIds: string[] = [];
  for (let i = 0; i < SEED_ORDERS; i++) {
    const buyer = faker.helpers.arrayElement(users);
    const numItems = faker.number.int({ min: 1, max: 6 });
    const op = faker.helpers.arrayElements(products, numItems);
    const items = op.map((p) => ({
      productId: p.id,
      quantity: faker.number.int({ min: 1, max: 4 }),
      unitPrice: p.price,
    }));
    const total = items.reduce((s, it) => s + it.unitPrice * it.quantity, 0);

    // Use a synthetic temp ID to group items, real ID assigned after createMany
    const tempId = `temp_${i}`;
    tempOrderIds.push(tempId);
    orderData.push({
      userId: buyer.id,
      status: faker.helpers.arrayElement(ORDER_STATUSES),
      totalAmount: total,
      discountAmount: 0,
      shippingAddress: faker.location.streetAddress(),
    });
    // We can't link items until orders exist, store by index
  }

  // We need order IDs back → create orders in chunks with returning IDs
  // createMany doesn't return IDs, so use individual creates in transaction batches for order
  // Actually, let's batch orders with individual creates but in parallel transactions
  const BATCH = 100;
  const orderMap = new Map<string, string>(); // tempId → realId
  const orders: Array<{ id: string; userId: string; status: string; totalAmount: number }> = [];

  for (let i = 0; i < orderData.length; i += BATCH) {
    const batch = orderData.slice(i, i + BATCH);
    const results = await Promise.all(
      batch.map((d) => ctx.prisma.order.create({ data: d })),
    );
    for (let j = 0; j < results.length; j++) {
      const idx = i + j;
      orderMap.set(tempOrderIds[idx], results[j].id);
      orders.push(results[j]);
    }
  }

  counts.orders = orders.length;
  console.log(`Created ${orders.length} orders`);

  // Now build order items with real order IDs
  for (let i = 0; i < SEED_ORDERS; i++) {
    const realOrderId = orderMap.get(tempOrderIds[i])!;
    const buyer = faker.helpers.arrayElement(users);
    const numItems = faker.number.int({ min: 1, max: 6 });
    const op = faker.helpers.arrayElements(products, numItems);

    for (const p of op) {
      orderItemData.push({
        orderId: realOrderId,
        productId: p.id,
        quantity: faker.number.int({ min: 1, max: 4 }),
        unitPrice: p.price,
      });
    }
    
    // No need to regenerate total — it's already in orderData[i].totalAmount
  }

  // Bulk insert order items in batches
  for (let i = 0; i < orderItemData.length; i += 1000) {
    await ctx.prisma.orderItem.createMany({ data: orderItemData.slice(i, i + 1000) });
  }

  counts.orderItems = orderItemData.length;

  // Decrement stock for non-cancelled orders (batch update)
  for (let i = 0; i < orders.length; i++) {
    if (orders[i].status === "CANCELLED") continue;
    // Get items for this order
    const items = orderItemData.filter((it) => it.orderId === orders[i].id);
    for (const item of items) {
      await ctx.prisma.product.update({
        where: { id: item.productId },
        data: { stock: { decrement: item.quantity } },
      });
    }
  }

  // Payments — bulk
  const paymentData = orders
    .filter((o) => o.status !== "CANCELLED")
    .map((o) => ({
      orderId: o.id,
      amount: o.totalAmount,
      method: faker.helpers.arrayElement(PAYMENT_METHODS),
      status: faker.helpers.arrayElement(PAYMENT_STATUSES),
      transactionId: `TXN-${faker.string.alphanumeric({ length: 12, casing: "upper" })}`,
    }));

  await ctx.prisma.payment.createMany({ data: paymentData });
  counts.payments = paymentData.length;

  // Refunds — bulk
  const completedPayments = await ctx.prisma.payment.findMany({
    where: { status: "COMPLETED" }, take: 200, orderBy: { createdAt: "desc" },
  });

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

  return { products };
}
