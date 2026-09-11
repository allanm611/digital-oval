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
import { useLanguage } from "../../../contexts/LanguageContext";
import { extractBackendError } from "../../../shared/utils/errorHandler";;;
import {
  Download,
  Gift,
  Percent,
  TrendingUp,
  DollarSign,
  Users2,
  Coins,
  Sparkles,
  Eye,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getSettingsTimezoneOffset } from "../../../shared/utils/settingsHelper";
import { formatDateWithTimezone } from "../../../shared/services/dateService";
import { colors } from "../../../shared/utils/tokens";
import HeadlessSelect from "../../../shared/components/ui/HeadlessSelect";
import Pagination, { DEFAULT_PAGE_SIZE, getInitialPageSize } from "../../../shared/components/ui/Pagination";
import CsvDownloadButton from "../../../shared/components/CsvDownloadButton";
import LoadingSpinner from "../../../shared/components/ui/LoadingSpinner";
import { formatCurrency as formatCurrencyAmount } from "../../../shared/services/currencyService";
import type {
  RangeOption,
  OfferReportsResponse,
  OfferRow,
} from "../types/ReportsAPI";

import { tw } from "../../../shared/utils/utils";
import Input from "../../../shared/components/ui/Input";
import { offerService } from "../../offers/services/offerService";
import { offerReportsService } from "../services/offerReportsService";
import { useReportTimeWindow } from "../hooks/useReportTimeWindow";
import ReportTrendsToolbar from "../components/ReportTrendsToolbar";
import { useToast } from "../../../contexts/ToastContext";
import type { Offer } from "../../offers/types/offer";
import { Table } from "../../../shared/components/Table/Table";
import { useTable } from "../../../shared/components/Table/useTable";
import type { TableColumn } from "../../../shared/components/Table/types";
import { ColumnPickerModal } from "../../../shared/components/ColumnPickerModal";

// Extract types from API response type
type CombinedSummary = OfferReportsResponse["summary"];
type FunnelStage = OfferReportsResponse["redemptionFunnel"][number];
type TimeSeriesPoint = OfferReportsResponse["redemptionTimeline"][number];
type OfferTypePerformance = OfferReportsResponse["offerTypeComparison"][number];

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

const combinedSummary: Record<RangeOption, CombinedSummary> = {
  "7d": {
    totalRedemptions: 6_850,
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

// Offer stage data
const funnelData: Record<RangeOption, FunnelStage[]> = {
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

// Redemption timeline data
const redemptionTimelineData: Record<RangeOption, TimeSeriesPoint[]> = {
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

// Offer type comparison data (using actual system offer types)
const offerTypeData: Record<RangeOption, OfferTypePerformance[]> = {
  "7d": [
    {
      type: "Data",
      redemptionRate: 4.2,
      aov: 78,
      marginPercent: 20.5,
      incrementalRevenue: 85_000,
    },
    {
      type: "Voice",
      redemptionRate: 2.8,
      aov: 62,
      marginPercent: 16.3,
      incrementalRevenue: 48_000,
    },
    {
      type: "SMS",
      redemptionRate: 2.2,
      aov: 38,
      marginPercent: 13.2,
      incrementalRevenue: 32_000,
    },
    {
      type: "Combo",
      redemptionRate: 4.8,
      aov: 115,
      marginPercent: 23.8,
      incrementalRevenue: 98_000,
    },
    {
      type: "Voucher",
      redemptionRate: 5.5,
      aov: 85,
      marginPercent: 17.7,
      incrementalRevenue: 78_000,
    },
    {
      type: "Bundle",
      redemptionRate: 4.0,
      aov: 132,
      marginPercent: 25.2,
      incrementalRevenue: 112_000,
    },
    {
      type: "Bonus",
      redemptionRate: 3.5,
      aov: 72,
      marginPercent: 15.8,
      incrementalRevenue: 58_000,
    },
  ],
  "30d": [
    {
      type: "Data",
      redemptionRate: 4.8,
      aov: 85,
      marginPercent: 22.5,
      incrementalRevenue: 285_000,
    },
    {
      type: "Voice",
      redemptionRate: 3.2,
      aov: 68,
      marginPercent: 18.3,
      incrementalRevenue: 142_000,
    },
    {
      type: "SMS",
      redemptionRate: 2.8,
      aov: 45,
      marginPercent: 15.2,
      incrementalRevenue: 98_000,
    },
    {
      type: "Combo",
      redemptionRate: 5.2,
      aov: 125,
      marginPercent: 25.8,
      incrementalRevenue: 342_000,
    },
    {
      type: "Voucher",
      redemptionRate: 6.1,
      aov: 92,
      marginPercent: 19.7,
      incrementalRevenue: 268_000,
    },
    {
      type: "Bundle",
      redemptionRate: 4.5,
      aov: 145,
      marginPercent: 27.2,
      incrementalRevenue: 398_000,
    },
    {
      type: "Bonus",
      redemptionRate: 3.9,
      aov: 78,
      marginPercent: 16.8,
      incrementalRevenue: 185_000,
    },
  ],
  "90d": [
    {
      type: "Data",
      redemptionRate: 5.2,
      aov: 92,
      marginPercent: 24.5,
      incrementalRevenue: 845_000,
    },
    {
      type: "Voice",
      redemptionRate: 3.6,
      aov: 75,
      marginPercent: 20.3,
      incrementalRevenue: 428_000,
    },
    {
      type: "SMS",
      redemptionRate: 3.2,
      aov: 52,
      marginPercent: 17.2,
      incrementalRevenue: 298_000,
    },
    {
      type: "Combo",
      redemptionRate: 5.8,
      aov: 138,
      marginPercent: 27.8,
      incrementalRevenue: 1_025_000,
    },
    {
      type: "Voucher",
      redemptionRate: 6.8,
      aov: 105,
      marginPercent: 21.7,
      incrementalRevenue: 812_000,
    },
    {
      type: "Bundle",
      redemptionRate: 5.0,
      aov: 158,
      marginPercent: 29.2,
      incrementalRevenue: 1_198_000,
    },
    {
      type: "Bonus",
      redemptionRate: 4.4,
      aov: 88,
      marginPercent: 18.8,
      incrementalRevenue: 558_000,
    },
  ],
};

// Generate comprehensive dummy data for offers
const generateOfferRows = (): OfferRow[] => {
  const segments = [
    "New Customers",
    "Active Shoppers",
    "High Value",
    "Cart Abandoners",
    "VIP Customers",
    "Regular Customers",
    "At-Risk",
  ];
  const statuses: ("Active" | "Expired" | "Scheduled" | "Paused")[] = [
    "Active",
    "Expired",
    "Scheduled",
    "Paused",
  ];
  const offerNames = [
    "Welcome 20% Off",
    "Flash Friday Ksh15 Off",
    "Bundle & Save 30%",
    "Free Shipping",
    "VIP 25% Exclusive",
    "BOGO 50% Off",
    "Data Bundle Special",
    "Voice Minutes Bonus",
    "SMS Pack Deal",
    "Combo Offer",
    "Holiday Voucher",
    "Referral Reward",
  ];
  const campaignNames = [
    "New Customer Onboarding",
    "Weekend Flash Sale",
    "Cross-Sell Campaign",
    "Abandoned Cart Recovery",
    "VIP Appreciation Week",
    "Spring Clearance",
    "Product Launch",
    "Re-engagement Drive",
    "Seasonal Promo",
    "Loyalty Program",
    "Birthday Special",
    "Winback Campaign",
  ];

  const rows: OfferRow[] = [];
  const today = new Date();

  segments.forEach((segment, segIdx) => {
    statuses.forEach((status, statusIdx) => {
      const baseIdx = segIdx * statuses.length + statusIdx;
      const daysAgo = baseIdx * 3 + Math.floor(Math.random() * 5);
      const updateDate = new Date(today);
      updateDate.setDate(today.getDate() - daysAgo);

      const targetGroup = 20000 + Math.floor(Math.random() * 100000);
      const controlGroup = Math.floor(targetGroup * 0.12);
      const messagesGenerated = targetGroup + controlGroup;
      const sent =
        status === "Scheduled"
          ? 0
          : Math.floor(messagesGenerated * (0.95 + Math.random() * 0.04));
      const delivered =
        status === "Scheduled"
          ? 0
          : Math.floor(sent * (0.94 + Math.random() * 0.05));
      const conversions =
        status === "Scheduled"
          ? 0
          : Math.floor(delivered * (0.03 + Math.random() * 0.05));

      rows.push({
        id: `offer-${String(100 + baseIdx).padStart(3, "0")}`,
        offerName: offerNames[baseIdx % offerNames.length],
        campaignName: campaignNames[baseIdx % campaignNames.length],
        segment,
        status,
        targetGroup,
        controlGroup,
        messagesGenerated,
        sent,
        delivered,
        conversions,
        lastUpdated: updateDate.toISOString().split("T")[0],
      });
    });
  });

  return rows;
};

const offerRows: OfferRow[] = generateOfferRows();

const statusOptions = [
  "All Statuses",
  "Active",
  "Expired",
  "Scheduled",
  "Paused",
];
const segmentOptions = [
  "All Segments",
  "New Customers",
  "Active Shoppers",
  "High Value",
  "Cart Abandoners",
  "VIP Customers",
  "Regular Customers",
];

// Chart colors now use standardized colors from tokens.reportCharts

interface ChartTooltipEntry {
  name?: string;
  value?: number | string;
  color?: string;
  dataKey?: string;
  payload?: Record<string, unknown>;
}

interface ChartTooltipProps {
  active?: boolean;
  payload?: ChartTooltipEntry[];
  label?: string;
}

// Using formatCurrencyAmount from currencyService instead

const formatNumber = (value: number): string => {
  return value.toLocaleString("en-US");
};

const CustomTooltip = ({ active, payload, label }: ChartTooltipProps) => {
  if (!active || !payload?.length) return null;
  return (
    <div
      className={`${tw.rounded} border border-gray-200 bg-white p-3 shadow-lg`}
    >
      <p className="mb-2 text-sm font-semibold text-gray-900">{label}</p>
      {payload.map((entry, idx) => (
        <div
          key={idx}
          className="flex items-center justify-between gap-4 text-sm"
        >
          <span className="flex items-center gap-2">
            <span
              className="h-3 w-3 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-gray-600">{entry.name}</span>
          </span>
          <span className="font-semibold text-gray-900">
            {typeof entry.value === "number"
              ? formatNumber(entry.value)
              : entry.value}
          </span>
        </div>
      ))}
    </div>
  );
};

const statIcons = {
  redemption: Gift,
  revenue: DollarSign,
  margin: Percent,
  growth: TrendingUp,
  users: Users2,
  coins: Coins,
  sparkles: Sparkles,
};

type OfferTableRow = {
  id: string;
  offerName: string;
  status: string;
  targetGroup: number;
  controlGroup: number;
  messagesGenerated: number;
  sent: number;
  delivered: number;
  conversions: number;
  lastUpdated: string;
};

export default function OfferReportsPage() {
  const { t } = useLanguage();
  const { error: showError } = useToast();
  const navigate = useNavigate();
  const [tableQuery, setTableQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All Statuses");
  const timeWindow = useReportTimeWindow({
    overviewPreset: "weekly",
    defaultTrendsPreset: "daily",
  });
  const { isTrendsView, queryParams } = timeWindow;
  const selectedRange = timeWindow.rangeKey;
  const appliedCustomRange = timeWindow.activeWindow.bounds;
  const customRange = appliedCustomRange;
  const [useDummyData, setUseDummyData] = useState(true);
  const [liveReport, setLiveReport] = useState<OfferReportsResponse | null>(null);
  const [isLoadingLiveReport, setIsLoadingLiveReport] = useState(false);
  const [liveReportError, setLiveReportError] = useState<string | null>(null);
  const [tablePage, setTablePage] = useState(1);
  const [tablePageSize, setTablePageSize] = useState(getInitialPageSize());
  const [clearFiltersKey, setClearFiltersKey] = useState(0);
  const [showColumnPicker, setShowColumnPicker] = useState(false);

  const tableColumns: TableColumn<OfferTableRow>[] = [
    {
      id: "offerName",
      label: "Offer Name",
      visible: true,
      sortable: true,
      filterConfig: { type: "text" },
    },
    {
      id: "status",
      label: "Status",
      visible: true,
      sortable: true,
      filterConfig: { type: "select", options: statusOptions.slice(1) },
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
      render: (value: number) => value.toLocaleString("en-US"),
    },
    {
      id: "conversions",
      label: "Conversions",
      visible: true,
      sortable: true,
      filterConfig: { type: "number" },
      render: (value: number) => value.toLocaleString("en-US"),
    },
    {
      id: "lastUpdated",
      label: "Last Updated",
      visible: true,
      sortable: true,
    },
    {
      id: "actions",
      label: "Actions",
      visible: true,
      sortable: false,
      isActionColumn: true,
      render: (_, row) => (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => navigate(`/dashboard/offers/${row.id.split("-")[1]}`)}
            className={`p-0 icon-edit ${tw.rounded} transition-colors`}
            title="View Details"
          >
            <Eye className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  const { columns: tableColumnsMemo, handlePageSizeChange: tableHandlePageSizeChange, toggleColumn, reorderColumns, resetToDefaults } = useTable({
    tableId: "offer-reports-table",
    defaultColumns: tableColumns,
    defaultPageSize: DEFAULT_PAGE_SIZE,
  });

  // State for real offer data
  const [offers, setOffers] = useState<Offer[]>([]);
  const [isLoadingOffers, setIsLoadingOffers] = useState(true);
  const [offerFetchError, setOfferFetchError] = useState<string | null>(null);

  // Fetch real offers on mount using batch loading
  const fetchOffers = async () => {
    try {
      setIsLoadingOffers(true);
      setOfferFetchError(null);
      let allOffers: Offer[] = [];
      let batchOffset = 0;
      const batchSize = 100;
      let hasMore = true;

      // Fetch all offers in batches
      while (hasMore) {
        const batchResponse = await offerService.searchOffers({
          limit: batchSize,
          offset: batchOffset,
          skipCache: true,
        });

        if (batchResponse?.data && Array.isArray(batchResponse.data)) {
          allOffers = [...allOffers, ...batchResponse.data];

          // Check if there are more offers to fetch
          const totalFromPagination = batchResponse.pagination?.total || 0;
          hasMore =
            allOffers.length < totalFromPagination &&
            batchResponse.data.length === batchSize;
          batchOffset += batchSize;
        } else {
          hasMore = false;
        }
      }

      setOffers(allOffers);
    } catch (err) {
      console.error("Error fetching offers:", err);
      setOfferFetchError("Failed to load offers");
      setOffers([]);
    } finally {
      setIsLoadingOffers(false);
    }
  };

  useEffect(() => {
    fetchOffers();
  }, []);

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
      return;
    }

    let cancelled = false;
    const loadLiveReport = async () => {
      try {
        setIsLoadingLiveReport(true);
        setLiveReportError(null);
        const response = await offerReportsService.getPortfolio({
          range: queryParams.range || activeRangeKey,
          grain: queryParams.grain,
          startDate: queryParams.startDate,
          endDate: queryParams.endDate,
          page: 1,
          pageSize: 200,
        });
        if (cancelled) return;
        if (response.success && response.data) {
          setLiveReport(response.data);
        } else {
          setLiveReport(null);
          setLiveReportError(response.error || response.message || "Failed to load offer report");
        }
      } catch (error) {
        if (cancelled) return;
        setLiveReport(null);
        setLiveReportError(
          extractBackendError(error, "Failed to load Offer Reports."),
        );
      } finally {
        if (!cancelled) setIsLoadingLiveReport(false);
      }
    };

    loadLiveReport();
    return () => {
      cancelled = true;
    };
  }, [
    useDummyData,
    queryParams.range,
    queryParams.grain,
    queryParams.startDate,
    queryParams.endDate,
  ]);

  // Scale summary data based on actual date range
  const baseSummary = combinedSummary[activeRangeKey];
  const summary = useMemo(() => {
    if (!useDummyData) {
      if (liveReport?.summary) return liveReport.summary;
      return {
        totalRedemptions: 0,
        redemptionRate: 0,
        revenueGenerated: 0,
        incrementalRevenue: 0,
        totalCost: 0,
        roi: 0,
      };
    }
    if (scaleFactor === 1) return baseSummary;
    return {
      ...baseSummary,
      totalRedemptions: Math.round(baseSummary.totalRedemptions * scaleFactor),
      revenueGenerated: Math.round(baseSummary.revenueGenerated * scaleFactor),
      incrementalRevenue: Math.round(
        baseSummary.incrementalRevenue * scaleFactor,
      ),
      totalCost: Math.round(baseSummary.totalCost * scaleFactor),
      // Rates stay the same (percentages don't scale)
      redemptionRate: baseSummary.redemptionRate,
      roi: baseSummary.roi,
    };
  }, [baseSummary, scaleFactor, useDummyData, liveReport]);

  const liveTrend = (
    key: keyof NonNullable<OfferReportsResponse["heroTrends"]>,
  ) => ({
    value:
      liveReport?.heroTrends?.[key]?.label?.replace(" vs last period", "") ||
      "—",
    direction: liveReport?.heroTrends?.[key]?.direction || ("up" as const),
  });

  const heroCards = useDummyData
    ? [
        {
          label: "Total Redemptions",
          value: summary.totalRedemptions.toLocaleString("en-US"),
          subtext: "Total offers used by customers",
          icon: statIcons.users,
          trend: { value: "+12.8%", direction: "up" as const },
        },
        {
          label: "Redemption Rate",
          value: `${summary.redemptionRate.toFixed(1)}%`,
          subtext: "Customers who used promotions",
          icon: statIcons.growth,
          trend: { value: "+0.6 pts", direction: "up" as const },
        },
        {
          label: "Revenue Generated",
          value: formatCurrencyAmount(summary.revenueGenerated),
          subtext: "Total sales from promotions",
          icon: statIcons.revenue,
          trend: { value: "+156K", direction: "up" as const },
        },
        {
          label: "Incremental Revenue",
          value: formatCurrencyAmount(summary.incrementalRevenue),
          subtext: "New revenue created",
          icon: statIcons.sparkles,
          trend: { value: "+42K", direction: "up" as const },
        },
        {
          label: "Total Cost",
          value: formatCurrencyAmount(summary.totalCost),
          subtext: "Total discount cost",
          icon: statIcons.coins,
          trend: { value: "+18K", direction: "up" as const },
        },
        {
          label: "ROI",
          value: `${summary.roi.toFixed(1)}x`,
          subtext: "Revenue per dollar spent",
          icon: statIcons.growth,
          trend: { value: "+0.2x", direction: "up" as const },
        },
      ]
    : [
        {
          label: "Total Redemptions",
          value: summary.totalRedemptions.toLocaleString("en-US"),
          subtext: "Total offers used by customers",
          icon: statIcons.users,
          trend: liveTrend("totalRedemptions"),
        },
        {
          label: "Redemption Rate",
          value: `${summary.redemptionRate.toFixed(1)}%`,
          subtext: "Customers who used promotions",
          icon: statIcons.growth,
          trend: liveTrend("redemptionRate"),
        },
        {
          label: "Revenue Generated",
          value: formatCurrencyAmount(summary.revenueGenerated),
          subtext: "Total sales from promotions",
          icon: statIcons.revenue,
          trend: liveTrend("revenueGenerated"),
        },
        {
          label: "Incremental Revenue",
          value: formatCurrencyAmount(summary.incrementalRevenue),
          subtext: "New revenue created",
          icon: statIcons.sparkles,
          trend: liveTrend("incrementalRevenue"),
        },
        {
          label: "Total Cost",
          value: formatCurrencyAmount(summary.totalCost),
          subtext: "Total discount cost",
          icon: statIcons.coins,
          trend: liveTrend("totalCost"),
        },
        {
          label: "ROI",
          value: `${summary.roi.toFixed(1)}x`,
          subtext: "Revenue per dollar spent",
          icon: statIcons.growth,
          trend: liveTrend("roi"),
        },
      ];

  // Scale chart data based on actual date range
  const funnelSeries = useMemo(() => {
    if (!useDummyData) {
      if (liveReport?.redemptionFunnel?.length) return liveReport.redemptionFunnel;
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

  const timelineSeries = useMemo(() => {
    if (!useDummyData) {
      if (liveReport?.redemptionTimeline?.length) return liveReport.redemptionTimeline;
      return redemptionTimelineData[activeRangeKey].map((point) => ({
        ...point,
        redemptions: 0,
        cumulativeRedemptions: 0,
      }));
    }
    const base = redemptionTimelineData[activeRangeKey];
    if (scaleFactor === 1) return base;
    return base.map((point) => ({
      ...point,
      redemptions: Math.round(point.redemptions * scaleFactor),
      cumulativeRedemptions: Math.round(
        point.cumulativeRedemptions * scaleFactor,
      ),
    }));
  }, [activeRangeKey, scaleFactor, useDummyData, liveReport]);

  const offerTypeComparison = useMemo(() => {
    if (!useDummyData) {
      if (liveReport?.offerTypeComparison?.length) return liveReport.offerTypeComparison;
      return offerTypeData[activeRangeKey].map((point) => ({
        ...point,
        redemptionRate: 0,
        aov: 0,
        marginPercent: 0,
        incrementalRevenue: 0,
      }));
    }
    const base = offerTypeData[activeRangeKey];
    if (scaleFactor === 1) return base;
    return base.map((point) => ({
      ...point,
      // Rates stay the same
      redemptionRate: point.redemptionRate,
      aov: point.aov,
      marginPercent: point.marginPercent,
      // Scale revenue
      incrementalRevenue: Math.round(point.incrementalRevenue * scaleFactor),
    }));
  }, [activeRangeKey, scaleFactor, useDummyData, liveReport]);

  // Convert real offers to table row format with mixed real and dummy data
  const offerTableRows = useMemo(() => {
    if (!useDummyData && liveReport?.offers?.length) {
      return liveReport.offers.map((row) => ({
        id: `offer-${row.id}`,
        offerName: row.offerName,
        status: row.status ?? "Active",
        targetGroup: row.targetGroup,
        controlGroup: row.controlGroup,
        messagesGenerated: row.messagesGenerated,
        sent: row.sent,
        delivered: row.delivered,
        conversions: row.conversions,
        lastUpdated: row.lastUpdated
          ? formatDateWithTimezone(row.lastUpdated, getSettingsTimezoneOffset())
          : "—",
        lastUpdatedDate: row.lastUpdated ? new Date(row.lastUpdated).getTime() : Date.now(),
      }));
    }

    return offers.map((offer) => ({
      id: `offer-${offer.id}`,
      offerName: offer.name,
      status: offer.status ?? "Active",
      targetGroup: Math.floor(Math.random() * 50000) + 10000,
      controlGroup: Math.floor(Math.random() * 10000) + 1000,
      messagesGenerated: Math.floor(Math.random() * 100000) + 50000,
      sent: Math.floor(Math.random() * 95000) + 45000,
      delivered: Math.floor(Math.random() * 90000) + 40000,
      conversions: Math.floor(Math.random() * 15000) + 5000,
      lastUpdated: offer.updated_at ? formatDateWithTimezone(offer.updated_at, getSettingsTimezoneOffset()) : "—",
      lastUpdatedDate: offer.updated_at ? new Date(offer.updated_at).getTime() : Date.now(),
    }));
  }, [offers, useDummyData, liveReport]);

  const handleFilteredCountChange = (count: number) => {
    // Updates when filters applied in the Table component
  };

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

    // Only use real offer data
    return offerTableRows.filter((row) => {
      const matchesStatus =
        statusFilter === "All Statuses" ? true : row.status === statusFilter;
      const matchesQuery = query
        ? row.offerName.toLowerCase().includes(query)
        : true;
      const rowDate = (row as any).lastUpdatedDate || Date.now();
      const now = Date.now();
      const matchesRange =
        appliedCustomRange.start && appliedCustomRange.end && startMs && endMs
          ? rowDate >= startMs && rowDate <= endMs
          : now - rowDate <= maxDays * 24 * 60 * 60 * 1000;
      return matchesStatus && matchesQuery && matchesRange;
    });
  }, [
    statusFilter,
    tableQuery,
    customRange,
    customDays,
    selectedRange,
    offerTableRows,
  ]);

  // Reset pagination when filters change
  useEffect(() => {
    setTablePage(1);
  }, [
    tableQuery,
    statusFilter,
    appliedCustomRange.start,
    appliedCustomRange.end,
  ]);

  const csvHeaders = [
    "Offer Name",
    "Status",
    "Target Group",
    "Control Group",
    "Messages Generated",
    "Sent",
    "Delivered",
    "Conversions",
    "Last Updated",
  ];

  const csvRows = filteredRows.map((row) => [
    row.offerName,
    row.status,
    row.targetGroup,
    row.controlGroup,
    row.messagesGenerated,
    row.sent,
    row.delivered,
    row.conversions,
    row.lastUpdated,
  ]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Offer Reports</h1>
          <p className="mt-2 text-base text-gray-600">
            Track offer performance, redemption behavior, and ROI across all
            promotional campaigns
          </p>
        </div>
        <ReportTrendsToolbar
          timeWindow={timeWindow}
          extraActions={
            <div
              className={`flex items-center gap-2 ${tw.rounded} border border-gray-200 bg-white px-3 py-1.5`}
            >
              <label
                htmlFor="offer-data-toggle"
                className="text-sm font-medium text-gray-700 whitespace-nowrap mr-2"
              >
                Data Mode:
              </label>
              <button
                id="offer-data-toggle"
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
                {useDummyData
                  ? "Dummy Data"
                  : isLoadingLiveReport
                    ? "Real Data (loading…)"
                    : "Real Data"}
              </span>
            </div>
          }
        />
      </div>

      {liveReportError && !useDummyData && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {liveReportError}
        </div>
      )}

      {/* Hero KPI Cards */}
      <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {heroCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div
              key={idx}
              className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm`}
            >
              <div className="flex items-center gap-2">
                <Icon
                  className="h-5 w-5"
                  style={{ color: colors.primary.accent }}
                />
                <p className="text-sm font-medium text-gray-600">
                  {card.label}
                </p>
              </div>
              <p className="mt-2 text-3xl font-bold text-gray-900">
                {card.value}
              </p>
              <p className="mt-1 text-sm text-gray-500">{card.subtext}</p>
              <div className="mt-3 flex items-center gap-1 text-xs">
                <span
                  className={`font-semibold ${
                    card.trend.direction === "up"
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                >
                  {card.trend.value}
                </span>
                <span className="text-gray-500">vs last period</span>
              </div>
            </div>
          );
        })}
      </section>

      {!isTrendsView && (
      <section className="grid gap-6 lg:grid-cols-2">
        {/* Offer Performance Stages */}
        <div
          className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm`}
        >
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Offer Performance Stages
              </h2>
              <p className="mt-1 text-sm text-gray-600">
                Customer journey from exposure to redemption
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
                  name="Users"
                  fill={colors.reportCharts.offerReports.redemptionFunnel.value}
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
        <div
          className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm lg:col-span-2`}
        >
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Redemption Timeline
              </h2>
              <p className="mt-1 text-sm text-gray-600">
                Redemption volume over the selected period
              </p>
            </div>
          </div>
          <div className="mt-6 h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={timelineSeries}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="period" tick={{ fill: "#6b7280" }} />
                <YAxis tick={{ fill: "#6b7280" }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend iconType="circle" wrapperStyle={{ paddingTop: 12 }} />
                <Line
                  type="monotone"
                  dataKey="redemptions"
                  name="Daily Redemptions"
                  stroke={
                    colors.reportCharts.offerReports.redemptionTimeline
                      .redemptions
                  }
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
                <Line
                  type="monotone"
                  dataKey="cumulativeRedemptions"
                  name="Cumulative"
                  stroke={
                    colors.reportCharts.offerReports.redemptionTimeline
                      .cumulative
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

      {!isTrendsView && (
      <>
      {/* Offer Type Comparison */}
      <section>
        <div
          className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm`}
        >
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Offer Type Comparison
              </h2>
              <p className="mt-1 text-sm text-gray-600">
                Performance across offer types
              </p>
            </div>
          </div>
          <div className="mt-6 h-96">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={offerTypeComparison}
                margin={{ top: 20, right: 24, left: 0, bottom: 0 }}
                barCategoryGap="20%"
                barGap={4}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="type" tick={{ fill: "#6b7280" }} />
                <YAxis
                  yAxisId="left"
                  orientation="left"
                  tick={{ fill: "#6b7280" }}
                  label={{
                    value: "Redemption Rate (%)",
                    angle: -90,
                    position: "insideLeft",
                    style: { fill: "#6b7280", fontSize: 12 },
                  }}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  tick={{ fill: "#6b7280" }}
                  label={{
                    value: "Avg Transaction Value ($)",
                    angle: 90,
                    position: "insideRight",
                    style: { fill: "#6b7280", fontSize: 12 },
                  }}
                />
                <Tooltip
                  content={<CustomTooltip />}
                  cursor={{ fill: "transparent" }}
                />
                <Legend iconType="circle" wrapperStyle={{ paddingTop: 12 }} />
                <Bar
                  yAxisId="left"
                  dataKey="redemptionRate"
                  name="Redemption Rate %"
                  fill={
                    colors.reportCharts.offerReports.offerTypeComparison
                      .redemptionRate
                  }
                  maxBarSize={40}
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  yAxisId="right"
                  dataKey="aov"
                  name="Avg Transaction Value ($)"
                  fill={
                    colors.reportCharts.offerReports.offerTypeComparison
                      .avgTransactionValue
                  }
                  maxBarSize={40}
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      {/* Offer Data Table */}
      <section className="space-y-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Offer Performance Table
            </h2>
            <p className="mt-1 text-sm text-gray-600">
              Detailed view of all offers with redemption and revenue metrics
            </p>
          </div>
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <Input
              placeholder="Search offer"
              value={tableQuery}
              onChange={setTableQuery}
              className="w-full md:w-80"
            />
            <HeadlessSelect
              value={statusFilter}
              onChange={(value) => setStatusFilter(value as string)}
              options={statusOptions.map((status) => ({
                label: status,
                value: status,
              }))}
              placeholder="All Status"
              className="w-full md:w-48"
            />
            <CsvDownloadButton
              headers={csvHeaders}
              rows={csvRows}
              filename={`offer-reports-${new Date().toISOString().split("T")[0]}.csv`}
              style={{ backgroundColor: colors.primary.action }}
            />
          </div>
        </div>

        {(useDummyData ? isLoadingOffers : isLoadingLiveReport) && (
          <div className="flex justify-center py-16">
            <LoadingSpinner />
          </div>
        )}

        {useDummyData && !isLoadingOffers && offerFetchError && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-8 text-center">
            <p className="text-sm text-red-700 font-medium mb-4">{offerFetchError}</p>
            <button
              onClick={fetchOffers}
              className={`${tw.rounded} ${tw.btnSmall} bg-red-600 text-white hover:bg-red-700`}
            >
              Retry
            </button>
          </div>
        )}

        {!(useDummyData ? isLoadingOffers : isLoadingLiveReport) &&
          !(useDummyData && offerFetchError) &&
          offerTableRows.length === 0 && (
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-8 text-center">
            <p className="text-sm text-gray-600">No offers found</p>
          </div>
        )}

        {!(useDummyData ? isLoadingOffers : isLoadingLiveReport) &&
          !(useDummyData && offerFetchError) &&
          offerTableRows.length > 0 && (
          <>
            <Table<OfferTableRow>
              columns={tableColumnsMemo}
              data={filteredRows}
              totalItems={filteredRows.length}
              currentPage={tablePage}
              pageSize={tablePageSize}
              onPageChange={setTablePage}
              onFilteredCountChange={handleFilteredCountChange}
              clearFiltersKey={clearFiltersKey}
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
          </>
        )}
      </section>
      </>
      )}

      {/* Column Picker Modal */}
      <ColumnPickerModal
        isOpen={showColumnPicker}
        columns={tableColumnsMemo.map((col) => ({ id: col.id, label: col.label, visible: col.visible }))}
        onClose={() => setShowColumnPicker(false)}
        onToggleColumn={toggleColumn}
        onReorderColumns={(reorderedCols) => {
          const updatedColumns = tableColumnsMemo.map((col) => {
            const reordered = reorderedCols.find((c) => c.id === col.id);
            return reordered ? { ...col, visible: reordered.visible } : col;
          });
          reorderColumns(updatedColumns);
        }}
        onResetToDefaults={resetToDefaults}
      />
    </div>
  );
}
