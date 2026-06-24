import { faker } from "@faker-js/faker";
import type { SeedContext, SeedCounts } from "./types.js";

const PAYMENT_METHODS = ["credit_card", "debit_card", "paypal", "stripe"];

export async function seedPayments(
  ctx: SeedContext,
  counts: SeedCounts,
  orderIds: string[],
): Promise<void> {
  const orders = await ctx.prisma.order.findMany({
    where: { id: { in: orderIds } },
    select: { id: true, totalAmount: true, discountAmount: true, status: true },
  });

  const data: Array<{
    orderId: string;
    amount: number;
    method: string;
    status: string;
    transactionId: string;
  }> = [];

  for (const order of orders) {
    const amount = order.totalAmount - order.discountAmount;
    if (amount <= 0) continue;

    const isCompleted = order.status !== "CANCELLED";
    data.push({
      orderId: order.id,
      amount,
      method: faker.helpers.arrayElement(PAYMENT_METHODS),
      status: isCompleted ? "COMPLETED" : "REFUNDED",
      transactionId: faker.string.alphanumeric({ length: 16 }).toUpperCase(),
    });
  }

  await ctx.prisma.payment.createMany({ data });
  counts.payments += data.length;
}
