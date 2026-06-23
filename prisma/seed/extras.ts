import { faker } from "@faker-js/faker";
import type { SeedContext, SeedCounts } from "./types.js";
import type { Order } from "@prisma/client";
import { generateIds } from "./utils.js";

const ALL_STATUSES = ["DRAFT", "SENT", "PAID", "OVERDUE", "CANCELLED"] as const;
const RETURN_REASONS = ["DEFECTIVE", "NOT_AS_DESCRIBED", "WRONG_ITEM", "SIZE_ISSUE", "OTHER"] as const;
const RETURN_STATUSES = ["PENDING", "APPROVED", "REJECTED", "RECEIVED", "REFUNDED"] as const;
const TICKET_STATUSES = ["OPEN", "IN_PROGRESS", "WAITING_ON_CUSTOMER", "RESOLVED", "CLOSED"] as const;
const PRIORITIES = ["LOW", "MEDIUM", "HIGH", "URGENT"] as const;
const CATEGORIES = ["general", "billing", "technical", "account", "shipping", "returns"];

const TICKET_SUBJECTS = [
  "Order not delivered yet", "Payment issue with my order", "Wrong item received",
  "Account login problem", "Product quality concern", "Subscription cancellation request",
  "Refund status inquiry", "Shipping address change", "Discount code not working", "General inquiry",
];

export async function seedExtras(
  ctx: SeedContext,
  counts: SeedCounts,
  userIds: string[],
): Promise<void> {
  const orders = await ctx.prisma.order.findMany();

  // === Invoices ===
  console.log("Seeding invoices...");
  const invoiceIds = generateIds(orders.length);
  const invoiceData = orders.map((order, i) => {
    const status = faker.helpers.arrayElement(ALL_STATUSES);
    const issued = faker.date.past({ years: 1 });
    const due = new Date(issued);
    due.setDate(due.getDate() + faker.number.int({ min: 14, max: 45 }));
    return {
      id: invoiceIds[i],
      orderId: order.id,
      invoiceNumber: `INV-${order.id.slice(0, 8).toUpperCase()}-${i}`,
      amount: order.totalAmount,
      status,
      issuedAt: issued,
      paidAt: status === "PAID" ? faker.date.between({ from: issued, to: new Date() }) : undefined,
      dueDate: due,
    };
  });

  for (let i = 0; i < invoiceData.length; i += 500) {
    await ctx.prisma.invoice.createMany({ data: invoiceData.slice(i, i + 500) });
  }
  counts.invoices = invoiceData.length;

  // === Return Requests ===
  console.log("Seeding return requests...");
  const orderItems = await ctx.prisma.orderItem.findMany({ include: { order: true } });
  const returnCandidates = orderItems.filter((oi) => oi.order.status !== "CANCELLED");
  const sampleReturns = faker.helpers.arrayElements(
    returnCandidates,
    Math.min(500, returnCandidates.length),
  );

  const returnIds = generateIds(sampleReturns.length);
  const returnData = sampleReturns.map((oi, i) => {
    const status = faker.helpers.arrayElement(RETURN_STATUSES);
    const requested = faker.date.past({ years: 1 });
    return {
      id: returnIds[i],
      orderItemId: oi.id,
      userId: oi.order.userId,
      reason: faker.helpers.arrayElement(RETURN_REASONS),
      status,
      quantity: faker.number.int({ min: 1, max: oi.quantity }),
      requestedAt: requested,
      resolvedAt: status !== "PENDING"
        ? faker.date.between({ from: requested, to: new Date() })
        : undefined,
    };
  });

  for (let i = 0; i < returnData.length; i += 500) {
    await ctx.prisma.returnRequest.createMany({ data: returnData.slice(i, i + 500) });
  }
  counts.returns = returnData.length;

  // === Support Tickets ===
  console.log("Seeding support tickets...");
  const ticketIds = generateIds(300);
  const ticketData = ticketIds.map((id) => {
    const user = faker.helpers.arrayElement(userIds);
    return {
      id,
      userId: user,
      subject: faker.helpers.arrayElement(TICKET_SUBJECTS),
      description: faker.lorem.paragraphs({ min: 1, max: 3 }),
      status: faker.helpers.arrayElement(TICKET_STATUSES),
      priority: faker.helpers.arrayElement(PRIORITIES),
      category: faker.helpers.arrayElement(CATEGORIES),
      assignedTo: faker.datatype.boolean(0.4)
        ? faker.helpers.arrayElement(userIds)
        : undefined,
    };
  });

  for (let i = 0; i < ticketData.length; i += 100) {
    await ctx.prisma.supportTicket.createMany({ data: ticketData.slice(i, i + 100) });
  }
  counts.tickets = ticketData.length;

  // === Ticket Replies ===
  console.log("Seeding ticket replies...");
  const replyData: Array<{
    ticketId: string;
    userId: string;
    content: string;
    isStaff: boolean;
  }> = [];

  for (const ticket of ticketData) {
    const numReplies = faker.number.int({ min: 1, max: 4 });
    for (let j = 0; j < numReplies; j++) {
      const isStaff = j % 2 === 1;
      replyData.push({
        ticketId: ticket.id,
        userId: ticket.userId,
        content: faker.lorem.paragraphs({ min: 1, max: 2 }),
        isStaff,
      });
    }
  }

  for (let i = 0; i < replyData.length; i += 500) {
    await ctx.prisma.ticketReply.createMany({ data: replyData.slice(i, i + 500) });
  }
  counts.ticketReplies = replyData.length;
}
