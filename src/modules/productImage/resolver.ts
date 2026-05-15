import type { Context } from "../../types/context.js";

export const ProductImageResolver = {
  product: (parent: any, _args: unknown, ctx: Context) =>
    ctx.prisma.product.findUnique({ where: { id: parent.productId } }),
};
