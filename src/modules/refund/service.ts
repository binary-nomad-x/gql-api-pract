import type { Prisma, PrismaClient } from "@prisma/client";
import type { CreateRefundInput, RefundFilterInput } from "@gql-prisma-api/modules/refund/inputs.js";
import { requireAuth, requireOwner } from "@gql-prisma-api/utils/errors.js";
import { triggerNovuWorkflow } from "@gql-prisma-api/utils/novu.js";

export class RefundService {
  constructor(private readonly core: PrismaClient) {}
  resolveRefundPayment(paymentId: string) {
    return this.core.payment.findUnique({ where: { id: paymentId } });
  }

  resolveRefundOrder(orderId: string) {
    return this.core.order.findUnique({ where: { id: orderId } });
  }

  async createRefund(
    userId: string | undefined,
    input: CreateRefundInput,
  ) {
    requireAuth(userId);
    const order = await this.core.order.findUnique({ where: { id: input.orderId } });
    if (!order) throw new Error("Order not found");
    requireOwner(order.userId, userId);
    return this.core.refund.create({
      data: {
        paymentId: input.paymentId,
        orderId: input.orderId,
        amount: input.amount,
        currency: "USD",
        reason: input.reason ?? undefined,
        initiatedBy: "system",
        fee: 0,
      },
    });
  }

  async updateRefundStatus(
    userId: string | undefined,
    id: string,
    status: string,
  ) {
    requireAuth(userId);
    const refund = await this.core.refund.findUnique({
      where: { id },
      include: { payment: true, order: true },
    });
    if (!refund) throw new Error("Refund not found");
    requireOwner(refund.order.userId, userId);

    const updated = await this.core.refund.update({
      where: { id },
      data: { status },
    });

    if (status === "COMPLETED") {
      const completedRefunds = await this.core.refund.findMany({
        where: { paymentId: refund.paymentId, status: "COMPLETED" },
      });
      const totalRefunded = completedRefunds.reduce((s, r) => s + r.amount, 0);
      if (totalRefunded >= refund.payment.amount) {
        await this.core.payment.update({
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

  async getMyRefunds(
    userId: string | undefined,
    args: RefundFilterInput,
  ) {
    requireAuth(userId);
    const conditions: Prisma.RefundWhereInput[] = [{ order: { userId: userId! } }];

    if (args.status) {
      conditions.push({ status: args.status });
    }

    const where: Prisma.RefundWhereInput = { AND: conditions };

    return this.core.refund.findMany({
      where,
      take: args.limit ?? 20,
      skip: args.offset ?? 0,
      orderBy: { createdAt: "desc" },
    });
  }

  async getRefund(
    userId: string | undefined,
    id: string,
  ) {
    requireAuth(userId);
    return this.core.refund.findFirst({ where: { id, order: { userId: userId! } } });
  }
}
