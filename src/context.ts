import { PrismaClient } from "@prisma/client";
import { Request } from "express";
import jwt from "jsonwebtoken";

const prisma = new PrismaClient();

export interface Context {
  prisma: PrismaClient;
  userId?: string;
  req: Request;
}

export interface JwtPayload {
  userId: string;
  email: string;
}

export async function createContext({
  req,
}: {
  req: Request;
}): Promise<Context> {
  const token = req.headers.authorization?.replace("Bearer ", "");

  let userId: string | undefined;

  if (token) {
    try {
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || "secret",
      ) as JwtPayload;
      userId = decoded.userId;
    } catch (error) {
      // Invalid token
    }
  }

  return {
    prisma,
    userId,
    req,
  };
}
