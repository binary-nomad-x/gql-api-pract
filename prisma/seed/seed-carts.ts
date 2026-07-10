import { faker } from "@faker-js/faker";
import type { SeedContext, SeedCounts, CartItemSeed } from "./types.js";

export async function seedCarts(
  ctx: SeedContext,
  counts: SeedCounts,
  userIds: string[],
  productIds: string[],
): Promise<void> {
  const products = await ctx.prisma.product.findMany({
    where: { id: { in: productIds } },
    select: { id: true, price: true },
  });

  for (const userId of userIds) {
    const cart = await ctx.prisma.cart.create({
      data: {
        userId,
        notes: "",
        subtotal: 0,
        total: 0,
        currency: "USD",
        couponCode: "",
        discountAmount: 0,
        sessionId: faker.string.alphanumeric(24),
        expiresAt: faker.date.future({ years: 1 }),
      },
    });
    counts.carts++;

    const itemCount = faker.number.int({ min: 1, max: 5 });
    const items: CartItemSeed[] = [];
    const used = new Set<string>();
    let subtotal = 0;

    for (let i = 0; i < itemCount; i++) {
      const product = faker.helpers.arrayElement(products);
      if (used.has(product.id)) continue;
      used.add(product.id);
      const quantity = faker.number.int({ min: 1, max: 3 });
      const totalPrice = parseFloat((product.price * quantity).toFixed(2));
      subtotal += totalPrice;
      items.push({
        cartId: cart.id,
        productId: product.id,
        quantity,
        unitPrice: product.price,
        discountAmount: 0,
        totalPrice,
        notes: Math.random() > 0.7 ? faker.lorem.sentence() : "",
        isSavedForLater: false,
      });
    }

    if (items.length > 0) {
      await ctx.prisma.cartItem.createMany({
        data: items,
        skipDuplicates: true,
      });
      counts.cartItems += items.length;

      await ctx.prisma.cart.update({
        where: { id: cart.id },
        data: { subtotal, total: subtotal },
      });
    }
  }
}
