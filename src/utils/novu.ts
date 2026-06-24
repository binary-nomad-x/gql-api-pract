import { Novu } from "@novu/node";

const novuApiKey = process.env.NOVU_API_SECRET_KEY;

export const novu = novuApiKey ? new Novu(novuApiKey) : null;

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
  if (!novu) return;

  try {
    await novu.trigger(eventName, {
      to: { subscriberId: userId },
      payload: payload as any,
    });
  } catch {
    // Silently fail - Novu trigger errors shouldn't break the API
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
  if (!novu) return;

  try {
    await novu.subscribers.identify(userId, {
      email,
      firstName: name,
    });
  } catch {
    // Silently fail
  }
}
