import type { PrismaClient, Prisma } from "@prisma/client";
import type { CreateTicketInput, TicketFilterInput, AddTicketReplyInput } from "@gql-prisma-api/modules/support/inputs.js";
import { requireAuth } from "@gql-prisma-api/utils/errors.js";
import { triggerNovuWorkflow } from "@gql-prisma-api/utils/novu.js";
import { logger } from "@gql-prisma-api/utils/logger.js";

export async function findMyTickets(
  prisma: PrismaClient,
  userId: string | undefined,
  filter?: TicketFilterInput,
) {
  requireAuth(userId);
  const where: Prisma.SupportTicketWhereInput = { userId };
  if (filter?.status) where.status = filter.status as any;

  return prisma.supportTicket.findMany({
    where,
    orderBy: { updatedAt: "desc" },
    take: filter?.limit ?? 20,
    skip: filter?.offset ?? 0,
    include: { replies: { include: { user: true }, orderBy: { createdAt: "asc" } } },
  });
}

export async function findTicketById(
  prisma: PrismaClient,
  userId: string | undefined,
  id: string,
) {
  requireAuth(userId);
  const ticket = await prisma.supportTicket.findUnique({
    where: { id },
    include: { replies: { include: { user: true }, orderBy: { createdAt: "asc" } } },
  });
  if (!ticket) throw new Error("Ticket not found");
  return ticket;
}

export async function createTicket(
  prisma: PrismaClient,
  userId: string | undefined,
  input: CreateTicketInput,
) {
  requireAuth(userId);
  const ticket = await prisma.supportTicket.create({
    data: {
      userId,
      subject: input.subject,
      description: input.description,
      priority: (input.priority ?? "MEDIUM") as any,
      category: input.category ?? "general",
    },
    include: { replies: true },
  });

  await prisma.notification.create({
    data: {
      userId,
      type: "TICKET_CREATED",
      title: "Support Ticket Created",
      message: `Ticket "${input.subject}" has been created.`,
    },
  });

  await triggerNovuWorkflow(userId!, "ticket-created", { ticketId: ticket.id, subject: input.subject });
  logger.info("Support ticket created", { ticketId: ticket.id, userId });
  return ticket;
}

export async function addTicketReply(
  prisma: PrismaClient,
  userId: string | undefined,
  input: AddTicketReplyInput,
) {
  requireAuth(userId);
  const ticket = await prisma.supportTicket.findUnique({ where: { id: input.ticketId } });
  if (!ticket) throw new Error("Ticket not found");

  const user = await prisma.user.findUnique({ where: { id: userId } });
  const isStaff = user?.role === "ADMIN" || user?.role === "MODERATOR";

  const reply = await prisma.ticketReply.create({
    data: {
      ticketId: input.ticketId,
      userId,
      content: input.content,
      isStaff,
    },
    include: { ticket: true, user: true },
  });

  await prisma.supportTicket.update({
    where: { id: input.ticketId },
    data: { status: "IN_PROGRESS" as any },
  });

  await triggerNovuWorkflow(userId!, "ticket-updated", { ticketId: input.ticketId, replyId: reply.id });
  logger.info("Ticket reply added", { ticketId: input.ticketId, userId });
  return reply;
}

export async function resolveTicket(
  prisma: PrismaClient,
  userId: string | undefined,
  id: string,
) {
  requireAuth(userId);
  const ticket = await prisma.supportTicket.findUnique({ where: { id } });
  if (!ticket) throw new Error("Ticket not found");

  const updated = await prisma.supportTicket.update({
    where: { id },
    data: { status: "RESOLVED" as any },
    include: { replies: { include: { user: true } } },
  });

  await triggerNovuWorkflow(userId!, "ticket-resolved", { ticketId: id });
  logger.info("Ticket resolved", { ticketId: id, userId });
  return updated;
}

export async function closeTicket(
  prisma: PrismaClient,
  userId: string | undefined,
  id: string,
) {
  requireAuth(userId);
  const ticket = await prisma.supportTicket.findUnique({ where: { id } });
  if (!ticket) throw new Error("Ticket not found");

  const updated = await prisma.supportTicket.update({
    where: { id },
    data: { status: "CLOSED" as any },
    include: { replies: { include: { user: true } } },
  });

  logger.info("Ticket closed", { ticketId: id, userId });
  return updated;
}
