import type { Context } from "@gql-prisma-api/types/context.js";
import type { Shipment as ShipmentModel } from "@prisma/client";
import type { CreateShipmentInput } from "./inputs.js";

export const Shipment = {
  order: (parent: ShipmentModel, _args: unknown, ctx: Context) =>
    ctx.services.shipment.resolveShipmentOrder(parent.orderId),
};

export const Query = {
  orderShipments: (
    _parent: unknown,
    { orderId }: { orderId: string },
    ctx: Context,
  ) => ctx.services.shipment.getOrderShipments(ctx.userId, orderId),
};

export const Mutation = {
  createShipment: (
    _parent: unknown,
    { input }: { input: CreateShipmentInput },
    ctx: Context,
  ) => ctx.services.shipment.createShipment(ctx.userId, input),
  updateShipmentStatus: (
    _parent: unknown,
    { id, status }: { id: string; status: string },
    ctx: Context,
  ) => ctx.services.shipment.updateShipmentStatus(ctx.userId, id, status),
};
