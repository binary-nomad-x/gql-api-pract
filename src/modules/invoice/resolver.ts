import type { Context } from "@gql-prisma-api/types/context.js";
import type { Invoice as InvoiceModel } from "@prisma/client";
import type { CreateInvoiceInput, InvoiceFilterInput } from "./inputs.js";
import {
  resolveInvoiceOrder,
  findMyInvoices,
  findInvoiceById,
  createInvoice,
  markInvoicePaid,
  cancelInvoice,
} from "./service.js";

export const Query = {
  myInvoices: (_parent: unknown, args: InvoiceFilterInput, ctx: Context) =>
    findMyInvoices(ctx.prisma, ctx.userId, args),
  invoice: (_parent: unknown, { id }: { id: string }, ctx: Context) =>
    findInvoiceById(ctx.prisma, ctx.userId, id),
};

export const Mutation = {
  createInvoice: (_parent: unknown, { input }: { input: CreateInvoiceInput }, ctx: Context) =>
    createInvoice(ctx.prisma, ctx.userId, input),
  markInvoicePaid: (_parent: unknown, { id }: { id: string }, ctx: Context) =>
    markInvoicePaid(ctx.prisma, ctx.userId, id),
  cancelInvoice: (_parent: unknown, { id }: { id: string }, ctx: Context) =>
    cancelInvoice(ctx.prisma, ctx.userId, id),
};

export const Invoice = {
  order: (parent: InvoiceModel, _args: unknown, ctx: Context) =>
    resolveInvoiceOrder(ctx.prisma, parent.orderId),
};
