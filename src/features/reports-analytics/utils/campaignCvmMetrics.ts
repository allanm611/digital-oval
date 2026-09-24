import type { CampaignReportsResponse } from "../types/ReportsAPI";
import { asFiniteNumber } from "./normalizeCampaignReport";

export const CVM_METRIC_LABELS = {
  audienceReached: "Audience Reached",
  uniqueCustomersReached: "Unique customers reached",
  sent: "Sent",
  delivered: "Delivered",
  deliveryRate: "Delivery Rate",
  converted: "Converted",
  conversionRate: "Conversion Rate",
  uniqueAudience: "Unique Audience",
  targetGroup: "Target Group",
  controlGroup: "Control Group",
  valueGenerated: "Value Generated",
  romi: "ROMI",
  campaignCost: "Campaign Cost",
} as const;

export type ChannelReachPoint = CampaignReportsResponse["channelReach"][number];
export type CampaignSummary = CampaignReportsResponse["summary"];

export function ratePercent(numerator: unknown, denominator: unknown): number {
  const n = asFiniteNumber(numerator);
  const d = asFiniteNumber(denominator);
  if (!d) return 0;
  return Number(((n / d) * 100).toFixed(1));
}

export function formatCount(value: unknown): string {
  return asFiniteNumber(value).toLocaleString("en-US");
}

export function formatRate(value: unknown, digits = 1): string {
  return `${asFiniteNumber(value).toFixed(digits)}%`;
}

export function formatShare(part: unknown, total: unknown): string {
  return formatRate(ratePercent(part, total));
}

export function deliveryRateFrom(summary: Partial<CampaignSummary> | null | undefined): number {
  if (!summary) return 0;
  if (summary.deliveryRate != null && Number.isFinite(summary.deliveryRate)) {
    return asFiniteNumber(summary.deliveryRate);
  }
  return ratePercent(summary.delivered, summary.sent);
}

export function conversionRateFrom(summary: Partial<CampaignSummary> | null | undefined): number {
  if (!summary) return 0;
  if (summary.conversionRate != null && Number.isFinite(summary.conversionRate)) {
    return asFiniteNumber(summary.conversionRate);
  }
  const converted = summary.converted ?? summary.conversions;
  return ratePercent(converted, summary.delivered || summary.uniqueAudience || summary.sent);
}

export function convertedFrom(summary: Partial<CampaignSummary> | null | undefined): number {
  return asFiniteNumber(summary?.converted ?? summary?.conversions);
}

export function romiFrom(summary: Partial<CampaignSummary> | null | undefined): number {
  if (!summary) return 0;
  if (summary.roas != null && Number.isFinite(summary.roas) && summary.roas > 0) {
    return asFiniteNumber(summary.roas);
  }
  const cost = asFiniteNumber(summary.campaignCost);
  const value = asFiniteNumber(summary.revenue);
  if (!cost) return 0;
  return Number((value / cost).toFixed(1));
}

export function valuePerConversion(summary: Partial<CampaignSummary> | null | undefined): number {
  const converted = convertedFrom(summary);
  if (!converted) return 0;
  return asFiniteNumber(summary?.revenue) / converted;
}

export function costPerConversion(summary: Partial<CampaignSummary> | null | undefined): number {
  const converted = convertedFrom(summary);
  if (!converted) return 0;
  return asFiniteNumber(summary?.campaignCost) / converted;
}

export type KpiTrendDirection = "up" | "down" | "flat";
export type KpiTrend = { value: string; direction: KpiTrendDirection };
export type KpiTrendFormat = "percent" | "compact" | "points" | "multiplier";

function formatCompactDelta(delta: number): string {
  const sign = delta > 0 ? "+" : "";
  const abs = Math.abs(delta);
  if (abs >= 1_000_000) {
    const millions = delta / 1_000_000;
    return `${sign}${Number.isInteger(millions) ? millions.toFixed(0) : millions.toFixed(1)}M`;
  }
  if (abs >= 1000) {
    return `${sign}${Math.round(delta / 1000)}K`;
  }
  return `${sign}${Math.round(delta).toLocaleString("en-US")}`;
}

export function computeDeltaTrend(
  current: number,
  previous: number | null | undefined,
  format: KpiTrendFormat,
): KpiTrend {
  if (previous == null || !Number.isFinite(previous)) {
    return { value: "—", direction: "flat" };
  }
  const delta = current - previous;
  if (!Number.isFinite(delta) || Math.abs(delta) < 1e-9) {
    if (format === "points") return { value: "0 pts", direction: "flat" };
    if (format === "multiplier") return { value: "0.0x", direction: "flat" };
    return { value: "—", direction: "flat" };
  }
  const direction: KpiTrendDirection = delta > 0 ? "up" : "down";
  const sign = delta > 0 ? "+" : "";
  if (format === "compact") {
    return { value: formatCompactDelta(delta), direction };
  }
  if (format === "points") {
    return { value: `${sign}${delta.toFixed(1)} pts`, direction };
  }
  if (format === "multiplier") {
    return { value: `${sign}${delta.toFixed(1)}x`, direction };
  }
  if (previous === 0) {
    return { value: "—", direction: "flat" };
  }
  const percent = (delta / Math.abs(previous)) * 100;
  const digits = Math.abs(percent) >= 10 ? 0 : 1;
  return { value: `${sign}${percent.toFixed(digits)}%`, direction };
}

export function cvmDeliveryFunnel(
  summary: Partial<CampaignSummary> | null | undefined,
  apiRows: CampaignReportsResponse["conversionFunnel"] = [],
): CampaignReportsResponse["conversionFunnel"] {
  const fromApi: Record<string, number> = {};
  for (const row of apiRows) {
    const stage = String(row.stage || "")
      .toLowerCase()
      .replace(/[_-]+/g, " ")
      .trim();
    const label = stage.includes("convert")
      ? "Converted"
      : stage.includes("deliver")
        ? "Delivered"
        : stage.includes("sent") || stage.includes("dispatch")
          ? "Sent"
          : "";
    if (!label) continue;
    const record = row as unknown as Record<string, unknown>;
    fromApi[label] =
      (fromApi[label] || 0) +
      asFiniteNumber(
        record.value ??
          record.count ??
          record.volume ??
          record.total ??
          record.customers,
      );
  }
  const sent = Math.max(asFiniteNumber(summary?.sent), fromApi.Sent || 0);
  const delivered = Math.max(asFiniteNumber(summary?.delivered), fromApi.Delivered || 0);
  const converted = Math.max(convertedFrom(summary), fromApi.Converted || 0);
  return [
    { stage: "Sent", value: sent },
    { stage: "Delivered", value: delivered },
    { stage: "Converted", value: converted },
  ];
}

export function audienceSplit(summary: Partial<CampaignSummary> | null | undefined): {
  targetGroup: number;
  controlGroup: number;
  targetReached: number;
  controlReached: number;
  uniqueAudience: number;
} {
  const uniqueAudience = asFiniteNumber(
    summary?.uniqueAudience ?? summary?.reach,
  );
  const targetGroup = asFiniteNumber(summary?.targetGroup);
  const controlGroup = asFiniteNumber(summary?.controlGroup);
  const pool = targetGroup + controlGroup;
  const targetReached = asFiniteNumber(
    summary?.targetGroupReached,
    pool ? Math.round(uniqueAudience * (targetGroup / pool)) : uniqueAudience,
  );
  const controlReached = asFiniteNumber(
    summary?.controlGroupReached,
    Math.max(0, uniqueAudience - targetReached),
  );
  return {
    targetGroup,
    controlGroup,
    targetReached,
    controlReached,
    uniqueAudience,
  };
}

export function sentByChannel(
  points: ChannelReachPoint[] = [],
): Array<{ channel: string; sent: number; share: number }> {
  const rows = points.map((point) => ({
    channel: point.channel,
    sent: asFiniteNumber(point.sent ?? point.impressions),
  }));
  const total = rows.reduce((sum, row) => sum + row.sent, 0);
  return rows
    .filter((row) => row.sent > 0)
    .sort((a, b) => b.sent - a.sent)
    .map((row) => ({
      ...row,
      share: total ? row.sent / total : 0,
    }));
}

export function isCoreDeliveryChannel(channel: string): boolean {
  const key = channel.toLowerCase();
  return key.includes("sms") || key.includes("email") || key.includes("mail");
}

export function channelOutcomeMetrics(point: ChannelReachPoint | undefined) {
  const sent = asFiniteNumber(point?.sent ?? point?.impressions);
  const delivered = asFiniteNumber(point?.delivered ?? point?.reach);
  const uniqueAudience = asFiniteNumber(
    point?.uniqueAudience ?? point?.reach,
  );
  const converted = asFiniteNumber(point?.converted ?? point?.conversions);
  return {
    channel: point?.channel || "",
    channelCode: point?.channelCode,
    sent,
    delivered,
    uniqueAudience,
    converted,
    deliveryRate: asFiniteNumber(
      point?.deliveryRate,
      ratePercent(delivered, sent),
    ),
    conversionRate: asFiniteNumber(
      point?.conversionRate,
      ratePercent(converted, delivered),
    ),
  };
}

export function emptyCampaignSummary(): CampaignSummary {
  return {
    eligibleAudience: 0,
    executedAudience: 0,
    recipients: 0,
    uniqueAudience: 0,
    reach: 0,
    sent: 0,
    impressions: 0,
    delivered: 0,
    deliveryRate: 0,
    opens: 0,
    clicks: 0,
    clickRate: 0,
    engagementRate: 0,
    conversions: 0,
    converted: 0,
    conversionRate: 0,
    uniqueConverters: 0,
    targetGroup: 0,
    controlGroup: 0,
    targetGroupReached: 0,
    controlGroupReached: 0,
    revenue: 0,
    roas: 0,
    cac: 0,
    leads: 0,
    campaignCost: 0,
  };
}
