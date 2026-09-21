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
