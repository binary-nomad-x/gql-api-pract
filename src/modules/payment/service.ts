import type { Prisma } from "@prisma/client";
import type { ProcessPaymentInput, PaymentFilterInput } from "./inputs.js";
import { BaseService } from "@gql-prisma-api/lib/BaseService.js";
import { requireAuth, requireOwner } from "@gql-prisma-api/utils/errors.js";
import { triggerNovuWorkflow } from "@gql-prisma-api/utils/novu.js";

export class PaymentService {
  constructor(private readonly base: BaseService) {}
  resolvePaymentOrder(orderId: string) {
    return this.base.core.order.findUnique({ where: { id: orderId } });
  }

  resolvePaymentRefunds(paymentId: string) {
    return this.base.core.refund.findMany({ where: { paymentId } });
  }

  async processPayment(
    userId: string | undefined,
    input: ProcessPaymentInput,
  ) {
    requireAuth(userId);
    const order = await this.base.core.order.findUnique({ where: { id: input.orderId } });
    if (!order) throw new Error("Order not found");
    requireOwner(order.userId, userId);

    const existing = await this.base.core.payment.findUnique({
      where: { orderId: input.orderId },
    });
    if (existing) throw new Error("Payment already exists");

    const transactionId = `TXN-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
    const payment = await this.base.core.payment.create({
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

  async getMyPayments(
    userId: string | undefined,
    args: PaymentFilterInput,
  ) {
    requireAuth(userId);
    const conditions: Prisma.PaymentWhereInput[] = [{ order: { userId: userId! } }];

    if (args.status) {
      conditions.push({ status: args.status });
    }

    const where: Prisma.PaymentWhereInput = { AND: conditions };

    return this.base.core.payment.findMany({
      where,
      take: args.limit ?? 20,
      skip: args.offset ?? 0,
      orderBy: { createdAt: "desc" },
    });
  }

  async getPayment(
    userId: string | undefined,
    id: string,
  ) {
    requireAuth(userId);
    return this.base.core.payment.findFirst({
      where: { id, order: { userId: userId! } },
    });
  }
}
