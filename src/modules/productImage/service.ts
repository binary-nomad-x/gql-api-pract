import type { PrismaClient } from "@prisma/client";

export class ProductImageService {
  constructor(private readonly core: PrismaClient) {}

  resolveProductImageProduct(productId: string) {
    return this.core.product.findUnique({ where: { id: productId } });
  }
}
