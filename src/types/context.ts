import type { PrismaClient } from "@prisma/client";
import type { Services } from "@gql-prisma-api/lib/Services.js";

export interface Context {
  prisma: PrismaClient;
  services: Services;
  userId?: string;
}

export interface JwtPayload {
  userId: string;
  email: string;
}
