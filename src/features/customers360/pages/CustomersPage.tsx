import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import type { CSSProperties } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import {
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
  Download,
  ArrowLeft,
} from "lucide-react";
import SearchInput from "../../../shared/components/ui/SearchInput";
import type { CustomerSubscriptionRecord } from "../types/customerSubscription";
import type { Subscriber } from "../types/customer";
import { NotificationChannel } from "../types/customer";
import {
  convertSubscriptionToCustomerRow,
  formatMsisdn,
  getSubscriptionDisplayName,
  searchCustomers as searchCustomersUtil,
} from "../utils/customerSubscriptionHelpers";
import { formatDate } from "../../../shared/services/dateService";
import { customerService } from "../services/customerServices";
import LoadingSpinner from "../../../shared/components/ui/LoadingSpinner";
import DeleteConfirmModal from "../../../shared/components/ui/DeleteConfirmModal";
import Pagination, { DEFAULT_PAGE_SIZE, getInitialPageSize } from "../../../shared/components/ui/Pagination";
import HeadlessSelect from "../../../shared/components/ui/HeadlessSelect";
import { Table, useTable, type TableColumn } from "../../../shared/components/Table";
import { ColumnPickerModal } from "../../../shared/components/ColumnPickerModal";
import CsvDownloadButton from "../../../shared/components/CsvDownloadButton";
import CreateCustomerModal from "../components/CreateCustomerModal";
import EditCustomerModal from "../components/EditCustomerModal";
import { color, tw, zIndex, button } from "../../../shared/utils/utils";
import { useLanguage } from "../../../contexts/LanguageContext";
import { extractBackendError } from "../../../shared/utils/errorHandler";;;
import { useToast } from "../../../contexts/ToastContext";
import { PermissionGate } from "../../auth/components/PermissionGate";
import CreateCommunicationModal from "../../../shared/components/CreateCommunicationModal";
import CustomerDetailsExpandedRow from "../components/CustomerDetailsExpandedRow";
import { useDeleteConfirm } from "../../../shared/hooks/useDeleteConfirm";

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
    limit: getInitialPageSize(),
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
  const [showActionMenuForId, setShowActionMenuForId] = useState<number | string | null>(null);
  const [dropdownPosition, setDropdownPosition] = useState<{
    top: number;
    left: number;
    maxHeight: number;
  } | null>(null);
  const actionMenuRefs = useRef<Record<number | string, HTMLElement | null>>({});
  const dropdownMenuRefs = useRef<Record<number | string, HTMLDivElement | null>>({});
  const [isCommunicateModalOpen, setIsCommunicateModalOpen] = useState(false);
  const [customerToCommunicate, setCustomerToCommunicate] =
    useState<CustomerSubscriptionRecord | null>(null);

  // Customer creation/edit modal state
  const [isCreateCustomerModalOpen, setIsCreateCustomerModalOpen] =
    useState(false);
  const [editingCustomer, setEditingCustomer] =
    useState<CustomerSubscriptionRecord | null>(null);
  const [customers, setCustomers] = useState<CustomerSubscriptionRecord[]>([]);
  const [allCustomers, setAllCustomers] = useState<CustomerSubscriptionRecord[]>([]);
  const [showColumnPicker, setShowColumnPicker] = useState(false);
  const [clearFiltersKey, setClearFiltersKey] = useState(0);

  const defaultColumns: TableColumn<any>[] = useMemo(() => [
    {
      id: "subscriptionId",
      label: t.customer360.subscriptionId,
      visible: true,
      sortable: true,
      filterConfig: { type: "text" },
      render: (_, row) => (
        <span className="text-sm text-gray-900">{row.subscriptionId}</span>
      ),
    },
    {
      id: "msisdn",
      label: t.customer360.msisdn,
      visible: true,
      sortable: true,
      filterConfig: { type: "text" },
      render: (_, row) => (
        <span className="text-sm text-gray-900">{row.msisdn}</span>
      ),
    },
    {
      id: "customer",
      label: t.customer360.customer,
      visible: true,
      sortable: true,
      filterConfig: { type: "text" },
      render: (_, row: any) => {
        if (!row) return null;
        const name = getSubscriptionDisplayName(row, `Customer ${row.customerId}`);
        return <span className="text-sm text-gray-900">{name}</span>;
      },
    },
    {
      id: "customerType",
      label: t.customer360.customerType,
      visible: true,
      sortable: true,
      filterConfig: { type: "select", options: ["prepaid", "postpaid"] },
      render: (_, row) => (
        <span className="text-sm text-gray-900 capitalize">{row.customerType}</span>
      ),
    },
    {
      id: "status",
      label: t.customer360.status,
      visible: true,
      sortable: true,
      filterConfig: { type: "select", options: ["active", "inactive", "suspended"] },
      render: (_, row) => (
        <span className="text-sm text-gray-900">{row.status ?? "Unknown"}</span>
      ),
    },
    {
      id: "preferredChannel",
      label: t.customer360.preferredChannel,
      visible: true,
      sortable: true,
      filterConfig: { type: "select", options: ["SMS", "USSD", "EMAIL", "PUSH"] },
      render: (_, row: any) => {
        if (!row) return null;
        return <span className="text-sm text-gray-900">{getChannelLabel(row.tariff)}</span>;
      },
    },
    {
      id: "simType",
      label: t.customer360.simType,
      visible: true,
      sortable: true,
      filterConfig: { type: "select", options: ["KYC Verified", "Not Verified"] },
      render: (_, row) => (
        <span className="text-sm text-gray-900">{row.simType}</span>
      ),
    },
    {
      id: "activationDate",
      label: t.customer360.activationDate,
      visible: true,
      sortable: true,
      filterConfig: { type: "date" },
      render: (_, row) => (
        <span className="text-sm text-gray-900">
          {formatDate(new Date(row.activationDate))}
        </span>
      ),
    },
    {
      id: "actions",
      label: t.customer360.actions,
      visible: true,
      sortable: false,
      render: (_, col, row: any) => (
        <div className="flex items-center justify-end gap-2">
          <PermissionGate permission="customer.read">
            <button
              type="button"
              onClick={() => row && handleSelectCustomer(row)}
              className="inline-flex items-center justify-center p-2 text-gray-700 hover:text-gray-900 transition-colors"
              title="View customer"
            >
              <Eye className="h-4 w-4" />
            </button>
          </PermissionGate>
          <PermissionGate permission="customer.update">
            <button
              type="button"
              onClick={() => row && handleEditCustomer(row)}
              className="inline-flex items-center justify-center p-2 text-gray-700 hover:text-gray-900 transition-colors"
              title="Edit customer"
            >
              <Edit className="h-4 w-4" />
            </button>
          </PermissionGate>
          <button
            ref={(el) => {
              if (row && el) {
                actionMenuRefs.current[row.subscriptionId] = el;
              }
            }}
            onClick={(e) => row && handleActionMenuToggle(row.subscriptionId, e)}
            className="inline-flex items-center justify-center p-2 text-gray-700 hover:text-gray-900 transition-colors"
            title="More actions"
          >
            <MoreHorizontal className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ], [t, getChannelLabel, showActionMenuForId, dropdownPosition]);

  const {
    columns,
    toggleColumn,
    reorderColumns,
    resetToDefaults,
    expandedRowId,
    setExpandedRowId,
  } = useTable({
    tableId: "customers-table-v2",
    defaultColumns,
    defaultPageSize: DEFAULT_PAGE_SIZE,
    persistToLocalStorage: true,
  });

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
          setAllCustomers(apiCustomers);

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
      showError("Error", extractBackendError(error, "Error. Please try again."));
      setIsLoading(false);
    }
  }, [filters, showError]);

  // Load customers when filters change
  useEffect(() => {
    loadCustomers();
  }, [loadCustomers]);

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
      setAllCustomers(allCustomers);
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
          msisdn: debouncedSearchTerm,
          limit: 100,
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
        } else {
          setCustomers([]);
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
  const totalPages = Math.max(1, Math.ceil(totalCustomers / filters.limit));


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

    allCustomers.forEach((record) => {
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
  }, [allCustomers, totalCustomers]);

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

    navigate(`/dashboard/customers/details/${derivedCustomer.id}`);
  };

  const handleCustomersAdded = (newCustomers: CustomerSubscriptionRecord[]) => {
    setAllCustomers((prevCustomers) => {
      // Create set of existing customer+subscription combinations
      const existingKeys = new Set(
        prevCustomers.map((c) => `${c.customerId}-${c.subscriptionId}`),
      );

      // Filter out duplicates
      const uniqueNewCustomers = newCustomers.filter((customer) => {
        const key = `${customer.customerId}-${customer.subscriptionId}`;
        return !existingKeys.has(key);
      });

      // Prepend new customers to show at top of first page
      return [...uniqueNewCustomers, ...prevCustomers];
    });
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

      // Prepend new customers to show at top of first page
      return [...uniqueNewCustomers, ...prevCustomers];
    });
    setTotalCustomers((prev) => prev + newCustomers.length);
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

  const handleFilteredCountChange = (count: number) => {
    // Updates when filters applied in the Table component
  };

  const handleEditCustomer = (customer: CustomerSubscriptionRecord) => {
    // Open edit modal with customer data
    setEditingCustomer(customer);
  };

  const handleCustomerUpdated = (
    updatedCustomer: CustomerSubscriptionRecord,
  ) => {
    // Update customer in both state arrays
    setAllCustomers((prev) =>
      prev.map((c) =>
        c.customerId === updatedCustomer.customerId ? updatedCustomer : c,
      ),
    );
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

      // Optimistic UI: Remove deleted customer from both lists
      setAllCustomers((prev) =>
        prev.filter((c) => c.customerId !== customerToDelete.customerId),
      );
      setCustomers((prev) =>
        prev.filter((c) => c.customerId !== customerToDelete.customerId),
      );
      setTotalCustomers((prev) => prev - 1);

      showSuccess("Success", "Customer deleted successfully");
      setDeleteModalOpen(false);
      setCustomerToDelete(null);
    } catch (err) {
      showError("Error", extractBackendError(error, "Error. Please try again."));
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSendCommunication = (customer: CustomerSubscriptionRecord) => {
    setCustomerToCommunicate(customer);
    setIsCommunicateModalOpen(true);
    setShowActionMenuForId(null);
    setDropdownPosition(null);
  };

  // Close action menus when clicking outside
  useEffect(() => {
    const handleClickOutsideActionMenus = (event: MouseEvent) => {
      const target = event.target as Node;
      // Check if click is inside any action menu button
      const clickedInsideButton = Object.values(actionMenuRefs.current).some(
        (ref) => ref && ref.contains(target),
      );

      // Check if click is inside any dropdown menu (portal)
      const clickedInsideDropdown = Object.values(
        dropdownMenuRefs.current,
      ).some((ref) => ref && ref.contains(target));

      // Only close if clicked outside both button and dropdown
      if (!clickedInsideButton && !clickedInsideDropdown) {
        setShowActionMenuForId(null);
        setDropdownPosition(null);
      }
    };

    if (showActionMenuForId !== null) {
      document.addEventListener("mousedown", handleClickOutsideActionMenus);
      return () => {
        document.removeEventListener("mousedown", handleClickOutsideActionMenus);
      };
    }
  }, [showActionMenuForId]);

  // Recalculate dropdown position on window resize
  useEffect(() => {
    const handleResize = () => {
      if (showActionMenuForId !== null) {
        const button = actionMenuRefs.current[showActionMenuForId];
        if (button) {
          const buttonRect = button.getBoundingClientRect();
          const viewportHeight = window.innerHeight;
          const padding = 8;
          const spaceBelow = viewportHeight - buttonRect.bottom - padding;
          const maxHeight = Math.max(150, spaceBelow - 20);
          const top = buttonRect.bottom + 8;
          const left = buttonRect.right - 224;
          setDropdownPosition({ top, left, maxHeight });
        }
      }
    };

    if (showActionMenuForId !== null) {
      window.addEventListener("resize", handleResize);
      return () => {
        window.removeEventListener("resize", handleResize);
      };
    }
  }, [showActionMenuForId]);

  const handleActionMenuToggle = (rowId: number | string, event: React.MouseEvent) => {
    event.stopPropagation();
    if (showActionMenuForId === rowId) {
      setShowActionMenuForId(null);
      setDropdownPosition(null);
    } else {
      const button = event.currentTarget as HTMLElement;
      const rect = button.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const padding = 8;
      const spaceBelow = viewportHeight - rect.bottom - padding;
      const maxHeight = Math.max(150, spaceBelow - 20);
      const top = rect.bottom + 8;
      const left = rect.right - 224;

      setShowActionMenuForId(rowId);
      setDropdownPosition({ top, left, maxHeight });
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
        <SearchInput
          value={searchTerm}
          onChange={setSearchTerm}
          placeholder={
            t.customer360.searchPlaceholder || "Search customers..."
          }
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
          <div className={`${tw.rounded} overflow-hidden`}>
            <Table<any>
              columns={columns.map((col) => {
                const defaultCol = defaultColumns.find(dc => dc.id === col.id);
                return defaultCol ? { ...defaultCol, visible: col.visible } : col;
              })}
              data={paginatedResults}
              totalItems={totalCustomers}
              currentPage={filters.page}
              pageSize={filters.limit}
              style={{
                headerBackground: color.surface.tableHeader,
                headerTextColor: color.surface.tableHeaderText,
                rowBackground: color.surface.tablebodybg,
                rowSpacing: "0 12px",
              }}
              onHideColumn={toggleColumn}
              onManageColumnsClick={() => setShowColumnPicker(true)}
              expandedRowId={expandedRowId}
              onExpandChange={setExpandedRowId}
              expandedContent={(row) => {
                const fullCustomer = customers.find(c => c.id === row.id);
                return <CustomerDetailsExpandedRow customer={fullCustomer || row} colSpan={columns.filter(c => c.visible).length} />;
              }}
              onFilteredCountChange={handleFilteredCountChange}
              clearFiltersKey={clearFiltersKey}
            />
          </div>
        )}

        {/* Pagination */}
        {!isLoading &&
          !isDeleting &&
          !error &&
          totalCustomers > 0 && (
            <div className="mt-4">
              <Pagination
              currentPage={filters.page}
              pageSize={filters.limit}
              totalItems={totalCustomers}
              onPageChange={(page) =>
                setFilters((prev) => ({
                  ...prev,
                  page,
                  offset: (page - 1) * prev.limit,
                }))
              }
              onPageSizeChange={(newPageSize) =>
                setFilters((prev) => ({
                  ...prev,
                  limit: newPageSize,
                  page: 1,
                  offset: 0,
                }))
              }
            />
            </div>
          )}
      </div>

      {/* Render dropdown menus via portal */}
      {customers.map((customer) => {
        if (showActionMenuForId === customer.subscriptionId && dropdownPosition) {
          return createPortal(
            <div
              key={customer.subscriptionId}
              ref={(el) => {
                if (el) {
                  dropdownMenuRefs.current[customer.subscriptionId] = el;
                }
              }}
              className={`fixed bg-white border border-gray-200 ${tw.rounded} shadow-xl py-2`}
              style={{
                zIndex: zIndex.popover,
                top: `${dropdownPosition.top}px`,
                left: `${dropdownPosition.left}px`,
                width: '224px',
                maxHeight: `${dropdownPosition.maxHeight}px`,
                overflowY: "auto",
                overflowX: "hidden",
                overscrollBehavior: "contain",
              }}
              onClick={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => {
                  handleSendCommunication(customer);
                  setShowActionMenuForId(null);
                  setDropdownPosition(null);
                }}
                className="w-full flex items-center px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <Send className="h-4 w-4 mr-3" />
                Send Communication
              </button>
              <PermissionGate permission="customer.delete">
                <button
                  type="button"
                  onClick={() => {
                    handleDeleteCustomer(customer);
                    setShowActionMenuForId(null);
                    setDropdownPosition(null);
                  }}
                  className="w-full flex items-center px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 transition-colors"
                >
                  <Trash2 className="h-4 w-4 mr-3" />
                  Delete
                </button>
              </PermissionGate>
            </div>,
            document.body,
          );
        }
        return null;
      })}

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
          }}
        />
      )}

      {/* Column Picker Modal */}
      <ColumnPickerModal
        isOpen={showColumnPicker}
        columns={columns.map((col) => ({ id: col.id, label: col.label, visible: col.visible }))}
        onClose={() => setShowColumnPicker(false)}
        onToggleColumn={toggleColumn}
        onReorderColumns={(reorderedCols) => {
          const updatedColumns = columns.map((col) => {
            const reordered = reorderedCols.find((c) => c.id === col.id);
            return reordered ? { ...col, visible: reordered.visible } : col;
          });
          reorderColumns(updatedColumns);
        }}
        onResetToDefaults={resetToDefaults}
      />

      {/* Advanced filters modal */}
    </div>
  );
}
