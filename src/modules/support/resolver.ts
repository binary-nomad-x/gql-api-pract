import type { Context } from "@gql-prisma-api/types/context.js";
import type { CreateTicketInput, TicketFilterInput, AddTicketReplyInput } from "@gql-prisma-api/modules/support/inputs.js";
import {
  findMyTickets,
  findTicketById,
  createTicket,
  addTicketReply,
  resolveTicket,
  closeTicket,
} from "@gql-prisma-api/modules/support/service.js";

export const supportResolver = {
  Query: {
    myTickets: (_: unknown, args: TicketFilterInput, ctx: Context) =>
      findMyTickets(ctx.prisma, ctx.userId, args),
    ticket: (_: unknown, args: { id: string }, ctx: Context) =>
      findTicketById(ctx.prisma, ctx.userId, args.id),
    ticketReplies: async (_: unknown, args: { ticketId: string }, ctx: Context) => {
      const ticket = await findTicketById(ctx.prisma, ctx.userId, args.ticketId);
      return ticket.replies;
    },
  },
  Mutation: {
    createTicket: (_: unknown, args: { input: CreateTicketInput }, ctx: Context) =>
      createTicket(ctx.prisma, ctx.userId, args.input),
    addTicketReply: (_: unknown, args: { input: AddTicketReplyInput }, ctx: Context) =>
      addTicketReply(ctx.prisma, ctx.userId, args.input),
    resolveTicket: (_: unknown, args: { id: string }, ctx: Context) =>
      resolveTicket(ctx.prisma, ctx.userId, args.id),
    closeTicket: (_: unknown, args: { id: string }, ctx: Context) =>
      closeTicket(ctx.prisma, ctx.userId, args.id),
  },
  SupportTicket: {
    user: (parent: any) => parent.user,
    replies: (parent: any) => parent.replies,
  },
  TicketReply: {
    ticket: (parent: any) => parent.ticket,
    user: (parent: any) => parent.user,
  },
};
