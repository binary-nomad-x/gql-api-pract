import { Worker } from "bullmq";
import { redisConnection } from "@gql-prisma-api/lib/redis.js";
import { MailService } from "@gql-prisma-api/services/mail.service.js";

export const emailWorker = new Worker(
  "email-queue",
  async (job) => {
    switch (job.name) {
      case "user.deleted":
        await MailService.sendDeletedEmail(job.data.email, job.data.name);
        break;
    }
  },
  {
    connection: redisConnection as any,
  },
);
