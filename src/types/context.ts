import type { PrismaClient } from "@prisma/client";
import type { Request } from "express";

export interface Context {
  prisma: PrismaClient;
  userId?: string;
  req: Request;
}

export interface JwtPayload {
  userId: string;
  email: string;
}
