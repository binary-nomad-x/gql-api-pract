import type { Context } from "../../types/context.js";
import type { Parent } from "../../types/graphql.js";

export const ProductImageResolver = {
  product: (parent: Parent, _args: unknown, ctx: Context) =>
    ctx.prisma.product.findUnique({ where: { id: parent.productId as string } }),
};
