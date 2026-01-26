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
  MailOpen,
  MessageCircle,
  MousePointerClick,
  TrendingUp,
  UserMinus,
} from "lucide-react";
import { colors } from "../../../shared/utils/tokens";
import { color, tw } from "../../../shared/utils/utils";
import HeadlessSelect from "../../../shared/components/ui/HeadlessSelect";
import type {
  RangeOption,
  DeliverySMSReportsResponse,
  SMSLogEntry,
} from "../types/ReportsAPI";

// Extract types from API response type
type SMSSummary = DeliverySMSReportsResponse["summary"];
type DeliveryPoint = DeliverySMSReportsResponse["deliveryTimeline"][number];
type MessageStatus = SMSLogEntry["status"];

// Mock data structure (combines summary and timeline)
type SMSRangeData = {
  summary: SMSSummary;
  deliverySeries: DeliveryPoint[];
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
  baseRange: RangeOption
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

  // Generate messages across the last 90 days with various statuses
  campaigns.forEach((campaign, campIdx) => {
    for (let i = 0; i < 8; i++) {
      const daysAgo = Math.floor(Math.random() * 90); // Spread across last 90 days
      const messageDate = new Date(today);
      messageDate.setDate(today.getDate() - daysAgo);
      messageDate.setHours(
        9 + Math.floor(Math.random() * 12),
        Math.floor(Math.random() * 60),
        0,
        0
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
        id: `MSG-${messageDate
          .toISOString()
          .split("T")[0]
          .replace(/-/g, "")}-${String(i + 1).padStart(3, "0")}`,
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

export default function DeliverySMSReportsPage() {
  const { t } = useLanguage();
  const [deliveryRange, setDeliveryRange] = useState<RangeOption>("7d");
  const [customRange, setCustomRange] = useState({ start: "", end: "" });
  const [appliedCustomRange, setAppliedCustomRange] = useState({
    start: "",
    end: "",
  });
  const [statusFilter, setStatusFilter] = useState<MessageStatus | "All">(
    "All"
  );
  const [campaignQuery, setCampaignQuery] = useState("");
  const [useDummyData, setUseDummyData] = useState(true);

  const handleRun = () => {
    setAppliedCustomRange(customRange);
  };

  const customDays = getDaysBetween(
    appliedCustomRange.start,
    appliedCustomRange.end
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
    if (!useDummyData) {
      return [];
    }
    const now = Date.now();
    const maxDays =
      appliedCustomRange.start && appliedCustomRange.end
        ? customDays ?? rangeDays[deliveryRange]
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

  const handleDownloadCsv = () => {
    if (!filteredLogs.length) return;

    const headers = [
      "Campaign ID",
      "Campaign Name",
      "Status",
      "Sent",
      "Delivered",
      "Conversions",
      "Conversion Rate",
    ];

    const rows = filteredLogs.map((row, index) => [
      index + 1,
      row.campaignName,
      row.status,
      row.sent,
      row.delivered,
      row.conversions,
      `${row.conversionRate}%`,
    ]);

    const csvContent = [headers, ...rows]
      .map((line) => line.map((value) => `"${value}"`).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "sms_delivery_logs.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

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
                className={`${
                  tw.rounded
                } border px-3 py-1.5 text-sm font-medium transition-colors ${
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
                htmlFor="sms-data-toggle"
                className="text-sm font-medium text-gray-700 whitespace-nowrap mr-2"
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
              <span className="ml-2 text-xs text-gray-600 whitespace-nowrap">
                {useDummyData ? "Dummy Data" : "Real Data"}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <label
                htmlFor="sms-date-start"
                className="text-sm font-medium text-gray-700 whitespace-nowrap"
              >
                From:
              </label>
              <input
                id="sms-date-start"
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
                htmlFor="sms-date-end"
                className="text-sm font-medium text-gray-700 whitespace-nowrap"
              >
                To:
              </label>
              <input
                id="sms-date-end"
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
              SMS Delivery Funnel
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
                  value: "Message Count",
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
                fill={colors.reportCharts.deliverySMS.smsDelivery.sent}
                radius={[4, 4, 0, 0]}
                maxBarSize={50}
              />
              <Bar
                dataKey="delivered"
                name="Delivered"
                fill={colors.reportCharts.deliverySMS.smsDelivery.delivered}
                radius={[4, 4, 0, 0]}
                maxBarSize={50}
              />
              <Bar
                dataKey="converted"
                name="Converted"
                fill={colors.reportCharts.deliverySMS.smsDelivery.converted}
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
              Message Delivery Log
            </h2>
            <p className="mt-1 text-sm text-gray-600">
              Inspect individual sends, troubleshoot failures, and export detail
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
                setStatusFilter(value as MessageStatus | "All")
              }
              options={statusOptions.map((option) => ({
                label: option === "All" ? "All Statuses" : option,
                value: option,
              }))}
              placeholder="All Statuses"
              className="w-full md:w-40"
            />
            <button
              type="button"
              onClick={handleDownloadCsv}
              className={`inline-flex items-center justify-center gap-2 ${tw.rounded} px-4 py-2 text-sm font-semibold text-white transition-colors`}
              style={{ backgroundColor: colors.primary.action }}
            >
              <Download className="h-4 w-4" />
              Download CSV
            </button>
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
                      {entry.sent}
                    </td>
                    <td
                      className="px-6 py-4"
                      style={{ backgroundColor: color.surface.tablebodybg }}
                    >
                      {entry.delivered}
                    </td>
                    <td
                      className="px-6 py-4"
                      style={{ backgroundColor: color.surface.tablebodybg }}
                    >
                      {entry.conversions}
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
                No messages match your filters yet.
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
