import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import type { CSSProperties } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import {
  Search,
  Users,
  Activity,
  Target,
  AlertTriangle,
  Plus,
  Eye,
  Edit,
  Trash2,
  X,
  MoreHorizontal,
  Send,
} from "lucide-react";
import type { CustomerSubscriptionRecord } from "../types/customerSubscription";
import type { Subscriber } from "../types/customer";
import { NotificationChannel } from "../types/customer";
import {
  convertSubscriptionToCustomerRow,
  formatDateTime,
  formatMsisdn,
  getSubscriptionDisplayName,
  searchCustomers as searchCustomersUtil,
} from "../utils/customerSubscriptionHelpers";
import { customerService } from "../services/customerServices";
import LoadingSpinner from "../../../shared/components/ui/LoadingSpinner";
import DeleteConfirmModal from "../../../shared/components/ui/DeleteConfirmModal";
import Pagination from "../../../shared/components/ui/Pagination";
import HeadlessSelect from "../../../shared/components/ui/HeadlessSelect";
import CsvDownloadButton from "../../../shared/components/CsvDownloadButton";
import CreateCustomerModal from "../components/CreateCustomerModal";
import EditCustomerModal from "../components/EditCustomerModal";
import { color, tw, zIndex } from "../../../shared/utils/utils";
import { useLanguage } from "../../../contexts/LanguageContext";
import { useToast } from "../../../contexts/ToastContext";
import { PermissionGate } from "../../auth/components/PermissionGate";
import CreateCommunicationModal from "../../../shared/components/CreateCommunicationModal";

const pageSize = 20;

interface SearchParams {
  page: number;
  limit: number;
  offset: number;
}

// Channel display label mapping
const CHANNEL_LABELS: Record<string, string> = {
  NORMAL_SMS: "Normal SMS",
  FLASH_SMS: "Flash SMS",
  EMAIL: "Email",
  WHATSAPP: "WhatsApp",
  PUSH: "Push",
  USSD: "USSD",
  INTERACTIVE_USSD: "Interactive USSD",
  INAPP: "In-App",
  IVR: "IVR",
  OBD: "OBD",
  SHORT_CODE: "Short Code",
};

const getChannelLabel = (channel: string | undefined): string => {
  if (!channel) return "—";
  return CHANNEL_LABELS[channel] || channel;
};

export default function CustomersPage() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { success: showSuccess, error: showError } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isTimeout, setIsTimeout] = useState(false);
  const [filters, setFilters] = useState<SearchParams>({
    page: 1,
    limit: pageSize,
    offset: 0,
  });
  const [totalCustomers, setTotalCustomers] = useState(0);

  // Delete confirmation modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [customerToDelete, setCustomerToDelete] =
    useState<CustomerSubscriptionRecord | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Filter state
  const [channelFilter, setChannelFilter] = useState("");
  const [customerTypeFilter, setCustomerTypeFilter] = useState("");

  // Action menu state
  const [showActionMenu, setShowActionMenu] = useState(false);
  const [actionMenuIndex, setActionMenuIndex] = useState<number | null>(null);
  const [dropdownPosition, setDropdownPosition] = useState<{ top: number; left: number } | null>(null);
  const [isCommunicateModalOpen, setIsCommunicateModalOpen] = useState(false);
  const [customerToCommunicate, setCustomerToCommunicate] =
    useState<CustomerSubscriptionRecord | null>(null);
  const actionMenuRefs = useRef<(HTMLDivElement | null)[]>([]);
  const dropdownMenuRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Customer creation/edit modal state
  const [isCreateCustomerModalOpen, setIsCreateCustomerModalOpen] =
    useState(false);
  const [editingCustomer, setEditingCustomer] =
    useState<CustomerSubscriptionRecord | null>(null);
  const [customers, setCustomers] = useState<CustomerSubscriptionRecord[]>([]);
  const loadCustomers = useCallback(async () => {
    try {
      setIsLoading(true);
      setError("");
      setIsTimeout(false);

      // Create timeout promise (10 second timeout)
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("TIMEOUT")), 10000),
      );

      // Fetch customers from API with timeout
      try {
        const apiResponse = await Promise.race([
          customerService.getAllCustomers({
            limit: filters.limit,
            offset: filters.offset,
            skipCache: true,
          }),
          timeoutPromise,
        ]);

        if (
          apiResponse.success &&
          apiResponse.data &&
          Array.isArray(apiResponse.data)
        ) {
          // Convert API customers to local format
          const apiCustomers = apiResponse.data.map(
            (apiCustomer: Subscriber) => {
              const customerId =
                typeof apiCustomer.id === "string"
                  ? parseInt(apiCustomer.id, 10)
                  : apiCustomer.id;

              // Try to get subscriber_id from API response, fallback to id
              // This allows for future backend update without frontend change
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
            },
          );
          setCustomers(apiCustomers);

          // Set total from response pagination.total (preferred) or top-level total
          const total =
            apiResponse.pagination?.total ||
            apiResponse.total ||
            apiCustomers.length;
          setTotalCustomers(total);
        }
      } catch (apiError: any) {
        if (apiError.message === "TIMEOUT") {
          setIsTimeout(true);
          showError(
            "Network Timeout",
            "Backend server may be unresponsive. Please try again.",
          );
        } else {
          console.error("Failed to load customers from API:", apiError);
          showError(
            "Failed to Load Customers",
            "Unable to retrieve customers. Please try again.",
          );
        }
      }
      setIsLoading(false);
    } catch (error) {
      console.error("Failed to load customers:", error);
      showError("Error", "Failed to load customers");
      setIsLoading(false);
    }
  }, [filters, showError]);

  // Load customers when filters change
  useEffect(() => {
    loadCustomers();
  }, [loadCustomers]);

  const dataset = customers;

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300); // 300ms delay

    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    setFilters((prev) => ({ ...prev, page: 1, offset: 0 }));
  }, [searchTerm]);

  // Load all customers for frontend search fallback
  const loadAllCustomersForSearch = useCallback(async () => {
    try {
      setIsLoading(true);
      let allCustomers: CustomerSubscriptionRecord[] = [];
      let offset = 0;
      let hasMore = true;
      let totalCount = 0;

      // Paginate through all customers
      while (hasMore) {
        const apiResponse = await customerService.getAllCustomers({
          limit: 100,
          offset,
          skipCache: true,
        });

        if (
          apiResponse.success &&
          apiResponse.data &&
          Array.isArray(apiResponse.data)
        ) {
          const apiCustomers = apiResponse.data.map(
            (apiCustomer: Subscriber) => {
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
            },
          );

          allCustomers = [...allCustomers, ...apiCustomers];

          // Get total from pagination response
          totalCount = apiResponse.pagination?.total || allCustomers.length;
          hasMore = apiResponse.pagination?.hasMore || false;
          offset += 100;
        } else {
          hasMore = false;
        }
      }

      setCustomers(allCustomers);
      setTotalCustomers(totalCount);
    } catch (err) {
      console.error("Failed to load customers for search:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Perform backend search when debounced search term changes
  useEffect(() => {
    if (!debouncedSearchTerm.trim()) {
      // If search is cleared, reload all customers
      loadAllCustomersForSearch();
      return;
    }

    const performSearch = async () => {
      try {
        setIsLoading(true);
        setError("");
        const response = await customerService.searchCustomers({
          search: debouncedSearchTerm,
          limit: 100,
          skipCache: true,
        });

        if (response.success && response.data && Array.isArray(response.data)) {
          // Convert API response to CustomerSubscriptionRecord format
          const apiCustomers = response.data.map((apiCustomer: Subscriber) => {
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
          setCustomers(apiCustomers);
          setTotalCustomers(apiCustomers.length);
        } else {
          setCustomers([]);
          setTotalCustomers(0);
        }
      } catch (err: any) {
        console.error("Search error:", err);
        // Fallback to frontend search - load all customers and filter locally
        console.warn("Backend search failed, falling back to frontend search");
        await loadAllCustomersForSearch();
      } finally {
        setIsLoading(false);
      }
    };

    performSearch();
  }, [debouncedSearchTerm, loadAllCustomersForSearch]);

  const filteredCustomers = useMemo(() => {
    let results = customers;

    // Apply frontend search filter (for fallback when backend search fails)
    if (debouncedSearchTerm.trim()) {
      results = searchCustomersUtil(debouncedSearchTerm, results);
    }

    // Apply channel filter
    if (channelFilter) {
      results = results.filter((customer) => customer.tariff === channelFilter);
    }

    // Apply customer type filter
    if (customerTypeFilter) {
      results = results.filter(
        (customer) => customer.customerType === customerTypeFilter,
      );
    }

    return results;
  }, [debouncedSearchTerm, customers, channelFilter, customerTypeFilter]);

  // Backend pagination - no need to slice since backend returns paginated data
  const paginatedResults = filteredCustomers;
  const totalPages = Math.max(1, Math.ceil(totalCustomers / pageSize));

  const hasSearchFilters = searchTerm.trim().length > 0;

  const formatNumber = (value: number) =>
    value.toLocaleString("en-US", { maximumFractionDigits: 0 });

  const customerStats = useMemo(() => {
    if (!totalCustomers) {
      return {
        uniqueCustomers: 0,
        totalSubscriptions: 0,
        activeSubscriptions: 0,
        pendingActivations: 0,
        atRiskSubscriptions: 0,
        avgTenureDays: 0,
      };
    }

    const uniqueCustomers = new Set<number>();
    let activeSubscriptions = 0;
    let pendingActivations = 0;
    let atRiskSubscriptions = 0;
    let tenureDaysTotal = 0;
    let tenureSamples = 0;
    const now = Date.now();

    dataset.forEach((record) => {
      uniqueCustomers.add(record.customerId);
      const status = record.status?.toLowerCase();
      if (status === "active") {
        activeSubscriptions += 1;
      } else if (status === "pending") {
        pendingActivations += 1;
      } else if (
        status &&
        ["deactivation", "deactivating", "suspending"].includes(status)
      ) {
        atRiskSubscriptions += 1;
      }

      if (record.activationDate) {
        const activation = new Date(record.activationDate);
        if (!Number.isNaN(activation.getTime())) {
          const diffDays = (now - activation.getTime()) / (1000 * 60 * 60 * 24);
          tenureDaysTotal += diffDays;
          tenureSamples += 1;
        }
      }
    });

    return {
      uniqueCustomers: totalCustomers,
      totalSubscriptions: totalCustomers,
      activeSubscriptions,
      pendingActivations,
      atRiskSubscriptions,
      avgTenureDays:
        tenureSamples > 0 ? Math.round(tenureDaysTotal / tenureSamples) : 0,
    };
  }, [dataset, totalCustomers]);

  const statCards = useMemo(
    () => [
      {
        title: t.customer360.uniqueCustomers,
        value: formatNumber(customerStats.uniqueCustomers),
        helper: `${formatNumber(customerStats.totalSubscriptions)} ${
          t.customer360.totalSubscriptions
        }`,
        icon: Users,
      },
      {
        title: t.customer360.activeSubscriptions,
        value: formatNumber(customerStats.activeSubscriptions),
        helper:
          customerStats.totalSubscriptions > 0
            ? `${Math.round(
                (customerStats.activeSubscriptions /
                  customerStats.totalSubscriptions) *
                  100,
              )}${t.customer360.ofBase}`
            : "—",
        icon: Activity,
      },
      {
        title: t.customer360.pendingActivations,
        value: formatNumber(customerStats.pendingActivations),
        helper:
          customerStats.totalSubscriptions > 0
            ? `${Math.round(
                (customerStats.pendingActivations /
                  customerStats.totalSubscriptions) *
                  100,
              )}${t.customer360.awaitingSimSwap}`
            : "—",
        icon: AlertTriangle,
      },
      {
        title: t.customer360.avgTenure,
        value: formatNumber(customerStats.avgTenureDays),
        helper: t.customer360.sinceActivation,
        icon: Target,
      },
    ],
    [customerStats],
  );

  const handleSelectCustomer = (
    customerToSelect: CustomerSubscriptionRecord,
  ) => {
    const derivedCustomer = convertSubscriptionToCustomerRow(customerToSelect);

    navigate(`/dashboard/customers/details/${derivedCustomer.id}`, {
      state: {
        customer: derivedCustomer,
        subscription: customerToSelect,
        source: "customers" as const,
      },
    });
  };

  const handleCustomersAdded = (newCustomers: CustomerSubscriptionRecord[]) => {
    setCustomers((prevCustomers) => {
      // Create set of existing customer+subscription combinations
      const existingKeys = new Set(
        prevCustomers.map((c) => `${c.customerId}-${c.subscriptionId}`),
      );

      // Filter out duplicates
      const uniqueNewCustomers = newCustomers.filter((customer) => {
        const key = `${customer.customerId}-${customer.subscriptionId}`;
        return !existingKeys.has(key);
      });

      // Log duplicates if any were filtered
      if (uniqueNewCustomers.length < newCustomers.length) {
        const duplicateCount = newCustomers.length - uniqueNewCustomers.length;
      }

      // Prepend new customers to show at top of first page
      return [...uniqueNewCustomers, ...prevCustomers];
    });
    setFilters((prev) => ({ ...prev, page: 1, offset: 0 })); // Reset to first page to show newly added customers
    setIsCreateCustomerModalOpen(false);
  };

  const handleViewCustomer = async (customer: CustomerSubscriptionRecord) => {
    try {
      // Fetch full customer details from API
      await customerService.getCustomerById(customer.customerId);
      // Then navigate to detail view
      handleSelectCustomer(customer);
    } catch (err) {
      showError("Error", "Failed to load customer details");
    }
  };

  const handleEditCustomer = (customer: CustomerSubscriptionRecord) => {
    // Open edit modal with customer data
    setEditingCustomer(customer);
  };

  const handleCustomerUpdated = (
    updatedCustomer: CustomerSubscriptionRecord,
  ) => {
    // Update customer in local state
    setCustomers((prev) =>
      prev.map((c) =>
        c.customerId === updatedCustomer.customerId ? updatedCustomer : c,
      ),
    );
    setEditingCustomer(null);
  };

  const handleDeleteCustomer = (customer: CustomerSubscriptionRecord) => {
    setCustomerToDelete(customer);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!customerToDelete) return;

    setIsDeleting(true);
    try {
      await customerService.deleteCustomer(customerToDelete.customerId);

      // Optimistic UI: Remove deleted customer from list
      setCustomers((prev) =>
        prev.filter((c) => c.customerId !== customerToDelete.customerId),
      );

      showSuccess("Success", "Customer deleted successfully");
      setDeleteModalOpen(false);
      setCustomerToDelete(null);
    } catch (err) {
      showError("Error", "Failed to delete customer");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSendCommunication = (customer: CustomerSubscriptionRecord) => {
    setCustomerToCommunicate(customer);
    setIsCommunicateModalOpen(true);
    setShowActionMenu(false);
    setActionMenuIndex(null);
  };

  const handleActionMenuToggle = (index: number, event: React.MouseEvent) => {
    event.stopPropagation();
    if (actionMenuIndex === index && showActionMenu) {
      setShowActionMenu(false);
      setActionMenuIndex(null);
      setDropdownPosition(null);
    } else {
      const button = event.currentTarget as HTMLElement;
      const rect = button.getBoundingClientRect();
      const menuHeight = 120; // Approximate height for dropdown
      const top = rect.bottom + 8;
      const left = rect.right - 200; // Approximate menu width
      
      setActionMenuIndex(index);
      setShowActionMenu(true);
      setDropdownPosition({ top, left });
    }
  };

  const cellBackground: CSSProperties = {
    backgroundColor: color.surface.tablebodybg,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className={`${tw.mainHeading} mt-2`}>{t.customer360.title}</h1>
          <p className={`${tw.textSecondary} mt-2 text-sm`}>
            {t.customer360.description}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3 justify-start lg:justify-end">
          <CsvDownloadButton
            headers={[
              t.customer360.subscriptionId,
              t.customer360.msisdn,
              t.customer360.customer,
              t.customer360.customerType,
              t.customer360.status,
              t.customer360.preferredChannel,
              t.customer360.simType,
              t.customer360.activationDate,
            ]}
            rows={filteredCustomers.map((row) => [
              row.subscriptionId,
              formatMsisdn(row.msisdn),
              getSubscriptionDisplayName(row, `Customer ${row.customerId}`),
              row.customerType || "—",
              row.status || "Unknown",
              getChannelLabel(row.tariff),
              row.simType || "—",
              row.activationDate || "—",
            ])}
            filename="customers_360"
            label="Download CSV"
            disabled={filteredCustomers.length === 0}
            className={`${tw.button} inline-flex items-center gap-2`}
          />
          <PermissionGate permission="customer.create">
            <button
              type="button"
              onClick={() => setIsCreateCustomerModalOpen(true)}
              className={`${tw.button} flex items-center gap-2`}
            >
              <Plus className="h-4 w-4" />
              {t.customer360.addCustomer}
            </button>
          </PermissionGate>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map(({ title, value, icon: Icon }) => (
          <div
            key={title}
            className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm`}
          >
            <div className="flex items-center gap-2">
              <Icon
                className="h-5 w-5"
                style={{ color: color.primary.accent }}
              />
              <p className="text-sm font-medium text-gray-600">{title}</p>
            </div>
            <p className="mt-2 text-3xl font-bold text-gray-900">{value}</p>
          </div>
        ))}
      </div>

      {/* Search and Filters */}
      <div className="flex gap-3 items-end flex-wrap">
        <div className="relative flex-1 min-w-[250px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={
              t.customer360.searchPlaceholder || "Search customers..."
            }
            className={`w-full ${tw.rounded} border border-gray-300 py-3 pl-10 pr-4 text-sm focus:border-gray-400 focus:outline-none focus:ring-1 focus:ring-[--accent-color]`}
            style={
              {
                "--accent-color": `${color.primary.accent}33`,
              } as CSSProperties
            }
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                // Search is automatic via useEffect
              }
            }}
          />
        </div>
        <HeadlessSelect
          value={channelFilter}
          onChange={(value) => setChannelFilter(String(value))}
          options={[
            { value: "", label: "All Channels" },
            ...Object.values(NotificationChannel).map((channel) => ({
              value: channel,
              label: CHANNEL_LABELS[channel] || channel,
            })),
          ]}
          placeholder="Select channel"
          className={`text-sm`}
        />
        <HeadlessSelect
          value={customerTypeFilter}
          onChange={(value) => setCustomerTypeFilter(String(value))}
          options={[
            { value: "", label: "All Types" },
            ...Array.from(
              new Set(customers.map((c) => c.customerType).filter(Boolean)),
            ).map((type) => ({
              value: type,
              label: type,
            })),
          ]}
          placeholder="Select customer type"
          className={`text-sm`}
        />
      </div>

      {/* Table card */}
      <div>
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <LoadingSpinner
              variant="modern"
              size="xl"
              color="primary"
              className="mb-4"
            />
            <p className={`${tw.textMuted} font-medium text-sm`}>
              {t.customer360.preparingCustomerData}
            </p>
          </div>
        ) : error || isTimeout ? (
          <div className="flex flex-col items-center justify-center py-16">
            <AlertTriangle className="h-12 w-12 text-red-500 mb-4" />
            <p className="text-red-600 font-medium text-center mb-4">
              {isTimeout ? "Network Timeout" : "Failed to Load Customers"}
            </p>
            <p
              className={`${tw.textSecondary} text-sm text-center mb-6 max-w-md`}
            >
              {isTimeout
                ? "The backend server may be unresponsive. Please try again."
                : error || "Unable to retrieve customers. Please try again."}
            </p>
            <button
              onClick={() => window.location.reload()}
              className={`${tw.button} flex items-center gap-2`}
            >
              <ArrowLeft className="h-4 w-4" />
              Retry
            </button>
          </div>
        ) : customers.length === 0 && !hasSearchFilters ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <p className={`${tw.textSecondary}`}>
                {t.customer360.noCustomersMatch}
              </p>
              <div className="mt-4">
                <PermissionGate permission="customer.create">
                  <button
                    onClick={() => setIsCreateCustomerModalOpen(true)}
                    className={`${tw.button} flex items-center gap-2 mx-auto`}
                  >
                    <Plus className="h-4 w-4" />
                    {t.customer360.addCustomer}
                  </button>
                </PermissionGate>
              </div>
            </div>
          </div>
        ) : paginatedResults.length === 0 ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <p className={`${tw.textSecondary}`}>
                {hasSearchFilters
                  ? t.customer360.noCustomersMatch
                  : t.customer360.startBySearching}
              </p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table
              className="w-full text-sm"
              style={{ borderCollapse: "separate", borderSpacing: "0 12px" }}
            >
              <thead
                className="text-xs uppercase tracking-wide"
                style={{ background: color.surface.tableHeader }}
              >
                <tr>
                  {[
                    t.customer360.subscriptionId,
                    t.customer360.msisdn,
                    t.customer360.customer,
                    t.customer360.customerType,
                    // t.customer360.city,
                    t.customer360.status,
                    t.customer360.preferredChannel,
                    t.customer360.simType,
                    t.customer360.activationDate,
                    t.customer360.actions,
                  ].map((header) => (
                    <th
                      key={header}
                      className="px-6 py-3 text-left text-gray-900 font-semibold"
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginatedResults.map((row, index) => {
                  const name = getSubscriptionDisplayName(
                    row,
                    `Customer ${row.customerId}`,
                  );
                  const status = row.status ?? "Unknown";

                  return (
                    <tr
                      key={`${row.customerId}-${row.subscriptionId}-${index}`}
                    >
                      <td
                        className="rounded-l-md px-6 py-5 text-sm text-gray-900"
                        style={cellBackground}
                      >
                        {row.subscriptionId}
                      </td>
                      <td
                        className="px-6 py-5 text-sm text-gray-900"
                        style={cellBackground}
                      >
                        {row.msisdn}
                      </td>
                      <td className="px-6 py-5 text-sm" style={cellBackground}>
                        <button
                          type="button"
                          onClick={() => handleSelectCustomer(row)}
                          className="text-left"
                        >
                          <p className="font-semibold text-gray-900 hover:underline">
                            {name}
                          </p>
                        </button>
                      </td>
                      <td
                        className="px-6 py-5 text-sm text-gray-900"
                        style={cellBackground}
                      >
                        {row.customerType ?? "—"}
                      </td>
                      {/* <td
                        className="px-6 py-5 text-sm text-gray-900"
                        style={cellBackground}
                      >
                        {row.city ?? "—"}
                      </td> */}
                      <td
                        className="px-6 py-5 text-sm text-black"
                        style={cellBackground}
                      >
                        {status}
                      </td>
                      <td
                        className="px-6 py-5 text-sm text-gray-900"
                        style={cellBackground}
                      >
                        {getChannelLabel(row.tariff)}
                      </td>
                      <td
                        className="px-6 py-5 text-sm text-gray-900"
                        style={cellBackground}
                      >
                        {row.simType ?? "—"}
                      </td>
                      <td
                        className="px-6 py-5 text-sm text-gray-900"
                        style={cellBackground}
                      >
                        {formatDateTime(row.activationDate)}
                      </td>
                      <td
                        className="rounded-r-md px-6 py-5 text-sm text-right relative"
                        style={cellBackground}
                      >
                        <div className="flex items-center justify-end gap-2">
                          <PermissionGate permission="customer.read">
                            <button
                              type="button"
                              onClick={() => handleSelectCustomer(row)}
                              className="inline-flex items-center justify-center p-2 text-gray-700 hover:text-gray-900 transition-colors"
                              title="View customer"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                          </PermissionGate>
                          <PermissionGate permission="customer.update">
                            <button
                              type="button"
                              onClick={() => handleEditCustomer(row)}
                              className="inline-flex items-center justify-center p-2 text-gray-700 hover:text-gray-900 transition-colors"
                              title="Edit customer"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                          </PermissionGate>
                          {/* Action Menu Button */}
                          <button
                            ref={(el) => {
                              actionMenuRefs.current[index] = el;
                            }}
                            onClick={(e) => handleActionMenuToggle(index, e as any)}
                            className="inline-flex items-center justify-center p-2 text-gray-700 hover:text-gray-900 transition-colors"
                            title="More actions"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </button>

                          {/* Dropdown Menu Portal */}
                          {showActionMenu &&
                            actionMenuIndex === index &&
                            dropdownPosition &&
                            createPortal(
                              <div
                                ref={(el) => {
                                  dropdownMenuRefs.current[index] = el;
                                }}
                                style={{
                                  position: "fixed",
                                  top: `${dropdownPosition.top}px`,
                                  left: `${dropdownPosition.left}px`,
                                  zIndex: zIndex.popover,
                                }}
                                className={`${tw.rounded} border border-gray-200 bg-white shadow-lg py-1 w-56`}
                              >
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleSendCommunication(row)
                                  }
                                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 first:rounded-t flex items-center gap-2 transition-colors"
                                >
                                  <Send className="h-4 w-4" />
                                  Send Communication
                                </button>
                                <PermissionGate permission="customer.delete">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      handleDeleteCustomer(row);
                                      setShowActionMenu(false);
                                      setActionMenuIndex(null);
                                      setDropdownPosition(null);
                                    }}
                                    className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 last:rounded-b flex items-center gap-2 transition-colors"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                    Delete
                                  </button>
                                </PermissionGate>
                              </div>,
                              document.body,
                            )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {!isLoading &&
          !isDeleting &&
          !error &&
          filteredCustomers.length > pageSize && (
            <Pagination
              currentPage={filters.page}
              pageSize={filters.limit}
              totalItems={filteredCustomers.length}
              onPageChange={(page) =>
                setFilters((prev) => ({
                  ...prev,
                  page,
                  offset: (page - 1) * pageSize,
                }))
              }
            />
          )}
      </div>

      {/* Create/Edit customer modals */}
      <CreateCustomerModal
        isOpen={isCreateCustomerModalOpen}
        onClose={() => setIsCreateCustomerModalOpen(false)}
        onCustomersAdded={handleCustomersAdded}
        existingCustomers={customers}
      />

      <EditCustomerModal
        isOpen={editingCustomer !== null}
        onClose={() => setEditingCustomer(null)}
        customer={editingCustomer}
        onCustomerUpdated={handleCustomerUpdated}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={deleteModalOpen}
        title="Delete Customer"
        description="This customer and all their data will be permanently deleted. This action cannot be undone."
        itemName={`${customerToDelete?.firstName} ${customerToDelete?.lastName}`}
        onConfirm={handleConfirmDelete}
        onClose={() => {
          setDeleteModalOpen(false);
          setCustomerToDelete(null);
        }}
        isLoading={isDeleting}
        confirmText="Delete"
        cancelText="Cancel"
      />

      {/* Send Communication Modal */}
      {isCommunicateModalOpen && customerToCommunicate && (
        <CreateCommunicationModal
          isOpen={isCommunicateModalOpen}
          onClose={() => {
            setIsCommunicateModalOpen(false);
            setCustomerToCommunicate(null);
          }}
          customerRecord={customerToCommunicate}
          onSuccess={(result) => {
            showSuccess(
              "Success",
              `Communication sent successfully! ${result.total_messages_sent} messages sent.`,
            );
            setIsCommunicateModalOpen(false);
            setCustomerToCommunicate(null);
          }}
        />
      )}

      {/* Advanced filters modal */}
    </div>
  );
}
