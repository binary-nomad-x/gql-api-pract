import type { PrismaClient } from "@prisma/client";

export interface Context {
  prisma: PrismaClient;
  userId?: string;
}

export interface JwtPayload {
  userId: string;
  email: string;
}
