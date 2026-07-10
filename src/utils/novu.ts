import { Novu } from "@novu/node";
import { logger } from "./logger.js";

const novuApiKey = process.env.NOVU_API_SECRET_KEY;

export const novu = novuApiKey ? new Novu(novuApiKey) : null;

if (novuApiKey) {
  logger.info("Novu client initialized", { hasApiKey: true });
} else {
  logger.warning("Novu client not initialized — NOVU_API_SECRET_KEY not set");
}

export type NovuEventName =
  | "comment-on-post"
  | "post-published"
  | "order-placed"
  | "order-cancelled"
  | "payment-processed"
  | "refund-processed"
  | "shipment-updated"
  | "new-follower"
  | "review-received"
  | "welcome"
  | "invoice-created"
  | "invoice-paid"
  | "invoice-overdue"
  | "return-requested"
  | "return-approved"
  | "return-rejected"
  | "return-refunded"
  | "ticket-created"
  | "ticket-updated"
  | "ticket-resolved"
  | "trial-ending";

export async function triggerNovuWorkflow(
  userId: string,
  eventName: NovuEventName,
  payload: Record<string, unknown> = {},
): Promise<void> {
  if (!novu) {
    logger.debug("Novu trigger skipped — novu client is null", {
      eventName,
      userId,
    });
    return;
  }

  logger.info("Novu workflow trigger started", {
    eventName,
    userId,
    payloadKeys: Object.keys(payload),
  });

  try {
    const result = await novu.trigger(eventName, {
      to: { subscriberId: userId },
      payload: payload as any,
    });

    logger.info("Novu workflow trigger succeeded", {
      eventName,
      userId,
      triggerId: (result as any)?.data?.id || "unknown",
    });
  } catch (error) {
    logger.error("Novu workflow trigger failed", {
      eventName,
      userId,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
  }
}

export interface TrialEndingPayload {
  subscription: {
    plan: { name: string };
    trialEnd: string;
    nextBillingDate: string;
  };
  notification: {
    daysUntilAction: string;
  };
  billing: {
    nextChargeDisplayAmount: string;
  };
  payment: {
    method: { type: string };
  };
  notify: {
    patient: boolean;
    doctor: boolean;
    admin: boolean;
  };
}

export async function triggerTrialEndingNotification(
  userId: string,
  payload: TrialEndingPayload,
): Promise<void> {
  logger.debug("Trial ending notification delegated to triggerNovuWorkflow", {
    userId,
  });
  return triggerNovuWorkflow(
    userId,
    "trial-ending",
    payload as unknown as Record<string, unknown>,
  );
}

export async function createNovuSubscriber(
  userId: string,
  email: string,
  name?: string,
): Promise<void> {
  if (!novu) {
    logger.debug("Novu subscriber identify skipped — novu client is null", {
      userId,
      email,
    });
    return;
  }

  logger.info("Novu subscriber identify started", {
    userId,
    email,
    hasName: !!name,
  });

  try {
    await novu.subscribers.identify(userId, {
      email,
      firstName: name,
    });

    logger.info("Novu subscriber identify succeeded", { userId, email });
  } catch (error) {
    logger.error("Novu subscriber identify failed", {
      userId,
      email,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
  }
}
