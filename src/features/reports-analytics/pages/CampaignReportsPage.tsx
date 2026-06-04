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
import { useNavigate } from "react-router-dom";
import { useLanguage } from "../../../contexts/LanguageContext";
import { extractBackendError } from "../../../shared/utils/errorHandler";;;
import {
  Activity,
  ArrowUpRight,
  Download,
  MousePointerClick,
  Users2,
  Eye,
  FileText,
} from "lucide-react";
import { getSettingsTimezoneOffset } from "../../../shared/utils/settingsHelper";
import { colors } from "../../../shared/utils/tokens";
import HeadlessSelect from "../../../shared/components/ui/HeadlessSelect";
import Pagination from "../../../shared/components/ui/Pagination";
import CsvDownloadButton from "../../../shared/components/CsvDownloadButton";
import LoadingSpinner from "../../../shared/components/ui/LoadingSpinner";
import { formatCurrency } from "../../../shared/services/currencyService";
import { formatDateWithTimezone } from "../../../shared/services/dateService";
import type {
  RangeOption,
  CampaignReportsResponse,
  CampaignRow,
} from "../types/ReportsAPI";

import { tw } from "../../../shared/utils/utils";
import Input from "../../../shared/components/ui/Input";
import { campaignService } from "../../campaigns/services/campaignService";
import { useToast } from "../../../contexts/ToastContext";
import type { CampaignDisplay } from "../../campaigns/types/campaign";
import CampaignOffersModal from "../../campaigns/components/CampaignOffersModal";
import CampaignSegmentsModal from "../../campaigns/components/CampaignSegmentsModal";
import DateFormatter from "../../../shared/components/DateFormatter";

// Extract types from API response type
type CampaignSummary = CampaignReportsResponse["summary"];
type ChannelReachPoint = CampaignReportsResponse["channelReach"][number];
type FunnelPoint = CampaignReportsResponse["conversionFunnel"][number];
type TrendPoint = CampaignReportsResponse["performanceTrend"][number];

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

// Scale data based on actual number of days vs base range
const getScaleFactor = (
  customDays: number | null,
  baseRange: RangeOption,
): number => {
  if (!customDays) return 1;
  const baseDays = rangeDays[baseRange];
  return customDays / baseDays;
};

// Get date constraints for date inputs
const getDateConstraints = () => {
  const today = new Date();
  // Use local date to avoid timezone issues
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  const maxDate = `${year}-${month}-${day}`; // Today (no future dates)

  const minDate = new Date(today);
  minDate.setFullYear(today.getFullYear() - 2); // 2 years ago max
  const minYear = minDate.getFullYear();
  const minMonth = String(minDate.getMonth() + 1).padStart(2, "0");
  const minDay = String(minDate.getDate()).padStart(2, "0");
  const minDateStr = `${minYear}-${minMonth}-${minDay}`;

  return { minDate: minDateStr, maxDate };
};

// Types are now imported from ReportsAPI.ts above

const campaignSummary: Record<RangeOption, CampaignSummary> = {
  "7d": {
    eligibleAudience: 210_000,
    recipients: 145_000,
    reach: 132_400,
    impressions: 280_000,
    opens: 56_000,
    clickRate: 8.4,
    engagementRate: 12.1,
    conversions: 9_300,
    conversionRate: 6.4,
    revenue: 415_000,
    roas: 4.6,
    cac: 18.4,
    leads: 3_950,
    campaignCost: 90_000,
  },
  "30d": {
    eligibleAudience: 720_000,
    recipients: 540_000,
    reach: 497_000,
    impressions: 1_180_000,
    opens: 210_000,
    clickRate: 9.2,
    engagementRate: 13.3,
    conversions: 34_400,
    conversionRate: 7.1,
    revenue: 1_620_000,
    roas: 4.9,
    cac: 17.2,
    leads: 15_200,
    campaignCost: 330_000,
  },
  "90d": {
    eligibleAudience: 2_050_000,
    recipients: 1_580_000,
    reach: 1_420_000,
    impressions: 3_420_000,
    opens: 620_000,
    clickRate: 9.8,
    engagementRate: 14.2,
    conversions: 102_000,
    conversionRate: 7.6,
    revenue: 4_950_000,
    roas: 5.1,
    cac: 16.5,
    leads: 45_800,
    campaignCost: 970_000,
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
    { stage: "Opens", value: 56_000 },
    { stage: "Clicks", value: 42_000 },
    { stage: "Engagements", value: 33_500 },
    { stage: "Conversions", value: 18_600 },
  ],
  "30d": [
    { stage: "Sent", value: 540_000 },
    { stage: "Opens", value: 210_000 },
    { stage: "Clicks", value: 148_000 },
    { stage: "Engagements", value: 126_000 },
    { stage: "Conversions", value: 65_500 },
  ],
  "90d": [
    { stage: "Sent", value: 1_580_000 },
    { stage: "Opens", value: 620_000 },
    { stage: "Clicks", value: 438_000 },
    { stage: "Engagements", value: 360_000 },
    { stage: "Conversions", value: 198_000 },
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

const revenueData: Record<RangeOption, TrendPoint[]> = {
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

// Generate comprehensive dummy data for campaigns
const generateCampaignRows = (): CampaignRow[] => {
  const segments = [
    "New Customers",
    "High Value",
    "Churn Risk",
    "Broad Audience",
    "VIP",
    "At-Risk",
    "Reactivated",
  ];
  const offers = [
    "Cashback Bonus",
    "Priority Upgrade",
    "Winback Voucher",
    "Seasonal Bundles",
    "Data Bundle",
    "Voice Minutes",
    "SMS Pack",
  ];
  const campaignNames = [
    "Neo Onboarding Journey",
    "VIP Upsell",
    "Churn Winback",
    "Seasonal Promotions",
    "Welcome Series",
    "Loyalty Rewards",
    "Birthday Campaign",
    "Holiday Special",
    "Product Launch",
    "Re-engagement Drive",
    "Cross-sell Bundle",
    "Referral Program",
  ];

  const rows: CampaignRow[] = [];
  const today = new Date();

  segments.forEach((segment, segIdx) => {
    for (let i = 0; i < 3; i++) {
      const baseIdx = segIdx * 3 + i;
      const daysAgo = i * 10 + Math.floor(Math.random() * 5);
      const runDate = new Date(today);
      runDate.setDate(today.getDate() - daysAgo);

      const targetGroup = 20000 + Math.floor(Math.random() * 60000);
      const controlGroup = Math.floor(targetGroup * 0.15);
      const sent = targetGroup + controlGroup;
      const delivered = Math.floor(sent * (0.92 + Math.random() * 0.06));
      const conversions = Math.floor(delivered * (0.06 + Math.random() * 0.08));
      const cgConversions = Math.floor((delivered * controlGroup / sent) * (0.04 + Math.random() * 0.06)); // CG has lower conversion rate
      const messagesGenerated = sent * (2 + Math.floor(Math.random() * 2));

      // Calculate conversion percentages for both groups
      const tgConversionPercentage = delivered > 0 ? (conversions / delivered) * 100 : 0;
      const cgConversionPercentage = delivered > 0 ? (cgConversions / delivered) * 100 : 0;

      rows.push({
        id: `camp-${String(1000 + baseIdx)}`,
        name: campaignNames[baseIdx % campaignNames.length],
        segmentCount: 2,
        offerCount: 2,
        campaign: undefined as any, // Dummy data doesn't have campaign object
        targetGroup,
        controlGroup,
        sent,
        delivered,
        conversions,
        cgConversions,
        messagesGenerated,
        tgConversionPercentage,
        cgConversionPercentage,
        lastRunDate: runDate.toISOString().split("T")[0],
      });
    }
  });

  return rows;
};

const campaignRows: CampaignRow[] = generateCampaignRows();

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

export default function CampaignReportsPage() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { error: showError } = useToast();
  const [tableQuery, setTableQuery] = useState("");
  const [selectedRange, setSelectedRange] = useState<RangeOption>("7d");
  const [customRange, setCustomRange] = useState({ start: "", end: "" });
  const [appliedCustomRange, setAppliedCustomRange] = useState({
    start: "",
    end: "",
  });
  const [useDummyData, setUseDummyData] = useState(true);
  const [tablePage, setTablePage] = useState(1);
  const tablePageSize = 20;

  // State for real campaign data
  const [campaigns, setCampaigns] = useState<CampaignDisplay[]>([]);
  const [isLoadingCampaigns, setIsLoadingCampaigns] = useState(true);
  const [campaignFetchError, setCampaignFetchError] = useState<string | null>(null);
  const [showOffersModal, setShowOffersModal] = useState(false);
  const [showSegmentsModal, setShowSegmentsModal] = useState(false);
  const [selectedCampaignForModal, setSelectedCampaignForModal] = useState<CampaignDisplay | null>(null);
  const [selectedCampaignFilter, setSelectedCampaignFilter] = useState<string>("");

  // Fetch real campaigns on mount
  const fetchCampaigns = async () => {
    try {
      setIsLoadingCampaigns(true);
      setCampaignFetchError(null);
      const response = await campaignService.getCampaigns({
        limit: 100,
        offset: 0,
        skipCache: true,
      });

      if (response.success && response.data) {
        const campaignList = response.data.map((campaign) => ({
          ...campaign,
          offer_count: campaign.offers?.length ?? 0,
          segment_count: campaign.segments?.length ?? 0,
        }));
        setCampaigns(campaignList);
      } else {
        setCampaignFetchError("No campaigns found");
        setCampaigns([]);
      }
    } catch (err) {
      setCampaignFetchError("Failed to load campaigns");
      setCampaigns([]);
    } finally {
      setIsLoadingCampaigns(false);
    }
  };

  useEffect(() => {
    fetchCampaigns();
  }, []);

  useEffect(() => {
    if (selectedCampaignFilter) {
      navigate(`/dashboard/campaigns/${selectedCampaignFilter}/report`);
    }
  }, [selectedCampaignFilter, navigate]);

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

  // Calculate scale factor for custom date ranges
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

  // Scale summary data based on actual date range
  const baseSummary = campaignSummary[activeRangeKey];
  const summary = useMemo(() => {
    if (!useDummyData) {
      return {
        eligibleAudience: 0,
        recipients: 0,
        reach: 0,
        impressions: 0,
        opens: 0,
        clickRate: 0,
        engagementRate: 0,
        conversions: 0,
        conversionRate: 0,
        revenue: 0,
        roas: 0,
        cac: 0,
        leads: 0,
        campaignCost: 0,
      };
    }
    if (scaleFactor === 1) return baseSummary;
    return {
      ...baseSummary,
      eligibleAudience: Math.round(baseSummary.eligibleAudience * scaleFactor),
      recipients: Math.round(baseSummary.recipients * scaleFactor),
      reach: Math.round(baseSummary.reach * scaleFactor),
      impressions: Math.round(baseSummary.impressions * scaleFactor),
      opens: Math.round(baseSummary.opens * scaleFactor),
      conversions: Math.round(baseSummary.conversions * scaleFactor),
      revenue: Math.round(baseSummary.revenue * scaleFactor),
      leads: Math.round(baseSummary.leads * scaleFactor),
      campaignCost: Math.round(baseSummary.campaignCost * scaleFactor),
      // Rates stay the same (percentages don't scale)
      clickRate: baseSummary.clickRate,
      engagementRate: baseSummary.engagementRate,
      conversionRate: baseSummary.conversionRate,
      roas: baseSummary.roas,
      cac: baseSummary.cac,
    };
  }, [baseSummary, scaleFactor, useDummyData]);
  const heroCards = useDummyData
    ? [
        {
          label: "Audience Reached",
          value: summary.reach.toLocaleString("en-US"),
          subtext: `${Math.round(
            (summary.reach / summary.eligibleAudience) * 100,
          )}% of ${summary.eligibleAudience.toLocaleString("en-US")} eligible`,
          icon: statIcons.audience,
          trend: { value: "+8.4%", direction: "up" as const },
        },
        {
          label: "Engagement Rate",
          value: `${summary.engagementRate.toFixed(1)}%`,
          subtext: "Opens, clicks & taps vs reach",
          icon: statIcons.engagement,
          trend: { value: "+2.1 pts", direction: "up" as const },
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
          subtext: `Avg ${formatCurrency(
            Math.round(summary.revenue / summary.conversions),
          )} per conversion`,
          icon: statIcons.outcome,
          trend: { value: "+84K", direction: "up" as const },
        },
        {
          label: "ROI / ROMI",
          value: `${summary.roas.toFixed(1)}x`,
          subtext: `Spend ${formatCurrency(summary.campaignCost)}`,
          icon: statIcons.growth,
          trend: { value: "+0.3x", direction: "up" as const },
        },
        {
          label: "Campaign Cost",
          value: formatCurrency(summary.campaignCost),
          subtext: `CAC ${formatCurrency(summary.cac)}`,
          icon: statIcons.outcome,
          trend: { value: "+12K", direction: "up" as const },
        },
      ]
    : [
        {
          label: "Audience Reached",
          value: "0",
          subtext: "0% of 0 eligible",
          icon: statIcons.audience,
          trend: { value: "—", direction: "up" as const },
        },
        {
          label: "Engagement Rate",
          value: "0.0%",
          subtext: "Opens, clicks & taps vs reach",
          icon: statIcons.engagement,
          trend: { value: "—", direction: "up" as const },
        },
        {
          label: "Conversion Rate",
          value: "0.0%",
          subtext: "0 conversions",
          icon: statIcons.outcome,
          trend: { value: "—", direction: "up" as const },
        },
        {
          label: "Revenue Generated",
          value: formatCurrency(0),
          subtext: `Avg ${formatCurrency(0)} per conversion`,
          icon: statIcons.outcome,
          trend: { value: "—", direction: "up" as const },
        },
        {
          label: "ROI / ROMI",
          value: "0.0x",
          subtext: `Spend ${formatCurrency(0)}`,
          icon: statIcons.growth,
          trend: { value: "—", direction: "up" as const },
        },
        {
          label: "Campaign Cost",
          value: formatCurrency(0),
          subtext: `CAC ${formatCurrency(0)}`,
          icon: statIcons.outcome,
          trend: { value: "—", direction: "up" as const },
        },
      ];

  // Convert real campaigns to table row format with mixed real and dummy data
  const campaignTableRows = useMemo(() => {
    return campaigns.map((campaign) => {
      const delivered = Math.floor(Math.random() * 90000) + 40000;
      const conversions = Math.floor(delivered * (0.06 + Math.random() * 0.08));
      const cgConversions = Math.floor(delivered * (0.04 + Math.random() * 0.06));
      const tgConversionPercentage = delivered > 0 ? (conversions / delivered) * 100 : 0;
      const cgConversionPercentage = delivered > 0 ? (cgConversions / delivered) * 100 : 0;

      return {
        id: `campaign-${campaign.id}`,
        name: campaign.name,
        segmentCount: Array.isArray(campaign.segments) ? campaign.segments.length : 0,
        offerCount: Array.isArray(campaign.offers) ? campaign.offers.length : 0,
        campaign: campaign, // Store full campaign object for modal
        // Dummy data for columns without backend data
        targetGroup: Math.floor(Math.random() * 50000) + 10000,
        controlGroup: Math.floor(Math.random() * 10000) + 1000,
        messagesGenerated: Math.floor(Math.random() * 100000) + 50000,
        sent: Math.floor(Math.random() * 95000) + 45000,
        delivered,
        conversions,
        cgConversions,
        tgConversionPercentage,
        cgConversionPercentage,
        lastRunDate: campaign.created_at ? formatDateWithTimezone(campaign.created_at, getSettingsTimezoneOffset()) : "—",
        lastRunDateMS: campaign.created_at ? new Date(campaign.created_at).getTime() : Date.now(),
      };
    });
  }, [campaigns]);

  const filteredRows = useMemo(() => {
    const query = tableQuery.trim().toLowerCase();
    const maxDays =
      appliedCustomRange.start && appliedCustomRange.end
        ? (customDays ?? rangeDays[selectedRange])
        : rangeDays[selectedRange];
    const startMs = appliedCustomRange.start
      ? new Date(appliedCustomRange.start).getTime()
      : null;
    const endMs = appliedCustomRange.end
      ? new Date(appliedCustomRange.end).getTime()
      : null;

    // Only use real campaign data
    const rowsToFilter = campaignTableRows;

    return rowsToFilter.filter((row) => {
      const matchesQuery = query
        ? row.name.toLowerCase().includes(query)
        : true;
      const rowDate = (row as any).lastRunDateMS || Date.now();
      const now = Date.now();
      const matchesRange =
        appliedCustomRange.start && appliedCustomRange.end && startMs && endMs
          ? rowDate >= startMs && rowDate <= endMs
          : now - rowDate <= maxDays * 24 * 60 * 60 * 1000;

      return matchesQuery && matchesRange;
    });
  }, [
    tableQuery,
    customRange,
    customDays,
    selectedRange,
    campaignTableRows,
    appliedCustomRange.start,
    appliedCustomRange.end,
  ]);

  // Reset pagination when filters change
  useEffect(() => {
    setTablePage(1);
  }, [
    tableQuery,
    appliedCustomRange.start,
    appliedCustomRange.end,
  ]);

  // Paginated rows for table display
  const paginatedRows = useMemo(() => {
    const startIdx = (tablePage - 1) * tablePageSize;
    return filteredRows.slice(startIdx, startIdx + tablePageSize);
  }, [filteredRows, tablePage]);

  // Chart colors now use standardized colors from tokens.reportCharts

  // Scale chart data based on actual date range
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
      // Rates stay the same
      ctr: point.ctr,
      engagement: point.engagement,
    }));
  }, [activeRangeKey, scaleFactor, useDummyData]);

  const revenueSeries = useMemo(() => {
    if (!useDummyData) {
      return revenueData[activeRangeKey].map((point) => ({
        ...point,
        revenue: 0,
        spend: 0,
      }));
    }
    const base = revenueData[activeRangeKey];
    if (scaleFactor === 1) return base;
    return base.map((point) => ({
      ...point,
      revenue: Math.round(point.revenue * scaleFactor),
      spend: Math.round(point.spend * scaleFactor),
    }));
  }, [activeRangeKey, scaleFactor, useDummyData]);

  const csvHeaders = [
    "Campaign Name",
    "Segment Count",
    "Offer Count",
    "Target Group",
    "Control Group",
    "Messages Generated",
    "Sent",
    "Delivered",
    "Conversions",
    "Last Run",
  ];

  const csvRows = filteredRows.map((row) => [
    row.name,
    row.segmentCount,
    row.offerCount,
    row.targetGroup,
    row.controlGroup,
    row.messagesGenerated,
    row.sent,
    row.delivered,
    row.conversions,
    row.lastRunDate,
  ]);

  return (
    <div className="space-y-6">
      <header className="space-y-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Campaign Reports</h1>
          <p className="mt-2 text-sm text-gray-600">
            Monitor end-to-end campaign reach, engagement, and revenue impact
          </p>
        </div>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-2">
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
            <div className="border-l border-gray-300 h-6" />
            <HeadlessSelect
              value={selectedCampaignFilter}
              onChange={setSelectedCampaignFilter}
              options={[
                { label: "All Campaigns", value: "" },
                ...campaigns.map((campaign) => ({
                  label: campaign.name,
                  value: campaign.id?.toString() || "",
                })),
              ]}
              placeholder="Select campaign"
            />
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div
              className={`flex items-center gap-2 ${tw.rounded} border border-gray-200 bg-white px-3 py-1.5`}
            >
              <label
                htmlFor="campaign-data-toggle"
                className="text-sm font-medium text-gray-700 whitespace-nowrap mr-2"
              >
                Data Mode:
              </label>
              <button
                id="campaign-data-toggle"
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
                htmlFor="campaign-date-start"
                className="text-sm font-medium text-gray-700 whitespace-nowrap"
              >
                From:
              </label>
              <Input
                id="campaign-date-start"
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
                htmlFor="campaign-date-end"
                className="text-sm font-medium text-gray-700 whitespace-nowrap"
              >
                To:
              </label>
              <Input
                id="campaign-date-end"
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

      <section className="grid gap-6 lg:grid-cols-2">
        <div
          className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm`}
        >
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Channel Reach Contribution
              </h2>
              <p className="mt-1 text-sm text-gray-600">
                Breakdown of reach and impressions by channel
              </p>
            </div>
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

        <div
          className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm`}
        >
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Engagement Stages
              </h2>
              <p className="mt-1 text-sm text-gray-600">
                Track drop-off from sent to conversion
              </p>
            </div>
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

      <section className="grid gap-6 lg:grid-cols-2">
        <div
          className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm`}
        >
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                CTR & Engagement Trends
              </h2>
              <p className="mt-1 text-sm text-gray-600">
                Monitor interaction quality across the selected period
              </p>
            </div>
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

        <div
          className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm`}
        >
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Revenue vs Spend
              </h2>
              <p className="mt-1 text-sm text-gray-600">
                Compare generated revenue against campaign spend
              </p>
            </div>
          </div>
          <div className="mt-6 h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={revenueSeries}>
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

      <section className="space-y-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Campaign Performance Table
            </h2>
            <p className="mt-1 text-sm text-gray-600">
              Track campaign audiences, delivery counts, and outcome metrics
            </p>
          </div>
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <Input
              placeholder="Search campaign"
              value={tableQuery}
              onChange={setTableQuery}
              className="w-full md:w-80"
            />
            <CsvDownloadButton
              headers={csvHeaders}
              rows={csvRows}
              filename="campaign_reports.csv"
              style={{ backgroundColor: colors.primary.action }}
            />
          </div>
        </div>

        {isLoadingCampaigns && (
          <div className="flex justify-center py-16">
            <LoadingSpinner />
          </div>
        )}

        {!isLoadingCampaigns && campaignFetchError && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-8 text-center">
            <p className="text-sm text-red-700 font-medium mb-4">{campaignFetchError}</p>
            <button
              onClick={fetchCampaigns}
              className={`${tw.rounded} ${tw.btnSmall} bg-red-600 text-white hover:bg-red-700`}
            >
              Retry
            </button>
          </div>
        )}

        {!isLoadingCampaigns && !campaignFetchError && campaigns.length === 0 && (
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-8 text-center">
            <p className="text-sm text-gray-600">No campaigns found</p>
          </div>
        )}

        {!isLoadingCampaigns && !campaignFetchError && campaigns.length > 0 && (
        <div className="hidden lg:block">
          <div className="overflow-x-auto">
            <table
              className="w-full text-sm text-gray-900"
              style={{ borderCollapse: "separate", borderSpacing: "0 8px" }}
            >
              <thead style={{ background: colors.surface.tableHeader }}>
                <tr className="text-left text-sm font-medium uppercase tracking-wide">
                  {[
                    "Campaign Name",
                    // "Segment Count",
                    // "Offer Count",
                    "Target Group",
                    "Control Group",
                    "Messages Generated",
                    "Sent",
                    "Delivered",
                    "Target Group Conversions",
                    "Control Group Conversions",
                    "Target Group %",
                    "Control Group %",
                    "Last Run",
                    "Actions",
                  ].map((header, idx, arr) => (
                    <th
                      key={header}
                      className="px-6 py-3"
                      style={{
                        color: colors.surface.tableHeaderText,
                        borderTopLeftRadius: idx === 0 ? "0.375rem" : undefined,
                        borderTopRightRadius:
                          idx === arr.length - 1 ? "0.375rem" : undefined,
                      }}
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginatedRows.map((entry) => (
                  <tr key={entry.id} className="transition-colors">
                    <td
                      className="px-6 py-4 font-semibold"
                      style={{
                        backgroundColor: colors.surface.tablebodybg,
                        borderTopLeftRadius: "0.375rem",
                        borderBottomLeftRadius: "0.375rem",
                      }}
                    >
                      <div className="text-gray-900">{entry.name}</div>
                    </td>
                    {/* <td
                      className="px-6 py-4 cursor-pointer"
                      style={{ backgroundColor: colors.surface.tablebodybg }}
                      onClick={() => {
                        if ((entry.segmentCount ?? 0) > 0 && entry.campaign) {
                          setSelectedCampaignForModal(entry.campaign);
                          setShowSegmentsModal(true);
                        }
                      }}
                    >
                      <span className="text-sm font-medium">{entry.segmentCount ?? 0}</span>
                    </td>
                    <td
                      className="px-6 py-4 cursor-pointer"
                      style={{ backgroundColor: colors.surface.tablebodybg }}
                      onClick={() => {
                        if ((entry.offerCount ?? 0) > 0 && entry.campaign) {
                          setSelectedCampaignForModal(entry.campaign);
                          setShowOffersModal(true);
                        }
                      }}
                    >
                      <span className="text-sm font-medium">{entry.offerCount ?? 0}</span>
                    </td> */}
                    <td
                      className="px-6 py-4"
                      style={{ backgroundColor: colors.surface.tablebodybg }}
                    >
                      {entry.targetGroup.toLocaleString("en-US")}
                    </td>
                    <td
                      className="px-6 py-4"
                      style={{ backgroundColor: colors.surface.tablebodybg }}
                    >
                      {entry.controlGroup.toLocaleString("en-US")}
                    </td>
                    <td
                      className="px-6 py-4"
                      style={{
                        backgroundColor: colors.surface.tablebodybg,
                      }}
                    >
                      {entry.messagesGenerated.toLocaleString("en-US")}
                    </td>
                    <td
                      className="px-6 py-4"
                      style={{ backgroundColor: colors.surface.tablebodybg }}
                    >
                      {entry.sent.toLocaleString("en-US")}
                    </td>
                    <td
                      className="px-6 py-4"
                      style={{ backgroundColor: colors.surface.tablebodybg }}
                    >
                      {(entry.delivered ?? 0).toLocaleString("en-US")}
                    </td>
                    <td
                      className="px-6 py-4"
                      style={{ backgroundColor: colors.surface.tablebodybg }}
                    >
                      {(entry.conversions ?? 0).toLocaleString("en-US")}
                    </td>
                    <td
                      className="px-6 py-4"
                      style={{ backgroundColor: colors.surface.tablebodybg }}
                    >
                      {(entry.cgConversions ?? 0).toLocaleString("en-US")}
                    </td>
                    <td
                      className="px-6 py-4"
                      style={{ backgroundColor: colors.surface.tablebodybg }}
                    >
                      {((entry.tgConversionPercentage ?? 0).toFixed(2))}%
                    </td>
                    <td
                      className="px-6 py-4"
                      style={{ backgroundColor: colors.surface.tablebodybg }}
                    >
                      {((entry.cgConversionPercentage ?? 0).toFixed(2))}%
                    </td>
                    <td
                      className="px-6 py-4"
                      style={{
                        backgroundColor: colors.surface.tablebodybg,
                      }}
                    >
                      {entry.lastRunDate}
                    </td>
                    <td
                      className="px-6 py-4 space-x-2 flex items-center"
                      style={{
                        backgroundColor: colors.surface.tablebodybg,
                        borderTopRightRadius: "0.375rem",
                        borderBottomRightRadius: "0.375rem",
                      }}
                    >
                      <button
                        onClick={() => {
                          if (entry.campaign?.id) {
                            navigate(`/dashboard/campaigns/${entry.campaign.id}`);
                          }
                        }}
                        className="inline-flex items-center justify-center p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors"
                        title="View campaign details"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => {
                          if (entry.campaign?.id) {
                            navigate(`/dashboard/campaigns/${entry.campaign.id}/report`);
                          }
                        }}
                        className="inline-flex items-center justify-center p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors"
                        title="View campaign report"
                      >
                        <FileText className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!filteredRows.length && (
              <div className="py-10 text-center text-sm text-gray-500">
                No campaigns match your filters yet.
              </div>
            )}
          </div>
          {filteredRows.length > 0 && (
            <Pagination
              currentPage={tablePage}
              pageSize={tablePageSize}
              totalItems={filteredRows.length}
              onPageChange={setTablePage}
            />
          )}
        </div>
        )}
      </section>

      {/* Campaign Offers Modal */}
      {selectedCampaignForModal && (
        <CampaignOffersModal
          isOpen={showOffersModal}
          onClose={() => {
            setShowOffersModal(false);
            setSelectedCampaignForModal(null);
          }}
          offers={selectedCampaignForModal.offers || []}
          campaignName={selectedCampaignForModal.name}
        />
      )}

      {/* Campaign Segments Modal */}
      {selectedCampaignForModal && (
        <CampaignSegmentsModal
          isOpen={showSegmentsModal}
          onClose={() => {
            setShowSegmentsModal(false);
            setSelectedCampaignForModal(null);
          }}
          segments={selectedCampaignForModal.segments || []}
          campaignName={selectedCampaignForModal.name}
        />
      )}
    </div>
  );
}
