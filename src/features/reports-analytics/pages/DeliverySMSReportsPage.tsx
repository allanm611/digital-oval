import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { extractBackendError } from "../../../shared/utils/errorHandler";
import { colors } from "../../../shared/utils/tokens";
import Input from "../../../shared/components/ui/Input";
import { tw } from "../../../shared/utils/utils";
import HeadlessSelect from "../../../shared/components/ui/HeadlessSelect";
import Pagination, { DEFAULT_PAGE_SIZE } from "../../../shared/components/ui/Pagination";
import CsvDownloadButton from "../../../shared/components/CsvDownloadButton";
import LoadingSpinner from "../../../shared/components/ui/LoadingSpinner";
import { Table } from "../../../shared/components/Table/Table";
import type { TableColumn } from "../../../shared/components/Table/types";
import type {
  DeliverySMSReportsResponse,
  RangeOption,
  SmsBroadcastRow,
  SmsDeliveryStatus,
} from "../types/ReportsAPI";
import { useReportTimeWindow } from "../hooks/useReportTimeWindow";
import { usePreviousPeriodSeries } from "../hooks/usePreviousPeriodSeries";
import { alignTrendSeries, dummyTemplateRange, toChartAudit } from "../utils/reportTimeWindow";
import {
  previousComparisonLabel as formatPreviousComparisonLabel,
  resolveComparisonSeries,
} from "../utils/reportComparison";
import { pickNamedArray } from "../utils/normalizeCampaignReport";
import { ratePercent } from "../utils/campaignCvmMetrics";
import ReportTrendsToolbar from "../components/ReportTrendsToolbar";
import SwitchableReportChart from "../components/SwitchableReportChart";
import SmsDeliveryKpiGrid from "../components/SmsDeliveryKpiGrid";
import { smsDeliveryReportsService } from "../services/smsDeliveryReportsService";
import { normalizeSmsDeliveryReport } from "../utils/normalizeSmsDeliveryReport";
import {
  emptySmsSnapshot,
  formatCount,
  formatRate,
  SMS_CVM_LABELS,
  smsCvmSnapshot,
  toSmsSummary,
  type SmsCvmSnapshot,
} from "../utils/smsCvmMetrics";

type DeliveryPoint = DeliverySMSReportsResponse["deliveryTimeline"][number];

type SmsRangeData = {
  summary: SmsCvmSnapshot;
  deliverySeries: DeliveryPoint[];
};

const rangeDays: Record<RangeOption, number> = {
  "7d": 7,
  "30d": 30,
  "90d": 90,
};

const statusOptions: (SmsDeliveryStatus | "All")[] = [
  "All",
  "Delivered",
  "Failed",
  "Pending",
  "Rejected",
];

const RELATED_REPORTS = [
  { label: "Campaign Reports", to: "/dashboard/reports/campaigns" },
  { label: "Offer Reports", to: "/dashboard/reports/offers" },
  { label: "Delivery & Email Reports", to: "/dashboard/reports/email-delivery" },
  { label: "Segment Reports", to: "/dashboard/reports/segments" },
  { label: "Customer Profile Reports", to: "/dashboard/reports/customer-profiles" },
];

function snapshot(
  sent: number,
  delivered: number,
  takenUp: number,
  optOutRate: number,
  subscribersReached: number,
): SmsCvmSnapshot {
  const failed = Math.max(0, sent - delivered);
  return {
    sent,
    delivered,
    failed,
    deliveryRate: ratePercent(delivered, sent),
    failedRate: ratePercent(failed, sent),
    subscribersReached,
    takenUp,
    takeUpRate: ratePercent(takenUp, delivered),
    optOutRate,
  };
}

const smsMockData: Record<RangeOption, SmsRangeData> = {
  "7d": {
    summary: snapshot(87_500, 82_000, 6_400, 0.6, 74_200),
    deliverySeries: [
      { period: "Mon", sent: 12_500, delivered: 11_800, takenUp: 920, converted: 920 },
      { period: "Tue", sent: 12_200, delivered: 11_500, takenUp: 915, converted: 915 },
      { period: "Wed", sent: 12_800, delivered: 12_050, takenUp: 940, converted: 940 },
      { period: "Thu", sent: 12_400, delivered: 11_780, takenUp: 930, converted: 930 },
      { period: "Fri", sent: 12_600, delivered: 11_900, takenUp: 945, converted: 945 },
      { period: "Sat", sent: 12_100, delivered: 11_420, takenUp: 905, converted: 905 },
      { period: "Sun", sent: 13_000, delivered: 12_550, takenUp: 950, converted: 950 },
    ],
  },
  "30d": {
    summary: snapshot(360_000, 337_500, 27_000, 0.7, 301_000),
    deliverySeries: [
      { period: "Oct 1-7", sent: 90_000, delivered: 84_800, takenUp: 6_750, converted: 6_750 },
      { period: "Oct 8-14", sent: 90_500, delivered: 85_050, takenUp: 6_820, converted: 6_820 },
      { period: "Oct 15-21", sent: 88_500, delivered: 83_300, takenUp: 6_700, converted: 6_700 },
      { period: "Oct 22-28", sent: 91_000, delivered: 84_350, takenUp: 6_780, converted: 6_780 },
    ],
  },
  "90d": {
    summary: snapshot(1_075_000, 1_008_000, 80_400, 0.8, 890_000),
    deliverySeries: [
      { period: "September", sent: 355_000, delivered: 333_000, takenUp: 26_700, converted: 26_700 },
      { period: "October", sent: 360_000, delivered: 337_500, takenUp: 27_000, converted: 27_000 },
      { period: "November", sent: 360_000, delivered: 337_500, takenUp: 27_200, converted: 27_200 },
    ],
  },
};

const BROADCAST_SEEDS: Array<Omit<SmsBroadcastRow, "timestamp" | "takeUpRate"> & { daysAgo: number }> = [
  { id: "B-101", campaignId: "", campaignName: "Loyalty Reactivation", offerId: "", offerName: "Data Bonus 1GB", segmentId: "", segmentName: "At Risk", status: "Delivered", sent: 12500, delivered: 11800, subscribersReached: 11240, takenUp: 920, daysAgo: 1 },
  { id: "B-102", campaignId: "", campaignName: "Loyalty Reactivation", offerId: "", offerName: "Data Bonus 1GB", segmentId: "", segmentName: "Core", status: "Pending", sent: 8400, delivered: 0, subscribersReached: 0, takenUp: 0, daysAgo: 0 },
  { id: "B-103", campaignId: "", campaignName: "VIP Retention", offerId: "", offerName: "Voice Bundle", segmentId: "", segmentName: "High Value", status: "Delivered", sent: 4200, delivered: 4010, subscribersReached: 3980, takenUp: 610, daysAgo: 3 },
  { id: "B-104", campaignId: "", campaignName: "Churn Win-back", offerId: "", offerName: "Win-back Credit", segmentId: "", segmentName: "Win-back", status: "Failed", sent: 9600, delivered: 2100, subscribersReached: 1980, takenUp: 40, errorCode: "TIMEOUT", daysAgo: 4 },
  { id: "B-105", campaignId: "", campaignName: "Welcome Onboarding", offerId: "", offerName: "Starter Pack", segmentId: "", segmentName: "New", status: "Delivered", sent: 15100, delivered: 14620, subscribersReached: 14110, takenUp: 1880, daysAgo: 6 },
  { id: "B-106", campaignId: "", campaignName: "Recharge Nudge", offerId: "", offerName: "Airtime Bonus", segmentId: "", segmentName: "Dormant", status: "Rejected", sent: 7300, delivered: 0, subscribersReached: 0, takenUp: 0, errorCode: "DND_ACTIVE", daysAgo: 8 },
  { id: "B-107", campaignId: "", campaignName: "Recharge Nudge", offerId: "", offerName: "Airtime Bonus", segmentId: "", segmentName: "Growth", status: "Delivered", sent: 18800, delivered: 17640, subscribersReached: 16990, takenUp: 1420, daysAgo: 12 },
  { id: "B-108", campaignId: "", campaignName: "Birthday Offer", offerId: "", offerName: "Birthday Data", segmentId: "", segmentName: "Core", status: "Delivered", sent: 2600, delivered: 2510, subscribersReached: 2490, takenUp: 740, daysAgo: 15 },
  { id: "B-109", campaignId: "", campaignName: "Data Upsell", offerId: "", offerName: "Night Bundle", segmentId: "", segmentName: "High Value", status: "Failed", sent: 5400, delivered: 900, subscribersReached: 860, takenUp: 20, errorCode: "INV_NUMBER", daysAgo: 21 },
  { id: "B-110", campaignId: "", campaignName: "Data Upsell", offerId: "", offerName: "Night Bundle", segmentId: "", segmentName: "Growth", status: "Delivered", sent: 22100, delivered: 20940, subscribersReached: 20110, takenUp: 1670, daysAgo: 28 },
  { id: "B-111", campaignId: "", campaignName: "Roaming Alert", offerId: "", offerName: "Roaming Pass", segmentId: "", segmentName: "Core", status: "Pending", sent: 1100, delivered: 0, subscribersReached: 0, takenUp: 0, daysAgo: 2 },
  { id: "B-112", campaignId: "", campaignName: "Churn Win-back", offerId: "", offerName: "Win-back Credit", segmentId: "", segmentName: "At Risk", status: "Delivered", sent: 13400, delivered: 12110, subscribersReached: 11840, takenUp: 980, daysAgo: 45 },
];

function daysAgoIso(daysAgo: number): string {
  const date = new Date();
  date.setHours(10, 0, 0, 0);
  date.setDate(date.getDate() - daysAgo);
  return date.toISOString();
}

const dummyBroadcasts: SmsBroadcastRow[] = BROADCAST_SEEDS.map((seed) => {
  const { daysAgo, ...row } = seed;
  return {
    ...row,
    timestamp: daysAgoIso(daysAgo),
    takeUpRate: ratePercent(row.takenUp, row.delivered),
  };
});

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

const getScaleFactor = (customDays: number | null, baseRange: RangeOption): number => {
  if (!customDays) return 1;
  return customDays / rangeDays[baseRange];
};

function scaleSnapshot(base: SmsCvmSnapshot, factor: number): SmsCvmSnapshot {
  if (factor === 1) return base;
  return snapshot(
    Math.round(base.sent * factor),
    Math.round(base.delivered * factor),
    Math.round(base.takenUp * factor),
    base.optOutRate,
    Math.round(base.subscribersReached * factor),
  );
}

function entityPath(
  kind: "campaign" | "offer" | "segment",
  id: string | undefined,
  label: string,
): string | null {
  if (!label || label === "—") return null;
  if (kind === "segment") return "/dashboard/reports/segments";
  if (!id || !/^\d+$/.test(id)) return null;
  if (kind === "campaign") return `/dashboard/campaigns/${id}/report`;
  return `/dashboard/reports/offers/${id}`;
}

function EntityLink({
  label,
  to,
}: {
  label: string;
  to: string | null;
}) {
  if (!to || !label || label === "—") {
    return <span>{label || "—"}</span>;
  }
  return (
    <Link to={to} className="font-medium text-gray-900 underline-offset-2 hover:underline">
      {label}
    </Link>
  );
}

export default function DeliverySMSReportsPage() {
  const timeWindow = useReportTimeWindow({
    overviewPreset: "monthly",
    defaultTrendsPreset: "daily",
  });
  const {
    isTrendsView,
    queryParams,
    activeWindow,
    comparePreviousPeriod,
    previousQueryParams,
    previousPeriodLabel,
  } = timeWindow;
  const chartAudit = toChartAudit(activeWindow);
  const deliveryRange = timeWindow.rangeKey;
  const appliedCustomRange = activeWindow.bounds;

  const [statusFilter, setStatusFilter] = useState<SmsDeliveryStatus | "All">("All");
  const [campaignQuery, setCampaignQuery] = useState("");
  const [useDummyData, setUseDummyData] = useState(true);
  const [tablePage, setTablePage] = useState(1);
  const [tablePageSize, setTablePageSize] = useState(DEFAULT_PAGE_SIZE);
  const [liveReport, setLiveReport] = useState<DeliverySMSReportsResponse | null>(null);
  const [liveReportError, setLiveReportError] = useState<string | null>(null);
  const [isLoadingLiveReport, setIsLoadingLiveReport] = useState(false);

  const customDays = getDaysBetween(appliedCustomRange.start, appliedCustomRange.end);
  const activeRangeKey: RangeOption =
    appliedCustomRange.start && appliedCustomRange.end
      ? mapDaysToRange(customDays)
      : deliveryRange;
  const scaleFactor =
    appliedCustomRange.start && appliedCustomRange.end && customDays
      ? getScaleFactor(customDays, activeRangeKey)
      : 1;

  useEffect(() => {
    if (useDummyData) {
      setLiveReport(null);
      setLiveReportError(null);
      setIsLoadingLiveReport(false);
      return;
    }

    let cancelled = false;
    const handle = window.setTimeout(() => {
      const load = async () => {
        try {
          setIsLoadingLiveReport(true);
          setLiveReportError(null);
          const response = await smsDeliveryReportsService.getPortfolio({
            range: queryParams.range || activeRangeKey,
            grain: queryParams.grain,
            startDate: queryParams.startDate,
            endDate: queryParams.endDate,
            preset: queryParams.preset,
            page: 1,
            pageSize: 200,
            search: campaignQuery.trim() || undefined,
            status: statusFilter === "All" ? undefined : statusFilter,
            sortBy: "sent",
            sortOrder: "desc",
          });
          if (cancelled) return;
          const normalized = normalizeSmsDeliveryReport(response);
          if (response.success && normalized) {
            setLiveReport(normalized);
          } else {
            setLiveReport(null);
            setLiveReportError(
              response.error || response.message || "Failed to load SMS delivery report",
            );
          }
        } catch (error) {
          if (cancelled) return;
          setLiveReport(null);
          setLiveReportError(
            extractBackendError(error, "Failed to load Delivery & SMS Reports."),
          );
        } finally {
          if (!cancelled) setIsLoadingLiveReport(false);
        }
      };
      void load();
    }, campaignQuery ? 250 : 0);

    return () => {
      cancelled = true;
      window.clearTimeout(handle);
    };
  }, [
    useDummyData,
    queryParams.range,
    queryParams.grain,
    queryParams.startDate,
    queryParams.endDate,
    queryParams.preset,
    campaignQuery,
    statusFilter,
    activeRangeKey,
  ]);

  const summary = useMemo(() => {
    if (!useDummyData) {
      return liveReport?.summary ? smsCvmSnapshot(liveReport.summary) : emptySmsSnapshot();
    }
    return scaleSnapshot(smsMockData[activeRangeKey].summary, scaleFactor);
  }, [activeRangeKey, liveReport, scaleFactor, useDummyData]);

  const deliverySeries = useMemo(() => {
    const window = {
      startDate: queryParams.startDate,
      endDate: queryParams.endDate,
      grain: queryParams.grain,
    };
    if (!useDummyData) {
      return alignTrendSeries(liveReport?.deliveryTimeline || [], window);
    }
    const template =
      smsMockData[dummyTemplateRange(queryParams.grain || "daily")].deliverySeries;
    return alignTrendSeries(template, window);
  }, [
    liveReport,
    queryParams.endDate,
    queryParams.grain,
    queryParams.startDate,
    useDummyData,
  ]);

  const deliveryRateSeries = useMemo(
    () =>
      deliverySeries.map((point) => ({
        period: point.period,
        date: point.date,
        deliveryRate: ratePercent(point.delivered, point.sent),
        takeUpRate: ratePercent(point.takenUp ?? point.converted, point.delivered),
      })),
    [deliverySeries],
  );

  const fetchPreviousTimeline = useCallback(async (params: typeof previousQueryParams) => {
    const envelope = await smsDeliveryReportsService.getTimeline({
      range: params.range || deliveryRange,
      grain: params.grain,
      startDate: params.startDate,
      endDate: params.endDate,
      preset: params.preset,
    });
    const normalized = normalizeSmsDeliveryReport(envelope);
    return (
      normalized?.deliveryTimeline ||
      pickNamedArray<DeliveryPoint>(envelope.data, ["deliveryTimeline", "delivery_timeline", "timeline"])
    );
  }, [deliveryRange]);

  const livePreviousTimeline = usePreviousPeriodSeries<DeliveryPoint>({
    enabled: comparePreviousPeriod && !useDummyData,
    previousQueryParams,
    fetchSeries: fetchPreviousTimeline,
  });

  const deliveryComparison = useMemo(
    () =>
      resolveComparisonSeries({
        compare: comparePreviousPeriod,
        useDummyData,
        current: deliverySeries,
        livePrevious: livePreviousTimeline,
        previousQueryParams,
        align: alignTrendSeries,
      }),
    [comparePreviousPeriod, deliverySeries, livePreviousTimeline, previousQueryParams, useDummyData],
  );

  const previousRateSeries = useMemo(
    () =>
      (deliveryComparison || []).map((point) => ({
        period: point.period,
        date: point.date,
        deliveryRate: ratePercent(point.delivered, point.sent),
        takeUpRate: ratePercent(point.takenUp ?? point.converted, point.delivered),
      })),
    [deliveryComparison],
  );

  const previousComparisonLabel = formatPreviousComparisonLabel(
    comparePreviousPeriod,
    previousPeriodLabel,
  );

  const filteredBroadcasts = useMemo(() => {
    const source = useDummyData ? dummyBroadcasts : liveReport?.broadcasts || [];
    const now = Date.now();
    const maxDays =
      appliedCustomRange.start && appliedCustomRange.end
        ? (customDays ?? rangeDays[deliveryRange])
        : rangeDays[deliveryRange];
    const startMs = appliedCustomRange.start ? new Date(appliedCustomRange.start).getTime() : null;
    const endMs = appliedCustomRange.end ? new Date(appliedCustomRange.end).getTime() : null;
    const query = campaignQuery.trim().toLowerCase();

    return source.filter((entry) => {
      const matchesStatus = statusFilter === "All" || entry.status === statusFilter;
      const matchesQuery = query
        ? [entry.campaignName, entry.campaignId, entry.offerName, entry.segmentName]
            .join(" ")
            .toLowerCase()
            .includes(query)
        : true;
      if (!useDummyData) return matchesStatus && matchesQuery;
      const entryDate = new Date(entry.timestamp).getTime();
      const matchesRange =
        startMs && endMs
          ? entryDate >= startMs && entryDate <= endMs
          : now - entryDate <= maxDays * 24 * 60 * 60 * 1000;
      return matchesStatus && matchesQuery && matchesRange;
    });
  }, [
    appliedCustomRange.end,
    appliedCustomRange.start,
    campaignQuery,
    customDays,
    deliveryRange,
    liveReport,
    statusFilter,
    useDummyData,
  ]);

  useEffect(() => {
    setTablePage(1);
  }, [campaignQuery, statusFilter, appliedCustomRange.start, appliedCustomRange.end, useDummyData]);

  const tableColumns = useMemo<TableColumn<SmsBroadcastRow>[]>(
    () => [
      {
        id: "campaignName",
        label: SMS_CVM_LABELS.campaign,
        width: "180px",
        visible: true,
        render: (_, row) => (
          <EntityLink
            label={row.campaignName}
            to={entityPath("campaign", row.campaignId, row.campaignName)}
          />
        ),
      },
      {
        id: "offerName",
        label: SMS_CVM_LABELS.offer,
        width: "160px",
        visible: true,
        render: (_, row) => (
          <EntityLink
            label={row.offerName}
            to={entityPath("offer", row.offerId, row.offerName)}
          />
        ),
      },
      {
        id: "segmentName",
        label: SMS_CVM_LABELS.segment,
        width: "140px",
        visible: true,
        render: (_, row) => (
          <EntityLink
            label={row.segmentName}
            to={entityPath("segment", row.segmentId, row.segmentName)}
          />
        ),
      },
      { id: "status", label: "Delivery Status", width: "140px", visible: true },
      {
        id: "sent",
        label: "Dispatched",
        width: "110px",
        visible: true,
        render: (value) => formatCount(value),
      },
      {
        id: "delivered",
        label: SMS_CVM_LABELS.delivered,
        width: "110px",
        visible: true,
        render: (value) => formatCount(value),
      },
      {
        id: "takenUp",
        label: SMS_CVM_LABELS.takenUp,
        width: "110px",
        visible: true,
        render: (value) => formatCount(value),
      },
      {
        id: "takeUpRate",
        label: SMS_CVM_LABELS.takeUpRate,
        width: "130px",
        visible: true,
        render: (value) => formatRate(value),
      },
    ],
    [],
  );

  const csvHeaders = [
    "Campaign",
    "Offer",
    "Segment",
    "Delivery Status",
    "Dispatched",
    "Delivered",
    "Subscribers Reached",
    "Taken Up",
    "Take-up Rate",
  ];
  const csvRows = filteredBroadcasts.map((row) => [
    row.campaignName,
    row.offerName,
    row.segmentName,
    row.status,
    row.sent,
    row.delivered,
    row.subscribersReached,
    row.takenUp,
    `${row.takeUpRate}%`,
  ]);

  return (
    <div className="space-y-6">
      <header className="space-y-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Delivery & SMS Reports</h1>
          <p className="mt-2 text-sm text-gray-600">
            SMS dispatch, handset delivery, subscriber reach, offer take-up, and channel opt-out
            for the selected window
          </p>
        </div>
        <nav className="flex flex-wrap gap-2" aria-label="Related reports">
          {RELATED_REPORTS.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={`${tw.rounded} border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:border-gray-300 hover:text-gray-900`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <ReportTrendsToolbar
          timeWindow={timeWindow}
          extraActions={
            <div
              className={`flex items-center gap-2 ${tw.rounded} border border-gray-200 bg-white px-3 py-1.5`}
            >
              <label
                htmlFor="sms-data-toggle"
                className="mr-2 whitespace-nowrap text-sm font-medium text-gray-700"
              >
                Data Mode:
              </label>
              <button
                id="sms-data-toggle"
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
              <span className="ml-2 whitespace-nowrap text-xs text-gray-600">
                {useDummyData ? "Dummy Data" : "Real Data"}
              </span>
            </div>
          }
        />
      </header>

      {!isTrendsView && (
        <section>
          <SmsDeliveryKpiGrid
            summary={toSmsSummary(summary)}
            heroTrends={liveReport?.heroTrends}
            useDummyData={useDummyData}
          />
        </section>
      )}

      {isTrendsView && (
        <section className="grid gap-6 lg:grid-cols-2">
          <SwitchableReportChart
            title="SMS Delivery"
            subtitle="Dispatched, delivered, and offer take-up across the window"
            filename="sms-delivery.csv"
            audit={chartAudit}
            columns={[
              { key: "period", label: "Period" },
              { key: "date", label: "Date" },
              { key: "sent", label: "Dispatched" },
              { key: "delivered", label: "Delivered" },
              { key: "takenUp", label: "Taken Up" },
            ]}
            rows={deliverySeries}
            xKey="period"
            yLabel="Messages"
            yTickFormatter={(value) => formatCount(value)}
            comparisonData={deliveryComparison}
            comparisonLabel={previousComparisonLabel}
            series={[
              {
                dataKey: "sent",
                name: "Dispatched",
                color: colors.reportCharts.deliverySMS.smsDelivery.sent,
              },
              {
                dataKey: "delivered",
                name: "Delivered",
                color: colors.reportCharts.deliverySMS.smsDelivery.delivered,
              },
              {
                dataKey: "takenUp",
                name: "Taken Up",
                color: colors.reportCharts.deliverySMS.smsDelivery.converted,
              },
            ]}
          />
          <SwitchableReportChart
            title="Delivery & Take-up Rates"
            subtitle="Delivery rate and offer take-up rate for the same window"
            filename="sms-delivery-rates.csv"
            audit={chartAudit}
            columns={[
              { key: "period", label: "Period" },
              { key: "date", label: "Date" },
              { key: "deliveryRate", label: "Delivery Rate %" },
              { key: "takeUpRate", label: "Take-up Rate %" },
            ]}
            rows={deliveryRateSeries}
            xKey="period"
            yLabel="Rate (%)"
            valueFormatter={(value) => `${value}%`}
            comparisonData={comparePreviousPeriod ? previousRateSeries : undefined}
            comparisonLabel={previousComparisonLabel}
            series={[
              {
                dataKey: "deliveryRate",
                name: "Delivery Rate %",
                color: colors.reportCharts.deliverySMS.smsDelivery.delivered,
              },
              {
                dataKey: "takeUpRate",
                name: "Take-up Rate %",
                color: colors.reportCharts.deliverySMS.smsDelivery.converted,
              },
            ]}
          />
        </section>
      )}

      {!isTrendsView && (
        <section className="space-y-6">
          <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {SMS_CVM_LABELS.broadcastLog}
              </h2>
              <p className="mt-1 text-sm text-gray-600">
                Each row is an SMS broadcast, with the campaign, offer, and segment it ran against
              </p>
            </div>
            <div className="flex flex-col gap-3 md:flex-row md:items-center">
              <Input
                placeholder="Search campaign, offer, or segment"
                value={campaignQuery}
                onChange={(value) => setCampaignQuery(String(value))}
                className="w-full md:w-80"
              />
              <HeadlessSelect
                value={statusFilter}
                onChange={(value) => setStatusFilter(value as SmsDeliveryStatus | "All")}
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
                filename="sms_broadcast_delivery.csv"
                style={{ backgroundColor: colors.primary.action }}
              />
            </div>
          </div>

          {liveReportError && !useDummyData && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {liveReportError}
            </div>
          )}

          {isLoadingLiveReport && !useDummyData ? (
            <div className="flex justify-center py-16">
              <LoadingSpinner />
            </div>
          ) : (
            <>
              <Table<SmsBroadcastRow>
                columns={tableColumns}
                data={filteredBroadcasts}
                totalItems={filteredBroadcasts.length}
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
              {filteredBroadcasts.length > 0 && (
                <Pagination
                  currentPage={tablePage}
                  pageSize={tablePageSize}
                  totalItems={filteredBroadcasts.length}
                  onPageChange={setTablePage}
                  onPageSizeChange={(size) => {
                    setTablePageSize(size);
                    setTablePage(1);
                  }}
                />
              )}
              {filteredBroadcasts.length === 0 && (
                <div className="py-10 text-center text-sm text-gray-500">
                  No SMS broadcasts match this window and filter.
                </div>
              )}
            </>
          )}
        </section>
      )}
    </div>
  );
}
