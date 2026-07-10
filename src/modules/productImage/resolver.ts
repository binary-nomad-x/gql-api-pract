import type { Context } from "@gql-prisma-api/types/context.js";
import type { ProductImage as ProductImageModel } from "@prisma/client";

export const ProductImage = {
  product: (parent: ProductImageModel, _args: unknown, ctx: Context) =>
    ctx.services.productImage.resolveProductImageProduct(parent.productId),
};
