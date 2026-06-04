import type { Context } from "@gql-prisma-api/types/context.js";
import type { Parent, IdArg } from "@gql-prisma-api/types/graphql.js";
import type { CreateAddressInput, UpdateAddressInput } from "@gql-prisma-api/modules/address/inputs.js";
import {
  createAddress, updateAddress, deleteAddress, setDefaultAddress,
  getMyAddresses, getAddress,
} from "./service.js";

export const AddressResolver = {
  user: (parent: Parent, _args: unknown, ctx: Context) =>
    ctx.prisma.user.findUnique({ where: { id: parent.userId as string } }),
};

export const AddressQueries = {
  myAddresses: (_parent: unknown, _args: unknown, ctx: Context) =>
    getMyAddresses(ctx.prisma, ctx.userId),

  address: async (_parent: unknown, { id }: IdArg, ctx: Context) =>
    getAddress(ctx.prisma, ctx.userId, id),
};

export const AddressMutations = {
  createAddress: async (_parent: unknown, { input }: { input: CreateAddressInput }, ctx: Context) =>
    createAddress(ctx.prisma, ctx.userId, input),

  updateAddress: async (_parent: unknown, { id, input }: { id: string; input: UpdateAddressInput }, ctx: Context) =>
    updateAddress(ctx.prisma, ctx.userId, id, input),

  deleteAddress: async (_parent: unknown, { id }: IdArg, ctx: Context) =>
    deleteAddress(ctx.prisma, ctx.userId, id),

  setDefaultAddress: async (_parent: unknown, { id }: IdArg, ctx: Context) =>
    setDefaultAddress(ctx.prisma, ctx.userId, id),
};
