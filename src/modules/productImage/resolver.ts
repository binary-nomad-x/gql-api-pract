import type { Context } from "@graphql-prisma-api/types/context.js";
import type { Parent } from "@graphql-prisma-api/types/graphql.js";

export const ProductImageResolver = {
  product: (parent: Parent, _args: unknown, ctx: Context) =>
    ctx.prisma.product.findUnique({ where: { id: parent.productId as string } }),
};
