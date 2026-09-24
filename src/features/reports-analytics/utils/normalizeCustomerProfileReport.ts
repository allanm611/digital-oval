import type {
  CustomerProfileReportsResponse,
  CustomerProfileTrend,
} from "../types/ReportsAPI";
import { asFiniteNumber, pickNamedArray } from "./normalizeCampaignReport";
import {
  aggregateValueBands,
  cvmValueBand,
  subscriberCvmSnapshot,
  type ValueBandPoint,
} from "./subscriberCvmMetrics";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function unwrapPortfolio(payload: unknown): Record<string, unknown> | null {
  if (!isRecord(payload)) return null;
  const nested = isRecord(payload.data) ? payload.data : null;
  const data = nested ?? payload;
  const hasPortfolio =
    isRecord(data.heroMetrics) ||
    isRecord(data.summary) ||
    isRecord(data.kpis) ||
    "activeCustomers" in data ||
    "activeSubscribers" in data ||
    "arpu" in data ||
    Array.isArray(data.valueMatrix) ||
    Array.isArray(data.value_matrix) ||
    Array.isArray(data.lifecycleDistribution) ||
    Array.isArray(data.lifecycle);
  if (hasPortfolio) return data;
  if (nested) return nested;
  return null;
}

function trendFrom(
  source: Record<string, unknown> | null | undefined,
  keys: string[],
): CustomerProfileTrend | undefined {
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

function normalizeLifecyclePoint(row: unknown): CustomerProfileReportsResponse["lifecycleDistribution"][number] | null {
  if (!isRecord(row)) return null;
  const month = String(row.month ?? row.period ?? row.label ?? "").trim();
  if (!month) return null;
  return {
    month,
    new: asFiniteNumber(row.new ?? row.newSubscribers ?? row.new_subscribers),
    active: asFiniteNumber(row.active ?? row.activeSubscribers ?? row.active_subscribers),
    atRisk: asFiniteNumber(row.atRisk ?? row.at_risk ?? row.atRiskSubscribers),
    dormant: asFiniteNumber(row.dormant),
    churned: asFiniteNumber(row.churned),
    reactivated: asFiniteNumber(
      row.reactivated ?? row.winBack ?? row.win_back ?? row.winback,
    ),
  };
}

export function normalizeLifecyclePoints(
  rows: unknown[],
): CustomerProfileReportsResponse["lifecycleDistribution"] {
  return rows
    .map(normalizeLifecyclePoint)
    .filter((row): row is NonNullable<typeof row> => row != null);
}

function normalizeValueMatrix(rows: unknown[]): CustomerProfileReportsResponse["valueMatrix"] {
  const points: ValueBandPoint[] = [];
  for (const row of rows) {
    if (!isRecord(row)) continue;
    const segment = cvmValueBand(String(row.segment ?? row.band ?? row.name ?? ""));
    const lifecycleRaw = String(row.lifecycle ?? row.stage ?? "Active");
    const lifecycle = /churn/.test(lifecycleRaw.toLowerCase())
      ? "Churned"
      : /risk/.test(lifecycleRaw.toLowerCase())
        ? "At-Risk"
        : /new|growth/.test(lifecycleRaw.toLowerCase())
          ? "New"
          : "Active";
    points.push({
      segment,
      recency: asFiniteNumber(row.recency ?? row.days_since_activity ?? row.daysSinceActivity),
      valueScore: asFiniteNumber(row.valueScore ?? row.value_score ?? row.score),
      customers: asFiniteNumber(
        row.customers ?? row.subscribers ?? row.count ?? row.subscriber_count,
      ),
      lifecycle,
    });
  }
  return aggregateValueBands(points).map((point) => ({
    segment: point.segment,
    recency: point.recency,
    valueScore: point.valueScore,
    customers: point.customers,
    lifecycle: point.lifecycle as "New" | "Active" | "At-Risk" | "Churned",
  }));
}

function normalizeClv(
  rows: unknown[],
): CustomerProfileReportsResponse["clvDistribution"] {
  return rows.flatMap((row) => {
    if (!isRecord(row)) return [];
    const range = String(row.range ?? row.band ?? row.label ?? "").trim();
    if (!range) return [];
    return [
      {
        range,
        customers: asFiniteNumber(row.customers ?? row.subscribers ?? row.count),
        revenueShare: asFiniteNumber(
          row.revenueShare ?? row.revenue_share ?? row.valueShare ?? row.value_share,
        ),
      },
    ];
  });
}

function normalizeCohorts(
  rows: unknown[],
): CustomerProfileReportsResponse["cohortRetention"] {
  return rows.flatMap((row) => {
    if (!isRecord(row)) return [];
    const cohort = String(row.cohort ?? row.name ?? "").trim();
    if (!cohort) return [];
    return [
      {
        month: asFiniteNumber(row.month ?? row.months ?? row.tenure_month),
        cohort,
        retention: asFiniteNumber(row.retention ?? row.retentionRate ?? row.retention_rate),
      },
    ];
  });
}

export function normalizeCustomerProfileReport(
  payload: unknown,
): CustomerProfileReportsResponse | null {
  const data = unwrapPortfolio(payload);
  if (!data) return null;

  const heroSource = isRecord(data.heroMetrics)
    ? data.heroMetrics
    : isRecord(data.summary)
      ? data.summary
      : isRecord(data.kpis)
        ? data.kpis
        : data;
  const snapshot = subscriberCvmSnapshot(heroSource);

  const trendSource = isRecord(data.heroTrends)
    ? data.heroTrends
    : isRecord(data.trends)
      ? data.trends
      : undefined;

  const valueMatrix = normalizeValueMatrix(
    pickNamedArray(data, ["valueMatrix", "value_matrix", "valueBands", "value_bands"]),
  );
  const lifecycleDistribution = normalizeLifecyclePoints(
    pickNamedArray(data, ["lifecycleDistribution", "lifecycle", "lifecycle_distribution"]),
  );
  const clvDistribution = normalizeClv(
    pickNamedArray(data, ["clvDistribution", "clv_distribution", "lifetimeValue", "lifetime_value"]),
  );
  const cohortRetention = normalizeCohorts(
    pickNamedArray(data, ["cohortRetention", "cohort_retention", "cohorts"]),
  );

  const customers = pickNamedArray<CustomerProfileReportsResponse["customers"][number]>(data, [
    "customers",
    "subscribers",
  ]);

  const meta = isRecord(data.meta) ? data.meta : undefined;

  return {
    heroMetrics: {
      activeCustomers: snapshot.activeSubscribers,
      avgClv: snapshot.subscriberLifetimeValue,
      avgOrderValue: snapshot.arpu,
      purchaseFrequency: snapshot.rechargeFrequency,
      engagementScore: snapshot.activityScore,
      churnRate: snapshot.churnRate,
    },
    heroTrends: {
      activeCustomers: trendFrom(trendSource, [
        "activeSubscribers",
        "activeCustomers",
        "active_subscribers",
      ]),
      avgClv: trendFrom(trendSource, ["subscriberLifetimeValue", "avgClv", "clv"]),
      avgOrderValue: trendFrom(trendSource, ["arpu", "avgOrderValue", "aov"]),
      purchaseFrequency: trendFrom(trendSource, [
        "rechargeFrequency",
        "activityFrequency",
        "purchaseFrequency",
      ]),
      engagementScore: trendFrom(trendSource, ["activityScore", "engagementScore"]),
      churnRate: trendFrom(trendSource, ["churnRate", "churn_rate"]),
    },
    valueMatrix,
    lifecycleDistribution,
    clvDistribution,
    cohortRetention,
    customers,
    totalCustomers: asFiniteNumber(
      data.totalCustomers ?? data.total_customers ?? data.total ?? customers.length,
    ),
    meta: meta
      ? {
          timezone: typeof meta.timezone === "string" ? meta.timezone : undefined,
          currency: typeof meta.currency === "string" ? meta.currency : undefined,
          churnInactivityDays: asFiniteNumber(
            meta.churnInactivityDays ?? meta.churn_inactivity_days,
          ) || undefined,
          source: meta.source === "live" || meta.source === "snapshot" ? meta.source : undefined,
          warning: typeof meta.warning === "string" ? meta.warning : undefined,
          startDate: typeof meta.startDate === "string" ? meta.startDate : undefined,
          endDate: typeof meta.endDate === "string" ? meta.endDate : undefined,
        }
      : undefined,
  };
}
