export const OrderItem = {
  order: async (parent: any, _args: any, ctx: any) => {
    return ctx.prisma.order.findUnique({ where: { id: parent.orderId } });
  },
  product: async (parent: any, _args: any, ctx: any) => {
    return ctx.prisma.product.findUnique({ where: { id: parent.productId } });
  },
};
