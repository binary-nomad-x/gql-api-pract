import type { Context } from "../../types/context.js";
import type { Parent, IdArg } from "../../types/graphql.js";
import type { CreateShipmentInput } from "../../types/inputs.js";
import { requireAuth } from "../../utils/errors.js";

export const ShipmentResolver = {
  order: (parent: Parent, _args: unknown, ctx: Context) =>
    ctx.prisma.order.findUnique({ where: { id: parent.orderId as string } }),
};

export const ShipmentQueries = {
  orderShipments: async (_parent: unknown, { orderId }: { orderId: string }, ctx: Context) => {
    requireAuth(ctx.userId);
    return ctx.prisma.shipment.findMany({
      where: { orderId, order: { userId: ctx.userId! } },
    });
  },
};

export const ShipmentMutations = {
  createShipment: async (_parent: unknown, { input }: { input: CreateShipmentInput }, ctx: Context) => {
    requireAuth(ctx.userId);
    return ctx.prisma.shipment.create({ data: input });
  },

  updateShipmentStatus: async (_parent: unknown, { id, status }: { id: string; status: string }, ctx: Context) => {
    requireAuth(ctx.userId);
    return ctx.prisma.shipment.update({ where: { id }, data: { status } as any });
  },
};
