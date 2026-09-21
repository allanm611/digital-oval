import { useMemo, useState, useEffect } from "react";
import { useLanguage } from "../../../contexts/LanguageContext";
import {
  AlertTriangle,
  CheckCircle2,
  MailOpen,
  MessageCircle,
  MousePointerClick,
  TrendingUp,
  UserMinus,
} from "lucide-react";
import { colors } from "../../../shared/utils/tokens";
import Input from "../../../shared/components/ui/Input";
import { tw } from "../../../shared/utils/utils";
import HeadlessSelect from "../../../shared/components/ui/HeadlessSelect";
import Pagination, { DEFAULT_PAGE_SIZE } from "../../../shared/components/ui/Pagination";
import CsvDownloadButton from "../../../shared/components/CsvDownloadButton";
import { Table } from "../../../shared/components/Table/Table";
import { useTable } from "../../../shared/components/Table/useTable";
import type { TableColumn } from "../../../shared/components/Table/types";
import { ColumnPickerModal } from "../../../shared/components/ColumnPickerModal";
import type {
  RangeOption,
  DeliverySMSReportsResponse,
  SMSLogEntry,
} from "../types/ReportsAPI";
import { useReportTimeWindow } from "../hooks/useReportTimeWindow";
import { alignTrendSeries, dummyTemplateRange, dummyPreviousPeriod, toChartAudit } from "../utils/reportTimeWindow";
import ReportTrendsToolbar from "../components/ReportTrendsToolbar";
import ReportChartCard from "../components/ReportChartCard";
import ReportGroupedBarChart from "../components/ReportGroupedBarChart";

// Extract types from API response type
type SMSSummary = DeliverySMSReportsResponse["summary"];
type DeliveryPoint = DeliverySMSReportsResponse["deliveryTimeline"][number];
type MessageStatus = SMSLogEntry["status"];

// Mock data structure (combines summary and timeline)
type SMSRangeData = {
  summary: SMSSummary;
  deliverySeries: DeliveryPoint[];
};

// Table row type
type SMSTableRow = {
  id: string;
  campaignName: string;
  status: MessageStatus;
  sent: number;
  delivered: number;
  conversions: number;
  conversionRate: number;
};

const rangeOptions: RangeOption[] = ["7d", "30d", "90d"];
const rangeDays: Record<RangeOption, number> = {
  "7d": 7,
  "30d": 30,
  "90d": 90,
};
const statusOptions: (MessageStatus | "All")[] = [
  "All",
  "Delivered",
  "Failed",
  "Pending",
  "Rejected",
];

// Chart colors now use standardized colors from tokens.reportCharts

const smsMockData: Record<RangeOption, SMSRangeData> = {
  "7d": {
    summary: {
      sent: 87_500,
      delivered: 82_000,
      deliveryRate: 93.7,
      conversionRate: 7.5,
      conversions: 6_400,
      failedRate: 4.5,
      openRate: 42.3,
      ctr: 9.1,
      optOutRate: 0.6,
    },
    deliverySeries: [
      { period: "Mon", sent: 12_500, delivered: 11_800, converted: 920 },
      { period: "Tue", sent: 12_200, delivered: 11_500, converted: 915 },
      { period: "Wed", sent: 12_800, delivered: 12_050, converted: 940 },
      { period: "Thu", sent: 12_400, delivered: 11_780, converted: 930 },
      { period: "Fri", sent: 12_600, delivered: 11_900, converted: 945 },
      { period: "Sat", sent: 12_100, delivered: 11_420, converted: 905 },
      { period: "Sun", sent: 13_000, delivered: 12_550, converted: 950 },
    ],
  },
  "30d": {
    summary: {
      sent: 360_000,
      delivered: 337_500,
      deliveryRate: 93.7,
      conversionRate: 7.8,
      conversions: 27_000,
      failedRate: 4.2,
      openRate: 41.8,
      ctr: 9.4,
      optOutRate: 0.7,
    },
    deliverySeries: [
      { period: "Oct 1-7", sent: 90_000, delivered: 84_800, converted: 6_750 },
      { period: "Oct 8-14", sent: 90_500, delivered: 85_050, converted: 6_820 },
      {
        period: "Oct 15-21",
        sent: 88_500,
        delivered: 83_300,
        converted: 6_700,
      },
      {
        period: "Oct 22-28",
        sent: 91_000,
        delivered: 84_350,
        converted: 6_780,
      },
    ],
  },
  "90d": {
    summary: {
      sent: 1_075_000,
      delivered: 1_008_000,
      deliveryRate: 93.8,
      conversionRate: 8.0,
      conversions: 80_400,
      failedRate: 4.0,
      openRate: 42.6,
      ctr: 9.9,
      optOutRate: 0.8,
    },
    deliverySeries: [
      {
        period: "September",
        sent: 355_000,
        delivered: 333_000,
        converted: 26_700,
      },
      {
        period: "October",
        sent: 360_000,
        delivered: 337_500,
        converted: 27_000,
      },
      {
        period: "November",
        sent: 360_000,
        delivered: 337_500,
        converted: 27_200,
      },
    ],
  },
};

const formatNumber = (value: number) => value.toLocaleString("en-US");

const toRate = (numerator: number, denominator: number) =>
  denominator ? Number(((numerator / denominator) * 100).toFixed(2)) : 0;

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

// Generate comprehensive dummy data with dates relative to today
const generateSMSMessageLogs = (): MessageLogEntry[] => {
  const campaigns = [
    { id: "CAMP-8472", name: "Loyalty Reactivation" },
    { id: "LOYALTY-5541", name: "VIP Upsell" },
    { id: "REACT-2201", name: "Churn Winback" },
    { id: "WELCOME-3321", name: "Welcome Series" },
    { id: "PROMO-4456", name: "Flash Sale" },
    { id: "BIRTHDAY-6678", name: "Birthday Campaign" },
  ];
  const statuses: MessageStatus[] = [
    "Delivered",
    "Failed",
    "Pending",
    "Rejected",
  ];
  const regions = ["Uganda", "Kenya", "Rwanda", "Tanzania", "Ghana", "Nigeria"];
  const errorCodes = ["INV_NUMBER", "DND_ACTIVE", "BLOCKED", "TIMEOUT"];
  const phonePrefixes = ["+256", "+254", "+250", "+255", "+233", "+234"];

  const rows: MessageLogEntry[] = [];
  const today = new Date();
  let globalCounter = 0;

  // Generate messages across the last 90 days with various statuses
  campaigns.forEach((campaign, campIdx) => {
    for (let i = 0; i < 8; i++) {
      globalCounter++;
      const daysAgo = Math.floor(Math.random() * 90); // Spread across last 90 days
      const messageDate = new Date(today);
      messageDate.setDate(today.getDate() - daysAgo);
      messageDate.setHours(
        9 + Math.floor(Math.random() * 12),
        Math.floor(Math.random() * 60),
        0,
        0,
      );

      const status = statuses[Math.floor(Math.random() * statuses.length)];
      const regionIdx = campIdx % regions.length;
      const delivered = status === "Delivered" ? 1 : 0;
      const conversions = delivered === 1 && Math.random() > 0.6 ? 1 : 0;
      const conversionRate =
        delivered === 1 ? (conversions === 1 ? 100 : 0) : 0;

      const phoneNum = `${phonePrefixes[regionIdx]} ${
        700 + Math.floor(Math.random() * 100)
      } ${String(100000 + Math.floor(Math.random() * 900000))}`;

      rows.push({
        id: `MSG-${globalCounter}`,
        campaignId: campaign.id,
        campaignName: campaign.name,
        recipient: phoneNum,
        region: regions[regionIdx],
        senderId: "SentraCVM",
        timestamp: messageDate.toISOString(),
        status,
        sent: 1,
        delivered,
        conversions,
        conversionRate,
        ...(status === "Failed" || status === "Rejected"
          ? {
              errorCode:
                errorCodes[Math.floor(Math.random() * errorCodes.length)],
            }
          : {}),
      });
    }
  });

  return rows;
};

const smsMessageLogs: MessageLogEntry[] = generateSMSMessageLogs();

export default function DeliverySMSReportsPage() {
  const { t } = useLanguage();
  const timeWindow = useReportTimeWindow({
    overviewPreset: "monthly",
    defaultTrendsPreset: "daily",
  });
  const { isTrendsView, queryParams, activeWindow, comparePreviousPeriod } = timeWindow;
  const chartAudit = toChartAudit(activeWindow);
  const deliveryRange = timeWindow.rangeKey;
  const appliedCustomRange = timeWindow.activeWindow.bounds;
  const customRange = appliedCustomRange;
  const [statusFilter, setStatusFilter] = useState<MessageStatus | "All">(
    "All",
  );
  const [campaignQuery, setCampaignQuery] = useState("");
  const [useDummyData, setUseDummyData] = useState(true);
  const [tablePage, setTablePage] = useState(1);
  const [tablePageSize, setTablePageSize] = useState(DEFAULT_PAGE_SIZE);

  const customDays = getDaysBetween(
    appliedCustomRange.start,
    appliedCustomRange.end,
  );
  const activeRangeKey: RangeOption =
    appliedCustomRange.start && appliedCustomRange.end
      ? mapDaysToRange(customDays)
      : deliveryRange;

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

  // Scale snapshot data based on actual date range
  const baseSnapshot = smsMockData[activeRangeKey];
  const summarySnapshot = useMemo(() => {
    if (!useDummyData) {
      return {
        ...baseSnapshot,
        summary: {
          sent: 0,
          delivered: 0,
          conversions: 0,
          deliveryRate: 0,
          failedRate: 0,
          conversionRate: 0,
          openRate: 0,
          ctr: 0,
          optOutRate: 0,
        },
      };
    }
    if (scaleFactor === 1) return baseSnapshot;
    return {
      ...baseSnapshot,
      summary: {
        ...baseSnapshot.summary,
        sent: Math.round(baseSnapshot.summary.sent * scaleFactor),
        delivered: Math.round(baseSnapshot.summary.delivered * scaleFactor),
        conversions: Math.round(baseSnapshot.summary.conversions * scaleFactor),
        // Rates stay the same
        deliveryRate: baseSnapshot.summary.deliveryRate,
        failedRate: baseSnapshot.summary.failedRate,
        conversionRate: baseSnapshot.summary.conversionRate,
        openRate: baseSnapshot.summary.openRate,
        ctr: baseSnapshot.summary.ctr,
        optOutRate: baseSnapshot.summary.optOutRate,
      },
    };
  }, [baseSnapshot, scaleFactor, useDummyData]);

  const deliverySnapshot = useMemo(() => {
    const window = {
      startDate: queryParams.startDate,
      endDate: queryParams.endDate,
      grain: queryParams.grain,
    };
    const template =
      smsMockData[dummyTemplateRange(queryParams.grain || "daily")].deliverySeries;
    if (!useDummyData) {
      return {
        ...baseSnapshot,
        deliverySeries: alignTrendSeries(
          template.map((point) => ({ ...point, sent: 0, delivered: 0, converted: 0 })),
          window,
        ),
      };
    }
    return {
      ...baseSnapshot,
      deliverySeries: alignTrendSeries(template, window),
    };
  }, [
    baseSnapshot,
    queryParams.startDate,
    queryParams.endDate,
    queryParams.grain,
    useDummyData,
  ]);

  const deliveryRateSeries = useMemo(
    () =>
      deliverySnapshot.deliverySeries.map((point) => ({
        period: point.period,
        date: point.date,
        deliveryRate: toRate(point.delivered, point.sent),
        conversionRate: toRate(point.converted, point.delivered),
      })),
    [deliverySnapshot.deliverySeries],
  );

  const deliveryComparison = useMemo(
    () =>
      comparePreviousPeriod && useDummyData
        ? dummyPreviousPeriod(deliverySnapshot.deliverySeries)
        : undefined,
    [comparePreviousPeriod, deliverySnapshot.deliverySeries, useDummyData],
  );
  const deliveryRateComparison = useMemo(
    () =>
      comparePreviousPeriod && useDummyData
        ? dummyPreviousPeriod(deliveryRateSeries)
        : undefined,
    [comparePreviousPeriod, deliveryRateSeries, useDummyData],
  );

  const filteredLogs = useMemo(() => {
    if (!useDummyData) {
      return [];
    }
    const now = Date.now();
    const maxDays =
      appliedCustomRange.start && appliedCustomRange.end
        ? (customDays ?? rangeDays[deliveryRange])
        : rangeDays[deliveryRange];

    const startMs = appliedCustomRange.start
      ? new Date(appliedCustomRange.start).getTime()
      : null;
    const endMs = appliedCustomRange.end
      ? new Date(appliedCustomRange.end).getTime()
      : null;

    const query = campaignQuery.trim().toLowerCase();
    return smsMessageLogs.filter((entry) => {
      const matchesStatus =
        statusFilter === "All" ? true : entry.status === statusFilter;
      const matchesQuery = query
        ? entry.campaignId.toLowerCase().includes(query) ||
          entry.campaignName.toLowerCase().includes(query)
        : true;
      const entryDate = new Date(entry.timestamp).getTime();
      const matchesRange =
        appliedCustomRange.start && appliedCustomRange.end && startMs && endMs
          ? entryDate >= startMs && entryDate <= endMs
          : now - entryDate <= maxDays * 24 * 60 * 60 * 1000;
      return matchesStatus && matchesQuery && matchesRange;
    });
  }, [
    campaignQuery,
    statusFilter,
    customRange,
    customDays,
    deliveryRange,
    useDummyData,
    appliedCustomRange.start,
    appliedCustomRange.end,
  ]);

  // Reset pagination when filters change
  useEffect(() => {
    setTablePage(1);
  }, [
    campaignQuery,
    statusFilter,
    appliedCustomRange.start,
    appliedCustomRange.end,
  ]);

  // Paginated logs for table display
  const paginatedLogs = useMemo(() => {
    const startIdx = (tablePage - 1) * tablePageSize;
    return filteredLogs.slice(startIdx, startIdx + tablePageSize);
  }, [filteredLogs, tablePage]);

  const csvHeaders = [
    "Campaign ID",
    "Campaign Name",
    "Status",
    "Sent",
    "Delivered",
    "Conversions",
    "Conversion Rate",
  ];

  const csvRows = filteredLogs.map((row, index) => [
    index + 1,
    row.campaignName,
    row.status,
    row.sent,
    row.delivered,
    row.conversions,
    `${row.conversionRate}%`,
  ]);

  const summaryStats = [
    {
      label: "Messages Sent",
      value: formatNumber(summarySnapshot.summary.sent),
      description: "Total SMS dispatched last 30 days",
      icon: MessageCircle,
    },
    {
      label: "Delivered Messages",
      value: formatNumber(summarySnapshot.summary.delivered),
      description: "Reached user devices successfully",
      icon: CheckCircle2,
    },
    {
      label: "Delivery Rate",
      value: `${summarySnapshot.summary.deliveryRate.toFixed(1)}%`,
      description: "Delivered vs total sent",
      icon: TrendingUp,
    },
    {
      label: "Failed Delivery Rate",
      value: `${summarySnapshot.summary.failedRate.toFixed(1)}%`,
      description: "Messages bouncing or rejected",
      icon: AlertTriangle,
    },
    {
      label: "Open Rate",
      value: `${summarySnapshot.summary.openRate.toFixed(1)}%`,
      description: "Recipients opening SMS content",
      icon: MailOpen,
    },
    {
      label: "Click-Through Rate",
      value: `${summarySnapshot.summary.ctr.toFixed(1)}%`,
      description: "Recipients tapping tracked links",
      icon: MousePointerClick,
    },
    {
      label: "Conversion Rate",
      value: `${summarySnapshot.summary.conversionRate.toFixed(1)}%`,
      description: "Delivered SMS leading to actions",
      icon: TrendingUp,
    },
    {
      label: "Opt-Out Rate",
      value: `${summarySnapshot.summary.optOutRate.toFixed(1)}%`,
      description: "Recipients choosing to unsubscribe",
      icon: UserMinus,
    },
  ];

  const statusStyles: Record<MessageStatus, string> = {
    Delivered: "border-emerald-200 bg-emerald-50 text-emerald-700",
    Failed: "border-red-200 bg-red-50 text-red-700",
    Pending: "border-amber-200 bg-amber-50 text-amber-700",
    Rejected: "border-slate-200 bg-slate-50 text-slate-700",
  };

  const tableColumnsMemo = useMemo<TableColumn<SMSTableRow>[]>(() => [
    {
      id: "campaignName",
      label: "Campaign Name",
      width: "200px",
      visible: true,
    },
    {
      id: "status",
      label: "Status",
      width: "150px",
      visible: true,
      render: (_, row) => (
        <span className="text-sm">
          {row.status}
        </span>
      ),
    },
    {
      id: "sent",
      label: "Sent",
      width: "100px",
      visible: true,
    },
    {
      id: "delivered",
      label: "Delivered",
      width: "100px",
      visible: true,
    },
    {
      id: "conversions",
      label: "Conversions",
      width: "120px",
      visible: true,
    },
    {
      id: "conversionRate",
      label: "Conversion Rate",
      width: "150px",
      visible: true,
      render: (value) => `${value}%`,
    },
  ], []);

  return (
    <div className="space-y-6">
      <header className="space-y-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Delivery & SMS Reports
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Deep dive into SMS delivery health and outcomes
          </p>
        </div>
        <ReportTrendsToolbar
          timeWindow={timeWindow}
          extraActions={
            <div
              className={`flex items-center gap-2 ${tw.rounded} border border-gray-200 bg-white px-3 py-1.5`}
            >
              <label
                htmlFor="sms-data-toggle"
                className="text-sm font-medium text-gray-700 whitespace-nowrap mr-2"
              >
                Data Mode:
              </label>
              <button
                id="sms-data-toggle"
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
                {useDummyData ? "Dummy Data" : "Real Data"}
              </span>
            </div>
          }
        />
      </header>

      {!isTrendsView && (
      <section>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {summaryStats.map((stat) => (
            <div
              key={stat.label}
              className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm`}
            >
              <div className="flex items-center gap-2">
                <stat.icon
                  className="h-5 w-5"
                  style={{ color: colors.primary.accent }}
                />
                <p className="text-sm font-medium text-gray-600">
                  {stat.label}
                </p>
              </div>
              <p className="mt-2 text-3xl font-bold text-gray-900">
                {stat.value}
              </p>
              <p className="mt-1 text-sm text-gray-500">{stat.description}</p>
            </div>
          ))}
        </div>
      </section>
      )}

      {isTrendsView && (
      <section className="grid gap-6 lg:grid-cols-2">
        <ReportChartCard
          title="SMS Delivery Funnel"
          subtitle="Track sent, delivered, and conversions across timelines"
          filename="sms-delivery-funnel.csv"
          audit={chartAudit}
          columns={[
            { key: "period", label: "Period" },
            { key: "date", label: "Date" },
            { key: "sent", label: "Sent" },
            { key: "delivered", label: "Delivered" },
            { key: "converted", label: "Converted" },
          ]}
          rows={deliverySnapshot.deliverySeries}
        >
          <ReportGroupedBarChart
            data={deliverySnapshot.deliverySeries}
            xKey="period"
            yLabel="Message Count"
            yTickFormatter={formatNumber}
            comparisonData={deliveryComparison}
            series={[
              {
                dataKey: "sent",
                name: "Sent",
                color: colors.reportCharts.deliverySMS.smsDelivery.sent,
              },
              {
                dataKey: "delivered",
                name: "Delivered",
                color: colors.reportCharts.deliverySMS.smsDelivery.delivered,
              },
              {
                dataKey: "converted",
                name: "Converted",
                color: colors.reportCharts.deliverySMS.smsDelivery.converted,
              },
            ]}
          />
        </ReportChartCard>
        <ReportChartCard
          title="Delivery & Conversion Rates"
          subtitle="Rates derived from the funnel series for the selected window"
          filename="sms-delivery-rates.csv"
          audit={chartAudit}
          columns={[
            { key: "period", label: "Period" },
            { key: "date", label: "Date" },
            { key: "deliveryRate", label: "Delivery Rate %" },
            { key: "conversionRate", label: "Conversion Rate %" },
          ]}
          rows={deliveryRateSeries}
        >
          <ReportGroupedBarChart
            data={deliveryRateSeries}
            xKey="period"
            yLabel="Rate (%)"
            valueFormatter={(value) => `${value}%`}
            comparisonData={deliveryRateComparison}
            series={[
              {
                dataKey: "deliveryRate",
                name: "Delivery Rate %",
                color: colors.reportCharts.deliverySMS.smsDelivery.delivered,
              },
              {
                dataKey: "conversionRate",
                name: "Conversion Rate %",
                color: colors.reportCharts.deliverySMS.smsDelivery.converted,
              },
            ]}
          />
        </ReportChartCard>
      </section>
      )}

      {!isTrendsView && (
      <section className="space-y-6">
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Message Delivery Log
            </h2>
            <p className="mt-1 text-sm text-gray-600">
              Inspect individual sends, troubleshoot failures, and export detail
            </p>
          </div>
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <Input
              placeholder="Search campaign"
              value={campaignQuery}
              onChange={setCampaignQuery}
              className="w-full md:w-80"
            />
            <HeadlessSelect
              value={statusFilter}
              onChange={(value) =>
                setStatusFilter(value as MessageStatus | "All")
              }
              options={statusOptions.map((option) => ({
                label: option === "All" ? "All Statuses" : option,
                value: option,
              }))}
              placeholder="All Statuses"
              className="w-full md:w-40"
            />
            <CsvDownloadButton
              headers={csvHeaders}
              rows={csvRows}
              filename="sms_delivery_logs.csv"
              style={{ backgroundColor: colors.primary.action }}
            />
          </div>
        </div>
        <>
          <Table<SMSTableRow>
            columns={tableColumnsMemo}
            data={filteredLogs.map((entry) => ({
              id: entry.id,
              campaignName: entry.campaignName,
              status: entry.status,
              sent: entry.sent,
              delivered: entry.delivered,
              conversions: entry.conversions,
              conversionRate: entry.conversionRate,
            }))}
            totalItems={filteredLogs.length}
            currentPage={tablePage}
            pageSize={tablePageSize}
            onPageChange={setTablePage}
            style={{
              headerBackground: colors.surface.tableHeader,
              headerTextColor: colors.surface.tableHeaderText,
              rowBackground: colors.surface.tablebodybg,
              rowSpacing: "0 8px",
            }}
          />
          {filteredLogs.length > 0 && (
            <Pagination
              currentPage={tablePage}
              pageSize={tablePageSize}
              totalItems={filteredLogs.length}
              onPageChange={setTablePage}
              onPageSizeChange={(size) => {
                setTablePageSize(size);
                setTablePage(1);
              }}
            />
          )}
        </>
        {filteredLogs.length === 0 && (
          <div className="py-10 text-center text-sm text-gray-500">
            No messages match your filters yet.
          </div>
        )}
      </section>
      )}
    </div>
  );
}
