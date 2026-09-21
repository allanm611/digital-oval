import type { RangeOption } from "../types/ReportsAPI";
import type {
  CampaignReportsResponse,
} from "../types/ReportsAPI";
import { CAMPAIGN_CHANNEL_CATALOG } from "./normalizeCampaignReport";
import { ratePercent } from "./campaignCvmMetrics";

type ChannelReachPoint = CampaignReportsResponse["channelReach"][number];
type FunnelPoint = CampaignReportsResponse["conversionFunnel"][number];
type TrendPoint = CampaignReportsResponse["performanceTrend"][number];
type CampaignSummary = CampaignReportsResponse["summary"];

type ChannelSeed = {
  channel: (typeof CAMPAIGN_CHANNEL_CATALOG)[number];
  sentShare: number;
  deliveryRate: number;
  uniqueShareOfDelivered: number;
  conversionRate: number;
};

const CHANNEL_SEEDS: ChannelSeed[] = [
  { channel: "Email", sentShare: 0.28, deliveryRate: 0.961, uniqueShareOfDelivered: 0.82, conversionRate: 0.071 },
  { channel: "SMS Normal", sentShare: 0.26, deliveryRate: 0.942, uniqueShareOfDelivered: 0.88, conversionRate: 0.064 },
  { channel: "SMS Flash", sentShare: 0.12, deliveryRate: 0.914, uniqueShareOfDelivered: 0.9, conversionRate: 0.052 },
  { channel: "Whatsapp Messenger", sentShare: 0.14, deliveryRate: 0.978, uniqueShareOfDelivered: 0.86, conversionRate: 0.081 },
  { channel: "Push Notification", sentShare: 0.1, deliveryRate: 0.842, uniqueShareOfDelivered: 0.74, conversionRate: 0.038 },
  { channel: "USSD", sentShare: 0.06, deliveryRate: 0.889, uniqueShareOfDelivered: 0.93, conversionRate: 0.047 },
  { channel: "Digital channels", sentShare: 0.04, deliveryRate: 0.905, uniqueShareOfDelivered: 0.71, conversionRate: 0.044 },
];

const RANGE_BASE: Record<RangeOption, { sent: number; targetShare: number }> = {
  "7d": { sent: 280_000, targetShare: 0.85 },
  "30d": { sent: 1_180_000, targetShare: 0.86 },
  "90d": { sent: 3_420_000, targetShare: 0.87 },
};

function buildChannelPoints(sentTotal: number): ChannelReachPoint[] {
  return CHANNEL_SEEDS.map((seed) => {
    const sent = Math.round(sentTotal * seed.sentShare);
    const delivered = Math.round(sent * seed.deliveryRate);
    const uniqueAudience = Math.round(delivered * seed.uniqueShareOfDelivered);
    const converted = Math.round(delivered * seed.conversionRate);
    return {
      channel: seed.channel,
      sent,
      impressions: sent,
      delivered,
      uniqueAudience,
      reach: uniqueAudience,
      conversions: converted,
      converted,
      deliveryRate: ratePercent(delivered, sent),
      conversionRate: ratePercent(converted, delivered),
    };
  });
}

function buildSummary(
  range: RangeOption,
  channels: ChannelReachPoint[],
): CampaignSummary {
  const sent = channels.reduce((sum, row) => sum + (row.sent || 0), 0);
  const delivered = channels.reduce((sum, row) => sum + (row.delivered || 0), 0);
  const converted = channels.reduce((sum, row) => sum + (row.converted || 0), 0);
  const uniqueSum = channels.reduce((sum, row) => sum + (row.uniqueAudience || 0), 0);
  // Cross-channel unique customers are lower than the sum of per-channel uniques.
  const uniqueAudience = Math.round(uniqueSum * 0.78);
  const targetShare = RANGE_BASE[range].targetShare;
  const targetGroup = Math.round(uniqueAudience / 0.92 * targetShare);
  const controlGroup = Math.round(uniqueAudience / 0.92 * (1 - targetShare));
  const targetGroupReached = Math.round(uniqueAudience * targetShare);
  const controlGroupReached = uniqueAudience - targetGroupReached;
  const eligibleAudience = Math.round((targetGroup + controlGroup) / 0.74);
  const deliveryRate = ratePercent(delivered, sent);
  const conversionRate = ratePercent(converted, delivered);
  const campaignCost = range === "7d" ? 90_000 : range === "30d" ? 330_000 : 970_000;
  const revenue = range === "7d" ? 415_000 : range === "30d" ? 1_620_000 : 4_950_000;

  return {
    eligibleAudience,
    executedAudience: targetGroup + controlGroup,
    recipients: sent,
    uniqueAudience,
    reach: uniqueAudience,
    sent,
    impressions: sent,
    delivered,
    deliveryRate,
    opens: 0,
    clicks: 0,
    clickRate: 0,
    engagementRate: 0,
    conversions: converted,
    converted,
    conversionRate,
    uniqueConverters: converted,
    targetGroup,
    controlGroup,
    targetGroupReached,
    controlGroupReached,
    revenue,
    roas: Number((revenue / campaignCost).toFixed(1)),
    cac: Number((campaignCost / Math.max(converted, 1)).toFixed(1)),
    leads: Math.round(converted * 0.42),
    campaignCost,
  };
}

function buildFunnel(summary: CampaignSummary): FunnelPoint[] {
  return [
    { stage: "Sent", value: summary.sent },
    { stage: "Delivered", value: summary.delivered },
    { stage: "Converted", value: summary.converted || summary.conversions },
  ];
}

function scaleTrend(base: number, index: number, length: number): number {
  const wave = 0.92 + ((index % 3) * 0.03) + (index / Math.max(length - 1, 1)) * 0.08;
  return Math.round(base * wave);
}

function buildTrends(
  summary: CampaignSummary,
  periods: string[],
): TrendPoint[] {
  const length = periods.length;
  return periods.map((period, index) => {
    const sent = scaleTrend(Math.round(summary.sent / length), index, length);
    const delivered = Math.round(sent * (summary.deliveryRate / 100));
    const converted = Math.round(delivered * (summary.conversionRate / 100));
    const spend = Number((summary.campaignCost / length * (0.94 + (index % 2) * 0.04)).toFixed(1));
    const revenue = Number((summary.revenue / length * (0.9 + index * 0.03)).toFixed(1));
    return {
      period,
      sent,
      delivered,
      converted,
      conversions: converted,
      deliveryRate: ratePercent(delivered, sent),
      conversionRate: ratePercent(converted, delivered),
      ctr: 0,
      engagement: 0,
      revenue,
      spend,
    };
  });
}

const PERIODS: Record<RangeOption, string[]> = {
  "7d": ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
  "30d": ["Week 1", "Week 2", "Week 3", "Week 4"],
  "90d": ["September", "October", "November"],
};

function buildRange(range: RangeOption) {
  const channels = buildChannelPoints(RANGE_BASE[range].sent);
  const summary = buildSummary(range, channels);
  return {
    summary,
    channelReach: channels,
    conversionFunnel: buildFunnel(summary),
    performanceTrend: buildTrends(summary, PERIODS[range]),
  };
}

export const campaignReportDummy = {
  "7d": buildRange("7d"),
  "30d": buildRange("30d"),
  "90d": buildRange("90d"),
} as const;

export function scaleCampaignSummary(
  summary: CampaignSummary,
  scaleFactor: number,
): CampaignSummary {
  if (scaleFactor === 1) return summary;
  const sent = Math.round(summary.sent * scaleFactor);
  const delivered = Math.round(summary.delivered * scaleFactor);
  const converted = Math.round((summary.converted || summary.conversions) * scaleFactor);
  return {
    ...summary,
    eligibleAudience: Math.round(summary.eligibleAudience * scaleFactor),
    executedAudience: Math.round((summary.executedAudience || 0) * scaleFactor),
    recipients: sent,
    uniqueAudience: Math.round(summary.uniqueAudience * scaleFactor),
    reach: Math.round(summary.uniqueAudience * scaleFactor),
    sent,
    impressions: sent,
    delivered,
    conversions: converted,
    converted,
    uniqueConverters: converted,
    targetGroup: Math.round(summary.targetGroup * scaleFactor),
    controlGroup: Math.round(summary.controlGroup * scaleFactor),
    targetGroupReached: Math.round((summary.targetGroupReached || 0) * scaleFactor),
    controlGroupReached: Math.round((summary.controlGroupReached || 0) * scaleFactor),
    revenue: Math.round(summary.revenue * scaleFactor),
    leads: Math.round(summary.leads * scaleFactor),
    campaignCost: Math.round(summary.campaignCost * scaleFactor),
    deliveryRate: summary.deliveryRate,
    conversionRate: summary.conversionRate,
    roas: summary.roas,
    cac: summary.cac,
  };
}

export function scaleChannelReach(
  points: ChannelReachPoint[],
  scaleFactor: number,
): ChannelReachPoint[] {
  if (scaleFactor === 1) return points;
  return points.map((point) => {
    const sent = Math.round((point.sent || point.impressions || 0) * scaleFactor);
    const delivered = Math.round((point.delivered || 0) * scaleFactor);
    const uniqueAudience = Math.round((point.uniqueAudience || point.reach || 0) * scaleFactor);
    const converted = Math.round((point.converted || point.conversions || 0) * scaleFactor);
    return {
      ...point,
      sent,
      impressions: sent,
      delivered,
      uniqueAudience,
      reach: uniqueAudience,
      conversions: converted,
      converted,
    };
  });
}
