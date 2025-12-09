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
  X,
} from "lucide-react";
import type { CustomerSubscriptionRecord } from "../types/customerSubscription";
import {
  convertSubscriptionToCustomerRow,
  formatDateTime,
  formatMsisdn,
  getSubscriptionDisplayName,
} from "../utils/customerSubscriptionHelpers";
import {
  customerSubscriptions,
  searchCustomers as searchCustomersUtil,
} from "../utils/customerDataService";
import LoadingSpinner from "../../../shared/components/ui/LoadingSpinner";
import RegularModal from "../../../shared/components/ui/RegularModal";
import { color, tw } from "../../../shared/utils/utils";

const pageSize = 10;

export default function CustomersPage() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);

  // Search modal state
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [modalSearchTerm, setModalSearchTerm] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const dataset = customerSubscriptions;

  // Simulate async loading when inputs change (placeholder until API wiring exists)
  useEffect(() => {
    setIsLoading(true);
    setError("");
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    setPage(1);
  }, [searchTerm]);

  // Use shared search function
  const searchCustomers = useCallback(
    (term: string, customers: CustomerSubscriptionRecord[]) => {
      return searchCustomersUtil(term, customers);
    },
    []
  );

  const filteredCustomers = useMemo(() => {
    let results = customerSubscriptions;

    if (searchTerm.trim()) {
      results = searchCustomers(searchTerm, results);
    }

    return results;
  }, [searchTerm, searchCustomers]);

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
    [filteredCustomers, page]
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
        title: "Unique Customers",
        value: formatNumber(customerStats.uniqueCustomers),
        helper: `${formatNumber(
          customerStats.totalSubscriptions
        )} total subscriptions`,
        icon: Users,
      },
      {
        title: "Active Subscriptions",
        value: formatNumber(customerStats.activeSubscriptions),
        helper:
          customerStats.totalSubscriptions > 0
            ? `${Math.round(
                (customerStats.activeSubscriptions /
                  customerStats.totalSubscriptions) *
                  100
              )}% of base`
            : "—",
        icon: Activity,
      },
      {
        title: "Pending Activations",
        value: formatNumber(customerStats.pendingActivations),
        helper:
          customerStats.totalSubscriptions > 0
            ? `${Math.round(
                (customerStats.pendingActivations /
                  customerStats.totalSubscriptions) *
                  100
              )}% awaiting SIM swap`
            : "—",
        icon: AlertTriangle,
      },
      {
        title: "Avg Tenure (days)",
        value: formatNumber(customerStats.avgTenureDays),
        helper: "Since activation",
        icon: Target,
      },
    ],
    [customerStats]
  );

  const handleSelectCustomer = (
    customerToSelect: CustomerSubscriptionRecord
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
      }
    );
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
    customer: CustomerSubscriptionRecord
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
          <h1 className={`${tw.mainHeading} mt-2`}>Customer 360 Profile</h1>
          <p className={`${tw.textSecondary} mt-2 text-sm`}>
            Manage all customers from a single workspace.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3 justify-start lg:justify-end">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleOpenSearchModal} 
              className={`${tw.button} inline-flex items-center gap-2`}
            >
              <Search className="h-4 w-4" />
              {searchTerm ? (
                <span className="truncate max-w-[140px]">
                  Search: {searchTerm}
                </span>
              ) : (
                "Search Customer"
              )}
            </button>
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm("")}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                title="Clear search"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <button className={`${tw.button} flex items-center gap-2`}>
            <Plus className="h-4 w-4" />
            Add Customer
          </button>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {statCards.map(({ title, value, helper, icon: Icon }) => (
          <div
            key={title}
            className="rounded-md border border-gray-100 bg-white p-5 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <p className={`${tw.textMuted} text-xs font-semibold uppercase`}>
                {title}
              </p>
              <div
                className="rounded-full p-2"
                style={{ backgroundColor: `${color.primary.accent}20` }}
              >
                <Icon
                  className="h-4 w-4"
                  style={{ color: color.primary.accent }}
                />
              </div>
            </div>
            <p className="mt-3 text-2xl font-bold text-gray-900">{value}</p>
            <p className={`${tw.textSecondary} mt-1 text-xs`}>{helper}</p>
          </div>
        ))}
      </div>

      {/* Table card */}
      <div>
        {error ? (
          <div className="px-6 py-10 text-center text-sm text-red-500">
            {error}
          </div>
        ) : isLoading ? (
          <div className="flex flex-col items-center justify-center px-6 py-16">
            <LoadingSpinner variant="modern" size="lg" />
            <p className={`${tw.textMuted} mt-4 text-sm`}>
              Preparing customer data...
            </p>
          </div>
        ) : paginatedResults.length === 0 ? (
          <div className="px-6 py-16 text-center text-sm text-gray-500">
            {hasSearchFilters
              ? "No customers match your search. Try a different query."
              : "Start by searching for a customer above."}
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
                    "Customer",
                    "MSISDN",
                    "Subscription ID",
                    "Customer Type",
                    "Tariff",
                    "SIM Type",
                    "Status",
                    "Activation Date",
                    "City",
                    "Actions",
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
                {paginatedResults.map((row) => {
                  const name = getSubscriptionDisplayName(
                    row,
                    `Customer ${row.customerId}`
                  );
                  const status = row.status ?? "Unknown";
                  const statusLower = status.toLowerCase();
                  const statusStyles =
                    statusLower === "active"
                      ? "bg-emerald-50 text-emerald-700"
                      : statusLower === "pending"
                      ? "bg-amber-50 text-amber-700"
                      : "bg-gray-100 text-gray-700";

                  return (
                    <tr key={`${row.customerId}-${row.subscriptionId}`}>
                      <td
                        className="rounded-l-md px-6 py-5"
                        style={cellBackground}
                      >
                        <button
                          type="button"
                          onClick={() => handleSelectCustomer(row)}
                          className="text-left"
                        >
                          <p className="font-semibold text-gray-900 hover:underline">
                            {name}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            Customer #{row.customerId}
                          </p>
                          {row.email && (
                            <p className="text-xs text-gray-500 mt-0.5 truncate">
                              {row.email}
                            </p>
                          )}
                        </button>
                      </td>
                      <td
                        className="px-6 py-5 text-gray-900"
                        style={cellBackground}
                      >
                        {formatMsisdn(row.msisdn)}
                      </td>
                      <td
                        className="px-6 py-5 text-gray-900"
                        style={cellBackground}
                      >
                        {row.subscriptionId}
                      </td>
                      <td
                        className="px-6 py-5 text-gray-900"
                        style={cellBackground}
                      >
                        {row.customerType ?? "—"}
                      </td>
                      <td
                        className="px-6 py-5 text-gray-900"
                        style={cellBackground}
                      >
                        {row.tariff ?? "—"}
                      </td>
                      <td
                        className="px-6 py-5 text-gray-900"
                        style={cellBackground}
                      >
                        {row.simType ?? "—"}
                      </td>
                      <td className="px-6 py-5" style={cellBackground}>
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-semibold ${statusStyles}`}
                        >
                          {status}
                        </span>
                      </td>
                      <td
                        className="px-6 py-5 text-gray-900"
                        style={cellBackground}
                      >
                        {formatDateTime(row.activationDate)}
                      </td>
                      <td
                        className="px-6 py-5 text-gray-900"
                        style={cellBackground}
                      >
                        {row.city ?? "—"}
                      </td>
                      <td
                        className="rounded-r-md px-6 py-5 text-right"
                        style={cellBackground}
                      >
                        <button
                          type="button"
                          onClick={() => handleSelectCustomer(row)}
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
        )}

        {/* Pagination */}
        {!isLoading && !error && paginatedResults.length > 0 && (
          <div className="rounded-md border border-gray-100 bg-white px-4 py-3 shadow-sm sm:flex sm:items-center sm:justify-between">
            <p className={`${tw.textSecondary} text-sm`}>
              Page {page} of {totalPages}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                disabled={page === 1}
                className="flex items-center gap-1 rounded-md border border-gray-200 px-3 py-2 text-sm text-gray-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <ChevronLeft className="h-4 w-4" />
                Prev
              </button>
              <button
                onClick={() =>
                  setPage((prev) => Math.min(totalPages, prev + 1))
                }
                disabled={page >= totalPages}
                className="flex items-center gap-1 rounded-md border border-gray-200 px-3 py-2 text-sm text-gray-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Next
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
        title="Search Customer"
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
              placeholder="Enter customer name, ID, email, MSISDN, or phone number..."
              className="w-full rounded-md border border-gray-300 py-3 pl-10 pr-3 text-sm focus:border-gray-400 focus:outline-none focus:ring-2 focus:ring-[--accent-color]"
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
          <div className="max-h-[400px] overflow-y-auto border border-gray-200 rounded-md">
            {isSearching ? (
              <div className="flex flex-col items-center justify-center py-12">
                <LoadingSpinner variant="modern" size="md" />
                <p className={`${tw.textMuted} mt-3 text-sm`}>
                  Searching customers...
                </p>
              </div>
            ) : modalSearchTerm.trim() && modalSearchResults.length === 0 ? (
              <div className="px-6 py-12 text-center">
                <p className="text-sm text-gray-500">
                  No customers found matching "{modalSearchTerm}"
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
                            `Customer ${customer.customerId}`
                          )}
                        </p>
                        <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
                          <span>ID: {customer.customerId}</span>
                          <span>Sub #{customer.subscriptionId}</span>
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
              className="px-4 py-2 text-sm text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleApplySearch}
              disabled={!modalSearchTerm.trim()}
              className="px-4 py-2 text-sm text-white rounded-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: color.primary.action }}
            >
              Apply Search
            </button>
          </div>
        </div>
      </RegularModal>

      {/* Advanced filters modal */}
    </div>
  );
}
