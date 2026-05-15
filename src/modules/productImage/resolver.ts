import type { Context } from "@gql-prisma-api/types/context.js";
import type { Parent } from "@gql-prisma-api/types/graphql.js";

export const ProductImageResolver = {
  product: (parent: Parent, _args: unknown, ctx: Context) =>
    ctx.prisma.product.findUnique({
      where: { id: parent.productId as string },
    }),
};
