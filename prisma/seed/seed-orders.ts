import { faker } from "@faker-js/faker";
import type { SeedContext, SeedCounts } from "./types.js";
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
    select: { id: true, price: true, stock: true },
  });

  const productMap = new Map(products.map((p) => [p.id, p]));
  const orderIds = Array.from({ length: Math.floor(userIds.length * 3) }, () =>
    randomUUID(),
  );

  const orderData: Array<{
    id: string;
    userId: string;
    status: string;
    shippingAddress: string | null;
    couponId: string | null;
  }> = [];

  const itemData: Array<{
    orderId: string;
    productId: string;
    quantity: number;
    unitPrice: number;
  }> = [];

  for (const orderId of orderIds) {
    const status = faker.helpers.arrayElement(ORDER_STATUSES);
    const userId = faker.helpers.arrayElement(userIds);
    const useCoupon = couponIds.length > 0 && Math.random() > 0.7;

    const shippingAddress = faker.location.streetAddress();

    const couponId = useCoupon ? faker.helpers.arrayElement(couponIds) : null;

    orderData.push({ id: orderId, userId, status, couponId, shippingAddress });

    const itemCount = faker.number.int({ min: 1, max: 5 });

    for (let j = 0; j < itemCount; j++) {
      const productId = faker.helpers.arrayElement(productIds);
      const product = productMap.get(productId);
      if (!product) continue;
      const quantity = faker.number.int({ min: 1, max: 3 });
      itemData.push({
        orderId,
        productId,
        quantity,
        unitPrice: product.price,
      });
    }
  }

  await ctx.prisma.order.createMany({ data: orderData });
  counts.orders += orderData.length;

  await ctx.prisma.orderItem.createMany({ data: itemData });
  counts.orderItems += itemData.length;

  // Calculate and update totalAmount and discountAmount for each order
  const orderTotals = new Map<string, { total: number; discount: number }>();

  for (const item of itemData) {
    const current = orderTotals.get(item.orderId) ?? { total: 0, discount: 0 };
    current.total += item.unitPrice * item.quantity;
    orderTotals.set(item.orderId, current);
  }

  // Fetch coupon data for discount calculation
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
          discount =
            Math.round(totals.total * (coupon.discountPercent / 100) * 100) /
            100;
        } else if (coupon.discountAmount > 0) {
          discount = coupon.discountAmount;
        }
      }
    }

    await ctx.prisma.order.update({
      where: { id: order.id },
      data: {
        totalAmount: totals.total,
        discountAmount: Math.min(discount, totals.total),
      },
    });
  }

  return orderIds;
}
