import { faker } from "@faker-js/faker";
import type { SeedContext, SeedCounts } from "./types.js";

export async function seedReturns(ctx: SeedContext, counts: SeedCounts, userIds: string[], orderIds: string[]): Promise<void> {

  const orderItems = await ctx.prisma.orderItem.findMany({
    where: { order: { id: { in: orderIds }, status: "DELIVERED" } },
    select: { id: true, orderId: true, productId: true, quantity: true },
    take: 300,
  });

  if (orderItems.length === 0) return;

  const returnItems = orderItems.filter(() => Math.random() > 0.8);

  const data: {
    orderItemId: string;
    userId: string;
    reason: string;
    reasonDescription: string;
    resolution: string;
    refundAmount: number;
    returnLabelUrl: string;
    condition: string;
    status: string;
    quantity: number;
    images?: string[] | object[];
    resolvedAt: Date | null;
    pickedUpAt: Date | null;
    deliveredBackAt: Date | null;
    inspectedAt: Date | null;
  }[] = [];

  for (const item of returnItems) {
    data.push({
      orderItemId: item.id,
      userId: faker.helpers.arrayElement(userIds),
      reason: faker.helpers.arrayElement([
        "Defective product",
        "Wrong size",
        "Not as described",
        "Changed mind",
        "Quality issue",
        "Damaged in shipping",
      ]),
      reasonDescription: faker.lorem.sentences({ min: 1, max: 2 }),
      resolution: faker.helpers.arrayElement(["refund", "replacement", "store_credit"]),
      refundAmount: parseFloat(faker.commerce.price({ min: 10, max: 200 })),
      returnLabelUrl: `https://returns.example.com/label/${faker.string.alphanumeric(10)}`,
      condition: faker.helpers.arrayElement(["new", "like_new", "used", "damaged"]),
      status: faker.helpers.arrayElement(["PENDING", "APPROVED", "REJECTED", "REFUNDED"]),
      quantity: faker.number.int({ min: 1, max: Math.min(item.quantity, 3) }),
      images: Array.from({ length: faker.number.int({ min: 1, max: 3 }) }, () => faker.image.url()),
      resolvedAt: Math.random() > 0.5 ? faker.date.past() : null,
      pickedUpAt: Math.random() > 0.5 ? faker.date.past() : null,
      deliveredBackAt: Math.random() > 0.5 ? faker.date.past() : null,
      inspectedAt: Math.random() > 0.5 ? faker.date.past() : null,
    });
  }

  await ctx.prisma.returnRequest.createMany({ data });
  counts.returns += data.length;
}
