import { faker } from "@faker-js/faker";
import type { SeedContext, SeedCounts, ReturnSeed } from "./types.js";

export async function seedReturns(
  ctx: SeedContext,
  counts: SeedCounts,
  userIds: string[],
  orderIds: string[],
): Promise<void> {
  const orderItems = await ctx.prisma.orderItem.findMany({
    where: {
      order: {
        id: { in: orderIds },
        status: "DELIVERED",
      },
    },
    select: { id: true, orderId: true, productId: true, quantity: true },
    take: 200,
  });

  if (orderItems.length === 0) return;

  // Only return ~15% of delivered order items
  const returnItems = orderItems.filter(() => Math.random() > 0.85);
  const data: ReturnSeed[] = [];

  for (const item of returnItems) {
    data.push({
      orderItemId: item.id,
      userId: faker.helpers.arrayElement(userIds),
      reason: faker.lorem.sentence(),
      status: faker.helpers.arrayElement(["PENDING", "APPROVED", "REJECTED", "REFUNDED"]),
      quantity: faker.number.int({ min: 1, max: Math.min(item.quantity, 2) }),
      resolvedAt: faker.date.past()
    });
  }

  await ctx.prisma.returnRequest.createMany({ data });
  counts.returns += data.length;
}
