import type { PrismaClient, Prisma } from "@prisma/client";
import type { ProcessPaymentInput, PaymentFilterInput } from "./inputs.js";
import { requireAuth, requireOwner } from "@gql-prisma-api/utils/errors.js";
import { triggerNovuWorkflow } from "@gql-prisma-api/utils/novu.js";

// --- Type-field resolver functions ---
export function resolvePaymentOrder(prisma: PrismaClient, orderId: string) {
  return prisma.order.findUnique({ where: { id: orderId } });
}

export function resolvePaymentRefunds(prisma: PrismaClient, paymentId: string) {
  return prisma.refund.findMany({ where: { paymentId } });
}

// --- Existing business logic functions ---
export async function processPayment(
  prisma: PrismaClient,
  userId: string | undefined,
  input: ProcessPaymentInput,
) {
  requireAuth(userId);
  const order = await prisma.order.findUnique({ where: { id: input.orderId } });
  if (!order) throw new Error("Order not found");
  requireOwner(order.userId, userId);

  const existing = await prisma.payment.findUnique({
    where: { orderId: input.orderId },
  });
  if (existing) throw new Error("Payment already exists");

  const transactionId = `TXN-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
  const payment = await prisma.payment.create({
    data: {
      orderId: input.orderId,
      amount: order.totalAmount,
      method: input.method,
      status: "COMPLETED",
      transactionId,
    },
  });

  await triggerNovuWorkflow(userId!, "payment-processed", {
    orderId: input.orderId,
    paymentId: payment.id,
    amount: order.totalAmount,
  });

  return payment;
}

export async function getMyPayments(
  prisma: PrismaClient,
  userId: string | undefined,
  args: PaymentFilterInput,
) {
  requireAuth(userId);
  const conditions: Prisma.PaymentWhereInput[] = [{ order: { userId: userId! } }];

  if (args.status) {
    conditions.push({ status: args.status });
  }

  const where: Prisma.PaymentWhereInput = { AND: conditions };

  return prisma.payment.findMany({
    where,
    take: args.limit ?? 20,
    skip: args.offset ?? 0,
    orderBy: { createdAt: "desc" },
  });
}

export async function getPayment(
  prisma: PrismaClient,
  userId: string | undefined,
  id: string,
) {
  requireAuth(userId);
  return prisma.payment.findFirst({
    where: { id, order: { userId: userId! } },
  });
}
