import { useMemo, useState, useEffect, useCallback, useRef } from "react";
import { extractBackendError } from "../../../shared/utils/errorHandler";
import { Eye } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getSettingsTimezoneOffset } from "../../../shared/utils/settingsHelper";
import { formatDateWithTimezone } from "../../../shared/services/dateService";
import { formatCurrency } from "../../../shared/services/currencyService";
import { colors } from "../../../shared/utils/tokens";
import HeadlessSelect from "../../../shared/components/ui/HeadlessSelect";
import Pagination, { DEFAULT_PAGE_SIZE, getInitialPageSize } from "../../../shared/components/ui/Pagination";
import CsvDownloadButton from "../../../shared/components/CsvDownloadButton";
import LoadingSpinner from "../../../shared/components/ui/LoadingSpinner";
import { tw } from "../../../shared/utils/utils";
import Input from "../../../shared/components/ui/Input";
import type { RangeOption, SegmentReportsResponse } from "../types/ReportsAPI";
import { segmentReportsService } from "../services/segmentReportsService";
import { useReportTimeWindow } from "../hooks/useReportTimeWindow";
import { usePreviousPeriodSeries } from "../hooks/usePreviousPeriodSeries";
import { alignTrendSeries, dummyTemplateRange, toChartAudit } from "../utils/reportTimeWindow";
import {
  previousComparisonLabel as formatPreviousComparisonLabel,
  resolveComparisonSeries,
} from "../utils/reportComparison";
import { pickNamedArray } from "../utils/normalizeCampaignReport";
import ReportTrendsToolbar from "../components/ReportTrendsToolbar";
import SwitchableReportChart from "../components/SwitchableReportChart";
import { segmentService } from "../../segments/services/segmentService";
import type { SegmentType } from "../../segments/types/segment";
import { Table } from "../../../shared/components/Table/Table";
import { useTable } from "../../../shared/components/Table/useTable";
import type { TableColumn } from "../../../shared/components/Table/types";
import { ColumnPickerModal } from "../../../shared/components/ColumnPickerModal";
import SegmentKpiGrid from "../components/SegmentKpiGrid";
import { normalizeSegmentReport } from "../utils/normalizeSegmentReport";
import {
  dummySegmentMeasures,
  SEGMENT_CVM_LABELS,
} from "../utils/segmentCvmMetrics";

// Types
type SegmentSummary = {
  totalSegments: number;
  totalMembers: number;
  avgMemberGrowth: number;
  activeInCampaigns: number;
  engagementRate: number;
  conversionRate: number;
  activityScore: number;
  takeUpRate: number;
  arpu: number;
  activeSubscribers: number;
  dormantSubscribers: number;
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
    engagementRate: 64,
    conversionRate: 4.2,
    activityScore: 64,
    takeUpRate: 4.2,
    arpu: 118,
    activeSubscribers: 112_000,
    dormantSubscribers: 33_000,
  },
  "30d": {
    totalSegments: 24,
    totalMembers: 415_000,
    avgMemberGrowth: 8.7,
    activeInCampaigns: 22,
    engagementRate: 71,
    conversionRate: 5.8,
    activityScore: 71,
    takeUpRate: 5.8,
    arpu: 128,
    activeSubscribers: 332_000,
    dormantSubscribers: 83_000,
  },
  "90d": {
    totalSegments: 24,
    totalMembers: 980_000,
    avgMemberGrowth: 15.4,
    activeInCampaigns: 24,
    engagementRate: 74,
    conversionRate: 6.9,
    activityScore: 74,
    takeUpRate: 6.9,
    arpu: 142,
    activeSubscribers: 760_000,
    dormantSubscribers: 220_000,
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
    { segmentName: "New", members: 28_500 },
    { segmentName: "Core", members: 35_200 },
    { segmentName: "High Value", members: 22_100 },
    { segmentName: "At Risk", members: 18_800 },
    { segmentName: "Win-back", members: 12_500 },
    { segmentName: "Growth", members: 27_900 },
  ],
  "30d": [
    { segmentName: "New", members: 82_500 },
    { segmentName: "Core", members: 105_200 },
    { segmentName: "High Value", members: 64_100 },
    { segmentName: "At Risk", members: 52_800 },
    { segmentName: "Win-back", members: 38_500 },
    { segmentName: "Growth", members: 71_900 },
  ],
  "90d": [
    { segmentName: "New", members: 215_000 },
    { segmentName: "Core", members: 268_000 },
    { segmentName: "High Value", members: 168_000 },
    { segmentName: "At Risk", members: 142_000 },
    { segmentName: "Win-back", members: 105_000 },
    { segmentName: "Growth", members: 182_000 },
  ],
};

const campaignUsageData: Record<RangeOption, CampaignUsagePoint[]> = {
  "7d": [
    { segmentName: "New", campaigns: 8 },
    { segmentName: "Core", campaigns: 12 },
    { segmentName: "High Value", campaigns: 10 },
    { segmentName: "At Risk", campaigns: 7 },
    { segmentName: "Win-back", campaigns: 9 },
    { segmentName: "Growth", campaigns: 6 },
  ],
  "30d": [
    { segmentName: "New", campaigns: 24 },
    { segmentName: "Core", campaigns: 32 },
    { segmentName: "High Value", campaigns: 28 },
    { segmentName: "At Risk", campaigns: 19 },
    { segmentName: "Win-back", campaigns: 26 },
    { segmentName: "Growth", campaigns: 18 },
  ],
  "90d": [
    { segmentName: "New", campaigns: 68 },
    { segmentName: "Core", campaigns: 89 },
    { segmentName: "High Value", campaigns: 76 },
    { segmentName: "At Risk", campaigns: 54 },
    { segmentName: "Win-back", campaigns: 71 },
    { segmentName: "Growth", campaigns: 52 },
  ],
};

const performanceComparisonData: Record<RangeOption, PerformanceComparisonPoint[]> = {
  "7d": [
    { segmentName: "New", engagement: 58, conversion: 3.1 },
    { segmentName: "Core", engagement: 72, conversion: 6.4 },
    { segmentName: "High Value", engagement: 84, conversion: 8.2 },
    { segmentName: "At Risk", engagement: 41, conversion: 4.8 },
    { segmentName: "Win-back", engagement: 63, conversion: 10.1 },
    { segmentName: "Growth", engagement: 69, conversion: 3.9 },
  ],
  "30d": [
    { segmentName: "New", engagement: 61, conversion: 3.8 },
    { segmentName: "Core", engagement: 74, conversion: 7.2 },
    { segmentName: "High Value", engagement: 86, conversion: 9.1 },
    { segmentName: "At Risk", engagement: 44, conversion: 5.3 },
    { segmentName: "Win-back", engagement: 66, conversion: 11.2 },
    { segmentName: "Growth", engagement: 71, conversion: 4.6 },
  ],
  "90d": [
    { segmentName: "New", engagement: 64, conversion: 4.5 },
    { segmentName: "Core", engagement: 76, conversion: 8.1 },
    { segmentName: "High Value", engagement: 88, conversion: 10.2 },
    { segmentName: "At Risk", engagement: 47, conversion: 5.9 },
    { segmentName: "Win-back", engagement: 68, conversion: 12.4 },
    { segmentName: "Growth", engagement: 73, conversion: 5.3 },
  ],
};

const statusOptions = ["All Statuses", "Active", "Inactive"];

export default function SegmentReportsPage() {
  const navigate = useNavigate();
  const [tableQuery, setTableQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All Statuses");
  const timeWindow = useReportTimeWindow({
    overviewPreset: "weekly",
    defaultTrendsPreset: "daily",
  });
  const { isTrendsView, queryParams, overviewWindow, activeWindow, comparePreviousPeriod, previousQueryParams, previousPeriodLabel } = timeWindow;
  const chartAudit = toChartAudit(activeWindow);
  const overviewAudit = toChartAudit(overviewWindow);
  const selectedRange = timeWindow.rangeKey;
  const appliedCustomRange = timeWindow.activeWindow.bounds;
  const customRange = appliedCustomRange;
  const [useDummyData, setUseDummyData] = useState(true);
  const [liveReport, setLiveReport] = useState<SegmentReportsResponse | null>(null);
  const [isLoadingLiveReport, setIsLoadingLiveReport] = useState(false);
  const [liveReportError, setLiveReportError] = useState<string | null>(null);
  const [tablePage, setTablePage] = useState(1);
  const [tablePageSize, setTablePageSize] = useState(getInitialPageSize());
  const [clearFiltersKey, setClearFiltersKey] = useState(0);
  const [showColumnPicker, setShowColumnPicker] = useState(false);

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
      label: SEGMENT_CVM_LABELS.subscribers,
      visible: true,
      sortable: true,
      filterConfig: { type: "number" },
      render: (value: number) => value.toLocaleString("en-US"),
    },
    {
      id: "growthRate",
      label: SEGMENT_CVM_LABELS.baseGrowth,
      visible: true,
      sortable: true,
      filterConfig: { type: "number" },
      render: (value: number) => `${value >= 0 ? "+" : ""}${value.toFixed(1)}%`,
    },
    {
      id: "campaignsUsed",
      label: SEGMENT_CVM_LABELS.campaignsTargeting,
      visible: true,
      sortable: true,
      filterConfig: { type: "number" },
    },
    {
      id: "engagementRate",
      label: SEGMENT_CVM_LABELS.activityScore,
      visible: true,
      sortable: true,
      filterConfig: { type: "number" },
      render: (value: number) => `${Math.round(value)} / 100`,
    },
    {
      id: "conversionRate",
      label: SEGMENT_CVM_LABELS.takeUpRate,
      visible: true,
      sortable: true,
      filterConfig: { type: "number" },
      render: (value: number) => `${value.toFixed(1)}%`,
    },
    {
      id: "avgValue",
      label: SEGMENT_CVM_LABELS.arpu,
      visible: true,
      sortable: true,
      filterConfig: { type: "number" },
      render: (value: number) => formatCurrency(value),
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
    {
      id: "actions",
      label: "Actions",
      visible: true,
      sortable: false,
      isActionColumn: true,
      render: (_, row) => (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => navigate(`/dashboard/segments/${row.id}`)}
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

      if (!useDummyData) return;

      if (searchDebounceRef.current) {
        clearTimeout(searchDebounceRef.current);
      }

      searchDebounceRef.current = setTimeout(() => {
        fetchSegments(query);
      }, 150);
    },
    [fetchSegments, useDummyData],
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
        const response = await segmentReportsService.getPortfolio({
          range: queryParams.range || activeRangeKey,
          grain: queryParams.grain,
          startDate: queryParams.startDate,
          endDate: queryParams.endDate,
          preset: queryParams.preset,
          page: 1,
          pageSize: 200,
          sortBy: "memberCount",
          sortOrder: "desc",
        });
        if (cancelled) return;
        const normalized = normalizeSegmentReport(response);
        if (response.success && normalized) {
          setLiveReport(normalized);
        } else {
          setLiveReport(null);
          setLiveReportError(
            response.error || response.message || "Failed to load segment report",
          );
        }
      } catch (error) {
        if (cancelled) return;
        setLiveReport(null);
        setLiveReportError(
          extractBackendError(error, "Failed to load Segment Reports."),
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
    queryParams.preset,
  ]);

  const baseSummary = segmentSummary[activeRangeKey];
  const summary = useMemo(() => {
    if (!useDummyData) {
      if (liveReport?.summary) return liveReport.summary;
      return {
        totalSegments: 0,
        totalMembers: 0,
        avgMemberGrowth: 0,
        activeInCampaigns: 0,
        engagementRate: 0,
        conversionRate: 0,
        activityScore: 0,
        takeUpRate: 0,
        arpu: 0,
        activeSubscribers: 0,
        dormantSubscribers: 0,
      };
    }
    if (scaleFactor === 1) return baseSummary;
    return {
      ...baseSummary,
      totalMembers: Math.round(baseSummary.totalMembers * scaleFactor),
      activeInCampaigns: Math.round(baseSummary.activeInCampaigns * scaleFactor),
      activeSubscribers: Math.round(baseSummary.activeSubscribers * scaleFactor),
      dormantSubscribers: Math.round(baseSummary.dormantSubscribers * scaleFactor),
      avgMemberGrowth: baseSummary.avgMemberGrowth,
      engagementRate: baseSummary.engagementRate,
      conversionRate: baseSummary.conversionRate,
      totalSegments: baseSummary.totalSegments,
    };
  }, [baseSummary, scaleFactor, useDummyData, liveReport]);

  const memberGrowthSeries = useMemo(() => {
    const window = {
      startDate: queryParams.startDate,
      endDate: queryParams.endDate,
      grain: queryParams.grain,
    };
    if (!useDummyData) {
      return alignTrendSeries(liveReport?.memberGrowth || [], window);
    }
    return alignTrendSeries(
      memberGrowthData[dummyTemplateRange(queryParams.grain || "daily")],
      window,
    );
  }, [
    queryParams.startDate,
    queryParams.endDate,
    queryParams.grain,
    useDummyData,
    liveReport,
  ]);

  const livePreviousGrowth = usePreviousPeriodSeries<MemberGrowthPoint>({
    enabled: comparePreviousPeriod && !useDummyData,
    previousQueryParams,
    fetchSeries: async (params) => {
      const envelope = await segmentReportsService.getMemberGrowth({
        range: params.range || timeWindow.rangeKey,
        grain: params.grain,
        startDate: params.startDate,
        endDate: params.endDate,
        preset: params.preset,
      });
      return pickNamedArray<MemberGrowthPoint>(envelope.data, [
        "memberGrowth",
        "growth",
      ]);
    },
  });

  const memberGrowthComparison = useMemo(
    () =>
      resolveComparisonSeries({
        compare: comparePreviousPeriod,
        useDummyData,
        current: memberGrowthSeries,
        livePrevious: livePreviousGrowth,
        previousQueryParams,
        align: alignTrendSeries,
      }),
    [
      comparePreviousPeriod,
      livePreviousGrowth,
      memberGrowthSeries,
      previousQueryParams,
      useDummyData,
    ],
  );
  const previousComparisonLabel = formatPreviousComparisonLabel(
    comparePreviousPeriod,
    previousPeriodLabel,
  );

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
      const live = liveReport?.sizeDistribution;
      if (live?.length) {
        return live.map((point, idx) => ({
          ...point,
          fill: segmentColors[idx % segmentColors.length],
        }));
      }
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
  }, [activeRangeKey, scaleFactor, useDummyData, liveReport]);

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
      const live = liveReport?.campaignUsage;
      if (live?.length) {
        return live.map((point, idx) => ({
          ...point,
          fill: campaignColors[idx % campaignColors.length],
        }));
      }
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
  }, [activeRangeKey, useDummyData, liveReport]);

  const performanceComparison = useMemo(() => {
    if (!useDummyData) {
      if (liveReport?.performanceComparison?.length) return liveReport.performanceComparison;
      return performanceComparisonData[activeRangeKey].map((point) => ({
        ...point,
        engagement: 0,
        conversion: 0,
      }));
    }
    return performanceComparisonData[activeRangeKey];
  }, [activeRangeKey, useDummyData, liveReport]);

  const segmentTableRows = useMemo(() => {
    if (!useDummyData && liveReport?.segments?.length) {
      return liveReport.segments.map((row) => ({
        id: String(row.id),
        name: row.name || "Unknown",
        memberCount: row.memberCount,
        growthRate: row.growthRate,
        campaignsUsed: row.campaignsUsed,
        engagementRate: row.activityScore ?? row.engagementRate,
        conversionRate: row.takeUpRate ?? row.conversionRate,
        avgValue: row.arpu ?? row.avgValue,
        status: row.status === "Inactive" ? "Inactive" as const : "Active" as const,
        lastUpdated: row.lastUpdated
          ? formatDateWithTimezone(row.lastUpdated, getSettingsTimezoneOffset())
          : "—",
        lastUpdatedDate: row.lastUpdated
          ? new Date(row.lastUpdated).getTime()
          : Date.now(),
      }));
    }

    return segments.map((segment) => {
      const measures = dummySegmentMeasures(segment.id, segment.size_estimate);
      return {
        id: String(segment.id),
        name: segment.name || "Unknown",
        memberCount: measures.subscribers,
        growthRate: measures.baseGrowth,
        campaignsUsed: measures.campaignsTargeting,
        engagementRate: measures.activityScore,
        conversionRate: measures.takeUpRate,
        avgValue: measures.arpu,
        status: measures.status,
        lastUpdated: segment.updated_at
          ? formatDateWithTimezone(segment.updated_at, getSettingsTimezoneOffset())
          : "—",
        lastUpdatedDate: segment.updated_at
          ? new Date(segment.updated_at).getTime()
          : Date.now(),
      };
    });
  }, [segments, useDummyData, liveReport]);

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
      const matchesQuery = tableQuery.trim()
        ? row.name.toLowerCase().includes(tableQuery.trim().toLowerCase())
        : true;
      const matchesStatus =
        statusFilter === "All Statuses" ? true : row.status === statusFilter;
      if (!useDummyData) return matchesQuery && matchesStatus;
      const rowDate = row.lastUpdatedDate || Date.now();
      const now = Date.now();
      const matchesRange =
        appliedCustomRange.start && appliedCustomRange.end && startMs && endMs
          ? rowDate >= startMs && rowDate <= endMs
          : now - rowDate <= maxDays * 24 * 60 * 60 * 1000;
      return matchesQuery && matchesStatus && matchesRange;
    });
  }, [
    statusFilter,
    tableQuery,
    customDays,
    selectedRange,
    appliedCustomRange,
    segmentTableRows,
    useDummyData,
  ]);

  useEffect(() => {
    setTablePage(1);
  }, [tableQuery, statusFilter, appliedCustomRange.start]);

  const csvHeaders = [
    "Segment Name",
    SEGMENT_CVM_LABELS.subscribers,
    SEGMENT_CVM_LABELS.baseGrowth,
    SEGMENT_CVM_LABELS.campaignsTargeting,
    SEGMENT_CVM_LABELS.activityScore,
    SEGMENT_CVM_LABELS.takeUpRate,
    SEGMENT_CVM_LABELS.arpu,
    "Status",
    "Last Updated",
  ];

  const csvRows = filteredRows.map((row) => [
    row.name,
    row.memberCount.toString(),
    `${row.growthRate.toFixed(1)}%`,
    row.campaignsUsed.toString(),
    `${Math.round(row.engagementRate)}`,
    `${row.conversionRate.toFixed(1)}%`,
    formatCurrency(row.avgValue),
    row.status,
    row.lastUpdated,
  ]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Segment Reports</h1>
          <p className="mt-2 text-base text-gray-600">
            Track subscriber base, base growth, campaign targeting, activity
            score, take-up, and ARPU across the segment portfolio
          </p>
        </div>

        <ReportTrendsToolbar
          timeWindow={timeWindow}
          extraActions={
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
          }
        />
      </div>

      {!isTrendsView && (
        <SegmentKpiGrid
          summary={summary}
          heroTrends={liveReport?.heroTrends}
          useDummyData={useDummyData}
        />
      )}

      {isTrendsView && (
      <section>
        <SwitchableReportChart
          title="Subscriber Base Growth"
          subtitle="New subscribers and cumulative base over the selected period"
          filename="segment-member-growth.csv"
          audit={chartAudit}
          columns={[
            { key: "period", label: "Period" },
            { key: "date", label: "Date" },
            { key: "members", label: SEGMENT_CVM_LABELS.newSubscribers },
            { key: "cumulativeMembers", label: SEGMENT_CVM_LABELS.cumulativeBase },
          ]}
          rows={memberGrowthSeries}
          xKey="period"
          yLabel={SEGMENT_CVM_LABELS.subscribers}
          yTickFormatter={(value) => value.toLocaleString("en-US")}
          comparisonData={memberGrowthComparison}
          comparisonLabel={previousComparisonLabel}
          series={[
            {
              dataKey: "members",
              name: SEGMENT_CVM_LABELS.newSubscribers,
              color: colors.reportCharts.segmentReports.memberGrowth.members,
            },
            {
              dataKey: "cumulativeMembers",
              name: SEGMENT_CVM_LABELS.cumulativeBase,
              color: colors.reportCharts.segmentReports.memberGrowth.cumulative,
            },
          ]}
        />
      </section>
      )}

      {!isTrendsView && (
      <>
      <section className="grid gap-6 lg:grid-cols-2">
        <SwitchableReportChart
          title="Segment Size"
          subtitle="Top segments by subscriber base"
          filename="segment-size-distribution.csv"
          audit={overviewAudit}
          columns={[
            { key: "segmentName", label: "Segment" },
            { key: "members", label: SEGMENT_CVM_LABELS.subscribers },
          ]}
          rows={sizeDistributionSeries}
          xKey="segmentName"
          yLabel={SEGMENT_CVM_LABELS.subscribers}
          yTickFormatter={(value) => value.toLocaleString("en-US")}
          emptyMessage="No segment sizes in this window."
          series={[
            {
              dataKey: "members",
              name: SEGMENT_CVM_LABELS.subscribers,
              color: colors.reportCharts.segmentReports.sizeDistribution.segment1,
            },
          ]}
        />

        <SwitchableReportChart
          title="Campaign Targeting"
          subtitle="Campaigns using each segment as a target group"
          filename="segment-campaign-usage.csv"
          audit={overviewAudit}
          columns={[
            { key: "segmentName", label: "Segment" },
            { key: "campaigns", label: SEGMENT_CVM_LABELS.campaignsTargeting },
          ]}
          rows={campaignUsageSeries}
          xKey="segmentName"
          yLabel={SEGMENT_CVM_LABELS.campaignsTargeting}
          emptyMessage="No campaign usage in this window."
          series={[
            {
              dataKey: "campaigns",
              name: SEGMENT_CVM_LABELS.campaignsTargeting,
              color: colors.reportCharts.segmentReports.campaignUsage.bar1,
            },
          ]}
        />

        <SwitchableReportChart
          title="Segment Outcomes"
          subtitle="Activity score and take-up rate by segment"
          filename="segment-performance-comparison.csv"
          audit={overviewAudit}
          columns={[
            { key: "segmentName", label: "Segment" },
            { key: "engagement", label: SEGMENT_CVM_LABELS.activityScore },
            { key: "conversion", label: SEGMENT_CVM_LABELS.takeUpRate },
          ]}
          rows={performanceComparison}
          xKey="segmentName"
          yLabel="Score / rate"
          series={[
            {
              dataKey: "engagement",
              name: SEGMENT_CVM_LABELS.activityScore,
              color: colors.reportCharts.segmentReports.performanceComparison.engagement,
            },
            {
              dataKey: "conversion",
              name: SEGMENT_CVM_LABELS.takeUpRate,
              color: colors.reportCharts.segmentReports.performanceComparison.conversion,
            },
          ]}
        />
      </section>

      {/* Segment Data Table */}
      <section className="space-y-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Segment Performance Table
            </h2>
            <p className="mt-1 text-sm text-gray-600">
              Subscriber base, activity score, take-up, and ARPU for each segment
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

        {liveReportError && !useDummyData && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {liveReportError}
          </div>
        )}

        {(useDummyData ? isLoadingSegments : isLoadingLiveReport) && (
          <div className="flex justify-center py-16">
            <LoadingSpinner />
          </div>
        )}

        {useDummyData && !isLoadingSegments && segmentFetchError && (
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

        {!(useDummyData ? isLoadingSegments : isLoadingLiveReport) &&
          !(useDummyData && segmentFetchError) &&
          filteredRows.length === 0 && (
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-8 text-center">
            <p className="text-sm text-gray-600">No segments found</p>
          </div>
        )}

        {!(useDummyData ? isLoadingSegments : isLoadingLiveReport) &&
          !(useDummyData && segmentFetchError) &&
          filteredRows.length > 0 && (
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
