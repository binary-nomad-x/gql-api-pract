import type { Context } from "@gql-prisma-api/types/context.js";
import type {
  CreateTicketInput,
  TicketFilterInput,
  AddTicketReplyInput,
} from "./inputs.js";
import {
  findMyTickets,
  findTicketById,
  createTicket,
  addTicketReply,
  resolveTicket,
  closeTicket,
  resolveSupportTicketUser,
  resolveSupportTicketReplies,
  resolveTicketReplyTicket,
  resolveTicketReplyUser,
} from "./service.js";

export const SupportTicket = {
  user: (parent: Record<string, unknown>, _args: unknown, _ctx: Context) =>
    resolveSupportTicketUser(parent),
  replies: (parent: Record<string, unknown>, _args: unknown, _ctx: Context) =>
    resolveSupportTicketReplies(parent),
};

export const TicketReply = {
  ticket: (parent: Record<string, unknown>, _args: unknown, _ctx: Context) =>
    resolveTicketReplyTicket(parent),
  user: (parent: Record<string, unknown>, _args: unknown, _ctx: Context) =>
    resolveTicketReplyUser(parent),
};

export const Query = {
  myTickets: (_: unknown, args: TicketFilterInput, ctx: Context) =>
    findMyTickets(ctx.prisma, ctx.userId, args),
  ticket: (_: unknown, args: { id: string }, ctx: Context) =>
    findTicketById(ctx.prisma, ctx.userId, args.id),
  ticketReplies: async (
    _: unknown,
    args: { ticketId: string },
    ctx: Context,
  ) => {
    const ticket = await findTicketById(
      ctx.prisma,
      ctx.userId,
      args.ticketId,
    );
    return ticket.replies;
  },
};

export const Mutation = {
  createTicket: (
    _: unknown,
    args: { input: CreateTicketInput },
    ctx: Context,
  ) => createTicket(ctx.prisma, ctx.userId, args.input),
  addTicketReply: (
    _: unknown,
    args: { input: AddTicketReplyInput },
    ctx: Context,
  ) => addTicketReply(ctx.prisma, ctx.userId, args.input),
  resolveTicket: (_: unknown, args: { id: string }, ctx: Context) =>
    resolveTicket(ctx.prisma, ctx.userId, args.id),
  closeTicket: (_: unknown, args: { id: string }, ctx: Context) =>
    closeTicket(ctx.prisma, ctx.userId, args.id),
};
