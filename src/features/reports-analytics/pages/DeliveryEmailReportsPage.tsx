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
  DeliveryEmailReportsResponse,
  EmailDeliveryStatus,
  EmailDispatchRow,
  RangeOption,
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
import EmailDeliveryKpiGrid from "../components/EmailDeliveryKpiGrid";
import { emailDeliveryReportsService } from "../services/emailDeliveryReportsService";
import { normalizeEmailDeliveryReport } from "../utils/normalizeEmailDeliveryReport";
import {
  EMAIL_CVM_LABELS,
  emailCvmSnapshot,
  emptyEmailSnapshot,
  formatCount,
  formatRate,
  toEmailSummary,
  type EmailCvmSnapshot,
} from "../utils/emailCvmMetrics";

type DeliveryPoint = DeliveryEmailReportsResponse["deliveryTimeline"][number];

type EmailRangeData = {
  summary: EmailCvmSnapshot;
  deliverySeries: DeliveryPoint[];
};

const rangeDays: Record<RangeOption, number> = {
  "7d": 7,
  "30d": 30,
  "90d": 90,
};

const statusOptions: (EmailDeliveryStatus | "All")[] = [
  "All",
  "Delivered",
  "Bounced",
  "Deferred",
  "Rejected",
];

const RELATED_REPORTS = [
  { label: "Campaign Reports", to: "/dashboard/reports/campaigns" },
  { label: "Offer Reports", to: "/dashboard/reports/offers" },
  { label: "Delivery & SMS Reports", to: "/dashboard/reports/delivery" },
  { label: "Segment Reports", to: "/dashboard/reports/segments" },
  { label: "Customer Profile Reports", to: "/dashboard/reports/customer-profiles" },
];

function snapshot(
  sent: number,
  delivered: number,
  takenUp: number,
  optOutRate: number,
  subscribersReached: number,
  bounced?: number,
): EmailCvmSnapshot {
  const bouncedCount = bounced ?? Math.max(0, sent - delivered);
  return {
    sent,
    delivered,
    bounced: bouncedCount,
    deliveryRate: ratePercent(delivered, sent),
    bounceRate: ratePercent(bouncedCount, sent),
    subscribersReached,
    takenUp,
    takeUpRate: ratePercent(takenUp, delivered),
    optOutRate,
  };
}

const emailMockData: Record<RangeOption, EmailRangeData> = {
  "7d": {
    summary: snapshot(64_200, 59_100, 2_240, 0.35, 54_800, 3_400),
    deliverySeries: [
      { period: "Mon", sent: 9_200, delivered: 8_480, takenUp: 320, converted: 320 },
      { period: "Tue", sent: 9_050, delivered: 8_340, takenUp: 310, converted: 310 },
      { period: "Wed", sent: 9_400, delivered: 8_680, takenUp: 335, converted: 335 },
      { period: "Thu", sent: 9_100, delivered: 8_390, takenUp: 318, converted: 318 },
      { period: "Fri", sent: 9_250, delivered: 8_520, takenUp: 328, converted: 328 },
      { period: "Sat", sent: 8_900, delivered: 8_160, takenUp: 305, converted: 305 },
      { period: "Sun", sent: 9_300, delivered: 8_530, takenUp: 324, converted: 324 },
    ],
  },
  "30d": {
    summary: snapshot(258_000, 238_000, 9_050, 0.4, 214_000, 13_200),
    deliverySeries: [
      { period: "Oct 1-7", sent: 64_200, delivered: 59_100, takenUp: 2_240, converted: 2_240 },
      { period: "Oct 8-14", sent: 64_800, delivered: 59_700, takenUp: 2_280, converted: 2_280 },
      { period: "Oct 15-21", sent: 63_400, delivered: 58_400, takenUp: 2_210, converted: 2_210 },
      { period: "Oct 22-28", sent: 65_600, delivered: 60_800, takenUp: 2_320, converted: 2_320 },
    ],
  },
  "90d": {
    summary: snapshot(780_000, 720_000, 27_400, 0.42, 648_000, 39_000),
    deliverySeries: [
      { period: "September", sent: 258_000, delivered: 238_000, takenUp: 9_050, converted: 9_050 },
      { period: "October", sent: 262_000, delivered: 242_000, takenUp: 9_180, converted: 9_180 },
      { period: "November", sent: 260_000, delivered: 240_000, takenUp: 9_170, converted: 9_170 },
    ],
  },
};

const DISPATCH_SEEDS: Array<
  Omit<EmailDispatchRow, "sentDate" | "takeUpRate"> & { daysAgo: number }
> = [
  { id: "E-201", campaignId: "", campaignName: "Loyalty Reactivation", offerId: "", offerName: "Data Bonus 1GB", segmentId: "", segmentName: "At Risk", status: "Delivered", sent: 8200, delivered: 7680, subscribersReached: 7410, takenUp: 290, daysAgo: 1 },
  { id: "E-202", campaignId: "", campaignName: "Loyalty Reactivation", offerId: "", offerName: "Data Bonus 1GB", segmentId: "", segmentName: "Core", status: "Deferred", sent: 4100, delivered: 0, subscribersReached: 0, takenUp: 0, daysAgo: 0 },
  { id: "E-203", campaignId: "", campaignName: "VIP Retention", offerId: "", offerName: "Voice Bundle", segmentId: "", segmentName: "High Value", status: "Delivered", sent: 2600, delivered: 2480, subscribersReached: 2410, takenUp: 180, daysAgo: 3 },
  { id: "E-204", campaignId: "", campaignName: "Churn Win-back", offerId: "", offerName: "Win-back Credit", segmentId: "", segmentName: "Win-back", status: "Bounced", sent: 5400, delivered: 1200, subscribersReached: 1140, takenUp: 18, errorCode: "HARD_BOUNCE", daysAgo: 4 },
  { id: "E-205", campaignId: "", campaignName: "Welcome Onboarding", offerId: "", offerName: "Starter Pack", segmentId: "", segmentName: "New", status: "Delivered", sent: 9800, delivered: 9410, subscribersReached: 9020, takenUp: 640, daysAgo: 6 },
  { id: "E-206", campaignId: "", campaignName: "Recharge Nudge", offerId: "", offerName: "Airtime Bonus", segmentId: "", segmentName: "Dormant", status: "Rejected", sent: 3100, delivered: 0, subscribersReached: 0, takenUp: 0, errorCode: "SUPPRESSED", daysAgo: 8 },
  { id: "E-207", campaignId: "", campaignName: "Recharge Nudge", offerId: "", offerName: "Airtime Bonus", segmentId: "", segmentName: "Growth", status: "Delivered", sent: 11200, delivered: 10440, subscribersReached: 9980, takenUp: 410, daysAgo: 12 },
  { id: "E-208", campaignId: "", campaignName: "Birthday Offer", offerId: "", offerName: "Birthday Data", segmentId: "", segmentName: "Core", status: "Delivered", sent: 1800, delivered: 1740, subscribersReached: 1710, takenUp: 260, daysAgo: 15 },
  { id: "E-209", campaignId: "", campaignName: "Data Upsell", offerId: "", offerName: "Night Bundle", segmentId: "", segmentName: "High Value", status: "Bounced", sent: 3600, delivered: 640, subscribersReached: 610, takenUp: 12, errorCode: "MAILBOX_FULL", daysAgo: 21 },
  { id: "E-210", campaignId: "", campaignName: "Data Upsell", offerId: "", offerName: "Night Bundle", segmentId: "", segmentName: "Growth", status: "Delivered", sent: 14600, delivered: 13680, subscribersReached: 13110, takenUp: 520, daysAgo: 28 },
  { id: "E-211", campaignId: "", campaignName: "Roaming Alert", offerId: "", offerName: "Roaming Pass", segmentId: "", segmentName: "Core", status: "Deferred", sent: 900, delivered: 0, subscribersReached: 0, takenUp: 0, daysAgo: 2 },
  { id: "E-212", campaignId: "", campaignName: "Churn Win-back", offerId: "", offerName: "Win-back Credit", segmentId: "", segmentName: "At Risk", status: "Delivered", sent: 7200, delivered: 6610, subscribersReached: 6400, takenUp: 240, daysAgo: 45 },
];

function daysAgoIso(daysAgo: number): string {
  const date = new Date();
  date.setHours(10, 0, 0, 0);
  date.setDate(date.getDate() - daysAgo);
  return date.toISOString();
}

const dummyDispatches: EmailDispatchRow[] = DISPATCH_SEEDS.map((seed) => {
  const { daysAgo, ...row } = seed;
  return {
    ...row,
    sentDate: daysAgoIso(daysAgo),
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

function scaleSnapshot(base: EmailCvmSnapshot, factor: number): EmailCvmSnapshot {
  if (factor === 1) return base;
  return snapshot(
    Math.round(base.sent * factor),
    Math.round(base.delivered * factor),
    Math.round(base.takenUp * factor),
    base.optOutRate,
    Math.round(base.subscribersReached * factor),
    Math.round(base.bounced * factor),
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

export default function DeliveryEmailReportsPage() {
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

  const [statusFilter, setStatusFilter] = useState<EmailDeliveryStatus | "All">("All");
  const [campaignQuery, setCampaignQuery] = useState("");
  const [useDummyData, setUseDummyData] = useState(true);
  const [tablePage, setTablePage] = useState(1);
  const [tablePageSize, setTablePageSize] = useState(DEFAULT_PAGE_SIZE);
  const [liveReport, setLiveReport] = useState<DeliveryEmailReportsResponse | null>(null);
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
          const response = await emailDeliveryReportsService.getPortfolio({
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
          const normalized = normalizeEmailDeliveryReport(response);
          if (response.success && normalized) {
            setLiveReport(normalized);
          } else {
            setLiveReport(null);
            setLiveReportError(
              response.error || response.message || "Failed to load email delivery report",
            );
          }
        } catch (error) {
          if (cancelled) return;
          setLiveReport(null);
          setLiveReportError(
            extractBackendError(error, "Failed to load Delivery & Email Reports."),
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
      return liveReport?.summary ? emailCvmSnapshot(liveReport.summary) : emptyEmailSnapshot();
    }
    return scaleSnapshot(emailMockData[activeRangeKey].summary, scaleFactor);
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
      emailMockData[dummyTemplateRange(queryParams.grain || "daily")].deliverySeries;
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
    const envelope = await emailDeliveryReportsService.getTimeline({
      range: params.range || deliveryRange,
      grain: params.grain,
      startDate: params.startDate,
      endDate: params.endDate,
      preset: params.preset,
    });
    const normalized = normalizeEmailDeliveryReport(envelope);
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

  const filteredDispatches = useMemo(() => {
    const source = useDummyData ? dummyDispatches : liveReport?.dispatches || [];
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
      const entryDate = new Date(entry.sentDate).getTime();
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

  const tableColumns = useMemo<TableColumn<EmailDispatchRow>[]>(
    () => [
      {
        id: "campaignName",
        label: EMAIL_CVM_LABELS.campaign,
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
        label: EMAIL_CVM_LABELS.offer,
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
        label: EMAIL_CVM_LABELS.segment,
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
        label: EMAIL_CVM_LABELS.delivered,
        width: "110px",
        visible: true,
        render: (value) => formatCount(value),
      },
      {
        id: "takenUp",
        label: EMAIL_CVM_LABELS.takenUp,
        width: "110px",
        visible: true,
        render: (value) => formatCount(value),
      },
      {
        id: "takeUpRate",
        label: EMAIL_CVM_LABELS.takeUpRate,
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
  const csvRows = filteredDispatches.map((row) => [
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
          <h1 className="text-3xl font-bold text-gray-900">Delivery & Email Reports</h1>
          <p className="mt-2 text-sm text-gray-600">
            Email dispatch, mailbox delivery, subscriber reach, offer take-up, bounce, and channel
            opt-out for the selected window
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
                htmlFor="email-data-toggle"
                className="mr-2 whitespace-nowrap text-sm font-medium text-gray-700"
              >
                Data Mode:
              </label>
              <button
                id="email-data-toggle"
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
          <EmailDeliveryKpiGrid
            summary={toEmailSummary(summary)}
            heroTrends={liveReport?.heroTrends}
            useDummyData={useDummyData}
          />
        </section>
      )}

      {isTrendsView && (
        <section className="grid gap-6 lg:grid-cols-2">
          <SwitchableReportChart
            title="Email Delivery"
            subtitle="Dispatched, delivered, and offer take-up across the window"
            filename="email-delivery.csv"
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
                color: colors.reportCharts.deliveryEmail.emailDelivery.sent,
              },
              {
                dataKey: "delivered",
                name: "Delivered",
                color: colors.reportCharts.deliveryEmail.emailDelivery.delivered,
              },
              {
                dataKey: "takenUp",
                name: "Taken Up",
                color: colors.reportCharts.deliveryEmail.emailDelivery.converted,
              },
            ]}
          />
          <SwitchableReportChart
            title="Delivery & Take-up Rates"
            subtitle="Delivery rate and offer take-up rate for the same window"
            filename="email-delivery-rates.csv"
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
                color: colors.reportCharts.deliveryEmail.emailDelivery.delivered,
              },
              {
                dataKey: "takeUpRate",
                name: "Take-up Rate %",
                color: colors.reportCharts.deliveryEmail.emailDelivery.converted,
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
                {EMAIL_CVM_LABELS.dispatchLog}
              </h2>
              <p className="mt-1 text-sm text-gray-600">
                Each row is an email dispatch, with the campaign, offer, and segment it ran against
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
                onChange={(value) => setStatusFilter(value as EmailDeliveryStatus | "All")}
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
                filename="email_dispatch_delivery.csv"
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
              <Table<EmailDispatchRow>
                columns={tableColumns}
                data={filteredDispatches}
                totalItems={filteredDispatches.length}
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
              {filteredDispatches.length > 0 && (
                <Pagination
                  currentPage={tablePage}
                  pageSize={tablePageSize}
                  totalItems={filteredDispatches.length}
                  onPageChange={setTablePage}
                  onPageSizeChange={(size) => {
                    setTablePageSize(size);
                    setTablePage(1);
                  }}
                />
              )}
              {filteredDispatches.length === 0 && (
                <div className="py-10 text-center text-sm text-gray-500">
                  No email dispatches match this window and filter.
                </div>
              )}
            </>
          )}
        </section>
      )}
    </div>
  );
}
