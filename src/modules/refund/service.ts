import type { Prisma } from "@prisma/client";
import type { CreateRefundInput, RefundFilterInput } from "./inputs.js";
import { BaseService } from "@gql-prisma-api/lib/BaseService.js";
import { requireAuth, requireOwner } from "@gql-prisma-api/utils/errors.js";
import { triggerNovuWorkflow } from "@gql-prisma-api/utils/novu.js";

export class RefundService {
  constructor(private readonly base: BaseService) {}
  resolveRefundPayment(paymentId: string) {
    return this.base.core.payment.findUnique({ where: { id: paymentId } });
  }

  resolveRefundOrder(orderId: string) {
    return this.base.core.order.findUnique({ where: { id: orderId } });
  }

  async createRefund(
    userId: string | undefined,
    input: CreateRefundInput,
  ) {
    requireAuth(userId);
    const order = await this.base.core.order.findUnique({ where: { id: input.orderId } });
    if (!order) throw new Error("Order not found");
    requireOwner(order.userId, userId);
    return this.base.core.refund.create({
      data: {
        paymentId: input.paymentId,
        orderId: input.orderId,
        amount: input.amount,
        reason: input.reason ?? null,
      },
    });
  }

  async updateRefundStatus(
    userId: string | undefined,
    id: string,
    status: string,
  ) {
    requireAuth(userId);
    const refund = await this.base.core.refund.findUnique({
      where: { id },
      include: { payment: true, order: true },
    });
    if (!refund) throw new Error("Refund not found");
    requireOwner(refund.order.userId, userId);

    const updated = await this.base.core.refund.update({
      where: { id },
      data: { status },
    });

    if (status === "COMPLETED") {
      const completedRefunds = await this.base.core.refund.findMany({
        where: { paymentId: refund.paymentId, status: "COMPLETED" },
      });
      const totalRefunded = completedRefunds.reduce((s, r) => s + r.amount, 0);
      if (totalRefunded >= refund.payment.amount) {
        await this.base.core.payment.update({
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

    return this.base.core.refund.findMany({
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
    return this.base.core.refund.findFirst({ where: { id, order: { userId: userId! } } });
  }
}
