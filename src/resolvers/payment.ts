export const Payment = {
  order: async (parent: any, _args: any, ctx: any) => {
    return ctx.prisma.order.findUnique({ where: { id: parent.orderId } });
  },
  refunds: async (parent: any, _args: any, ctx: any) => {
    return ctx.prisma.refund.findMany({ where: { paymentId: parent.id } });
  },
};
