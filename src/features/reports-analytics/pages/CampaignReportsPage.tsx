import { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { extractBackendError } from "../../../shared/utils/errorHandler";
import {
  Eye,
  FileText,
  RefreshCw,
} from "lucide-react";
import { colors } from "../../../shared/utils/tokens";
import HeadlessSelect from "../../../shared/components/ui/HeadlessSelect";
import Pagination, { DEFAULT_PAGE_SIZE, getInitialPageSize } from "../../../shared/components/ui/Pagination";
import CsvDownloadButton from "../../../shared/components/CsvDownloadButton";
import LoadingSpinner from "../../../shared/components/ui/LoadingSpinner";
import type {
  CampaignReportsResponse,
  CampaignRow,
} from "../types/ReportsAPI";
import {
  buildCampaignReportParams,
  settledError,
  settledValue,
} from "../utils/campaignReportQuery";
import {
  campaignPortfolioHasWidgets,
  mergeSplitCampaignWidgets,
  normalizeCampaignPortfolio,
  pickNamedArray,
  unwrapCampaignTable,
} from "../utils/normalizeCampaignReport";
import { parseISODate, fillCampaignTrendSeries, dummyTemplateRange, toChartAudit } from "../utils/reportTimeWindow";
import { useReportTimeWindow } from "../hooks/useReportTimeWindow";
import { usePreviousPeriodSeries } from "../hooks/usePreviousPeriodSeries";
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
import {
  campaignReportDummy,
  scaleCampaignSummary,
  scaleChannelReach,
} from "../utils/campaignReportDummy";
import { cvmDeliveryFunnel, emptyCampaignSummary } from "../utils/campaignCvmMetrics";

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

type TrendPoint = CampaignReportsResponse["performanceTrend"][number];

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

const EMPTY_SUMMARY = emptyCampaignSummary();

export default function CampaignReportsPage() {
  const navigate = useNavigate();
  const { success: showSuccess, error: showError } = useToast();
  const [tableQuery, setTableQuery] = useState("");
  const [debouncedTableQuery, setDebouncedTableQuery] = useState("");
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
    comparePreviousPeriod,
    previousQueryParams,
    previousPeriodLabel,
  } = timeWindow;
  const chartAudit = toChartAudit(activeWindow);
  const overviewAudit = toChartAudit(overviewWindow);
  const [useDummyData, setUseDummyData] = useState(true);
  const [channelChartView, setChannelChartView] = useState<ReportChartView>("bar");
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
      render: (value: number) => (value ?? 0).toLocaleString("en-US"),
    },
    {
      id: "controlGroup",
      label: "Control Group",
      visible: true,
      sortable: true,
      filterConfig: { type: "number" },
      render: (value: number) => (value ?? 0).toLocaleString("en-US"),
    },
    {
      id: "messagesGenerated",
      label: "Messages Generated",
      visible: true,
      sortable: true,
      filterConfig: { type: "number" },
      render: (value: number) => (value ?? 0).toLocaleString("en-US"),
    },
    {
      id: "sent",
      label: "Sent",
      visible: true,
      sortable: true,
      filterConfig: { type: "number" },
      render: (value: number) => (value ?? 0).toLocaleString("en-US"),
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
      id: "deliveryRate",
      label: "Delivery Rate",
      visible: true,
      sortable: false,
      render: (_: unknown, row: CampaignTableRow) => {
        const sent = row.sent || 0;
        const delivered = row.delivered || 0;
        const rate = sent ? (delivered / sent) * 100 : 0;
        return `${rate.toFixed(1)}%`;
      },
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

  const handleRefreshSnapshots = async () => {
    try {
      setIsRefreshingSnapshots(true);
      await campaignReportsService.refreshSnapshots({
        range: queryParams.range,
        startDate: queryParams.startDate,
        endDate: queryParams.endDate,
        grain: queryParams.grain,
        preset: queryParams.preset,
      });
      showSuccess("Campaign snapshots refreshed. Reloading reports…");
      setDataEpoch((value) => value + 1);
    } catch (error) {
      showError(extractBackendError(error, "Failed to refresh campaign snapshots."));
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
      return;
    }

    let cancelled = false;
    const params = buildCampaignReportParams({
      range: queryParams.range || activeRangeKey,
      grain: queryParams.grain,
      startDate: queryParams.startDate,
      endDate: queryParams.endDate,
      preset: queryParams.preset,
      campaignId: selectedCampaignFilter || undefined,
    });

    const loadLiveWidgets = async () => {
      setIsLoadingLiveReport(true);
      setLiveReportError(null);

      const [portfolioResult, trendsResult] = await Promise.allSettled([
        campaignReportsService.getPortfolio(params),
        campaignReportsService.getTrends(params),
      ]);
      if (cancelled) return;

      const portfolio = normalizeCampaignPortfolio(settledValue(portfolioResult));
      const liveTrends = pickNamedArray<TrendPoint>(
        settledValue(trendsResult)?.data,
        ["performanceTrend", "trends"],
      );
      const overlayTrends = (liveTrends.length ? liveTrends : portfolio.performanceTrend || []).map(
        (point) => ({
          ...point,
          date: point.date,
          ctr: point.ctr ?? 0,
          engagement: point.engagement ?? 0,
          revenue: point.revenue ?? 0,
          spend: point.spend ?? 0,
        }),
      );
      const withTrends = {
        ...portfolio,
        performanceTrend: overlayTrends,
        revenueTrend: overlayTrends.map((point) => ({
          period: point.period,
          date: point.date,
          revenue: point.revenue ?? 0,
          spend: point.spend ?? 0,
          target: 0,
        })),
      };

      if (campaignPortfolioHasWidgets(portfolio)) {
        setLiveReport(withTrends);
        if (!liveTrends.length && settledError(trendsResult, "")) {
          setLiveReportError(
            extractBackendError(
              settledError(trendsResult, "Failed to load campaign trends."),
              "Failed to load campaign trends.",
            ),
          );
        }
        setIsLoadingLiveReport(false);
        return;
      }

      const [kpisResult, reachResult, funnelResult] = await Promise.allSettled([
        campaignReportsService.getKpis(params),
        campaignReportsService.getChannelReach(params),
        campaignReportsService.getFunnel(params),
      ]);
      if (cancelled) return;

      const merged = mergeSplitCampaignWidgets({
        kpis: settledValue(kpisResult),
        reach: settledValue(reachResult),
        funnel: settledValue(funnelResult),
        trends: settledValue(trendsResult),
      });
      setLiveReport({
        ...merged,
        performanceTrend: overlayTrends.length
          ? overlayTrends
          : merged.performanceTrend || [],
        revenueTrend: overlayTrends.length
          ? overlayTrends.map((point) => ({
              period: point.period,
              date: point.date,
              revenue: point.revenue ?? 0,
              spend: point.spend ?? 0,
              target: 0,
            }))
          : merged.revenueTrend || [],
      });

      if (!campaignPortfolioHasWidgets(merged)) {
        const errors = [
          settledError(portfolioResult, "Failed to load campaign portfolio."),
          settledError(kpisResult, "Failed to load campaign KPIs."),
          settledError(reachResult, "Failed to load channel reach."),
          settledError(funnelResult, "Failed to load delivery funnel."),
          settledError(trendsResult, "Failed to load campaign trends."),
        ].filter(Boolean) as string[];
        if (errors.length) {
          setLiveReportError(
            extractBackendError(errors[0], "Failed to load Campaign Reports."),
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
    selectedCampaignFilter,
    dataEpoch,
  ]);

  const livePreviousTrend = usePreviousPeriodSeries<TrendPoint>({
    enabled: comparePreviousPeriod && !useDummyData,
    previousQueryParams: {
      ...previousQueryParams,
      campaignId: selectedCampaignFilter || undefined,
    },
    refreshKey: dataEpoch,
    fetchSeries: async (params) => {
      const envelope = await campaignReportsService.getTrends(
        buildCampaignReportParams({
          range: params.range || activeRangeKey,
          grain: params.grain,
          startDate: params.startDate,
          endDate: params.endDate,
          preset: params.preset,
          campaignId: params.campaignId,
        }),
      );
      return pickNamedArray<TrendPoint>(envelope.data, ["performanceTrend", "trends"]);
    },
  });

  useEffect(() => {
    if (useDummyData) return;

    let cancelled = false;
    const loadLiveTable = async () => {
      try {
        setIsLoadingLiveTable(true);
        setLiveTableError(null);
        const response = await campaignReportsService.getCampaignsTable(
          buildCampaignReportParams({
            range: overviewQueryParams.range || "30d",
            grain: overviewQueryParams.grain,
            startDate: overviewQueryParams.startDate,
            endDate: overviewQueryParams.endDate,
            preset: overviewQueryParams.preset,
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
          const table = unwrapCampaignTable(response);
          setLiveTableRows(table.rows);
          setLiveTableTotal(table.total);
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
    overviewQueryParams.range,
    overviewQueryParams.grain,
    overviewQueryParams.startDate,
    overviewQueryParams.endDate,
    selectedCampaignFilter,
    tablePage,
    tablePageSize,
    debouncedTableQuery,
    dataEpoch,
  ]);

  const dummyRange = dummyTemplateRange(queryParams.grain || "daily");
  const dummySnapshot = campaignReportDummy[dummyRange] ?? campaignReportDummy["90d"];
  const summary = useMemo(() => {
    if (!useDummyData) {
      return {
        ...EMPTY_SUMMARY,
        ...liveReport?.summary,
      };
    }
    return scaleCampaignSummary(dummySnapshot.summary, scaleFactor);
  }, [dummySnapshot.summary, scaleFactor, useDummyData, liveReport]);

  const mapReportRow = (row: CampaignRow): CampaignTableRow => {
    const campaign = campaigns.find((c) => String(c.id) === String(row.id));
    const isoRun = /^\d{4}-\d{2}-\d{2}/.test(row.lastRunDate || "")
      ? String(row.lastRunDate).slice(0, 10)
      : "";
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
      lastRunDate: isoRun || "—",
      lastRunDateMS: isoRun ? new Date(`${isoRun}T00:00:00`).getTime() : 0,
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
    const startDate = parseISODate(overviewWindow.bounds.start);
    const endDate = parseISODate(overviewWindow.bounds.end);
    const startMs = startDate?.getTime() ?? 0;
    const endMs = endDate ? endDate.getTime() + 24 * 60 * 60 * 1000 - 1 : Date.now();

    return campaignTableRows.filter((row) => {
      const matchesQuery = query ? row.name.toLowerCase().includes(query) : true;
      const matchesCampaign = selectedCampaignFilter
        ? getCampaignRowId(row) === selectedCampaignFilter
        : true;
      const rowDate = row.lastRunDateMS || Date.now();
      const matchesRange = rowDate >= startMs && rowDate <= endMs;

      return matchesQuery && matchesCampaign && matchesRange;
    });
  }, [
    useDummyData,
    tableQuery,
    selectedCampaignFilter,
    campaignTableRows,
    overviewWindow.bounds.start,
    overviewWindow.bounds.end,
  ]);

  // Reset pagination when filters change
  useEffect(() => {
    setTablePage(1);
  }, [
    debouncedTableQuery,
    selectedCampaignFilter,
    overviewWindow.bounds.start,
    overviewWindow.bounds.end,
    useDummyData,
  ]);

  // Chart colors now use standardized colors from tokens.reportCharts

  // Scale chart data based on actual date range
  const channelData = useMemo(() => {
    if (!useDummyData) {
      return liveReport?.channelReach || [];
    }
    return scaleChannelReach(dummySnapshot.channelReach, scaleFactor);
  }, [dummySnapshot.channelReach, scaleFactor, useDummyData, liveReport]);

  const funnelSeries = useMemo(
    () =>
      cvmDeliveryFunnel(
        summary,
        useDummyData ? [] : liveReport?.conversionFunnel || [],
      ),
    [liveReport?.conversionFunnel, summary, useDummyData],
  );

  const trendSeries = useMemo(() => {
    const window = {
      startDate: queryParams.startDate,
      endDate: queryParams.endDate,
      grain: queryParams.grain,
    };
    if (!useDummyData) {
      return fillCampaignTrendSeries(liveReport?.performanceTrend || [], window);
    }
    return fillCampaignTrendSeries(dummySnapshot.performanceTrend, window);
  }, [
    useDummyData,
    liveReport,
    dummySnapshot.performanceTrend,
    queryParams.startDate,
    queryParams.endDate,
    queryParams.grain,
  ]);

  const revenueSeries = useMemo(() => {
    const window = {
      startDate: queryParams.startDate,
      endDate: queryParams.endDate,
      grain: queryParams.grain,
    };
    if (!useDummyData) {
      return fillCampaignTrendSeries(
        (liveReport?.revenueTrend || liveReport?.performanceTrend || []).map((point) => ({
          period: point.period,
          date: point.date,
          ctr: 0,
          engagement: 0,
          revenue: point.revenue ?? 0,
          spend: point.spend ?? 0,
        })),
        window,
      );
    }
    return fillCampaignTrendSeries(dummySnapshot.performanceTrend, window);
  }, [
    useDummyData,
    liveReport,
    dummySnapshot.performanceTrend,
    queryParams.startDate,
    queryParams.endDate,
    queryParams.grain,
  ]);

  const roiSeries = useMemo(
    () =>
      revenueSeries.map((point) => ({
        period: point.period,
        date: point.date ?? "",
        revenue: point.revenue ?? 0,
        spend: point.spend ?? 0,
        roi: point.spend
          ? Number(((point.revenue ?? 0) / point.spend).toFixed(2))
          : 0,
      })),
    [revenueSeries],
  );

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
  const revenueComparison = useMemo(() => {
    if (!comparePreviousPeriod || !trendComparison?.length) return undefined;
    return trendComparison.map((point) => ({
      ...point,
      revenue: point.revenue ?? 0,
      spend: point.spend ?? 0,
    }));
  }, [comparePreviousPeriod, trendComparison]);
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
            Track unique customers reached, delivery, and conversion across every communication channel
          </p>
        </div>
        <ReportTrendsToolbar
          timeWindow={timeWindow}
          entityFilter={
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
          }
          extraActions={
            <>
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
            </>
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
          heroTrends={liveReport?.heroTrends}
          useDummyData={useDummyData}
        />
      )}

      {!isTrendsView && (
      <section className="grid gap-6 lg:grid-cols-2">
        <ReportChartCard
          title="Channel Reach Distribution"
          subtitle="Sent volume, delivered customers, and unique audience by channel"
          filename="campaign-channel-reach.csv"
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
          filename="campaign-delivery-funnel.csv"
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
          filename="campaign-volume-trends.csv"
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
          filename="campaign-rate-trends.csv"
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
          filename="campaign-revenue-vs-spend.csv"
          audit={chartAudit}
          columns={[
            { key: "period", label: "Period" },
            { key: "date", label: "Date" },
            { key: "revenue", label: "Value" },
            { key: "spend", label: "Cost" },
          ]}
          rows={revenueSeries}
          xKey="period"
          yLabel="Amount"
          yTickFormatter={(value) => value.toLocaleString("en-US")}
          comparisonData={revenueComparison}
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
          filename="campaign-roi-trends.csv"
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

      {!isTrendsView && (
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
      )}

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
