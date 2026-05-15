export const Comment = {
  author: async (parent: any, _args: any, ctx: any) => {
    return ctx.prisma.user.findUnique({
      where: { id: parent.authorId },
    });
  },
  post: async (parent: any, _args: any, ctx: any) => {
    return ctx.prisma.post.findUnique({
      where: { id: parent.postId },
    });
  },
};
