import type {
  CampaignReportEnvelope,
  CampaignReportsResponse,
  CampaignRow,
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
    ("eligibleAudience" in value ||
      "engagementRate" in value ||
      "conversionRate" in value ||
      "campaignCost" in value ||
      ("reach" in value &&
        !("channelReach" in value) &&
        !("campaigns" in value) &&
        !("conversionFunnel" in value)))
  );
}

function normalizeSummary(
  value: Record<string, unknown>,
): CampaignReportsResponse["summary"] {
  return {
    eligibleAudience: asFiniteNumber(value.eligibleAudience),
    recipients: asFiniteNumber(value.recipients),
    reach: asFiniteNumber(value.reach ?? value.delivered),
    impressions: asFiniteNumber(value.impressions ?? value.recipients),
    opens: asFiniteNumber(value.opens ?? value.opened),
    clicks: asFiniteNumber(value.clicks ?? value.clicked),
    clickRate: asFiniteNumber(value.clickRate),
    engagementRate: asFiniteNumber(value.engagementRate ?? value.openRate),
    conversions: asFiniteNumber(value.conversions ?? value.converted),
    conversionRate: asFiniteNumber(value.conversionRate),
    revenue: asFiniteNumber(value.revenue),
    roas: asFiniteNumber(value.roas),
    cac: asFiniteNumber(value.cac),
    leads: asFiniteNumber(value.leads),
    campaignCost: asFiniteNumber(value.campaignCost),
  };
}

export function unwrapCampaignSummary(
  value: unknown,
): CampaignReportsResponse["summary"] | undefined {
  if (isSummaryLike(value)) return normalizeSummary(value);
  if (isRecord(value) && isSummaryLike(value.summary)) {
    return normalizeSummary(value.summary);
  }
  return undefined;
}

export function unwrapHeroTrends(
  envelope: CampaignReportEnvelope<unknown> | null | undefined,
): CampaignReportsResponse["heroTrends"] | undefined {
  if (envelope?.trends) return envelope.trends;
  const data = envelope?.data;
  if (isRecord(data) && isRecord(data.heroTrends)) {
    return data.heroTrends as CampaignReportsResponse["heroTrends"];
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

export function normalizeCampaignPortfolio(
  envelope: CampaignReportEnvelope<unknown> | null | undefined,
): Partial<CampaignReportsResponse> {
  if (!envelope) return {};
  const data = envelope.data;
  const performanceTrend = pickNamedArray<
    CampaignReportsResponse["performanceTrend"][number]
  >(data, ["performanceTrend", "trends"]);
  let revenueTrend = pickNamedArray<
    CampaignReportsResponse["revenueTrend"][number]
  >(data, ["revenueTrend"]);
  if (!revenueTrend.length && performanceTrend.length) {
    revenueTrend = performanceTrend.map((point) => ({
      period: point.period,
      date: point.date,
      revenue: asFiniteNumber(point.revenue),
      spend: asFiniteNumber(point.spend),
      target: 0,
    }));
  }
  const campaigns = pickNamedArray<CampaignRow>(data, ["campaigns"]);

  return {
    summary: unwrapCampaignSummary(data),
    heroTrends: unwrapHeroTrends(envelope),
    channelReach: pickNamedArray(data, ["channelReach"]),
    conversionFunnel: pickNamedArray(data, ["conversionFunnel", "funnel"]),
    performanceTrend,
    revenueTrend,
    campaigns,
    totalCampaigns: isRecord(data)
      ? asFiniteNumber(data.totalCampaigns, campaigns.length)
      : campaigns.length,
    meta:
      envelope.meta ||
      (isRecord(data) && isRecord(data.meta)
        ? (data.meta as CampaignReportsResponse["meta"])
        : undefined),
  };
}

export function mergeSplitCampaignWidgets(parts: {
  kpis?: CampaignReportEnvelope<unknown> | null;
  reach?: CampaignReportEnvelope<unknown> | null;
  funnel?: CampaignReportEnvelope<unknown> | null;
  trends?: CampaignReportEnvelope<unknown> | null;
}): Partial<CampaignReportsResponse> {
  const fromKpis = normalizeCampaignPortfolio(parts.kpis);
  const reach = pickNamedArray<
    CampaignReportsResponse["channelReach"][number]
  >(parts.reach?.data, ["channelReach"]);
  const funnel = pickNamedArray<
    CampaignReportsResponse["conversionFunnel"][number]
  >(parts.funnel?.data, ["conversionFunnel", "funnel"]);
  const trends = pickNamedArray<
    CampaignReportsResponse["performanceTrend"][number]
  >(parts.trends?.data, ["performanceTrend", "trends"]);

  const performanceTrend = preferSeries(
    fromKpis.performanceTrend || [],
    trends,
    (point) =>
      asFiniteNumber(point.ctr) +
      asFiniteNumber(point.engagement) +
      asFiniteNumber(point.revenue),
  );
  const revenueTrend =
    fromKpis.revenueTrend?.length
      ? fromKpis.revenueTrend
      : performanceTrend.map((point) => ({
          period: point.period,
          date: point.date,
          revenue: asFiniteNumber(point.revenue),
          spend: asFiniteNumber(point.spend),
          target: 0,
        }));

  return {
    ...fromKpis,
    channelReach: preferSeries(
      fromKpis.channelReach || [],
      reach,
      (point) => asFiniteNumber(point.reach) + asFiniteNumber(point.impressions),
    ),
    conversionFunnel: preferSeries(
      fromKpis.conversionFunnel || [],
      funnel,
      (point) => asFiniteNumber(point.value),
    ),
    performanceTrend,
    revenueTrend,
    heroTrends: fromKpis.heroTrends || unwrapHeroTrends(parts.kpis),
    meta: fromKpis.meta || parts.kpis?.meta,
  };
}

export function unwrapCampaignTable(
  envelope: CampaignReportEnvelope<unknown> | null | undefined,
): { rows: CampaignRow[]; total: number } {
  if (!envelope) return { rows: [], total: 0 };
  const rows = pickNamedArray<CampaignRow>(envelope.data, ["campaigns"]);
  const nestedTotal =
    isRecord(envelope.data) && envelope.data.totalCampaigns != null
      ? asFiniteNumber(envelope.data.totalCampaigns, rows.length)
      : rows.length;
  return {
    rows,
    total: envelope.total ?? envelope.pagination?.total ?? nestedTotal,
  };
}

export function sortChannelReachForChart(
  points: CampaignReportsResponse["channelReach"] = [],
): CampaignReportsResponse["channelReach"] {
  return [...points].sort((left, right) => {
    const rightScore =
      asFiniteNumber(right.impressions) + asFiniteNumber(right.reach);
    const leftScore =
      asFiniteNumber(left.impressions) + asFiniteNumber(left.reach);
    return rightScore - leftScore;
  });
}

export function formatAudienceShare(reach: number, eligible: number): string {
  if (!eligible) return "0%";
  const pct = (reach / eligible) * 100;
  if (pct <= 0) return "0%";
  if (pct < 0.1) return "<0.1%";
  if (pct < 1) return `${pct.toFixed(2)}%`;
  return `${Math.round(pct)}%`;
}

export function campaignPortfolioHasWidgets(
  report: Partial<CampaignReportsResponse> | null | undefined,
): boolean {
  return Boolean(
    report?.summary ||
      report?.channelReach?.length ||
      report?.conversionFunnel?.length ||
      report?.performanceTrend?.length ||
      report?.revenueTrend?.length,
  );
}
