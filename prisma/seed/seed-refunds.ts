import { faker } from "@faker-js/faker";
import type { SeedContext, SeedCounts } from "./types.js";

export async function seedRefunds(ctx: SeedContext, counts: SeedCounts, orderIds: string[]): Promise<void> {
  const orders = await ctx.prisma.order.findMany({
    where: { id: { in: orderIds }, status: { in: ["DELIVERED", "CANCELLED"] } },
    select: { id: true },
  });

  const eligibleOrders = orders.filter(() => Math.random() > 0.65);
  if (eligibleOrders.length === 0) return;

  const payments = await ctx.prisma.payment.findMany({
    where: { orderId: { in: eligibleOrders.map((o) => o.id) } },
    select: { id: true, orderId: true, amount: true },
  });

  const data: {
    paymentId: string;
    orderId: string;
    amount: number;
    currency: string;
    reason: string;
    reasonDescription: string;
    status: string;
    initiatedBy: string;
    fee: number;
  }[] = [];

  for (const payment of payments) {
    const refundAmount = parseFloat((payment.amount * (Math.random() > 0.5 ? 1 : faker.number.float({ min: 0.3, max: 0.8 }))).toFixed(2));
    data.push({
      paymentId: payment.id,
      orderId: payment.orderId,
      amount: refundAmount,
      currency: "USD",
      reason: faker.helpers.arrayElement([
        "Defective product",
        "Wrong item shipped",
        "Not as described",
        "Customer changed mind",
        "Duplicate order",
        "Quality issue",
      ]),
      reasonDescription: faker.lorem.sentence(),
      status: Math.random() > 0.15 ? "COMPLETED" : "PENDING",
      initiatedBy: faker.helpers.arrayElement(["system", "customer", "support"]),
      fee: parseFloat((refundAmount * 0.029).toFixed(2)),
    });
  }

  await ctx.prisma.refund.createMany({ data });
  counts.refunds += data.length;
}
