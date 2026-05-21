import type { Context } from "@gql-prisma-api/types/context.js";
import type { Parent } from "@gql-prisma-api/types/graphql.js";
import type { CreateShipmentInput } from "@gql-prisma-api/types/inputs.js";
import {
  createShipment, updateShipmentStatus, getOrderShipments,
} from "./service.js";

export const ShipmentResolver = {
  order: (parent: Parent, _args: unknown, ctx: Context) =>
    ctx.prisma.order.findUnique({ where: { id: parent.orderId as string } }),
};

export const ShipmentQueries = {
  orderShipments: async (_parent: unknown, { orderId }: { orderId: string }, ctx: Context) =>
    getOrderShipments(ctx.prisma, ctx.userId, orderId),
};

export const ShipmentMutations = {
  createShipment: async (_parent: unknown, { input }: { input: CreateShipmentInput }, ctx: Context) =>
    createShipment(ctx.prisma, ctx.userId, input),

  updateShipmentStatus: async (_parent: unknown, { id, status }: { id: string; status: string }, ctx: Context) =>
    updateShipmentStatus(ctx.prisma, ctx.userId, id, status),
};
