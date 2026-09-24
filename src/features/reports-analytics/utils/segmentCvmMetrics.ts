import { asFiniteNumber } from "./normalizeCampaignReport";
import {
  computeDeltaTrend,
  formatCount,
  formatRate,
  type KpiTrend,
} from "./campaignCvmMetrics";

/**
 * Segment-portfolio labels. Digital-marketing names (engagement, conversion,
 * members, avg order value) stay in payloads; the UI speaks CVM.
 * Operator-defined segment names are left unchanged.
 */
export const SEGMENT_CVM_LABELS = {
  segmentPortfolio: "Segment Portfolio",
  subscriberBase: "Subscriber Base",
  baseGrowth: "Base Growth",
  targetedSegments: "Targeted Segments",
  activityScore: "Activity Score",
  takeUpRate: "Take-up Rate",
  arpu: "ARPU",
  campaignsTargeting: "Campaigns Targeting",
  subscribers: "Subscribers",
  activeSubscribers: "Active Subscribers",
  dormantSubscribers: "Dormant Subscribers",
  newSubscribers: "New Subscribers",
  cumulativeBase: "Cumulative Base",
} as const;

export type SegmentCvmSnapshot = {
  segmentPortfolio: number;
  subscriberBase: number;
  baseGrowth: number;
  targetedSegments: number;
  activityScore: number;
  takeUpRate: number;
  arpu: number;
  activeSubscribers: number;
  dormantSubscribers: number;
};

export type SegmentCvmMeasures = {
  subscribers: number;
  baseGrowth: number;
  campaignsTargeting: number;
  activityScore: number;
  takeUpRate: number;
  arpu: number;
  status: "Active" | "Inactive";
};

function readNumber(source: Record<string, unknown> | null | undefined, keys: string[]): number {
  if (!source) return 0;
  for (const key of keys) {
    if (source[key] == null || source[key] === "") continue;
    const parsed = asFiniteNumber(source[key], Number.NaN);
    if (Number.isFinite(parsed)) return parsed;
  }
  return 0;
}

export function segmentCvmSnapshot(
  summary: Record<string, unknown> | null | undefined,
): SegmentCvmSnapshot {
  const subscriberBase = readNumber(summary, [
    "subscriberBase",
    "subscriber_base",
    "totalSubscribers",
    "total_subscribers",
    "totalMembers",
    "total_members",
  ]);
  const activeSubscribers = readNumber(summary, [
    "activeSubscribers",
    "active_subscribers",
    "activeMembers",
    "active_members",
  ]);
  const dormantSubscribers = readNumber(summary, [
    "dormantSubscribers",
    "dormant_subscribers",
    "inactiveMembers",
    "inactive_members",
    "inactiveCustomers",
    "inactive_customers",
  ]);
  return {
    segmentPortfolio: readNumber(summary, [
      "segmentPortfolio",
      "segment_portfolio",
      "totalSegments",
      "total_segments",
    ]),
    subscriberBase,
    baseGrowth: readNumber(summary, [
      "baseGrowth",
      "base_growth",
      "avgMemberGrowth",
      "avg_member_growth",
      "growthRate",
      "growth_rate",
    ]),
    targetedSegments: readNumber(summary, [
      "targetedSegments",
      "targeted_segments",
      "activeInCampaigns",
      "active_in_campaigns",
    ]),
    activityScore: readNumber(summary, [
      "activityScore",
      "activity_score",
      "engagementScore",
      "engagement_score",
      "engagementRate",
      "engagement_rate",
      "engagement",
    ]),
    takeUpRate: readNumber(summary, [
      "takeUpRate",
      "take_up_rate",
      "conversionRate",
      "conversion_rate",
      "redemptionRate",
      "redemption_rate",
      "conversion",
    ]),
    arpu: readNumber(summary, [
      "arpu",
      "averageRevenuePerUser",
      "average_revenue_per_user",
      "avgValue",
      "avg_value",
      "avgOrderValue",
      "avg_order_value",
      "aov",
    ]),
    activeSubscribers,
    dormantSubscribers:
      dormantSubscribers ||
      (subscriberBase && activeSubscribers
        ? Math.max(0, subscriberBase - activeSubscribers)
        : 0),
  };
}

export function previousSegmentSnapshot(
  current: SegmentCvmSnapshot,
  factor = 0.94,
): SegmentCvmSnapshot {
  const scale = (value: number) => Math.round(value * factor);
  return {
    segmentPortfolio: Math.max(0, current.segmentPortfolio - 1),
    subscriberBase: scale(current.subscriberBase),
    baseGrowth: Number((current.baseGrowth * 0.82).toFixed(1)),
    targetedSegments: Math.max(0, current.targetedSegments - 2),
    activityScore: Math.max(0, current.activityScore - 3),
    takeUpRate: Number((current.takeUpRate * 0.9).toFixed(1)),
    arpu: scale(current.arpu),
    activeSubscribers: scale(current.activeSubscribers),
    dormantSubscribers: scale(current.dormantSubscribers),
  };
}

function stableHash(id: string | number): number {
  const text = String(id);
  let hash = 0;
  for (let index = 0; index < text.length; index += 1) {
    hash = (hash * 31 + text.charCodeAt(index)) >>> 0;
  }
  return hash;
}

/** Stable sample measures for dummy mode. Does not change between renders. */
export function dummySegmentMeasures(
  id: string | number,
  sizeEstimate: number | null | undefined,
): SegmentCvmMeasures {
  const hash = stableHash(id);
  const subscribers =
    sizeEstimate && sizeEstimate > 0 ? sizeEstimate : 8_000 + (hash % 420_000);
  return {
    subscribers,
    baseGrowth: Number((((hash % 1800) / 100) - 4).toFixed(1)),
    campaignsTargeting: 1 + (hash % 18),
    activityScore: 35 + (hash % 55),
    takeUpRate: Number((1 + (hash % 140) / 10).toFixed(1)),
    arpu: 40 + (hash % 280),
    status: hash % 5 === 0 ? "Inactive" : "Active",
  };
}

export function readActivityScore(row: Record<string, unknown>): number {
  return readNumber(row, [
    "activityScore",
    "activity_score",
    "engagementScore",
    "engagement_score",
    "engagementRate",
    "engagement_rate",
    "engagement",
  ]);
}

export function readTakeUpRate(row: Record<string, unknown>): number {
  return readNumber(row, [
    "takeUpRate",
    "take_up_rate",
    "conversionRate",
    "conversion_rate",
    "conversion",
  ]);
}

export { computeDeltaTrend, formatCount, formatRate, type KpiTrend };
