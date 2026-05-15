import type { Context } from "../../types/context.js";
import type { Parent, IdArg } from "../../types/graphql.js";
import type { CreateAddressInput, UpdateAddressInput } from "../../types/inputs.js";
import { requireAuth } from "../../utils/errors.js";
import { clean } from "../../utils/clean.js";

export const AddressResolver = {
  user: (parent: Parent, _args: unknown, ctx: Context) =>
    ctx.prisma.user.findUnique({ where: { id: parent.userId as string } }),
};

export const AddressQueries = {
  myAddresses: (_parent: unknown, _args: unknown, ctx: Context) => {
    requireAuth(ctx.userId);
    return ctx.prisma.address.findMany({ where: { userId: ctx.userId! } });
  },

  address: async (_parent: unknown, { id }: IdArg, ctx: Context) => {
    requireAuth(ctx.userId);
    return ctx.prisma.address.findFirst({ where: { id, userId: ctx.userId! } });
  },
};

export const AddressMutations = {
  createAddress: async (_parent: unknown, { input }: { input: CreateAddressInput }, ctx: Context) => {
    requireAuth(ctx.userId);
    return ctx.prisma.address.create({
      data: clean({ ...input, userId: ctx.userId!, country: input.country ?? "US", label: input.label ?? "Home" }) as any,
    });
  },

  updateAddress: async (_parent: unknown, { id, input }: { id: string; input: UpdateAddressInput }, ctx: Context) => {
    requireAuth(ctx.userId);
    const addr = await ctx.prisma.address.findFirst({ where: { id, userId: ctx.userId! } });
    if (!addr) throw new Error("Address not found");
    return ctx.prisma.address.update({ where: { id }, data: clean(input as any) });
  },

  deleteAddress: async (_parent: unknown, { id }: IdArg, ctx: Context) => {
    requireAuth(ctx.userId);
    const addr = await ctx.prisma.address.findFirst({ where: { id, userId: ctx.userId! } });
    if (!addr) throw new Error("Address not found");
    await ctx.prisma.address.delete({ where: { id } });
    return true;
  },

  setDefaultAddress: async (_parent: unknown, { id }: IdArg, ctx: Context) => {
    requireAuth(ctx.userId);
    await ctx.prisma.address.updateMany({
      where: { userId: ctx.userId!, isDefault: true },
      data: { isDefault: false },
    });
    return ctx.prisma.address.update({ where: { id }, data: { isDefault: true } });
  },
};
