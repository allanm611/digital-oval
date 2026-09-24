import type { DeliverySMSReportsResponse } from "../types/ReportsAPI";
import { asFiniteNumber } from "./normalizeCampaignReport";
import {
  computeDeltaTrend,
  formatCount,
  formatRate,
  ratePercent,
  type KpiTrend,
} from "./campaignCvmMetrics";

/**
 * SMS-channel labels. Digital-marketing names (open, click-through, conversion,
 * unsubscribe) stay acceptable on payloads; the UI speaks CVM.
 */
export const SMS_CVM_LABELS = {
  dispatched: "SMS Dispatched",
  delivered: "Delivered",
  deliveryRate: "Delivery Rate",
  failedRate: "Failed Rate",
  subscribersReached: "Subscribers Reached",
  takenUp: "Taken Up",
  takeUpRate: "Take-up Rate",
  optOutRate: "Opt-out Rate",
  campaign: "Campaign",
  offer: "Offer",
  segment: "Segment",
  broadcastLog: "Broadcast Delivery Log",
} as const;

export type SmsCvmSnapshot = {
  sent: number;
  delivered: number;
  failed: number;
  deliveryRate: number;
  failedRate: number;
  subscribersReached: number;
  takenUp: number;
  takeUpRate: number;
  optOutRate: number;
};

export type SmsDeliverySummary = DeliverySMSReportsResponse["summary"];

function readNumber(source: Record<string, unknown> | null | undefined, keys: string[]): number {
  if (!source) return 0;
  for (const key of keys) {
    if (source[key] == null || source[key] === "") continue;
    const parsed = asFiniteNumber(source[key], Number.NaN);
    if (Number.isFinite(parsed)) return parsed;
  }
  return 0;
}

export function smsCvmSnapshot(
  summary: Record<string, unknown> | SmsDeliverySummary | null | undefined,
): SmsCvmSnapshot {
  const source = (summary ?? null) as Record<string, unknown> | null;
  const sent = readNumber(source, ["sent", "dispatched", "messages_sent", "messagesSent"]);
  const delivered = readNumber(source, [
    "delivered",
    "messages_delivered",
    "messagesDelivered",
  ]);
  const failed = readNumber(source, ["failed", "messages_failed", "messagesFailed", "undelivered"]);
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
  const deliveryRate = readNumber(source, ["deliveryRate", "delivery_rate"]) || ratePercent(delivered, sent);
  const failedRate =
    readNumber(source, ["failedRate", "failed_rate"]) ||
    ratePercent(failed || Math.max(0, sent - delivered), sent);
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
    failed: failed || Math.max(0, sent - delivered),
    deliveryRate,
    failedRate,
    subscribersReached: subscribersReached || delivered,
    takenUp,
    takeUpRate,
    optOutRate,
  };
}

export function toSmsSummary(snapshot: SmsCvmSnapshot): SmsDeliverySummary {
  return {
    ...snapshot,
    conversions: snapshot.takenUp,
    conversionRate: snapshot.takeUpRate,
  };
}

/** Prior window used only for dummy-mode KPI deltas. */
export function previousSmsSnapshot(current: SmsCvmSnapshot, factor = 0.92): SmsCvmSnapshot {
  const sent = Math.round(current.sent * factor);
  const delivered = Math.round(current.delivered * factor);
  const failed = Math.round(current.failed * (2 - factor));
  const takenUp = Math.round(current.takenUp * factor);
  return {
    sent,
    delivered,
    failed,
    subscribersReached: Math.round(current.subscribersReached * factor),
    takenUp,
    deliveryRate: ratePercent(delivered, sent),
    failedRate: ratePercent(failed, sent),
    takeUpRate: ratePercent(takenUp, delivered),
    optOutRate: Number((current.optOutRate * (2 - factor)).toFixed(2)),
  };
}

export function emptySmsSnapshot(): SmsCvmSnapshot {
  return {
    sent: 0,
    delivered: 0,
    failed: 0,
    deliveryRate: 0,
    failedRate: 0,
    subscribersReached: 0,
    takenUp: 0,
    takeUpRate: 0,
    optOutRate: 0,
  };
}

export { computeDeltaTrend, formatCount, formatRate, type KpiTrend };
