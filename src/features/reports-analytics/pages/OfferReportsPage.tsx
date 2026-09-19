import { useMemo, useState, useEffect } from "react";
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
import { useLanguage } from "../../../contexts/LanguageContext";
import { extractBackendError } from "../../../shared/utils/errorHandler";
import {
  Gift,
  Percent,
  TrendingUp,
  DollarSign,
  Users2,
  Coins,
  Sparkles,
  Eye,
  FileText,
  RefreshCw,
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
  OfferCategoryRow,
} from "../types/ReportsAPI";
import {
  buildOfferReportParams,
  resolveHeroTrend,
  settledError,
  settledValue,
} from "../utils/offerReportQuery";
import {
  formatOfferReportDate,
  mergeSplitOfferWidgets,
  normalizeOfferPortfolio,
  offerPortfolioHasWidgets,
  seriesHasActivity,
  typeComparisonHasRows,
  unwrapOfferCategories,
  unwrapOfferTable,
} from "../utils/normalizeOfferReport";
import { parseISODate, alignTrendSeries, dummyTemplateRange, dummyPreviousPeriod, toChartAudit } from "../utils/reportTimeWindow";

import { tw } from "../../../shared/utils/utils";
import Input from "../../../shared/components/ui/Input";
import { offerService } from "../../offers/services/offerService";
import { offerReportsService } from "../services/offerReportsService";
import { useReportTimeWindow } from "../hooks/useReportTimeWindow";
import ReportTrendsToolbar from "../components/ReportTrendsToolbar";
import ReportChartCard from "../components/ReportChartCard";
import ReportGroupedBarChart from "../components/ReportGroupedBarChart";
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

const EMPTY_SUMMARY: CombinedSummary = {
  totalRedemptions: 0,
  redemptionRate: 0,
  revenueGenerated: 0,
  incrementalRevenue: 0,
  totalCost: 0,
  roi: 0,
};

const dummyCategoryData: Record<RangeOption, OfferCategoryRow[]> = {
  "7d": [
    { category_name: "Data", offer_count: 8, total_conversions: 2_140, total_revenue: 86_000 },
    { category_name: "Voice", offer_count: 5, total_conversions: 1_280, total_revenue: 42_000 },
    { category_name: "Combo", offer_count: 4, total_conversions: 1_760, total_revenue: 98_000 },
  ],
  "30d": [
    { category_name: "Data", offer_count: 12, total_conversions: 8_420, total_revenue: 312_000 },
    { category_name: "Voice", offer_count: 7, total_conversions: 4_180, total_revenue: 148_000 },
    { category_name: "Combo", offer_count: 6, total_conversions: 6_540, total_revenue: 398_000 },
    { category_name: "Voucher", offer_count: 5, total_conversions: 5_210, total_revenue: 268_000 },
  ],
  "90d": [
    { category_name: "Data", offer_count: 18, total_conversions: 24_800, total_revenue: 845_000 },
    { category_name: "Voice", offer_count: 11, total_conversions: 12_400, total_revenue: 428_000 },
    { category_name: "Combo", offer_count: 9, total_conversions: 19_200, total_revenue: 1_025_000 },
    { category_name: "Voucher", offer_count: 8, total_conversions: 16_100, total_revenue: 812_000 },
  ],
};

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
  lastUpdatedDate?: number;
  revenue?: number;
  cost?: number;
};

function getOfferRowId(row: OfferTableRow): string | null {
  const raw = String(row.id || "").replace(/^offer-/, "");
  return /^\d+$/.test(raw) ? raw : null;
}

export default function OfferReportsPage() {
  const { t } = useLanguage();
  const { success: showSuccess, error: showError } = useToast();
  const navigate = useNavigate();
  const [tableQuery, setTableQuery] = useState("");
  const [debouncedTableQuery, setDebouncedTableQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All Statuses");
  const timeWindow = useReportTimeWindow({
    overviewPreset: "monthly",
    defaultTrendsPreset: "daily",
  });
  const {
    isTrendsView,
    rangeKey: activeRangeKey,
    scaleFactor,
    queryParams,
    overviewQueryParams,
    overviewWindow,
    activeWindow,
  } = timeWindow;
  const chartAudit = toChartAudit(activeWindow);
  const overviewAudit = toChartAudit(overviewWindow);
  const [useDummyData, setUseDummyData] = useState(true);
  const [liveReport, setLiveReport] = useState<Partial<OfferReportsResponse> | null>(null);
  const [isLoadingLiveReport, setIsLoadingLiveReport] = useState(false);
  const [liveReportError, setLiveReportError] = useState<string | null>(null);
  const [liveTableRows, setLiveTableRows] = useState<OfferRow[]>([]);
  const [liveTableTotal, setLiveTableTotal] = useState(0);
  const [isLoadingLiveTable, setIsLoadingLiveTable] = useState(false);
  const [liveTableError, setLiveTableError] = useState<string | null>(null);
  const [topOffers, setTopOffers] = useState<OfferRow[]>([]);
  const [categoryRows, setCategoryRows] = useState<OfferCategoryRow[]>([]);
  const [isRefreshingSnapshots, setIsRefreshingSnapshots] = useState(false);
  const [dataEpoch, setDataEpoch] = useState(0);
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
      render: (_, row) => {
        const offerId = getOfferRowId(row);
        const canOpen = Boolean(offerId);
        return (
          <div className="flex items-center justify-center gap-2">
            <button
              onClick={() => {
                if (offerId) navigate(`/dashboard/offers/${offerId}`);
              }}
              disabled={!canOpen}
              className={`p-0 icon-edit ${tw.rounded} transition-colors disabled:opacity-40 disabled:pointer-events-none`}
              title="View Details"
            >
              <Eye className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                if (offerId) navigate(`/dashboard/reports/offers/${offerId}`);
              }}
              disabled={!canOpen}
              className={`p-0 icon-edit ${tw.rounded} transition-colors disabled:opacity-40 disabled:pointer-events-none`}
              title="View Offer Report"
            >
              <FileText className="w-4 h-4" />
            </button>
          </div>
        );
      },
    },
  ];

  const { columns: tableColumnsMemo, handlePageSizeChange: tableHandlePageSizeChange, toggleColumn, reorderColumns, resetToDefaults } = useTable({
    tableId: "offer-reports-table",
    defaultColumns: tableColumns,
    defaultPageSize: DEFAULT_PAGE_SIZE,
  });

  const [offers, setOffers] = useState<Offer[]>([]);
  const [isLoadingOffers, setIsLoadingOffers] = useState(false);
  const [offerFetchError, setOfferFetchError] = useState<string | null>(null);

  const fetchOffers = async () => {
    try {
      setIsLoadingOffers(true);
      setOfferFetchError(null);
      let allOffers: Offer[] = [];
      let batchOffset = 0;
      const batchSize = 100;
      let hasMore = true;

      while (hasMore) {
        const batchResponse = await offerService.searchOffers({
          limit: batchSize,
          offset: batchOffset,
          skipCache: true,
        });

        if (batchResponse?.data && Array.isArray(batchResponse.data)) {
          allOffers = [...allOffers, ...batchResponse.data];
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
    if (!useDummyData) {
      setOffers([]);
      setOfferFetchError(null);
      setIsLoadingOffers(false);
      return;
    }
    fetchOffers();
  }, [useDummyData]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedTableQuery(tableQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [tableQuery]);

  const handleRefreshSnapshots = async () => {
    try {
      setIsRefreshingSnapshots(true);
      await offerReportsService.refreshSnapshots({
        range: queryParams.range,
        startDate: queryParams.startDate,
        endDate: queryParams.endDate,
        grain: queryParams.grain,
        preset: queryParams.preset,
      });
      showSuccess("Offer snapshots refreshed. Reloading reports…");
      setDataEpoch((value) => value + 1);
    } catch (error) {
      showError(extractBackendError(error, "Failed to refresh offer snapshots."));
    } finally {
      setIsRefreshingSnapshots(false);
    }
  };

  useEffect(() => {
    if (useDummyData) {
      setLiveReport(null);
      setLiveReportError(null);
      setIsLoadingLiveReport(false);
      setLiveTableRows([]);
      setLiveTableTotal(0);
      setLiveTableError(null);
      setIsLoadingLiveTable(false);
      setTopOffers([]);
      setCategoryRows([]);
      return;
    }

    let cancelled = false;
    const params = buildOfferReportParams({
      range: queryParams.range || activeRangeKey,
      grain: queryParams.grain,
      startDate: queryParams.startDate,
      endDate: queryParams.endDate,
      preset: queryParams.preset,
    });

    const loadLiveWidgets = async () => {
      setIsLoadingLiveReport(true);
      setLiveReportError(null);

      const [
        portfolioResult,
        kpisResult,
        funnelResult,
        timelineResult,
        typeResult,
        topResult,
        categoryResult,
      ] = await Promise.allSettled([
        offerReportsService.getPortfolio(params),
        offerReportsService.getKpis(params),
        offerReportsService.getFunnel(params),
        offerReportsService.getTimeline(params),
        offerReportsService.getTypeComparison(params),
        offerReportsService.getTopOffers({ ...params, metric: "revenue", limit: 8, pageSize: 8 }),
        offerReportsService.getByCategory(params),
      ]);
      if (cancelled) return;

      const portfolio = normalizeOfferPortfolio(settledValue(portfolioResult));
      const merged = mergeSplitOfferWidgets({
        kpis: settledValue(portfolioResult) || settledValue(kpisResult),
        funnel: settledValue(funnelResult),
        timeline: settledValue(timelineResult),
        byType: settledValue(typeResult),
      });
      setLiveReport({
        ...portfolio,
        ...merged,
        summary: merged.summary || portfolio.summary,
        heroTrends: merged.heroTrends || portfolio.heroTrends,
        meta: portfolio.meta || merged.meta,
      });
      setTopOffers(unwrapOfferTable(settledValue(topResult)).rows);
      setCategoryRows(unwrapOfferCategories(settledValue(categoryResult)));

      if (!offerPortfolioHasWidgets(merged) && !offerPortfolioHasWidgets(portfolio)) {
        const errors = [
          settledError(portfolioResult, "Failed to load offer portfolio."),
          settledError(kpisResult, "Failed to load offer KPIs."),
          settledError(funnelResult, "Failed to load redemption funnel."),
          settledError(timelineResult, "Failed to load redemption timeline."),
          settledError(typeResult, "Failed to load offer type comparison."),
        ].filter(Boolean) as string[];
        if (errors.length) {
          setLiveReportError(
            extractBackendError(errors[0], "Failed to load Offer Reports."),
          );
        }
      }
      setIsLoadingLiveReport(false);
    };

    loadLiveWidgets();
    return () => {
      cancelled = true;
    };
  }, [
    useDummyData,
    queryParams.range,
    queryParams.grain,
    queryParams.startDate,
    queryParams.endDate,
    queryParams.preset,
    activeRangeKey,
    dataEpoch,
  ]);

  useEffect(() => {
    if (useDummyData) return;

    let cancelled = false;
    const loadLiveTable = async () => {
      try {
        setIsLoadingLiveTable(true);
        setLiveTableError(null);
        const response = await offerReportsService.getOffersTable(
          buildOfferReportParams({
            range: overviewQueryParams.range || "30d",
            grain: overviewQueryParams.grain,
            startDate: overviewQueryParams.startDate,
            endDate: overviewQueryParams.endDate,
            preset: overviewQueryParams.preset,
            page: tablePage,
            pageSize: tablePageSize,
            search: debouncedTableQuery.trim() || undefined,
            status: statusFilter,
            sortBy: "conversions",
            sortOrder: "desc",
          }),
        );
        if (cancelled) return;
        if (response.success) {
          const table = unwrapOfferTable(response);
          setLiveTableRows(table.rows);
          setLiveTableTotal(table.total);
        } else {
          setLiveTableRows([]);
          setLiveTableTotal(0);
          setLiveTableError(response.error || response.message || "Failed to load offer table");
        }
      } catch (error) {
        if (cancelled) return;
        setLiveTableRows([]);
        setLiveTableTotal(0);
        setLiveTableError(extractBackendError(error, "Failed to load offer table."));
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
    overviewQueryParams.range,
    overviewQueryParams.grain,
    overviewQueryParams.startDate,
    overviewQueryParams.endDate,
    overviewQueryParams.preset,
    tablePage,
    tablePageSize,
    debouncedTableQuery,
    statusFilter,
    dataEpoch,
  ]);

  // Scale summary data based on actual date range
  const baseSummary = combinedSummary[activeRangeKey];
  const summary = useMemo(() => {
    if (!useDummyData) {
      return {
        ...EMPTY_SUMMARY,
        ...liveReport?.summary,
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
      redemptionRate: baseSummary.redemptionRate,
      roi: baseSummary.roi,
    };
  }, [baseSummary, scaleFactor, useDummyData, liveReport]);

  const heroCards = [
    {
      label: "Total Redemptions",
      value: summary.totalRedemptions.toLocaleString("en-US"),
      subtext: "Total offers used by customers",
      icon: statIcons.users,
      trend: useDummyData
        ? { value: "+12.8%", direction: "up" as const }
        : resolveHeroTrend(liveReport?.heroTrends?.totalRedemptions),
    },
    {
      label: "Redemption Rate",
      value: `${summary.redemptionRate.toFixed(1)}%`,
      subtext: "Customers who used promotions",
      icon: statIcons.growth,
      trend: useDummyData
        ? { value: "+0.6 pts", direction: "up" as const }
        : resolveHeroTrend(liveReport?.heroTrends?.redemptionRate),
    },
    {
      label: "Revenue Generated",
      value: formatCurrencyAmount(summary.revenueGenerated),
      subtext: "Total sales from promotions",
      icon: statIcons.revenue,
      trend: useDummyData
        ? { value: "+156K", direction: "up" as const }
        : resolveHeroTrend(liveReport?.heroTrends?.revenueGenerated),
    },
    {
      label: "Incremental Revenue",
      value: formatCurrencyAmount(summary.incrementalRevenue),
      subtext: "New revenue created",
      icon: statIcons.sparkles,
      trend: useDummyData
        ? { value: "+42K", direction: "up" as const }
        : resolveHeroTrend(liveReport?.heroTrends?.incrementalRevenue),
    },
    {
      label: "Total Cost",
      value: formatCurrencyAmount(summary.totalCost),
      subtext: "Total discount cost",
      icon: statIcons.coins,
      trend: useDummyData
        ? { value: "+18K", direction: "up" as const }
        : resolveHeroTrend(liveReport?.heroTrends?.totalCost),
    },
    {
      label: "ROI",
      value: `${summary.roi.toFixed(1)}x`,
      subtext: "Revenue per dollar spent",
      icon: statIcons.growth,
      trend: useDummyData
        ? { value: "+0.2x", direction: "up" as const }
        : resolveHeroTrend(liveReport?.heroTrends?.roi),
    },
  ];

  // Scale chart data based on actual date range
  const funnelSeries = useMemo(() => {
    if (!useDummyData) {
      return liveReport?.redemptionFunnel || [];
    }
    const base = funnelData[activeRangeKey];
    if (scaleFactor === 1) return base;
    return base.map((point) => ({
      ...point,
      value: Math.round(point.value * scaleFactor),
    }));
  }, [activeRangeKey, scaleFactor, useDummyData, liveReport]);

  const timelineSeries = useMemo(() => {
    const window = {
      startDate: queryParams.startDate,
      endDate: queryParams.endDate,
      grain: queryParams.grain,
    };
    if (!useDummyData) {
      return alignTrendSeries(liveReport?.redemptionTimeline || [], window);
    }
    return alignTrendSeries(
      redemptionTimelineData[dummyTemplateRange(queryParams.grain || "daily")],
      window,
    );
  }, [
    useDummyData,
    liveReport,
    queryParams.startDate,
    queryParams.endDate,
    queryParams.grain,
  ]);

  const timelineComparison = useMemo(
    () => (useDummyData ? dummyPreviousPeriod(timelineSeries) : undefined),
    [timelineSeries, useDummyData],
  );

  const offerTypeComparison = useMemo(() => {
    if (!useDummyData) {
      return liveReport?.offerTypeComparison || [];
    }
    const base = offerTypeData[activeRangeKey];
    if (scaleFactor === 1) return base;
    return base.map((point) => ({
      ...point,
      redemptionRate: point.redemptionRate,
      aov: point.aov,
      marginPercent: point.marginPercent,
      incrementalRevenue: Math.round(point.incrementalRevenue * scaleFactor),
    }));
  }, [activeRangeKey, scaleFactor, useDummyData, liveReport]);

  const mapReportRow = (row: OfferRow): OfferTableRow => {
    const lastUpdated = formatOfferReportDate(row.lastUpdated);
    const parsedUpdated = row.lastUpdated ? new Date(row.lastUpdated) : null;
    const lastUpdatedDate =
      parsedUpdated &&
      !Number.isNaN(parsedUpdated.getTime()) &&
      parsedUpdated.getFullYear() >= 2010
        ? parsedUpdated.getTime()
        : undefined;
    return {
      id: `offer-${row.id}`,
      offerName: row.offerName,
      status: row.status ?? "Active",
      targetGroup: row.targetGroup,
      controlGroup: row.controlGroup,
      messagesGenerated: row.messagesGenerated,
      sent: row.sent,
      delivered: row.delivered,
      conversions: row.conversions,
      lastUpdated,
      lastUpdatedDate,
      revenue: row.revenue,
      cost: row.cost,
    };
  };

  const offerTableRows = useMemo(() => {
    if (!useDummyData) {
      return liveTableRows.map(mapReportRow);
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
  }, [offers, useDummyData, liveTableRows]);

  const rankedOffers = useMemo(() => {
    if (!useDummyData) return topOffers;
    return [...offerTableRows]
      .sort((left, right) => (right.conversions || 0) - (left.conversions || 0))
      .slice(0, 8)
      .map((row) => ({
        id: getOfferRowId(row) || row.id,
        offerName: row.offerName,
        campaignName: "",
        segment: "",
        status: row.status,
        targetGroup: row.targetGroup,
        controlGroup: row.controlGroup,
        messagesGenerated: row.messagesGenerated,
        sent: row.sent,
        delivered: row.delivered,
        conversions: row.conversions,
        lastUpdated: row.lastUpdated,
        revenue: row.revenue,
        cost: row.cost,
      }));
  }, [useDummyData, topOffers, offerTableRows]);

  const categorySeries = useMemo(() => {
    if (!useDummyData) return categoryRows;
    return dummyCategoryData[activeRangeKey] || [];
  }, [useDummyData, categoryRows, activeRangeKey]);

  const handleFilteredCountChange = (_count: number) => {
    // Updates when filters applied in the Table component
  };

  const filteredRows = useMemo(() => {
    if (!useDummyData) return offerTableRows;

    const query = tableQuery.trim().toLowerCase();
    const startDate = parseISODate(overviewWindow.bounds.start);
    const endDate = parseISODate(overviewWindow.bounds.end);
    const startMs = startDate?.getTime() ?? 0;
    const endMs = endDate ? endDate.getTime() + 24 * 60 * 60 * 1000 - 1 : Date.now();

    return offerTableRows.filter((row) => {
      const matchesStatus =
        statusFilter === "All Statuses" ? true : row.status === statusFilter;
      const matchesQuery = query
        ? row.offerName.toLowerCase().includes(query)
        : true;
      const rowDate = row.lastUpdatedDate || Date.now();
      const matchesRange = rowDate >= startMs && rowDate <= endMs;
      return matchesStatus && matchesQuery && matchesRange;
    });
  }, [
    useDummyData,
    statusFilter,
    tableQuery,
    overviewWindow.bounds.start,
    overviewWindow.bounds.end,
    offerTableRows,
  ]);

  useEffect(() => {
    setTablePage(1);
  }, [
    debouncedTableQuery,
    statusFilter,
    overviewWindow.bounds.start,
    overviewWindow.bounds.end,
    useDummyData,
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
            <>
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
              {!useDummyData && (
                <button
                  type="button"
                  onClick={handleRefreshSnapshots}
                  disabled={isRefreshingSnapshots}
                  className={`inline-flex items-center gap-2 ${tw.rounded} border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:border-gray-300 disabled:opacity-60`}
                  title="Rebuild daily offer performance snapshots from live events"
                >
                  <RefreshCw className={`h-4 w-4 ${isRefreshingSnapshots ? "animate-spin" : ""}`} />
                  {isRefreshingSnapshots ? "Refreshing…" : "Refresh snapshots"}
                </button>
              )}
            </>
          }
        />
      </div>

      {liveReportError && !useDummyData && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {liveReportError}
        </div>
      )}
      {!useDummyData && liveReport?.meta?.source && (
        <p className="text-xs text-gray-500">
          Showing {liveReport.meta.source === "snapshot" ? "daily snapshots" : "live events"}
          {liveReport.meta.startDate && liveReport.meta.endDate
            ? ` for ${liveReport.meta.startDate} – ${liveReport.meta.endDate}`
            : ""}
          {liveReport.meta.warning ? `. ${liveReport.meta.warning}` : ""}
        </p>
      )}

      {/* Hero KPI Cards */}
      {!isTrendsView && (
      <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {heroCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm`}
            >
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <Icon
                    className="h-5 w-5"
                    style={{ color: colors.primary.accent }}
                  />
                  <p className="text-sm font-medium text-gray-600">
                    {card.label}
                  </p>
                </div>
                <span
                  className={`text-xs font-semibold ${
                    card.trend.direction === "up"
                      ? "text-emerald-600"
                      : card.trend.direction === "down"
                        ? "text-red-600"
                        : "text-gray-500"
                  }`}
                >
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
      </section>
      )}

      {!isTrendsView && (
      <section className="grid gap-6 lg:grid-cols-2">
        <ReportChartCard
          title="Offer Performance Stages"
          subtitle="Customer journey from exposure to redemption"
          filename="offer-performance-stages.csv"
          audit={overviewAudit}
          columns={[
            { key: "stage", label: "Stage" },
            { key: "value", label: "Users" },
          ]}
          rows={funnelSeries}
        >
          {!useDummyData && !isLoadingLiveReport && !seriesHasActivity(funnelSeries) ? (
            <div className="flex h-full items-center justify-center text-sm text-gray-500">
              {funnelSeries.length
                ? "No customers entered the offer funnel in this window."
                : "No redemption stages in this window."}
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={funnelSeries}
                margin={{ top: 20, right: 24, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="stage" tick={{ fill: "#6b7280" }} />
                <YAxis allowDecimals={false} tick={{ fill: "#6b7280" }} />
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
          )}
        </ReportChartCard>

        <ReportChartCard
          title="Offer Type Comparison"
          subtitle="Performance across offer types"
          filename="offer-type-comparison.csv"
          audit={overviewAudit}
          columns={[
            { key: "type", label: "Type" },
            { key: "redemptionRate", label: "Redemption Rate %" },
            { key: "aov", label: "Avg Transaction Value" },
          ]}
          rows={offerTypeComparison}
        >
          {!useDummyData && !isLoadingLiveReport && !typeComparisonHasRows(offerTypeComparison) ? (
            <div className="flex h-full items-center justify-center text-sm text-gray-500">
              No offer types with activity in this window.
            </div>
          ) : (
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
                    value: "Avg Transaction Value",
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
                  name="Avg Transaction Value"
                  fill={
                    colors.reportCharts.offerReports.offerTypeComparison
                      .avgTransactionValue
                  }
                  maxBarSize={40}
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ReportChartCard>
      </section>
      )}

      {isTrendsView && (
      <section>
        <ReportChartCard
          title="Redemption Timeline"
          subtitle="Redemption volume over the selected period"
          filename="offer-redemption-timeline.csv"
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
                color:
                  colors.reportCharts.offerReports.redemptionTimeline.redemptions,
              },
              {
                dataKey: "cumulativeRedemptions",
                name: "Cumulative",
                color:
                  colors.reportCharts.offerReports.redemptionTimeline.cumulative,
              },
            ]}
          />
        </ReportChartCard>
      </section>
      )}

      {!isTrendsView && (
      <>
      <section className="grid gap-6 lg:grid-cols-2">
        <div className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm`}>
          <h2 className="text-xl font-semibold text-gray-900">Performance by Category</h2>
          <p className="mt-1 text-sm text-gray-600">Revenue and conversions grouped by offer category</p>
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500">
                  <th className="py-2 pr-4 font-medium">Category</th>
                  <th className="py-2 pr-4 font-medium">Offers</th>
                  <th className="py-2 pr-4 font-medium">Conversions</th>
                  <th className="py-2 font-medium">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {categorySeries.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-gray-500">
                      No category performance in this window.
                    </td>
                  </tr>
                )}
                {categorySeries.map((row, index) => (
                  <tr key={`${row.category_id || row.category_name}-${index}`} className="border-t border-gray-100 text-gray-900">
                    <td className="py-2 pr-4">{row.category_name || "—"}</td>
                    <td className="py-2 pr-4">{Number(row.offer_count || 0).toLocaleString("en-US")}</td>
                    <td className="py-2 pr-4">{Number(row.total_conversions || 0).toLocaleString("en-US")}</td>
                    <td className="py-2">{formatCurrencyAmount(Number(row.total_revenue || 0))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm`}>
          <h2 className="text-xl font-semibold text-gray-900">Top Offers</h2>
          <p className="mt-1 text-sm text-gray-600">Highest-revenue offers in the selected window</p>
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500">
                  <th className="py-2 pr-4 font-medium">Offer</th>
                  <th className="py-2 pr-4 font-medium">Conversions</th>
                  <th className="py-2 font-medium">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {rankedOffers.length === 0 && (
                  <tr>
                    <td colSpan={3} className="py-6 text-center text-gray-500">
                      No top offers in this window.
                    </td>
                  </tr>
                )}
                {rankedOffers.map((row, index) => (
                  <tr key={`${row.id}-${index}`} className="border-t border-gray-100 text-gray-900">
                    <td className="py-2 pr-4">{row.offerName || "—"}</td>
                    <td className="py-2 pr-4">{Number(row.conversions || 0).toLocaleString("en-US")}</td>
                    <td className="py-2">{formatCurrencyAmount(Number(row.revenue || 0))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
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

        {useDummyData ? (
          <>
            {isLoadingOffers && (
              <div className="flex justify-center py-16">
                <LoadingSpinner />
              </div>
            )}
            {!isLoadingOffers && offerFetchError && (
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
            {!isLoadingOffers && !offerFetchError && (
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
                {filteredRows.length === 0 && (
                  <div className="py-10 text-center text-sm text-gray-500">
                    No offers match your filters yet.
                  </div>
                )}
              </>
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
                <Table<OfferTableRow>
                  columns={tableColumnsMemo}
                  data={filteredRows}
                  totalItems={liveTableTotal}
                  currentPage={tablePage}
                  pageSize={tablePageSize}
                  isLoading={isLoadingLiveTable}
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
