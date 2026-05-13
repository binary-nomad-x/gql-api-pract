// src/resolvers/Profile.ts
export const Profile = {
  user: async (parent: any, _args: any, ctx: any) => {
    return ctx.prisma.user.findUnique({
      where: { id: parent.userId },
    });
  },
};
