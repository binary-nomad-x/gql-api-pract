export const Refund = {
  payment: async (parent: any, _args: any, ctx: any) => {
    return ctx.prisma.payment.findUnique({ where: { id: parent.paymentId } });
  },
  order: async (parent: any, _args: any, ctx: any) => {
    return ctx.prisma.order.findUnique({ where: { id: parent.orderId } });
  },
};
