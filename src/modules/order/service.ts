import type { Prisma } from "@prisma/client";
import type { PlaceOrderInput, OrderFilterInput } from "./inputs.js";
import { BaseService } from "@gql-prisma-api/lib/BaseService.js";
import { requireAuth, requireOwner } from "@gql-prisma-api/utils/errors.js";
import { triggerNovuWorkflow } from "@gql-prisma-api/utils/novu.js";
import { logger } from "@gql-prisma-api/utils/logger.js";

export class OrderService {
  constructor(private readonly base: BaseService) {}
  resolveOrderUser(userId: string) {
    return this.base.core.user.findUnique({ where: { id: userId } });
  }

  resolveOrderItems(orderId: string) {
    return this.base.core.orderItem.findMany({ where: { orderId } });
  }

  resolveOrderPayment(orderId: string) {
    return this.base.core.payment.findUnique({ where: { orderId } });
  }

  resolveOrderRefunds(orderId: string) {
    return this.base.core.refund.findMany({ where: { orderId } });
  }

  resolveOrderShipments(orderId: string) {
    return this.base.core.shipment.findMany({ where: { orderId } });
  }

  resolveOrderCoupon(couponId: string | null) {
    return couponId
      ? this.base.core.coupon.findUnique({ where: { id: couponId } })
      : null;
  }

  resolveOrderItemCount(orderId: string) {
    return this.base.core.orderItem.count({ where: { orderId } });
  }

  resolveOrderItemOrder(orderId: string) {
    return this.base.core.order.findUnique({ where: { id: orderId } });
  }

  resolveOrderItemProduct(productId: string) {
    return this.base.core.product.findUnique({ where: { id: productId } });
  }

  async placeOrder(
    userId: string | undefined,
    input: PlaceOrderInput,
  ) {
    requireAuth(userId);

    const products = await this.base.core.product.findMany({
      where: { id: { in: input.items.map((i) => i.productId) } },
    });
    const productMap = new Map(products.map((p) => [p.id, p]));

    let totalAmount = 0;
    for (const item of input.items) {
      const p = productMap.get(item.productId);
      if (!p) throw new Error(`Product ${item.productId} not found`);
      if (!p.isActive) throw new Error(`${p.name} is inactive`);
      if (p.stock < item.quantity)
        throw new Error(`Insufficient stock for ${p.name}`);
      totalAmount += p.price * item.quantity;
    }

    let discountAmount = 0;
    if (input.couponCode) {
      const coupon = await this.base.core.coupon.findUnique({
        where: { code: input.couponCode },
      });
      if (
        coupon?.isActive &&
        coupon.usedCount < coupon.maxUses &&
        totalAmount >= coupon.minPurchase
      ) {
        discountAmount =
          coupon.discountAmount > 0
            ? coupon.discountAmount
            : totalAmount * (coupon.discountPercent / 100);
      }
    }

    const order = await this.base.core.$transaction(async (tx: Prisma.TransactionClient) => {
      const orderData: Prisma.OrderCreateInput = {
        user: { connect: { id: userId! } },
        totalAmount,
        discountAmount,
        shippingAddress: input.shippingAddress ?? null,
        items: {
          create: input.items.map((item) => ({
            product: { connect: { id: item.productId } },
            quantity: item.quantity,
            unitPrice: productMap.get(item.productId)!.price,
          })),
        },
      };
      if (input.couponCode) {
        orderData.coupon = { connect: { code: input.couponCode } };
      }
      const o = await tx.order.create({
        data: orderData,
        include: { items: { include: { product: true } } },
      });

      for (const item of input.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { decrement: item.quantity } },
        });
      }

      if (input.couponCode) {
        await tx.coupon.update({
          where: { code: input.couponCode },
          data: { usedCount: { increment: 1 } },
        });
      }

      return o;
    });

    await triggerNovuWorkflow(userId!, "order-placed", {
      orderId: order.id,
      totalAmount,
      itemCount: input.items.length,
    });

    logger.info("Order placed", { orderId: order.id, userId: userId!, totalAmount, itemCount: input.items.length });
    return order;
  }

  async cancelOrder(
    userId: string | undefined,
    id: string,
  ) {
    requireAuth(userId);
    const order = await this.base.core.order.findUnique({
      where: { id },
      include: { items: true },
    });
    if (!order) throw new Error("Order not found");
    requireOwner(order.userId, userId);
    if (["DELIVERED", "SHIPPED"].includes(order.status)) {
      throw new Error("Cannot cancel shipped or delivered order");
    }

    const updated = await this.base.core.$transaction(async (tx: Prisma.TransactionClient) => {
      const o = await tx.order.update({
        where: { id },
        data: { status: "CANCELLED" },
      });
      for (const item of order.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { increment: item.quantity } },
        });
      }
      return o;
    });

    await triggerNovuWorkflow(userId!, "order-cancelled", { orderId: id });

    logger.info("Order cancelled", { orderId: id, userId: userId! });
    return updated;
  }

  async updateOrderStatus(
    userId: string | undefined,
    id: string,
    status: string,
  ) {
    requireAuth(userId);
    const order = await this.base.core.order.findUnique({ where: { id } });
    if (!order) throw new Error("Order not found");
    requireOwner(order.userId, userId);
    return this.base.core.order.update({ where: { id }, data: { status } });
  }

  async getMyOrders(
    userId: string | undefined,
    args: OrderFilterInput,
  ) {
    requireAuth(userId);
    const conditions: Prisma.OrderWhereInput[] = [{ userId: userId! }];

    if (args.status) {
      conditions.push({ status: args.status });
    }

    const where: Prisma.OrderWhereInput = { AND: conditions };

    return this.base.core.order.findMany({
      where,
      take: args.limit ?? 20,
      skip: args.offset ?? 0,
      orderBy: { createdAt: "desc" },
    });
  }

  async getOrder(
    userId: string | undefined,
    id: string,
  ) {
    requireAuth(userId);
    return this.base.core.order.findFirst({ where: { id, userId: userId! } });
  }
}
