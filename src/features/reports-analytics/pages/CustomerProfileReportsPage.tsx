import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { useNavigate, useLocation, useSearchParams } from "react-router-dom";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Activity,
  ArrowUpRight,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  Crown,
  DollarSign,
  Download,
  Eye,
  Repeat,
  Users,
  Search,
} from "lucide-react";
import { colors } from "../../../shared/utils/tokens";
import HeadlessSelect from "../../../shared/components/ui/HeadlessSelect";
import Pagination from "../../../shared/components/ui/Pagination";
import CsvDownloadButton from "../../../shared/components/CsvDownloadButton";
import { color, tw } from "../../../shared/utils/utils";
import { useLanguage } from "../../../contexts/LanguageContext";
import { formatCurrency } from "../../../shared/services/currencyService";
import type {
  RangeOption,
  CustomerProfileReportsResponse,
  CustomerRow,
} from "../types/ReportsAPI";
import type { CustomerSubscriptionRecord } from "../../customers360/types/customerSubscription";
import {
  getSubscriptionDisplayName,
  formatMsisdn,
  formatDateTime,
  convertSubscriptionToCustomerRow,
} from "../../customers360/utils/customerSubscriptionHelpers";
import { customerSubscriptions } from "../../customers360/utils/customerDataService";
import { customerService } from "../../customers360/services/customerServices";
import { useToast } from "../../../contexts/ToastContext";

// Extract types from API response type
type ValueMatrixPoint = CustomerProfileReportsResponse["valueMatrix"][number];
type LifecyclePoint =
  CustomerProfileReportsResponse["lifecycleDistribution"][number];
type ClvBucket = CustomerProfileReportsResponse["clvDistribution"][number];
type CohortPoint = CustomerProfileReportsResponse["cohortRetention"][number];

// Local UI types
type HeroMetric = {
  label: string;
  value: string;
  trend: string;
  trendDirection: "up" | "down";
  description: string;
  icon: React.ComponentType<{ className?: string }>;
};

// Re-export CustomerRow for backward compatibility
export type { CustomerRow };

const formatNumber = (value: number) =>
  value.toLocaleString("en-US", { maximumFractionDigits: 0 });

const heroBase = {
  activeCustomers: 1_284_200,
  avgClv: 1_540,
  avgOrderValue: 128,
  purchaseFrequency: 3.4,
  engagementScore: 72,
  churnRate: 8.3,
};

const baseValueMatrixData: ValueMatrixPoint[] = [
  {
    segment: "Champions",
    recency: 10,
    valueScore: 92,
    customers: 2400,
    lifecycle: "Active",
  },
  {
    segment: "Loyalists",
    recency: 22,
    valueScore: 78,
    customers: 4800,
    lifecycle: "Active",
  },
  {
    segment: "Potential Loyalists",
    recency: 35,
    valueScore: 55,
    customers: 6400,
    lifecycle: "New",
  },
  {
    segment: "At-Risk",
    recency: 60,
    valueScore: 48,
    customers: 3100,
    lifecycle: "At-Risk",
  },
  {
    segment: "Churned",
    recency: 120,
    valueScore: 22,
    customers: 2100,
    lifecycle: "Churned",
  },
  {
    segment: "Reactivated",
    recency: 28,
    valueScore: 64,
    customers: 1800,
    lifecycle: "Active",
  },
];

const baseLifecycleData: LifecyclePoint[] = [
  {
    month: "Jun",
    new: 120,
    active: 420,
    atRisk: 180,
    dormant: 140,
    churned: 95,
    reactivated: 65,
  },
  {
    month: "Jul",
    new: 125,
    active: 432,
    atRisk: 190,
    dormant: 150,
    churned: 100,
    reactivated: 70,
  },
  {
    month: "Aug",
    new: 130,
    active: 448,
    atRisk: 200,
    dormant: 160,
    churned: 105,
    reactivated: 75,
  },
  {
    month: "Sep",
    new: 135,
    active: 460,
    atRisk: 210,
    dormant: 170,
    churned: 110,
    reactivated: 80,
  },
  {
    month: "Oct",
    new: 140,
    active: 474,
    atRisk: 220,
    dormant: 180,
    churned: 115,
    reactivated: 85,
  },
  {
    month: "Nov",
    new: 145,
    active: 486,
    atRisk: 230,
    dormant: 190,
    churned: 120,
    reactivated: 90,
  },
];

const baseClvDistribution: ClvBucket[] = [
  { range: `< ${formatCurrency(250)}`, customers: 420_000, revenueShare: 12 },
  {
    range: `${formatCurrency(250)} - ${formatCurrency(500)}`,
    customers: 310_000,
    revenueShare: 18,
  },
  {
    range: `${formatCurrency(500)} - ${formatCurrency(1000)}`,
    customers: 220_000,
    revenueShare: 23,
  },
  {
    range: `${formatCurrency(1000)} - ${formatCurrency(2000)}`,
    customers: 160_000,
    revenueShare: 25,
  },
  {
    range: `${formatCurrency(2000)} - ${formatCurrency(5000)}`,
    customers: 110_000,
    revenueShare: 16,
  },
  { range: `>${formatCurrency(5000)}`, customers: 64_000, revenueShare: 6 },
];

const baseCohortRetention: CohortPoint[] = [
  { month: 1, cohort: "Jan", retention: 100 },
  { month: 2, cohort: "Jan", retention: 72 },
  { month: 3, cohort: "Jan", retention: 58 },
  { month: 4, cohort: "Jan", retention: 49 },
  { month: 5, cohort: "Jan", retention: 45 },
  { month: 1, cohort: "Apr", retention: 98 },
  { month: 2, cohort: "Apr", retention: 76 },
  { month: 3, cohort: "Apr", retention: 63 },
  { month: 4, cohort: "Apr", retention: 54 },
  { month: 5, cohort: "Apr", retention: 50 },
  { month: 1, cohort: "Jul", retention: 96 },
  { month: 2, cohort: "Jul", retention: 79 },
  { month: 3, cohort: "Jul", retention: 66 },
  { month: 4, cohort: "Jul", retention: 57 },
  { month: 5, cohort: "Jul", retention: 52 },
];

// Generate comprehensive dummy data that covers all filter combinations

const generateCustomerRows = (): CustomerRow[] => {
  const segments = [
    "Champions",
    "Loyalists",
    "Potential Loyalist",
    "At-Risk",
    "Reactivated",
  ];
  const channels = ["Email", "SMS", "Push"];
  const locations = [
    "Nairobi CBD, KE",
    "Westlands, Nairobi",
    "Kilimani, Nairobi",
    "Karen, Nairobi",
    "Runda, Nairobi",
    "Mombasa, KE",
    "Nakuru, KE",
    "Kisumu, KE",
  ];
  const names = [
    "Sophia K",
    "Michael O",
    "Amy T",
    "David R",
    "Grace I",
    "James M",
    "Emma L",
    "Robert N",
    "Olivia P",
    "William Q",
    "Isabella S",
    "Benjamin T",
    "Mia U",
    "Daniel V",
    "Charlotte W",
    "Matthew X",
    "Amelia Y",
    "Joseph Z",
    "Harper A",
    "Samuel B",
    "Evelyn C",
    "Henry D",
    "Abigail E",
    "Alexander F",
    "Emily G",
  ];

  const rows: CustomerRow[] = [];
  const today = new Date();

  // Generate customers across all segments, risk levels, and date ranges
  segments.forEach((segment, segIdx) => {
    for (let i = 0; i < 5; i++) {
      const baseIdx = segIdx * 5 + i;
      const daysAgo = i * 15 + Math.floor(Math.random() * 10); // Spread across date ranges
      const interactionDate = new Date(today);
      interactionDate.setDate(today.getDate() - daysAgo);

      // Calculate churn risk based on segment and recency
      let churnRisk = 15;
      if (segment === "At-Risk")
        churnRisk = 65 + Math.floor(Math.random() * 20);
      else if (segment === "Potential Loyalist")
        churnRisk = 25 + Math.floor(Math.random() * 10);
      else if (segment === "Reactivated")
        churnRisk = 20 + Math.floor(Math.random() * 15);
      else if (daysAgo > 30) churnRisk = 30 + Math.floor(Math.random() * 20);

      // Calculate engagement score inversely related to churn risk
      const engagementScore = Math.max(
        30,
        100 - churnRisk + Math.floor(Math.random() * 20),
      );

      // Calculate values based on segment
      let lifetimeValue = 2000 + Math.floor(Math.random() * 3000);
      let clv = lifetimeValue * 1.2;
      let orders = 5 + Math.floor(Math.random() * 20);
      let aov = 150 + Math.floor(Math.random() * 150);

      if (segment === "Champions") {
        lifetimeValue = 8000 + Math.floor(Math.random() * 6000);
        clv = lifetimeValue * 1.15;
        orders = 30 + Math.floor(Math.random() * 25);
        aov = 250 + Math.floor(Math.random() * 100);
      } else if (segment === "Loyalists") {
        lifetimeValue = 5000 + Math.floor(Math.random() * 4000);
        clv = lifetimeValue * 1.18;
        orders = 20 + Math.floor(Math.random() * 15);
        aov = 200 + Math.floor(Math.random() * 80);
      }

      const lastPurchaseText =
        daysAgo === 0
          ? "Today"
          : daysAgo === 1
            ? "1 day ago"
            : `${daysAgo} days ago`;

      const normalizedName = names[baseIdx % names.length]
        .toLowerCase()
        .replace(/\s+/g, ".");
      const phone = `+2547${(1000000 + baseIdx * 37).toString().slice(-7)}`;
      const msisdn = phone.replace("+", "");

      rows.push({
        id: `CUST-${String(34000 + baseIdx).padStart(5, "0")}`,
        name: names[baseIdx % names.length],
        email: `${normalizedName}@example.com`,
        phone,
        msisdn,
        segment,
        lifetimeValue,
        clv: Math.round(clv),
        orders,
        aov: Math.round(aov),
        lastPurchase: lastPurchaseText,
        lastInteractionDate: interactionDate.toISOString().split("T")[0],
        engagementScore,
        churnRisk,
        preferredChannel: channels[baseIdx % channels.length] as
          | "Email"
          | "SMS"
          | "Push",
        location: locations[baseIdx % locations.length],
      });
    }
  });

  return rows;
};

const fallbackCustomerRows: CustomerRow[] = generateCustomerRows();
// Using shared customer data from customerDataService
const activationTimestamps = customerSubscriptions
  .map((record) =>
    record.activationDate ? new Date(record.activationDate).getTime() : NaN,
  )
  .filter((value) => !Number.isNaN(value));
const datasetReferenceTime = activationTimestamps.length
  ? Math.max(...activationTimestamps)
  : Date.now();
const excelCustomerRows: CustomerRow[] = customerSubscriptions.map(
  convertSubscriptionToCustomerRow,
);
const offsetBuckets = [2, 6, 14, 38, 75];
excelCustomerRows.forEach((row, index) => {
  const offset = offsetBuckets[index % offsetBuckets.length];
  const adjusted = new Date(datasetReferenceTime);
  adjusted.setDate(adjusted.getDate() - offset);
  row.lastInteractionDate = adjusted.toISOString().split("T")[0];
});
const baseCustomerRows =
  excelCustomerRows.length > 0 ? excelCustomerRows : fallbackCustomerRows;
const subscriptionLookup: Record<string, CustomerSubscriptionRecord> = {};
excelCustomerRows.forEach((row, index) => {
  const record = customerSubscriptions[index];
  subscriptionLookup[row.id] = record;
});
const referenceTimeFallback = datasetReferenceTime;
const customerTypeOptions = [
  "All",
  ...Array.from(
    new Set(
      customerSubscriptions
        .map((record) => record.customerType)
        .filter((value): value is string => Boolean(value)),
    ),
  ).sort(),
];
const CUSTOMER_TABLE_PAGE_SIZE = 10;
// Table headers will be translated inside the component
const tableCellBackground: CSSProperties = {
  backgroundColor: color.surface.tablebodybg,
};

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
          className="flex items-center justify-between gap-4 text-sm text-gray-600"
        >
          <span className="flex items-center gap-2">
            <span
              className="h-3 w-3 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            {entry.name}
          </span>
          <span className="font-semibold text-gray-900">{entry.value}</span>
        </div>
      ))}
    </div>
  );
};

const rangeOptions: RangeOption[] = ["7d", "30d", "90d"];
const rangeDays: Record<RangeOption, number> = {
  "7d": 7,
  "30d": 30,
  "90d": 90,
};
const rangeMultipliers: Record<RangeOption, number> = {
  "7d": 0.38,
  "30d": 0.74,
  "90d": 1,
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

// Calculate scale factor based on actual custom days vs base range
const getCustomScaleFactor = (
  customDays: number | null,
  baseRange: RangeOption,
): number => {
  if (!customDays) return rangeMultipliers[baseRange];
  const baseDays = rangeDays[baseRange];
  const baseMultiplier = rangeMultipliers[baseRange];
  // Scale proportionally: if 7d has multiplier 0.38, and user selects 14 days (2x), scale to 0.76
  return (customDays / baseDays) * baseMultiplier;
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

export default function CustomerProfileReportsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { t } = useLanguage();
  const { success: showSuccess, error: showError } = useToast();
  const [selectedRange, setSelectedRange] = useState<RangeOption>("90d");
  const [customRange, setCustomRange] = useState({ start: "", end: "" });
  const [appliedCustomRange, setAppliedCustomRange] = useState({
    start: "",
    end: "",
  });
  const [tableSearchTerm, setTableSearchTerm] = useState("");
  const [debouncedTableSearchTerm, setDebouncedTableSearchTerm] = useState("");
  const [tablePage, setTablePage] = useState(1);
  const [apiCustomers, setApiCustomers] = useState<CustomerSubscriptionRecord[]>([]);
  const [isLoadingCustomers, setIsLoadingCustomers] = useState(true);
  const [isSearchingTable, setIsSearchingTable] = useState(false);
  const [useDummyData] = useState(true); // Charts use dummy data, table uses API data
  const locationState = location.state as
    | { subscription?: CustomerSubscriptionRecord }
    | undefined;
  const subscriptionIdParam = searchParams.get("subscriptionId");

  const selectedSubscription = useMemo(() => {
    if (locationState?.subscription) {
      return locationState.subscription;
    }
    if (subscriptionIdParam) {
      return customerSubscriptions.find(
        (record) =>
          record.subscriptionId?.toString() === subscriptionIdParam ||
          record.customerId?.toString() === subscriptionIdParam,
      );
    }
    return undefined;
  }, [locationState, subscriptionIdParam]);

  // Fetch customers from API
  useEffect(() => {
    const loadCustomersFromAPI = async () => {
      try {
        setIsLoadingCustomers(true);
        const response = await customerService.getAllCustomers({
          limit: 100,
          offset: 0,
        });

        if (response.success && response.data && Array.isArray(response.data)) {
          const convertedCustomers = response.data.map((apiCustomer) => {
            const customerId =
              typeof apiCustomer.id === "string"
                ? parseInt(apiCustomer.id, 10)
                : apiCustomer.id;

            const subscriberId = (apiCustomer as any).subscriber_id
              ? typeof (apiCustomer as any).subscriber_id === "string"
                ? parseInt((apiCustomer as any).subscriber_id, 10)
                : (apiCustomer as any).subscriber_id
              : customerId;

            return {
              customerId: customerId,
              subscriptionId: subscriberId,
              firstName: apiCustomer.first_name || "Unknown",
              lastName: apiCustomer.last_name || "Customer",
              msisdn: apiCustomer.msisdn,
              email: apiCustomer.email,
              city: apiCustomer.city,
              customerType: apiCustomer.subscriber_type || "prepaid",
              tariff: apiCustomer.preferred_channel || "NORMAL_SMS",
              status: apiCustomer.subscriber_status || "active",
              simType: apiCustomer.kyc_verified ? "KYC Verified" : "Not Verified",
              activationDate: apiCustomer.created_at,
            };
          });
          setApiCustomers(convertedCustomers);
        }
      } catch (error) {
        console.error("Failed to load customers from API:", error);
        showError(
          "Failed to Load Customers",
          "Unable to retrieve customers. Please try again.",
        );
      } finally {
        setIsLoadingCustomers(false);
      }
    };

    loadCustomersFromAPI();
  }, [showError]);

  // Customer search state
  const [customerSearchTerm, setCustomerSearchTerm] = useState<string>("");
  const [isSearchingCustomer, setIsSearchingCustomer] =
    useState<boolean>(false);
  const [customerError, setCustomerError] = useState<string | null>(null);

  // Convert API customers to CustomerRow format for table display (includes searched customers)
  const apiCustomerRows = useMemo(() => {
    const allCustomers = searchedApiCustomers.length > 0 ? searchedApiCustomers : apiCustomers;
    return allCustomers.map((subscription) =>
      convertSubscriptionToCustomerRow(subscription),
    );
  }, [apiCustomers, searchedApiCustomers]);

  // Build subscription lookup from API customers (includes searched customers)
  const apiSubscriptionLookup = useMemo(() => {
    const lookup: Record<string, CustomerSubscriptionRecord> = {};
    const allCustomers = searchedApiCustomers.length > 0 ? searchedApiCustomers : apiCustomers;
    allCustomers.forEach((subscription) => {
      const row = convertSubscriptionToCustomerRow(subscription);
      lookup[row.id] = subscription;
    });
    return lookup;
  }, [apiCustomers, searchedApiCustomers]);

  const subscriptionDetailItems = useMemo(() => {
    if (!selectedSubscription) return [];
    return [
      {
        label: t.customer360.msisdn,
        value: formatMsisdn(selectedSubscription.msisdn),
      },
      {
        label: t.customer360.status,
        value: selectedSubscription.status ?? "—",
      },
      {
        label: t.customer360.activationDate,
        value: formatDateTime(selectedSubscription.activationDate),
      },
      {
        label: t.customer360.customerType,
        value: selectedSubscription.customerType ?? "—",
      },
      {
        label: t.customer360.tariff,
        value: selectedSubscription.tariff ?? "—",
      },
      {
        label: t.customer360.simType,
        value: selectedSubscription.simType ?? "—",
      },
      {
        label: "Banking Services",
        value: selectedSubscription.bankingServices ?? "—",
      },
      {
        label: "Preferred Language",
        value: selectedSubscription.preferredLanguage ?? "—",
      },
      {
        label: t.customer360.city,
        value: selectedSubscription.city ?? "—",
      },
      {
        label: "Estate",
        value: selectedSubscription.estate ?? "—",
      },
      {
        label: "Branch Code",
        value: selectedSubscription.branchCode ?? "—",
      },
      {
        label: "County ID",
        value: selectedSubscription.customerCountyId ?? "—",
      },
    ];
  }, [selectedSubscription]);

  const handleRun = () => {
    setAppliedCustomRange(customRange);
  };

  // Customer search function - searches in existing customer data
  const handleCustomerSearch = () => {
    if (!customerSearchTerm.trim()) {
      setCustomerError(t.customerProfileReports.enterCustomerInfo);
      return;
    }

    setIsSearchingCustomer(true);
    setCustomerError(null);

    try {
      const searchLower = customerSearchTerm.toLowerCase().trim();

      // Search in all customerRows (not just filtered) to allow searching any customer
      const foundCustomer = baseCustomerRows.find((customer) => {
        return (
          customer.id.toLowerCase().includes(searchLower) ||
          customer.name.toLowerCase().includes(searchLower) ||
          customer.location.toLowerCase().includes(searchLower)
        );
      });

      if (!foundCustomer) {
        setCustomerError(t.customerProfileReports.customerNotFound);
        setIsSearchingCustomer(false);
        return;
      }

      const linkedSubscription = apiSubscriptionLookup[foundCustomer.id];

      navigate(
        `/dashboard/reports/customer-profiles/search?customerId=${foundCustomer.id}&source=reports`,
        {
          state: {
            customer: foundCustomer,
            subscription: linkedSubscription,
            searchTerm: customerSearchTerm,
            source: "reports" as const,
          },
        },
      );
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : t.customerProfileReports.failedToSearch;
      setCustomerError(errorMessage);
    } finally {
      setIsSearchingCustomer(false);
    }
  };

  const handleOpenCustomerProfile = (customer: CustomerRow) => {
    const subscription = apiSubscriptionLookup[customer.id];
    const params = new URLSearchParams();
    params.set("customerId", customer.id);
    params.set("source", "reports");
    if (subscription?.subscriptionId) {
      params.set("subscriptionId", subscription.subscriptionId.toString());
    }

    navigate(
      `/dashboard/reports/customer-profiles/search?${params.toString()}`,
      {
        state: {
          customer,
          subscription,
          source: "reports" as const,
        },
      },
    );
  };

  const customDays = getDaysBetween(
    appliedCustomRange.start,
    appliedCustomRange.end,
  );
  const activeRangeKey: RangeOption =
    appliedCustomRange.start && appliedCustomRange.end
      ? mapDaysToRange(customDays)
      : selectedRange;

  // Calculate actual scale factor based on custom days
  const actualMultiplier = useMemo(() => {
    if (appliedCustomRange.start && appliedCustomRange.end && customDays) {
      return getCustomScaleFactor(customDays, activeRangeKey);
    }
    return rangeMultipliers[activeRangeKey];
  }, [
    appliedCustomRange.start,
    appliedCustomRange.end,
    customDays,
    activeRangeKey,
  ]);

  // Debounce table search term (300ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedTableSearchTerm(tableSearchTerm);
      setTablePage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [tableSearchTerm]);

  useEffect(() => {
    setTablePage(1);
  }, [
    debouncedTableSearchTerm,
    activeRangeKey,
    appliedCustomRange.start,
    appliedCustomRange.end,
  ]);

  const referenceTime = useMemo(() => {
    if (useDummyData) {
      return Date.now();
    }
    const timestamps = baseCustomerRows
      .map((row) => new Date(row.lastInteractionDate).getTime())
      .filter((value) => !Number.isNaN(value));
    if (!timestamps.length) {
      return referenceTimeFallback;
    }
    return Math.max(...timestamps);
  }, [baseCustomerRows, useDummyData]);

  const valueMatrixSeries = useMemo(() => {
    if (!useDummyData) {
      return baseValueMatrixData.map((point) => ({
        ...point,
        customers: 0,
        recency: 0,
        valueScore: 0,
      }));
    }
    const multiplier = actualMultiplier;
    return baseValueMatrixData.map((point) => ({
      ...point,
      customers: Math.max(200, Math.round(point.customers * multiplier)),
      recency: Math.round(
        point.recency *
          (activeRangeKey === "7d" ? 0.6 : activeRangeKey === "30d" ? 0.85 : 1),
      ),
      valueScore: Math.min(
        100,
        Math.round(
          point.valueScore *
            (activeRangeKey === "7d"
              ? 0.95
              : activeRangeKey === "30d"
                ? 0.98
                : 1),
        ),
      ),
    }));
  }, [actualMultiplier, activeRangeKey, useDummyData]);

  const lifecycleSeries = useMemo(() => {
    if (!useDummyData) {
      return baseLifecycleData.map((point) => ({
        month: point.month,
        new: 0,
        active: 0,
        atRisk: 0,
        dormant: 0,
        churned: 0,
        reactivated: 0,
      }));
    }
    const multiplier = actualMultiplier;
    return baseLifecycleData.map((point) => ({
      month: point.month,
      new: Math.round(point.new * multiplier),
      active: Math.round(point.active * multiplier),
      atRisk: Math.round(point.atRisk * multiplier),
      dormant: Math.round(point.dormant * multiplier),
      churned: Math.round(point.churned * multiplier),
      reactivated: Math.round(point.reactivated * multiplier),
    }));
  }, [actualMultiplier, useDummyData]);

  const clvDistributionSeries = useMemo(() => {
    if (!useDummyData) {
      return baseClvDistribution.map((bucket) => ({
        ...bucket,
        customers: 0,
        revenueShare: 0,
      }));
    }
    const multiplier = actualMultiplier;
    return baseClvDistribution.map((bucket) => ({
      ...bucket,
      customers: Math.round(bucket.customers * multiplier),
    }));
  }, [actualMultiplier, useDummyData]);

  const cohortSeries = useMemo(() => {
    if (!useDummyData) {
      return baseCohortRetention.map((point) => ({
        ...point,
        retention: 0,
      }));
    }
    const adjustment =
      activeRangeKey === "7d" ? 3 : activeRangeKey === "30d" ? 1 : 0;
    return baseCohortRetention.map((point) => ({
      ...point,
      retention: Math.min(100, point.retention + adjustment),
    }));
  }, [activeRangeKey, useDummyData]);

  const cohortComparisonSeries = useMemo(() => {
    const months = Array.from(
      new Set(cohortSeries.map((entry) => entry.month)),
    ).sort((a, b) => a - b);

    const cohorts = ["Jan", "Apr", "Jul"];

    return months.map((month) => {
      const row: Record<string, string | number> = {
        month: `Month ${month}`,
      };

      cohorts.forEach((cohort) => {
        const dataPoint = cohortSeries.find(
          (entry) => entry.month === month && entry.cohort === cohort,
        );
        row[cohort] = dataPoint?.retention ?? 0;
      });

      return row;
    });
  }, [cohortSeries]);

  // Fetch customers for table: Use API search when search term provided, otherwise use loaded customers
  const [searchedApiCustomers, setSearchedApiCustomers] = useState<CustomerSubscriptionRecord[]>([]);

  useEffect(() => {
    const loadTableCustomers = async () => {
      if (!debouncedTableSearchTerm.trim()) {
        setSearchedApiCustomers(apiCustomers);
        return;
      }

      try {
        setIsSearchingTable(true);
        const response = await customerService.searchCustomers({
          search: debouncedTableSearchTerm,
          limit: 100,
          offset: 0,
        });

        if (response.success && response.data && Array.isArray(response.data)) {
          const convertedCustomers = response.data.map((apiCustomer) => {
            const customerId =
              typeof apiCustomer.id === "string"
                ? parseInt(apiCustomer.id, 10)
                : apiCustomer.id;

            const subscriberId = (apiCustomer as any).subscriber_id
              ? typeof (apiCustomer as any).subscriber_id === "string"
                ? parseInt((apiCustomer as any).subscriber_id, 10)
                : (apiCustomer as any).subscriber_id
              : customerId;

            return {
              customerId: customerId,
              subscriptionId: subscriberId,
              firstName: apiCustomer.first_name || "Unknown",
              lastName: apiCustomer.last_name || "Customer",
              msisdn: apiCustomer.msisdn,
              email: apiCustomer.email,
              city: apiCustomer.city,
              customerType: apiCustomer.subscriber_type || "prepaid",
              tariff: apiCustomer.preferred_channel || "NORMAL_SMS",
              status: apiCustomer.subscriber_status || "active",
              simType: apiCustomer.kyc_verified ? "KYC Verified" : "Not Verified",
              activationDate: apiCustomer.created_at,
            };
          });
          setSearchedApiCustomers(convertedCustomers);
        }
      } catch (error) {
        console.error("Failed to search customers:", error);
        setSearchedApiCustomers([]);
      } finally {
        setIsSearchingTable(false);
      }
    };

    loadTableCustomers();
  }, [debouncedTableSearchTerm]);

  const tableCustomers = useMemo(() => {
    return searchedApiCustomers.length > 0 ? searchedApiCustomers : apiCustomers;
  }, [searchedApiCustomers, apiCustomers]);

  // Customers for charts: Apply date range filter
  const filteredCustomers = useMemo(() => {
    const maxDays =
      appliedCustomRange.start && appliedCustomRange.end
        ? (customDays ?? rangeDays[activeRangeKey])
        : rangeDays[activeRangeKey];
    const startMs = appliedCustomRange.start
      ? new Date(appliedCustomRange.start).getTime()
      : null;
    const endMs = appliedCustomRange.end
      ? new Date(appliedCustomRange.end).getTime()
      : null;

    return baseCustomerRows.filter((row) => {
      const rowDate = new Date(row.lastInteractionDate).getTime();
      const now = referenceTime;
      const matchesRange =
        appliedCustomRange.start && appliedCustomRange.end && startMs && endMs
          ? rowDate >= startMs && rowDate <= endMs
          : now - rowDate <= maxDays * 24 * 60 * 60 * 1000;
      return matchesRange;
    });
  }, [
    customRange,
    customDays,
    activeRangeKey,
    baseCustomerRows,
    referenceTime,
  ]);

  useEffect(() => {
    setTablePage((prev) => {
      const maxPage = Math.max(
        1,
        Math.ceil(tableCustomers.length / CUSTOMER_TABLE_PAGE_SIZE),
      );
      return Math.min(prev, maxPage);
    });
  }, [tableCustomers.length]);

  const tableOffset = Math.max(0, (tablePage - 1) * CUSTOMER_TABLE_PAGE_SIZE);
  const paginatedCustomers = useMemo(() => {
    return tableCustomers.slice(
      tableOffset,
      tableOffset + CUSTOMER_TABLE_PAGE_SIZE,
    );
  }, [tableCustomers, tableOffset]);
  const totalPages = Math.max(
    1,
    Math.ceil(tableCustomers.length / CUSTOMER_TABLE_PAGE_SIZE),
  );

  const csvHeaders = [
    "Customer",
    "MSISDN",
    "Subscription ID",
    "Customer Type",
    "Tariff",
    "SIM Type",
    "Status",
    "Activation Date",
    "City",
  ];

  const csvRows = tableCustomers.map((row) => {
    const subscription = apiSubscriptionLookup[row.id];
    return [
      row.name,
      formatMsisdn(subscription?.msisdn),
      subscription?.subscriptionId ?? "",
      subscription?.customerType ?? "",
      subscription?.tariff ?? "",
      subscription?.simType ?? "",
      subscription?.status ?? "",
      subscription ? formatDateTime(subscription.activationDate) : "",
      subscription?.city ?? "",
    ];
  });

  return (
    <div className="space-y-6">
      <header className="space-y-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {t.customerProfileReports.title}
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            {t.customerProfileReports.description}
          </p>
        </div>

        {/* Customer Search Section */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={customerSearchTerm}
              onChange={(e) => setCustomerSearchTerm(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleCustomerSearch();
                }
              }}
              placeholder={t.customerProfileReports.searchPlaceholder}
              className={`w-full pl-10 pr-4 py-3.5 text-sm ${tw.rounded} border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#252829] cursor-pointer`}
            />
          </div>
          <button
            type="button"
            onClick={handleCustomerSearch}
            disabled={isSearchingCustomer}
            className={`px-6 py-3.5 text-sm font-semibold text-white ${tw.rounded} hover:opacity-95 transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
            style={{ backgroundColor: color.primary.action }}
          >
            {isSearchingCustomer
              ? t.customerProfileReports.searching
              : t.customerProfileReports.search}
          </button>
        </div>
        {customerError && (
          <p className="text-sm text-red-600">{customerError}</p>
        )}

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
                className={`${
                  tw.rounded
                } border px-3 py-1.5 text-sm font-medium transition-colors ${
                  !(appliedCustomRange.start && appliedCustomRange.end) &&
                  selectedRange === option
                    ? "border-[#252829] bg-[#252829] text-white"
                    : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"
                }`}
              >
                {option === "7d"
                  ? t.customerProfileReports.daily
                  : option === "30d"
                    ? t.customerProfileReports.weekly
                    : t.customerProfileReports.monthly}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <label
                htmlFor="customer-date-start"
                className="text-sm font-medium text-gray-700 whitespace-nowrap"
              >
                {t.customerProfileReports.from}
              </label>
              <input
                id="customer-date-start"
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
                htmlFor="customer-date-end"
                className="text-sm font-medium text-gray-700 whitespace-nowrap"
              >
                {t.customerProfileReports.to}
              </label>
              <input
                id="customer-date-end"
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
                style={{ backgroundColor: color.primary.action }}
              >
                {t.customerProfileReports.run}
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
                {t.customerProfileReports.clear}
              </button>
            )}
          </div>
        </div>
      </header>

      {selectedSubscription && (
        <section className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase text-gray-500">
                {t.customerProfileReports.viewingSubscription}
              </p>
              <p className="mt-1 text-2xl font-semibold text-gray-900">
                {getSubscriptionDisplayName(selectedSubscription, "Customer")}
              </p>
              <div className="mt-2 flex flex-wrap gap-3 text-sm text-gray-600">
                <span>Customer #{selectedSubscription.customerId}</span>
                <span>
                  {t.customerProfileReports.subscriptionNumber}
                  {selectedSubscription.subscriptionId}
                </span>
              </div>
              <div className="mt-2 flex flex-wrap gap-3 text-xs text-gray-500">
                {selectedSubscription.email && (
                  <span>{selectedSubscription.email}</span>
                )}
                {selectedSubscription.birthDate && (
                  <span>
                    {t.customerProfileReports.birth}{" "}
                    {selectedSubscription.birthDate.split(" ")[0]}
                  </span>
                )}
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-gray-600 lg:w-1/2">
              {subscriptionDetailItems.map(({ label, value }) => (
                <div key={label}>
                  <p className="text-xs uppercase text-gray-400">{label}</p>
                  <p className="mt-1 font-semibold text-gray-900">{value}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      <section>
        {(() => {
          // Use actual multiplier for custom dates, otherwise use preset scale
          const valueScale = actualMultiplier;
          const clvAdjust =
            activeRangeKey === "7d"
              ? 0.96
              : activeRangeKey === "30d"
                ? 0.99
                : 1;
          const engagementAdjust =
            activeRangeKey === "7d" ? -3 : activeRangeKey === "30d" ? -1 : 0;
          const churnAdjust =
            activeRangeKey === "7d"
              ? -0.4
              : activeRangeKey === "30d"
                ? -0.2
                : 0;

          const heroMetrics: HeroMetric[] = useDummyData
            ? [
                {
                  label: t.customerProfileReports.activeCustomers,
                  value: formatNumber(
                    Math.round(heroBase.activeCustomers * valueScale),
                  ),
                  trend: "+4.2% vs last 90d",
                  trendDirection: "up",
                  description: t.customerProfileReports.activityInPeriod,
                  icon: Users,
                },
                {
                  label: t.customerProfileReports.avgCustomerLifetimeValue,
                  value: formatCurrency(
                    Math.round(heroBase.avgClv * clvAdjust),
                  ),
                  trend: "+3.1% vs last quarter",
                  trendDirection: "up",
                  description:
                    t.customerProfileReports.meanRealizedPredictedClv,
                  icon: DollarSign,
                },
                {
                  label: t.customerProfileReports.avgTransactionValue,
                  value: formatCurrency(
                    Math.round(heroBase.avgOrderValue * clvAdjust),
                  ),
                  trend: "+1.6% vs prior period",
                  trendDirection: "up",
                  description: t.customerProfileReports.meanTransactionSize,
                  icon: Crown,
                },
                {
                  label: t.customerProfileReports.purchaseFrequency,
                  value: `${(heroBase.purchaseFrequency * clvAdjust).toFixed(
                    1,
                  )} / yr`,
                  trend: "+0.2 YoY",
                  trendDirection: "up",
                  description:
                    t.customerProfileReports.transactionsPerCustomerAnnually,
                  icon: Repeat,
                },
                {
                  label: t.customerProfileReports.engagementScore,
                  value: `${Math.max(
                    0,
                    heroBase.engagementScore + engagementAdjust,
                  ).toFixed(0)} / 100`,
                  trend: "-2 pts vs last 30d",
                  trendDirection: engagementAdjust < 0 ? "down" : "up",
                  description:
                    t.customerProfileReports.multiChannelCompositeScore,
                  icon: Activity,
                },
                {
                  label: t.customerProfileReports.churnRate,
                  value: `${Math.max(
                    0,
                    heroBase.churnRate + churnAdjust,
                  ).toFixed(1)}%`,
                  trend: "-0.6 pts vs last quarter",
                  trendDirection: "down",
                  description: t.customerProfileReports.noTransactionInDays,
                  icon: BarChart3,
                },
              ]
            : [
                {
                  label: t.customerProfileReports.activeCustomers,
                  value: "0",
                  trend: "—",
                  trendDirection: "up",
                  description: t.customerProfileReports.activityInPeriod,
                  icon: Users,
                },
                {
                  label: t.customerProfileReports.avgCustomerLifetimeValue,
                  value: formatCurrency(0),
                  trend: "—",
                  trendDirection: "up",
                  description:
                    t.customerProfileReports.meanRealizedPredictedClv,
                  icon: DollarSign,
                },
                {
                  label: t.customerProfileReports.avgTransactionValue,
                  value: formatCurrency(0),
                  trend: "—",
                  trendDirection: "up",
                  description: t.customerProfileReports.meanTransactionSize,
                  icon: Crown,
                },
                {
                  label: t.customerProfileReports.purchaseFrequency,
                  value: "0.0 / yr",
                  trend: "—",
                  trendDirection: "up",
                  description:
                    t.customerProfileReports.transactionsPerCustomerAnnually,
                  icon: Repeat,
                },
                {
                  label: t.customerProfileReports.engagementScore,
                  value: "0 / 100",
                  trend: "—",
                  trendDirection: "up",
                  description:
                    t.customerProfileReports.multiChannelCompositeScore,
                  icon: Activity,
                },
                {
                  label: t.customerProfileReports.churnRate,
                  value: "0.0%",
                  trend: "—",
                  trendDirection: "down",
                  description: t.customerProfileReports.noTransactionInDays,
                  icon: BarChart3,
                },
              ];

          return (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {heroMetrics.map((metric) => (
                <div
                  key={metric.label}
                  className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm`}
                >
                  <div className="flex items-center gap-2">
                    <span style={{ color: colors.primary.accent }}>
                      <metric.icon className="h-5 w-5" />
                    </span>
                    <p className="text-sm font-medium text-gray-600">
                      {metric.label}
                    </p>
                  </div>
                  <p className="mt-2 text-3xl font-bold text-gray-900">
                    {metric.value}
                  </p>
                  <div className="mt-3 flex items-center gap-2 text-sm">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-medium ${
                        metric.trendDirection === "up"
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-rose-50 text-rose-700"
                      }`}
                    >
                      <ArrowUpRight
                        className={`h-3.5 w-3.5 ${
                          metric.trendDirection === "down" ? "rotate-90" : ""
                        }`}
                      />
                      {metric.trend}
                    </span>
                    <span className="text-gray-500">{metric.description}</span>
                  </div>
                </div>
              ))}
            </div>
          );
        })()}
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div
          className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm`}
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {t.customerProfileReports.customerValueMatrix}
              </h2>
              <p className="mt-1 text-sm text-gray-600">
                {t.customerProfileReports.valueMatrixDescription}
              </p>
            </div>
          </div>
          <div className="mt-6 h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={valueMatrixSeries}
                margin={{ top: 20, right: 24, left: 0, bottom: 50 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="segment"
                  tick={{ fill: "#6b7280", fontSize: 11 }}
                  interval={0}
                />
                <YAxis tick={{ fill: "#6b7280" }} />
                <Tooltip
                  content={<CustomTooltip />}
                  cursor={{ fill: "transparent" }}
                />
                <Bar
                  dataKey="customers"
                  name={t.customerProfileReports.customers}
                  fill={
                    colors.reportCharts.customerProfile.valueMatrix.customers
                  }
                  maxBarSize={60}
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div
          className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm`}
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {t.customerProfileReports.customerLifetimeValueDistribution}
              </h2>
              <p className="mt-1 text-sm text-gray-600">
                {t.customerProfileReports.clvDistributionDescription}
              </p>
            </div>
          </div>
          <div className="mt-6 h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={clvDistributionSeries}
                margin={{ top: 20, right: 24, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="range" tick={{ fill: "#6b7280" }} />
                <YAxis
                  yAxisId="left"
                  tick={{ fill: "#6b7280" }}
                  tickFormatter={(value) => `${value / 1000}k`}
                  label={{
                    value: t.customerProfileReports.customers,
                    angle: -90,
                    position: "insideLeft",
                  }}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  tick={{ fill: "#6b7280" }}
                  tickFormatter={(value) => `${value}%`}
                  label={{
                    value: t.customerProfileReports.revenueShare,
                    angle: 90,
                    position: "insideRight",
                  }}
                />
                <Tooltip
                  content={<CustomTooltip />}
                  cursor={{ fill: "transparent" }}
                />
                <Legend iconType="circle" wrapperStyle={{ paddingTop: 12 }} />
                <Bar
                  yAxisId="left"
                  dataKey="customers"
                  name={t.customerProfileReports.customers}
                  fill={
                    colors.reportCharts.customerProfile.clvDistribution
                      .customers
                  }
                  radius={[4, 4, 0, 0]}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="revenueShare"
                  name={t.customerProfileReports.revenueShare}
                  stroke={
                    colors.reportCharts.customerProfile.clvDistribution
                      .revenueShare
                  }
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      <section className="space-y-6">
        <div
          className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm`}
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {t.customerProfileReports.lifecycleDistribution}
              </h2>
              <p className="mt-1 text-sm text-gray-600">
                {t.customerProfileReports.lifecycleDescription}
              </p>
            </div>
          </div>
          <div className="mt-6 h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={lifecycleSeries}
                margin={{ top: 20, right: 24, left: 20, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fill: "#6b7280" }} />
                <YAxis
                  tick={{ fill: "#6b7280" }}
                  tickFormatter={(value) => `${value}k`}
                  label={{
                    value: `${t.customerProfileReports.customers} (000s)`,
                    angle: -90,
                    position: "insideLeft",
                  }}
                />
                <Tooltip
                  content={<CustomTooltip />}
                  cursor={{ fill: "transparent" }}
                />
                <Legend iconType="circle" wrapperStyle={{ paddingTop: 12 }} />
                <Bar
                  dataKey="active"
                  name={t.customerProfileReports.active}
                  fill={
                    colors.reportCharts.customerProfile.lifecycleDistribution
                      .active
                  }
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="new"
                  name={t.customerProfileReports.new}
                  fill={
                    colors.reportCharts.customerProfile.lifecycleDistribution
                      .new
                  }
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="reactivated"
                  name={t.customerProfileReports.reactivated}
                  fill={
                    colors.reportCharts.customerProfile.lifecycleDistribution
                      .reactivated
                  }
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="atRisk"
                  name={t.customerProfileReports.atRisk}
                  fill={
                    colors.reportCharts.customerProfile.lifecycleDistribution
                      .atRisk
                  }
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="dormant"
                  name={t.customerProfileReports.dormant}
                  fill={
                    colors.reportCharts.customerProfile.lifecycleDistribution
                      .dormant
                  }
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="churned"
                  name={t.customerProfileReports.churned}
                  fill={
                    colors.reportCharts.customerProfile.lifecycleDistribution
                      .churned
                  }
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div
          className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm`}
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {t.customerProfileReports.cohortRetentionComparison}
              </h2>
              <p className="mt-1 text-sm text-gray-600">
                {t.customerProfileReports.cohortDescription}
              </p>
            </div>
          </div>
          <div className="mt-6 h-96">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={cohortComparisonSeries}
                margin={{ top: 20, right: 24, left: 20, bottom: 40 }}
                barCategoryGap="30%"
                barGap={12}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="month"
                  tick={{ fill: "#6b7280" }}
                  label={{
                    value: t.customerProfileReports.monthsSinceAcquisition,
                    position: "bottom",
                    style: { marginTop: 8, marginBottom: 8 },
                  }}
                />
                <YAxis
                  tick={{ fill: "#6b7280" }}
                  domain={[0, 100]}
                  tickFormatter={(value) => `${value}%`}
                  label={{
                    value: t.customerProfileReports.retentionPercent,
                    angle: -90,
                    position: "insideLeft",
                  }}
                />
                <Tooltip
                  content={<CustomTooltip />}
                  cursor={{ fill: "transparent" }}
                />
                <Legend
                  iconType="circle"
                  wrapperStyle={{ paddingTop: 28, marginTop: 18 }}
                />
                <Bar
                  dataKey="Jan"
                  name={t.customerProfileReports.janCohort}
                  fill={colors.reportCharts.customerProfile.cohortRetention.jan}
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="Apr"
                  name={t.customerProfileReports.aprCohort}
                  fill={colors.reportCharts.customerProfile.cohortRetention.apr}
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="Jul"
                  name={t.customerProfileReports.julCohort}
                  fill={colors.reportCharts.customerProfile.cohortRetention.jul}
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      <section className="space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              {t.customerProfileReports.customerDetailTable}
            </h2>
            <p className="mt-1 text-sm text-gray-600">
              {t.customerProfileReports.tableDescription}
            </p>
          </div>
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <div className="relative flex-1 md:flex-none md:w-64">
              <Search className={`absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 ${
                isSearchingTable ? "text-gray-300" : "text-gray-400"
              }`} />
              <input
                type="text"
                value={tableSearchTerm}
                onChange={(e) => {
                  setTableSearchTerm(e.target.value);
                }}
                disabled={isSearchingTable}
                placeholder="Search by name, email, or MSISDN..."
                className={`w-full pl-10 pr-4 py-2 text-sm border border-gray-300 ${tw.rounded} focus:outline-none focus:ring-2 focus:ring-gray-900 disabled:bg-gray-50 disabled:cursor-wait`}
              />
            </div>
            <CsvDownloadButton
              headers={csvHeaders}
              rows={csvRows}
              filename="customer_profile_report.csv"
              label={t.customerProfileReports.downloadCsv}
              style={{ backgroundColor: colors.primary.action }}
            />
          </div>
        </div>

        {isLoadingCustomers ? (
          <div className="flex items-center justify-center py-16">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mb-4" />
              <p className="text-sm text-gray-600">Loading customers...</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="overflow-x-auto">
              <table
                className="w-full"
                style={{ borderCollapse: "separate", borderSpacing: "0 8px" }}
              >
              <thead
                className="text-xs uppercase tracking-wide"
                style={{ background: color.surface.tableHeader }}
              >
                <tr>
                  {[
                    t.customer360.customer,
                    t.customer360.msisdn,
                    t.customer360.subscriptionId,
                    t.customer360.customerType,
                    t.customer360.preferredChannel,
                    t.customer360.simType,
                    t.customer360.status,
                    t.customer360.activationDate,
                    t.customer360.city,
                    t.customer360.actions,
                  ].map((header) => (
                    <th
                      key={header}
                      className="px-6 py-3 text-left font-semibold text-sm text-gray-900"
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginatedCustomers.map((customer) => {
                  const subscription = apiSubscriptionLookup[customer.id];
                  const status = subscription?.status ?? "Unknown";
                  const statusLower = status.toLowerCase();
                  const statusStyles =
                    statusLower === "active"
                      ? "bg-emerald-50 text-emerald-700"
                      : statusLower === "pending"
                        ? "bg-amber-50 text-amber-700"
                        : "bg-gray-100 text-gray-700";

                  return (
                    <tr key={customer.id}>
                      <td
                        className="rounded-l-md px-6 py-5 text-sm"
                        style={tableCellBackground}
                      >
                        <button
                          type="button"
                          onClick={() => handleOpenCustomerProfile(customer)}
                          className="text-left"
                        >
                          <p className="font-semibold text-gray-900 hover:underline text-sm">
                            {customer.name}
                          </p>
                          {/* <p className="mt-1 text-xs text-gray-500">
                            Customer #{subscription?.customerId ?? customer.id}
                          </p>
                          {(subscription?.email || customer.email) && (
                            <p className="mt-0.5 text-xs text-gray-500 truncate">
                              {subscription?.email ?? customer.email}
                            </p>
                          )} */}
                        </button>
                      </td>
                      <td
                        className="px-6 py-5 text-sm text-gray-900"
                        style={tableCellBackground}
                      >
                        {formatMsisdn(subscription?.msisdn ?? customer.msisdn)}
                      </td>
                      <td
                        className="px-6 py-5 text-sm text-gray-900"
                        style={tableCellBackground}
                      >
                        {subscription?.subscriptionId ?? "—"}
                      </td>
                      <td
                        className="px-6 py-5 text-sm text-gray-900"
                        style={tableCellBackground}
                      >
                        {subscription?.customerType ?? customer.segment ?? "—"}
                      </td>
                      <td
                        className="px-6 py-5 text-sm text-gray-900"
                        style={tableCellBackground}
                      >
                        {subscription?.tariff ?? "—"}
                      </td>
                      <td
                        className="px-6 py-5 text-sm text-gray-900"
                        style={tableCellBackground}
                      >
                        {subscription?.simType ?? "—"}
                      </td>
                      <td className="px-6 py-5 text-sm text-gray-900" style={tableCellBackground}>
                        {status}
                      </td>
                      <td
                        className="px-6 py-5 text-sm text-gray-900"
                        style={tableCellBackground}
                      >
                        {formatDateTime(subscription?.activationDate)}
                      </td>
                      <td
                        className="px-6 py-5 text-sm text-gray-900"
                        style={tableCellBackground}
                      >
                        {subscription?.city ?? customer.location ?? "—"}
                      </td>
                      <td
                        className="rounded-r-md px-6 py-5 text-right"
                        style={tableCellBackground}
                      >
                        <button
                          type="button"
                          onClick={() => handleOpenCustomerProfile(customer)}
                          className="inline-flex items-center justify-center p-2 text-gray-700 hover:text-gray-900"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              </table>
            </div>
            {!tableCustomers.length && (
              <div className="px-6 py-10 text-center text-sm text-gray-500">
                {t.customerProfileReports.noCustomersMatchFilters}
              </div>
            )}
            {tableCustomers.length > 0 && (
              <Pagination
                currentPage={tablePage}
                pageSize={CUSTOMER_TABLE_PAGE_SIZE}
                totalItems={tableCustomers.length}
                onPageChange={setTablePage}
              />
            )}
          </div>
        )}
      </section>
    </div>
  );
}
