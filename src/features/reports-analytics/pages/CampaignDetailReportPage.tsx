import { useMemo, useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { extractBackendError } from "../../../shared/utils/errorHandler";
import BackButton from "../../../shared/components/ui/BackButton";
import { getSettingsTimezoneOffset } from "../../../shared/utils/settingsHelper";
import { colors } from "../../../shared/utils/tokens";
import LoadingSpinner from "../../../shared/components/ui/LoadingSpinner";
import { formatCurrency } from "../../../shared/services/currencyService";
import { formatDateWithTimezone } from "../../../shared/services/dateService";
import type {
  CampaignAttributionRow,
  CampaignBroadcastRun,
  CampaignBudgetReport,
  CampaignControlReport,
  CampaignLifecycleRow,
  CampaignReportsResponse,
  CampaignRewardRow,
  CampaignRoiReport,
} from "../types/ReportsAPI";
import {
  buildCampaignReportParams,
  settledError,
  settledValue,
} from "../utils/campaignReportQuery";
import {
  asFiniteNumber,
  normalizeCampaignPortfolio,
  normalizeCvmFunnel,
  pickNamedArray,
  unwrapCampaignSummary,
  unwrapHeroTrends,
} from "../utils/normalizeCampaignReport";
import { useReportTimeWindow } from "../hooks/useReportTimeWindow";
import { usePreviousPeriodSeries } from "../hooks/usePreviousPeriodSeries";
import { fillCampaignTrendSeries, dummyTemplateRange, toChartAudit } from "../utils/reportTimeWindow";
import {
  previousComparisonLabel as formatPreviousComparisonLabel,
  resolveComparisonSeries,
} from "../utils/reportComparison";
import ReportTrendsToolbar from "../components/ReportTrendsToolbar";
import ChannelReachContributionChart from "../components/ChannelReachContributionChart";
import ReportChartCard from "../components/ReportChartCard";
import SwitchableReportChart from "../components/SwitchableReportChart";
import CampaignKpiGrid from "../components/CampaignKpiGrid";
import CampaignChannelSections from "../components/CampaignChannelSections";
import ReportChartTypeToggle, {
  type ReportChartView,
} from "../components/ReportChartTypeToggle";
import { campaignReportsService } from "../services/campaignReportsService";
import { tw } from "../../../shared/utils/utils";
import { campaignService } from "../../campaigns/services/campaignService";
import { useToast } from "../../../contexts/ToastContext";
import type { Campaign } from "../../campaigns/types/campaign";
import {
  campaignReportDummy,
  scaleCampaignSummary,
  scaleChannelReach,
} from "../utils/campaignReportDummy";
import { cvmDeliveryFunnel, emptyCampaignSummary } from "../utils/campaignCvmMetrics";

type CampaignSummary = CampaignReportsResponse["summary"];
type ChannelReachPoint = CampaignReportsResponse["channelReach"][number];
type FunnelPoint = CampaignReportsResponse["conversionFunnel"][number];
type TrendPoint = CampaignReportsResponse["performanceTrend"][number];

type LiveCampaignDetail = {
  summary?: CampaignSummary;
  heroTrends?: CampaignReportsResponse["heroTrends"];
  channelReach?: ChannelReachPoint[];
  funnel?: FunnelPoint[];
  trends?: TrendPoint[];
  roi?: CampaignRoiReport | null;
  control?: CampaignControlReport | null;
  budget?: CampaignBudgetReport | null;
  broadcasts?: CampaignBroadcastRun[];
  rewards?: CampaignRewardRow[];
  attribution?: CampaignAttributionRow[];
  lifecycle?: CampaignLifecycleRow[];
};

function campaignMultiplier(campaignId?: string) {
  if (!campaignId) return 1;
  const idHash = campaignId.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return 0.5 + (idHash % 100) / 100;
}

export default function CampaignDetailReportPage() {
  const { id } = useParams<{ id: string }>();

  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const timeWindow = useReportTimeWindow({
    overviewPreset: "monthly",
    defaultTrendsPreset: "daily",
  });
  const {
    isTrendsView,
    queryParams,
    overviewWindow,
    activeWindow,
    scaleFactor,
    comparePreviousPeriod,
    previousPeriodLabel,
    previousQueryParams,
  } = timeWindow;
  const chartAudit = toChartAudit(activeWindow);
  const overviewAudit = toChartAudit(overviewWindow);
  const selectedRange = timeWindow.rangeKey;
  const [useDummyData, setUseDummyData] = useState(true);
  const [channelChartView, setChannelChartView] = useState<ReportChartView>("bar");
  const [liveDetail, setLiveDetail] = useState<LiveCampaignDetail | null>(null);
  const [isLoadingLiveReport, setIsLoadingLiveReport] = useState(false);
  const [liveReportError, setLiveReportError] = useState<string | null>(null);
  const { error: showError } = useToast();

  useEffect(() => {
    const fetchCampaign = async () => {
      try {
        setIsLoading(true);
        const response = (await campaignService.getCampaignById(id!, true)) as {
          data?: Campaign;
          success?: boolean;
        };
        const campaignData = response.data || (response as Campaign);
        setCampaign(campaignData);
      } catch (error) {
        console.error("Failed to load campaign:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (id) {
      fetchCampaign();
    }
  }, [id]);

  useEffect(() => {
    if (useDummyData || !id) {
      setLiveDetail(null);
      setLiveReportError(null);
      setIsLoadingLiveReport(false);
      return;
    }

    let cancelled = false;
    const params = buildCampaignReportParams({
      range: queryParams.range || selectedRange,
      grain: queryParams.grain,
      startDate: queryParams.startDate,
      endDate: queryParams.endDate,
      preset: queryParams.preset,
      campaignId: id,
    });

    const loadLiveDetail = async () => {
      setIsLoadingLiveReport(true);
      setLiveReportError(null);
      const results = await Promise.allSettled([
        campaignReportsService.getPortfolio(params),
        campaignReportsService.getCampaignSummary(id, params),
        campaignReportsService.getChannelReach(params),
        campaignReportsService.getFunnel(params),
        campaignReportsService.getCampaignTrends(id, params),
        campaignReportsService.getCampaignRoi(id, params),
        campaignReportsService.getCampaignControl(id, params),
        campaignReportsService.getCampaignBudget(id),
        campaignReportsService.getCampaignBroadcasts(id, params),
        campaignReportsService.getCampaignRewards(id, params),
        campaignReportsService.getCampaignAttribution(id, params),
        campaignReportsService.getCampaignLifecycle(id),
      ]);
      if (cancelled) return;

      const [
        portfolioResult,
        summaryResult,
        reachResult,
        funnelResult,
        trendsResult,
        roiResult,
        controlResult,
        budgetResult,
        broadcastsResult,
        rewardsResult,
        attributionResult,
        lifecycleResult,
      ] = results;

      const portfolio = normalizeCampaignPortfolio(settledValue(portfolioResult));
      const summaryPayload = settledValue(summaryResult);
      const kpi = unwrapCampaignSummary(summaryPayload?.data) || portfolio.summary;
      const trendPoints = pickNamedArray<TrendPoint>(
        settledValue(trendsResult)?.data,
        ["performanceTrend", "trends"],
      );
      const reachRows = pickNamedArray<ChannelReachPoint>(
        settledValue(reachResult)?.data,
        ["channelReach"],
      );
      const funnelRows = normalizeCvmFunnel(
        pickNamedArray<FunnelPoint>(
          settledValue(funnelResult)?.data,
          ["conversionFunnel", "funnel"],
        ),
      );
      const portfolioReach = portfolio.channelReach || [];
      const portfolioFunnel = portfolio.conversionFunnel || [];
      const reachScore = (rows: ChannelReachPoint[]) =>
        rows.reduce(
          (sum, row) =>
            sum +
            asFiniteNumber(row.sent ?? row.impressions) +
            asFiniteNumber(row.delivered ?? row.reach) +
            asFiniteNumber(row.uniqueAudience ?? row.reach),
          0,
        );
      const funnelScore = (rows: FunnelPoint[]) =>
        rows.reduce((sum, row) => sum + asFiniteNumber(row.value), 0);

      setLiveDetail({
        summary: kpi,
        heroTrends: unwrapHeroTrends(summaryPayload) || portfolio.heroTrends,
        channelReach:
          reachScore(portfolioReach) >= reachScore(reachRows) && portfolioReach.length
            ? portfolioReach
            : reachRows.length
              ? reachRows
              : portfolioReach,
        funnel:
          funnelScore(portfolioFunnel) >= funnelScore(funnelRows) && portfolioFunnel.length
            ? portfolioFunnel
            : funnelRows.length
              ? funnelRows
              : portfolioFunnel,
        trends: trendPoints.length ? trendPoints : portfolio.performanceTrend,
        roi: settledValue(roiResult)?.data ?? null,
        control: settledValue(controlResult)?.data ?? null,
        budget: settledValue(budgetResult)?.data ?? null,
        broadcasts: settledValue(broadcastsResult)?.data || [],
        rewards: settledValue(rewardsResult)?.data || [],
        attribution: settledValue(attributionResult)?.data || [],
        lifecycle: settledValue(lifecycleResult)?.data || [],
      });

      const hasWidgets = Boolean(
        kpi ||
          portfolio.channelReach?.length ||
          portfolio.conversionFunnel?.length ||
          portfolio.performanceTrend?.length,
      );
      const errors = hasWidgets
        ? []
        : ([
            settledError(portfolioResult, "Failed to load campaign portfolio."),
            settledError(summaryResult, "Failed to load campaign summary."),
            settledError(reachResult, "Failed to load channel performance."),
            settledError(funnelResult, "Failed to load delivery funnel."),
            settledError(trendsResult, "Failed to load campaign trends."),
          ].filter(Boolean) as string[]);

      if (errors.length) {
        const message = errors.join(" ");
        setLiveReportError(message);
        showError(extractBackendError(message, "Failed to load campaign report."));
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
    showError,
  ]);

  const dummyRange = dummyTemplateRange(queryParams.grain || "daily");
  const dummySnapshot = campaignReportDummy[dummyRange];
  const dummyScale = scaleFactor * campaignMultiplier(id);
  const summary = useMemo(() => {
    if (!useDummyData) {
      return liveDetail?.summary || emptyCampaignSummary();
    }
    return scaleCampaignSummary(dummySnapshot.summary, dummyScale);
  }, [dummySnapshot.summary, dummyScale, useDummyData, liveDetail]);

  const channelData = useMemo(() => {
    if (!useDummyData) {
      return liveDetail?.channelReach || [];
    }
    return scaleChannelReach(dummySnapshot.channelReach, dummyScale);
  }, [dummySnapshot.channelReach, dummyScale, useDummyData, liveDetail]);

  const funnelSeries = useMemo(
    () =>
      cvmDeliveryFunnel(summary, useDummyData ? [] : liveDetail?.funnel || []),
    [liveDetail?.funnel, summary, useDummyData],
  );

  const trendSeries = useMemo(() => {
    const window = {
      startDate: queryParams.startDate,
      endDate: queryParams.endDate,
      grain: queryParams.grain,
    };
    if (!useDummyData) {
      return fillCampaignTrendSeries(liveDetail?.trends || [], window);
    }
    return fillCampaignTrendSeries(dummySnapshot.performanceTrend, window);
  }, [
    useDummyData,
    liveDetail,
    dummySnapshot.performanceTrend,
    queryParams.startDate,
    queryParams.endDate,
    queryParams.grain,
  ]);

  const roiSeries = useMemo(
    () =>
      trendSeries.map((point) => ({
        period: point.period,
        date: point.date ?? "",
        revenue: point.revenue ?? 0,
        spend: point.spend ?? 0,
        roi: point.spend
          ? Number(((point.revenue ?? 0) / point.spend).toFixed(2))
          : 0,
      })),
    [trendSeries],
  );

  const livePreviousTrend = usePreviousPeriodSeries<TrendPoint>({
    enabled: comparePreviousPeriod && !useDummyData && Boolean(id),
    previousQueryParams: {
      ...previousQueryParams,
      campaignId: id,
    },
    fetchSeries: async (params) => {
      if (!id) return [];
      const envelope = await campaignReportsService.getCampaignTrends(
        id,
        buildCampaignReportParams({
          range: params.range || selectedRange,
          grain: params.grain,
          startDate: params.startDate,
          endDate: params.endDate,
          preset: params.preset,
          campaignId: id,
        }),
      );
      return pickNamedArray<TrendPoint>(envelope.data, ["performanceTrend", "trends"]);
    },
  });

  const trendComparison = useMemo(
    () =>
      resolveComparisonSeries({
        compare: comparePreviousPeriod,
        useDummyData,
        current: trendSeries,
        livePrevious: livePreviousTrend,
        previousQueryParams,
        align: fillCampaignTrendSeries,
      }),
    [
      comparePreviousPeriod,
      livePreviousTrend,
      previousQueryParams,
      trendSeries,
      useDummyData,
    ],
  );
  const roiComparison = useMemo(() => {
    if (!comparePreviousPeriod || !trendComparison?.length) return undefined;
    return trendComparison.map((point) => ({
      ...point,
      roi: point.spend
        ? Number((Number(point.revenue) / Number(point.spend)).toFixed(2))
        : 0,
    }));
  }, [comparePreviousPeriod, trendComparison]);
  const previousComparisonLabel = formatPreviousComparisonLabel(
    comparePreviousPeriod,
    previousPeriodLabel,
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
      {/* Header */}
      <header className="space-y-4">
        <BackButton
         
          showBreadcrumb={true}
         
          currentLabel="Report"
        />
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {campaign?.name || "Campaign Report"}
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Delivery, unique audience, and conversion performance for this campaign
          </p>
        </div>

        <ReportTrendsToolbar
          timeWindow={timeWindow}
          extraActions={
            <div
              className={`flex items-center gap-2 ${tw.rounded} border border-gray-200 bg-white px-3 py-1.5`}
            >
              <label
                htmlFor="report-data-toggle"
                className="text-sm font-medium text-gray-700 whitespace-nowrap mr-2"
              >
                Data Mode:
              </label>
              <button
                id="report-data-toggle"
                type="button"
                onClick={() => setUseDummyData(!useDummyData)}
                className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2"
                style={{
                  backgroundColor: useDummyData ? "var(--c-toggle-active)" : "#d1d5db",
                }}
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
        <CampaignKpiGrid
          summary={summary}
          channelReach={channelData}
          heroTrends={liveDetail?.heroTrends}
          useDummyData={useDummyData}
        />
      )}

      {!isTrendsView && (
      <section className="grid gap-6 lg:grid-cols-2">
        <ReportChartCard
          title="Channel Reach Distribution"
          subtitle="Sent volume, delivered customers, and unique audience by channel"
          filename="campaign-detail-channel-reach.csv"
          audit={overviewAudit}
          columns={[
            { key: "channel", label: "Channel" },
            { key: "sent", label: "Sent" },
            { key: "delivered", label: "Delivered" },
            { key: "uniqueAudience", label: "Unique Audience" },
          ]}
          rows={channelData}
          headerExtra={
            <ReportChartTypeToggle
              value={channelChartView}
              onChange={setChannelChartView}
            />
          }
        >
          <ChannelReachContributionChart
            data={channelData}
            ensureCatalog={!useDummyData}
            chartType={channelChartView}
            emptyMessage="No channel activity in this window."
          />
        </ReportChartCard>

        <SwitchableReportChart
          title="Delivery Funnel"
          subtitle="Same CVM counts as the overview cards: sent, delivered, converted"
          filename="campaign-detail-delivery-funnel.csv"
          audit={overviewAudit}
          columns={[
            { key: "stage", label: "Stage" },
            { key: "value", label: "Volume" },
          ]}
          rows={funnelSeries}
          xKey="stage"
          yLabel="Volume"
          yTickFormatter={(value) => value.toLocaleString("en-US")}
          emptyMessage="No delivery funnel in this window."
          defaultView="bar"
          series={[
            {
              dataKey: "value",
              name: "Volume",
              color: colors.reportCharts.campaignReports.deliveryFunnel.value,
            },
          ]}
        />
      </section>
      )}

      {!isTrendsView && (
        <CampaignChannelSections
          channelReach={channelData}
          ensureCatalog={!useDummyData}
        />
      )}

      {isTrendsView && (
      <section className="grid gap-6 lg:grid-cols-2">
        <SwitchableReportChart
          title="Sent, Delivered & Converted"
          subtitle="Message volume versus unique outcomes across the selected period"
          filename="campaign-detail-volume-trends.csv"
          audit={chartAudit}
          columns={[
            { key: "period", label: "Period" },
            { key: "date", label: "Date" },
            { key: "sent", label: "Sent" },
            { key: "delivered", label: "Delivered" },
            { key: "converted", label: "Converted" },
          ]}
          rows={trendSeries}
          xKey="period"
          yLabel="Volume"
          yTickFormatter={(value) => value.toLocaleString("en-US")}
          comparisonData={trendComparison}
          comparisonLabel={previousComparisonLabel}
          defaultView="line"
          series={[
            {
              dataKey: "sent",
              name: "Sent",
              color: colors.reportCharts.campaignReports.volumeTrends.sent,
            },
            {
              dataKey: "delivered",
              name: "Delivered",
              color: colors.reportCharts.campaignReports.volumeTrends.delivered,
            },
            {
              dataKey: "converted",
              name: "Converted",
              color: colors.reportCharts.campaignReports.volumeTrends.converted,
            },
          ]}
        />

        <SwitchableReportChart
          title="Delivery & Conversion Rates"
          subtitle="Delivery rate and conversion rate for the selected window"
          filename="campaign-detail-rate-trends.csv"
          audit={chartAudit}
          columns={[
            { key: "period", label: "Period" },
            { key: "date", label: "Date" },
            { key: "deliveryRate", label: "Delivery Rate %" },
            { key: "conversionRate", label: "Conversion Rate %" },
          ]}
          rows={trendSeries}
          xKey="period"
          yLabel="Rate (%)"
          valueFormatter={(value) => `${value}%`}
          comparisonData={trendComparison}
          comparisonLabel={previousComparisonLabel}
          defaultView="line"
          series={[
            {
              dataKey: "deliveryRate",
              name: "Delivery Rate %",
              color: colors.reportCharts.campaignReports.rateTrends.deliveryRate,
            },
            {
              dataKey: "conversionRate",
              name: "Conversion Rate %",
              color: colors.reportCharts.campaignReports.rateTrends.conversionRate,
            },
          ]}
        />

        <SwitchableReportChart
          title="Incremental Value vs Cost"
          subtitle="Campaign value generated against campaign cost"
          filename="campaign-detail-revenue-vs-spend.csv"
          audit={chartAudit}
          columns={[
            { key: "period", label: "Period" },
            { key: "date", label: "Date" },
            { key: "revenue", label: "Value" },
            { key: "spend", label: "Cost" },
          ]}
          rows={roiSeries}
          xKey="period"
          yLabel="Amount"
          comparisonData={roiComparison}
          comparisonLabel={previousComparisonLabel}
          defaultView="bar"
          series={[
            {
              dataKey: "revenue",
              name: "Value",
              color: colors.reportCharts.campaignReports.revenueVsSpend.revenue,
            },
            {
              dataKey: "spend",
              name: "Cost",
              color: colors.reportCharts.campaignReports.revenueVsSpend.spend,
            },
          ]}
        />

        <SwitchableReportChart
          title="ROMI"
          subtitle="Return on marketing investment for each period (value ÷ cost)"
          filename="campaign-detail-roi-trends.csv"
          audit={chartAudit}
          columns={[
            { key: "period", label: "Period" },
            { key: "date", label: "Date" },
            { key: "revenue", label: "Value" },
            { key: "spend", label: "Cost" },
            { key: "roi", label: "ROMI" },
          ]}
          rows={roiSeries}
          xKey="period"
          yLabel="ROMI"
          yTickFormatter={(value) => `${value}x`}
          valueFormatter={(value) => `${value}x`}
          comparisonData={roiComparison}
          comparisonLabel={previousComparisonLabel}
          defaultView="line"
          series={[
            {
              dataKey: "roi",
              name: "ROMI",
              color: colors.reportCharts.palette.color1,
            },
          ]}
        />
      </section>
      )}

      {!isTrendsView && !useDummyData && (
        <>
          <section className="grid gap-6 lg:grid-cols-3">
            <div className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm`}>
              <h2 className="text-xl font-semibold text-gray-900">ROMI</h2>
              <p className="mt-1 text-sm text-gray-600">Incremental value versus campaign cost</p>
              <dl className="mt-4 space-y-2 text-sm">
                <div className="flex justify-between gap-4">
                  <dt className="text-gray-600">Value generated</dt>
                  <dd className="font-semibold text-gray-900">{formatCurrency(liveDetail?.roi?.totalRevenue || 0)}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-gray-600">Incremental value</dt>
                  <dd className="font-semibold text-gray-900">{formatCurrency(liveDetail?.roi?.incrementalRevenue || 0)}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-gray-600">Campaign cost</dt>
                  <dd className="font-semibold text-gray-900">{formatCurrency(liveDetail?.roi?.campaignCost || 0)}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-gray-600">ROMI</dt>
                  <dd className="font-semibold text-gray-900">{(liveDetail?.roi?.roiPercent || 0).toFixed(1)}%</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-gray-600">Value / cost</dt>
                  <dd className="font-semibold text-gray-900">{(liveDetail?.roi?.roas || 0).toFixed(1)}x</dd>
                </div>
              </dl>
            </div>
            <div className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm`}>
              <h2 className="text-xl font-semibold text-gray-900">Control Group</h2>
              <p className="mt-1 text-sm text-gray-600">Treatment lift versus holdout</p>
              <dl className="mt-4 space-y-2 text-sm">
                <div className="flex justify-between gap-4">
                  <dt className="text-gray-600">Treatment conversions</dt>
                  <dd className="font-semibold text-gray-900">{(liveDetail?.control?.treatmentConversions || 0).toLocaleString("en-US")}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-gray-600">Control conversions</dt>
                  <dd className="font-semibold text-gray-900">{(liveDetail?.control?.controlConversions || 0).toLocaleString("en-US")}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-gray-600">Lift vs control</dt>
                  <dd className="font-semibold text-gray-900">{(liveDetail?.control?.liftVsControl || 0).toFixed(1)}%</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-gray-600">Control group size</dt>
                  <dd className="font-semibold text-gray-900">{(liveDetail?.control?.controlGroupCount || 0).toLocaleString("en-US")}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-gray-600">Significance</dt>
                  <dd className="font-semibold text-gray-900">
                    {liveDetail?.control?.isStatisticallySignificant ? "Significant" : "Not significant"}
                  </dd>
                </div>
              </dl>
            </div>
            <div className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm`}>
              <h2 className="text-xl font-semibold text-gray-900">Budget</h2>
              <p className="mt-1 text-sm text-gray-600">Allocated spend versus attainment</p>
              <dl className="mt-4 space-y-2 text-sm">
                <div className="flex justify-between gap-4">
                  <dt className="text-gray-600">Allocated</dt>
                  <dd className="font-semibold text-gray-900">{formatCurrency(Number(liveDetail?.budget?.budget_allocated || 0))}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-gray-600">Spent</dt>
                  <dd className="font-semibold text-gray-900">{formatCurrency(Number(liveDetail?.budget?.budget_spent || 0))}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-gray-600">Utilization</dt>
                  <dd className="font-semibold text-gray-900">{Number(liveDetail?.budget?.budget_utilization_pct || 0).toFixed(1)}%</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-gray-600">Actual value</dt>
                  <dd className="font-semibold text-gray-900">{formatCurrency(Number(liveDetail?.budget?.actual_revenue || 0))}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-gray-600">Revenue attainment</dt>
                  <dd className="font-semibold text-gray-900">{Number(liveDetail?.budget?.revenue_attainment_pct || 0).toFixed(1)}%</dd>
                </div>
              </dl>
            </div>
          </section>

          <section className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm`}>
            <h2 className="text-xl font-semibold text-gray-900">Broadcast Runs</h2>
            <p className="mt-1 text-sm text-gray-600">Delivery performance for each campaign send</p>
            <div className="mt-4 overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500">
                    <th className="py-2 pr-4 font-medium">Broadcast</th>
                    <th className="py-2 pr-4 font-medium">Status</th>
                    <th className="py-2 pr-4 font-medium">Sent</th>
                    <th className="py-2 pr-4 font-medium">Delivered</th>
                    <th className="py-2 pr-4 font-medium">Failed</th>
                    <th className="py-2 pr-4 font-medium">Delivery rate</th>
                    <th className="py-2 font-medium">Started</th>
                  </tr>
                </thead>
                <tbody>
                  {(liveDetail?.broadcasts || []).length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-6 text-center text-gray-500">No broadcast runs in this period.</td>
                    </tr>
                  )}
                  {(liveDetail?.broadcasts || []).map((run, index) => (
                    <tr key={String(run.run_id || run.broadcast_id || index)} className="border-t border-gray-100 text-gray-900">
                      <td className="py-2 pr-4">{run.broadcast_name || "—"}</td>
                      <td className="py-2 pr-4 capitalize">{run.status || "—"}</td>
                      <td className="py-2 pr-4">{Number(run.messages_sent || 0).toLocaleString("en-US")}</td>
                      <td className="py-2 pr-4">{Number(run.messages_delivered || 0).toLocaleString("en-US")}</td>
                      <td className="py-2 pr-4">{Number(run.messages_failed || 0).toLocaleString("en-US")}</td>
                      <td className="py-2 pr-4">{Number(run.delivery_rate || 0).toFixed(1)}%</td>
                      <td className="py-2">{run.actual_start_time ? formatDateWithTimezone(run.actual_start_time, getSettingsTimezoneOffset()) : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="grid gap-6 lg:grid-cols-2">
            <div className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm`}>
              <h2 className="text-xl font-semibold text-gray-900">Rewards</h2>
              <p className="mt-1 text-sm text-gray-600">Reward cost and volume by type</p>
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
                    {(liveDetail?.rewards || []).length === 0 && (
                      <tr>
                        <td colSpan={4} className="py-6 text-center text-gray-500">No rewards in this period.</td>
                      </tr>
                    )}
                    {(liveDetail?.rewards || []).map((row, index) => (
                      <tr key={`${row.reward_type}-${row.status}-${index}`} className="border-t border-gray-100 text-gray-900">
                        <td className="py-2 pr-4">{row.reward_type || "—"}</td>
                        <td className="py-2 pr-4 capitalize">{row.status || "—"}</td>
                        <td className="py-2 pr-4">{Number(row.count || 0).toLocaleString("en-US")}</td>
                        <td className="py-2">{formatCurrency(Number(row.total_cost || 0))}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm`}>
              <h2 className="text-xl font-semibold text-gray-900">Attribution</h2>
              <p className="mt-1 text-sm text-gray-600">Attributed conversions by channel and product</p>
              <div className="mt-4 overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="text-left text-gray-500">
                      <th className="py-2 pr-4 font-medium">Channel</th>
                      <th className="py-2 pr-4 font-medium">Product</th>
                      <th className="py-2 pr-4 font-medium">Conversions</th>
                      <th className="py-2 font-medium">Revenue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(liveDetail?.attribution || []).length === 0 && (
                      <tr>
                        <td colSpan={4} className="py-6 text-center text-gray-500">No attributed conversions in this period.</td>
                      </tr>
                    )}
                    {(liveDetail?.attribution || []).map((row, index) => (
                      <tr key={`${row.notification_channel}-${row.product_code}-${index}`} className="border-t border-gray-100 text-gray-900">
                        <td className="py-2 pr-4">{row.notification_channel || "—"}</td>
                        <td className="py-2 pr-4">{row.product_code || "—"}</td>
                        <td className="py-2 pr-4">{Number(row.conversions || 0).toLocaleString("en-US")}</td>
                        <td className="py-2">{formatCurrency(Number(row.total_revenue || 0))}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          <section className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm`}>
            <h2 className="text-xl font-semibold text-gray-900">Lifecycle</h2>
            <p className="mt-1 text-sm text-gray-600">Campaign status changes over time</p>
            <div className="mt-4 space-y-3">
              {(liveDetail?.lifecycle || []).length === 0 && (
                <p className="py-4 text-center text-sm text-gray-500">No lifecycle history yet.</p>
              )}
              {(liveDetail?.lifecycle || []).map((row, index) => (
                <div key={`${row.created_at}-${index}`} className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 pb-3 last:border-b-0">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {(row.previous_status || "—")} → {(row.new_status || "—")}
                    </p>
                    <p className="text-xs text-gray-500">{row.comments || "No comment"}</p>
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
