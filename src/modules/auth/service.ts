import type { PrismaClient } from "@prisma/client";
import type { CreateUserInput } from "@gql-prisma-api/types/inputs.js";
import { hashPassword, comparePassword, generateToken } from "@gql-prisma-api/utils/auth.js";
import { AppError } from "@gql-prisma-api/utils/errors.js";
import { triggerNovuWorkflow, createNovuSubscriber } from "@gql-prisma-api/utils/novu.js";

export async function signupUser(prisma: PrismaClient, input: CreateUserInput) {
  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) throw new AppError("Email already in use");

  const user = await prisma.user.create({
    data: {
      email: input.email,
      name: input.name ?? null,
      password: await hashPassword(input.password),
    },
  });

  await createNovuSubscriber(user.id, user.email, user.name ?? undefined);
  await triggerNovuWorkflow(user.id, "welcome", { userName: user.name ?? user.email });

  return {
    token: generateToken({ userId: user.id, email: user.email }),
    user,
  };
}

export async function loginUser(prisma: PrismaClient, email: string, password: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !(await comparePassword(password, user.password))) {
    throw new AppError("Invalid email or password");
  }
  return {
    token: generateToken({ userId: user.id, email: user.email }),
    user,
  };
}
