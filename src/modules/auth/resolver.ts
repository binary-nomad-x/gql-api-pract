import { hashPassword, comparePassword, generateToken } from "../../utils/auth.js";
import { AppError } from "../../utils/errors.js";
import type { Context } from "../../types/context.js";

export const AuthMutations = {
  signup: async (_parent: unknown, { input }: any, ctx: Context) => {
    const { email, name, password } = input;
    const existing = await ctx.prisma.user.findUnique({ where: { email } });
    if (existing) throw new AppError("Email already in use");

    const user = await ctx.prisma.user.create({
      data: { email, name, password: await hashPassword(password) },
    });

    return { token: generateToken({ userId: user.id, email: user.email }), user };
  },

  login: async (_parent: unknown, { email, password }: any, ctx: Context) => {
    const user = await ctx.prisma.user.findUnique({ where: { email } });
    if (!user) throw new AppError("Invalid email or password");

    const valid = await comparePassword(password, user.password);
    if (!valid) throw new AppError("Invalid email or password");

    return { token: generateToken({ userId: user.id, email: user.email }), user };
  },
};
