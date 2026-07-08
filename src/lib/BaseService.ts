import type { PrismaClient } from "@prisma/client";

export class BaseService {
  constructor(public readonly core: PrismaClient) {}
}
