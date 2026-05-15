import type { Context } from "../../types/context.js";
import { requireAuth, requireOwner } from "../../utils/errors.js";

export const AddressResolver = {
  user: (parent: any, _args: unknown, ctx: Context) =>
    ctx.prisma.user.findUnique({ where: { id: parent.userId } }),
};

export const AddressQueries = {
  myAddresses: (_parent: unknown, _args: unknown, ctx: Context) => {
    requireAuth(ctx.userId);
    return ctx.prisma.address.findMany({ where: { userId: ctx.userId! } });
  },
  address: async (_parent: unknown, { id }: { id: string }, ctx: Context) => {
    requireAuth(ctx.userId);
    return ctx.prisma.address.findFirst({ where: { id, userId: ctx.userId! } });
  },
};

export const AddressMutations = {
  createAddress: async (_parent: unknown, { input }: any, ctx: Context) => {
    requireAuth(ctx.userId);
    return ctx.prisma.address.create({ data: { ...input, userId: ctx.userId! } });
  },

  updateAddress: async (_parent: unknown, { id, input }: any, ctx: Context) => {
    requireAuth(ctx.userId);
    const addr = await ctx.prisma.address.findFirst({ where: { id, userId: ctx.userId! } });
    if (!addr) throw new Error("Address not found");
    return ctx.prisma.address.update({ where: { id }, data: input });
  },

  deleteAddress: async (_parent: unknown, { id }: any, ctx: Context) => {
    requireAuth(ctx.userId);
    const addr = await ctx.prisma.address.findFirst({ where: { id, userId: ctx.userId! } });
    if (!addr) throw new Error("Address not found");
    await ctx.prisma.address.delete({ where: { id } });
    return true;
  },

  setDefaultAddress: async (_parent: unknown, { id }: any, ctx: Context) => {
    requireAuth(ctx.userId);
    await ctx.prisma.address.updateMany({ where: { userId: ctx.userId!, isDefault: true }, data: { isDefault: false } });
    return ctx.prisma.address.update({ where: { id }, data: { isDefault: true } });
  },
};
