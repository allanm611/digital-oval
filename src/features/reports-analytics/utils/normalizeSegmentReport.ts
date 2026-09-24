import type { SegmentReportTrend, SegmentReportsResponse } from "../types/ReportsAPI";
import { asFiniteNumber, pickNamedArray } from "./normalizeCampaignReport";
import { readActivityScore, readTakeUpRate, segmentCvmSnapshot } from "./segmentCvmMetrics";

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
    Array.isArray(data.segments) ||
    Array.isArray(data.memberGrowth) ||
    Array.isArray(data.member_growth) ||
    Array.isArray(data.sizeDistribution) ||
    Array.isArray(data.size_distribution) ||
    "totalMembers" in data ||
    "subscriberBase" in data ||
    "totalSegments" in data;
  if (hasPortfolio) return data;
  if (nested) return nested;
  return null;
}

function trendFrom(
  source: Record<string, unknown> | null | undefined,
  keys: string[],
): SegmentReportTrend | undefined {
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

function namedPoint(
  row: unknown,
  valueKeys: string[],
): { segmentName: string; value: number; segmentId?: string } | null {
  if (!isRecord(row)) return null;
  const segmentName = String(row.segmentName ?? row.segment_name ?? row.name ?? "").trim();
  if (!segmentName) return null;
  const segmentId = row.segmentId ?? row.segment_id ?? row.id;
  return {
    segmentName,
    value: readNumber(row, valueKeys),
    segmentId: segmentId == null || segmentId === "" ? undefined : String(segmentId),
  };
}

function readNumber(source: Record<string, unknown>, keys: string[]): number {
  for (const key of keys) {
    if (source[key] == null || source[key] === "") continue;
    const parsed = asFiniteNumber(source[key], Number.NaN);
    if (Number.isFinite(parsed)) return parsed;
  }
  return 0;
}

export function normalizeSegmentReport(payload: unknown): SegmentReportsResponse | null {
  const data = unwrapPortfolio(payload);
  if (!data) return null;

  const summarySource = isRecord(data.summary)
    ? data.summary
    : isRecord(data.kpis)
      ? data.kpis
      : data;
  const snapshot = segmentCvmSnapshot(summarySource);
  const trendSource = isRecord(data.heroTrends)
    ? data.heroTrends
    : isRecord(data.trends)
      ? data.trends
      : undefined;

  const memberGrowth = pickNamedArray<Record<string, unknown>>(data, [
    "memberGrowth",
    "member_growth",
    "subscriberGrowth",
    "subscriber_growth",
    "growth",
  ]).flatMap((row) => {
    const period = String(row.period ?? row.label ?? row.date ?? "").trim();
    if (!period) return [];
    const members = readNumber(row, [
      "members",
      "subscribers",
      "newSubscribers",
      "new_subscribers",
      "value",
    ]);
    return [
      {
        period,
        date: typeof row.date === "string" ? row.date : undefined,
        members,
        cumulativeMembers: readNumber(row, [
          "cumulativeMembers",
          "cumulative_members",
          "cumulativeBase",
          "cumulative_base",
          "cumulative",
        ]),
      },
    ];
  });

  const sizeDistribution = pickNamedArray(data, [
    "sizeDistribution",
    "size_distribution",
    "segmentSizes",
    "segment_sizes",
  ]).flatMap((row) => {
    const point = namedPoint(row, ["members", "subscribers", "subscriberCount", "count", "size"]);
    if (!point) return [];
    return [{ segmentId: point.segmentId, segmentName: point.segmentName, members: point.value }];
  });

  const campaignUsage = pickNamedArray(data, [
    "campaignUsage",
    "campaign_usage",
    "campaignsTargeting",
    "campaigns_targeting",
  ]).flatMap((row) => {
    const point = namedPoint(row, [
      "campaigns",
      "campaignsTargeting",
      "campaigns_targeting",
      "campaignCount",
      "count",
    ]);
    if (!point) return [];
    return [{ segmentId: point.segmentId, segmentName: point.segmentName, campaigns: point.value }];
  });

  const performanceComparison = pickNamedArray<Record<string, unknown>>(data, [
    "performanceComparison",
    "performance_comparison",
    "outcomes",
  ]).flatMap((row) => {
    const segmentName = String(row.segmentName ?? row.segment_name ?? row.name ?? "").trim();
    if (!segmentName) return [];
    const activityScore = readActivityScore(row);
    const takeUpRate = readTakeUpRate(row);
    const segmentId = row.segmentId ?? row.segment_id ?? row.id;
    return [
      {
        segmentId: segmentId == null || segmentId === "" ? undefined : String(segmentId),
        segmentName,
        engagement: activityScore,
        conversion: takeUpRate,
        activityScore,
        takeUpRate,
      },
    ];
  });

  const segments = pickNamedArray<Record<string, unknown>>(data, ["segments", "rows"]).map(
    (row) => {
      const activityScore = readActivityScore(row);
      const takeUpRate = readTakeUpRate(row);
      const statusRaw = String(row.status ?? row.is_active ?? "Active").toLowerCase();
      const inactive = statusRaw === "inactive" || statusRaw === "false" || statusRaw === "0";
      return {
        id: String(row.id ?? row.segmentId ?? row.segment_id ?? ""),
        name: String(row.name ?? row.segmentName ?? row.segment_name ?? "Unknown"),
        memberCount: readNumber(row, [
          "memberCount",
          "member_count",
          "subscribers",
          "subscriberCount",
          "size_estimate",
          "sizeEstimate",
        ]),
        growthRate: readNumber(row, ["growthRate", "growth_rate", "baseGrowth", "base_growth"]),
        campaignsUsed: readNumber(row, [
          "campaignsUsed",
          "campaigns_used",
          "campaignsTargeting",
          "campaigns_targeting",
          "campaigns",
        ]),
        engagementRate: activityScore,
        conversionRate: takeUpRate,
        avgValue: readNumber(row, ["avgValue", "avg_value", "arpu", "aov"]),
        activityScore,
        takeUpRate,
        arpu: readNumber(row, ["arpu", "avgValue", "avg_value", "aov"]),
        status: inactive ? ("Inactive" as const) : ("Active" as const),
        lastUpdated: String(row.lastUpdated ?? row.last_updated ?? row.updated_at ?? ""),
      };
    },
  );

  const meta = isRecord(data.meta) ? data.meta : undefined;

  return {
    summary: {
      totalSegments: snapshot.segmentPortfolio,
      totalMembers: snapshot.subscriberBase,
      avgMemberGrowth: snapshot.baseGrowth,
      activeInCampaigns: snapshot.targetedSegments,
      engagementRate: snapshot.activityScore,
      conversionRate: snapshot.takeUpRate,
      activityScore: snapshot.activityScore,
      takeUpRate: snapshot.takeUpRate,
      arpu: snapshot.arpu,
      activeSubscribers: snapshot.activeSubscribers,
      dormantSubscribers: snapshot.dormantSubscribers,
    },
    memberGrowth,
    sizeDistribution,
    campaignUsage,
    performanceComparison,
    segments,
    totalSegments: asFiniteNumber(
      data.totalSegments ?? data.total_segments ?? data.total ?? segments.length,
    ),
    heroTrends: {
      totalSegments: trendFrom(trendSource, ["segmentPortfolio", "totalSegments"]),
      totalMembers: trendFrom(trendSource, ["subscriberBase", "totalMembers", "totalSubscribers"]),
      avgMemberGrowth: trendFrom(trendSource, ["baseGrowth", "avgMemberGrowth"]),
      activeInCampaigns: trendFrom(trendSource, ["targetedSegments", "activeInCampaigns"]),
      engagementRate: trendFrom(trendSource, ["activityScore", "engagementScore", "engagementRate"]),
      conversionRate: trendFrom(trendSource, ["takeUpRate", "conversionRate", "redemptionRate"]),
      activityScore: trendFrom(trendSource, ["activityScore", "engagementScore", "engagementRate"]),
      takeUpRate: trendFrom(trendSource, ["takeUpRate", "conversionRate"]),
      arpu: trendFrom(trendSource, ["arpu", "avgValue", "aov"]),
    },
    meta: meta
      ? {
          timezone: typeof meta.timezone === "string" ? meta.timezone : undefined,
          currency: typeof meta.currency === "string" ? meta.currency : undefined,
          range: typeof meta.range === "string" ? meta.range : undefined,
          grain: typeof meta.grain === "string" ? meta.grain : undefined,
          warning: typeof meta.warning === "string" ? meta.warning : undefined,
          startDate: typeof meta.startDate === "string" ? meta.startDate : undefined,
          endDate: typeof meta.endDate === "string" ? meta.endDate : undefined,
          source: meta.source === "live" || meta.source === "snapshot" ? meta.source : undefined,
          computedAt: typeof meta.computedAt === "string" ? meta.computedAt : undefined,
        }
      : undefined,
  };
}
