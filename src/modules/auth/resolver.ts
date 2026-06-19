import type { Context } from "@gql-prisma-api/types/context.js";
import type { CreateUserInput } from "./inputs.js";
import { signupUser, loginUser } from "./service.js";

export const Mutation = {
  signup: (
    _parent: unknown,
    { input }: { input: CreateUserInput },
    ctx: Context,
  ) => signupUser(ctx.prisma, input),

  login: (
    _parent: unknown,
    { email, password }: { email: string; password: string },
    ctx: Context,
  ) => loginUser(ctx.prisma, email, password),
};
