import type { Context } from "@gql-prisma-api/types/context.js";
import type { Address as AddressModel } from "@prisma/client";
import type { IdArg } from "@gql-prisma-api/types/graphql.js";
import type { CreateAddressInput, UpdateAddressInput } from "./inputs.js";
import {
  createAddress, updateAddress, deleteAddress, setDefaultAddress,
  getMyAddresses, getAddress,
  resolveAddressUser,
} from "./service.js";

export const Address = {
  user: (parent: AddressModel, _args: unknown, ctx: Context) =>
    resolveAddressUser(ctx.prisma, parent.userId),
};

export const Query = {
  myAddresses: (_parent: unknown, _args: unknown, ctx: Context) =>
    getMyAddresses(ctx.prisma, ctx.userId),

  address: (_parent: unknown, { id }: IdArg, ctx: Context) =>
    getAddress(ctx.prisma, ctx.userId, id),
};

export const Mutation = {
  createAddress: (_parent: unknown, { input }: { input: CreateAddressInput }, ctx: Context) =>
    createAddress(ctx.prisma, ctx.userId, input),

  updateAddress: (_parent: unknown, { id, input }: { id: string; input: UpdateAddressInput }, ctx: Context) =>
    updateAddress(ctx.prisma, ctx.userId, id, input),

  deleteAddress: (_parent: unknown, { id }: IdArg, ctx: Context) =>
    deleteAddress(ctx.prisma, ctx.userId, id),

  setDefaultAddress: (_parent: unknown, { id }: IdArg, ctx: Context) =>
    setDefaultAddress(ctx.prisma, ctx.userId, id),
};
