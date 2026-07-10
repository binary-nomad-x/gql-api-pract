import { faker } from "@faker-js/faker";
import type { SeedContext, SeedCounts, OrderSeed, OrderItemSeed } from "./types.js";
import { randomUUID } from "node:crypto";

const ORDER_STATUSES = [
  "PENDING",
  "CONFIRMED",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
];

export async function seedOrders(
  ctx: SeedContext,
  counts: SeedCounts,
  userIds: string[],
  productIds: string[],
  couponIds: string[],
): Promise<string[]> {
  const products = await ctx.prisma.product.findMany({
    where: { id: { in: productIds } },
    select: { id: true, price: true, name: true, sku: true, imageUrl: true, stock: true },
  });

  const productMap = new Map(products.map((p) => [p.id, p]));
  const orderIds = Array.from({ length: Math.floor(userIds.length * 4) }, () =>
    randomUUID(),
  );

  const orderData: OrderSeed[] = [];
  const itemData: OrderItemSeed[] = [];

  for (const orderId of orderIds) {
    const status = faker.helpers.arrayElement(ORDER_STATUSES);
    const userId = faker.helpers.arrayElement(userIds);
    const useCoupon = couponIds.length > 0 && Math.random() > 0.65;
    const couponId = useCoupon ? faker.helpers.arrayElement(couponIds) : null;
    const isCancelled = status === "CANCELLED";
    const isDelivered = status === "DELIVERED";
    const shippingAmount = parseFloat(faker.commerce.price({ min: 5, max: 25 }));
    const taxRate = faker.helpers.arrayElement([0.05, 0.07, 0.08, 0.10, 0.0]);

    orderData.push({
      id: orderId,
      userId,
      status,
      subtotal: 0,
      taxAmount: 0,
      shippingAmount,
      currency: "USD",
      shippingAddress: faker.location.streetAddress(),
      email: faker.internet.email().toLowerCase(),
      phone: faker.phone.number(),
      notes: Math.random() > 0.6 ? faker.lorem.sentence() : "",
      source: faker.helpers.arrayElement(["web", "mobile", "api"]),
      isGift: Math.random() > 0.9,
      giftMessage: Math.random() > 0.9 ? faker.lorem.sentence() : "",
      trackingUrl: "",
      couponId,
      estimatedDelivery: isDelivered ? faker.date.past() : faker.date.future(),
      deliveredAt: isDelivered ? faker.date.past() : null,
      cancelledAt: isCancelled ? faker.date.past() : null,
      cancelReason: isCancelled ? faker.helpers.arrayElement([
        "Changed mind", "Found better price", "Ordered by mistake",
        "Shipping too slow", "Duplicate order",
      ]) : "",
    });

    const itemCount = faker.number.int({ min: 1, max: 5 });
    let subtotal = 0;

    for (let j = 0; j < itemCount; j++) {
      const productId = faker.helpers.arrayElement(productIds);
      const product = productMap.get(productId);
      if (!product) continue;
      const quantity = faker.number.int({ min: 1, max: 3 });
      const totalPrice = parseFloat((product.price * quantity).toFixed(2));
      subtotal += totalPrice;
      itemData.push({
        orderId,
        productId,
        quantity,
        unitPrice: product.price,
        productName: product.name,
        productSku: product.sku,
        productImage: product.imageUrl,
        discountAmount: 0,
        taxAmount: parseFloat((product.price * quantity * taxRate).toFixed(2)),
        totalPrice,
      });
    }

    // Update subtotal and tax in orderData
    const order = orderData[orderData.length - 1];
    order.subtotal = subtotal;
    order.taxAmount = parseFloat((subtotal * taxRate).toFixed(2));
  }

  await ctx.prisma.order.createMany({ data: orderData });
  counts.orders += orderData.length;

  await ctx.prisma.orderItem.createMany({ data: itemData });
  counts.orderItems += itemData.length;

  // Calculate totals per order and update
  const orderTotals = new Map<string, { subtotal: number; tax: number; shipping: number }>();

  for (const item of itemData) {
    const current = orderTotals.get(item.orderId) ?? { subtotal: 0, tax: 0, shipping: 0 };
    current.subtotal += item.totalPrice;
    current.tax += item.taxAmount;
    orderTotals.set(item.orderId, current);
  }

  const coupons = await ctx.prisma.coupon.findMany({
    where: { id: { in: couponIds } },
  });
  const couponMap = new Map(coupons.map((c) => [c.id, c]));

  for (const order of orderData) {
    const totals = orderTotals.get(order.id);
    if (!totals) continue;

    let discount = 0;
    if (order.couponId) {
      const coupon = couponMap.get(order.couponId);
      if (coupon) {
        if (coupon.discountPercent > 0) {
          discount = Math.round(totals.subtotal * (coupon.discountPercent / 100) * 100) / 100;
          if (coupon.maxDiscountAmount > 0) {
            discount = Math.min(discount, coupon.maxDiscountAmount);
          }
        } else if (coupon.discountAmount > 0) {
          discount = coupon.discountAmount;
        }
      }
    }

    discount = Math.min(discount, totals.subtotal);
    const totalAmount = totals.subtotal + totals.tax + totals.shipping - discount;

    await ctx.prisma.order.update({
      where: { id: order.id },
      data: {
        totalAmount: parseFloat(totalAmount.toFixed(2)),
        subtotal: totals.subtotal,
        taxAmount: totals.tax,
        discountAmount: discount,
      },
    });
  }

  return orderIds;
}
