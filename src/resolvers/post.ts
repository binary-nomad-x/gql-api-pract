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
  categories: async (parent: any, _args: any, ctx: any) => {
    return ctx.prisma.category.findMany({
      where: { posts: { some: { id: parent.id } } },
    });
  },
  comments: async (parent: any, _args: any, ctx: any) => {
    return ctx.prisma.comment.findMany({
      where: { postId: parent.id },
    });
  },
  likes: async (parent: any, _args: any, ctx: any) => {
    return ctx.prisma.like.findMany({
      where: { postId: parent.id },
    });
  },
  likeCount: async (parent: any, _args: any, ctx: any) => {
    return ctx.prisma.like.count({
      where: { postId: parent.id },
    });
  },
  commentCount: async (parent: any, _args: any, ctx: any) => {
    return ctx.prisma.comment.count({
      where: { postId: parent.id },
    });
  },
};
