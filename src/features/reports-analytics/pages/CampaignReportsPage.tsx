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
import { extractBackendError } from "../../../shared/utils/errorHandler";
import {
  Activity,
  ArrowUpRight,
  MousePointerClick,
  Users2,
  Eye,
  FileText,
  RefreshCw,
} from "lucide-react";
import { colors } from "../../../shared/utils/tokens";
import HeadlessSelect from "../../../shared/components/ui/HeadlessSelect";
import Pagination, { DEFAULT_PAGE_SIZE, getInitialPageSize } from "../../../shared/components/ui/Pagination";
import CsvDownloadButton from "../../../shared/components/CsvDownloadButton";
import LoadingSpinner from "../../../shared/components/ui/LoadingSpinner";
import { formatCurrency } from "../../../shared/services/currencyService";
import type {
  RangeOption,
  CampaignReportsResponse,
  CampaignRow,
} from "../types/ReportsAPI";
import {
  buildCampaignReportParams,
  formatTrendLabel,
  settledError,
  settledValue,
} from "../utils/campaignReportQuery";

import { tw } from "../../../shared/utils/utils";
import Input from "../../../shared/components/ui/Input";
import { campaignService } from "../../campaigns/services/campaignService";
import { campaignReportsService } from "../services/campaignReportsService";
import { useToast } from "../../../contexts/ToastContext";
import type { CampaignDisplay } from "../../campaigns/types/campaign";
import CampaignOffersModal from "../../campaigns/components/CampaignOffersModal";
import CampaignSegmentsModal from "../../campaigns/components/CampaignSegmentsModal";
import { Table } from "../../../shared/components/Table/Table";
import { useTable } from "../../../shared/components/Table/useTable";
import type { TableColumn } from "../../../shared/components/Table/types";

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
        id: `dummy-${String(1000 + baseIdx)}`,
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

type CampaignTableRow = {
  id: string;
  name: string;
  targetGroup: number;
  controlGroup: number;
  messagesGenerated: number;
  sent: number;
  delivered: number;
  conversions: number;
  cgConversions: number;
  tgConversionPercentage: number;
  cgConversionPercentage: number;
  lastRunDate: string;
  lastRunDateMS?: number;
  campaign?: CampaignDisplay;
  segmentCount: number;
  offerCount: number;
};

function getCampaignRowId(row: CampaignTableRow): string | null {
  const fromCampaign = row.campaign?.id;
  if (fromCampaign != null && String(fromCampaign).trim() !== "") {
    return String(fromCampaign);
  }
  const raw = String(row.id || "").replace(/^(campaign-|camp-)/, "");
  return /^\d+$/.test(raw) ? raw : null;
}

const EMPTY_SUMMARY: CampaignSummary = {
  eligibleAudience: 0,
  recipients: 0,
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
  leads: 0,
  campaignCost: 0,
};

export default function CampaignReportsPage() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { success: showSuccess, error: showError } = useToast();
  const [tableQuery, setTableQuery] = useState("");
  const [debouncedTableQuery, setDebouncedTableQuery] = useState("");
  const [selectedRange, setSelectedRange] = useState<RangeOption>("7d");
  const [customRange, setCustomRange] = useState({ start: "", end: "" });
  const [appliedCustomRange, setAppliedCustomRange] = useState({
    start: "",
    end: "",
  });
  const [useDummyData, setUseDummyData] = useState(true);
  const [tablePage, setTablePage] = useState(1);
  const [tablePageSize, setTablePageSize] = useState(getInitialPageSize());

  const tableColumns: TableColumn<CampaignTableRow>[] = [
    {
      id: "name",
      label: "Campaign Name",
      visible: true,
      sortable: true,
      filterConfig: { type: "text" },
    },
    {
      id: "targetGroup",
      label: "Target Group",
      visible: true,
      sortable: true,
      filterConfig: { type: "number" },
      render: (value: number) => value.toLocaleString("en-US"),
    },
    {
      id: "controlGroup",
      label: "Control Group",
      visible: true,
      sortable: true,
      filterConfig: { type: "number" },
      render: (value: number) => value.toLocaleString("en-US"),
    },
    {
      id: "messagesGenerated",
      label: "Messages Generated",
      visible: true,
      sortable: true,
      filterConfig: { type: "number" },
      render: (value: number) => value.toLocaleString("en-US"),
    },
    {
      id: "sent",
      label: "Sent",
      visible: true,
      sortable: true,
      filterConfig: { type: "number" },
      render: (value: number) => value.toLocaleString("en-US"),
    },
    {
      id: "delivered",
      label: "Delivered",
      visible: true,
      sortable: true,
      filterConfig: { type: "number" },
      render: (value: number) => (value ?? 0).toLocaleString("en-US"),
    },
    {
      id: "conversions",
      label: "Target Group Conversions",
      visible: true,
      sortable: true,
      filterConfig: { type: "number" },
      render: (value: number) => (value ?? 0).toLocaleString("en-US"),
    },
    {
      id: "cgConversions",
      label: "Control Group Conversions",
      visible: true,
      sortable: true,
      filterConfig: { type: "number" },
      render: (value: number) => (value ?? 0).toLocaleString("en-US"),
    },
    {
      id: "tgConversionPercentage",
      label: "Target Group %",
      visible: true,
      sortable: true,
      filterConfig: { type: "number" },
      render: (value: number) => `${(value ?? 0).toFixed(2)}%`,
    },
    {
      id: "cgConversionPercentage",
      label: "Control Group %",
      visible: true,
      sortable: true,
      filterConfig: { type: "number" },
      render: (value: number) => `${(value ?? 0).toFixed(2)}%`,
    },
    {
      id: "lastRunDate",
      label: "Last Run",
      visible: true,
      sortable: true,
      filterConfig: { type: "date" },
    },
    {
      id: "actions",
      label: "Actions",
      visible: true,
      sortable: false,
      isActionColumn: true,
      render: (_, row: CampaignTableRow) => {
        const campaignId = getCampaignRowId(row);
        const canOpen = Boolean(campaignId);
        return (
          <div className="space-x-2 flex items-center">
            <button
              onClick={() => {
                if (campaignId) navigate(`/dashboard/campaigns/${campaignId}`);
              }}
              disabled={!canOpen}
              className="inline-flex items-center justify-center p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors disabled:opacity-40 disabled:pointer-events-none"
              title="View campaign details"
            >
              <Eye className="h-4 w-4" />
            </button>
            <button
              onClick={() => {
                if (campaignId) navigate(`/dashboard/campaigns/${campaignId}/report`);
              }}
              disabled={!canOpen}
              className="inline-flex items-center justify-center p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors disabled:opacity-40 disabled:pointer-events-none"
              title="View campaign report"
            >
              <FileText className="h-4 w-4" />
            </button>
          </div>
        );
      },
    },
  ];

  const { columns: tableColumnsMemo, handlePageSizeChange: tableHandlePageSizeChange, toggleColumn } = useTable({
    tableId: "campaign-reports-table",
    defaultColumns: tableColumns,
    defaultPageSize: DEFAULT_PAGE_SIZE,
  });

  // State for real campaign data
  const [campaigns, setCampaigns] = useState<CampaignDisplay[]>([]);
  const [isLoadingCampaigns, setIsLoadingCampaigns] = useState(true);
  const [campaignFetchError, setCampaignFetchError] = useState<string | null>(null);
  const [showColumnPicker, setShowColumnPicker] = useState(false);
  const [showOffersModal, setShowOffersModal] = useState(false);
  const [showSegmentsModal, setShowSegmentsModal] = useState(false);
  const [selectedCampaignForModal, setSelectedCampaignForModal] = useState<CampaignDisplay | null>(null);
  const [selectedCampaignFilter, setSelectedCampaignFilter] = useState<string>("");
  const [liveReport, setLiveReport] = useState<Partial<CampaignReportsResponse> | null>(null);
  const [isLoadingLiveReport, setIsLoadingLiveReport] = useState(false);
  const [liveReportError, setLiveReportError] = useState<string | null>(null);
  const [liveTableRows, setLiveTableRows] = useState<CampaignRow[]>([]);
  const [liveTableTotal, setLiveTableTotal] = useState(0);
  const [isLoadingLiveTable, setIsLoadingLiveTable] = useState(false);
  const [liveTableError, setLiveTableError] = useState<string | null>(null);
  const [isRefreshingSnapshots, setIsRefreshingSnapshots] = useState(false);
  const [dataEpoch, setDataEpoch] = useState(0);

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
        setCampaigns([]);
      }
    } catch (err) {
      setCampaignFetchError("Failed to load campaign filter list");
      setCampaigns([]);
    } finally {
      setIsLoadingCampaigns(false);
    }
  };

  useEffect(() => {
    fetchCampaigns();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedTableQuery(tableQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [tableQuery]);

  const handleRun = () => {
    setAppliedCustomRange(customRange);
  };

  const handleRefreshSnapshots = async () => {
    try {
      setIsRefreshingSnapshots(true);
      await campaignReportsService.refreshSnapshots({
        range: activeRangeKey,
        startDate: appliedCustomRange.start || undefined,
        endDate: appliedCustomRange.end || undefined,
      });
      showSuccess("Campaign snapshots refreshed. Reloading reports…");
      setDataEpoch((value) => value + 1);
    } catch (error) {
      showError(extractBackendError(error, "Failed to refresh campaign snapshots."));
    } finally {
      setIsRefreshingSnapshots(false);
    }
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

  useEffect(() => {
    if (useDummyData) {
      setLiveReport(null);
      setLiveReportError(null);
      setIsLoadingLiveReport(false);
      setLiveTableRows([]);
      setLiveTableTotal(0);
      setLiveTableError(null);
      setIsLoadingLiveTable(false);
      return;
    }

    let cancelled = false;
    const params = buildCampaignReportParams({
      range: activeRangeKey,
      startDate: appliedCustomRange.start,
      endDate: appliedCustomRange.end,
      campaignId: selectedCampaignFilter || undefined,
    });

    const loadLiveWidgets = async () => {
      setIsLoadingLiveReport(true);
      setLiveReportError(null);
      const [kpisResult, reachResult, funnelResult, trendsResult] = await Promise.allSettled([
        campaignReportsService.getKpis(params),
        campaignReportsService.getChannelReach(params),
        campaignReportsService.getFunnel(params),
        campaignReportsService.getTrends(params),
      ]);
      if (cancelled) return;

      const kpis = settledValue(kpisResult);
      const reach = settledValue(reachResult);
      const funnel = settledValue(funnelResult);
      const trends = settledValue(trendsResult);
      const trendPoints = trends?.data || [];

      setLiveReport({
        summary: kpis?.data,
        heroTrends: kpis?.trends,
        channelReach: reach?.data,
        conversionFunnel: funnel?.data,
        performanceTrend: trendPoints,
        revenueTrend: trendPoints.map((point) => ({
          period: point.period,
          date: point.date,
          revenue: point.revenue,
          spend: point.spend,
          target: 0,
        })),
        meta: kpis?.meta,
      });

      const errors = [
        settledError(kpisResult, "Failed to load campaign KPIs."),
        settledError(reachResult, "Failed to load channel reach."),
        settledError(funnelResult, "Failed to load engagement funnel."),
        settledError(trendsResult, "Failed to load campaign trends."),
      ].filter(Boolean) as string[];

      if (errors.length === 4) {
        setLiveReportError(extractBackendError(errors[0], "Failed to load Campaign Reports."));
      } else if (errors.length) {
        setLiveReportError(errors.join(" "));
      }
      setIsLoadingLiveReport(false);
    };

    loadLiveWidgets();
    return () => {
      cancelled = true;
    };
  }, [
    useDummyData,
    activeRangeKey,
    appliedCustomRange.start,
    appliedCustomRange.end,
    selectedCampaignFilter,
    dataEpoch,
  ]);

  useEffect(() => {
    if (useDummyData) return;

    let cancelled = false;
    const loadLiveTable = async () => {
      try {
        setIsLoadingLiveTable(true);
        setLiveTableError(null);
        const response = await campaignReportsService.getCampaignsTable(
          buildCampaignReportParams({
            range: activeRangeKey,
            startDate: appliedCustomRange.start,
            endDate: appliedCustomRange.end,
            campaignId: selectedCampaignFilter || undefined,
            page: tablePage,
            pageSize: tablePageSize,
            search: debouncedTableQuery.trim() || undefined,
            sortBy: "conversions",
            sortOrder: "desc",
          }),
        );
        if (cancelled) return;
        if (response.success) {
          setLiveTableRows(response.data || []);
          setLiveTableTotal(response.total ?? response.pagination?.total ?? response.data?.length ?? 0);
        } else {
          setLiveTableRows([]);
          setLiveTableTotal(0);
          setLiveTableError(response.error || response.message || "Failed to load campaign table");
        }
      } catch (error) {
        if (cancelled) return;
        setLiveTableRows([]);
        setLiveTableTotal(0);
        setLiveTableError(extractBackendError(error, "Failed to load campaign table."));
      } finally {
        if (!cancelled) setIsLoadingLiveTable(false);
      }
    };

    loadLiveTable();
    return () => {
      cancelled = true;
    };
  }, [
    useDummyData,
    activeRangeKey,
    appliedCustomRange.start,
    appliedCustomRange.end,
    selectedCampaignFilter,
    tablePage,
    tablePageSize,
    debouncedTableQuery,
    dataEpoch,
  ]);

  // Scale summary data based on actual date range
  const baseSummary = campaignSummary[activeRangeKey];
  const summary = useMemo(() => {
    if (!useDummyData) {
      return liveReport?.summary || EMPTY_SUMMARY;
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
  }, [baseSummary, scaleFactor, useDummyData, liveReport]);
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
          value: summary.reach.toLocaleString("en-US"),
          subtext: `${summary.eligibleAudience ? Math.round((summary.reach / summary.eligibleAudience) * 100) : 0}% of ${summary.eligibleAudience.toLocaleString("en-US")} eligible`,
          icon: statIcons.audience,
          trend: {
            value: formatTrendLabel(liveReport?.heroTrends?.reach?.label),
            direction: liveReport?.heroTrends?.reach?.direction || "up",
          },
        },
        {
          label: "Engagement Rate",
          value: `${summary.engagementRate.toFixed(1)}%`,
          subtext: "Opens, clicks & taps vs reach",
          icon: statIcons.engagement,
          trend: {
            value: formatTrendLabel(liveReport?.heroTrends?.engagementRate?.label),
            direction: liveReport?.heroTrends?.engagementRate?.direction || "up",
          },
        },
        {
          label: "Conversion Rate",
          value: `${summary.conversionRate.toFixed(1)}%`,
          subtext: `${summary.conversions.toLocaleString("en-US")} conversions`,
          icon: statIcons.outcome,
          trend: {
            value: formatTrendLabel(liveReport?.heroTrends?.conversionRate?.label),
            direction: liveReport?.heroTrends?.conversionRate?.direction || "up",
          },
        },
        {
          label: "Revenue Generated",
          value: formatCurrency(summary.revenue),
          subtext: `Avg ${formatCurrency(summary.conversions ? Math.round(summary.revenue / summary.conversions) : 0)} per conversion`,
          icon: statIcons.outcome,
          trend: {
            value: formatTrendLabel(liveReport?.heroTrends?.revenue?.label),
            direction: liveReport?.heroTrends?.revenue?.direction || "up",
          },
        },
        {
          label: "ROI / ROMI",
          value: `${summary.roas.toFixed(1)}x`,
          subtext: `Spend ${formatCurrency(summary.campaignCost)}`,
          icon: statIcons.growth,
          trend: {
            value: formatTrendLabel(liveReport?.heroTrends?.roas?.label),
            direction: liveReport?.heroTrends?.roas?.direction || "up",
          },
        },
        {
          label: "Campaign Cost",
          value: formatCurrency(summary.campaignCost),
          subtext: `CAC ${formatCurrency(summary.cac)}`,
          icon: statIcons.outcome,
          trend: {
            value: formatTrendLabel(liveReport?.heroTrends?.campaignCost?.label),
            direction: liveReport?.heroTrends?.campaignCost?.direction || "up",
          },
        },
      ];

  const mapReportRow = (row: CampaignRow): CampaignTableRow => {
    const campaign = campaigns.find((c) => String(c.id) === String(row.id));
    return {
      id: `campaign-${row.id}`,
      name: row.name,
      segmentCount: row.segmentCount ?? 0,
      offerCount: row.offerCount ?? 0,
      campaign,
      targetGroup: row.targetGroup,
      controlGroup: row.controlGroup,
      messagesGenerated: row.messagesGenerated,
      sent: row.sent,
      delivered: row.delivered,
      conversions: row.conversions,
      cgConversions: row.cgConversions,
      tgConversionPercentage: row.tgConversionPercentage ?? 0,
      cgConversionPercentage: row.cgConversionPercentage ?? 0,
      lastRunDate: row.lastRunDate || "—",
      lastRunDateMS: row.lastRunDate ? new Date(row.lastRunDate).getTime() : Date.now(),
    };
  };

  const campaignTableRows = useMemo(() => {
    if (!useDummyData) {
      return liveTableRows.map(mapReportRow);
    }
    return campaignRows.map((row) => ({
      id: row.id,
      name: row.name,
      segmentCount: row.segmentCount ?? 0,
      offerCount: row.offerCount ?? 0,
      campaign: undefined,
      targetGroup: row.targetGroup,
      controlGroup: row.controlGroup,
      messagesGenerated: row.messagesGenerated,
      sent: row.sent,
      delivered: row.delivered,
      conversions: row.conversions,
      cgConversions: row.cgConversions,
      tgConversionPercentage: row.tgConversionPercentage ?? 0,
      cgConversionPercentage: row.cgConversionPercentage ?? 0,
      lastRunDate: row.lastRunDate || "—",
      lastRunDateMS: row.lastRunDate ? new Date(row.lastRunDate).getTime() : Date.now(),
    }));
  }, [useDummyData, liveTableRows, campaigns]);

  const filteredRows = useMemo(() => {
    if (!useDummyData) return campaignTableRows;

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

    return campaignTableRows.filter((row) => {
      const matchesQuery = query ? row.name.toLowerCase().includes(query) : true;
      const matchesCampaign = selectedCampaignFilter
        ? getCampaignRowId(row) === selectedCampaignFilter
        : true;
      const rowDate = row.lastRunDateMS || Date.now();
      const now = Date.now();
      const matchesRange =
        appliedCustomRange.start && appliedCustomRange.end && startMs && endMs
          ? rowDate >= startMs && rowDate <= endMs
          : now - rowDate <= maxDays * 24 * 60 * 60 * 1000;

      return matchesQuery && matchesCampaign && matchesRange;
    });
  }, [
    useDummyData,
    tableQuery,
    selectedCampaignFilter,
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
    debouncedTableQuery,
    selectedCampaignFilter,
    selectedRange,
    appliedCustomRange.start,
    appliedCustomRange.end,
    useDummyData,
  ]);

  // Chart colors now use standardized colors from tokens.reportCharts

  // Scale chart data based on actual date range
  const channelData = useMemo(() => {
    if (!useDummyData) {
      if (liveReport?.channelReach?.length) return liveReport.channelReach;
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
  }, [activeRangeKey, scaleFactor, useDummyData, liveReport]);

  const funnelSeries = useMemo(() => {
    if (!useDummyData) {
      if (liveReport?.conversionFunnel?.length) return liveReport.conversionFunnel;
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
  }, [activeRangeKey, scaleFactor, useDummyData, liveReport]);

  const trendSeries = useMemo(() => {
    if (!useDummyData) {
      if (liveReport?.performanceTrend?.length) return liveReport.performanceTrend;
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
  }, [activeRangeKey, scaleFactor, useDummyData, liveReport]);

  const revenueSeries = useMemo(() => {
    if (!useDummyData) {
      if (liveReport?.revenueTrend?.length) {
        return liveReport.revenueTrend.map((point) => ({
          period: point.period,
          ctr: 0,
          engagement: 0,
          revenue: point.revenue,
          spend: point.spend ?? 0,
        }));
      }
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
  }, [activeRangeKey, scaleFactor, useDummyData, liveReport]);

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
              placeholder="Filter campaign"
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
                {useDummyData ? "Dummy Data" : isLoadingLiveReport ? "Real Data (loading…)" : "Real Data"}
              </span>
            </div>
            {!useDummyData && (
              <button
                type="button"
                onClick={handleRefreshSnapshots}
                disabled={isRefreshingSnapshots}
                className={`inline-flex items-center gap-2 ${tw.rounded} border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:border-gray-300 disabled:opacity-60`}
                title="Rebuild daily performance snapshots from live events"
              >
                <RefreshCw className={`h-4 w-4 ${isRefreshingSnapshots ? "animate-spin" : ""}`} />
                {isRefreshingSnapshots ? "Refreshing…" : "Refresh snapshots"}
              </button>
            )}
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

      {liveReportError && !useDummyData && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {liveReportError}
        </div>
      )}

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

        {useDummyData ? (
          <>
            <Table<CampaignTableRow>
              columns={tableColumnsMemo}
              data={filteredRows}
              totalItems={filteredRows.length}
              currentPage={tablePage}
              pageSize={tablePageSize}
              onPageChange={setTablePage}
              onHideColumn={toggleColumn}
              onManageColumnsClick={() => setShowColumnPicker(true)}
              style={{
                headerBackground: colors.surface.tableHeader,
                headerTextColor: colors.surface.tableHeaderText,
                rowBackground: colors.surface.tablebodybg,
                rowSpacing: "0 8px",
              }}
            />
            {filteredRows.length > 0 && (
              <Pagination
                currentPage={tablePage}
                pageSize={tablePageSize}
                totalItems={filteredRows.length}
                onPageChange={setTablePage}
                onPageSizeChange={setTablePageSize}
              />
            )}
            {filteredRows.length === 0 && (
              <div className="py-10 text-center text-sm text-gray-500">
                No campaigns match your filters yet.
              </div>
            )}
          </>
        ) : (
          <>
            {isLoadingLiveTable && liveTableRows.length === 0 && (
              <div className="flex justify-center py-16">
                <LoadingSpinner />
              </div>
            )}
            {liveTableError && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-8 text-center">
                <p className="text-sm text-red-700 font-medium mb-4">{liveTableError}</p>
                <button
                  onClick={() => setDataEpoch((value) => value + 1)}
                  className={`${tw.rounded} ${tw.btnSmall} bg-red-600 text-white hover:bg-red-700`}
                >
                  Retry
                </button>
              </div>
            )}
            {!liveTableError && (liveTableRows.length > 0 || !isLoadingLiveTable) && (
              <>
                <Table<CampaignTableRow>
                  columns={tableColumnsMemo}
                  data={filteredRows}
                  totalItems={liveTableTotal}
                  currentPage={tablePage}
                  pageSize={tablePageSize}
                  isLoading={isLoadingLiveTable}
                  onPageChange={setTablePage}
                  onHideColumn={toggleColumn}
                  onManageColumnsClick={() => setShowColumnPicker(true)}
                  style={{
                    headerBackground: colors.surface.tableHeader,
                    headerTextColor: colors.surface.tableHeaderText,
                    rowBackground: colors.surface.tablebodybg,
                    rowSpacing: "0 8px",
                  }}
                />
                {liveTableTotal > 0 && (
                  <Pagination
                    currentPage={tablePage}
                    pageSize={tablePageSize}
                    totalItems={liveTableTotal}
                    onPageChange={setTablePage}
                    onPageSizeChange={setTablePageSize}
                  />
                )}
                {liveTableTotal === 0 && !isLoadingLiveTable && (
                  <div className="py-10 text-center text-sm text-gray-500">
                    No data found. Try adjusting your filters or search criteria.
                  </div>
                )}
              </>
            )}
          </>
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
