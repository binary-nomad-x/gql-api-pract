import type { Context } from "../../types/context.js";
import { requireAuth } from "../../utils/errors.js";

export const ShipmentResolver = {
  order: (parent: any, _args: unknown, ctx: Context) =>
    ctx.prisma.order.findUnique({ where: { id: parent.orderId } }),
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
  createShipment: async (_parent: unknown, { input }: any, ctx: Context) => {
    requireAuth(ctx.userId);
    return ctx.prisma.shipment.create({ data: input });
  },

  updateShipmentStatus: async (_parent: unknown, { id, status }: any, ctx: Context) => {
    requireAuth(ctx.userId);
    return ctx.prisma.shipment.update({ where: { id }, data: { status } });
  },
};
