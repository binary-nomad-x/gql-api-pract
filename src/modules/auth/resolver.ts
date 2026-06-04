import type { Context } from "@gql-prisma-api/types/context.js";
import type { CreateUserInput } from "@gql-prisma-api/modules/auth/inputs.js";
import { signupUser, loginUser } from "./service.js";

export const AuthMutations = {
  signup: async (
    _parent: unknown,
    { input }: { input: CreateUserInput },
    ctx: Context,
  ) => signupUser(ctx.prisma, input),

  login: async (
    _parent: unknown,
    { email, password }: { email: string; password: string },
    ctx: Context,
  ) => loginUser(ctx.prisma, email, password),
};
