import { faker } from "@faker-js/faker";
import type { SeedContext, SeedCounts } from "./types.js";

const CARRIERS = ["UPS", "FedEx", "USPS", "DHL"];

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
    select: { id: true, status: true },
  });

  const data: Array<{
    orderId: string;
    carrier: string;
    trackingNumber: string;
    status: string;
    estimatedDelivery: Date;
    deliveredAt: Date | null;
  }> = [];

  for (const order of orders) {
    data.push({
      orderId: order.id,
      carrier: faker.helpers.arrayElement(CARRIERS),
      trackingNumber: faker.string.alphanumeric({ length: 14 }).toUpperCase(),
      status: order.status === "DELIVERED" ? "DELIVERED" : "IN_TRANSIT",
      estimatedDelivery: faker.date.future(),
      deliveredAt: order.status === "DELIVERED" ? faker.date.past() : null,
    });
  }

  await ctx.prisma.shipment.createMany({ data });
  counts.shipments += data.length;
}
