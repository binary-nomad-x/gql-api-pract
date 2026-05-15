export const Category = {
  posts: async (parent: any, _args: any, ctx: any) => {
    return ctx.prisma.post.findMany({
      where: { categories: { some: { id: parent.id } } },
    });
  },
  postCount: async (parent: any, _args: any, ctx: any) => {
    return ctx.prisma.post.count({
      where: { categories: { some: { id: parent.id } } },
    });
  },
};
