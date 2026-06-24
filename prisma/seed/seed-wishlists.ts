import { faker } from "@faker-js/faker";
import type { SeedContext, SeedCounts } from "./types.js";
import { randomUUID } from "node:crypto";

export async function seedWishlists(
  ctx: SeedContext,
  counts: SeedCounts,
  userIds: string[],
  productIds: string[],
): Promise<void> {

  for (const userId of userIds) {
    const wishlistCount = faker.number.int({ min: 1, max: 2 });
    for (let w = 0; w < wishlistCount; w++) {
      const wishlist = await ctx.prisma.wishlist.create({
        data: {
          userId,
          name: w === 0 ? "Default" : faker.lorem.word(),
        },
      });
      counts.wishlists++;

      const itemCount = faker.number.int({ min: 1, max: 5 });
      const itemIds = Array.from({ length: itemCount }, () => randomUUID());
      const items = itemIds.map(() => ({
        wishlistId: wishlist.id,
        productId: faker.helpers.arrayElement(productIds),
      }));

      await ctx.prisma.wishlistItem.createMany({
        data: items,
        skipDuplicates: true,
      });
      counts.wishlistItems += items.length;
    }
  }
}
