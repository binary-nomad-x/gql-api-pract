import { faker } from "@faker-js/faker";
import type { SeedContext, SeedCounts } from "./types.js";
import type { Order, ShipmentStatus } from "@prisma/client";

const COUPON_CODES = ["WELCOME10", "SAVE20", "FREESHIP", "HOLIDAY25", "FLASH50", "NEWUSER", "LOYALTY", "VIP15", "MEGA50", "DEAL25", "SAVE100"];
const CARRIERS = ["UPS", "FedEx", "USPS", "DHL", "Amazon Logistics", "Ontrac", "Canada Post"];
const SHIP_STATUSES: ShipmentStatus[] = ["PICKED_UP", "IN_TRANSIT", "OUT_FOR_DELIVERY", "DELIVERED"];

export async function seedPromotions(ctx: SeedContext, counts: SeedCounts, orders: Order[]): Promise<void> {
  await ctx.prisma.coupon.createMany({
    data: COUPON_CODES.map((code) => ({
      code, description: faker.lorem.sentence(),
      discountPercent: faker.helpers.arrayElement([0, 0, 10, 15, 20, 25, 50]),
      discountAmount: faker.helpers.arrayElement([0, 0, 5, 10, 25, 50, 100]),
      minPurchase: faker.helpers.arrayElement([0, 25, 50, 100]),
      maxUses: faker.number.int({ min: 50, max: 1000 }),
      isActive: true, expiresAt: faker.date.future(),
    })),
  });
  counts.coupons = COUPON_CODES.length;

  const shipped = orders.filter((o) => ["SHIPPED", "DELIVERED"].includes(o.status)).slice(0, 500);
  await ctx.prisma.shipment.createMany({
    data: shipped.map((o) => ({
      orderId: o.id,
      carrier: faker.helpers.arrayElement(CARRIERS),
      trackingNumber: faker.string.alphanumeric({ length: 15, casing: "upper" }),
      status: faker.helpers.arrayElement(SHIP_STATUSES),
      estimatedDelivery: faker.date.future(),
      deliveredAt: faker.datatype.boolean(0.4) ? faker.date.recent() : undefined,
    })),
  });
  counts.shipments = shipped.length;
}
