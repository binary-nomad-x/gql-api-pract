import type { PrismaClient, ShipmentStatus } from "@prisma/client";
import type { CreateShipmentInput } from "@gql-prisma-api/modules/shipment/inputs.js";
import { requireAuth } from "@gql-prisma-api/utils/errors.js";
import { triggerNovuWorkflow } from "@gql-prisma-api/utils/novu.js";

export async function createShipment(
  prisma: PrismaClient,
  userId: string | undefined,
  input: CreateShipmentInput,
) {
  requireAuth(userId);
  return prisma.shipment.create({ data: input });
}

export async function updateShipmentStatus(
  prisma: PrismaClient,
  userId: string | undefined,
  id: string,
  status: string,
) {
  requireAuth(userId);
  const shipment = await prisma.shipment.update({ where: { id }, data: { status: status as ShipmentStatus } });
  const order = await prisma.order.findUnique({ where: { id: shipment.orderId } });
  if (order) {
    await triggerNovuWorkflow(order.userId, "shipment-updated", { shipmentId: id, orderId: shipment.orderId, status });
  }
  return shipment;
}

export async function getOrderShipments(
  prisma: PrismaClient,
  userId: string | undefined,
  orderId: string,
) {
  requireAuth(userId);
  return prisma.shipment.findMany({
    where: { orderId, order: { userId: userId! } },
  });
}
