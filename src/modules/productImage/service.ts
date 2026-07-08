import type { PrismaClient } from "@prisma/client";
import { BaseService } from "@gql-prisma-api/lib/BaseService.js";

export class ProductImageService extends BaseService {
  resolveProductImageProduct(productId: string) {
    return this.core.product.findUnique({ where: { id: productId } });
  }
}
