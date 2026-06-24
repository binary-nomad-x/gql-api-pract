import type { Context } from "@gql-prisma-api/types/context.js";
import type { ProductImage as ProductImageModel } from "@prisma/client";
import { resolveProductImageProduct } from "./service.js";

export const ProductImage = {
  product: (parent: ProductImageModel, _args: unknown, ctx: Context) =>
    resolveProductImageProduct(ctx.prisma, parent.productId),
};
