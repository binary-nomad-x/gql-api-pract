import { faker } from "@faker-js/faker";
import type { SeedContext, SeedCounts } from "./types.js";

export async function seedCarts(
  ctx: SeedContext,
  counts: SeedCounts,
  userIds: string[],
  productIds: string[],
): Promise<void> {
  const pickRandom = <T>(arr: T[]): T =>
    arr[Math.floor(Math.random() * arr.length)];

  for (const userId of userIds) {
    const cart = await ctx.prisma.cart.create({
      data: { userId },
    });
    counts.carts++;

    const itemCount = faker.number.int({ min: 1, max: 4 });
    const items: Array<{
      cartId: string;
      productId: string;
      quantity: number;
    }> = [];

    const used = new Set<string>();
    for (let i = 0; i < itemCount; i++) {
      const productId = pickRandom(productIds);
      if (used.has(productId)) continue;
      used.add(productId);
      items.push({
        cartId: cart.id,
        productId,
        quantity: faker.number.int({ min: 1, max: 3 }),
      });
    }

    if (items.length > 0) {
      await ctx.prisma.cartItem.createMany({
        data: items,
        skipDuplicates: true,
      });
      counts.cartItems += items.length;
    }
  }
}
