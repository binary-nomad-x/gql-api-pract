import { faker } from "@faker-js/faker";
import type { SeedContext, SeedCounts } from "./types.js";

export async function seedWishlists(ctx: SeedContext, counts: SeedCounts, userIds: string[], productIds: string[]): Promise<void> {
  for (const userId of userIds) {
    const wishlistCount = faker.number.int({ min: 1, max: 3 });
    for (let w = 0; w < wishlistCount; w++) {
      const products = await ctx.prisma.product.findMany({
        where: { id: { in: productIds } },
        select: { id: true, price: true },
      });

      const wishlist = await ctx.prisma.wishlist.create({
        data: {
          userId,
          name: w === 0 ? "Default" : faker.lorem.words(2),
          description: faker.lorem.sentence(),
          isPublic: w === 0 ? false : faker.datatype.boolean({ probability: 0.3 }),
          isDefault: w === 0,
          itemCount: 0,
          shareCode: w === 0 ? null : crypto.randomUUID().slice(0, 8),
        },
      });
      counts.wishlists++;

      const itemCount = faker.number.int({ min: 2, max: 6 });
      const usedProducts = new Set<string>();

      for (let i = 0; i < itemCount; i++) {
        const product = faker.helpers.arrayElement(products);
        if (usedProducts.has(product.id)) continue;
        usedProducts.add(product.id);

        await ctx.prisma.wishlistItem.create({
          data: {
            wishlistId: wishlist.id,
            productId: product.id,
            quantity: faker.number.int({ min: 1, max: 3 }),
            priority: faker.helpers.arrayElement(["LOW", "MEDIUM", "HIGH"]),
            priceAtAddition: product.price,
            note: Math.random() > 0.5 ? faker.lorem.sentence() : null,
          },
        });
        counts.wishlistItems++;
      }

      await ctx.prisma.wishlist.update({
        where: { id: wishlist.id },
        data: { itemCount: usedProducts.size },
      });
    }
  }
}
