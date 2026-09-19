import { useMemo, useState, useEffect, useCallback } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Send, Edit, Trash2, Eye } from "lucide-react";
import {
  BarChart,
  Bar,
  // PieChart,
  // Pie,
  // Cell,
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  // LineChart,
  // Line,
  // Legend,
} from "recharts";
import { colors, buttons } from "../../../shared/utils/tokens";
import { color, tw } from "../../../shared/utils/utils";
import BackButton from "../../../shared/components/ui/BackButton";
import SearchInput from "../../../shared/components/ui/SearchInput";
import CustomerEventsTab from "../components/CustomerEventsTab";
import CustomerSubscribedListsTab from "../components/CustomerSubscribedListsTab";
import CustomerAudiencePanel from "../components/CustomerAudiencePanel";
import CustomerOffersTab from "../components/CustomerOffersTab";
import CustomerCommunicationsTab from "../components/CustomerCommunicationsTab";
import CustomerPurchasesTab from "../components/CustomerPurchasesTab";
import CustomerLoyaltyTab from "../components/CustomerLoyaltyTab";
import CustomerPreferencesTab from "../components/CustomerPreferencesTab";
import CustomerInteractionsTab from "../components/CustomerInteractionsTab";
import CustomerAccountDevicesTab from "../components/CustomerAccountDevicesTab";
import CustomerProfileTabs from "../components/CustomerProfileTabs";
import {
  CUSTOMER_PROFILE_TAB_IDS,
  CUSTOMER_PROFILE_TAB_PANEL_ID,
  parseCustomerProfileTab,
  type CustomerProfileTabId,
} from "../constants/customerProfileTabs";
import {
  CUSTOMER_PROFILE_OVERVIEW_TAB,
  CUSTOMER_PROFILE_TAB_PARAM,
  CustomerProfileNavigationProvider,
} from "../navigation/CustomerProfileEntityLink";
import Pagination, { DEFAULT_PAGE_SIZE } from "../../../shared/components/ui/Pagination";
import LoadingSpinner from "../../../shared/components/ui/LoadingSpinner";
import DateFormatter from "../../../shared/components/DateFormatter";
import { PermissionGate } from "../../auth/components/PermissionGate";
import { useLanguage } from "../../../contexts/LanguageContext";
import { extractBackendError } from "../../../shared/utils/errorHandler";
import { consumePendingCustomerReturn } from "../../../shared/utils/navigation";
import { useToast } from "../../../contexts/ToastContext";
import DeleteConfirmModal from "../../../shared/components/ui/DeleteConfirmModal";
import CreateCommunicationModal from "../../../shared/components/CreateCommunicationModal";
import EditCustomerModal from "../components/EditCustomerModal";
import type { CustomerSubscriptionRecord } from "../types/customerSubscription";
import type { CustomerDetail } from "../types/customer";
import {
  convertSubscriptionToCustomerRow,
  formatDateTime,
  formatMsisdn,
  type CustomerRow,
} from "../utils/customerSubscriptionHelpers";
import type { CustomerSearchResultsResponse } from "../../reports-analytics/types/ReportsAPI";
import { customerService } from "../services/customerServices";
import { customerCommunicationService } from "../services/customerCommunicationService";
import { revenueMetricService } from "../../kpis/services/revenueMetricService";
import type { RevenueMetric } from "../../kpis/types/revenueMetrics";
import { useDeleteConfirm } from "../../../shared/hooks/useDeleteConfirm";
import { Table, useTable, type TableColumn } from "../../../shared/components/Table";
import { ColumnPickerModal } from "../../../shared/components/ColumnPickerModal";

// Extract types from API response
type CustomerEvent = CustomerSearchResultsResponse["events"][number];
type OriginSource = "customers" | "reports";

// Custom Tooltip Component
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

// Using shared customer data from customerDataService - will be generated in component

const generateCustomerRelatedData = (customer: CustomerRow) => {
  // Convert customer ID to string safely for use in IDs
  const customerId =
    typeof customer.id === "string"
      ? customer.id
      : (customer.id || "0").toString();

  const events: CustomerEvent[] = [];
  const interactionDate = new Date(customer.lastInteractionDate);
  if (!isNaN(interactionDate.getTime())) {
    const baseDate = new Date(interactionDate);
    for (let i = 0; i < 15; i++) {
      const eventDate = new Date(baseDate);
      eventDate.setDate(eventDate.getDate() - i * 7);
      const channelIndex = i % 3;
      const channelType =
        channelIndex === 0 ? "email" : channelIndex === 1 ? "sms" : "push";

      if (channelType === "email") {
        const emailTitles = [
          "Welcome Email",
          "Newsletter",
          "Promotional Email",
          "Order Confirmation",
          "Shipping Update",
        ];
        const emailDescriptions = [
          "Welcome to our community",
          "Monthly updates and news",
          "Special offers just for you",
          "Your order has been confirmed",
          "Your order is on the way",
        ];
        const emailStatuses = [
          "Opened",
          "Clicked",
          "Opened",
          "Delivered",
          "Opened",
        ];

        events.push({
          id: `EVT-${customerId.slice(-3)}-E${i}`,
          type: "email",
          title: emailTitles[i % emailTitles.length],
          description: emailDescriptions[i % emailDescriptions.length],
          date: eventDate.toISOString(),
          status: emailStatuses[i % emailStatuses.length],
        });
      } else if (channelType === "sms") {
        const smsTitles = [
          "Transaction Update",
          "Promotional SMS",
          "Order Alert",
          "Payment Reminder",
          "Delivery Notification",
        ];
        const smsDescriptions = [
          "Your transaction has been processed",
          "Flash sale - 24 hours only",
          "Your order is ready",
          "Payment due soon",
          "Package delivered",
        ];
        const smsStatuses = ["Delivered", "Read", "Delivered", "Sent", "Read"];

        events.push({
          id: `EVT-${customerId.slice(-3)}-S${i}`,
          type: "sms",
          title: smsTitles[i % smsTitles.length],
          description: smsDescriptions[i % smsDescriptions.length],
          date: eventDate.toISOString(),
          status: smsStatuses[i % smsStatuses.length],
        });
      } else if (channelType === "push") {
        const pushTitles = [
          "New Products",
          "Cart Reminder",
          "Price Drop Alert",
          "New Arrivals",
          "Special Offer",
        ];
        const pushDescriptions = [
          "Check out our latest arrivals",
          "Items waiting in your cart",
          "Price reduced on favorites",
          "New collection available",
          "Limited time offer",
        ];
        const pushStatuses = ["Sent", "Opened", "Sent", "Opened", "Sent"];

        events.push({
          id: `EVT-${customerId.slice(-3)}-P${i}`,
          type: "push",
          title: pushTitles[i % pushTitles.length],
          description: pushDescriptions[i % pushDescriptions.length],
          date: eventDate.toISOString(),
          status: pushStatuses[i % pushStatuses.length],
        });
      }
    }
  }

  return { events };
};

export default function CustomerDetailPage() {
  const navigate = useNavigate();
  const { customerId: customerIdFromParams } = useParams<{
    customerId: string;
  }>();
  const [searchParams, setSearchParams] = useSearchParams();

  const [origin, setOrigin] = useState<OriginSource>("customers");
  const [isLoading, setIsLoading] = useState(true);

  const [selectedCustomer, setSelectedCustomer] = useState<
    CustomerRow | undefined
  >();
  const [selectedSubscription, setSelectedSubscription] = useState<
    Record<string, any> | undefined
  >();

  // Fetch full customer details from API when customerId is available
  useEffect(() => {
    const fetchCustomerDetails = async () => {
      if (!customerIdFromParams) return;

      setIsLoading(true);
      try {
        const customerId = parseInt(customerIdFromParams, 10);
        if (!isNaN(customerId)) {
          const response = await customerService.getCustomerById(customerId);
          if (response.success && response.data) {
            // Convert API response to CustomerSubscriptionRecord format
            const apiData = response.data;
            const convertedSubscription: CustomerSubscriptionRecord = {
              customerId: apiData.customer_id || customerId,
              subscriptionId: apiData.subscription_id || customerId,
              amdocsSubsId: apiData.amdocs_subs_id,
              firstName: apiData.first_name || "Unknown",
              last_name: apiData.last_name || "Customer",
              first_name: apiData.first_name || "Unknown",
              lastName: apiData.last_name || "Customer",
              msisdn: apiData.msisdn,
              email: apiData.email_address || apiData.email,
              email_address: apiData.email_address,
              iccid: apiData.iccid,
              imsi: apiData.imsi,
              alternatemsisdns: apiData.alternate_msisdns,
              alternate_msisdns: apiData.alternate_msisdns,
              activationDate: apiData.activation_date || apiData.created_at,
              activation_date: apiData.activation_date || apiData.created_at,
              bankingServices: apiData.banking_services,
              banking_services: apiData.banking_services,
              simType: apiData.sim_type,
              sim_type: apiData.sim_type,
              status: apiData.status,
              sms: apiData.sms,
              dataServices: apiData.data_services,
              data_services: apiData.data_services,
              limitOutOfBundleData: apiData.limit_out_of_bundle_data,
              limit_out_of_bundle_data: apiData.limit_out_of_bundle_data,
              limitOutOfBundleVoice: apiData.limit_out_of_bundle_voice,
              limit_out_of_bundle_voice: apiData.limit_out_of_bundle_voice,
              limitOutOfBundleSms: apiData.limit_out_of_bundle_sms,
              limit_out_of_bundle_sms: apiData.limit_out_of_bundle_sms,
              birthDate: apiData.birth_date,
              birth_date: apiData.birth_date,
              gender: apiData.gender,
              alternateEmail: apiData.alternate_email,
              alternate_email: apiData.alternate_email,
              birthPlaceOther: apiData.birth_place_other,
              birth_place_other: apiData.birth_place_other,
              preferredLanguage: apiData.preferred_language,
              preferred_language: apiData.preferred_language,
              languagePreference: apiData.preferred_language,
              city: apiData.city,
              region: apiData.region,
              postalCode: apiData.postal_code,
              postal_code: apiData.postal_code,
              countryCode: apiData.country_code,
              country_code: apiData.country_code,
              physicalAddress: apiData.physical_address,
              physical_address: apiData.physical_address,
              customerType: apiData.customer_type,
              customer_type: apiData.customer_type,
              customerTier: apiData.customer_tier,
              customer_tier: apiData.customer_tier,
              preferredChannel: apiData.preferred_channel,
              preferred_channel: apiData.preferred_channel,
              timezone: apiData.timezone,
              branchCode: apiData.branch_code,
              branch_code: apiData.branch_code,
              customerCountyId: apiData.customer_county_id,
              customer_county_id: apiData.customer_county_id,
              building: apiData.building,
              road: apiData.road,
              estate: apiData.estate,
              ward: apiData.ward,
              tariff: apiData.tariff,
              segments: apiData.segments,
              offers: apiData.offers,
              quicklists: apiData.quicklists,
              campaigns: apiData.campaigns,
              communication_channels: apiData.communication_channels,
              notifications: apiData.notifications,
              id: apiData.id,
              updated_at: apiData.updated_at,
              created_at: apiData.created_at,
              last_login: (apiData as { last_login?: string | null }).last_login,
              is_active: (apiData as { is_active?: boolean | null }).is_active,
              subscriber_status:
                (apiData as { subscriber_status?: string | null }).subscriber_status ??
                apiData.status,
              kyc_verified: (apiData as { kyc_verified?: boolean | null }).kyc_verified,
              email_verified: (apiData as { email_verified?: boolean | null })
                .email_verified,
              phone_verified: (apiData as { phone_verified?: boolean | null })
                .phone_verified,
              device_type:
                (apiData as { device_type?: string | null }).device_type ??
                apiData.attributes?.device_type,
            };

            setSelectedSubscription(convertedSubscription);

            // Also derive and set the customer from the subscription
            const derivedCustomer = convertSubscriptionToCustomerRow(
              convertedSubscription,
            );
            setSelectedCustomer(derivedCustomer);
          }
        }
      } catch (error) {
        // Error handled silently
      } finally {
        setIsLoading(false);
      }
    };

    fetchCustomerDetails();
  }, [customerIdFromParams]);

  const customer = selectedCustomer;

  const activeTab = parseCustomerProfileTab(
    searchParams.get(CUSTOMER_PROFILE_TAB_PARAM),
  );

  const setActiveTab = useCallback(
    (tab: CustomerProfileTabId) => {
      setSearchParams(
        (current) => {
          const next = new URLSearchParams(current);
          if (tab === CUSTOMER_PROFILE_OVERVIEW_TAB) {
            next.delete(CUSTOMER_PROFILE_TAB_PARAM);
          } else {
            next.set(CUSTOMER_PROFILE_TAB_PARAM, tab);
          }
          return next;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  useEffect(() => {
    if (!customerIdFromParams) return;
    const pending = consumePendingCustomerReturn(customerIdFromParams);
    if (!pending?.tab) return;
    if (searchParams.get(CUSTOMER_PROFILE_TAB_PARAM)) return;
    if (CUSTOMER_PROFILE_TAB_IDS.has(pending.tab as CustomerProfileTabId)) {
      setActiveTab(pending.tab as CustomerProfileTabId);
    }
    // Restore only when landing back on this customer without a tab in the URL.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customerIdFromParams]);

  const profileCustomerId =
    selectedSubscription?.customerId ??
    selectedSubscription?.id ??
    customerIdFromParams;

  const [editingCustomer, setEditingCustomer] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isCommunicateModalOpen, setIsCommunicateModalOpen] = useState(false);
  const [communicationRefreshToken, setCommunicationRefreshToken] = useState(0);
  const [kpiSearchTerm, setKpiSearchTerm] = useState<string>("");
  const [expandedKpi, setExpandedKpi] = useState<string | null>(null);
  const [showKpiColumnPicker, setShowKpiColumnPicker] = useState(false);
  const { t } = useLanguage();
  const { success: showSuccess, error: showError } = useToast();

  // KPI Data Structure
  type KpiData = {
    id: string;
    name: string;
    category: string;
    value: string | number;
    type?: string;
    unit?: string;
    description: string;
    trend?: "up" | "down" | "neutral";
    trendPercent?: number;
    detailedInfo: string | React.ReactNode;
    defaultValue?: string | number;
    field_type?: string;
    created?: string;
    lastUpdated?: string;
    firstRecorded?: string;
    firstRecordedValue?: string | number;
  };

  const [revenueMetrics, setRevenueMetrics] = useState<RevenueMetric[]>([]);
  const [isLoadingMetrics, setIsLoadingMetrics] = useState(false);

  useEffect(() => {
    const loadRevenueMetrics = async () => {
      setIsLoadingMetrics(true);
      try {
        const metrics = await revenueMetricService.getAllMetrics();
        setRevenueMetrics(metrics);
      } catch (err) {
        // Error handled silently
      } finally {
        setIsLoadingMetrics(false);
      }
    };
    loadRevenueMetrics();
  }, []);

  const defaultKpiColumns: TableColumn<any>[] = [
    {
      id: "name",
      label: "KPI Name",
      visible: true,
      sortable: true,
      filterConfig: { type: 'text' },
    },
    {
      id: "category",
      label: "Category",
      visible: true,
      sortable: true,
      filterConfig: { type: 'text' },
    },
    {
      id: "type",
      label: "Type",
      visible: true,
      sortable: true,
      filterConfig: { type: 'text' },

    },
    {
      id: "value",
      label: "Current Value",
      visible: true,
      sortable: true,
      filterConfig: { type: 'text' },

    },
    {
      id: "firstRecordedValue",
      label: "First Recorded Value",
      visible: true,
      sortable: true,
      filterConfig: { type: 'text' },

    },
    {
      id: "defaultValue",
      label: "Default Value",
      visible: true,
      sortable: true,
      filterConfig: { type: 'text' },

    },
    {
      id: "lastUpdated",
      label: "Last Updated",
      visible: true,
      sortable: true,
      filterConfig: { type: 'text' },

    },
    {
      id: "created",
      label: "Created",
      visible: true,
      sortable: true,
      filterConfig: { type: 'text' },

    },
    {
      id: "action",
      label: "Action",
      visible: true,
      sortable: false,
      render: (_, row) => (
        <button
          onClick={() =>
            navigate(
              `/dashboard/kpis/revenue-metrics/${row.id}`,
              { state: { parentLabel: "Customer Profile" } }
            )
          }
          className="inline-flex items-center justify-center h-8 w-8 rounded-md hover:bg-gray-200 text-gray-600 hover:text-gray-900 transition-colors"
          title="View details"
        >
          <Eye className="h-4 w-4" />
        </button>
      ),
    },
  ];

  const {
    columns: kpiColumns,
    toggleColumn: toggleKpiColumn,
    reorderColumns: reorderKpiColumns,
    resetToDefaults: resetKpiDefaults,
  } = useTable({
    tableId: "customer-kpi-table",
    defaultColumns: defaultKpiColumns,
    defaultPageSize: DEFAULT_PAGE_SIZE,
    persistToLocalStorage: true,
  });

  const generateKpiData = (): KpiData[] => {
    const createdDate = selectedSubscription?.created_at
      ? new Date(selectedSubscription.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
      : "—";

    const lastUpdatedDate = selectedSubscription?.updated_at
      ? new Date(selectedSubscription.updated_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
      : "—";

    const firstRecordedDate = selectedSubscription?.created_at
      ? new Date(new Date(selectedSubscription.created_at).getTime() + (7 * 24 * 60 * 60 * 1000)).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
      : "—";

    const kpiData = revenueMetrics.map((metric) => {
      const currentValue = 0;
      const previousValue = 0;

      const kpiCreatedDate = metric.created_at
        ? new Date(metric.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
        : "—";

      const kpiFirstRecordedDate = metric.created_at
        ? new Date(new Date(metric.created_at).getTime() + (7 * 24 * 60 * 60 * 1000)).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
        : "—";

      return {
        id: String(metric.id),
        name: metric.name,
        category: "Revenue",
        value: currentValue,
        type: metric.field_type,
        unit: metric.unit,
        description: metric.description,
        defaultValue: metric.default_value ?? "-",
        field_type: metric.field_type,
        created: kpiCreatedDate,
        lastUpdated: lastUpdatedDate,
        firstRecorded: kpiFirstRecordedDate,
        firstRecordedValue: previousValue,
        detailedInfo: (
          <div className="space-y-3">
            <p className="text-sm text-gray-900">{metric.description}</p>
            <div>
              <p className="text-xs font-semibold text-gray-700 mb-1">Details:</p>
              <ul className="text-sm text-gray-900 space-y-1 list-disc list-inside">
                <li>Category: {metric.category}</li>
                <li>Data Source: {metric.data_source}</li>
                <li>Frequency: {metric.frequency}</li>
                <li>Source Table: {metric.source_table}</li>
              </ul>
            </div>
          </div>
        ),
      };
    });

    return kpiData;

    return kpiData;
  };

  const kpiList = generateKpiData();

  const filteredKpis = kpiList.filter((kpi) =>
    kpi.name.toLowerCase().includes(kpiSearchTerm.toLowerCase()) ||
    kpi.category.toLowerCase().includes(kpiSearchTerm.toLowerCase())
  );

  // Pagination states for the tables
  const [kpiPage, setKpiPage] = useState(1);
  const pageSize = 20;

  useEffect(() => {
    setKpiPage(1);
  }, [customerIdFromParams]);

  // Reset KPI pagination when search changes
  useEffect(() => {
    setKpiPage(1);
  }, [kpiSearchTerm]);

  const { events } = useMemo(() => {
    if (!selectedSubscription)
      return {
        events: [],
      };

    const dummyData = customer
      ? generateCustomerRelatedData(customer)
      : { events: [] };

    return {
      events: dummyData.events,
    };
  }, [selectedSubscription, customer]);

  const paginatedKpis = useMemo(() => {
    const startIdx = (kpiPage - 1) * pageSize;
    return filteredKpis.slice(startIdx, startIdx + pageSize);
  }, [filteredKpis, kpiPage]);

  const eventDistributionData = useMemo(() => {
    const distribution: Record<string, number> = {};
    events.forEach((event) => {
      distribution[event.type] = (distribution[event.type] || 0) + 1;
    });
    return Object.entries(distribution).map(([type, count]) => ({
      name: type.charAt(0).toUpperCase() + type.slice(1),
      value: count,
    }));
  }, [events]);

  const activityTimelineData = useMemo(() => {
    const monthlyActivity: Record<string, number> = {};
    events.forEach((event) => {
      const date = new Date(event.date);
      const monthKey = date.toLocaleString("default", {
        month: "short",
        year: "numeric",
      });
      monthlyActivity[monthKey] = (monthlyActivity[monthKey] || 0) + 1;
    });
    return Object.entries(monthlyActivity).map(([month, count]) => ({
      month,
      events: count,
    }));
  }, [events]);

  const statusDistributionData = useMemo(() => {
    const distribution: Record<string, number> = {};
    events.forEach((event) => {
      distribution[event.status] = (distribution[event.status] || 0) + 1;
    });
    return Object.entries(distribution).map(([status, count]) => ({
      name: status,
      value: count,
    }));
  }, [events]);

  const engagementByChannelData = useMemo(() => {
    const channelStats: Record<string, { total: number; engaged: number }> = {
      email: { total: 0, engaged: 0 },
      sms: { total: 0, engaged: 0 },
      push: { total: 0, engaged: 0 },
    };

    events.forEach((event) => {
      const channel = (event.type || "").toLowerCase();
      if (channelStats[channel]) {
        channelStats[channel].total++;
        // Count engaged events (opened, clicked, read)
        if (
          ["opened", "clicked", "read"].includes(
            (event.status || "").toLowerCase(),
          )
        ) {
          channelStats[channel].engaged++;
        }
      }
    });

    return Object.entries(channelStats).map(([channel, stats]) => ({
      name: channel.charAt(0).toUpperCase() + channel.slice(1),
      total: stats.total,
      engaged: stats.engaged,
      engagementRate:
        stats.total > 0 ? Math.round((stats.engaged / stats.total) * 100) : 0,
    }));
  }, [events]);

  const email =
    selectedSubscription?.email_address || selectedSubscription?.email || customer?.email;
  const phone = formatMsisdn(
    selectedSubscription?.msisdn ?? customer?.phone ?? null,
  );

  const overviewSections = useMemo(() => {
    if (!customer) {
      return [];
    }

    if (selectedSubscription) {
      return [
        {
          title: "Identity",
          items: [
            { label: "Customer ID", value: customer.id },
            {
              label: "First Name",
              value: selectedSubscription.first_name ?? "—",
            },
            {
              label: "Last Name",
              value: selectedSubscription.last_name ?? "—",
            },
            {
              label: "Gender",
              value: selectedSubscription.gender ?? "—",
            },
            {
              label: "Date of Birth",
              value: selectedSubscription.birth_date
                ? <DateFormatter date={selectedSubscription.birth_date} useUserTimezone useLocale year="numeric" month="short" day="numeric" />
                : "—",
            },
          ],
        },
        {
          title: "Contact Information",
          items: [
            {
              label: "MSISDN",
              value: formatMsisdn(selectedSubscription.msisdn),
            },
            {
              label: "Alternate MSISDN",
              value: Array.isArray(selectedSubscription.alternate_msisdns)
                ? selectedSubscription.alternate_msisdns.join(", ")
                : (selectedSubscription.alternate_msisdns ?? "—"),
            },
            { label: "Email", value: selectedSubscription.email_address ?? selectedSubscription.email ?? email ?? "—" },
            {
              label: "Alternate Email",
              value: selectedSubscription.alternate_email ?? "—",
            },
            {
              label: "Preferred Language",
              value: selectedSubscription.language_preference ?? "—",
            },
            {
              label: "Preferred Channel",
              value: selectedSubscription.preferred_channel ?? "—",
            },
          ],
        },
        {
          title: "Address Information",
          items: [
            { label: "City", value: selectedSubscription.city ?? "—" },
            { label: "Region", value: selectedSubscription.region ?? "—" },
            {
              label: "Postal Code",
              value: selectedSubscription.postal_code ?? "—",
            },
            {
              label: "Country",
              value: selectedSubscription.country_code ?? "—",
            },
            {
              label: "Physical Address",
              value: selectedSubscription.physical_address ?? "—",
            },
          ],
        },
        {
          title: "Account Details",
          items: [
            {
              label: "Customer Tier",
              value: selectedSubscription.customer_tier ?? "—",
            },
            {
              label: "Timezone",
              value: selectedSubscription.timezone ?? "—",
            },
            {
              label: "Activation Date",
              value: formatDateTime(selectedSubscription.created_at),
            },
            { label: "ICCID", value: selectedSubscription.iccid ?? "—" },
            { label: "IMSI", value: selectedSubscription.imsi ?? "—" },
          ],
        },
      ];
    }

    return [];
  }, [selectedSubscription, customer, email, phone]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <LoadingSpinner variant="modern" size="xl" color="primary" />
        <p className="mt-4 text-sm text-black">Loading customer profile...</p>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="space-y-4">
        <div
          className={`${tw.rounded} border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-900`}
        >
          {origin === "reports"
            ? "We couldn't load that customer profile. Please return to Customer Reports and run your search again."
            : "We couldn't load that customer profile. Please return to the Customers list and select a profile to view its insights."}
        </div>
      </div>
    );
  }

  const handleDeleteCustomer = async () => {
    if (!selectedSubscription) return;

    setIsDeleting(true);
    try {
      await customerService.deleteCustomer(selectedSubscription.customer_id);
      showSuccess("Success", "Customer deleted successfully");
      setDeleteConfirmOpen(false);
      navigate("/dashboard/customers", { replace: true });
    } catch (err) {
      showError("Error", "Failed to delete customer");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCustomerUpdated = (
    updatedCustomer: CustomerSubscriptionRecord,
  ) => {
    setSelectedSubscription(updatedCustomer);
    setEditingCustomer(false);
    showSuccess("Success", "Customer updated successfully");
  };

  return (
    <PermissionGate permission="customer.read">
      <CustomerProfileNavigationProvider
        customerId={customerIdFromParams}
        tab={activeTab}
      >
      <div className="flex min-w-0 flex-col gap-4">
        {/* Header */}
        <div className="flex items-center justify-between gap-4">
          <BackButton

            showBreadcrumb={true}
            currentLabel="Customer Details"
          />
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsCommunicateModalOpen(true)}
              className={`${tw.rounded} inline-flex items-center gap-2 px-4 py-2 text-sm font-medium`}
              style={{
                backgroundColor: color.primary.action,
                color: "white",
              }}
            >
              <Send className="h-4 w-4" />
              Send Communication
            </button>
            <PermissionGate permission="customer.update">
              <button
                onClick={() => setEditingCustomer(true)}
                className={`text-sm font-medium inline-flex items-center gap-2 flex-shrink-0 ${tw.rounded}`}
                style={{
                  backgroundColor: color.primary.action,
                  color: "white",
                  padding: "8px 16px",
                }}
              >
                <Edit className="h-4 w-4" />
                Edit
              </button>
            </PermissionGate>
            <PermissionGate permission="customer.delete">
              <button
                onClick={() => setDeleteConfirmOpen(true)}
                className={`${tw.rounded} inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white`}
                style={{ backgroundColor: "#dc2626" }}
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </button>
            </PermissionGate>
          </div>
        </div>

        <div className="min-w-0 overflow-visible">
        <CustomerProfileTabs activeTab={activeTab} onChange={setActiveTab} />

        <div
          id={CUSTOMER_PROFILE_TAB_PANEL_ID}
          role="tabpanel"
          aria-labelledby={`customer-profile-tab-${activeTab}`}
          className="mt-4 min-w-0"
        >
        {activeTab === "overview" && (
          <div className="space-y-6">
            {/* Customer Information Section */}
            <div
              className={`bg-white border border-gray-200 ${tw.rounded} overflow-hidden`}
            >
              <div className="p-6 space-y-6">
                {overviewSections.map((section) => (
                  <div key={section.title} className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-base font-semibold text-gray-900">
                        {section.title}
                      </h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {section.items.map(({ label, value }) => (
                        <div
                          key={`${section.title}-${label}`}
                          className={`${tw.rounded} border border-gray-100 px-4 py-3`}
                          style={{ backgroundColor: "var(--c-readonly-field-bg)" }}
                        >
                          <p className="text-xs uppercase text-gray-500">
                            {label}
                          </p>
                          <p className="mt-1 text-sm font-semibold text-gray-900 break-words">
                            {value ?? "—"}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
                {!selectedSubscription && (
                  <p className="text-sm text-gray-500">
                    Detailed subscription data is unavailable for this record.
                  </p>
                )}
              </div>
            </div>

            {/* KPIs Section */}
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Key Performance Indicators
                </h3>

                {/* KPI Search Bar */}
                <div className="mb-6">
                  <SearchInput
                    placeholder="Search KPIs by name or category..."
                    value={kpiSearchTerm}
                    onChange={setKpiSearchTerm}
                  />
                </div>

                {/* KPIs Table */}
                {filteredKpis.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-8">
                    No KPIs found matching "{kpiSearchTerm}"
                  </p>
                ) : (
                  <div className={`${tw.rounded} overflow-hidden`}>
                    <Table<any>
                      columns={kpiColumns}
                      data={paginatedKpis}
                      totalItems={filteredKpis.length}
                      currentPage={kpiPage}
                      pageSize={pageSize}
                      onPageChange={setKpiPage}
                      onHideColumn={toggleKpiColumn}
                      onManageColumnsClick={() => setShowKpiColumnPicker(true)}
                      style={{
                        headerBackground: color.surface.tableHeader,
                        headerTextColor: color.surface.tableHeaderText,
                        rowBackground: color.surface.tablebodybg,
                        rowSpacing: "0 12px",
                      }}
                    />
                  </div>
                )}
                {paginatedKpis.length > 0 && filteredKpis.length > 0 && (
                  <div className="mt-4">
                    <Pagination
                      currentPage={kpiPage}
                      pageSize={pageSize}
                      totalItems={filteredKpis.length}
                      onPageChange={setKpiPage}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === "device" && (
          <CustomerAccountDevicesTab
            subscriberId={
              selectedSubscription?.customerId ??
              selectedSubscription?.id ??
              customerIdFromParams
            }
            customerRecord={
              (selectedSubscription as Record<string, unknown> | undefined) ??
              null
            }
          />
        )}

        {activeTab === "activity" && (
          <CustomerEventsTab
            subscriberId={
              selectedSubscription?.customerId ??
              selectedSubscription?.id ??
              customerIdFromParams
            }
          />
        )}

        {activeTab === "engagement" && (
          <div>
            {events.length === 0 ? (
              <div className="py-12 text-center">
                <p className="text-gray-500 text-sm">
                  No engagement data available
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Event Distribution by Channel - Bar Chart */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Event Distribution by Channel
                  </h3>
                  {eventDistributionData.length === 0 ? (
                    <p className="text-gray-400 text-sm">No data available</p>
                  ) : (
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={eventDistributionData}>
                          <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="#e5e7eb"
                          />
                          <XAxis
                            dataKey="name"
                            tick={{ fontSize: 11, fill: "#6b7280" }}
                          />
                          <YAxis tick={{ fontSize: 11, fill: "#6b7280" }} />
                          <Tooltip
                            content={<CustomTooltip />}
                            cursor={{ fill: "transparent" }}
                          />
                          <Bar
                            dataKey="value"
                            fill={colors.reportCharts.palette.color1}
                            radius={[4, 4, 0, 0]}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>

                {/* Activity Timeline */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Activity Timeline
                  </h3>
                  {activityTimelineData.length === 0 ? (
                    <p className="text-gray-400 text-sm">No data available</p>
                  ) : (
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={activityTimelineData}>
                          <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="#e5e7eb"
                          />
                          <XAxis
                            dataKey="month"
                            tick={{ fontSize: 11, fill: "#6b7280" }}
                            angle={-45}
                            textAnchor="end"
                            height={60}
                          />
                          <YAxis tick={{ fontSize: 11, fill: "#6b7280" }} />
                          <Tooltip
                            content={<CustomTooltip />}
                            cursor={{ fill: "transparent" }}
                          />
                          <Bar
                            dataKey="events"
                            fill={colors.reportCharts.palette.color2}
                            radius={[4, 4, 0, 0]}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>

                {/* Status Distribution */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Status Distribution
                  </h3>
                  {statusDistributionData.length === 0 ? (
                    <p className="text-gray-400 text-sm">No data available</p>
                  ) : (
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={statusDistributionData}>
                          <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="#e5e7eb"
                          />
                          <XAxis
                            dataKey="name"
                            tick={{ fontSize: 11, fill: "#6b7280" }}
                            angle={-45}
                            textAnchor="end"
                            height={60}
                          />
                          <YAxis tick={{ fontSize: 11, fill: "#6b7280" }} />
                          <Tooltip
                            content={<CustomTooltip />}
                            cursor={{ fill: "transparent" }}
                          />
                          <Bar
                            dataKey="value"
                            fill={colors.reportCharts.palette.color3}
                            radius={[4, 4, 0, 0]}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>

                {/* Engagement Rate by Channel */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Engagement Rate by Channel
                  </h3>
                  {engagementByChannelData.length === 0 ? (
                    <p className="text-gray-400 text-sm">No data available</p>
                  ) : (
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={engagementByChannelData}>
                          <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="#e5e7eb"
                          />
                          <XAxis
                            dataKey="name"
                            tick={{ fontSize: 11, fill: "#6b7280" }}
                          />
                          <YAxis
                            tick={{ fontSize: 11, fill: "#6b7280" }}
                            label={{
                              value: "Engagement Rate (%)",
                              angle: -90,
                              position: "insideLeft",
                            }}
                          />
                          <Tooltip
                            content={<CustomTooltip />}
                            cursor={{ fill: "transparent" }}
                            formatter={(value?: number) =>
                              value ? `${value}%` : ""
                            }
                          />
                          <Bar
                            dataKey="engagementRate"
                            fill={colors.reportCharts.palette.color4}
                            radius={[4, 4, 0, 0]}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {(activeTab === "segments" || activeTab === "campaigns") && (
          <CustomerAudiencePanel
            view={activeTab}
            subscriberId={
              selectedSubscription?.customerId ??
              selectedSubscription?.id ??
              customerIdFromParams
            }
            customerRecord={
              (selectedSubscription as Record<string, unknown> | undefined) ??
              null
            }
          />
        )}

        {activeTab === "offers" && (
          <CustomerOffersTab
            subscriberId={
              selectedSubscription?.customerId ??
              selectedSubscription?.id ??
              customerIdFromParams
            }
            customerRecord={
              (selectedSubscription as Record<string, unknown> | undefined) ??
              null
            }
          />
        )}

        {activeTab === "subscribedLists" && (
          <CustomerSubscribedListsTab
            subscriberId={
              selectedSubscription?.customerId ??
              selectedSubscription?.id ??
              customerIdFromParams
            }
            customerRecord={
              (selectedSubscription as Record<string, unknown> | undefined) ??
              null
            }
          />
        )}

        {activeTab === "communications" && (
          <CustomerCommunicationsTab
            subscriberId={
              selectedSubscription?.customerId ??
              selectedSubscription?.id ??
              customerIdFromParams
            }
            customerRecord={
              (selectedSubscription as Record<string, unknown> | undefined) ??
              null
            }
            refreshToken={communicationRefreshToken}
          />
        )}

        {activeTab === "purchases" && (
          <CustomerPurchasesTab
            subscriberId={
              selectedSubscription?.customerId ??
              selectedSubscription?.id ??
              customerIdFromParams
            }
            customerRecord={
              (selectedSubscription as Record<string, unknown> | undefined) ??
              null
            }
          />
        )}

        {activeTab === "loyalty" && (
          <CustomerLoyaltyTab
            subscriberId={
              selectedSubscription?.customerId ??
              selectedSubscription?.id ??
              customerIdFromParams
            }
            customerRecord={
              (selectedSubscription as Record<string, unknown> | undefined) ??
              null
            }
          />
        )}

        {activeTab === "preferences" && (
          <CustomerPreferencesTab
            subscriberId={
              selectedSubscription?.customerId ??
              selectedSubscription?.id ??
              customerIdFromParams
            }
            customerRecord={
              (selectedSubscription as Record<string, unknown> | undefined) ??
              null
            }
          />
        )}

        {activeTab === "interactions" && (
          <CustomerInteractionsTab
            subscriberId={
              selectedSubscription?.customerId ??
              selectedSubscription?.id ??
              customerIdFromParams
            }
            customerRecord={
              (selectedSubscription as Record<string, unknown> | undefined) ??
              null
            }
          />
        )}

        </div>
        </div>

        {/* Send Communication Modal */}
        {isCommunicateModalOpen && selectedSubscription && (
          <CreateCommunicationModal
            isOpen={isCommunicateModalOpen}
            onClose={() => setIsCommunicateModalOpen(false)}
            customerRecord={selectedSubscription}
            onSuccess={(result) => {
              customerCommunicationService.invalidateCache(
                selectedSubscription?.customerId ??
                  selectedSubscription?.id ??
                  customerIdFromParams,
              );
              setCommunicationRefreshToken((value) => value + 1);
              showSuccess(
                "Success",
                `Communication sent successfully! ${result.total_messages_sent} messages sent.`,
              );
            }}
          />
        )}

        {/* Edit Customer Modal */}
        {editingCustomer && selectedSubscription && (
          <EditCustomerModal
            isOpen={editingCustomer}
            onClose={() => setEditingCustomer(false)}
            customer={selectedSubscription}
            onCustomerUpdated={handleCustomerUpdated}
          />
        )}

        {/* Delete Confirmation Modal */}
        <DeleteConfirmModal
          isOpen={deleteConfirmOpen}
          title="Delete Customer"
          description="This customer and all their data will be permanently deleted. This action cannot be undone."
          itemName={`${selectedSubscription?.first_name} ${selectedSubscription?.last_name}`}
          onConfirm={handleDeleteCustomer}
          onClose={() => setDeleteConfirmOpen(false)}
          isLoading={isDeleting}
          confirmText="Delete"
          cancelText="Cancel"
        />

        {/* KPI Column Picker Modal */}
        <ColumnPickerModal
          isOpen={showKpiColumnPicker}
          columns={kpiColumns.map((col) => ({ id: col.id, label: col.label, visible: col.visible }))}
          onClose={() => setShowKpiColumnPicker(false)}
          onToggleColumn={toggleKpiColumn}
          onReorderColumns={(reorderedCols) => {
            const updatedColumns = kpiColumns.map((col) => {
              const reordered = reorderedCols.find((c) => c.id === col.id);
              return reordered ? { ...col, visible: reordered.visible } : col;
            });
            reorderKpiColumns(updatedColumns);
          }}
          onResetToDefaults={resetKpiDefaults}
        />
      </div>
      </CustomerProfileNavigationProvider>
    </PermissionGate>
  );
}
