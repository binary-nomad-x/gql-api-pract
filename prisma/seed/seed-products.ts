import { faker } from "@faker-js/faker";
import type { SeedContext, SeedCounts } from "./types.js";
import { randomUUID } from "node:crypto";

export async function seedProducts(
  ctx: SeedContext,
  counts: SeedCounts,
  userIds: string[],
  categoryIds: string[],
  count: number,
): Promise<string[]> {
  const productIds = Array.from({ length: count }, () => randomUUID());

  const productData = productIds.map((id) => ({
    id,
    name: faker.commerce.productName(),
    description: faker.lorem.paragraph(),
    price: parseFloat(faker.commerce.price({ min: 5, max: 500 })),
    stock: faker.number.int({ min: 10, max: 200 }),
    sku: faker.string.alphanumeric({ length: 10 }).toUpperCase(),
    imageUrl: faker.image.url(),
    isActive: true,
    sellerId: faker.helpers.arrayElement(userIds),
    categoryId: faker.helpers.arrayElement(categoryIds),
  }));

  await ctx.prisma.product.createMany({ data: productData });

  const imageData = productIds.flatMap((productId) => {
    const n = faker.number.int({ min: 1, max: 4 });
    return Array.from({ length: n }, () => ({
      productId,
      url: faker.image.url(),
      alt: faker.lorem.words({ min: 3, max: 30 }),
      sortOrder: faker.number.int({ min: 0, max: 10 }),
    }));
  });

  await ctx.prisma.productImage.createMany({ data: imageData });

  counts.products += productData.length;
  counts.productImages += imageData.length;

  return productIds;
}
