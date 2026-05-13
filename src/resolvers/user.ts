// src/resolvers/User.ts
export const User = {
  profile: async (parent: any, _args: any, ctx: any) => {
    return ctx.prisma.profile.findUnique({
      where: { userId: parent.id },
    });
  },
  posts: async (parent: any, _args: any, ctx: any) => {
    return ctx.prisma.post.findMany({
      where: { authorId: parent.id },
    });
  },
};
