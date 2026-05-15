export const User = {
  profile: async (parent: any, _args: any, ctx: any) => {
    return ctx.prisma.profile.findUnique({ where: { userId: parent.id } });
  },
  posts: async (parent: any, _args: any, ctx: any) => {
    return ctx.prisma.post.findMany({ where: { authorId: parent.id } });
  },
  comments: async (parent: any, _args: any, ctx: any) => {
    return ctx.prisma.comment.findMany({ where: { authorId: parent.id } });
  },
  likes: async (parent: any, _args: any, ctx: any) => {
    return ctx.prisma.like.findMany({ where: { userId: parent.id } });
  },
  products: async (parent: any, _args: any, ctx: any) => {
    return ctx.prisma.product.findMany({ where: { sellerId: parent.id } });
  },
  orders: async (parent: any, _args: any, ctx: any) => {
    return ctx.prisma.order.findMany({ where: { userId: parent.id } });
  },
  reviews: async (parent: any, _args: any, ctx: any) => {
    return ctx.prisma.review.findMany({ where: { userId: parent.id } });
  },
};
