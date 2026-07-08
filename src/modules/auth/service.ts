import type { CreateUserInput } from "./inputs.js";
import { hashPassword, comparePassword, generateToken } from "@gql-prisma-api/utils/auth.js";
import { AppError } from "@gql-prisma-api/utils/errors.js";
import { triggerNovuWorkflow, createNovuSubscriber } from "@gql-prisma-api/utils/novu.js";
import { logger } from "@gql-prisma-api/utils/logger.js";
import { BaseService } from "@gql-prisma-api/lib/BaseService.js";

export class AuthService {
  constructor(private readonly base: BaseService) {}

  async signupUser(input: CreateUserInput) {
    const existing = await this.base.core.user.findUnique({ where: { email: input.email } });
    if (existing) {
      logger.warning("Signup failed — email already in use", { email: input.email });
      throw new AppError("Email already in use");
    }

    const user = await this.base.core.user.create({
      data: {
        email: input.email,
        name: input.name ?? null,
        password: await hashPassword(input.password),
      },
    });

    logger.info("User signed up", { userId: user.id, email: user.email });

    await createNovuSubscriber(user.id, user.email, user.name ?? undefined);
    await triggerNovuWorkflow(user.id, "welcome", { userName: user.name ?? user.email });

    return {
      token: generateToken({ userId: user.id, email: user.email }),
      user,
    };
  }

  async loginUser(email: string, password: string) {
    const user = await this.base.core.user.findUnique({ where: { email } });
    if (!user || !(await comparePassword(password, user.password))) {
      logger.warning("Login failed — invalid credentials", { email });
      throw new AppError("Invalid email or password");
    }
    logger.info("User logged in", { userId: user.id, email: user.email });
    return {
      token: generateToken({ userId: user.id, email: user.email }),
      user,
    };
  }
}
