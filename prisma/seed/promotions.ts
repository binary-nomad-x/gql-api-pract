import { faker } from "@faker-js/faker";
import type { SeedContext, SeedCounts } from "./types.js";
import type { Order } from "@prisma/client";

const COUPON_CODES = ["WELCOME10", "SAVE20", "FREESHIP", "HOLIDAY25", "FLASH50", "NEWUSER", "LOYALTY", "VIP15"];

const CARRIERS = ["UPS", "FedEx", "USPS", "DHL", "Amazon Logistics"];

const SHIPMENT_STATUSES: Array<"PICKED_UP" | "IN_TRANSIT" | "OUT_FOR_DELIVERY" | "DELIVERED"> = [
  "PICKED_UP", "IN_TRANSIT", "OUT_FOR_DELIVERY", "DELIVERED",
];

/**
 * Seed coupons and shipments.
 * Shipments are created for SHIPPED/DELIVERED orders (up to 200).
 */
export async function seedPromotions(
  ctx: SeedContext,
  counts: SeedCounts,
  orders: Order[],
): Promise<void> {
  // Coupons
  for (const code of COUPON_CODES) {
    await ctx.prisma.coupon.create({
      data: {
        code,
        description: faker.lorem.sentence(),
        discountPercent: faker.helpers.arrayElement([0, 0, 10, 15, 20, 25, 50]),
        discountAmount: faker.helpers.arrayElement([0, 0, 5, 10, 25, 50, 100]),
        minPurchase: faker.helpers.arrayElement([0, 25, 50, 100]),
        maxUses: faker.number.int({ min: 50, max: 1000 }),
        isActive: true,
        expiresAt: faker.date.future(),
      },
    });
  }
  counts.coupons = COUPON_CODES.length;

  // Shipments for shipped/delivered orders
  let shipmentCount = 0;
  const shippedOrders = orders.filter((o: Order) => ["SHIPPED", "DELIVERED"].includes(o.status));
  for (const order of shippedOrders.slice(0, 200)) {
    await ctx.prisma.shipment.create({
      data: {
        orderId: order.id,
        carrier: faker.helpers.arrayElement(CARRIERS),
        trackingNumber: faker.string.alphanumeric({ length: 15, casing: "upper" }),
        status: faker.helpers.arrayElement(SHIPMENT_STATUSES),
        estimatedDelivery: faker.date.future(),
        deliveredAt: faker.datatype.boolean(0.4) ? faker.date.recent() : undefined,
      },
    });
    shipmentCount++;
  }
  counts.shipments = shipmentCount;
}
