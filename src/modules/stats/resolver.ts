import type { Context } from "@gql-prisma-api/types/context.js";

export const Query = {
  stats: (_parent: unknown, _args: unknown, ctx: Context) => ctx.services.stats.getStats(),
};
