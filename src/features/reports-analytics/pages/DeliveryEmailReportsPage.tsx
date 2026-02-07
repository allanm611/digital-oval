import { useMemo, useState } from "react";
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
import {
  AlertTriangle,
  CheckCircle2,
  Download,
  Inbox,
  Mail,
  MailCheck,
  MousePointerClick,
  TrendingUp,
  UserMinus,
} from "lucide-react";
import { colors } from "../../../shared/utils/tokens";
import HeadlessSelect from "../../../shared/components/ui/HeadlessSelect";
import CsvDownloadButton from "../../../shared/components/CsvDownloadButton";
import { color, tw } from "../../../shared/utils/utils";
import type {
  RangeOption,
  DeliveryEmailReportsResponse,
  EmailLogEntry,
} from "../types/ReportsAPI";

// Extract types from API response type
type EmailSummary = DeliveryEmailReportsResponse["summary"];
type DeliveryPoint = DeliveryEmailReportsResponse["deliveryTimeline"][number];
type EmailStatus = EmailLogEntry["status"];

// Mock data structure (combines summary and timeline)
type EmailRangeData = {
  summary: EmailSummary;
  deliverySeries: DeliveryPoint[];
};

const rangeOptions: RangeOption[] = ["7d", "30d", "90d"];
const statusOptions: (EmailStatus | "All")[] = [
  "All",
  "Delivered",
  "Bounced",
  "Deferred",
  "Spam",
];

// Chart colors now use standardized colors from tokens.reportCharts

const emailMockData: Record<RangeOption, EmailRangeData> = {
  "7d": {
    summary: {
      sent: 255_000,
      delivered: 234_500,
      deliveryRate: 92,
      conversionRate: 3.8,
      conversions: 8_900,
      bounceRate: 5.6,
      openRate: 48.2,
      ctr: 12.4,
      unsubscribeRate: 0.4,
    },
    deliverySeries: [
      { period: "Mon", sent: 36_500, delivered: 33_800, converted: 1_320 },
      { period: "Tue", sent: 35_000, delivered: 32_400, converted: 1_250 },
      { period: "Wed", sent: 37_200, delivered: 34_300, converted: 1_310 },
      { period: "Thu", sent: 36_100, delivered: 33_900, converted: 1_305 },
      { period: "Fri", sent: 36_800, delivered: 34_200, converted: 1_315 },
      { period: "Sat", sent: 36_400, delivered: 33_700, converted: 1_230 },
      { period: "Sun", sent: 37_000, delivered: 32_200, converted: 1_170 },
    ],
  },
  "30d": {
    summary: {
      sent: 1_020_000,
      delivered: 945_000,
      deliveryRate: 92.6,
      conversionRate: 4.2,
      conversions: 40_000,
      bounceRate: 5.1,
      openRate: 49.7,
      ctr: 12.9,
      unsubscribeRate: 0.45,
    },
    deliverySeries: [
      { period: "Week 1", sent: 255_000, delivered: 235_000, converted: 9_600 },
      { period: "Week 2", sent: 255_000, delivered: 240_000, converted: 9_900 },
      {
        period: "Week 3",
        sent: 255_000,
        delivered: 235_000,
        converted: 10_200,
      },
      {
        period: "Week 4",
        sent: 255_000,
        delivered: 235_000,
        converted: 10_300,
      },
    ],
  },
  "90d": {
    summary: {
      sent: 3_150_000,
      delivered: 2_920_000,
      deliveryRate: 92.7,
      conversionRate: 4.4,
      conversions: 138_000,
      bounceRate: 4.9,
      openRate: 50.1,
      ctr: 13.1,
      unsubscribeRate: 0.5,
    },
    deliverySeries: [
      {
        period: "September",
        sent: 1_050_000,
        delivered: 975_000,
        converted: 46_000,
      },
      {
        period: "October",
        sent: 1_050_000,
        delivered: 973_000,
        converted: 46_200,
      },
      {
        period: "November",
        sent: 1_050_000,
        delivered: 972_000,
        converted: 45_800,
      },
    ],
  },
};

// Generate comprehensive dummy data with dates relative to today
const generateEmailMessageLogs = (): EmailLogEntry[] => {
  const campaigns = [
    { id: "CAMP-2201", name: "Reactivation Blast" },
    { id: "CAMP-2202", name: "Upsell Journey" },
    { id: "CAMP-2203", name: "Rewards Digest" },
    { id: "CAMP-2204", name: "VIP Launch" },
    { id: "CAMP-2205", name: "Churn Recovery" },
    { id: "CAMP-2206", name: "Welcome Series" },
    { id: "CAMP-2207", name: "Flash Sale" },
    { id: "CAMP-2208", name: "Newsletter" },
  ];
  const statuses: EmailStatus[] = ["Delivered", "Bounced", "Deferred", "Spam"];

  const rows: EmailLogEntry[] = [];
  const today = new Date();

  // Generate emails across the last 90 days with various statuses
  campaigns.forEach((campaign) => {
    for (let i = 0; i < 6; i++) {
      const daysAgo = Math.floor(Math.random() * 90); // Spread across last 90 days
      const sentDate = new Date(today);
      sentDate.setDate(today.getDate() - daysAgo);

      const status = statuses[Math.floor(Math.random() * statuses.length)];
      const sent = 10000 + Math.floor(Math.random() * 20000);
      const deliveryRate =
        status === "Delivered"
          ? 0.92 + Math.random() * 0.06
          : status === "Bounced"
            ? 0.85 + Math.random() * 0.05
            : status === "Spam"
              ? 0.8 + Math.random() * 0.08
              : 0.9 + Math.random() * 0.05;
      const delivered = Math.floor(sent * deliveryRate);
      const conversionRate =
        status === "Delivered"
          ? 2.0 + Math.random() * 5.0
          : status === "Spam"
            ? 0.5 + Math.random() * 1.5
            : 1.0 + Math.random() * 3.0;
      const conversions = Math.floor(delivered * (conversionRate / 100));

      rows.push({
        id: `EMAIL-${sentDate
          .toISOString()
          .split("T")[0]
          .replace(/-/g, "")}-${String(i + 1).padStart(3, "0")}`,
        campaignId: campaign.id,
        campaignName: campaign.name,
        status,
        sent,
        delivered,
        conversions,
        conversionRate: Math.round(conversionRate * 10) / 10,
        sentDate: sentDate.toISOString().split("T")[0],
      });
    }
  });

  return rows;
};

const emailMessageLogs: EmailLogEntry[] = generateEmailMessageLogs();

const formatNumber = (value: number) => value.toLocaleString("en-US");

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

export default function DeliveryEmailReportsPage() {
  const { t } = useLanguage();
  const [deliveryRange, setDeliveryRange] = useState<RangeOption>("7d");
  const [customRange, setCustomRange] = useState({ start: "", end: "" });
  const [appliedCustomRange, setAppliedCustomRange] = useState({
    start: "",
    end: "",
  });
  const [statusFilter, setStatusFilter] = useState<EmailStatus | "All">("All");
  const [campaignQuery, setCampaignQuery] = useState("");
  const [useDummyData, setUseDummyData] = useState(true);

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
  const baseSnapshot = emailMockData[activeRangeKey];
  const summarySnapshot = useMemo(() => {
    if (!useDummyData) {
      return {
        ...baseSnapshot,
        summary: {
          sent: 0,
          delivered: 0,
          conversions: 0,
          deliveryRate: 0,
          bounceRate: 0,
          conversionRate: 0,
          openRate: 0,
          ctr: 0,
          unsubscribeRate: 0,
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
        bounceRate: baseSnapshot.summary.bounceRate,
        conversionRate: baseSnapshot.summary.conversionRate,
        openRate: baseSnapshot.summary.openRate,
        ctr: baseSnapshot.summary.ctr,
        unsubscribeRate: baseSnapshot.summary.unsubscribeRate,
      },
    };
  }, [baseSnapshot, scaleFactor, useDummyData]);

  const deliverySnapshot = useMemo(() => {
    if (!useDummyData) {
      return {
        ...baseSnapshot,
        deliverySeries: baseSnapshot.deliverySeries.map((point) => ({
          ...point,
          sent: 0,
          delivered: 0,
          converted: 0,
        })),
      };
    }
    if (scaleFactor === 1) return baseSnapshot;
    return {
      ...baseSnapshot,
      deliverySeries: baseSnapshot.deliverySeries.map((point) => ({
        ...point,
        sent: Math.round(point.sent * scaleFactor),
        delivered: Math.round(point.delivered * scaleFactor),
        converted: Math.round(point.converted * scaleFactor),
      })),
    };
  }, [baseSnapshot, scaleFactor, useDummyData]);

  const filteredLogs = useMemo(() => {
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
    return emailMessageLogs.filter((entry) => {
      const matchesStatus =
        statusFilter === "All" ? true : entry.status === statusFilter;
      const matchesQuery = query
        ? entry.campaignId.toLowerCase().includes(query) ||
          entry.campaignName.toLowerCase().includes(query)
        : true;
      const entryDate = new Date(entry.sentDate).getTime();
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
    deliveryRange,
    customDays,
    useDummyData,
  ]);

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
      label: "Emails Sent",
      value: formatNumber(summarySnapshot.summary.sent),
      description: "Total emails dispatched last 30 days",
      icon: Mail,
    },
    {
      label: "Delivered Emails",
      value: formatNumber(summarySnapshot.summary.delivered),
      description: "Reached inboxes successfully",
      icon: MailCheck,
    },
    {
      label: "Inbox Placement",
      value: `${summarySnapshot.summary.deliveryRate.toFixed(1)}%`,
      description: "Delivered vs total sent",
      icon: Inbox,
    },
    {
      label: "Bounce Rate",
      value: `${summarySnapshot.summary.bounceRate.toFixed(1)}%`,
      description: "Rejected or invalid addresses",
      icon: AlertTriangle,
    },
    {
      label: "Open Rate",
      value: `${summarySnapshot.summary.openRate.toFixed(1)}%`,
      description: "Recipients opening emails",
      icon: CheckCircle2,
    },
    {
      label: "Click-Through Rate",
      value: `${summarySnapshot.summary.ctr.toFixed(1)}%`,
      description: "Recipients clicking tracked links",
      icon: MousePointerClick,
    },
    {
      label: "Conversion Rate",
      value: `${summarySnapshot.summary.conversionRate.toFixed(1)}%`,
      description: "Emails leading to outcomes",
      icon: TrendingUp,
    },
    {
      label: "Unsubscribe Rate",
      value: `${summarySnapshot.summary.unsubscribeRate.toFixed(2)}%`,
      description: "Recipients opting out",
      icon: UserMinus,
    },
  ];

  const statusStyles: Record<EmailStatus, string> = {
    Delivered: "border-emerald-200 bg-emerald-50 text-emerald-700",
    Bounced: "border-red-200 bg-red-50 text-red-700",
    Deferred: "border-amber-200 bg-amber-50 text-amber-700",
    Spam: "border-slate-200 bg-slate-50 text-slate-700",
  };

  return (
    <div className="space-y-6">
      <header className="space-y-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Delivery & Email Reports
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Track inbox placement, engagement, and conversion impact for every
            send
          </p>
        </div>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-2">
            {rangeOptions.map((option) => (
              <button
                key={option}
                onClick={() => {
                  setDeliveryRange(option);
                  setCustomRange({ start: "", end: "" });
                  setAppliedCustomRange({ start: "", end: "" });
                }}
                className={`${tw.rounded} border px-3 py-1.5 text-sm font-medium transition-colors ${
                  !(appliedCustomRange.start && appliedCustomRange.end) &&
                  deliveryRange === option
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
                htmlFor="email-data-toggle"
                className="text-sm font-medium text-gray-700 whitespace-nowrap mr-2"
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
              <span className="ml-2 text-xs text-gray-600 whitespace-nowrap">
                {useDummyData ? "Dummy Data" : "Real Data"}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <label
                htmlFor="email-date-start"
                className="text-sm font-medium text-gray-700 whitespace-nowrap"
              >
                From:
              </label>
              <input
                id="email-date-start"
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
                htmlFor="email-date-end"
                className="text-sm font-medium text-gray-700 whitespace-nowrap"
              >
                To:
              </label>
              <input
                id="email-date-end"
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

      <section
        className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm`}
      >
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Email Delivery Funnel
            </h2>
            <p className="mt-1 text-sm text-gray-600">
              Track sent, delivered, and conversions across timelines
            </p>
          </div>
        </div>
        <div className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={deliverySnapshot.deliverySeries}
              margin={{ top: 20, right: 30, left: 24, bottom: 0 }}
              barCategoryGap="25%"
              barGap={8}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey="period"
                tick={{ fill: "#6b7280" }}
                axisLine={{ stroke: "#e5e7eb" }}
              />
              <YAxis
                tick={{ fill: "#6b7280" }}
                axisLine={{ stroke: "#e5e7eb" }}
                label={{
                  value: "Email Count",
                  angle: -90,
                  position: "insideLeft",
                }}
                width={90}
                tickFormatter={(value) => formatNumber(value)}
              />
              <Tooltip
                content={<CustomTooltip />}
                cursor={{ fill: "transparent" }}
              />
              <Legend
                wrapperStyle={{ paddingTop: "20px", gap: "20px" }}
                iconType="circle"
              />
              <Bar
                dataKey="sent"
                name="Sent"
                fill={colors.reportCharts.deliveryEmail.emailDelivery.sent}
                radius={[4, 4, 0, 0]}
                maxBarSize={50}
              />
              <Bar
                dataKey="delivered"
                name="Delivered"
                fill={colors.reportCharts.deliveryEmail.emailDelivery.delivered}
                radius={[4, 4, 0, 0]}
                maxBarSize={50}
              />
              <Bar
                dataKey="converted"
                name="Converted"
                fill={colors.reportCharts.deliveryEmail.emailDelivery.converted}
                radius={[4, 4, 0, 0]}
                maxBarSize={50}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="space-y-6">
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Email Delivery Log
            </h2>
            <p className="mt-1 text-sm text-gray-600">
              Inspect campaign-level sends, diagnose issues, and export data
            </p>
          </div>
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <input
              type="text"
              value={campaignQuery}
              onChange={(event) => setCampaignQuery(event.target.value)}
              placeholder="Search campaign"
              className={`w-full ${tw.rounded} border border-gray-200 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-500 focus:border-gray-400 focus:outline-none md:w-80`}
            />
            <HeadlessSelect
              value={statusFilter}
              onChange={(value) =>
                setStatusFilter(value as EmailStatus | "All")
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
              filename="email_delivery_logs.csv"
              style={{ backgroundColor: colors.primary.action }}
            />
          </div>
        </div>
        <div
          className={` ${tw.rounded} border border-[${color.border.default}] overflow-hidden`}
        >
          <div className="hidden lg:block overflow-x-auto">
            <table
              className="w-full"
              style={{ borderCollapse: "separate", borderSpacing: "0 8px" }}
            >
              <thead style={{ background: color.surface.tableHeader }}>
                <tr className="text-left text-sm font-medium uppercase tracking-wider">
                  {[
                    "Campaign ID",
                    "Campaign Name",
                    "Status",
                    "Sent",
                    "Delivered",
                    "Conversions",
                    "Conversion Rate",
                  ].map((header) => (
                    <th
                      key={header}
                      className="px-6 py-3"
                      style={{ color: color.surface.tableHeaderText }}
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map((entry, index) => (
                  <tr key={entry.id} className="transition-colors">
                    <td
                      className="px-6 py-4 font-semibold"
                      style={{ backgroundColor: color.surface.tablebodybg }}
                    >
                      <div className="text-lg text-gray-900">{index + 1}</div>
                    </td>
                    <td
                      className="px-6 py-4"
                      style={{ backgroundColor: color.surface.tablebodybg }}
                    >
                      <div className="text-gray-900">{entry.campaignName}</div>
                    </td>
                    <td
                      className="px-6 py-4"
                      style={{ backgroundColor: color.surface.tablebodybg }}
                    >
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-1 text-sm font-medium ${
                          statusStyles[entry.status]
                        }`}
                      >
                        {entry.status}
                      </span>
                    </td>
                    <td
                      className="px-6 py-4"
                      style={{ backgroundColor: color.surface.tablebodybg }}
                    >
                      {formatNumber(entry.sent)}
                    </td>
                    <td
                      className="px-6 py-4"
                      style={{ backgroundColor: color.surface.tablebodybg }}
                    >
                      {formatNumber(entry.delivered)}
                    </td>
                    <td
                      className="px-6 py-4"
                      style={{ backgroundColor: color.surface.tablebodybg }}
                    >
                      {formatNumber(entry.conversions)}
                    </td>
                    <td
                      className="px-6 py-4"
                      style={{ backgroundColor: color.surface.tablebodybg }}
                    >
                      {entry.conversionRate}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!filteredLogs.length && (
              <div className="py-10 text-center text-sm text-gray-500">
                No campaigns match your filters yet.
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
