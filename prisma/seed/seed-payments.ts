import { faker } from "@faker-js/faker";
import type { SeedContext, SeedCounts } from "./types.js";

const PAYMENT_METHODS = ["credit_card", "debit_card", "paypal", "stripe", "apple_pay", "google_pay"];
const GATEWAYS = ["stripe", "paypal", "square", "adyen"];

export async function seedPayments(ctx: SeedContext, counts: SeedCounts, orderIds: string[]): Promise<void> {
  const orders = await ctx.prisma.order.findMany({
    where: { id: { in: orderIds } },
    select: { id: true, totalAmount: true, status: true },
  });

  const data: {
    orderId: string;
    amount: number;
    currency: string;
    method: string;
    gateway: string;
    gatewayTransactionId: string;
    status: string;
    fee: number;
    netAmount: number;
    payerEmail: string;
    payerName: string;
    billingAddress: string;
    failureReason: string | null;
    refundedAmount: number;
    capturedAmount: number;
    transactionId: string;
  }[] = [];

  for (const order of orders) {
    const amount = order.totalAmount;
    if (amount <= 0) continue;

    const isCompleted = order.status !== "CANCELLED";
    const method = faker.helpers.arrayElement(PAYMENT_METHODS);
    const gateway = faker.helpers.arrayElement(GATEWAYS);
    const fee = parseFloat((amount * 0.029 + 0.3).toFixed(2));

    data.push({
      orderId: order.id,
      amount,
      currency: "USD",
      method,
      gateway,
      gatewayTransactionId: faker.string.alphanumeric({ length: 24 }),
      status: isCompleted ? "COMPLETED" : "REFUNDED",
      fee,
      netAmount: parseFloat((amount - fee).toFixed(2)),
      payerEmail: faker.internet.email().toLowerCase(),
      payerName: faker.person.fullName(),
      billingAddress: faker.location.streetAddress(),
      failureReason: isCompleted ? null : "Payment cancelled by user",
      refundedAmount: isCompleted ? 0 : amount,
      capturedAmount: isCompleted ? amount : 0,
      transactionId: `txn_${faker.string.alphanumeric({ length: 16 })}`,
    });
  }

  await ctx.prisma.payment.createMany({ data });
  counts.payments += data.length;
}
