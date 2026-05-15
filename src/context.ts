import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import type { Request } from "express";
import { verifyToken } from "./utils/auth.js";
import type { Context } from "./types/context.js";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

export async function createContext({ req }: { req: Request }): Promise<Context> {
  const token = req.headers.authorization?.replace("Bearer ", "");
  let userId: string | undefined;

  if (token) {
    try {
      const decoded = verifyToken(token);
      userId = decoded.userId;
    } catch {
      // Invalid token
    }
  }

  return { prisma, userId, req };
}

process.on("beforeExit", async () => {
  await prisma.$disconnect();
});
