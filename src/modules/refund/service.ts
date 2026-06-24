import type { PrismaClient, Prisma } from "@prisma/client";
import type { CreateRefundInput, RefundFilterInput } from "./inputs.js";
import { requireAuth, requireOwner } from "@gql-prisma-api/utils/errors.js";
import { triggerNovuWorkflow } from "@gql-prisma-api/utils/novu.js";

// --- Type-field resolver functions ---
export function resolveRefundPayment(prisma: PrismaClient, paymentId: string) {
  return prisma.payment.findUnique({ where: { id: paymentId } });
}

export function resolveRefundOrder(prisma: PrismaClient, orderId: string) {
  return prisma.order.findUnique({ where: { id: orderId } });
}

// --- Existing business logic functions ---
export async function createRefund(
  prisma: PrismaClient,
  userId: string | undefined,
  input: CreateRefundInput,
) {
  requireAuth(userId);
  const order = await prisma.order.findUnique({ where: { id: input.orderId } });
  if (!order) throw new Error("Order not found");
  requireOwner(order.userId, userId);
  return prisma.refund.create({
    data: {
      paymentId: input.paymentId,
      orderId: input.orderId,
      amount: input.amount,
      reason: input.reason ?? null,
    },
  });
}

export async function updateRefundStatus(
  prisma: PrismaClient,
  userId: string | undefined,
  id: string,
  status: string,
) {
  requireAuth(userId);
  const refund = await prisma.refund.findUnique({
    where: { id },
    include: { payment: true, order: true },
  });
  if (!refund) throw new Error("Refund not found");
  requireOwner(refund.order.userId, userId);

  const updated = await prisma.refund.update({
    where: { id },
    data: { status },
  });

  if (status === "COMPLETED") {
    const completedRefunds = await prisma.refund.findMany({
      where: { paymentId: refund.paymentId, status: "COMPLETED" },
    });
    const totalRefunded = completedRefunds.reduce((s, r) => s + r.amount, 0);
    if (totalRefunded >= refund.payment.amount) {
      await prisma.payment.update({
        where: { id: refund.paymentId },
        data: { status: "REFUNDED" },
      });
    }

    await triggerNovuWorkflow(userId!, "refund-processed", {
      refundId: id,
      orderId: refund.orderId,
      amount: updated.amount,
    });
  }

  return updated;
}

export async function getMyRefunds(
  prisma: PrismaClient,
  userId: string | undefined,
  args: RefundFilterInput,
) {
  requireAuth(userId);
  const conditions: Prisma.RefundWhereInput[] = [{ order: { userId: userId! } }];

  if (args.status) {
    conditions.push({ status: args.status });
  }

  const where: Prisma.RefundWhereInput = { AND: conditions };

  return prisma.refund.findMany({
    where,
    take: args.limit ?? 20,
    skip: args.offset ?? 0,
    orderBy: { createdAt: "desc" },
  });
}

export async function getRefund(
  prisma: PrismaClient,
  userId: string | undefined,
  id: string,
) {
  requireAuth(userId);
  return prisma.refund.findFirst({ where: { id, order: { userId: userId! } } });
}
