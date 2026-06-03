import { faker } from "@faker-js/faker";
import type { SeedContext, SeedCounts } from "./types.js";
import type { User, Category, Post, Product, Order } from "@prisma/client";

const SEED_PRODUCTS = 2000;
const SEED_ORDERS = 2000;

const ORDER_STATUSES: Array<"PENDING" | "CONFIRMED" | "PROCESSING" | "SHIPPED" | "DELIVERED" | "CANCELLED"> = [
  "PENDING", "CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED",
];

const PAYMENT_METHODS: Array<"CREDIT_CARD" | "DEBIT_CARD" | "PAYPAL" | "BANK_TRANSFER" | "CASH_ON_DELIVERY"> = [
  "CREDIT_CARD", "DEBIT_CARD", "PAYPAL", "BANK_TRANSFER", "CASH_ON_DELIVERY",
];

const PAYMENT_STATUSES: Array<"COMPLETED" | "FAILED" | "REFUNDED"> = [
  "COMPLETED", "COMPLETED", "COMPLETED", "FAILED", "REFUNDED",
];

const REFUND_REASONS = [
  "Defective product", "Wrong item shipped", "Changed mind",
  "Item not as described", "Damaged during shipping",
];

const REFUND_STATUSES: Array<"PENDING" | "APPROVED" | "COMPLETED" | "REJECTED"> = [
  "PENDING", "APPROVED", "COMPLETED", "REJECTED",
];

/**
 * Seed products, orders (with items), payments, and refunds.
 * Requires users, categories already seeded.
 */
export async function seedCommerce(
  ctx: SeedContext,
  counts: SeedCounts,
  users: User[],
  categories: Category[],
): Promise<{ products: Product[]; orders: Order[] }> {
  const productCatIds = categories.slice(6).map((c: Category) => c.id);
  const allCategoryIds = categories.map((c: Category) => c.id);
  const usedSkus = new Set<string>();

  // Products
  console.log("Seeding products...");
  const products: Product[] = [];
  for (let i = 0; i < SEED_PRODUCTS; i++) {
    let sku: string;
    do {
      sku = faker.string.alphanumeric({ length: 10, casing: "upper" });
    } while (usedSkus.has(sku));
    usedSkus.add(sku);

    products.push(
      await ctx.prisma.product.create({
        data: {
          name: faker.commerce.productName(),
          description: faker.commerce.productDescription(),
          price: parseFloat(faker.commerce.price({ min: 5, max: 500 })),
          stock: faker.number.int({ min: 0, max: 200 }),
          sku,
          imageUrl: `https://picsum.photos/seed/${sku}/400/400`,
          isActive: faker.datatype.boolean(0.95),
          sellerId: faker.helpers.arrayElement(users).id,
          categoryId: faker.helpers.arrayElement(
            faker.datatype.boolean(0.7) ? productCatIds : allCategoryIds,
          ),
        },
      }),
    );

    if ((i + 1) % 100 === 0) console.log(`  ...${i + 1} products`);
  }
  counts.products = products.length;
  console.log(`Created ${products.length} products`);

  // Orders
  console.log("Seeding orders...");
  const orders: Order[] = [];
  for (let i = 0; i < SEED_ORDERS; i++) {
    const buyer = faker.helpers.arrayElement(users);
    const numItems = faker.number.int({ min: 1, max: 6 });
    const orderProducts = faker.helpers.arrayElements(products, numItems);
    const items = orderProducts.map((p: Product) => ({
      productId: p.id,
      quantity: faker.number.int({ min: 1, max: 4 }),
      unitPrice: p.price,
    }));
    const totalAmount = items.reduce(
      (sum: number, item) => sum + item.unitPrice * item.quantity,
      0,
    );

    const order = await ctx.prisma.order.create({
      data: {
        userId: buyer.id,
        status: faker.helpers.arrayElement(ORDER_STATUSES),
        totalAmount,
        shippingAddress: faker.location.streetAddress(),
        items: { create: items },
      },
      include: { items: true },
    });
    orders.push(order);
    if ((i + 1) % 100 === 0) console.log(`  ...${i + 1} orders`);
  }
  counts.orders = orders.length;
  console.log(`Created ${orders.length} orders`);

  // Decrement stock for non-cancelled orders
  for (const order of orders) {
    if (order.status === "CANCELLED") continue;
    for (const item of (order as Order & { items: Array<{ productId: string; quantity: number }> }).items) {
      await ctx.prisma.product.update({
        where: { id: item.productId },
        data: { stock: { decrement: item.quantity } },
      });
    }
  }

  // Payments
  let paymentCount = 0;
  for (const order of orders) {
    if (order.status === "CANCELLED") continue;
    await ctx.prisma.payment.create({
      data: {
        orderId: order.id,
        amount: order.totalAmount,
        method: faker.helpers.arrayElement(PAYMENT_METHODS),
        status: faker.helpers.arrayElement(PAYMENT_STATUSES),
        transactionId: `TXN-${faker.string.alphanumeric({ length: 12, casing: "upper" })}`,
      },
    });
    paymentCount++;
  }
  counts.payments = paymentCount;

  // Refunds (for the most recent COMPLETED payments)
  const deliveredPayments = await ctx.prisma.payment.findMany({
    where: { status: "COMPLETED" },
    take: 100,
    orderBy: { createdAt: "desc" },
  });
  let refundCount = 0;
  for (const payment of deliveredPayments) {
    const refundAmount = parseFloat(faker.commerce.price({ min: 10, max: payment.amount }));
    await ctx.prisma.refund.create({
      data: {
        paymentId: payment.id,
        orderId: payment.orderId,
        amount: Math.min(refundAmount, payment.amount),
        reason: faker.helpers.arrayElement(REFUND_REASONS),
        status: faker.helpers.arrayElement(REFUND_STATUSES),
      },
    });
    refundCount++;
  }
  counts.refunds = refundCount;

  return { products, orders };
}
