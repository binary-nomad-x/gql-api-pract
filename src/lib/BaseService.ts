import type { PrismaClient } from "@prisma/client";

export class BaseService {
  constructor(protected core: PrismaClient) {}
}
