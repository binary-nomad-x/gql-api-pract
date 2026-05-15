import type { Context } from "@graphql-prisma-api/types/context.js";
import type { CreateUserInput } from "@graphql-prisma-api/types/inputs.js";
import { hashPassword, comparePassword, generateToken } from "@graphql-prisma-api/utils/auth.js";
import { AppError } from "@graphql-prisma-api/utils/errors.js";

export const AuthMutations = {
  signup: async (_parent: unknown, { input }: { input: CreateUserInput }, ctx: Context) => {
    const existing = await ctx.prisma.user.findUnique({ where: { email: input.email } });
    if (existing) throw new AppError("Email already in use");

    const user = await ctx.prisma.user.create({
      data: { email: input.email, name: input.name ?? null, password: await hashPassword(input.password) },
    });

    return { token: generateToken({ userId: user.id, email: user.email }), user };
  },

  login: async (_parent: unknown, { email, password }: { email: string; password: string }, ctx: Context) => {
    const user = await ctx.prisma.user.findUnique({ where: { email } });
    if (!user || !(await comparePassword(password, user.password))) {
      throw new AppError("Invalid email or password");
    }
    return { token: generateToken({ userId: user.id, email: user.email }), user };
  },
};
