import type {
  OfferCategoryRow,
  OfferKpiSummary,
  OfferLegacyPerformance,
  OfferRedemptionRow,
  OfferReportEnvelope,
  OfferReportsResponse,
  OfferRevenueReport,
  OfferRow,
} from "../types/ReportsAPI";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function asFiniteNumber(value: unknown, fallback = 0): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
}

export function pickNamedArray<T>(source: unknown, keys: string[]): T[] {
  if (Array.isArray(source)) return source as T[];
  if (!isRecord(source)) return [];
  for (const key of keys) {
    const value = source[key];
    if (Array.isArray(value)) return value as T[];
  }
  return [];
}

function isSummaryLike(value: unknown): value is Record<string, unknown> {
  return (
    isRecord(value) &&
    ("totalRedemptions" in value ||
      "redemptionRate" in value ||
      "revenueGenerated" in value ||
      "incrementalRevenue" in value ||
      "roi" in value)
  );
}

function normalizeSummary(value: Record<string, unknown>): OfferKpiSummary {
  return {
    totalRedemptions: asFiniteNumber(
      value.totalRedemptions ?? value.converted ?? value.conversions,
    ),
    redemptionRate: asFiniteNumber(value.redemptionRate ?? value.conversionRate),
    revenueGenerated: asFiniteNumber(value.revenueGenerated ?? value.revenue ?? value.total_revenue),
    incrementalRevenue: asFiniteNumber(
      value.incrementalRevenue ?? value.incremental_revenue,
    ),
    totalCost: asFiniteNumber(value.totalCost ?? value.total_cost),
    roi: asFiniteNumber(value.roi ?? value.avg_roi),
    sent: asFiniteNumber(value.sent),
    delivered: asFiniteNumber(value.delivered),
    opened: asFiniteNumber(value.opened),
    clicked: asFiniteNumber(value.clicked),
    converted: asFiniteNumber(value.converted ?? value.totalRedemptions),
    uniqueConverters: asFiniteNumber(value.uniqueConverters ?? value.unique_converters),
    revenue: asFiniteNumber(value.revenue ?? value.revenueGenerated ?? value.total_revenue),
    deliveryRate: asFiniteNumber(value.deliveryRate ?? value.delivery_rate),
    openRate: asFiniteNumber(value.openRate ?? value.open_rate),
    clickRate: asFiniteNumber(value.clickRate ?? value.click_rate),
    conversionRate: asFiniteNumber(value.conversionRate ?? value.conversion_rate ?? value.redemptionRate),
  };
}

export function unwrapOfferSummary(value: unknown): OfferKpiSummary | undefined {
  if (isRecord(value) && isSummaryLike(value.summary)) {
    const nested = normalizeSummary(value.summary);
    const extras = normalizeSummary(value);
    return {
      ...nested,
      sent: extras.sent || nested.sent,
      delivered: extras.delivered || nested.delivered,
      opened: extras.opened || nested.opened,
      clicked: extras.clicked || nested.clicked,
      converted: extras.converted || nested.converted,
      uniqueConverters: extras.uniqueConverters || nested.uniqueConverters,
      revenue: extras.revenue || nested.revenue,
      deliveryRate: extras.deliveryRate || nested.deliveryRate,
      openRate: extras.openRate || nested.openRate,
      clickRate: extras.clickRate || nested.clickRate,
      conversionRate: extras.conversionRate || nested.conversionRate,
    };
  }
  if (isSummaryLike(value)) return normalizeSummary(value);
  return undefined;
}

export function unwrapHeroTrends(
  envelope: OfferReportEnvelope<unknown> | null | undefined,
): OfferReportsResponse["heroTrends"] | undefined {
  if (envelope?.trends) return envelope.trends;
  const data = envelope?.data;
  if (isRecord(data) && isRecord(data.heroTrends)) {
    return data.heroTrends as OfferReportsResponse["heroTrends"];
  }
  return undefined;
}

function preferSeries<T>(
  primary: T[],
  secondary: T[],
  score: (item: T) => number,
): T[] {
  const primaryScore = primary.reduce((sum, item) => sum + score(item), 0);
  const secondaryScore = secondary.reduce((sum, item) => sum + score(item), 0);
  if (primary.length && primaryScore >= secondaryScore) return primary;
  if (secondary.length) return secondary;
  return primary;
}

export function normalizeOfferPortfolio(
  envelope: OfferReportEnvelope<unknown> | null | undefined,
): Partial<OfferReportsResponse> {
  if (!envelope) return {};
  const data = envelope.data;
  const offers = pickNamedArray<OfferRow>(data, ["offers"]);

  return {
    summary: unwrapOfferSummary(data),
    heroTrends: unwrapHeroTrends(envelope),
    redemptionFunnel: pickNamedArray(data, ["redemptionFunnel", "funnel"]),
    redemptionTimeline: pickNamedArray(data, ["redemptionTimeline", "timeline"]),
    offerTypeComparison: pickNamedArray(data, ["offerTypeComparison", "byType"]),
    offers,
    totalOffers: isRecord(data)
      ? asFiniteNumber(data.totalOffers, offers.length)
      : offers.length,
    meta:
      envelope.meta ||
      (isRecord(data) && isRecord(data.meta)
        ? (data.meta as OfferReportsResponse["meta"])
        : undefined),
  };
}

export function mergeSplitOfferWidgets(parts: {
  kpis?: OfferReportEnvelope<unknown> | null;
  funnel?: OfferReportEnvelope<unknown> | null;
  timeline?: OfferReportEnvelope<unknown> | null;
  byType?: OfferReportEnvelope<unknown> | null;
}): Partial<OfferReportsResponse> {
  const fromKpis = normalizeOfferPortfolio(parts.kpis);
  const kpisSummary = unwrapOfferSummary(parts.kpis?.data) || fromKpis.summary;
  const funnel = pickNamedArray<OfferReportsResponse["redemptionFunnel"][number]>(
    parts.funnel?.data,
    ["redemptionFunnel", "funnel"],
  );
  const timeline = pickNamedArray<
    OfferReportsResponse["redemptionTimeline"][number]
  >(parts.timeline?.data, ["redemptionTimeline", "timeline"]);
  const byType = pickNamedArray<
    OfferReportsResponse["offerTypeComparison"][number]
  >(parts.byType?.data, ["offerTypeComparison", "byType"]);

  return {
    ...fromKpis,
    summary: kpisSummary || fromKpis.summary,
    heroTrends: fromKpis.heroTrends || unwrapHeroTrends(parts.kpis),
    redemptionFunnel: preferSeries(
      fromKpis.redemptionFunnel || [],
      funnel,
      (point) => asFiniteNumber(point.value),
    ),
    redemptionTimeline: preferSeries(
      fromKpis.redemptionTimeline || [],
      timeline,
      (point) => asFiniteNumber(point.redemptions),
    ),
    offerTypeComparison: preferSeries(
      fromKpis.offerTypeComparison || [],
      byType,
      (point) => asFiniteNumber(point.incrementalRevenue) + asFiniteNumber(point.redemptionRate),
    ),
    meta: fromKpis.meta || parts.kpis?.meta,
  };
}

export function unwrapOfferTable(
  envelope: OfferReportEnvelope<unknown> | null | undefined,
): { rows: OfferRow[]; total: number } {
  if (!envelope) return { rows: [], total: 0 };
  const rows = pickNamedArray<OfferRow>(envelope.data, ["offers"]);
  const nestedTotal =
    isRecord(envelope.data) && envelope.data.totalOffers != null
      ? asFiniteNumber(envelope.data.totalOffers, rows.length)
      : rows.length;
  return {
    rows,
    total: envelope.total ?? envelope.pagination?.total ?? nestedTotal,
  };
}

export function unwrapOfferCategories(
  envelope: OfferReportEnvelope<unknown> | null | undefined,
): OfferCategoryRow[] {
  return pickNamedArray<OfferCategoryRow>(envelope?.data, [
    "categories",
    "byCategory",
  ]);
}

export function unwrapRedemptionRows(
  envelope: OfferReportEnvelope<unknown> | null | undefined,
): OfferRedemptionRow[] {
  return pickNamedArray<OfferRedemptionRow>(envelope?.data, [
    "redemption",
    "rewards",
  ]);
}

export function unwrapRevenueReport(
  envelope: OfferReportEnvelope<unknown> | null | undefined,
): OfferRevenueReport | null {
  const data = envelope?.data;
  if (!isRecord(data)) return null;
  return {
    totalRevenue: asFiniteNumber(
      data.totalRevenue ?? data.total_revenue ?? data.revenue,
    ),
    incrementalRevenue: asFiniteNumber(
      data.incrementalRevenue ?? data.incremental_revenue,
    ),
    totalRewardCost: asFiniteNumber(
      data.totalRewardCost ?? data.total_reward_cost,
    ),
    deliveryCost: asFiniteNumber(data.deliveryCost ?? data.delivery_cost),
    totalCost: asFiniteNumber(data.totalCost ?? data.total_cost),
    roi: asFiniteNumber(data.roi),
    roiPercent: asFiniteNumber(data.roiPercent ?? data.avg_roi ?? data.roi),
    revenuePerContact: asFiniteNumber(
      data.revenuePerContact ?? data.revenue_per_contact,
    ),
    revenuePerConverter: asFiniteNumber(
      data.revenuePerConverter ?? data.revenue_per_converter,
    ),
    sent: asFiniteNumber(data.sent),
    delivered: asFiniteNumber(data.delivered),
    opened: asFiniteNumber(data.opened),
    clicked: asFiniteNumber(data.clicked),
    converted: asFiniteNumber(data.converted),
    uniqueConverters: asFiniteNumber(data.uniqueConverters),
    deliveryRate: asFiniteNumber(data.deliveryRate),
    openRate: asFiniteNumber(data.openRate),
    clickRate: asFiniteNumber(data.clickRate),
    conversionRate: asFiniteNumber(data.conversionRate),
  };
}

export function summaryFromLegacy(
  value: OfferLegacyPerformance | null | undefined,
): OfferKpiSummary | undefined {
  if (!value) return undefined;
  return {
    totalRedemptions: asFiniteNumber(value.converted),
    redemptionRate: asFiniteNumber(value.conversionRate),
    revenueGenerated: asFiniteNumber(value.revenue),
    incrementalRevenue: 0,
    totalCost: 0,
    roi: 0,
    sent: asFiniteNumber(value.sent),
    delivered: asFiniteNumber(value.delivered),
    opened: asFiniteNumber(value.opened),
    clicked: asFiniteNumber(value.clicked),
    converted: asFiniteNumber(value.converted),
    revenue: asFiniteNumber(value.revenue),
    openRate: asFiniteNumber(value.openRate),
    clickRate: asFiniteNumber(value.clickRate),
    conversionRate: asFiniteNumber(value.conversionRate),
  };
}

export function seriesHasActivity(
  points: Array<{ value?: number }> | null | undefined,
): boolean {
  return Boolean(points?.some((point) => asFiniteNumber(point.value) > 0));
}

export function typeComparisonHasRows(
  points: OfferReportsResponse["offerTypeComparison"] | null | undefined,
): boolean {
  return Boolean(points?.length);
}

export function formatOfferReportDate(value?: string | null): string {
  if (!value) return "—";
  const trimmed = value.trim();
  if (!trimmed) return "—";

  if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) {
    return trimmed.slice(0, 10);
  }

  const parsed = new Date(trimmed);
  if (!Number.isNaN(parsed.getTime()) && parsed.getFullYear() >= 2010) {
    return parsed.toISOString().slice(0, 10);
  }

  return trimmed;
}

export function offerPortfolioHasWidgets(
  report: Partial<OfferReportsResponse> | null | undefined,
): boolean {
  const summary = report?.summary;
  const summaryHasSignal = Boolean(
    summary &&
      (asFiniteNumber(summary.totalRedemptions) > 0 ||
        asFiniteNumber(summary.revenueGenerated) > 0 ||
        asFiniteNumber(summary.incrementalRevenue) > 0 ||
        asFiniteNumber(summary.totalCost) > 0 ||
        asFiniteNumber(summary.redemptionRate) > 0),
  );
  return Boolean(
    summaryHasSignal ||
      seriesHasActivity(report?.redemptionFunnel) ||
      report?.redemptionTimeline?.some(
        (point) => asFiniteNumber(point.redemptions) > 0,
      ) ||
      typeComparisonHasRows(report?.offerTypeComparison),
  );
}
