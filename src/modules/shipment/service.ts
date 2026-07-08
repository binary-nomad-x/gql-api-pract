import type { PrismaClient } from "@prisma/client";
import type { CreateShipmentInput } from "./inputs.js";
import { BaseService } from "@gql-prisma-api/lib/BaseService.js";
import { requireAuth } from "@gql-prisma-api/utils/errors.js";
import { triggerNovuWorkflow } from "@gql-prisma-api/utils/novu.js";

export class ShipmentService {
  constructor(private readonly base: BaseService) {}
  resolveShipmentOrder(orderId: string) {
    return this.base.core.order.findUnique({ where: { id: orderId } });
  }

  async createShipment(
    userId: string | undefined,
    input: CreateShipmentInput,
  ) {
    requireAuth(userId);
    return this.base.core.shipment.create({ data: input });
  }

  async updateShipmentStatus(
    userId: string | undefined,
    id: string,
    status: string,
  ) {
    requireAuth(userId);
    const shipment = await this.base.core.shipment.update({
      where: { id },
      data: { status },
    });

    const order = await this.base.core.order.findUnique({
      where: { id: shipment.orderId },
    });

    if (order) {
      await triggerNovuWorkflow(order.userId, "shipment-updated", {
        shipmentId: id,
        orderId: shipment.orderId,
        status,
      });
    }

    return shipment;
  }

  async getOrderShipments(
    userId: string | undefined,
    orderId: string,
  ) {
    requireAuth(userId);
    return this.base.core.shipment.findMany({
      where: { orderId, order: { userId: userId! } },
    });
  }
}
