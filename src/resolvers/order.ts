export const Order = {
  user: async (parent: any, _args: any, ctx: any) => {
    return ctx.prisma.user.findUnique({ where: { id: parent.userId } });
  },
  items: async (parent: any, _args: any, ctx: any) => {
    return ctx.prisma.orderItem.findMany({ where: { orderId: parent.id } });
  },
  payment: async (parent: any, _args: any, ctx: any) => {
    return ctx.prisma.payment.findUnique({ where: { orderId: parent.id } });
  },
  refunds: async (parent: any, _args: any, ctx: any) => {
    return ctx.prisma.refund.findMany({ where: { orderId: parent.id } });
  },
  itemCount: async (parent: any, _args: any, ctx: any) => {
    return ctx.prisma.orderItem.count({ where: { orderId: parent.id } });
  },
};
