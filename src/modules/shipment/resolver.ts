import type { Context } from "@gql-prisma-api/types/context.js";
import type { Shipment as ShipmentModel } from "@prisma/client";
import type { CreateShipmentInput } from "./inputs.js";
import {
  createShipment,
  updateShipmentStatus,
  getOrderShipments,
  resolveShipmentOrder,
} from "./service.js";

export const Shipment = {
  order: (parent: ShipmentModel, _args: unknown, ctx: Context) =>
    resolveShipmentOrder(ctx.prisma, parent.orderId),
};

export const Query = {
  orderShipments: (
    _parent: unknown,
    { orderId }: { orderId: string },
    ctx: Context,
  ) => getOrderShipments(ctx.prisma, ctx.userId, orderId),
};

export const Mutation = {
  createShipment: (
    _parent: unknown,
    { input }: { input: CreateShipmentInput },
    ctx: Context,
  ) => createShipment(ctx.prisma, ctx.userId, input),
  updateShipmentStatus: (
    _parent: unknown,
    { id, status }: { id: string; status: string },
    ctx: Context,
  ) => updateShipmentStatus(ctx.prisma, ctx.userId, id, status),
};
