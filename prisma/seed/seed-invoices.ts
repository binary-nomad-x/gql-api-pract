import { faker } from "@faker-js/faker";
import type { SeedContext, SeedCounts } from "./types.js";

export async function seedInvoices(
  ctx: SeedContext,
  counts: SeedCounts,
  orderIds: string[],
): Promise<void> {
  const orders = await ctx.prisma.order.findMany({
    where: { id: { in: orderIds } },
    select: {
      id: true,
      totalAmount: true,
      discountAmount: true,
      status: true,
    },
  });

  const data: Array<{
    orderId: string;
    invoiceNumber: string;
    amount: number;
    status: string;
    dueDate: Date;
    paidAt: Date | null;
  }> = [];

  for (let i = 0; i < orders.length; i++) {
    const order = orders[i];
    const isPaid = order.status !== "PENDING" && order.status !== "CANCELLED";

    data.push({
      orderId: order.id,
      invoiceNumber: `INV-${String(i + 1).padStart(6, "0")}`,
      amount: order.totalAmount - order.discountAmount,
      status: isPaid ? "PAID" : order.status === "CANCELLED" ? "CANCELLED" : "PENDING",
      dueDate: faker.date.future(),
      paidAt: isPaid ? faker.date.past() : null,
    });
  }

  await ctx.prisma.invoice.createMany({ data });
  counts.invoices += data.length;
}
