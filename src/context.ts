import { PrismaClient } from "@prisma/client";
import type { Request } from "express";
import jwt from "jsonwebtoken";

// Database URL from environment
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is not defined in environment variables");
}

// Pass database URL to PrismaClient constructor
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: databaseUrl,
    },
  },
});

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
      // Invalid token - ignore
    }
  }

  return {
    prisma,
    userId,
    req,
  };
}

// Graceful shutdown
process.on("beforeExit", async () => {
  await prisma.$disconnect();
});
