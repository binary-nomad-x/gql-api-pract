import { faker } from "@faker-js/faker";
import type { SeedContext, SeedCounts } from "./types.js";
import type { Order } from "@prisma/client";
import { generateIds, bulkInsert } from "./utils.js";

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
  const invIds = generateIds(orders.length);
  await bulkInsert(ctx.pool, "invoices", orders.map((order, i) => {
    const status = faker.helpers.arrayElement(ALL_STATUSES);
    const issued = faker.date.past({ years: 1 });
    const due = new Date(issued);
    due.setDate(due.getDate() + faker.number.int({ min: 14, max: 45 }));
    return {
      id: invIds[i], orderId: order.id,
      invoiceNumber: `INV-${order.id.slice(0, 8).toUpperCase()}-${i}`,
      amount: order.totalAmount, status,
      issuedAt: issued,
      paidAt: status === "PAID" ? faker.date.between({ from: issued, to: new Date() }) : undefined,
      dueDate: due,
      updatedAt: new Date(),
    };
  }), 500);
  counts.invoices = invIds.length;

  // === Return Requests ===
  console.log("Seeding return requests...");
  const orderItems = await ctx.prisma.orderItem.findMany({ include: { order: true } });
  const candidates = orderItems.filter((oi) => oi.order.status !== "CANCELLED");
  const sample = faker.helpers.arrayElements(candidates, Math.min(500, candidates.length));
  const retIds = generateIds(sample.length);
  await bulkInsert(ctx.pool, "return_requests", sample.map((oi, i) => {
    const status = faker.helpers.arrayElement(RETURN_STATUSES);
    const requested = faker.date.past({ years: 1 });
    return {
      id: retIds[i], orderItemId: oi.id, userId: oi.order.userId,
      reason: faker.helpers.arrayElement(RETURN_REASONS), status,
      quantity: faker.number.int({ min: 1, max: oi.quantity }),
      requestedAt: requested,
      resolvedAt: status !== "PENDING" ? faker.date.between({ from: requested, to: new Date() }) : undefined,
    };
  }), 500);
  counts.returns = sample.length;

  // === Support Tickets ===
  console.log("Seeding support tickets...");
  const ticketIds = generateIds(300);
  await bulkInsert(ctx.pool, "support_tickets", ticketIds.map((id) => ({
    id, userId: faker.helpers.arrayElement(userIds),
    subject: faker.helpers.arrayElement(TICKET_SUBJECTS),
    description: faker.lorem.paragraphs({ min: 1, max: 3 }),
    status: faker.helpers.arrayElement(TICKET_STATUSES),
    priority: faker.helpers.arrayElement(PRIORITIES),
    category: faker.helpers.arrayElement(CATEGORIES),
    assignedTo: faker.datatype.boolean(0.4) ? faker.helpers.arrayElement(userIds) : undefined,
    updatedAt: new Date(),
  })), 100);
  counts.tickets = ticketIds.length;

  // === Ticket Replies ===
  console.log("Seeding ticket replies...");
  const replyRows: Array<{ id: string; ticketId: string; userId: string; content: string; isStaff: boolean; updatedAt: Date }> = [];
  for (const ticketId of ticketIds) {
    const n = faker.number.int({ min: 1, max: 4 });
    const ids = generateIds(n);
    for (let j = 0; j < n; j++) {
      replyRows.push({
        id: ids[j], ticketId, userId: faker.helpers.arrayElement(userIds),
        content: faker.lorem.paragraphs({ min: 1, max: 2 }),
        isStaff: j % 2 === 1,
        updatedAt: new Date(),
      });
    }
  }
  await bulkInsert(ctx.pool, "ticket_replies", replyRows, 500);
  counts.ticketReplies = replyRows.length;
}
