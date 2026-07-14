import { Queue } from "bullmq";

import { redisConnection } from "@gql-prisma-api/lib/redis.js";

export const emailQueue = new Queue("email-queue", {
  connection: redisConnection as any,
});
