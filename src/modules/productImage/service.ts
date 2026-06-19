import type { PrismaClient } from "@prisma/client";

export function resolveProductImageProduct(prisma: PrismaClient, productId: string) {
  return prisma.product.findUnique({ where: { id: productId } });
}
