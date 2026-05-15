import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import type { Request } from "express";
import jwt from "jsonwebtoken";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

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
