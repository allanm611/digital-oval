import { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useParams } from "react-router-dom";
import { Coins, DollarSign, Gift, Sparkles, TrendingUp, Users2 } from "lucide-react";
import BackButton from "../../../shared/components/ui/BackButton";
import { getSettingsTimezoneOffset } from "../../../shared/utils/settingsHelper";
import { colors } from "../../../shared/utils/tokens";
import LoadingSpinner from "../../../shared/components/ui/LoadingSpinner";
import { formatCurrency } from "../../../shared/services/currencyService";
import { formatDateWithTimezone } from "../../../shared/services/dateService";
import { extractBackendError } from "../../../shared/utils/errorHandler";
import type {
  OfferABTestRow,
  OfferEligibility,
  OfferKpiSummary,
  OfferLifecycleRow,
  OfferRedemptionRow,
  OfferReportsResponse,
  OfferRevenueReport,
  RangeOption,
} from "../types/ReportsAPI";
import {
  buildOfferReportParams,
  resolveHeroTrend,
  settledError,
  settledValue,
} from "../utils/offerReportQuery";
import {
  asFiniteNumber,
  normalizeOfferPortfolio,
  offerPortfolioHasWidgets,
  pickNamedArray,
  summaryFromLegacy,
  unwrapHeroTrends,
  unwrapOfferSummary,
  unwrapRedemptionRows,
  unwrapRevenueReport,
} from "../utils/normalizeOfferReport";
import { useReportTimeWindow } from "../hooks/useReportTimeWindow";
import { alignTrendSeries, dummyTemplateRange, dummyPreviousPeriod, toChartAudit } from "../utils/reportTimeWindow";
import ReportTrendsToolbar from "../components/ReportTrendsToolbar";
import ReportChartCard from "../components/ReportChartCard";
import ReportGroupedBarChart from "../components/ReportGroupedBarChart";
import { offerReportsService } from "../services/offerReportsService";
import { offerService } from "../../offers/services/offerService";
import { useToast } from "../../../contexts/ToastContext";
import type { Offer } from "../../offers/types/offer";
import { tw } from "../../../shared/utils/utils";

type FunnelPoint = OfferReportsResponse["redemptionFunnel"][number];
type TimelinePoint = OfferReportsResponse["redemptionTimeline"][number];
type TypePoint = OfferReportsResponse["offerTypeComparison"][number];

type LiveOfferDetail = {
  summary?: OfferKpiSummary;
  heroTrends?: OfferReportsResponse["heroTrends"];
  funnel?: FunnelPoint[];
  timeline?: TimelinePoint[];
  typeComparison?: TypePoint[];
  revenue?: OfferRevenueReport | null;
  redemption?: OfferRedemptionRow[];
  abTests?: OfferABTestRow[];
  eligibility?: OfferEligibility | null;
  lifecycle?: OfferLifecycleRow[];
};

const EMPTY_SUMMARY: OfferKpiSummary = {
  totalRedemptions: 0,
  redemptionRate: 0,
  revenueGenerated: 0,
  incrementalRevenue: 0,
  totalCost: 0,
  roi: 0,
};

const dummySummary: Record<RangeOption, OfferKpiSummary> = {
  "7d": {
    totalRedemptions: 5_450,
    redemptionRate: 3.4,
    revenueGenerated: 312_000,
    incrementalRevenue: 98_000,
    totalCost: 42_500,
    roi: 2.3,
  },
  "30d": {
    totalRedemptions: 24_200,
    redemptionRate: 3.8,
    revenueGenerated: 1_420_000,
    incrementalRevenue: 385_000,
    totalCost: 168_000,
    roi: 2.3,
  },
  "90d": {
    totalRedemptions: 72_800,
    redemptionRate: 4.2,
    revenueGenerated: 4_250_000,
    incrementalRevenue: 1_240_000,
    totalCost: 512_000,
    roi: 2.4,
  },
};

const dummyFunnel: Record<RangeOption, FunnelPoint[]> = {
  "7d": [
    { stage: "Exposed", value: 140_000 },
    { stage: "Viewed", value: 68_000 },
    { stage: "Engaged", value: 16_200 },
    { stage: "Redeemed", value: 5_450 },
  ],
  "30d": [
    { stage: "Exposed", value: 620_000 },
    { stage: "Viewed", value: 298_000 },
    { stage: "Engaged", value: 86_400 },
    { stage: "Redeemed", value: 34_200 },
  ],
  "90d": [
    { stage: "Exposed", value: 1_980_000 },
    { stage: "Viewed", value: 965_000 },
    { stage: "Engaged", value: 312_000 },
    { stage: "Redeemed", value: 142_500 },
  ],
};

const dummyTimeline: Record<RangeOption, TimelinePoint[]> = {
  "7d": [
    { period: "Mon", redemptions: 720, cumulativeRedemptions: 720 },
    { period: "Tue", redemptions: 850, cumulativeRedemptions: 1_570 },
    { period: "Wed", redemptions: 920, cumulativeRedemptions: 2_490 },
    { period: "Thu", redemptions: 780, cumulativeRedemptions: 3_270 },
    { period: "Fri", redemptions: 810, cumulativeRedemptions: 4_080 },
    { period: "Sat", redemptions: 690, cumulativeRedemptions: 4_770 },
    { period: "Sun", redemptions: 650, cumulativeRedemptions: 5_420 },
  ],
  "30d": [
    { period: "Week 1", redemptions: 3_850, cumulativeRedemptions: 3_850 },
    { period: "Week 2", redemptions: 4_920, cumulativeRedemptions: 8_770 },
    { period: "Week 3", redemptions: 5_340, cumulativeRedemptions: 14_110 },
    { period: "Week 4", redemptions: 4_540, cumulativeRedemptions: 18_650 },
  ],
  "90d": [
    { period: "September", redemptions: 16_200, cumulativeRedemptions: 16_200 },
    { period: "October", redemptions: 19_500, cumulativeRedemptions: 35_700 },
    { period: "November", redemptions: 18_500, cumulativeRedemptions: 54_200 },
  ],
};

type ChartTooltipEntry = {
  color?: string;
  name?: string;
  value?: number | string;
};

const CustomTooltip = ({
  active,
  payload,
  label,
}: {
  active?: boolean;
  label?: string;
  payload?: ChartTooltipEntry[];
}) => {
  if (!active || !payload?.length) return null;
  return (
    <div className={`${tw.rounded} border border-gray-200 bg-white p-3 shadow-lg`}>
      <p className="mb-2 text-sm font-semibold text-gray-900">{label}</p>
      {payload.map((entry, idx) => (
        <div key={idx} className="flex items-center justify-between gap-4 text-sm text-gray-600">
          <span className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full" style={{ backgroundColor: entry.color }} />
            {entry.name}
          </span>
          <span className="font-semibold text-gray-900">{entry.value}</span>
        </div>
      ))}
    </div>
  );
};

const statIcons = {
  users: Users2,
  growth: TrendingUp,
  revenue: DollarSign,
  sparkles: Sparkles,
  coins: Coins,
  gift: Gift,
};

export default function OfferDetailReportPage() {
  const { id } = useParams<{ id: string }>();
  const { error: showError } = useToast();
  const [offer, setOffer] = useState<Offer | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const timeWindow = useReportTimeWindow({
    overviewPreset: "monthly",
    defaultTrendsPreset: "daily",
  });
  const { isTrendsView, queryParams, rangeKey, scaleFactor, overviewWindow, activeWindow, comparePreviousPeriod } = timeWindow;
  const chartAudit = toChartAudit(activeWindow);
  const overviewAudit = toChartAudit(overviewWindow);
  const [useDummyData, setUseDummyData] = useState(true);
  const [liveDetail, setLiveDetail] = useState<LiveOfferDetail | null>(null);
  const [isLoadingLiveReport, setIsLoadingLiveReport] = useState(false);
  const [liveReportError, setLiveReportError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOffer = async () => {
      try {
        setIsLoading(true);
        const response = await offerService.getOfferById(Number(id), true);
        setOffer(response.data || null);
      } catch (error) {
        console.error("Failed to load offer:", error);
      } finally {
        setIsLoading(false);
      }
    };
    if (id) fetchOffer();
  }, [id]);

  useEffect(() => {
    if (useDummyData || !id) {
      setLiveDetail(null);
      setLiveReportError(null);
      setIsLoadingLiveReport(false);
      return;
    }

    let cancelled = false;
    const params = buildOfferReportParams({
      range: queryParams.range || rangeKey,
      grain: queryParams.grain,
      startDate: queryParams.startDate,
      endDate: queryParams.endDate,
      preset: queryParams.preset,
      offerId: id,
    });

    const loadLiveDetail = async () => {
      setIsLoadingLiveReport(true);
      setLiveReportError(null);
      const results = await Promise.allSettled([
        offerReportsService.getPortfolio(params),
        offerReportsService.getOfferSummary(id, params),
        offerReportsService.getFunnel(params),
        offerReportsService.getTimeline(params),
        offerReportsService.getTypeComparison(params),
        offerReportsService.getOfferRevenue(id, params),
        offerReportsService.getOfferRedemption(id, params),
        offerReportsService.getOfferABTest(id),
        offerReportsService.getOfferEligibility(id, params),
        offerReportsService.getOfferLifecycle(id),
        offerReportsService.getOfferPerformanceLegacy(id, params),
      ]);
      if (cancelled) return;

      const [
        portfolioResult,
        summaryResult,
        funnelResult,
        timelineResult,
        typeResult,
        revenueResult,
        redemptionResult,
        abTestResult,
        eligibilityResult,
        lifecycleResult,
        legacyResult,
      ] = results;

      const portfolio = normalizeOfferPortfolio(settledValue(portfolioResult));
      const summaryPayload = settledValue(summaryResult);
      const kpi =
        unwrapOfferSummary(summaryPayload?.data) ||
        portfolio.summary ||
        summaryFromLegacy(settledValue(legacyResult)?.data);
      const funnelRows = pickNamedArray<FunnelPoint>(
        settledValue(funnelResult)?.data,
        ["redemptionFunnel", "funnel"],
      );
      const timelineRows = pickNamedArray<TimelinePoint>(
        settledValue(timelineResult)?.data,
        ["redemptionTimeline", "timeline"],
      );
      const typeRows = pickNamedArray<TypePoint>(
        settledValue(typeResult)?.data,
        ["offerTypeComparison", "byType"],
      );

      setLiveDetail({
        summary: kpi,
        heroTrends: unwrapHeroTrends(summaryPayload) || portfolio.heroTrends,
        funnel: funnelRows.length ? funnelRows : portfolio.redemptionFunnel,
        timeline: timelineRows.length ? timelineRows : portfolio.redemptionTimeline,
        typeComparison: typeRows.length ? typeRows : portfolio.offerTypeComparison,
        revenue: unwrapRevenueReport(settledValue(revenueResult)),
        redemption: unwrapRedemptionRows(settledValue(redemptionResult)),
        abTests: settledValue(abTestResult)?.data || [],
        eligibility: settledValue(eligibilityResult)?.data ?? null,
        lifecycle: settledValue(lifecycleResult)?.data || [],
      });

      const hasWidgets = Boolean(
        kpi || offerPortfolioHasWidgets(portfolio) || funnelRows.length || timelineRows.length,
      );
      const errors = hasWidgets
        ? []
        : ([
            settledError(portfolioResult, "Failed to load offer portfolio."),
            settledError(summaryResult, "Failed to load offer summary."),
            settledError(funnelResult, "Failed to load redemption funnel."),
            settledError(timelineResult, "Failed to load redemption timeline."),
            settledError(legacyResult, "Failed to load legacy offer performance."),
          ].filter(Boolean) as string[]);

      if (errors.length) {
        const message = errors.join(" ");
        setLiveReportError(message);
        showError(extractBackendError(message, "Failed to load offer report."));
      }
      setIsLoadingLiveReport(false);
    };

    loadLiveDetail();
    return () => {
      cancelled = true;
    };
  }, [
    useDummyData,
    id,
    queryParams.range,
    queryParams.grain,
    queryParams.startDate,
    queryParams.endDate,
    queryParams.preset,
    rangeKey,
    showError,
  ]);

  const baseSummary = dummySummary[rangeKey];
  const summary = useMemo(() => {
    if (!useDummyData) {
      return { ...EMPTY_SUMMARY, ...liveDetail?.summary };
    }
    if (scaleFactor === 1) return baseSummary;
    return {
      ...baseSummary,
      totalRedemptions: Math.round(baseSummary.totalRedemptions * scaleFactor),
      revenueGenerated: Math.round(baseSummary.revenueGenerated * scaleFactor),
      incrementalRevenue: Math.round(baseSummary.incrementalRevenue * scaleFactor),
      totalCost: Math.round(baseSummary.totalCost * scaleFactor),
    };
  }, [baseSummary, scaleFactor, useDummyData, liveDetail]);

  const heroCards = [
    {
      label: "Total Redemptions",
      value: summary.totalRedemptions.toLocaleString("en-US"),
      subtext: `${asFiniteNumber(summary.converted || summary.totalRedemptions).toLocaleString("en-US")} conversions`,
      icon: statIcons.users,
      trend: useDummyData
        ? { value: "+12.8%", direction: "up" as const }
        : resolveHeroTrend(liveDetail?.heroTrends?.totalRedemptions),
    },
    {
      label: "Redemption Rate",
      value: `${summary.redemptionRate.toFixed(1)}%`,
      subtext: "Customers who used this offer",
      icon: statIcons.growth,
      trend: useDummyData
        ? { value: "+0.6 pts", direction: "up" as const }
        : resolveHeroTrend(liveDetail?.heroTrends?.redemptionRate),
    },
    {
      label: "Revenue Generated",
      value: formatCurrency(summary.revenueGenerated),
      subtext: "Attributed sales from this offer",
      icon: statIcons.revenue,
      trend: useDummyData
        ? { value: "+156K", direction: "up" as const }
        : resolveHeroTrend(liveDetail?.heroTrends?.revenueGenerated),
    },
    {
      label: "Incremental Revenue",
      value: formatCurrency(summary.incrementalRevenue),
      subtext: "Lift versus organic demand",
      icon: statIcons.sparkles,
      trend: useDummyData
        ? { value: "+42K", direction: "up" as const }
        : resolveHeroTrend(liveDetail?.heroTrends?.incrementalRevenue),
    },
    {
      label: "Total Cost",
      value: formatCurrency(summary.totalCost),
      subtext: "Reward and delivery cost",
      icon: statIcons.coins,
      trend: useDummyData
        ? { value: "+18K", direction: "up" as const }
        : resolveHeroTrend(liveDetail?.heroTrends?.totalCost),
    },
    {
      label: "ROI",
      value: `${summary.roi.toFixed(1)}x`,
      subtext: "Revenue per unit spent",
      icon: statIcons.gift,
      trend: useDummyData
        ? { value: "+0.2x", direction: "up" as const }
        : resolveHeroTrend(liveDetail?.heroTrends?.roi),
    },
  ];

  const funnelSeries = useMemo(() => {
    if (!useDummyData) return liveDetail?.funnel || [];
    const base = dummyFunnel[rangeKey];
    if (scaleFactor === 1) return base;
    return base.map((point) => ({ ...point, value: Math.round(point.value * scaleFactor) }));
  }, [useDummyData, liveDetail, rangeKey, scaleFactor]);

  const timelineSeries = useMemo(() => {
    const window = {
      startDate: queryParams.startDate,
      endDate: queryParams.endDate,
      grain: queryParams.grain,
    };
    if (!useDummyData) return alignTrendSeries(liveDetail?.timeline || [], window);
    return alignTrendSeries(
      dummyTimeline[dummyTemplateRange(queryParams.grain || "daily")],
      window,
    );
  }, [useDummyData, liveDetail, queryParams.startDate, queryParams.endDate, queryParams.grain]);

  const timelineComparison = useMemo(
    () =>
      comparePreviousPeriod && useDummyData
        ? dummyPreviousPeriod(timelineSeries)
        : undefined,
    [comparePreviousPeriod, timelineSeries, useDummyData],
  );

  const typeSeries = useMemo(
    () => (useDummyData ? [] : liveDetail?.typeComparison || []),
    [useDummyData, liveDetail],
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="space-y-4">
        <BackButton
          showBreadcrumb
          currentLabel="Report"
          parentTo={id ? `/dashboard/offers/${id}` : "/dashboard/reports/offers"}
        />
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {offer?.name || liveDetail?.eligibility?.name || "Offer Report"}
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Redemption, revenue, eligibility, and lifecycle for this offer
          </p>
        </div>
        <ReportTrendsToolbar
          timeWindow={timeWindow}
          extraActions={
            <div className={`flex items-center gap-2 ${tw.rounded} border border-gray-200 bg-white px-3 py-1.5`}>
              <label htmlFor="offer-detail-data-toggle" className="text-sm font-medium text-gray-700 whitespace-nowrap mr-2">
                Data Mode:
              </label>
              <button
                id="offer-detail-data-toggle"
                type="button"
                onClick={() => setUseDummyData(!useDummyData)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[#252829] focus:ring-offset-2 ${
                  useDummyData ? "bg-[#252829]" : "bg-gray-300"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    useDummyData ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
              <span className="ml-2 text-xs text-gray-600 whitespace-nowrap">
                {useDummyData ? "Dummy Data" : isLoadingLiveReport ? "Real Data (loading…)" : "Real Data"}
              </span>
            </div>
          }
        />
      </header>

      {liveReportError && !useDummyData && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {liveReportError}
        </div>
      )}

      {!isTrendsView && (
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {heroCards.map((card) => {
          const Icon = card.icon;
          const trendColor =
            card.trend.direction === "up"
              ? "text-emerald-600"
              : card.trend.direction === "down"
                ? "text-red-600"
                : "text-gray-500";
          return (
            <div key={card.label} className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm`}>
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <Icon className="h-5 w-5" style={{ color: colors.primary.accent }} />
                  <p className="text-sm font-medium text-gray-600">{card.label}</p>
                </div>
                <span className={`text-xs font-semibold ${trendColor}`}>
                  {card.trend.direction === "up" ? "↑" : card.trend.direction === "down" ? "↓" : "•"} {card.trend.value}
                </span>
              </div>
              <p className="mt-3 text-3xl font-bold text-gray-900">{card.value}</p>
              <p className="mt-1 text-sm text-gray-500">{card.subtext}</p>
            </div>
          );
        })}
      </section>
      )}

      {!isTrendsView && (
        <section className="grid gap-6 lg:grid-cols-2">
          <ReportChartCard
            title="Redemption Funnel"
            subtitle="Exposure through redemption for this offer"
            filename="offer-detail-redemption-funnel.csv"
            audit={overviewAudit}
            columns={[
              { key: "stage", label: "Stage" },
              { key: "value", label: "Users" },
            ]}
            rows={funnelSeries}
          >
            {!useDummyData && !isLoadingLiveReport && funnelSeries.length === 0 ? (
              <div className="flex h-full items-center justify-center text-sm text-gray-500">
                No redemption stages in this window.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={funnelSeries} margin={{ top: 20, right: 24, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="stage" tick={{ fill: "#6b7280" }} />
                  <YAxis tick={{ fill: "#6b7280" }} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: "transparent" }} />
                  <Bar
                    dataKey="value"
                    name="Users"
                    fill={colors.reportCharts.offerReports.redemptionFunnel.value}
                    maxBarSize={60}
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </ReportChartCard>
          <div className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm`}>
            <h2 className="text-xl font-semibold text-gray-900">Eligibility</h2>
            <p className="mt-1 text-sm text-gray-600">Offer rules and lifetime redemption</p>
            <dl className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-gray-600">Code</dt>
                <dd className="font-semibold text-gray-900">{liveDetail?.eligibility?.code || offer?.code || "—"}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-gray-600">Type</dt>
                <dd className="font-semibold text-gray-900">{liveDetail?.eligibility?.offerType || offer?.offer_type || "—"}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-gray-600">Reusable</dt>
                <dd className="font-semibold text-gray-900">
                  {(liveDetail?.eligibility?.isReusable ?? offer?.is_reusable) ? "Yes" : "No"}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-gray-600">Max usage / customer</dt>
                <dd className="font-semibold text-gray-900">
                  {liveDetail?.eligibility?.maxUsagePerCustomer ?? offer?.max_usage_per_customer ?? "—"}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-gray-600">Unique redeemers</dt>
                <dd className="font-semibold text-gray-900">
                  {Number(liveDetail?.eligibility?.uniqueRedeemers || 0).toLocaleString("en-US")}
                </dd>
              </div>
            </dl>
          </div>
        </section>
      )}

      {!isTrendsView && typeSeries.length > 0 && (
        <ReportChartCard
          title="Offer Type Context"
          subtitle="How this offer’s type compares on redemption and AOV"
          filename="offer-detail-type-context.csv"
          audit={overviewAudit}
          chartClassName="h-72"
          columns={[
            { key: "type", label: "Type" },
            { key: "redemptionRate", label: "Redemption Rate %" },
            { key: "aov", label: "Avg Transaction Value" },
          ]}
          rows={typeSeries}
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={typeSeries} margin={{ top: 20, right: 24, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="type" tick={{ fill: "#6b7280" }} />
              <YAxis tick={{ fill: "#6b7280" }} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: "transparent" }} />
              <Legend iconType="circle" wrapperStyle={{ paddingTop: 12 }} />
              <Bar
                dataKey="redemptionRate"
                name="Redemption Rate %"
                fill={colors.reportCharts.offerReports.offerTypeComparison.redemptionRate}
                maxBarSize={40}
                radius={[4, 4, 0, 0]}
              />
              <Bar
                dataKey="aov"
                name="Avg Transaction Value"
                fill={colors.reportCharts.offerReports.offerTypeComparison.avgTransactionValue}
                maxBarSize={40}
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </ReportChartCard>
      )}

      {isTrendsView && (
        <section>
          <ReportChartCard
            title="Redemption Timeline"
            subtitle="Redemption volume over the selected period"
            filename="offer-detail-redemption-timeline.csv"
            audit={chartAudit}
            columns={[
              { key: "period", label: "Period" },
              { key: "date", label: "Date" },
              { key: "redemptions", label: "Redemptions" },
              { key: "cumulativeRedemptions", label: "Cumulative" },
            ]}
            rows={timelineSeries}
          >
            <ReportGroupedBarChart
              data={timelineSeries}
              xKey="period"
              yLabel="Redemptions"
              yTickFormatter={(value) => value.toLocaleString("en-US")}
              emptyMessage="No redemption activity in this window."
              comparisonData={timelineComparison}
              series={[
                {
                  dataKey: "redemptions",
                  name: "Redemptions",
                  color: colors.reportCharts.offerReports.redemptionTimeline.redemptions,
                },
                {
                  dataKey: "cumulativeRedemptions",
                  name: "Cumulative",
                  color: colors.reportCharts.offerReports.redemptionTimeline.cumulative,
                },
              ]}
            />
          </ReportChartCard>
        </section>
      )}

      {!isTrendsView && !useDummyData && (
        <>
          <section className="grid gap-6 lg:grid-cols-2">
            <div className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm`}>
              <h2 className="text-xl font-semibold text-gray-900">Revenue</h2>
              <p className="mt-1 text-sm text-gray-600">Efficiency versus reward and delivery cost</p>
              <dl className="mt-4 space-y-2 text-sm">
                <div className="flex justify-between gap-4">
                  <dt className="text-gray-600">Total revenue</dt>
                  <dd className="font-semibold text-gray-900">{formatCurrency(liveDetail?.revenue?.totalRevenue || 0)}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-gray-600">Incremental revenue</dt>
                  <dd className="font-semibold text-gray-900">{formatCurrency(liveDetail?.revenue?.incrementalRevenue || 0)}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-gray-600">Reward cost</dt>
                  <dd className="font-semibold text-gray-900">{formatCurrency(liveDetail?.revenue?.totalRewardCost || 0)}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-gray-600">Delivery cost</dt>
                  <dd className="font-semibold text-gray-900">{formatCurrency(liveDetail?.revenue?.deliveryCost || 0)}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-gray-600">ROI</dt>
                  <dd className="font-semibold text-gray-900">{(liveDetail?.revenue?.roi || 0).toFixed(1)}x</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-gray-600">Revenue / converter</dt>
                  <dd className="font-semibold text-gray-900">{formatCurrency(liveDetail?.revenue?.revenuePerConverter || 0)}</dd>
                </div>
              </dl>
            </div>
            <div className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm`}>
              <h2 className="text-xl font-semibold text-gray-900">Redemptions</h2>
              <p className="mt-1 text-sm text-gray-600">Reward volume and cost by status</p>
              <div className="mt-4 overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="text-left text-gray-500">
                      <th className="py-2 pr-4 font-medium">Type</th>
                      <th className="py-2 pr-4 font-medium">Status</th>
                      <th className="py-2 pr-4 font-medium">Count</th>
                      <th className="py-2 font-medium">Cost</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(liveDetail?.redemption || []).length === 0 && (
                      <tr>
                        <td colSpan={4} className="py-6 text-center text-gray-500">No redemptions in this period.</td>
                      </tr>
                    )}
                    {(liveDetail?.redemption || []).map((row, index) => (
                      <tr key={`${row.rewardType}-${row.status}-${index}`} className="border-t border-gray-100 text-gray-900">
                        <td className="py-2 pr-4">{row.rewardType || "—"}</td>
                        <td className="py-2 pr-4 capitalize">{row.status || "—"}</td>
                        <td className="py-2 pr-4">{Number(row.count || 0).toLocaleString("en-US")}</td>
                        <td className="py-2">{formatCurrency(Number(row.totalCost || 0))}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          <section className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm`}>
            <h2 className="text-xl font-semibold text-gray-900">A/B Tests</h2>
            <p className="mt-1 text-sm text-gray-600">Variant traffic and measured outcomes</p>
            <div className="mt-4 overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500">
                    <th className="py-2 pr-4 font-medium">Test</th>
                    <th className="py-2 pr-4 font-medium">Variant</th>
                    <th className="py-2 pr-4 font-medium">Traffic</th>
                    <th className="py-2 pr-4 font-medium">Metric</th>
                    <th className="py-2 font-medium">Value</th>
                  </tr>
                </thead>
                <tbody>
                  {(liveDetail?.abTests || []).length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-gray-500">No A/B tests for this offer.</td>
                    </tr>
                  )}
                  {(liveDetail?.abTests || []).map((row, index) => (
                    <tr key={`${row.test_id}-${row.variant_id}-${index}`} className="border-t border-gray-100 text-gray-900">
                      <td className="py-2 pr-4">{row.test_name || "—"}</td>
                      <td className="py-2 pr-4">{row.variant_name || "—"}</td>
                      <td className="py-2 pr-4">{Number(row.traffic_percentage || 0).toFixed(1)}%</td>
                      <td className="py-2 pr-4">{row.metric_name || "—"}</td>
                      <td className="py-2">{Number(row.metric_value || 0).toLocaleString("en-US")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm`}>
            <h2 className="text-xl font-semibold text-gray-900">Lifecycle</h2>
            <p className="mt-1 text-sm text-gray-600">Offer status changes over time</p>
            <div className="mt-4 space-y-3">
              {(liveDetail?.lifecycle || []).length === 0 && (
                <p className="py-4 text-center text-sm text-gray-500">No lifecycle history yet.</p>
              )}
              {(liveDetail?.lifecycle || []).map((row, index) => (
                <div
                  key={`${row.created_at}-${index}`}
                  className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 pb-3 last:border-b-0"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {(row.previous_status || "—")} → {(row.new_status || "—")}
                    </p>
                    <p className="text-xs text-gray-500">{row.comments || row.changed_by || "No comment"}</p>
                  </div>
                  <p className="text-xs text-gray-500">
                    {row.created_at ? formatDateWithTimezone(row.created_at, getSettingsTimezoneOffset()) : "—"}
                  </p>
                </div>
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
