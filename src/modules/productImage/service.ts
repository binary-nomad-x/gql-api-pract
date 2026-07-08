import type { PrismaClient } from "@prisma/client";
import { BaseService } from "@gql-prisma-api/lib/BaseService.js";

export class ProductImageService {
  constructor(private readonly base: BaseService) {}
  resolveProductImageProduct(productId: string) {
    return this.base.core.product.findUnique({ where: { id: productId } });
  }
}
