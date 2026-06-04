import { faker } from "@faker-js/faker";
import type { SeedContext, SeedCounts } from "./types.js";
import type { User, Order, OrderItem, InvoiceStatus, ReturnStatus, TicketStatus } from "@prisma/client";

export async function seedExtras(
  ctx: SeedContext, counts: SeedCounts,
  users: User[], products: any[],
): Promise<void> {
  const orders = await ctx.prisma.order.findMany();
  const orderItems = await ctx.prisma.orderItem.findMany({ include: { order: true } });
  const allStatuses: InvoiceStatus[] = ["DRAFT", "SENT", "PAID", "OVERDUE", "CANCELLED"];
  const returnReasons: any[] = ["DEFECTIVE", "NOT_AS_DESCRIBED", "WRONG_ITEM", "SIZE_ISSUE", "OTHER"];
  const returnStatuses: ReturnStatus[] = ["PENDING", "APPROVED", "REJECTED", "RECEIVED", "REFUNDED"];
  const ticketStatuses: TicketStatus[] = ["OPEN", "IN_PROGRESS", "WAITING_ON_CUSTOMER", "RESOLVED", "CLOSED"];
  const priorities: any[] = ["LOW", "MEDIUM", "HIGH", "URGENT"];
  const categories = ["general", "billing", "technical", "account", "shipping", "returns"];

  // === Invoices ===
  console.log("Seeding invoices...");
  const invoiceData: Array<{
    orderId: string; invoiceNumber: string; amount: number;
    status: InvoiceStatus; issuedAt: Date; paidAt?: Date; dueDate: Date;
  }> = [];

  let invIdx = 0;
  for (const order of orders) {
    const status = faker.helpers.arrayElement(allStatuses);
    const issued = faker.date.past({ days: 30 });
    const due = new Date(issued);
    due.setDate(due.getDate() + faker.number.int({ min: 14, max: 45 }));

    invoiceData.push({
      orderId: order.id,
      invoiceNumber: `INV-${order.id.slice(0, 8).toUpperCase()}-${invIdx++}`,
      amount: order.totalAmount,
      status,
      issuedAt: issued,
      paidAt: status === "PAID" ? faker.date.between({ from: issued, to: new Date() }) : undefined,
      dueDate: due,
    });
  }

  for (let i = 0; i < invoiceData.length; i += 500) {
    await ctx.prisma.invoice.createMany({ data: invoiceData.slice(i, i + 500) });
  }
  counts.invoices = invoiceData.length;

  // === Return Requests ===
  console.log("Seeding return requests...");
  const returnData: Array<{
    orderItemId: string; userId: string; reason: string;
    status: ReturnStatus; quantity: number; requestedAt: Date; resolvedAt?: Date;
  }> = [];

  const returnCandidates = orderItems.filter((oi) => oi.order.status !== "CANCELLED");
  const sampleReturns = faker.helpers.arrayElements(returnCandidates, Math.min(500, returnCandidates.length));

  for (const oi of sampleReturns) {
    const status = faker.helpers.arrayElement(returnStatuses);
    const requested = faker.date.past({ days: 20 });
    returnData.push({
      orderItemId: oi.id,
      userId: oi.order.userId,
      reason: faker.helpers.arrayElement(returnReasons),
      status,
      quantity: faker.number.int({ min: 1, max: oi.quantity }),
      requestedAt: requested,
      resolvedAt: status !== "PENDING" ? faker.date.between({ from: requested, to: new Date() }) : undefined,
    });
  }

  for (let i = 0; i < returnData.length; i += 500) {
    await ctx.prisma.returnRequest.createMany({ data: returnData.slice(i, i + 500) });
  }
  counts.returns = returnData.length;

  // === Support Tickets ===
  console.log("Seeding support tickets...");
  const ticketData: Array<{
    userId: string; subject: string; description: string;
    status: TicketStatus; priority: string; category: string; assignedTo?: string;
  }> = [];

  for (let i = 0; i < 300; i++) {
    const user = faker.helpers.arrayElement(users);
    ticketData.push({
      userId: user.id,
      subject: faker.helpers.arrayElement([
        "Order not delivered yet",
        "Payment issue with my order",
        "Wrong item received",
        "Account login problem",
        "Product quality concern",
        "Subscription cancellation request",
        "Refund status inquiry",
        "Shipping address change",
        "Discount code not working",
        "General inquiry",
      ]),
      description: faker.lorem.paragraphs({ min: 1, max: 3 }),
      status: faker.helpers.arrayElement(ticketStatuses),
      priority: faker.helpers.arrayElement(priorities),
      category: faker.helpers.arrayElement(categories),
      assignedTo: faker.datatype.boolean(0.4) ? faker.helpers.arrayElement(users.filter((u) => u.role !== "USER")).id : undefined,
    });
  }

  for (let i = 0; i < ticketData.length; i += 100) {
    await ctx.prisma.supportTicket.createMany({ data: ticketData.slice(i, i + 100) });
  }
  counts.tickets = ticketData.length;

  const tickets = await ctx.prisma.supportTicket.findMany();

  // === Ticket Replies ===
  console.log("Seeding ticket replies...");
  const replyData: Array<{
    ticketId: string; userId: string; content: string; isStaff: boolean;
  }> = [];

  const staffUsers = users.filter((u) => u.role === "ADMIN" || u.role === "MODERATOR");
  const staffUser = staffUsers.length > 0 ? staffUsers[0] : users[0];

  for (const ticket of tickets) {
    const numReplies = faker.number.int({ min: 1, max: 4 });
    for (let j = 0; j < numReplies; j++) {
      const isStaff = j % 2 === 1;
      replyData.push({
        ticketId: ticket.id,
        userId: isStaff ? staffUser.id : ticket.userId,
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
