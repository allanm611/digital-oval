import type { RangeOption } from "../types/ReportsAPI";
import { asFiniteNumber } from "./normalizeCampaignReport";
import {
  computeDeltaTrend,
  formatCount,
  formatRate,
  type KpiTrend,
} from "./campaignCvmMetrics";

/**
 * Subscriber-portfolio labels. Digital-marketing names (AOV, purchase,
 * engagement, RFM Champions) stay in payloads; the UI speaks CVM.
 */
export const SUBSCRIBER_CVM_LABELS = {
  activeSubscribers: "Active Subscribers",
  subscriberLifetimeValue: "Subscriber Lifetime Value",
  arpu: "ARPU",
  rechargeFrequency: "Recharge Frequency",
  activityScore: "Activity Score",
  churnRate: "Churn Rate",
  highValue: "High Value",
  core: "Core",
  growth: "Growth",
  atRisk: "At Risk",
  churned: "Churned",
  winBack: "Win-back",
  dormant: "Dormant",
  new: "New",
  valueShare: "Value share",
  subscribers: "Subscribers",
} as const;

export const VALUE_BAND_ORDER = [
  SUBSCRIBER_CVM_LABELS.highValue,
  SUBSCRIBER_CVM_LABELS.core,
  SUBSCRIBER_CVM_LABELS.growth,
  SUBSCRIBER_CVM_LABELS.winBack,
  SUBSCRIBER_CVM_LABELS.atRisk,
  SUBSCRIBER_CVM_LABELS.dormant,
  SUBSCRIBER_CVM_LABELS.new,
  SUBSCRIBER_CVM_LABELS.churned,
] as const;

export type SubscriberCvmSnapshot = {
  activeSubscribers: number;
  subscriberLifetimeValue: number;
  arpu: number;
  rechargeFrequency: number;
  activityScore: number;
  churnRate: number;
};

export type ValueBandPoint = {
  segment: string;
  recency: number;
  valueScore: number;
  customers: number;
  lifecycle: string;
};

const HERO_BASE: SubscriberCvmSnapshot = {
  activeSubscribers: 1_284_200,
  subscriberLifetimeValue: 1_540,
  arpu: 128,
  rechargeFrequency: 3.4,
  activityScore: 72,
  churnRate: 8.3,
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

/**
 * Maps a value-band label onto the CVM subscriber portfolio.
 * Legacy RFM / digital-marketing names are accepted so live payloads keep working.
 */
export function cvmValueBand(segment: string): string {
  const key = String(segment || "")
    .toLowerCase()
    .replace(/[_-]+/g, " ")
    .trim();
  if (!key) return SUBSCRIBER_CVM_LABELS.core;
  if (/champion|high value|\bhv\b/.test(key)) return SUBSCRIBER_CVM_LABELS.highValue;
  if (/potential|growth/.test(key)) return SUBSCRIBER_CVM_LABELS.growth;
  if (/win ?back|reactivat/.test(key)) return SUBSCRIBER_CVM_LABELS.winBack;
  if (/loyal|core|medium value/.test(key)) return SUBSCRIBER_CVM_LABELS.core;
  if (/at ?risk|\brisk\b/.test(key)) return SUBSCRIBER_CVM_LABELS.atRisk;
  if (/dormant/.test(key)) return SUBSCRIBER_CVM_LABELS.dormant;
  if (/churn|inactive|lost/.test(key)) return SUBSCRIBER_CVM_LABELS.churned;
  if (/^new\b/.test(key)) return SUBSCRIBER_CVM_LABELS.new;
  return segment;
}

export function aggregateValueBands(points: ValueBandPoint[] = []): ValueBandPoint[] {
  const grouped = new Map<string, ValueBandPoint>();
  for (const point of points) {
    const segment = cvmValueBand(point.segment);
    const customers = asFiniteNumber(point.customers);
    const existing = grouped.get(segment);
    if (!existing) {
      grouped.set(segment, {
        segment,
        customers,
        recency: asFiniteNumber(point.recency),
        valueScore: asFiniteNumber(point.valueScore),
        lifecycle: point.lifecycle,
      });
      continue;
    }
    const nextCustomers = existing.customers + customers;
    existing.recency = nextCustomers
      ? Math.round(
          (existing.recency * existing.customers + asFiniteNumber(point.recency) * customers) /
            nextCustomers,
        )
      : existing.recency;
    existing.valueScore = nextCustomers
      ? Math.round(
          (existing.valueScore * existing.customers +
            asFiniteNumber(point.valueScore) * customers) /
            nextCustomers,
        )
      : existing.valueScore;
    existing.customers = nextCustomers;
  }
  return [...grouped.values()].sort((a, b) => {
    const ai = VALUE_BAND_ORDER.indexOf(a.segment as (typeof VALUE_BAND_ORDER)[number]);
    const bi = VALUE_BAND_ORDER.indexOf(b.segment as (typeof VALUE_BAND_ORDER)[number]);
    return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
  });
}

export function subscriberCvmSnapshot(
  hero: Record<string, unknown> | null | undefined,
): SubscriberCvmSnapshot {
  return {
    activeSubscribers: readNumber(hero, [
      "activeSubscribers",
      "active_subscribers",
      "activeCustomers",
      "active_customers",
      "activeBase",
      "active_base",
    ]),
    subscriberLifetimeValue: readNumber(hero, [
      "subscriberLifetimeValue",
      "subscriber_lifetime_value",
      "avgClv",
      "avg_clv",
      "clv",
      "slv",
    ]),
    arpu: readNumber(hero, [
      "arpu",
      "averageRevenuePerUser",
      "average_revenue_per_user",
      "avgOrderValue",
      "avg_order_value",
      "aov",
    ]),
    rechargeFrequency: readNumber(hero, [
      "rechargeFrequency",
      "recharge_frequency",
      "activityFrequency",
      "activity_frequency",
      "purchaseFrequency",
      "purchase_frequency",
    ]),
    activityScore: readNumber(hero, [
      "activityScore",
      "activity_score",
      "usageScore",
      "usage_score",
      "engagementScore",
      "engagement_score",
    ]),
    churnRate: readNumber(hero, ["churnRate", "churn_rate"]),
  };
}

export function dummySubscriberHero(
  rangeKey: RangeOption,
  multiplier: number,
): SubscriberCvmSnapshot {
  const clvAdjust = rangeKey === "7d" ? 0.96 : rangeKey === "30d" ? 0.99 : 1;
  const activityAdjust = rangeKey === "7d" ? -3 : rangeKey === "30d" ? -1 : 0;
  const churnAdjust = rangeKey === "7d" ? -0.4 : rangeKey === "30d" ? -0.2 : 0;
  return {
    activeSubscribers: Math.round(HERO_BASE.activeSubscribers * multiplier),
    subscriberLifetimeValue: Math.round(HERO_BASE.subscriberLifetimeValue * clvAdjust),
    arpu: Math.round(HERO_BASE.arpu * clvAdjust),
    rechargeFrequency: Number((HERO_BASE.rechargeFrequency * clvAdjust).toFixed(1)),
    activityScore: Math.max(0, HERO_BASE.activityScore + activityAdjust),
    churnRate: Math.max(0, Number((HERO_BASE.churnRate + churnAdjust).toFixed(1))),
  };
}

export function previousSubscriberSnapshot(
  current: SubscriberCvmSnapshot,
  factor = 0.96,
): SubscriberCvmSnapshot {
  return {
    activeSubscribers: Math.round(current.activeSubscribers * factor),
    subscriberLifetimeValue: Math.round(current.subscriberLifetimeValue * factor),
    arpu: Math.round(current.arpu * factor),
    rechargeFrequency: Number((current.rechargeFrequency * 0.94).toFixed(1)),
    activityScore: Math.max(0, current.activityScore - 2),
    churnRate: Number((current.churnRate + 0.6).toFixed(1)),
  };
}

export { computeDeltaTrend, formatCount, formatRate, type KpiTrend };
