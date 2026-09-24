import type { DeliveryEmailReportsResponse } from "../types/ReportsAPI";
import { asFiniteNumber } from "./normalizeCampaignReport";
import {
  computeDeltaTrend,
  formatCount,
  formatRate,
  ratePercent,
  type KpiTrend,
} from "./campaignCvmMetrics";

/**
 * Email-channel labels. Digital-marketing names (open, click-through,
 * conversion, unsubscribe, inbox placement) stay acceptable on payloads;
 * the UI speaks CVM.
 */
export const EMAIL_CVM_LABELS = {
  dispatched: "Emails Dispatched",
  delivered: "Delivered",
  deliveryRate: "Delivery Rate",
  bounceRate: "Bounce Rate",
  subscribersReached: "Subscribers Reached",
  takenUp: "Taken Up",
  takeUpRate: "Take-up Rate",
  optOutRate: "Opt-out Rate",
  campaign: "Campaign",
  offer: "Offer",
  segment: "Segment",
  dispatchLog: "Email Dispatch Log",
} as const;

export type EmailCvmSnapshot = {
  sent: number;
  delivered: number;
  bounced: number;
  deliveryRate: number;
  bounceRate: number;
  subscribersReached: number;
  takenUp: number;
  takeUpRate: number;
  optOutRate: number;
};

export type EmailDeliverySummary = DeliveryEmailReportsResponse["summary"];

function readNumber(source: Record<string, unknown> | null | undefined, keys: string[]): number {
  if (!source) return 0;
  for (const key of keys) {
    if (source[key] == null || source[key] === "") continue;
    const parsed = asFiniteNumber(source[key], Number.NaN);
    if (Number.isFinite(parsed)) return parsed;
  }
  return 0;
}

export function emailCvmSnapshot(
  summary: Record<string, unknown> | EmailDeliverySummary | null | undefined,
): EmailCvmSnapshot {
  const source = (summary ?? null) as Record<string, unknown> | null;
  const sent = readNumber(source, ["sent", "dispatched", "messages_sent", "messagesSent"]);
  const delivered = readNumber(source, [
    "delivered",
    "messages_delivered",
    "messagesDelivered",
  ]);
  const bounced = readNumber(source, [
    "bounced",
    "messages_bounced",
    "messagesBounced",
    "failed",
    "messages_failed",
    "messagesFailed",
  ]);
  const subscribersReached = readNumber(source, [
    "subscribersReached",
    "subscribers_reached",
    "uniqueSubscribers",
    "unique_subscribers",
    "uniqueAudience",
    "reach",
  ]);
  const takenUp = readNumber(source, [
    "takenUp",
    "taken_up",
    "takeUp",
    "take_up",
    "conversions",
    "converted",
  ]);
  const deliveryRate =
    readNumber(source, ["deliveryRate", "delivery_rate"]) || ratePercent(delivered, sent);
  const bounceRate =
    readNumber(source, ["bounceRate", "bounce_rate", "failedRate", "failed_rate"]) ||
    ratePercent(bounced || Math.max(0, sent - delivered), sent);
  const takeUpRate =
    readNumber(source, ["takeUpRate", "take_up_rate", "conversionRate", "conversion_rate"]) ||
    ratePercent(takenUp, delivered);
  const optOutRate = readNumber(source, [
    "optOutRate",
    "opt_out_rate",
    "unsubscribeRate",
    "unsubscribe_rate",
  ]);

  return {
    sent,
    delivered,
    bounced: bounced || Math.max(0, sent - delivered),
    deliveryRate,
    bounceRate,
    subscribersReached: subscribersReached || delivered,
    takenUp,
    takeUpRate,
    optOutRate,
  };
}

export function toEmailSummary(snapshot: EmailCvmSnapshot): EmailDeliverySummary {
  return {
    ...snapshot,
    conversions: snapshot.takenUp,
    conversionRate: snapshot.takeUpRate,
    unsubscribeRate: snapshot.optOutRate,
  };
}

/** Prior window used only for dummy-mode KPI deltas. */
export function previousEmailSnapshot(current: EmailCvmSnapshot, factor = 0.92): EmailCvmSnapshot {
  const sent = Math.round(current.sent * factor);
  const delivered = Math.round(current.delivered * factor);
  const bounced = Math.round(current.bounced * (2 - factor));
  const takenUp = Math.round(current.takenUp * factor);
  return {
    sent,
    delivered,
    bounced,
    subscribersReached: Math.round(current.subscribersReached * factor),
    takenUp,
    deliveryRate: ratePercent(delivered, sent),
    bounceRate: ratePercent(bounced, sent),
    takeUpRate: ratePercent(takenUp, delivered),
    optOutRate: Number((current.optOutRate * (2 - factor)).toFixed(2)),
  };
}

export function emptyEmailSnapshot(): EmailCvmSnapshot {
  return {
    sent: 0,
    delivered: 0,
    bounced: 0,
    deliveryRate: 0,
    bounceRate: 0,
    subscribersReached: 0,
    takenUp: 0,
    takeUpRate: 0,
    optOutRate: 0,
  };
}

export { computeDeltaTrend, formatCount, formatRate, type KpiTrend };
