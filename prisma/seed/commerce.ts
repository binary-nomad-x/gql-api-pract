import { faker } from "@faker-js/faker";
import type { SeedContext, SeedCounts } from "./types.js";
import type { User, Category, Product, Order, OrderStatus, PaymentMethod, PaymentStatus, RefundStatus } from "@prisma/client";

const SEED_PRODUCTS = 2000;
const SEED_ORDERS = 2000;

const ORDER_STATUSES: OrderStatus[] = [
  "PENDING", "CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED",
];

const PAYMENT_METHODS: PaymentMethod[] = [
  "CREDIT_CARD", "DEBIT_CARD", "PAYPAL", "BANK_TRANSFER", "CASH_ON_DELIVERY",
];

const PAYMENT_STATUSES: PaymentStatus[] = [
  "COMPLETED", "COMPLETED", "COMPLETED", "FAILED", "REFUNDED",
];

const REFUND_REASONS = [
  "Defective product", "Wrong item shipped", "Changed mind",
  "Item not as described", "Damaged during shipping",
];

const REFUND_STATUSES: RefundStatus[] = [
  "PENDING", "APPROVED", "COMPLETED", "REJECTED",
];

export async function seedCommerce(
  ctx: SeedContext,
  counts: SeedCounts,
  users: User[],
  categories: Category[],
): Promise<{ products: Product[]; orders: Order[] }> {
  const productCatIds = categories.slice(6).map((c) => c.id);
  const allCategoryIds = categories.map((c) => c.id);

  // Products — bulk insert, then reload by sku
  console.log("Seeding products...");
  const usedSkus = new Set<string>();
  const productData: Array<{
    name: string; description: string; price: number; stock: number;
    sku: string; imageUrl: string; isActive: boolean;
    sellerId: string; categoryId: string | undefined;
  }> = [];

  for (let i = 0; i < SEED_PRODUCTS; i++) {
    let sku: string;
    do {
      sku = faker.string.alphanumeric({ length: 10, casing: "upper" });
    } while (usedSkus.has(sku));
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
        faker.datatype.boolean(0.7) ? productCatIds : allCategoryIds,
      ),
    });
  }

  // Insert in batches of 500 to avoid overwhelming the DB
  for (let i = 0; i < productData.length; i += 500) {
    await ctx.prisma.product.createMany({ data: productData.slice(i, i + 500) });
  }
  const products = await ctx.prisma.product.findMany();
  counts.products = products.length;
  console.log(`Created ${products.length} products`);

  // Orders — need nested items, so individual creates; batch transactions for speed
  console.log("Seeding orders...");
  const orders: Order[] = [];
  for (let i = 0; i < SEED_ORDERS; i++) {
    const buyer = faker.helpers.arrayElement(users);
    const orderProducts = faker.helpers.arrayElements(products, faker.number.int({ min: 1, max: 6 }));
    const items = orderProducts.map((p) => ({
      productId: p.id,
      quantity: faker.number.int({ min: 1, max: 4 }),
      unitPrice: p.price,
    }));
    const totalAmount = items.reduce((s, it) => s + it.unitPrice * it.quantity, 0);

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
    const orderWithItems = order as Order & { items: Array<{ productId: string; quantity: number }> };
    for (const item of orderWithItems.items) {
      await ctx.prisma.product.update({
        where: { id: item.productId },
        data: { stock: { decrement: item.quantity } },
      });
    }
  }

  // Payments — bulk insert
  const paymentData: Array<{
    orderId: string; amount: number; method: PaymentMethod;
    status: PaymentStatus; transactionId: string;
  }> = [];
  for (const order of orders) {
    if (order.status === "CANCELLED") continue;
    paymentData.push({
      orderId: order.id,
      amount: order.totalAmount,
      method: faker.helpers.arrayElement(PAYMENT_METHODS),
      status: faker.helpers.arrayElement(PAYMENT_STATUSES),
      transactionId: `TXN-${faker.string.alphanumeric({ length: 12, casing: "upper" })}`,
    });
  }
  await ctx.prisma.payment.createMany({ data: paymentData });
  counts.payments = paymentData.length;

  // Refunds — bulk insert for recent COMPLETED payments
  const completedPayments = await ctx.prisma.payment.findMany({
    where: { status: "COMPLETED" },
    take: 100,
    orderBy: { createdAt: "desc" },
  });
  const refundData = completedPayments.map((p) => {
    const amount = parseFloat(faker.commerce.price({ min: 10, max: p.amount }));
    return {
      paymentId: p.id,
      orderId: p.orderId,
      amount: Math.min(amount, p.amount),
      reason: faker.helpers.arrayElement(REFUND_REASONS),
      status: faker.helpers.arrayElement(REFUND_STATUSES),
    };
  });
  await ctx.prisma.refund.createMany({ data: refundData });
  counts.refunds = refundData.length;

  return { products, orders };
}
