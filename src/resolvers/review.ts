export const Review = {
  product: async (parent: any, _args: any, ctx: any) => {
    return ctx.prisma.product.findUnique({ where: { id: parent.productId } });
  },
  user: async (parent: any, _args: any, ctx: any) => {
    return ctx.prisma.user.findUnique({ where: { id: parent.userId } });
  },
};
