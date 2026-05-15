export const Product = {
  seller: async (parent: any, _args: any, ctx: any) => {
    return ctx.prisma.user.findUnique({ where: { id: parent.sellerId } });
  },
  category: async (parent: any, _args: any, ctx: any) => {
    if (!parent.categoryId) return null;
    return ctx.prisma.category.findUnique({ where: { id: parent.categoryId } });
  },
  orderItems: async (parent: any, _args: any, ctx: any) => {
    return ctx.prisma.orderItem.findMany({ where: { productId: parent.id } });
  },
  reviews: async (parent: any, _args: any, ctx: any) => {
    return ctx.prisma.review.findMany({ where: { productId: parent.id } });
  },
  reviewCount: async (parent: any, _args: any, ctx: any) => {
    return ctx.prisma.review.count({ where: { productId: parent.id } });
  },
  averageRating: async (parent: any, _args: any, ctx: any) => {
    const result = await ctx.prisma.review.aggregate({
      where: { productId: parent.id },
      _avg: { rating: true },
    });
    return result._avg.rating;
  },
};
