import type { Context } from "@gql-prisma-api/types/context.js";
import type { CreateInvoiceInput, InvoiceFilterInput } from "@gql-prisma-api/modules/invoice/inputs.js";
import {
  findMyInvoices,
  findInvoiceById,
  createInvoice,
  markInvoicePaid,
  cancelInvoice,
} from "@gql-prisma-api/modules/invoice/service.js";

export const invoiceResolver = {
  Query: {
    myInvoices: (_: unknown, args: InvoiceFilterInput, ctx: Context) =>
      findMyInvoices(ctx.prisma, ctx.userId, args),
    invoice: (_: unknown, args: { id: string }, ctx: Context) =>
      findInvoiceById(ctx.prisma, ctx.userId, args.id),
  },
  Mutation: {
    createInvoice: (_: unknown, args: { input: CreateInvoiceInput }, ctx: Context) =>
      createInvoice(ctx.prisma, ctx.userId, args.input),
    markInvoicePaid: (_: unknown, args: { id: string }, ctx: Context) =>
      markInvoicePaid(ctx.prisma, ctx.userId, args.id),
    cancelInvoice: (_: unknown, args: { id: string }, ctx: Context) =>
      cancelInvoice(ctx.prisma, ctx.userId, args.id),
  },
  Invoice: {
    order: (parent: any) => parent.order,
  },
};
