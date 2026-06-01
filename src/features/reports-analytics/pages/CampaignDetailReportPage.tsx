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
import {
  Activity,
  ArrowUpRight,
  Download,
  MousePointerClick,
  Users2,
} from "lucide-react";
import BackButton from "../../../shared/components/ui/BackButton";
import { getSettingsTimezoneOffset } from "../../../shared/utils/settingsHelper";
import { colors } from "../../../shared/utils/tokens";
import HeadlessSelect from "../../../shared/components/ui/HeadlessSelect";
import LoadingSpinner from "../../../shared/components/ui/LoadingSpinner";
import { formatCurrency } from "../../../shared/services/currencyService";
import { formatDateWithTimezone } from "../../../shared/services/dateService";
import type { RangeOption } from "../types/ReportsAPI";
import { tw } from "../../../shared/utils/utils";
import Input from "../../../shared/components/ui/Input";
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
  ctr: number;
  engagement: number;
  revenue?: number;
  spend?: number;
};

const rangeOptions: RangeOption[] = ["7d", "30d", "90d"];
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

const getRangeLabel = (option: RangeOption): string => {
  const labels: Record<RangeOption, string> = {
    "7d": "Daily",
    "30d": "Weekly",
    "90d": "Monthly",
  };
  return labels[option];
};

const getScaleFactor = (
  customDays: number | null,
  baseRange: RangeOption,
): number => {
  if (!customDays) return 1;
  const baseDays = rangeDays[baseRange];
  return customDays / baseDays;
};

const getDateConstraints = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  const maxDate = `${year}-${month}-${day}`;

  const minDate = new Date(today);
  minDate.setFullYear(today.getFullYear() - 2);
  const minYear = minDate.getFullYear();
  const minMonth = String(minDate.getMonth() + 1).padStart(2, "0");
  const minDay = String(minDate.getDate()).padStart(2, "0");
  const minDateStr = `${minYear}-${minMonth}-${minDay}`;

  return { minDate: minDateStr, maxDate };
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

export default function CampaignDetailReportPage() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const { t } = useLanguage();

  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRange, setSelectedRange] = useState<RangeOption>("7d");
  const [customRange, setCustomRange] = useState({ start: "", end: "" });
  const [appliedCustomRange, setAppliedCustomRange] = useState({
    start: "",
    end: "",
  });
  const [useDummyData, setUseDummyData] = useState(true);

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

  const handleRun = () => {
    setAppliedCustomRange(customRange);
  };

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

  const baseSummary = campaignSummaryData[activeRangeKey];
  const summary = useMemo(() => {
    if (!useDummyData) {
      return {
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
  }, [baseSummary, scaleFactor, useDummyData]);

  const heroCards = [
    {
      label: "Reach",
      value: summary.reach.toLocaleString("en-US"),
      subtext: `${summary.impressions.toLocaleString("en-US")} impressions`,
      icon: statIcons.audience,
      trend: { value: "+8.4%", direction: "up" as const },
    },
    {
      label: "Engagement Rate",
      value: `${summary.engagementRate.toFixed(1)}%`,
      subtext: `${summary.opens.toLocaleString("en-US")} opens`,
      icon: statIcons.engagement,
      trend: { value: "+2.1 pts", direction: "up" as const },
    },
    {
      label: "Click-Through Rate",
      value: `${summary.clickRate.toFixed(1)}%`,
      subtext: `${summary.clicks.toLocaleString("en-US")} clicks`,
      icon: statIcons.outcome,
      trend: { value: "+0.6 pts", direction: "up" as const },
    },
    {
      label: "Conversion Rate",
      value: `${summary.conversionRate.toFixed(1)}%`,
      subtext: `${summary.conversions.toLocaleString("en-US")} conversions`,
      icon: statIcons.outcome,
      trend: { value: "-0.4 pts", direction: "down" as const },
    },
    {
      label: "Revenue Generated",
      value: formatCurrency(summary.revenue),
      subtext: `ROAS ${summary.roas.toFixed(1)}x`,
      icon: statIcons.growth,
      trend: { value: "+84K", direction: "up" as const },
    },
    {
      label: "Customer Acquisition Cost",
      value: formatCurrency(summary.cac),
      subtext: "Average per acquisition",
      icon: statIcons.outcome,
      trend: { value: "-2.3%", direction: "down" as const },
    },
  ];

  const channelData = useMemo(() => {
    if (!useDummyData) {
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
  }, [activeRangeKey, scaleFactor, useDummyData]);

  const funnelSeries = useMemo(() => {
    if (!useDummyData) {
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
  }, [activeRangeKey, scaleFactor, useDummyData]);

  const trendSeries = useMemo(() => {
    if (!useDummyData) {
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
  }, [activeRangeKey, scaleFactor, useDummyData]);

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
          fallbackTo={fallbackPath}
          showBreadcrumb={true}
          parentLabel="Campaign Details"
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

        {/* Controls */}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-2">
            {rangeOptions.map((option) => (
              <button
                key={option}
                onClick={() => {
                  setSelectedRange(option);
                  setCustomRange({ start: "", end: "" });
                  setAppliedCustomRange({ start: "", end: "" });
                }}
                className={`${
                  tw.rounded
                } border px-3 py-1.5 text-sm font-medium transition-colors ${
                  !(appliedCustomRange.start && appliedCustomRange.end) &&
                  selectedRange === option
                    ? "border-[#252829] bg-[#252829] text-white"
                    : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"
                }`}
              >
                {getRangeLabel(option)}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {/* Data Mode Toggle */}
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
                {useDummyData ? "Dummy Data" : "Real Data"}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <label
                htmlFor="report-date-start"
                className="text-sm font-medium text-gray-700 whitespace-nowrap"
              >
                From:
              </label>
              <Input
                id="report-date-start"
                type="date"
                value={customRange.start}
                min={getDateConstraints().minDate}
                max={getDateConstraints().maxDate}
                onChange={(event) =>
                  setCustomRange((prev) => ({
                    ...prev,
                    start: event.target.value,
                  }))
                }
                className={`cursor-pointer ${tw.rounded} border border-gray-300 px-3 py-1.5 text-sm text-gray-900 focus:border-[#252829] focus:outline-none focus:ring-1 focus:ring-[#252829]`}
              />
            </div>
            <div className="flex items-center gap-2">
              <label
                htmlFor="report-date-end"
                className="text-sm font-medium text-gray-700 whitespace-nowrap"
              >
                To:
              </label>
              <Input
                id="report-date-end"
                type="date"
                value={customRange.end}
                min={customRange.start || getDateConstraints().minDate}
                max={getDateConstraints().maxDate}
                onChange={(event) =>
                  setCustomRange((prev) => ({
                    ...prev,
                    end: event.target.value,
                  }))
                }
                className={`cursor-pointer ${tw.rounded} border border-gray-300 px-3 py-1.5 text-sm text-gray-900 focus:border-[#252829] focus:outline-none focus:ring-1 focus:ring-[#252829]`}
              />
            </div>
            {customRange.start && customRange.end && (
              <button
                type="button"
                onClick={handleRun}
                className={`${tw.rounded} px-4 py-1.5 text-sm font-medium text-white transition-colors`}
                style={{ backgroundColor: colors.primary.accent }}
              >
                Run
              </button>
            )}
            {(customRange.start || customRange.end) && (
              <button
                type="button"
                onClick={() => {
                  setCustomRange({ start: "", end: "" });
                  setAppliedCustomRange({ start: "", end: "" });
                }}
                className={`ml-1 ${tw.rounded} px-2.5 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors`}
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </header>

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

      {/* Charts */}
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

      {/* Trend Charts */}
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
                  domain={[0, 20]}
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
    </div>
  );
}
