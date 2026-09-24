import { useEffect, useMemo, useState, type CSSProperties } from "react";
import Input from '../../../shared/components/ui/Input';
import SearchInput from '../../../shared/components/ui/SearchInput';
import { useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { Eye } from "lucide-react";
import { colors } from "../../../shared/utils/tokens";
import HeadlessSelect from "../../../shared/components/ui/HeadlessSelect";
import Pagination, { DEFAULT_PAGE_SIZE } from "../../../shared/components/ui/Pagination";
import CsvDownloadButton from "../../../shared/components/CsvDownloadButton";
import { color, tw } from "../../../shared/utils/utils";
import { useLanguage } from "../../../contexts/LanguageContext";
import { extractBackendError } from "../../../shared/utils/errorHandler";;;
import { formatCurrency } from "../../../shared/services/currencyService";
import type {
  RangeOption,
  CustomerProfileReportsResponse,
} from "../types/ReportsAPI";
import type { CustomerSubscriptionRecord } from "../../customers360/types/customerSubscription";
import {
  getSubscriptionDisplayName,
  formatMsisdn,
  formatDateTime,
  convertSubscriptionToCustomerRow,
  type CustomerRow,
} from "../../customers360/utils/customerSubscriptionHelpers";
import { formatDate } from "../../../shared/services/dateService";
import { customerService } from "../../customers360/services/customerServices";
import { customerProfileReportsService } from "../services/customerProfileReportsService";
import { useReportTimeWindow } from "../hooks/useReportTimeWindow";
import { usePreviousPeriodSeries } from "../hooks/usePreviousPeriodSeries";
import { alignTrendSeries, toChartAudit } from "../utils/reportTimeWindow";
import {
  previousComparisonLabel as formatPreviousComparisonLabel,
  resolveComparisonSeries,
} from "../utils/reportComparison";
import { pickNamedArray } from "../utils/normalizeCampaignReport";
import { normalizeCustomerProfileReport, normalizeLifecyclePoints } from "../utils/normalizeCustomerProfileReport";
import { aggregateValueBands } from "../utils/subscriberCvmMetrics";
import CustomerProfileKpiGrid from "../components/CustomerProfileKpiGrid";
import ReportTrendsToolbar from "../components/ReportTrendsToolbar";
import SwitchableReportChart from "../components/SwitchableReportChart";
import { useToast } from "../../../contexts/ToastContext";
import { Table } from "../../../shared/components/Table/Table";
import { useTable } from "../../../shared/components/Table/useTable";
import type { TableColumn } from "../../../shared/components/Table/types";
import { ColumnPickerModal } from "../../../shared/components/ColumnPickerModal";

// Extract types from API response type
type ValueMatrixPoint = CustomerProfileReportsResponse["valueMatrix"][number];
type LifecyclePoint =
  CustomerProfileReportsResponse["lifecycleDistribution"][number];
type ClvBucket = CustomerProfileReportsResponse["clvDistribution"][number];
type CohortPoint = CustomerProfileReportsResponse["cohortRetention"][number];

// Local UI types
// Re-export CustomerRow for backward compatibility
export type { CustomerRow };

const baseValueMatrixData: ValueMatrixPoint[] = [
  {
    segment: "High Value",
    recency: 10,
    valueScore: 92,
    customers: 2400,
    lifecycle: "Active",
  },
  {
    segment: "Core",
    recency: 22,
    valueScore: 78,
    customers: 4800,
    lifecycle: "Active",
  },
  {
    segment: "Growth",
    recency: 35,
    valueScore: 55,
    customers: 6400,
    lifecycle: "New",
  },
  {
    segment: "At Risk",
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
    segment: "Win-back",
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
    "High Value",
    "Core",
    "Growth",
    "At Risk",
    "Win-back",
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
      if (segment === "At Risk")
        churnRisk = 65 + Math.floor(Math.random() * 20);
      else if (segment === "Growth")
        churnRisk = 25 + Math.floor(Math.random() * 10);
      else if (segment === "Win-back")
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

      if (segment === "High Value") {
        lifetimeValue = 8000 + Math.floor(Math.random() * 6000);
        clv = lifetimeValue * 1.15;
        orders = 30 + Math.floor(Math.random() * 25);
        aov = 250 + Math.floor(Math.random() * 100);
      } else if (segment === "Core") {
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
const tablePageSize = 10;
// Table headers will be translated inside the component
const tableCellBackground: CSSProperties = {
  backgroundColor: color.surface.tablebodybg,
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
  const timeWindow = useReportTimeWindow({
    overviewPreset: "monthly",
    defaultTrendsPreset: "daily",
  });
  const { isTrendsView, queryParams, overviewWindow, activeWindow, comparePreviousPeriod, previousQueryParams, previousPeriodLabel } = timeWindow;
  const chartAudit = toChartAudit(activeWindow);
  const overviewAudit = toChartAudit(overviewWindow);
  const selectedRange = timeWindow.rangeKey;
  const appliedCustomRange = timeWindow.activeWindow.bounds;
  const customRange = appliedCustomRange;
  const [tableSearchTerm, setTableSearchTerm] = useState("");
  const [debouncedTableSearchTerm, setDebouncedTableSearchTerm] = useState("");
  const [tablePage, setTablePage] = useState(1);
  const [tablePageSize, setTablePageSize] = useState(DEFAULT_PAGE_SIZE);
  const [clearFiltersKey, setClearFiltersKey] = useState(0);
  const [showColumnPicker, setShowColumnPicker] = useState(false);
  const [apiCustomers, setApiCustomers] = useState<
    CustomerSubscriptionRecord[]
  >([]);
  const [searchedApiCustomers, setSearchedApiCustomers] = useState<
    CustomerSubscriptionRecord[]
  >([]);
  const [isLoadingCustomers, setIsLoadingCustomers] = useState(true);
  const [isSearchingTable, setIsSearchingTable] = useState(false);
  const [useDummyData, setUseDummyData] = useState(true); // Charts use dummy data unless Real Data is selected
  const [liveReport, setLiveReport] = useState<CustomerProfileReportsResponse | null>(null);
  const [isLoadingLiveReport, setIsLoadingLiveReport] = useState(false);
  const [liveReportError, setLiveReportError] = useState<string | null>(null);

  const tableColumns: TableColumn<any>[] = [
    {
      id: "customerId",
      label: "Customer ID",
      visible: true,
      sortable: true,
      filterConfig: { type: "text" },
    },
    {
      id: "firstName",
      label: "First Name",
      visible: true,
      sortable: true,
    },
    {
      id: "lastName",
      label: "Last Name",
      visible: true,
      sortable: true,
    },
    {
      id: "msisdn",
      label: "MSISDN",
      visible: true,
      sortable: true,
    },
    {
        id: "customerType",
        label: "Value band",
      visible: true,
      sortable: true,
    },
    {
      id: "status",
      label: "Status",
      visible: true,
      sortable: true,
    },
    {
      id: "activationDate",
      label: "Activation Date",
      visible: true,
      sortable: true,
    },
    {
      id: "email",
      label: "Email",
      visible: true,
      sortable: true,
      render: (_, row) => row.email || "—",
    },
    {
      id: "tariff",
      label: "Tariff",
      visible: true,
      sortable: true,
      render: (_, row) => row.tariff || "—",
    },
    {
      id: "simType",
      label: "SIM Type",
      visible: true,
      sortable: true,
      render: (_, row) => row.simType || "—",
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
            onClick={() => navigate(`/dashboard/customers/details/${row.customerId}`)}
            className={`p-0 icon-edit ${tw.rounded} transition-colors`}
            title={t.common.viewDetails}
          >
            <Eye className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  const { columns: tableColumnsMemo, toggleColumn, reorderColumns, resetToDefaults } = useTable({
    tableId: "customer-reports-table",
    defaultColumns: tableColumns,
    defaultPageSize: tablePageSize,
  });

  const locationState = location.state as
    | { subscription?: CustomerSubscriptionRecord }
    | undefined;
  const subscriptionIdParam = searchParams.get("subscriptionId");

  const selectedSubscription = useMemo(() => {
    if (locationState?.subscription) {
      return locationState.subscription;
    }
    // Check if we have a customer fetched via API by subscription ID
    if (subscriptionIdParam && apiCustomers.length > 0) {
      return apiCustomers[0];
    }
    return undefined;
  }, [locationState, subscriptionIdParam, apiCustomers]);

  // Generate base customer rows and lookup with safe initialization
  const { baseCustomerRows, subscriptionLookup, referenceTime } =
    useMemo(() => {
      try {
        // TODO: Use customers from API when available instead of empty array
        // For now, use fallback data since customerSubscriptions hardcoded import is removed
        const excelCustomerRows: CustomerRow[] = [];

        const rows =
          excelCustomerRows.length > 0
            ? excelCustomerRows
            : fallbackCustomerRows;

        const lookup: Record<string, CustomerSubscriptionRecord> = {};

        return {
          baseCustomerRows: rows,
          subscriptionLookup: lookup,
          referenceTime: Date.now(),
        };
      } catch (error) {
        return {
          baseCustomerRows: fallbackCustomerRows,
          subscriptionLookup: {},
          referenceTime: Date.now(),
        };
      }
    }, []);

  // Subscriber detail. Real Data uses the portfolio customers endpoint.
  // Dummy Data keeps the subscriber directory so the table still has rows to browse.
  useEffect(() => {
    if (!useDummyData) return;
    const loadAllCustomersFromAPI = async () => {
      try {
        setIsLoadingCustomers(true);
        let allCustomers: CustomerSubscriptionRecord[] = [];
        let offset = 0;
        let hasMore = true;

        while (hasMore) {
          const response = await customerService.getAllCustomers({
            limit: 100,
            offset,
            skipCache: true,
          });

          if (
            response.success &&
            response.data &&
            Array.isArray(response.data)
          ) {
            const convertedCustomers = response.data.map((apiCustomer) => {
              const customerId =
                typeof apiCustomer.id === "string"
                  ? parseInt(apiCustomer.id, 10)
                  : apiCustomer.id;

              const subscriberId = apiCustomer.subscriber_id
                ? typeof apiCustomer.subscriber_id === "string"
                  ? parseInt(apiCustomer.subscriber_id, 10)
                  : apiCustomer.subscriber_id
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
                simType: apiCustomer.kyc_verified
                  ? "KYC Verified"
                  : "Not Verified",
                activationDate: apiCustomer.created_at,
              };
            });

            allCustomers = [...allCustomers, ...convertedCustomers];
            hasMore = response.pagination?.hasMore || false;
            offset += 100;
            if (offset >= 5000) hasMore = false;
          } else {
            hasMore = false;
          }
        }

        setApiCustomers(allCustomers);
      } catch (error) {
        showError("Failed to Load Customers", extractBackendError(error, "Failed to Load Customers. Please try again."));
      } finally {
        setIsLoadingCustomers(false);
      }
    };

    loadAllCustomersFromAPI();
  }, [showError, useDummyData]);

  useEffect(() => {
    if (useDummyData) return;
    let cancelled = false;
    const loadReportSubscribers = async () => {
      try {
        setIsLoadingCustomers(true);
        const response = await customerProfileReportsService.getCustomers({
          range: queryParams.range,
          grain: queryParams.grain,
          startDate: queryParams.startDate,
          endDate: queryParams.endDate,
          preset: queryParams.preset,
          page: 1,
          pageSize: 100,
          search: debouncedTableSearchTerm.trim() || undefined,
          sortBy: "clv",
          sortOrder: "desc",
        });
        if (cancelled) return;
        const rows = Array.isArray(response.data) ? response.data : [];
        setApiCustomers(
          rows.map((row) => {
            const id = Number(row.id);
            const record = row as Record<string, unknown>;
            return {
              customerId: Number.isFinite(id) ? id : 0,
              subscriptionId: Number.isFinite(id) ? id : 0,
              firstName: String(record.firstName || record.name || "Subscriber"),
              lastName: String(record.lastName || ""),
              msisdn: (record.msisdn as string | number | null) ?? null,
              email: (record.email as string | null) ?? null,
              customerType: String(record.valueBand || record.segment || "—"),
              tariff: String(record.preferredChannel || "—"),
              status: String(record.status || "active"),
              activationDate: (record.activationDate as string | null) ?? null,
            };
          }),
        );
        setSearchedApiCustomers([]);
      } catch (error) {
        if (cancelled) return;
        setApiCustomers([]);
        showError(
          "Failed to Load Subscribers",
          extractBackendError(error, "Failed to load subscriber report rows."),
        );
      } finally {
        if (!cancelled) setIsLoadingCustomers(false);
      }
    };
    loadReportSubscribers();
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
    debouncedTableSearchTerm,
    showError,
  ]);

  // Fetch specific customer by ID when subscriptionIdParam is provided
  useEffect(() => {
    if (subscriptionIdParam && !locationState?.subscription) {
      const fetchCustomerById = async () => {
        try {
          const customerId = parseInt(subscriptionIdParam, 10);
          const response = await customerService.getCustomerById(customerId);

          if (response.success && response.data) {
            const apiCustomer = response.data;
            const convertedCustomer: CustomerSubscriptionRecord = {
              customerId:
                typeof apiCustomer.subscriber_id === "string"
                  ? parseInt(apiCustomer.subscriber_id, 10)
                  : apiCustomer.subscriber_id || customerId,
              subscriptionId: customerId,
              firstName:
                apiCustomer.attributes?.first_name ||
                apiCustomer.first_name ||
                "Unknown",
              lastName:
                apiCustomer.attributes?.last_name ||
                apiCustomer.last_name ||
                "Customer",
              msisdn: apiCustomer.msisdn,
              email: apiCustomer.attributes?.email || apiCustomer.email,
              city: apiCustomer.attributes?.city,
              customerType: apiCustomer.attributes?.customer_tier || "prepaid",
              tariff: apiCustomer.attributes?.preferred_channel || "NORMAL_SMS",
              status:
                (apiCustomer.attributes as any)?.subscriber_status || "active",
              simType: (apiCustomer.attributes as any)?.kyc_verified
                ? "KYC Verified"
                : "Not Verified",
              activationDate: apiCustomer.created_at,
            };

            // Store in state so selectedSubscription can use it
            setApiCustomers([convertedCustomer]);
          }
        } catch (error) {
          console.error("Failed to fetch customer by ID:", error);
          showError("Customer Not Found", extractBackendError(error, "Customer Not Found. Please try again."));
        }
      };

      fetchCustomerById();
    }
  }, [subscriptionIdParam, locationState, showError]);

  // Customer search state
  const [customerSearchTerm, setCustomerSearchTerm] = useState<string>("");
  const [isSearchingCustomer, setIsSearchingCustomer] =
    useState<boolean>(false);
  const [customerError, setCustomerError] = useState<string | null>(null);

  const handleFilteredCountChange = (count: number) => {
    // Updates when filters applied in the Table component
  };

  // Use raw API customer data for table display (includes searched customers)
  const apiCustomerRows = useMemo(() => {
    const allCustomers =
      searchedApiCustomers.length > 0 ? searchedApiCustomers : apiCustomers;
    return allCustomers;
  }, [apiCustomers, searchedApiCustomers]);

  // Build subscription lookup from API customers (includes searched customers)
  const apiSubscriptionLookup = useMemo(() => {
    const lookup: Record<string, CustomerSubscriptionRecord> = {};
    const allCustomers =
      searchedApiCustomers.length > 0 ? searchedApiCustomers : apiCustomers;
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

  const handleCustomerSearch = async () => {
    if (!customerSearchTerm.trim()) {
      setCustomerError(t.customerProfileReports.enterCustomerInfo);
      return;
    }

    setIsSearchingCustomer(true);
    setCustomerError(null);

    try {
      const searchLower = customerSearchTerm.toLowerCase().trim();

      if (!useDummyData) {
        const response = await customerProfileReportsService.searchCustomers(
          customerSearchTerm.trim(),
        );
        const foundCustomer = response.data?.[0];
        if (!foundCustomer) {
          setCustomerError(t.customerProfileReports.customerNotFound);
          return;
        }
        navigate(
          `/dashboard/reports/customer-profiles/search?customerId=${foundCustomer.id}&source=reports`,
          {
            state: {
              customer: foundCustomer,
              searchTerm: customerSearchTerm,
              source: "reports" as const,
            },
          },
        );
        return;
      }

      const foundCustomer = baseCustomerRows.find((customer) => {
        return (
          customer.id.toLowerCase().includes(searchLower) ||
          customer.name.toLowerCase().includes(searchLower) ||
          customer.location.toLowerCase().includes(searchLower)
        );
      });

      if (!foundCustomer) {
        setCustomerError(t.customerProfileReports.customerNotFound);
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
        const response = await customerProfileReportsService.getPortfolio({
          range: queryParams.range || activeRangeKey,
          grain: queryParams.grain,
          startDate: queryParams.startDate,
          endDate: queryParams.endDate,
          preset: queryParams.preset,
          page: 1,
          pageSize: tablePageSize,
        });
        if (cancelled) return;
        const normalized = normalizeCustomerProfileReport(response);
        if (response.success && normalized) {
          setLiveReport(normalized);
        } else {
          setLiveReport(null);
          setLiveReportError(response.error || response.message || "Failed to load report");
        }
      } catch (error) {
        if (cancelled) return;
        setLiveReport(null);
        setLiveReportError(
          extractBackendError(error, "Failed to load Customer Profile Reports."),
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
    tablePageSize,
  ]);

  const valueMatrixSeries = useMemo(() => {
    const source = !useDummyData
      ? liveReport?.valueMatrix?.length
        ? liveReport.valueMatrix
        : baseValueMatrixData.map((point) => ({
            ...point,
            customers: 0,
            recency: 0,
            valueScore: 0,
          }))
      : baseValueMatrixData.map((point) => ({
          ...point,
          customers: Math.max(200, Math.round(point.customers * actualMultiplier)),
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
    return aggregateValueBands(source);
  }, [actualMultiplier, activeRangeKey, useDummyData, liveReport]);

  const lifecycleSeries = useMemo(() => {
    const window = {
      startDate: queryParams.startDate,
      endDate: queryParams.endDate,
      grain: queryParams.grain,
    };
    const template = (
      !useDummyData && liveReport?.lifecycleDistribution?.length
        ? liveReport.lifecycleDistribution
        : !useDummyData
          ? baseLifecycleData.map((point) => ({
              ...point,
              new: 0,
              active: 0,
              atRisk: 0,
              dormant: 0,
              churned: 0,
              reactivated: 0,
            }))
          : baseLifecycleData.map((point) => ({
              ...point,
              new: Math.round(point.new * actualMultiplier),
              active: Math.round(point.active * actualMultiplier),
              atRisk: Math.round(point.atRisk * actualMultiplier),
              dormant: Math.round(point.dormant * actualMultiplier),
              churned: Math.round(point.churned * actualMultiplier),
              reactivated: Math.round(point.reactivated * actualMultiplier),
            }))
    ).map((point) => ({ ...point, period: point.month }));
    return alignTrendSeries(template, window).map((point) => ({
      ...point,
      month: point.period,
    }));
  }, [
    actualMultiplier,
    useDummyData,
    liveReport,
    queryParams.startDate,
    queryParams.endDate,
    queryParams.grain,
  ]);

  const livePreviousLifecycle = usePreviousPeriodSeries<LifecyclePoint & { period: string }>({
    enabled: comparePreviousPeriod && !useDummyData,
    previousQueryParams,
    fetchSeries: async (params) => {
      const envelope = await customerProfileReportsService.getLifecycle({
        range: params.range || activeRangeKey,
        grain: params.grain,
        startDate: params.startDate,
        endDate: params.endDate,
        preset: params.preset,
      });
      return normalizeLifecyclePoints(
        pickNamedArray(envelope.data, ["lifecycleDistribution", "lifecycle"]),
      ).map((point) => ({
        ...point,
        period: point.month,
      }));
    },
  });

  const lifecycleComparison = useMemo(
    () =>
      resolveComparisonSeries({
        compare: comparePreviousPeriod,
        useDummyData,
        current: lifecycleSeries,
        livePrevious: livePreviousLifecycle,
        previousQueryParams,
        align: (rows, window) =>
          alignTrendSeries(rows, window).map((point) => ({
            ...point,
            month: point.period,
          })),
      }),
    [
      comparePreviousPeriod,
      lifecycleSeries,
      livePreviousLifecycle,
      previousQueryParams,
      useDummyData,
    ],
  );
  const previousComparisonLabel = formatPreviousComparisonLabel(
    comparePreviousPeriod,
    previousPeriodLabel,
  );

  const clvDistributionSeries = useMemo(() => {
    if (!useDummyData) {
      if (liveReport?.clvDistribution?.length) return liveReport.clvDistribution;
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
  }, [actualMultiplier, useDummyData, liveReport]);

  const cohortSeries = useMemo(() => {
    if (!useDummyData) {
      if (liveReport?.cohortRetention?.length) return liveReport.cohortRetention;
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
  }, [activeRangeKey, useDummyData, liveReport]);

  const cohortComparisonSeries = useMemo(() => {
    const months = Array.from(
      new Set(cohortSeries.map((entry) => entry.month)),
    ).sort((a, b) => a - b);

    const cohorts = Array.from(
      new Set(cohortSeries.map((entry) => entry.cohort)),
    );

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

  const cohortChartKeys = useMemo(() => {
    const first = cohortComparisonSeries[0];
    if (!first) return ["Jan", "Apr", "Jul"];
    return Object.keys(first).filter((key) => key !== "month");
  }, [cohortComparisonSeries]);

  const cohortChartColors = [
    colors.reportCharts.customerProfile.cohortRetention.jan,
    colors.reportCharts.customerProfile.cohortRetention.apr,
    colors.reportCharts.customerProfile.cohortRetention.jul,
  ];

  // Fetch customers for table: Use API search when search term provided, otherwise use loaded customers
  useEffect(() => {
    const loadTableCustomers = async () => {
      if (!useDummyData) {
        setSearchedApiCustomers([]);
        return;
      }
      if (!debouncedTableSearchTerm.trim()) {
        setSearchedApiCustomers(apiCustomers);
        return;
      }

      try {
        setIsSearchingTable(true);
        const response = await customerService.searchCustomers({
          msisdn: debouncedTableSearchTerm,
          limit: 100,
          offset: 0,
        });

        if (response.success && response.data && Array.isArray(response.data)) {
          const convertedCustomers = response.data.map((apiCustomer) => {
            const customerId =
              typeof apiCustomer.id === "string"
                ? parseInt(apiCustomer.id, 10)
                : apiCustomer.id;

            const subscriberId = apiCustomer.subscriber_id
              ? typeof apiCustomer.subscriber_id === "string"
                ? parseInt(apiCustomer.subscriber_id, 10)
                : apiCustomer.subscriber_id
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
              simType: apiCustomer.kyc_verified
                ? "KYC Verified"
                : "Not Verified",
              activationDate: apiCustomer.created_at,
            };
          });
          setSearchedApiCustomers(convertedCustomers);
        }
      } catch (error) {
        setSearchedApiCustomers([]);
      } finally {
        setIsSearchingTable(false);
      }
    };

    loadTableCustomers();
  }, [debouncedTableSearchTerm, useDummyData]);

  const tableCustomers = useMemo(() => {
    return searchedApiCustomers.length > 0
      ? searchedApiCustomers
      : apiCustomers;
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
    appliedCustomRange,
    customDays,
    activeRangeKey,
    baseCustomerRows,
    referenceTime,
  ]);

  useEffect(() => {
    setTablePage((prev) => {
      const maxPage = Math.max(
        1,
        Math.ceil(tableCustomers.length / tablePageSize),
      );
      return Math.min(prev, maxPage);
    });
  }, [tableCustomers.length]);

  const csvHeaders = [
    "Customer ID",
    "Subscription ID",
    "Name",
    "MSISDN",
    "Customer Type",
    "Tariff",
    "SIM Type",
    "Status",
    "Activation Date",
    "City",
    "Email",
  ];

  const csvRows = tableCustomers.map((subscription) => {
    return [
      subscription.customerId ?? "",
      subscription.subscriptionId ?? "",
      `${subscription.firstName} ${subscription.lastName}`,
      subscription.msisdn ?? "",
      subscription.customerType ?? "",
      subscription.tariff ?? "",
      subscription.simType ?? "",
      subscription.status ?? "",
      subscription.activationDate
        ? formatDate(subscription.activationDate)
        : "",
      subscription.city ?? "",
      subscription.email ?? "",
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
          <div className="flex-1">
            <SearchInput
              value={customerSearchTerm}
              onChange={(value) => setCustomerSearchTerm(value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleCustomerSearch();
                }
              }}
              placeholder={t.customerProfileReports.searchPlaceholder}
            />
          </div>
          <button
            type="button"
            onClick={handleCustomerSearch}
            disabled={isSearchingCustomer}
            className={`px-4 py-2 text-sm font-semibold text-white ${tw.rounded} hover:opacity-95 transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
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

        <ReportTrendsToolbar
          timeWindow={timeWindow}
          extraActions={
            <div className="flex items-center gap-2">
              <label
                htmlFor="customer-data-toggle"
                className="text-sm font-medium text-gray-700 whitespace-nowrap"
              >
                Data Mode:
              </label>
              <button
                id="customer-data-toggle"
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
          }
        />
        {liveReportError && !useDummyData && (
          <p className="text-sm text-red-600">{liveReportError}</p>
        )}
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

      {!isTrendsView && (
        <CustomerProfileKpiGrid
          hero={liveReport?.heroMetrics}
          heroTrends={liveReport?.heroTrends}
          valueMatrix={valueMatrixSeries}
          useDummyData={useDummyData}
          rangeKey={activeRangeKey}
          multiplier={actualMultiplier}
          churnInactivityDays={liveReport?.meta?.churnInactivityDays}
        />
      )}


      {!isTrendsView && (
      <section className="grid gap-6 lg:grid-cols-2">
        <SwitchableReportChart
          title={t.customerProfileReports.customerValueMatrix}
          subtitle={t.customerProfileReports.valueMatrixDescription}
          filename="customer-value-matrix.csv"
          audit={overviewAudit}
          columns={[
            { key: "segment", label: "Segment" },
            { key: "customers", label: t.customerProfileReports.customers },
          ]}
          rows={valueMatrixSeries}
          xKey="segment"
          yLabel={t.customerProfileReports.customers}
          yTickFormatter={(value) => value.toLocaleString("en-US")}
          series={[
            {
              dataKey: "customers",
              name: t.customerProfileReports.customers,
              color: colors.reportCharts.customerProfile.valueMatrix.customers,
            },
          ]}
        />

        <SwitchableReportChart
          title={t.customerProfileReports.customerLifetimeValueDistribution}
          subtitle={t.customerProfileReports.clvDistributionDescription}
          filename="customer-clv-distribution.csv"
          audit={overviewAudit}
          columns={[
            { key: "range", label: "Range" },
            { key: "customers", label: t.customerProfileReports.customers },
            { key: "revenueShare", label: t.customerProfileReports.revenueShare },
          ]}
          rows={clvDistributionSeries}
          xKey="range"
          yLabel={t.customerProfileReports.customers}
          yTickFormatter={(value) => `${value / 1000}k`}
          rightYLabel={t.customerProfileReports.revenueShare}
          rightTickFormatter={(value) => `${value}%`}
          series={[
            {
              dataKey: "customers",
              name: t.customerProfileReports.customers,
              color: colors.reportCharts.customerProfile.clvDistribution.customers,
              valueFormatter: (value) => value.toLocaleString("en-US"),
            },
            {
              dataKey: "revenueShare",
              name: t.customerProfileReports.revenueShare,
              color: colors.reportCharts.customerProfile.clvDistribution.revenueShare,
              axis: "right",
              valueFormatter: (value) => `${value}%`,
            },
          ]}
        />
      </section>
      )}

      {isTrendsView && (
      <section className="space-y-6">
        <SwitchableReportChart
          title={t.customerProfileReports.lifecycleDistribution}
          subtitle={t.customerProfileReports.lifecycleDescription}
          filename="customer-lifecycle-distribution.csv"
          audit={chartAudit}
          columns={[
            { key: "month", label: "Month" },
            { key: "date", label: "Date" },
            { key: "active", label: t.customerProfileReports.active },
            { key: "new", label: t.customerProfileReports.new },
            { key: "reactivated", label: t.customerProfileReports.reactivated },
            { key: "atRisk", label: t.customerProfileReports.atRisk },
            { key: "dormant", label: t.customerProfileReports.dormant },
            { key: "churned", label: t.customerProfileReports.churned },
          ]}
          rows={lifecycleSeries}
          xKey="month"
          yLabel={`${t.customerProfileReports.customers} (000s)`}
          yTickFormatter={(value) => `${value}k`}
          comparisonData={lifecycleComparison}
          comparisonLabel={previousComparisonLabel}
          series={[
            {
              dataKey: "active",
              name: t.customerProfileReports.active,
              color: colors.reportCharts.customerProfile.lifecycleDistribution.active,
            },
            {
              dataKey: "new",
              name: t.customerProfileReports.new,
              color: colors.reportCharts.customerProfile.lifecycleDistribution.new,
            },
            {
              dataKey: "reactivated",
              name: t.customerProfileReports.reactivated,
              color: colors.reportCharts.customerProfile.lifecycleDistribution.reactivated,
            },
            {
              dataKey: "atRisk",
              name: t.customerProfileReports.atRisk,
              color: colors.reportCharts.customerProfile.lifecycleDistribution.atRisk,
            },
            {
              dataKey: "dormant",
              name: t.customerProfileReports.dormant,
              color: colors.reportCharts.customerProfile.lifecycleDistribution.dormant,
            },
            {
              dataKey: "churned",
              name: t.customerProfileReports.churned,
              color: colors.reportCharts.customerProfile.lifecycleDistribution.churned,
            },
          ]}
        />
        <SwitchableReportChart
          title={t.customerProfileReports.cohortRetentionComparison}
          subtitle={t.customerProfileReports.cohortDescription}
          filename="customer-cohort-retention.csv"
          audit={chartAudit}
          chartClassName="h-96"
          columns={[
            { key: "month", label: t.customerProfileReports.monthsSinceAcquisition },
            ...cohortChartKeys.map((key) => ({ key, label: key })),
          ]}
          rows={cohortComparisonSeries}
          xKey="month"
          yLabel={t.customerProfileReports.retentionPercent}
          yTickFormatter={(value) => `${value}%`}
          valueFormatter={(value) => `${value}%`}
          series={cohortChartKeys.map((cohortKey, index) => ({
            dataKey: cohortKey,
            name: cohortKey,
            color: cohortChartColors[index % cohortChartColors.length],
          }))}
        />
      </section>
      )}

      {!isTrendsView && (
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
            <div className="flex-1 md:flex-none md:w-64">
              <SearchInput
                value={tableSearchTerm}
                onChange={(value) => {
                  setTableSearchTerm(value);
                }}
                placeholder="Search by name, email, or MSISDN..."
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
          <>
            <Table<CustomerRow>
              columns={tableColumnsMemo}
              data={apiCustomerRows}
              totalItems={apiCustomerRows.length}
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
            {apiCustomerRows.length > 0 && (
              <Pagination
                currentPage={tablePage}
                pageSize={tablePageSize}
                totalItems={apiCustomerRows.length}
                onPageChange={setTablePage}
                onPageSizeChange={(size) => {
                  setTablePageSize(size);
                  setTablePage(1);
                }}
              />
            )}
            {!tableCustomers.length && (
              <div className="px-6 py-10 text-center text-sm text-gray-500">
                {t.customerProfileReports.noCustomersMatchFilters}
              </div>
            )}
          </>
        )}
      </section>
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
