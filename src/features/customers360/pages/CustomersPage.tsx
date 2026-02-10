import { useEffect, useMemo, useState, useCallback } from "react";
import type { CSSProperties } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  Users,
  Activity,
  Target,
  AlertTriangle,
  Plus,
  ChevronLeft,
  ChevronRight,
  Eye,
  Edit,
  X,
} from "lucide-react";
import type { CustomerSubscriptionRecord } from "../types/customerSubscription";
import {
  convertSubscriptionToCustomerRow,
  formatDateTime,
  formatMsisdn,
  getSubscriptionDisplayName,
} from "../utils/customerSubscriptionHelpers";
import { searchCustomers as searchCustomersUtil } from "../utils/customerDataService";
import { customerService } from "../services/customerServices";
import LoadingSpinner from "../../../shared/components/ui/LoadingSpinner";
import RegularModal from "../../../shared/components/ui/RegularModal";
import DeleteConfirmModal from "../../../shared/components/ui/DeleteConfirmModal";
import CsvDownloadButton from "../../../shared/components/CsvDownloadButton";
import CreateCustomerModal from "../components/CreateCustomerModal";
import EditCustomerModal from "../components/EditCustomerModal";
import { color, tw } from "../../../shared/utils/utils";
import { useLanguage } from "../../../contexts/LanguageContext";
import { useToast } from "../../../contexts/ToastContext";
import { PermissionGate } from "../../auth/components/PermissionGate";

const pageSize = 20;

export default function CustomersPage() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { success: showSuccess, error: showError } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isTimeout, setIsTimeout] = useState(false);
  const [page, setPage] = useState(1);

  // Delete confirmation modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [customerToDelete, setCustomerToDelete] =
    useState<CustomerSubscriptionRecord | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Search modal state
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [modalSearchTerm, setModalSearchTerm] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  // Customer creation/edit modal state
  const [isCreateCustomerModalOpen, setIsCreateCustomerModalOpen] =
    useState(false);
  const [editingCustomer, setEditingCustomer] =
    useState<CustomerSubscriptionRecord | null>(null);
  const [customers, setCustomers] = useState<CustomerSubscriptionRecord[]>([]);

  // Load customers from API and localStorage on mount
  useEffect(() => {
    const loadCustomers = async () => {
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
              limit: 50,
              offset: 0,
            }),
            timeoutPromise,
          ]);

          if (
            apiResponse.success &&
            apiResponse.data &&
            Array.isArray(apiResponse.data)
          ) {
            // Convert API customers to local format
            const apiCustomers = apiResponse.data.map((apiCustomer) => {
              const customerId =
                typeof apiCustomer.id === "string"
                  ? parseInt(apiCustomer.id, 10)
                  : apiCustomer.id;

              // Try to get subscriber_id from API response, fallback to id
              // This allows for future backend update without frontend change
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
                simType: "2FF",
                activationDate: apiCustomer.created_at,
              };
            });
            setCustomers(apiCustomers);
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
    };

    loadCustomers();
  }, [showError]);

  const dataset = customers;

  useEffect(() => {
    setPage(1);
  }, [searchTerm]);

  // Use shared search function
  const searchCustomers = useCallback(
    (term: string, customers: CustomerSubscriptionRecord[]) => {
      return searchCustomersUtil(term, customers);
    },
    [],
  );

  const filteredCustomers = useMemo(() => {
    let results = customers;

    if (searchTerm.trim()) {
      results = searchCustomers(searchTerm, results);
    }

    return results;
  }, [searchTerm, searchCustomers, customers]);

  // Debounced search results for modal
  const [modalSearchResults, setModalSearchResults] = useState<
    CustomerSubscriptionRecord[]
  >([]);

  useEffect(() => {
    if (!isSearchModalOpen) {
      setModalSearchTerm("");
      setModalSearchResults([]);
      return;
    }

    if (!modalSearchTerm.trim()) {
      setModalSearchResults([]);
      return;
    }

    setIsSearching(true);
    const debounceTimer = setTimeout(() => {
      const results = searchCustomers(modalSearchTerm, dataset);
      // Limit to top 50 results for performance
      setModalSearchResults(results.slice(0, 50));
      setIsSearching(false);
    }, 400); // 400ms debounce

    return () => {
      clearTimeout(debounceTimer);
      setIsSearching(false);
    };
  }, [modalSearchTerm, dataset, isSearchModalOpen, searchCustomers]);

  const totalResults = filteredCustomers.length;
  const totalPages = Math.max(1, Math.ceil(totalResults / pageSize));
  const paginatedResults = useMemo(
    () =>
      filteredCustomers.slice((page - 1) * pageSize, page * pageSize) as
        | CustomerSubscriptionRecord[]
        | [],
    [filteredCustomers, page],
  );

  const hasSearchFilters = searchTerm.trim().length > 0;

  const formatNumber = (value: number) =>
    value.toLocaleString("en-US", { maximumFractionDigits: 0 });

  const customerStats = useMemo(() => {
    if (!dataset.length) {
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
      uniqueCustomers: uniqueCustomers.size,
      totalSubscriptions: dataset.length,
      activeSubscriptions,
      pendingActivations,
      atRiskSubscriptions,
      avgTenureDays:
        tenureSamples > 0 ? Math.round(tenureDaysTotal / tenureSamples) : 0,
    };
  }, [dataset]);

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
    const params = new URLSearchParams();
    params.set("customerId", derivedCustomer.id);
    params.set("source", "customers");

    navigate(
      `/dashboard/reports/customer-profiles/search?${params.toString()}`,
      {
        state: {
          customer: derivedCustomer,
          subscription: customerToSelect,
          source: "customers" as const,
        },
      },
    );
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
        console.warn(`Skipped ${duplicateCount} duplicate customer(s)`);
      }

      // Prepend new customers to show at top of first page
      return [...uniqueNewCustomers, ...prevCustomers];
    });
    setPage(1); // Reset to first page to show newly added customers
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

      // Remove customer from local state
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

  const handleOpenSearchModal = () => {
    setModalSearchTerm(searchTerm); // Pre-fill with current search if exists
    setIsSearchModalOpen(true);
  };

  const handleCloseSearchModal = () => {
    setIsSearchModalOpen(false);
    setModalSearchTerm("");
    setModalSearchResults([]);
  };

  const handleApplySearch = () => {
    setSearchTerm(modalSearchTerm);
    handleCloseSearchModal();
  };

  const handleSelectCustomerFromModal = (
    customer: CustomerSubscriptionRecord,
  ) => {
    handleCloseSearchModal();
    handleSelectCustomer(customer);
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
              t.customer360.tariff,
              t.customer360.simType,
              t.customer360.activationDate,
            ]}
            rows={filteredCustomers.map((row) => [
              row.subscriptionId,
              formatMsisdn(row.msisdn),
              getSubscriptionDisplayName(row, `Customer ${row.customerId}`),
              row.customerType || "—",
              row.status || "Unknown",
              row.tariff || "—",
              row.simType || "—",
              row.activationDate || "—",
            ])}
            filename="customers_360"
            label="Download CSV"
            disabled={filteredCustomers.length === 0}
            className={`${tw.button} inline-flex items-center gap-2`}
          />
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleOpenSearchModal}
              className={`${tw.button} inline-flex items-center gap-2`}
            >
              <Search className="h-4 w-4" />
              {searchTerm ? (
                <span className="truncate max-w-[140px]">
                  {t.customer360.searchCustomer}: {searchTerm}
                </span>
              ) : (
                t.customer360.searchCustomer
              )}
            </button>
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm("")}
                className={`p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 ${tw.rounded} transition-colors`}
                title={t.customer360.clearSearch}
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
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

      {/* Table card */}
      <div>
        {isLoading || isDeleting ? (
          <div className="flex flex-col items-center justify-center py-16">
            <LoadingSpinner
              variant="modern"
              size="xl"
              color="primary"
              className="mb-4"
            />
            <p className={`${tw.textMuted} font-medium text-sm`}>
              {isDeleting
                ? "Deleting customer..."
                : t.customer360.preparingCustomerData}
            </p>
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
                    t.customer360.tariff,
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
                        {row.tariff ?? "—"}
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
                        className="rounded-r-md px-6 py-5 text-sm text-right"
                        style={cellBackground}
                      >
                        <div className="flex items-center justify-end gap-2">
                          <PermissionGate permission="customer.read">
                            <button
                              type="button"
                              onClick={() => handleViewCustomer(row)}
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
                          {/* Delete button - commented out as CVM platforms typically don't delete customers */}
                          {/* <PermissionGate permission="customer.delete">
                            <button
                              type="button"
                              onClick={() => handleDeleteCustomer(row)}
                              className="inline-flex items-center justify-center p-2 text-red-600 hover:text-red-800 transition-colors"
                              title="Delete customer"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </PermissionGate> */}
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
        {!isLoading && !error && paginatedResults.length > 0 && (
          <div
            className={`${tw.rounded} border border-gray-100 bg-white px-4 py-3 shadow-sm sm:flex sm:items-center sm:justify-between`}
          >
            <p className={`${tw.textSecondary} text-sm`}>
              {t.customerProfileReports.page
                .replace("{current}", page.toString())
                .replace("{total}", totalPages.toString())}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                disabled={page === 1}
                className={`flex items-center gap-1 ${tw.rounded} border border-gray-200 px-3 py-2 text-sm text-gray-600 disabled:cursor-not-allowed disabled:opacity-50`}
              >
                <ChevronLeft className="h-4 w-4" />
                {t.customer360.previous}
              </button>
              <button
                onClick={() =>
                  setPage((prev) => Math.min(totalPages, prev + 1))
                }
                disabled={page >= totalPages}
                className={`flex items-center gap-1 ${tw.rounded} border border-gray-200 px-3 py-2 text-sm text-gray-600 disabled:cursor-not-allowed disabled:opacity-50`}
              >
                {t.customer360.next}
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Search Customer Modal */}
      <RegularModal
        isOpen={isSearchModalOpen}
        onClose={handleCloseSearchModal}
        title={t.customer360.searchCustomer}
        size="xl"
      >
        <div className="space-y-4">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={modalSearchTerm}
              onChange={(e) => setModalSearchTerm(e.target.value)}
              placeholder={t.customer360.searchPlaceholder}
              className={`w-full ${tw.rounded} border border-gray-300 py-3 pl-10 pr-3 text-sm focus:border-gray-400 focus:outline-none focus:ring-2 focus:ring-[--accent-color]`}
              style={
                {
                  "--accent-color": `${color.primary.accent}33`,
                } as CSSProperties
              }
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter" && modalSearchTerm.trim()) {
                  handleApplySearch();
                }
              }}
            />
          </div>

          {/* Helper Text */}
          <p className="text-xs text-gray-500">
            Search by customer name, ID, email address, MSISDN, or phone number.
          </p>

          {/* Search Results */}
          <div
            className={`max-h-[400px] overflow-y-auto border border-gray-200 ${tw.rounded}`}
          >
            {isSearching ? (
              <div className="flex flex-col items-center justify-center py-12">
                <LoadingSpinner variant="modern" size="md" />
                <p className={`${tw.textMuted} mt-3 text-sm`}>
                  {t.customerProfileReports.searching}
                </p>
              </div>
            ) : modalSearchTerm.trim() && modalSearchResults.length === 0 ? (
              <div className="px-6 py-12 text-center">
                <p className="text-sm text-gray-500">
                  {t.customer360.noResultsFound}
                </p>
                <p className="text-xs text-gray-400 mt-2">
                  Try a different search term or check your spelling
                </p>
              </div>
            ) : modalSearchTerm.trim() && modalSearchResults.length > 0 ? (
              <div className="divide-y divide-gray-200">
                {modalSearchResults.length > 50 && (
                  <div className="px-4 py-2 bg-yellow-50 border-b border-yellow-200">
                    <p className="text-xs text-yellow-800">
                      Showing top 50 results. Use filters to narrow down your
                      search.
                    </p>
                  </div>
                )}
                {modalSearchResults.map((customer) => (
                  <button
                    key={`${customer.customerId}-${customer.subscriptionId}`}
                    onClick={() => handleSelectCustomerFromModal(customer)}
                    className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors focus:outline-none focus:bg-gray-50"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">
                          {getSubscriptionDisplayName(
                            customer,
                            `Customer ${customer.customerId}`,
                          )}
                        </p>
                        <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
                          {/* <span>Sub #{customer.subscriptionId}</span> */}
                          {customer.msisdn && (
                            <span>MSISDN: {formatMsisdn(customer.msisdn)}</span>
                          )}
                          {customer.tariff && <span>{customer.tariff}</span>}
                          {customer.city && <span>{customer.city}</span>}
                        </div>
                      </div>
                      <Eye className="h-4 w-4 text-gray-400 ml-2 flex-shrink-0" />
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="px-6 py-12 text-center">
                <Search className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-500">
                  Start typing to search for customers
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  You can search by name, ID, email, MSISDN, or phone number
                </p>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-2 border-t border-gray-200">
            <button
              type="button"
              onClick={handleCloseSearchModal}
              className={`px-4 py-2 text-sm text-gray-700 bg-gray-100 hover:bg-gray-200 ${tw.rounded} transition-colors`}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleApplySearch}
              disabled={!modalSearchTerm.trim()}
              className={`px-4 py-2 text-sm text-white ${tw.rounded} transition-all disabled:opacity-50 disabled:cursor-not-allowed`}
              style={{ backgroundColor: color.primary.action }}
            >
              Apply Search
            </button>
          </div>
        </div>
      </RegularModal>

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

      {/* Advanced filters modal */}
    </div>
  );
}
