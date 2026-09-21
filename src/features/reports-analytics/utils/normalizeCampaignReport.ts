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
      "deliveryRate" in value ||
      "campaignCost" in value ||
      ("reach" in value &&
        !("channelReach" in value) &&
        !("campaigns" in value) &&
        !("conversionFunnel" in value)) ||
      ("sent" in value && "delivered" in value))
  );
}

function rateFrom(numerator: unknown, denominator: unknown): number {
  const n = asFiniteNumber(numerator);
  const d = asFiniteNumber(denominator);
  if (!d) return 0;
  return Number(((n / d) * 100).toFixed(1));
}

function normalizeSummary(
  value: Record<string, unknown>,
): CampaignReportsResponse["summary"] {
  const sent = asFiniteNumber(value.sent ?? value.impressions ?? value.recipients);
  const delivered = asFiniteNumber(value.delivered ?? value.reach);
  const uniqueAudience = asFiniteNumber(
    value.uniqueAudience ?? value.uniqueReach ?? value.reach ?? delivered,
  );
  const converted = asFiniteNumber(value.converted ?? value.conversions);
  const deliveryRate = asFiniteNumber(
    value.deliveryRate,
    rateFrom(delivered, sent),
  );
  const conversionRate = asFiniteNumber(
    value.conversionRate,
    rateFrom(converted, delivered || uniqueAudience),
  );
  const targetGroup = asFiniteNumber(value.targetGroup);
  const controlGroup = asFiniteNumber(value.controlGroup);
  const pool = targetGroup + controlGroup;
  const targetGroupReached = asFiniteNumber(
    value.targetGroupReached,
    pool ? Math.round(uniqueAudience * (targetGroup / pool)) : uniqueAudience,
  );
  const controlGroupReached = asFiniteNumber(
    value.controlGroupReached,
    Math.max(0, uniqueAudience - targetGroupReached),
  );

  return {
    eligibleAudience: asFiniteNumber(value.eligibleAudience),
    executedAudience: asFiniteNumber(value.executedAudience, targetGroup + controlGroup),
    recipients: asFiniteNumber(value.recipients, sent),
    uniqueAudience,
    reach: uniqueAudience,
    sent,
    impressions: sent,
    delivered,
    deliveryRate,
    opens: asFiniteNumber(value.opens ?? value.opened),
    clicks: asFiniteNumber(value.clicks ?? value.clicked),
    clickRate: asFiniteNumber(value.clickRate),
    engagementRate: asFiniteNumber(value.engagementRate ?? value.openRate),
    conversions: converted,
    converted,
    conversionRate,
    uniqueConverters: asFiniteNumber(value.uniqueConverters, converted),
    targetGroup,
    controlGroup,
    targetGroupReached,
    controlGroupReached,
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
  const channelReach = pickNamedArray<
    CampaignReportsResponse["channelReach"][number]
  >(data, ["channelReach"]).map(normalizeChannelReachPoint);

  return {
    summary: unwrapCampaignSummary(data),
    heroTrends: unwrapHeroTrends(envelope),
    channelReach,
    conversionFunnel: normalizeCvmFunnel(
      pickNamedArray(data, ["conversionFunnel", "funnel"]),
    ),
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
      asFiniteNumber(point.sent) +
      asFiniteNumber(point.delivered) +
      asFiniteNumber(point.converted ?? point.conversions) +
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
      reach.map(normalizeChannelReachPoint),
      (point) =>
        asFiniteNumber(point.sent ?? point.impressions) +
        asFiniteNumber(point.delivered ?? point.reach) +
        asFiniteNumber(point.uniqueAudience ?? point.reach),
    ),
    conversionFunnel: preferSeries(
      fromKpis.conversionFunnel || [],
      normalizeCvmFunnel(funnel),
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

export const CAMPAIGN_CHANNEL_CATALOG = [
  "Email",
  "Whatsapp Messenger",
  "SMS Flash",
  "SMS Normal",
  "USSD",
  "Push Notification",
  "Digital channels",
] as const;

const CVM_FUNNEL_ALIASES: Record<string, "Sent" | "Delivered" | "Converted"> = {
  sent: "Sent",
  dispatched: "Sent",
  delivered: "Delivered",
  delivery: "Delivered",
  converted: "Converted",
  conversions: "Converted",
  conversion: "Converted",
};

export function normalizeCvmFunnel(
  rows: CampaignReportsResponse["conversionFunnel"] = [],
): CampaignReportsResponse["conversionFunnel"] {
  const totals: Record<"Sent" | "Delivered" | "Converted", number> = {
    Sent: 0,
    Delivered: 0,
    Converted: 0,
  };
  let matched = false;
  for (const row of rows) {
    const key = String(row.stage || "")
      .toLowerCase()
      .replace(/[_-]+/g, " ")
      .trim();
    const stage = CVM_FUNNEL_ALIASES[key];
    if (!stage) continue;
    matched = true;
    totals[stage] += asFiniteNumber(row.value);
  }
  if (!matched) return rows;
  return [
    { stage: "Sent", value: totals.Sent },
    { stage: "Delivered", value: totals.Delivered },
    { stage: "Converted", value: totals.Converted },
  ];
}

function channelKey(value: unknown): string {
  return String(value || "")
    .toLowerCase()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function normalizeChannelReachPoint(
  point: CampaignReportsResponse["channelReach"][number],
): CampaignReportsResponse["channelReach"][number] {
  const sent = asFiniteNumber(point.sent ?? point.impressions);
  const delivered = asFiniteNumber(point.delivered ?? point.reach);
  const uniqueAudience = asFiniteNumber(point.uniqueAudience ?? point.reach);
  const converted = asFiniteNumber(point.converted ?? point.conversions);
  const deliveryRate = asFiniteNumber(
    point.deliveryRate,
    sent ? Number(((delivered / sent) * 100).toFixed(1)) : 0,
  );
  const conversionRate = asFiniteNumber(
    point.conversionRate,
    delivered ? Number(((converted / delivered) * 100).toFixed(1)) : 0,
  );
  return {
    ...point,
    sent,
    impressions: sent,
    delivered,
    uniqueAudience,
    reach: uniqueAudience,
    conversions: converted,
    converted,
    deliveryRate,
    conversionRate,
  };
}

export function ensureChannelReachCatalog(
  points: CampaignReportsResponse["channelReach"] = [],
): CampaignReportsResponse["channelReach"] {
  const byKey = new Map<string, CampaignReportsResponse["channelReach"][number]>();
  for (const raw of points) {
    const point = normalizeChannelReachPoint(raw);
    const key = channelKey(point.channel || point.channelCode);
    if (!key) continue;
    const current = byKey.get(key);
    if (!current) {
      byKey.set(key, { ...point });
      continue;
    }
    current.sent = asFiniteNumber(current.sent) + asFiniteNumber(point.sent);
    current.impressions = current.sent;
    current.delivered = asFiniteNumber(current.delivered) + asFiniteNumber(point.delivered);
    current.uniqueAudience =
      asFiniteNumber(current.uniqueAudience) + asFiniteNumber(point.uniqueAudience);
    current.reach = current.uniqueAudience;
    current.conversions =
      asFiniteNumber(current.conversions) + asFiniteNumber(point.conversions);
    current.converted = current.conversions;
    current.deliveryRate = current.sent
      ? Number(((asFiniteNumber(current.delivered) / current.sent) * 100).toFixed(1))
      : 0;
    current.conversionRate = asFiniteNumber(current.delivered)
      ? Number(((asFiniteNumber(current.conversions) / asFiniteNumber(current.delivered)) * 100).toFixed(1))
      : 0;
  }

  const ordered = CAMPAIGN_CHANNEL_CATALOG.map((label) => {
    const key = channelKey(label);
    const existing = byKey.get(key);
    if (existing) {
      byKey.delete(key);
      return { ...existing, channel: existing.channel || label };
    }
    return {
      channel: label,
      sent: 0,
      impressions: 0,
      delivered: 0,
      uniqueAudience: 0,
      reach: 0,
      conversions: 0,
      converted: 0,
      deliveryRate: 0,
      conversionRate: 0,
    };
  });

  return [...ordered, ...byKey.values()];
}

export function formatChartCount(value: unknown): string {
  const n = asFiniteNumber(value);
  const abs = Math.abs(n);
  if (abs >= 1_000_000) {
    return `${(n / 1_000_000).toFixed(abs >= 10_000_000 ? 0 : 1)}M`;
  }
  if (abs >= 10_000) return `${Math.round(n / 1_000)}K`;
  if (abs >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString("en-US");
}

export function uniqueReachRate(uniqueAudience: unknown, sent: unknown): string {
  const unique = asFiniteNumber(uniqueAudience);
  const total = asFiniteNumber(sent);
  if (!total) return unique > 0 ? "—" : "0%";
  const pct = (unique / total) * 100;
  if (pct <= 0) return "0%";
  if (pct < 0.1) return "<0.1%";
  if (pct < 10) return `${pct.toFixed(1)}%`;
  return `${Math.round(pct)}%`;
}

export function prepareChannelReachChartData(
  points: CampaignReportsResponse["channelReach"] = [],
  options: { ensureCatalog?: boolean } = {},
): Array<
  CampaignReportsResponse["channelReach"][number] & {
    sent: number;
    delivered: number;
    uniqueAudience: number;
    reach: number;
    impressions: number;
    uniqueRate: string;
  }
> {
  const source = options.ensureCatalog
    ? ensureChannelReachCatalog(points)
    : points.map(normalizeChannelReachPoint);
  return source.map((point) => {
    const normalized = normalizeChannelReachPoint(point);
    return {
      ...normalized,
      uniqueRate: uniqueReachRate(normalized.uniqueAudience, normalized.sent),
    };
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
