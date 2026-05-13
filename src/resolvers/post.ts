// src/resolvers/Post.ts
export const Post = {
  author: async (parent: any, _args: any, ctx: any) => {
    return ctx.prisma.user.findUnique({
      where: { id: parent.authorId },
    });
  },
  tags: async (parent: any, _args: any, ctx: any) => {
    return ctx.prisma.tag.findMany({
      where: { posts: { some: { id: parent.id } } },
    });
  },
};
