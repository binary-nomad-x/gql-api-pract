import type { Context } from "@gql-prisma-api/types/context.js";
import { getStats } from "./service.js";

export const Query = {
  stats: (_parent: unknown, _args: unknown, ctx: Context) =>
    getStats(ctx.prisma),
};
