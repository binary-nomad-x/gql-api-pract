import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import type { IncomingMessage } from "http";
import { verifyToken } from "./utils/auth.js";
import type { Context } from "./types/context.js";
import { Services } from "./lib/Services.js";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });
const services = new Services(prisma);

export async function createContext({ req }: { req: IncomingMessage }): Promise<Context> {
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

  return { prisma, services, userId };
}

process.on("beforeExit", async () => {
  await prisma.$disconnect();
});
