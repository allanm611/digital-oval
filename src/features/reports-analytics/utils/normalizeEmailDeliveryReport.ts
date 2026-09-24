import type {
  DeliveryEmailReportsResponse,
  EmailDeliveryReportTrend,
  EmailDeliveryStatus,
  EmailDispatchRow,
  EmailLogEntry,
} from "../types/ReportsAPI";
import { asFiniteNumber, pickNamedArray } from "./normalizeCampaignReport";
import { ratePercent } from "./campaignCvmMetrics";
import { emailCvmSnapshot, toEmailSummary } from "./emailCvmMetrics";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function unwrapPortfolio(payload: unknown): Record<string, unknown> | null {
  if (!isRecord(payload)) return null;
  const nested = isRecord(payload.data) ? payload.data : null;
  const data = nested ?? payload;
  const hasPortfolio =
    isRecord(data.summary) ||
    isRecord(data.kpis) ||
    Array.isArray(data.deliveryTimeline) ||
    Array.isArray(data.delivery_timeline) ||
    Array.isArray(data.dispatches) ||
    Array.isArray(data.emailLogs) ||
    Array.isArray(data.email_logs) ||
    "sent" in data ||
    "delivered" in data;
  if (hasPortfolio) return data;
  if (nested) return nested;
  return null;
}

function trendFrom(
  source: Record<string, unknown> | null | undefined,
  keys: string[],
): EmailDeliveryReportTrend | undefined {
  if (!source) return undefined;
  for (const key of keys) {
    const value = source[key];
    if (!isRecord(value)) continue;
    const direction = value.direction === "down" ? "down" : "up";
    return {
      value: asFiniteNumber(value.value),
      direction,
      label: typeof value.label === "string" ? value.label : "",
    };
  }
  return undefined;
}

function readText(source: Record<string, unknown>, keys: string[]): string {
  for (const key of keys) {
    const value = source[key];
    if (value == null || value === "") continue;
    return String(value).trim();
  }
  return "";
}

export function emailDeliveryStatus(value: unknown): EmailDeliveryStatus {
  const key = String(value ?? "")
    .toLowerCase()
    .replace(/[_-]+/g, " ")
    .trim();
  if (/soft|defer|pend|queue|schedul|retry|process/.test(key)) return "Deferred";
  if (/reject|spam|complaint|block|suppress|filter/.test(key)) return "Rejected";
  if (/bounce|fail|undeliver|hard/.test(key)) return "Bounced";
  return "Delivered";
}

function normalizeDispatch(row: unknown, index: number): EmailDispatchRow | null {
  if (!isRecord(row)) return null;
  const campaignName = readText(row, ["campaignName", "campaign_name", "campaign"]);
  const offerName = readText(row, ["offerName", "offer_name", "offer"]);
  const segmentName = readText(row, ["segmentName", "segment_name", "segment"]);
  if (!campaignName && !offerName && !readText(row, ["id", "dispatchId", "dispatch_id"])) {
    return null;
  }
  const sent = asFiniteNumber(row.sent ?? row.messages_sent ?? row.messagesSent ?? 0);
  const delivered = asFiniteNumber(
    row.delivered ?? row.messages_delivered ?? row.messagesDelivered ?? 0,
  );
  const takenUp = asFiniteNumber(
    row.takenUp ?? row.taken_up ?? row.conversions ?? row.converted ?? 0,
  );
  const subscribersReached = asFiniteNumber(
    row.subscribersReached ??
      row.subscribers_reached ??
      row.uniqueSubscribers ??
      row.unique_subscribers ??
      delivered,
  );
  const id = readText(row, ["id", "dispatchId", "dispatch_id"]) || `email-${index + 1}`;
  const campaignId = readText(row, ["campaignId", "campaign_id"]);
  const offerId = readText(row, ["offerId", "offer_id"]);
  const segmentId = readText(row, ["segmentId", "segment_id"]);
  const errorCode = readText(row, ["errorCode", "error_code", "provider_response_or_error"]);
  return {
    id,
    campaignId,
    campaignName: campaignName || "Email dispatch",
    offerId: offerId || undefined,
    offerName: offerName || "—",
    segmentId: segmentId || undefined,
    segmentName: segmentName || "—",
    status: emailDeliveryStatus(row.status),
    sent,
    delivered,
    subscribersReached,
    takenUp,
    takeUpRate: asFiniteNumber(
      row.takeUpRate ?? row.take_up_rate ?? row.conversionRate ?? row.conversion_rate,
      ratePercent(takenUp, delivered),
    ),
    sentDate: readText(row, ["sentDate", "sent_date", "timestamp", "created_at", "sent_at"]),
    ...(errorCode ? { errorCode } : {}),
  };
}

function dispatchToLog(row: EmailDispatchRow): EmailLogEntry {
  return {
    id: row.id,
    campaignId: row.campaignId,
    campaignName: row.campaignName,
    status: row.status,
    sent: row.sent,
    delivered: row.delivered,
    conversions: row.takenUp,
    conversionRate: row.takeUpRate,
    sentDate: row.sentDate,
    offerName: row.offerName,
    segmentName: row.segmentName,
  };
}

export function normalizeEmailDeliveryReport(
  payload: unknown,
): DeliveryEmailReportsResponse | null {
  const data = unwrapPortfolio(payload);
  if (!data) return null;

  const summarySource = isRecord(data.summary)
    ? data.summary
    : isRecord(data.kpis)
      ? data.kpis
      : data;
  const snapshot = emailCvmSnapshot(summarySource);
  const trendSource = isRecord(data.heroTrends)
    ? data.heroTrends
    : isRecord(data.trends)
      ? data.trends
      : undefined;

  const deliveryTimeline = pickNamedArray<Record<string, unknown>>(data, [
    "deliveryTimeline",
    "delivery_timeline",
    "timeline",
    "series",
  ]).flatMap((row) => {
    const period = String(row.period ?? row.label ?? row.date ?? "").trim();
    if (!period) return [];
    const sent = asFiniteNumber(row.sent ?? row.dispatched ?? 0);
    const delivered = asFiniteNumber(row.delivered ?? 0);
    const takenUp = asFiniteNumber(
      row.takenUp ?? row.taken_up ?? row.converted ?? row.conversions ?? 0,
    );
    return [
      {
        period,
        date: typeof row.date === "string" ? row.date : undefined,
        sent,
        delivered,
        takenUp,
        converted: takenUp,
      },
    ];
  });

  const dispatches = pickNamedArray(data, [
    "dispatches",
    "emailLogs",
    "email_logs",
    "broadcasts",
    "logs",
    "rows",
  ]).flatMap((row, index) => {
    const normalized = normalizeDispatch(row, index);
    return normalized ? [normalized] : [];
  });

  const total = asFiniteNumber(
    data.totalDispatches ??
      data.total_dispatches ??
      data.totalLogs ??
      data.total ??
      dispatches.length,
    dispatches.length,
  );

  return {
    summary: toEmailSummary(snapshot),
    deliveryTimeline,
    dispatches,
    emailLogs: dispatches.map(dispatchToLog),
    totalLogs: total,
    totalDispatches: total,
    heroTrends: trendSource
      ? {
          sent: trendFrom(trendSource, ["sent", "dispatched"]),
          delivered: trendFrom(trendSource, ["delivered"]),
          deliveryRate: trendFrom(trendSource, ["deliveryRate", "delivery_rate"]),
          bounceRate: trendFrom(trendSource, ["bounceRate", "bounce_rate", "failedRate"]),
          subscribersReached: trendFrom(trendSource, [
            "subscribersReached",
            "subscribers_reached",
            "uniqueAudience",
          ]),
          takenUp: trendFrom(trendSource, ["takenUp", "taken_up", "conversions", "converted"]),
          takeUpRate: trendFrom(trendSource, [
            "takeUpRate",
            "take_up_rate",
            "conversionRate",
            "conversion_rate",
          ]),
          optOutRate: trendFrom(trendSource, [
            "optOutRate",
            "opt_out_rate",
            "unsubscribeRate",
          ]),
        }
      : undefined,
  };
}
