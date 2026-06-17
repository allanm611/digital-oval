import { useMemo, useState, useEffect, useCallback, useRef } from "react";
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
  ComposedChart,
  Cell,
} from "recharts";
import { useLanguage } from "../../../contexts/LanguageContext";
import { extractBackendError } from "../../../shared/utils/errorHandler";;;
import {
  Users2,
  TrendingUp,
  Target,
  Activity,
} from "lucide-react";
import { getSettingsTimezoneOffset } from "../../../shared/utils/settingsHelper";
import { formatDateWithTimezone } from "../../../shared/services/dateService";
import { colors } from "../../../shared/utils/tokens";
import HeadlessSelect from "../../../shared/components/ui/HeadlessSelect";
import Pagination, { DEFAULT_PAGE_SIZE, getInitialPageSize } from "../../../shared/components/ui/Pagination";
import CsvDownloadButton from "../../../shared/components/CsvDownloadButton";
import LoadingSpinner from "../../../shared/components/ui/LoadingSpinner";
import { tw } from "../../../shared/utils/utils";
import Input from "../../../shared/components/ui/Input";
import { useToast } from "../../../contexts/ToastContext";
import type { RangeOption } from "../types/ReportsAPI";
import { segmentService } from "../../segments/services/segmentService";
import type { SegmentType } from "../../segments/types/segment";
import { Table } from "../../../shared/components/Table/Table";
import { useTable } from "../../../shared/components/Table/useTable";
import type { TableColumn } from "../../../shared/components/Table/types";

// Types
type SegmentSummary = {
  totalSegments: number;
  totalMembers: number;
  avgMemberGrowth: number;
  activeInCampaigns: number;
  engagementRate: number;
  conversionRate: number;
};

type MemberGrowthPoint = {
  period: string;
  members: number;
  cumulativeMembers: number;
};

type SegmentSizePoint = {
  segmentName: string;
  members: number;
  fill?: string;
};

type CampaignUsagePoint = {
  segmentName: string;
  campaigns: number;
  fill?: string;
};

type PerformanceComparisonPoint = {
  segmentName: string;
  engagement: number;
  conversion: number;
};

type SegmentRow = {
  id: string;
  name: string;
  memberCount: number;
  growthRate: number;
  campaignsUsed: number;
  engagementRate: number;
  conversionRate: number;
  avgValue: number;
  status: "Active" | "Inactive";
  lastUpdated: string;
  lastUpdatedDate: number;
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

// Dummy data
const segmentSummary: Record<RangeOption, SegmentSummary> = {
  "7d": {
    totalSegments: 24,
    totalMembers: 145_000,
    avgMemberGrowth: 3.2,
    activeInCampaigns: 18,
    engagementRate: 18.5,
    conversionRate: 4.2,
  },
  "30d": {
    totalSegments: 24,
    totalMembers: 415_000,
    avgMemberGrowth: 8.7,
    activeInCampaigns: 22,
    engagementRate: 21.3,
    conversionRate: 5.8,
  },
  "90d": {
    totalSegments: 24,
    totalMembers: 980_000,
    avgMemberGrowth: 15.4,
    activeInCampaigns: 24,
    engagementRate: 24.1,
    conversionRate: 6.9,
  },
};

const memberGrowthData: Record<RangeOption, MemberGrowthPoint[]> = {
  "7d": [
    { period: "Mon", members: 18_500, cumulativeMembers: 18_500 },
    { period: "Tue", members: 21_200, cumulativeMembers: 39_700 },
    { period: "Wed", members: 24_100, cumulativeMembers: 63_800 },
    { period: "Thu", members: 19_800, cumulativeMembers: 83_600 },
    { period: "Fri", members: 22_500, cumulativeMembers: 106_100 },
    { period: "Sat", members: 18_900, cumulativeMembers: 125_000 },
    { period: "Sun", members: 20_000, cumulativeMembers: 145_000 },
  ],
  "30d": [
    { period: "Week 1", members: 95_000, cumulativeMembers: 95_000 },
    { period: "Week 2", members: 105_000, cumulativeMembers: 200_000 },
    { period: "Week 3", members: 110_000, cumulativeMembers: 310_000 },
    { period: "Week 4", members: 105_000, cumulativeMembers: 415_000 },
  ],
  "90d": [
    { period: "September", members: 310_000, cumulativeMembers: 310_000 },
    { period: "October", members: 345_000, cumulativeMembers: 655_000 },
    { period: "November", members: 325_000, cumulativeMembers: 980_000 },
  ],
};

const segmentSizeDistributionData: Record<RangeOption, SegmentSizePoint[]> = {
  "7d": [
    { segmentName: "New Customers", members: 28_500 },
    { segmentName: "Active Shoppers", members: 35_200 },
    { segmentName: "High Value", members: 22_100 },
    { segmentName: "Cart Abandoners", members: 18_800 },
    { segmentName: "VIP Customers", members: 12_500 },
    { segmentName: "Regular Customers", members: 27_900 },
  ],
  "30d": [
    { segmentName: "New Customers", members: 82_500 },
    { segmentName: "Active Shoppers", members: 105_200 },
    { segmentName: "High Value", members: 64_100 },
    { segmentName: "Cart Abandoners", members: 52_800 },
    { segmentName: "VIP Customers", members: 38_500 },
    { segmentName: "Regular Customers", members: 71_900 },
  ],
  "90d": [
    { segmentName: "New Customers", members: 215_000 },
    { segmentName: "Active Shoppers", members: 268_000 },
    { segmentName: "High Value", members: 168_000 },
    { segmentName: "Cart Abandoners", members: 142_000 },
    { segmentName: "VIP Customers", members: 105_000 },
    { segmentName: "Regular Customers", members: 182_000 },
  ],
};

const campaignUsageData: Record<RangeOption, CampaignUsagePoint[]> = {
  "7d": [
    { segmentName: "New Customers", campaigns: 8 },
    { segmentName: "Active Shoppers", campaigns: 12 },
    { segmentName: "High Value", campaigns: 10 },
    { segmentName: "Cart Abandoners", campaigns: 7 },
    { segmentName: "VIP Customers", campaigns: 9 },
    { segmentName: "Regular Customers", campaigns: 6 },
  ],
  "30d": [
    { segmentName: "New Customers", campaigns: 24 },
    { segmentName: "Active Shoppers", campaigns: 32 },
    { segmentName: "High Value", campaigns: 28 },
    { segmentName: "Cart Abandoners", campaigns: 19 },
    { segmentName: "VIP Customers", campaigns: 26 },
    { segmentName: "Regular Customers", campaigns: 18 },
  ],
  "90d": [
    { segmentName: "New Customers", campaigns: 68 },
    { segmentName: "Active Shoppers", campaigns: 89 },
    { segmentName: "High Value", campaigns: 76 },
    { segmentName: "Cart Abandoners", campaigns: 54 },
    { segmentName: "VIP Customers", campaigns: 71 },
    { segmentName: "Regular Customers", campaigns: 52 },
  ],
};

const performanceComparisonData: Record<RangeOption, PerformanceComparisonPoint[]> = {
  "7d": [
    { segmentName: "New Customers", engagement: 15.2, conversion: 3.1 },
    { segmentName: "Active Shoppers", engagement: 28.5, conversion: 6.4 },
    { segmentName: "High Value", engagement: 35.2, conversion: 8.2 },
    { segmentName: "Cart Abandoners", engagement: 22.1, conversion: 4.8 },
    { segmentName: "VIP Customers", engagement: 42.8, conversion: 10.1 },
    { segmentName: "Regular Customers", engagement: 18.5, conversion: 3.9 },
  ],
  "30d": [
    { segmentName: "New Customers", engagement: 18.2, conversion: 3.8 },
    { segmentName: "Active Shoppers", engagement: 31.5, conversion: 7.2 },
    { segmentName: "High Value", engagement: 38.2, conversion: 9.1 },
    { segmentName: "Cart Abandoners", engagement: 24.1, conversion: 5.3 },
    { segmentName: "VIP Customers", engagement: 45.8, conversion: 11.2 },
    { segmentName: "Regular Customers", engagement: 21.5, conversion: 4.6 },
  ],
  "90d": [
    { segmentName: "New Customers", engagement: 21.2, conversion: 4.5 },
    { segmentName: "Active Shoppers", engagement: 34.5, conversion: 8.1 },
    { segmentName: "High Value", engagement: 41.2, conversion: 10.2 },
    { segmentName: "Cart Abandoners", engagement: 26.1, conversion: 5.9 },
    { segmentName: "VIP Customers", engagement: 48.8, conversion: 12.4 },
    { segmentName: "Regular Customers", engagement: 24.5, conversion: 5.3 },
  ],
};

const statusOptions = ["All Statuses", "Active", "Inactive"];

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
  segments: Users2,
  members: Users2,
  growth: TrendingUp,
  campaigns: Target,
  engagement: Activity,
};

export default function SegmentReportsPage() {
  const { t } = useLanguage();
  const { error: showError } = useToast();
  const [tableQuery, setTableQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All Statuses");
  const [selectedRange, setSelectedRange] = useState<RangeOption>("7d");
  const [customRange, setCustomRange] = useState({ start: "", end: "" });
  const [appliedCustomRange, setAppliedCustomRange] = useState({
    start: "",
    end: "",
  });
  const [useDummyData, setUseDummyData] = useState(true);
  const [tablePage, setTablePage] = useState(1);
  const [tablePageSize, setTablePageSize] = useState(getInitialPageSize());
  const [clearFiltersKey, setClearFiltersKey] = useState(0);

  const tableColumns: TableColumn<SegmentRow>[] = [
    {
      id: "name",
      label: "Segment Name",
      visible: true,
      sortable: true,
      filterConfig: { type: "text" },
    },
    {
      id: "memberCount",
      label: "Members",
      visible: true,
      sortable: true,
      filterConfig: { type: "number" },
      render: (value: number) => value.toLocaleString("en-US"),
    },
    {
      id: "growthRate",
      label: "Growth Rate",
      visible: true,
      sortable: true,
      filterConfig: { type: "number" },
      render: (value: number) => `${value >= 0 ? "+" : ""}${value.toFixed(1)}%`,
    },
    {
      id: "campaignsUsed",
      label: "Campaigns Used",
      visible: true,
      sortable: true,
      filterConfig: { type: "number" },
    },
    {
      id: "engagementRate",
      label: "Engagement Rate",
      visible: true,
      sortable: true,
      filterConfig: { type: "number" },
      render: (value: number) => `${value.toFixed(1)}%`,
    },
    {
      id: "conversionRate",
      label: "Conversion Rate",
      visible: true,
      sortable: true,
      filterConfig: { type: "number" },
      render: (value: number) => `${value.toFixed(1)}%`,
    },
    {
      id: "avgValue",
      label: "Avg Value",
      visible: true,
      sortable: true,
      filterConfig: { type: "number" },
      render: (value: number) => `${value.toFixed(2)}`,
    },
    {
      id: "status",
      label: "Status",
      visible: true,
      sortable: true,
      filterConfig: { type: "select", options: ["Active", "Inactive"] },
    },
    {
      id: "lastUpdated",
      label: "Last Updated",
      visible: true,
      sortable: true,
    },
  ];

  const { columns: tableColumnsMemo, handlePageSizeChange: tableHandlePageSizeChange } = useTable({
    tableId: "segment-reports-table",
    defaultColumns: tableColumns,
    defaultPageSize: DEFAULT_PAGE_SIZE,
  });

  // Real segment data state
  const [segments, setSegments] = useState<SegmentType[]>([]);
  const [isLoadingSegments, setIsLoadingSegments] = useState(false);
  const [segmentFetchError, setSegmentFetchError] = useState<string | null>(null);
  const [totalSegmentsCount, setTotalSegmentsCount] = useState(0);
  const searchDebounceRef = useRef<NodeJS.Timeout | null>(null);

  const { minDate, maxDate } = getDateConstraints();

  // Fetch segments with optional search
  const fetchSegments = useCallback(
    async (query: string = "") => {
      try {
        setIsLoadingSegments(true);
        setSegmentFetchError(null);

        let response;
        if (query.trim()) {
          // Use search endpoint when there's a query
          response = await segmentService.searchSegments({
            q: query,
            skipCache: true,
          });
        } else {
          // Use get endpoint for initial load
          response = await segmentService.getSegments({
            skipCache: true,
          });
        }

        if (response?.data && Array.isArray(response.data)) {
          setSegments(response.data);
          setTotalSegmentsCount(response.pagination?.total || response.data.length);
        } else {
          setSegments([]);
          setTotalSegmentsCount(0);
        }
      } catch (err) {
        console.error("Error fetching segments:", err);
        setSegmentFetchError("Failed to load segments");
        setSegments([]);
      } finally {
        setIsLoadingSegments(false);
      }
    },
    [],
  );

  // Debounced search
  const handleSearch = useCallback(
    (query: string) => {
      setTableQuery(query);
      setTablePage(1);

      if (searchDebounceRef.current) {
        clearTimeout(searchDebounceRef.current);
      }

      searchDebounceRef.current = setTimeout(() => {
        fetchSegments(query);
      }, 150);
    },
    [fetchSegments],
  );

  // Load segments on mount
  useEffect(() => {
    fetchSegments();
  }, [fetchSegments]);

  const handleFilteredCountChange = (count: number) => {
    // Updates when filters applied in the Table component
  };

  const customDays = useMemo(
    () => getDaysBetween(appliedCustomRange.start, appliedCustomRange.end),
    [appliedCustomRange.start, appliedCustomRange.end],
  );

  const activeRangeKey: RangeOption = useMemo(() => {
    if (appliedCustomRange.start && appliedCustomRange.end && customDays) {
      return mapDaysToRange(customDays);
    }
    return selectedRange;
  }, [selectedRange, appliedCustomRange, customDays]);

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

  const baseSummary = segmentSummary[activeRangeKey];
  const summary = useMemo(() => {
    if (!useDummyData) {
      return {
        totalSegments: 0,
        totalMembers: 0,
        avgMemberGrowth: 0,
        activeInCampaigns: 0,
        engagementRate: 0,
        conversionRate: 0,
      };
    }
    if (scaleFactor === 1) return baseSummary;
    return {
      ...baseSummary,
      totalMembers: Math.round(baseSummary.totalMembers * scaleFactor),
      activeInCampaigns: Math.round(baseSummary.activeInCampaigns * scaleFactor),
      avgMemberGrowth: baseSummary.avgMemberGrowth,
      engagementRate: baseSummary.engagementRate,
      conversionRate: baseSummary.conversionRate,
      totalSegments: baseSummary.totalSegments,
    };
  }, [baseSummary, scaleFactor, useDummyData]);

  const heroCards = useDummyData
    ? [
        {
          label: "Total Segments",
          value: summary.totalSegments.toString(),
          subtext: "Active segments in the system",
          icon: statIcons.segments,
          trend: { value: "+2", direction: "up" as const },
        },
        {
          label: "Total Members",
          value: summary.totalMembers.toLocaleString("en-US"),
          subtext: "Combined members across all segments",
          icon: statIcons.members,
          trend: { value: "+28K", direction: "up" as const },
        },
        {
          label: "Avg Member Growth",
          value: `${summary.avgMemberGrowth.toFixed(1)}%`,
          subtext: "Average growth rate",
          icon: statIcons.growth,
          trend: { value: "+2.1 pts", direction: "up" as const },
        },
        {
          label: "Active in Campaigns",
          value: summary.activeInCampaigns.toString(),
          subtext: "Segments used in campaigns",
          icon: statIcons.campaigns,
          trend: { value: "+4", direction: "up" as const },
        },
        {
          label: "Engagement Rate",
          value: `${summary.engagementRate.toFixed(1)}%`,
          subtext: "Average engagement",
          icon: statIcons.engagement,
          trend: { value: "+3.2 pts", direction: "up" as const },
        },
      ]
    : [
        {
          label: "Total Segments",
          value: "0",
          subtext: "Active segments in the system",
          icon: statIcons.segments,
          trend: { value: "—", direction: "up" as const },
        },
        {
          label: "Total Members",
          value: "0",
          subtext: "Combined members across all segments",
          icon: statIcons.members,
          trend: { value: "—", direction: "up" as const },
        },
        {
          label: "Avg Member Growth",
          value: "0.0%",
          subtext: "Average growth rate",
          icon: statIcons.growth,
          trend: { value: "—", direction: "up" as const },
        },
        {
          label: "Active in Campaigns",
          value: "0",
          subtext: "Segments used in campaigns",
          icon: statIcons.campaigns,
          trend: { value: "—", direction: "up" as const },
        },
        {
          label: "Engagement Rate",
          value: "0.0%",
          subtext: "Average engagement",
          icon: statIcons.engagement,
          trend: { value: "—", direction: "up" as const },
        },
      ];

  const memberGrowthSeries = useMemo(() => {
    if (!useDummyData) {
      return memberGrowthData[activeRangeKey].map((point) => ({
        ...point,
        members: 0,
        cumulativeMembers: 0,
      }));
    }
    const base = memberGrowthData[activeRangeKey];
    if (scaleFactor === 1) return base;
    return base.map((point) => ({
      ...point,
      members: Math.round(point.members * scaleFactor),
      cumulativeMembers: Math.round(point.cumulativeMembers * scaleFactor),
    }));
  }, [activeRangeKey, scaleFactor, useDummyData]);

  const segmentColors = [
    colors.reportCharts.segmentReports.sizeDistribution.segment1,
    colors.reportCharts.segmentReports.sizeDistribution.segment2,
    colors.reportCharts.segmentReports.sizeDistribution.segment3,
    colors.reportCharts.segmentReports.sizeDistribution.segment4,
    colors.reportCharts.segmentReports.sizeDistribution.segment5,
    colors.reportCharts.segmentReports.sizeDistribution.segment6,
  ];

  const sizeDistributionSeries = useMemo(() => {
    if (!useDummyData) {
      return segmentSizeDistributionData[activeRangeKey].map((point, idx) => ({
        ...point,
        members: 0,
        fill: segmentColors[idx % segmentColors.length],
      }));
    }
    const base = segmentSizeDistributionData[activeRangeKey];
    if (scaleFactor === 1) {
      return base.map((point, idx) => ({
        ...point,
        fill: segmentColors[idx % segmentColors.length],
      }));
    }
    return base.map((point, idx) => ({
      ...point,
      members: Math.round(point.members * scaleFactor),
      fill: segmentColors[idx % segmentColors.length],
    }));
  }, [activeRangeKey, scaleFactor, useDummyData]);

  const campaignColors = [
    colors.reportCharts.segmentReports.campaignUsage.bar1,
    colors.reportCharts.segmentReports.campaignUsage.bar2,
    colors.reportCharts.segmentReports.campaignUsage.bar3,
    colors.reportCharts.segmentReports.campaignUsage.bar4,
    colors.reportCharts.segmentReports.campaignUsage.bar5,
    colors.reportCharts.segmentReports.campaignUsage.bar6,
  ];

  const campaignUsageSeries = useMemo(() => {
    if (!useDummyData) {
      return campaignUsageData[activeRangeKey].map((point, idx) => ({
        ...point,
        campaigns: 0,
        fill: campaignColors[idx % campaignColors.length],
      }));
    }
    return campaignUsageData[activeRangeKey].map((point, idx) => ({
      ...point,
      fill: campaignColors[idx % campaignColors.length],
    }));
  }, [activeRangeKey, useDummyData]);

  const performanceComparison = useMemo(() => {
    if (!useDummyData) {
      return performanceComparisonData[activeRangeKey].map((point) => ({
        ...point,
        engagement: 0,
        conversion: 0,
      }));
    }
    return performanceComparisonData[activeRangeKey];
  }, [activeRangeKey, useDummyData]);

  // Convert real segments to table row format with dummy data for other columns
  const segmentTableRows = useMemo(() => {
    return segments.map((segment, index) => ({
      id: String(segment.id),
      name: segment.name || "Unknown",
      memberCount: Math.floor(Math.random() * 500000) + 10000, // Dummy data
      growthRate: -5 + Math.random() * 25, // Dummy data
      campaignsUsed: Math.floor(Math.random() * 15) + 2, // Dummy data
      engagementRate: 5 + Math.random() * 50, // Dummy data
      conversionRate: 1 + Math.random() * 15, // Dummy data
      avgValue: 50 + Math.random() * 1000, // Dummy data
      status: index % 3 === 0 ? "Inactive" : "Active", // Dummy data (deterministic for consistency)
      lastUpdated: segment.updated_at
        ? formatDateWithTimezone(segment.updated_at, getSettingsTimezoneOffset())
        : "—",
      lastUpdatedDate: segment.updated_at
        ? new Date(segment.updated_at).getTime()
        : Date.now(),
    }));
  }, [segments]);

  const filteredRows = useMemo(() => {
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

    return segmentTableRows.filter((row) => {
      const matchesStatus =
        statusFilter === "All Statuses" ? true : row.status === statusFilter;
      const rowDate = row.lastUpdatedDate || Date.now();
      const now = Date.now();
      const matchesRange =
        appliedCustomRange.start && appliedCustomRange.end && startMs && endMs
          ? rowDate >= startMs && rowDate <= endMs
          : now - rowDate <= maxDays * 24 * 60 * 60 * 1000;
      return matchesStatus && matchesRange;
    });
  }, [
    statusFilter,
    customRange,
    customDays,
    selectedRange,
    appliedCustomRange,
    segmentTableRows,
  ]);

  useEffect(() => {
    setTablePage(1);
  }, [tableQuery, statusFilter, appliedCustomRange.start]);

  const csvHeaders = [
    "Segment Name",
    "Members",
    "Growth Rate",
    "Campaigns Used",
    "Engagement Rate",
    "Conversion Rate",
    "Avg Value",
    "Status",
    "Last Updated",
  ];

  const csvRows = filteredRows.map((row) => [
    row.name,
    row.memberCount.toString(),
    `${row.growthRate.toFixed(1)}%`,
    row.campaignsUsed.toString(),
    `${row.engagementRate.toFixed(1)}%`,
    `${row.conversionRate.toFixed(1)}%`,
    `$${row.avgValue.toFixed(2)}`,
    row.status,
    row.lastUpdated,
  ]);

  const handleRun = () => {
    if (customRange.start && customRange.end) {
      setAppliedCustomRange(customRange);
    } else {
      showError("Please select both start and end dates");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Segment Reports</h1>
          <p className="mt-2 text-base text-gray-600">
            Track segment performance, member growth, and engagement metrics
            across all audience segments
          </p>
        </div>

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
                className={`${tw.rounded} border px-3 py-1.5 text-sm font-medium transition-colors ${
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
            <div
              className={`flex items-center gap-2 ${tw.rounded} border border-gray-200 bg-white px-3 py-1.5`}
            >
              <label
                htmlFor="segment-data-toggle"
                className="text-sm font-medium text-gray-700 whitespace-nowrap mr-2"
              >
                Data Mode:
              </label>
              <button
                id="segment-data-toggle"
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
                htmlFor="segment-date-start"
                className="text-sm font-medium text-gray-700 whitespace-nowrap"
              >
                From:
              </label>
              <Input
                id="segment-date-start"
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
                htmlFor="segment-date-end"
                className="text-sm font-medium text-gray-700 whitespace-nowrap"
              >
                To:
              </label>
              <Input
                id="segment-date-end"
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
      </div>

      {/* Hero KPI Cards */}
      <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
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

      {/* Charts Grid */}
      <section className="grid gap-6 lg:grid-cols-2">
        {/* Member Growth Timeline */}
        <div
          className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm`}
        >
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Member Growth Timeline
              </h2>
              <p className="mt-1 text-sm text-gray-600">
                Cumulative member growth over the selected period
              </p>
            </div>
          </div>
          <div className="mt-6 h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={memberGrowthSeries}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="period" tick={{ fill: "#6b7280" }} />
                <YAxis tick={{ fill: "#6b7280" }} />
                <Tooltip
                  content={<CustomTooltip />}
                  cursor={{ fill: "transparent" }}
                />
                <Legend iconType="circle" wrapperStyle={{ paddingTop: 12 }} />
                <Line
                  type="monotone"
                  dataKey="members"
                  name="Period Members"
                  stroke={colors.reportCharts.segmentReports.memberGrowth.members}
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
                <Line
                  type="monotone"
                  dataKey="cumulativeMembers"
                  name="Cumulative"
                  stroke={colors.reportCharts.segmentReports.memberGrowth.cumulative}
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Segment Size Distribution */}
        <div
          className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm`}
        >
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Segment Size Distribution
              </h2>
              <p className="mt-1 text-sm text-gray-600">
                Top segments by member count
              </p>
            </div>
          </div>
          <div className="mt-6 h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={sizeDistributionSeries}
                margin={{ top: 20, right: 24, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="segmentName"
                  angle={-45}
                  textAnchor="end"
                  height={100}
                  tick={{ fill: "#6b7280" }}
                />
                <YAxis tick={{ fill: "#6b7280" }} />
                <Tooltip
                  content={<CustomTooltip />}
                  cursor={{ fill: "transparent" }}
                />
                <Bar
                  dataKey="members"
                  name="Members"
                  maxBarSize={60}
                  radius={[4, 4, 0, 0]}
                >
                  {sizeDistributionSeries.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Campaign Usage */}
        <div
          className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm`}
        >
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Campaign Usage
              </h2>
              <p className="mt-1 text-sm text-gray-600">
                Number of active campaigns per segment
              </p>
            </div>
          </div>
          <div className="mt-6 h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={campaignUsageSeries}
                margin={{ top: 20, right: 24, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="segmentName"
                  angle={-45}
                  textAnchor="end"
                  height={100}
                  tick={{ fill: "#6b7280" }}
                />
                <YAxis tick={{ fill: "#6b7280" }} />
                <Tooltip
                  content={<CustomTooltip />}
                  cursor={{ fill: "transparent" }}
                />
                <Bar
                  dataKey="campaigns"
                  name="Campaigns"
                  maxBarSize={60}
                  radius={[4, 4, 0, 0]}
                >
                  {campaignUsageSeries.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Performance Comparison */}
        <div
          className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm`}
        >
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Performance Comparison
              </h2>
              <p className="mt-1 text-sm text-gray-600">
                Engagement and conversion rates by segment
              </p>
            </div>
          </div>
          <div className="mt-6 h-80">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={performanceComparison}
                margin={{ top: 20, right: 24, left: 0, bottom: 0 }}
                barCategoryGap="20%"
                barGap={4}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="segmentName"
                  angle={-45}
                  textAnchor="end"
                  height={100}
                  tick={{ fill: "#6b7280" }}
                />
                <YAxis tick={{ fill: "#6b7280" }} />
                <Tooltip
                  content={<CustomTooltip />}
                  cursor={{ fill: "transparent" }}
                />
                <Legend iconType="circle" wrapperStyle={{ paddingTop: 12 }} />
                <Bar
                  dataKey="engagement"
                  name="Engagement %"
                  fill={colors.reportCharts.segmentReports.performanceComparison.engagement}
                  radius={[4, 4, 0, 0]}
                  maxBarSize={25}
                />
                <Bar
                  dataKey="conversion"
                  name="Conversion %"
                  fill={colors.reportCharts.segmentReports.performanceComparison.conversion}
                  radius={[4, 4, 0, 0]}
                  maxBarSize={25}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      {/* Segment Data Table */}
      <section className="space-y-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Segment Performance Table
            </h2>
            <p className="mt-1 text-sm text-gray-600">
              Detailed view of all segments with member and engagement metrics
            </p>
          </div>
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <Input
              placeholder="Search segment"
              value={tableQuery}
              onChange={handleSearch}
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
              filename={`segment-reports-${new Date().toISOString().split("T")[0]}.csv`}
              style={{ backgroundColor: colors.primary.action }}
            />
          </div>
        </div>

        {isLoadingSegments && (
          <div className="flex justify-center py-16">
            <LoadingSpinner />
          </div>
        )}

        {!isLoadingSegments && segmentFetchError && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-8 text-center">
            <p className="text-sm text-red-700 font-medium mb-4">{segmentFetchError}</p>
            <button
              onClick={() => fetchSegments(tableQuery)}
              className={`${tw.rounded} ${tw.btnSmall} bg-red-600 text-white hover:bg-red-700`}
            >
              Retry
            </button>
          </div>
        )}

        {!isLoadingSegments && !segmentFetchError && segments.length === 0 && (
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-8 text-center">
            <p className="text-sm text-gray-600">No segments found</p>
          </div>
        )}

        {!isLoadingSegments && !segmentFetchError && segments.length > 0 && (
          <>
            <Table<SegmentRow>
              columns={tableColumnsMemo}
              data={filteredRows}
              totalItems={filteredRows.length}
              currentPage={tablePage}
              pageSize={tablePageSize}
              onPageChange={setTablePage}
              onFilteredCountChange={handleFilteredCountChange}
              clearFiltersKey={clearFiltersKey}
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
    </div>
  );
}
