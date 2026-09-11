import { useMemo, useState, useEffect } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useParams, useLocation } from "react-router-dom";
import { useLanguage } from "../../../contexts/LanguageContext";
import { extractBackendError } from "../../../shared/utils/errorHandler";
import {
  Activity,
  ArrowUpRight,
  MousePointerClick,
  Users2,
} from "lucide-react";
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
  RangeOption,
} from "../types/ReportsAPI";
import {
  buildCampaignReportParams,
  formatTrendLabel,
  settledError,
  settledValue,
} from "../utils/campaignReportQuery";
import { useReportTimeWindow } from "../hooks/useReportTimeWindow";
import ReportTrendsToolbar from "../components/ReportTrendsToolbar";
import { campaignReportsService } from "../services/campaignReportsService";
import { tw } from "../../../shared/utils/utils";
import { campaignService } from "../../campaigns/services/campaignService";
import { useToast } from "../../../contexts/ToastContext";
import type { Campaign } from "../../campaigns/types/campaign";
import CsvDownloadButton from "../../../shared/components/CsvDownloadButton";

type CampaignSummary = {
  reach: number;
  impressions: number;
  opens: number;
  clicks: number;
  clickRate: number;
  engagementRate: number;
  conversions: number;
  conversionRate: number;
  revenue: number;
  roas: number;
  cac: number;
  campaignCost?: number;
};

type ChannelReachPoint = {
  channel: string;
  reach: number;
  impressions: number;
};

type FunnelPoint = {
  stage: string;
  value: number;
};

type TrendPoint = {
  period: string;
  date?: string;
  ctr: number;
  engagement: number;
  revenue?: number;
  spend?: number;
};

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

const rangeDays: Record<RangeOption, number> = {
  "7d": 7,
  "30d": 30,
  "90d": 90,
};

const getDaysBetween = (start: string, end: string) => {
  const startDate = start ? new Date(start) : null;
  const endDate = end ? new Date(end) : null;
  if (
    !startDate ||
    !endDate ||
    Number.isNaN(startDate.getTime()) ||
    Number.isNaN(endDate.getTime())
  ) {
    return null;
  }
  const diff = Math.abs(endDate.getTime() - startDate.getTime());
  return Math.max(1, Math.ceil(diff / (1000 * 60 * 60 * 24)));
};

const mapDaysToRange = (days: number | null): RangeOption => {
  if (days === null) return "7d";
  if (days <= 7) return "7d";
  if (days <= 30) return "30d";
  return "90d";
};

const getScaleFactor = (
  customDays: number | null,
  baseRange: RangeOption,
): number => {
  if (!customDays) return 1;
  const baseDays = rangeDays[baseRange];
  return customDays / baseDays;
};

// Dummy data for single campaign report
const campaignSummaryData: Record<RangeOption, CampaignSummary> = {
  "7d": {
    reach: 132_400,
    impressions: 280_000,
    opens: 56_000,
    clicks: 42_000,
    clickRate: 8.4,
    engagementRate: 12.1,
    conversions: 9_300,
    conversionRate: 6.4,
    revenue: 415_000,
    roas: 4.6,
    cac: 18.4,
  },
  "30d": {
    reach: 497_000,
    impressions: 1_180_000,
    opens: 210_000,
    clicks: 148_000,
    clickRate: 9.2,
    engagementRate: 13.3,
    conversions: 34_400,
    conversionRate: 7.1,
    revenue: 1_620_000,
    roas: 4.9,
    cac: 17.2,
  },
  "90d": {
    reach: 1_420_000,
    impressions: 3_420_000,
    opens: 620_000,
    clicks: 438_000,
    clickRate: 9.8,
    engagementRate: 14.2,
    conversions: 102_000,
    conversionRate: 7.6,
    revenue: 4_950_000,
    roas: 5.1,
    cac: 16.5,
  },
};

const channelReachData: Record<RangeOption, ChannelReachPoint[]> = {
  "7d": [
    { channel: "Email", reach: 52_000, impressions: 110_000 },
    { channel: "SMS", reach: 38_000, impressions: 60_000 },
    { channel: "Push", reach: 28_000, impressions: 55_000 },
    { channel: "Social", reach: 14_400, impressions: 55_000 },
  ],
  "30d": [
    { channel: "Email", reach: 185_000, impressions: 420_000 },
    { channel: "SMS", reach: 140_000, impressions: 210_000 },
    { channel: "Push", reach: 110_000, impressions: 190_000 },
    { channel: "Social", reach: 62_000, impressions: 160_000 },
  ],
  "90d": [
    { channel: "Email", reach: 520_000, impressions: 1_200_000 },
    { channel: "SMS", reach: 380_000, impressions: 560_000 },
    { channel: "Push", reach: 320_000, impressions: 540_000 },
    { channel: "Social", reach: 200_000, impressions: 500_000 },
  ],
};

const funnelData: Record<RangeOption, FunnelPoint[]> = {
  "7d": [
    { stage: "Sent", value: 145_000 },
    { stage: "Delivered", value: 133_500 },
    { stage: "Opens", value: 56_000 },
    { stage: "Clicks", value: 42_000 },
    { stage: "Conversions", value: 9_300 },
  ],
  "30d": [
    { stage: "Sent", value: 540_000 },
    { stage: "Delivered", value: 497_000 },
    { stage: "Opens", value: 210_000 },
    { stage: "Clicks", value: 148_000 },
    { stage: "Conversions", value: 34_400 },
  ],
  "90d": [
    { stage: "Sent", value: 1_580_000 },
    { stage: "Delivered", value: 1_420_000 },
    { stage: "Opens", value: 620_000 },
    { stage: "Clicks", value: 438_000 },
    { stage: "Conversions", value: 102_000 },
  ],
};

const trendData: Record<RangeOption, TrendPoint[]> = {
  "7d": [
    { period: "Mon", ctr: 8.1, engagement: 11.6, revenue: 52, spend: 11 },
    { period: "Tue", ctr: 8.6, engagement: 12.3, revenue: 58, spend: 12 },
    { period: "Wed", ctr: 8.9, engagement: 12.8, revenue: 62, spend: 12.4 },
    { period: "Thu", ctr: 8.4, engagement: 12.1, revenue: 55, spend: 11.5 },
    { period: "Fri", ctr: 8.7, engagement: 12.4, revenue: 60, spend: 11.8 },
    { period: "Sat", ctr: 7.8, engagement: 10.9, revenue: 48, spend: 10.7 },
    { period: "Sun", ctr: 7.4, engagement: 10.2, revenue: 40, spend: 10 },
  ],
  "30d": [
    { period: "Week 1", ctr: 8.5, engagement: 12.1, revenue: 410, spend: 92 },
    { period: "Week 2", ctr: 8.8, engagement: 12.6, revenue: 430, spend: 88 },
    { period: "Week 3", ctr: 9.3, engagement: 13.2, revenue: 450, spend: 87 },
    { period: "Week 4", ctr: 9.1, engagement: 13.4, revenue: 455, spend: 85 },
  ],
  "90d": [
    {
      period: "September",
      ctr: 9.0,
      engagement: 13.2,
      revenue: 1_520,
      spend: 320,
    },
    {
      period: "October",
      ctr: 9.5,
      engagement: 14.1,
      revenue: 1_640,
      spend: 325,
    },
    {
      period: "November",
      ctr: 10.1,
      engagement: 15.1,
      revenue: 1_790,
      spend: 330,
    },
  ],
};

type ChartTooltipEntry = {
  color?: string;
  name?: string;
  value?: number | string;
};

type ChartTooltipProps = {
  active?: boolean;
  label?: string;
  payload?: ChartTooltipEntry[];
};

const CustomTooltip = ({ active, payload, label }: ChartTooltipProps) => {
  if (!active || !payload?.length) {
    return null;
  }

  return (
    <div
      className={`${tw.rounded} border border-gray-200 bg-white p-3 shadow-lg`}
    >
      <p className="mb-2 text-sm font-semibold text-gray-900">{label}</p>
      {payload.map((entry, idx) => (
        <div
          key={idx}
          className="flex items-center justify-between gap-4 text-sm text-gray-600"
        >
          <span className="flex items-center gap-2">
            <span
              className="h-3 w-3 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            {entry.name}
          </span>
          <span className="font-semibold text-gray-900">{entry.value}</span>
        </div>
      ))}
    </div>
  );
};

const statIcons = {
  audience: Users2,
  engagement: MousePointerClick,
  outcome: Activity,
  growth: ArrowUpRight,
};

// Generate campaign-specific dummy data based on campaign ID
const generateCampaignDummyData = (campaignId: string | undefined) => {
  if (!campaignId) return campaignSummaryData;

  // Use campaign ID to generate a consistent variation
  const idHash = campaignId.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const multiplier = 0.5 + (idHash % 100) / 100; // Range: 0.5 to 1.49

  return {
    "7d": {
      reach: Math.round(132_400 * multiplier),
      impressions: Math.round(280_000 * multiplier),
      opens: Math.round(56_000 * multiplier),
      clicks: Math.round(42_000 * multiplier),
      clickRate: 8.4 + (idHash % 30) / 10 - 1.5,
      engagementRate: 12.1 + (idHash % 40) / 10 - 2,
      conversions: Math.round(9_300 * multiplier),
      conversionRate: 6.4 + (idHash % 20) / 10 - 1,
      revenue: Math.round(415_000 * multiplier),
      roas: 4.6 + (idHash % 30) / 10 - 1.5,
      cac: 18.4 + (idHash % 25) / 2 - 6.25,
    },
    "30d": {
      reach: Math.round(497_000 * multiplier),
      impressions: Math.round(1_180_000 * multiplier),
      opens: Math.round(210_000 * multiplier),
      clicks: Math.round(148_000 * multiplier),
      clickRate: 9.2 + (idHash % 30) / 10 - 1.5,
      engagementRate: 13.3 + (idHash % 40) / 10 - 2,
      conversions: Math.round(34_400 * multiplier),
      conversionRate: 7.1 + (idHash % 20) / 10 - 1,
      revenue: Math.round(1_620_000 * multiplier),
      roas: 4.9 + (idHash % 30) / 10 - 1.5,
      cac: 17.2 + (idHash % 25) / 2 - 6.25,
    },
    "90d": {
      reach: Math.round(1_420_000 * multiplier),
      impressions: Math.round(3_420_000 * multiplier),
      opens: Math.round(620_000 * multiplier),
      clicks: Math.round(438_000 * multiplier),
      clickRate: 9.8 + (idHash % 30) / 10 - 1.5,
      engagementRate: 14.2 + (idHash % 40) / 10 - 2,
      conversions: Math.round(102_000 * multiplier),
      conversionRate: 7.6 + (idHash % 20) / 10 - 1,
      revenue: Math.round(4_950_000 * multiplier),
      roas: 5.1 + (idHash % 30) / 10 - 1.5,
      cac: 16.5 + (idHash % 25) / 2 - 6.25,
    },
  };
};

export default function CampaignDetailReportPage() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const { t } = useLanguage();

  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const timeWindow = useReportTimeWindow({
    overviewPreset: "weekly",
    defaultTrendsPreset: "daily",
  });
  const { isTrendsView, queryParams } = timeWindow;
  const selectedRange = timeWindow.rangeKey;
  const appliedCustomRange = timeWindow.activeWindow.bounds;
  const [useDummyData, setUseDummyData] = useState(true);
  const [liveDetail, setLiveDetail] = useState<LiveCampaignDetail | null>(null);
  const [isLoadingLiveReport, setIsLoadingLiveReport] = useState(false);
  const [liveReportError, setLiveReportError] = useState<string | null>(null);
  const { error: showError } = useToast();

  // Determine fallback path - prefer campaign details, fall back to campaigns list
  const fallbackPath = `/dashboard/campaigns${id ? `/${id}` : ""}`;

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

  const customDays = getDaysBetween(
    appliedCustomRange.start,
    appliedCustomRange.end,
  );
  const activeRangeKey: RangeOption =
    appliedCustomRange.start && appliedCustomRange.end
      ? mapDaysToRange(customDays)
      : selectedRange;

  const scaleFactor = useMemo(() => {
    if (appliedCustomRange.start && appliedCustomRange.end && customDays) {
      return getScaleFactor(customDays, activeRangeKey);
    }
    return 1;
  }, [
    appliedCustomRange.start,
    appliedCustomRange.end,
    customDays,
    activeRangeKey,
  ]);

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
      campaignId: id,
    });

    const loadLiveDetail = async () => {
      setIsLoadingLiveReport(true);
      setLiveReportError(null);
      const results = await Promise.allSettled([
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

      const summaryPayload = settledValue(summaryResult);
      const trendPoints = settledValue(trendsResult)?.data || [];
      const kpi = summaryPayload?.data;

      setLiveDetail({
        summary: kpi
          ? {
              reach: kpi.reach || kpi.delivered || 0,
              impressions: kpi.impressions || kpi.reach || 0,
              opens: kpi.opens || kpi.opened || 0,
              clicks: kpi.clicks || kpi.clicked || 0,
              clickRate: kpi.clickRate || 0,
              engagementRate: kpi.engagementRate || kpi.openRate || 0,
              conversions: kpi.conversions || kpi.converted || 0,
              conversionRate: kpi.conversionRate || 0,
              revenue: kpi.revenue || 0,
              roas: kpi.roas || 0,
              cac: kpi.cac || 0,
              campaignCost: kpi.campaignCost || 0,
            }
          : undefined,
        heroTrends: summaryPayload?.trends,
        channelReach: settledValue(reachResult)?.data,
        funnel: settledValue(funnelResult)?.data,
        trends: trendPoints,
        roi: settledValue(roiResult)?.data ?? null,
        control: settledValue(controlResult)?.data ?? null,
        budget: settledValue(budgetResult)?.data ?? null,
        broadcasts: settledValue(broadcastsResult)?.data || [],
        rewards: settledValue(rewardsResult)?.data || [],
        attribution: settledValue(attributionResult)?.data || [],
        lifecycle: settledValue(lifecycleResult)?.data || [],
      });

      const errors = [
        settledError(summaryResult, "Failed to load campaign summary."),
        settledError(reachResult, "Failed to load channel performance."),
        settledError(funnelResult, "Failed to load engagement funnel."),
        settledError(trendsResult, "Failed to load campaign trends."),
      ].filter(Boolean) as string[];

      if (errors.length) {
        const message = errors.join(" ");
        setLiveReportError(message);
        if (errors.length === 4) {
          showError(extractBackendError(message, "Failed to load campaign report."));
        }
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

  const campaignData = useMemo(() => generateCampaignDummyData(id), [id]);
  const baseSummary = campaignData[activeRangeKey];
  const summary = useMemo(() => {
    if (!useDummyData) {
      return liveDetail?.summary || {
        reach: 0,
        impressions: 0,
        opens: 0,
        clicks: 0,
        clickRate: 0,
        engagementRate: 0,
        conversions: 0,
        conversionRate: 0,
        revenue: 0,
        roas: 0,
        cac: 0,
        campaignCost: 0,
      };
    }
    if (scaleFactor === 1) return baseSummary;
    return {
      ...baseSummary,
      reach: Math.round(baseSummary.reach * scaleFactor),
      impressions: Math.round(baseSummary.impressions * scaleFactor),
      opens: Math.round(baseSummary.opens * scaleFactor),
      clicks: Math.round(baseSummary.clicks * scaleFactor),
      conversions: Math.round(baseSummary.conversions * scaleFactor),
      revenue: Math.round(baseSummary.revenue * scaleFactor),
      clickRate: baseSummary.clickRate,
      engagementRate: baseSummary.engagementRate,
      conversionRate: baseSummary.conversionRate,
      roas: baseSummary.roas,
      cac: baseSummary.cac,
    };
  }, [baseSummary, scaleFactor, useDummyData, liveDetail]);

  const heroCards = [
    {
      label: "Reach",
      value: summary.reach.toLocaleString("en-US"),
      subtext: `${summary.impressions.toLocaleString("en-US")} impressions`,
      icon: statIcons.audience,
      trend: useDummyData
        ? { value: "+8.4%", direction: "up" as const }
        : {
            value: formatTrendLabel(liveDetail?.heroTrends?.reach?.label),
            direction: liveDetail?.heroTrends?.reach?.direction || "up",
          },
    },
    {
      label: "Engagement Rate",
      value: `${summary.engagementRate.toFixed(1)}%`,
      subtext: `${summary.opens.toLocaleString("en-US")} opens`,
      icon: statIcons.engagement,
      trend: useDummyData
        ? { value: "+2.1 pts", direction: "up" as const }
        : {
            value: formatTrendLabel(liveDetail?.heroTrends?.engagementRate?.label),
            direction: liveDetail?.heroTrends?.engagementRate?.direction || "up",
          },
    },
    {
      label: "Click-Through Rate",
      value: `${summary.clickRate.toFixed(1)}%`,
      subtext: `${summary.clicks.toLocaleString("en-US")} clicks`,
      icon: statIcons.outcome,
      trend: useDummyData
        ? { value: "+0.6 pts", direction: "up" as const }
        : {
            value: formatTrendLabel(liveDetail?.heroTrends?.engagementRate?.label),
            direction: liveDetail?.heroTrends?.engagementRate?.direction || "up",
          },
    },
    {
      label: "Conversion Rate",
      value: `${summary.conversionRate.toFixed(1)}%`,
      subtext: `${summary.conversions.toLocaleString("en-US")} conversions`,
      icon: statIcons.outcome,
      trend: useDummyData
        ? { value: "-0.4 pts", direction: "down" as const }
        : {
            value: formatTrendLabel(liveDetail?.heroTrends?.conversionRate?.label),
            direction: liveDetail?.heroTrends?.conversionRate?.direction || "down",
          },
    },
    {
      label: "Revenue Generated",
      value: formatCurrency(summary.revenue),
      subtext: `ROAS ${summary.roas.toFixed(1)}x`,
      icon: statIcons.growth,
      trend: useDummyData
        ? { value: "+84K", direction: "up" as const }
        : {
            value: formatTrendLabel(liveDetail?.heroTrends?.revenue?.label),
            direction: liveDetail?.heroTrends?.revenue?.direction || "up",
          },
    },
    {
      label: "Customer Acquisition Cost",
      value: formatCurrency(summary.cac),
      subtext: "Average per acquisition",
      icon: statIcons.outcome,
      trend: useDummyData
        ? { value: "-2.3%", direction: "down" as const }
        : {
            value: formatTrendLabel(liveDetail?.heroTrends?.campaignCost?.label),
            direction: liveDetail?.heroTrends?.campaignCost?.direction || "down",
          },
    },
  ];

  const channelData = useMemo(() => {
    if (!useDummyData) {
      if (liveDetail?.channelReach?.length) return liveDetail.channelReach;
      return channelReachData[activeRangeKey].map((point) => ({
        ...point,
        reach: 0,
        impressions: 0,
      }));
    }
    const base = channelReachData[activeRangeKey];
    if (scaleFactor === 1) return base;
    return base.map((point) => ({
      ...point,
      reach: Math.round(point.reach * scaleFactor),
      impressions: Math.round(point.impressions * scaleFactor),
    }));
  }, [activeRangeKey, scaleFactor, useDummyData, liveDetail]);

  const funnelSeries = useMemo(() => {
    if (!useDummyData) {
      if (liveDetail?.funnel?.length) return liveDetail.funnel;
      return funnelData[activeRangeKey].map((point) => ({
        ...point,
        value: 0,
      }));
    }
    const base = funnelData[activeRangeKey];
    if (scaleFactor === 1) return base;
    return base.map((point) => ({
      ...point,
      value: Math.round(point.value * scaleFactor),
    }));
  }, [activeRangeKey, scaleFactor, useDummyData, liveDetail]);

  const trendSeries = useMemo(() => {
    if (!useDummyData) {
      if (liveDetail?.trends?.length) return liveDetail.trends;
      return trendData[activeRangeKey].map((point) => ({
        ...point,
        ctr: 0,
        engagement: 0,
        revenue: 0,
        spend: 0,
      }));
    }
    const base = trendData[activeRangeKey];
    if (scaleFactor === 1) return base;
    return base.map((point) => ({
      ...point,
      revenue: point.revenue ? Math.round(point.revenue * scaleFactor) : undefined,
      spend: point.spend ? Math.round(point.spend * scaleFactor) : undefined,
    }));
  }, [activeRangeKey, scaleFactor, useDummyData, liveDetail]);

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
            Performance metrics and engagement analysis
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

      {/* KPI Cards */}
      <section>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {heroCards.map((card) => {
            const trendColor =
              card.trend.direction === "up"
                ? "text-emerald-600"
                : card.trend.direction === "down"
                  ? "text-red-600"
                  : "text-gray-500";
            return (
              <div
                key={card.label}
                className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm`}
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <card.icon
                      className="h-5 w-5"
                      style={{ color: colors.primary.accent }}
                    />
                    <p className="text-sm font-medium text-gray-600">
                      {card.label}
                    </p>
                  </div>
                  <span className={`text-xs font-semibold ${trendColor}`}>
                    {card.trend.direction === "up"
                      ? "↑"
                      : card.trend.direction === "down"
                        ? "↓"
                        : "•"}{" "}
                    {card.trend.value}
                  </span>
                </div>
                <p className="mt-3 text-3xl font-bold text-gray-900">
                  {card.value}
                </p>
                <p className="mt-1 text-sm text-gray-500">{card.subtext}</p>
              </div>
            );
          })}
        </div>
      </section>

      {!isTrendsView && (
      <section className="grid gap-6 lg:grid-cols-2">
        {/* Channel Reach */}
        <div
          className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm`}
        >
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Channel Performance
            </h2>
            <p className="mt-1 text-sm text-gray-600">
              Reach and impressions by communication channel
            </p>
          </div>
          <div className="mt-6 h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={channelData} barCategoryGap="20%" barGap={8}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="channel" tick={{ fill: "#6b7280" }} />
                <YAxis tick={{ fill: "#6b7280" }} />
                <Tooltip
                  content={<CustomTooltip />}
                  cursor={{ fill: "transparent" }}
                />
                <Legend iconType="circle" wrapperStyle={{ paddingTop: 12 }} />
                <Bar
                  dataKey="reach"
                  name="Reach"
                  fill={colors.reportCharts.campaignReports.channelReach.reach}
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="impressions"
                  name="Impressions"
                  fill={
                    colors.reportCharts.campaignReports.channelReach.impressions
                  }
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Funnel */}
        <div
          className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm`}
        >
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Engagement Funnel
            </h2>
            <p className="mt-1 text-sm text-gray-600">
              Track audience journey from send to conversion
            </p>
          </div>
          <div className="mt-6 h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={funnelSeries}
                margin={{ top: 20, right: 24, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="stage" tick={{ fill: "#6b7280" }} />
                <YAxis tick={{ fill: "#6b7280" }} />
                <Tooltip
                  content={<CustomTooltip />}
                  cursor={{ fill: "transparent" }}
                />
                <Bar
                  dataKey="value"
                  name="Volume"
                  fill={
                    colors.reportCharts.campaignReports.engagementStages.value
                  }
                  maxBarSize={60}
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>
      )}

      {isTrendsView && (
      <section className="grid gap-6 lg:grid-cols-2">
        {/* CTR & Engagement Trends */}
        <div
          className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm`}
        >
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              CTR & Engagement Trends
            </h2>
            <p className="mt-1 text-sm text-gray-600">
              Monitor interaction quality across the selected period
            </p>
          </div>
          <div className="mt-6 h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendSeries}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="period" tick={{ fill: "#6b7280" }} />
                <YAxis
                  yAxisId="left"
                  orientation="left"
                  tick={{ fill: "#6b7280" }}
                  domain={[0, (max: number) => Math.max(20, Math.ceil(max / 5) * 5 || 20)]}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend iconType="circle" wrapperStyle={{ paddingTop: 12 }} />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="ctr"
                  name="CTR %"
                  stroke={
                    colors.reportCharts.campaignReports.ctrEngagementTrends.ctr
                  }
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="engagement"
                  name="Engagement %"
                  stroke={
                    colors.reportCharts.campaignReports.ctrEngagementTrends
                      .engagement
                  }
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Revenue Trends */}
        <div
          className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm`}
        >
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Revenue vs Spend
            </h2>
            <p className="mt-1 text-sm text-gray-600">
              Generated revenue against campaign spend
            </p>
          </div>
          <div className="mt-6 h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendSeries}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="period" tick={{ fill: "#6b7280" }} />
                <YAxis tick={{ fill: "#6b7280" }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend iconType="circle" wrapperStyle={{ paddingTop: 12 }} />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  name="Revenue"
                  stroke={
                    colors.reportCharts.campaignReports.revenueVsSpend.revenue
                  }
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
                <Line
                  type="monotone"
                  dataKey="spend"
                  name="Spend"
                  stroke={
                    colors.reportCharts.campaignReports.revenueVsSpend.spend
                  }
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>
      )}

      {!isTrendsView && !useDummyData && (
        <>
          <section className="grid gap-6 lg:grid-cols-3">
            <div className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm`}>
              <h2 className="text-xl font-semibold text-gray-900">ROI</h2>
              <p className="mt-1 text-sm text-gray-600">Revenue efficiency versus campaign cost</p>
              <dl className="mt-4 space-y-2 text-sm">
                <div className="flex justify-between gap-4">
                  <dt className="text-gray-600">Total revenue</dt>
                  <dd className="font-semibold text-gray-900">{formatCurrency(liveDetail?.roi?.totalRevenue || 0)}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-gray-600">Incremental revenue</dt>
                  <dd className="font-semibold text-gray-900">{formatCurrency(liveDetail?.roi?.incrementalRevenue || 0)}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-gray-600">Campaign cost</dt>
                  <dd className="font-semibold text-gray-900">{formatCurrency(liveDetail?.roi?.campaignCost || 0)}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-gray-600">ROI</dt>
                  <dd className="font-semibold text-gray-900">{(liveDetail?.roi?.roiPercent || 0).toFixed(1)}%</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-gray-600">ROAS</dt>
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
                  <dt className="text-gray-600">Actual revenue</dt>
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
