import { Queue } from "bullmq";

import { redisConnection } from "../redis.js";

export const emailQueue = new Queue("email-queue", {
  connection: redisConnection as any,
});
