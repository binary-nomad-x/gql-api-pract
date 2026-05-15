export const Category = {
  posts: async (parent: any, _args: any, ctx: any) => {
    return ctx.prisma.post.findMany({
      where: { categories: { some: { id: parent.id } } },
    });
  },
  products: async (parent: any, _args: any, ctx: any) => {
    return ctx.prisma.product.findMany({
      where: { categoryId: parent.id },
    });
  },
  postCount: async (parent: any, _args: any, ctx: any) => {
    return ctx.prisma.post.count({
      where: { categories: { some: { id: parent.id } } },
    });
  },
  productCount: async (parent: any, _args: any, ctx: any) => {
    return ctx.prisma.product.count({
      where: { categoryId: parent.id },
    });
  },
};
