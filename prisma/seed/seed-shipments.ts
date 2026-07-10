import { faker } from "@faker-js/faker";
import type { SeedContext, SeedCounts, ShipmentSeed } from "./types.js";

const CARRIERS = ["UPS", "FedEx", "USPS", "DHL", "Amazon Logistics"];
const METHODS = ["standard", "expedited", "overnight", "two-day", "economy"];

export async function seedShipments(
  ctx: SeedContext,
  counts: SeedCounts,
  orderIds: string[],
): Promise<void> {
  const orders = await ctx.prisma.order.findMany({
    where: {
      id: { in: orderIds },
      status: { in: ["SHIPPED", "DELIVERED"] },
    },
    select: { id: true, status: true, shippingAddress: true },
  });

  const data: ShipmentSeed[] = [];

  for (const order of orders) {
    const isDelivered = order.status === "DELIVERED";
    data.push({
      orderId: order.id,
      carrier: faker.helpers.arrayElement(CARRIERS),
      trackingNumber: faker.string.alphanumeric({ length: 14 }).toUpperCase(),
      status: isDelivered ? "DELIVERED" : "IN_TRANSIT",
      shippingMethod: faker.helpers.arrayElement(METHODS),
      originAddress: faker.location.streetAddress(),
      destinationAddress: order.shippingAddress,
      weight: parseFloat(faker.number.float({ min: 0.5, max: 50 }).toFixed(2)),
      length: parseFloat(faker.number.float({ min: 5, max: 60 }).toFixed(1)),
      width: parseFloat(faker.number.float({ min: 5, max: 40 }).toFixed(1)),
      height: parseFloat(faker.number.float({ min: 1, max: 30 }).toFixed(1)),
      cost: parseFloat(faker.commerce.price({ min: 5, max: 50 })),
      currency: "USD",
      notes: Math.random() > 0.7 ? "Fragile - handle with care" : null,
      estimatedDelivery: faker.date.future(),
      deliveredAt: isDelivered ? faker.date.past() : null,
      shippedAt: faker.date.recent({ days: 10 }),
    });
  }

  await ctx.prisma.shipment.createMany({ data });
  counts.shipments += data.length;
}
