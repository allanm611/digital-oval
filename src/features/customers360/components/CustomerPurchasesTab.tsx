import { useEffect, useMemo, useState } from "react";
import CustomerProfileEntityLink from "../navigation/CustomerProfileEntityLink";
import { CheckCircle, Receipt, RotateCcw, Wallet } from "lucide-react";
import CurrencyFormatter from "../../../shared/components/CurrencyFormatter";
import DateFormatter from "../../../shared/components/DateFormatter";
import HeadlessSelect from "../../../shared/components/ui/HeadlessSelect";
import LoadingSpinner from "../../../shared/components/ui/LoadingSpinner";
import Pagination, {
  DEFAULT_PAGE_SIZE,
} from "../../../shared/components/ui/Pagination";
import SearchInput from "../../../shared/components/ui/SearchInput";
import { Table, type TableColumn } from "../../../shared/components/Table";
import { color, tw } from "../../../shared/utils/utils";
import { useCustomerPurchases } from "../hooks/useCustomerPurchases";
import type {
  CustomerPurchaseItem,
  CustomerPurchaseStatus,
} from "../types/customerPurchase";
import {
  filterPurchases,
  humanizePaymentMethod,
  humanizePurchaseKind,
  humanizePurchaseStatus,
  latestPurchasedAt,
  uniquePurchaseKinds,
  uniquePurchaseStatuses,
} from "../utils/customerPurchaseHelpers";
import CustomerPurchaseDetailsExpandedRow from "./CustomerPurchaseDetailsExpandedRow";

type CustomerPurchasesTabProps = {
  subscriberId?: string | number | null;
  customerRecord?: Record<string, unknown> | null;
};

const ALL = "all";

function statusClassName(status: CustomerPurchaseStatus): string {
  if (status === "completed") return "bg-green-50 text-green-800";
  if (status === "pending") return "bg-amber-50 text-amber-800";
  if (status === "failed") return "bg-red-50 text-red-800";
  if (status === "refunded") return "bg-slate-100 text-slate-800";
  return "bg-gray-100 text-gray-700";
}

function progressLabel(
  phase: "lookup" | "events" | "catalog",
  checked: number,
  total: number,
): string {
  if (phase === "lookup") return "Checking subscriber purchases...";
  if (phase === "events") return "Checking live purchase events...";
  return total > 0
    ? `Loading product and offer catalog (${checked.toLocaleString()} of ${total.toLocaleString()})...`
    : "Loading product and offer catalog...";
}

export default function CustomerPurchasesTab({
  subscriberId,
  customerRecord,
}: CustomerPurchasesTabProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [status, setStatus] = useState(ALL);
  const [kind, setKind] = useState(ALL);
  const [page, setPage] = useState(1);
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);
  const pageSize = DEFAULT_PAGE_SIZE;

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(searchTerm), 300);
    return () => window.clearTimeout(timer);
  }, [searchTerm]);

  const { result, progress, isLoading, error, refetch } = useCustomerPurchases(
    subscriberId ?? undefined,
    customerRecord,
  );

  const filtered = useMemo(
    () =>
      filterPurchases(result.purchases, {
        search: debouncedSearch,
        status,
        kind,
      }),
    [result.purchases, debouncedSearch, status, kind],
  );

  useEffect(() => {
    setPage(1);
    setExpandedRowId(null);
  }, [debouncedSearch, status, kind, subscriberId]);

  const filtersActive =
    Boolean(debouncedSearch.trim()) || status !== ALL || kind !== ALL;

  const statusOptions = useMemo(
    () => [
      { value: ALL, label: "All statuses" },
      ...uniquePurchaseStatuses(result.purchases).map((item) => ({
        value: item,
        label: humanizePurchaseStatus(item),
      })),
    ],
    [result.purchases],
  );

  const kindOptions = useMemo(
    () => [
      { value: ALL, label: "All types" },
      ...uniquePurchaseKinds(result.purchases).map((item) => ({
        value: item,
        label: humanizePurchaseKind(item),
      })),
    ],
    [result.purchases],
  );

  const paginated = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page, pageSize]);

  const lastPurchased = latestPurchasedAt(result.purchases);

  const columns: TableColumn<CustomerPurchaseItem>[] = useMemo(
    () => [
      {
        id: "transactionId",
        label: "Transaction ID",
        visible: true,
        render: (_, row) => (
          <p className={`text-sm font-medium ${tw.tableFirstColumn}`}>
            {row.transactionId}
          </p>
        ),
      },
      {
        id: "product",
        label: "Product / Bundle",
        visible: true,
        render: (_, row) => (
          <div className="min-w-[160px]">
            {row.productId ? (
              <CustomerProfileEntityLink
                to={`/dashboard/products/${row.productId}`}
                className={`text-sm font-medium hover:underline ${tw.tableFirstColumn}`}
              >
                {row.productName}
              </CustomerProfileEntityLink>
            ) : (
              <p className={`text-sm font-medium ${tw.tableFirstColumn}`}>
                {row.productName}
              </p>
            )}
            {row.productCode ? (
              <p className="text-xs text-gray-500 mt-0.5">{row.productCode}</p>
            ) : row.offerName ? (
              <p className="text-xs text-gray-500 mt-0.5">{row.offerName}</p>
            ) : null}
          </div>
        ),
      },
      {
        id: "amount",
        label: "Amount",
        visible: true,
        render: (_, row) =>
          row.amount != null ? (
            <CurrencyFormatter
              amount={row.amount}
              currencyCode={row.currency || undefined}
            />
          ) : (
            <span className="text-sm text-gray-400">—</span>
          ),
      },
      {
        id: "date",
        label: "Date",
        visible: true,
        render: (_, row) =>
          row.purchasedAt ? (
            <DateFormatter
              date={row.purchasedAt}
              includeTime
              useUserTimezone
              className="text-sm text-gray-700"
            />
          ) : (
            <span className="text-sm text-gray-400">—</span>
          ),
      },
      {
        id: "status",
        label: "Status",
        visible: true,
        render: (_, row) => (
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusClassName(
              row.status,
            )}`}
          >
            {humanizePurchaseStatus(row.status)}
            {row.verification === "hint" ? " · Unverified" : ""}
          </span>
        ),
      },
      {
        id: "paymentMethod",
        label: "Payment Method",
        visible: true,
        render: (_, row) => (
          <span className="text-sm text-gray-700">
            {humanizePaymentMethod(row.paymentMethod)}
          </span>
        ),
      },
    ],
    [],
  );

  const clearFilters = () => {
    setSearchTerm("");
    setDebouncedSearch("");
    setStatus(ALL);
    setKind(ALL);
  };

  if (!subscriberId) {
    return (
      <div className="py-12 text-center">
        <p className="text-gray-500 text-sm">No customer selected</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">
            Purchase History
          </h3>
          <p className="text-sm text-gray-500">
            Transactions and purchase records for this customer.
          </p>
        </div>
        <button
          type="button"
          onClick={() => refetch()}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-700 border border-gray-200 ${tw.rounded} hover:bg-gray-50`}
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        <div className={`${tw.rounded} border border-gray-200 bg-white p-4`}>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              Transactions
            </p>
            <Receipt className="h-4 w-4 text-gray-400" />
          </div>
          <p className="text-2xl font-semibold text-gray-900">
            {isLoading ? "—" : result.counts.total.toLocaleString()}
          </p>
          <p className="mt-1 text-xs text-gray-500">
            {isLoading
              ? "From billing, events, and catalog"
              : lastPurchased
                ? "Last purchase "
                : "No purchase date on file"}
            {!isLoading && lastPurchased ? (
              <DateFormatter
                date={lastPurchased}
                includeTime
                useUserTimezone
                className="text-xs text-gray-500"
              />
            ) : null}
          </p>
        </div>
        <div className={`${tw.rounded} border border-gray-200 bg-white p-4`}>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              Completed spend
            </p>
            <Wallet className="h-4 w-4 text-gray-400" />
          </div>
          <p className="text-2xl font-semibold text-gray-900">
            {isLoading ? (
              "—"
            ) : (
              <CurrencyFormatter amount={result.counts.totalSpend} />
            )}
          </p>
          <p className="mt-1 text-xs text-gray-500">
            Completed transactions with a recorded amount
          </p>
        </div>
        <div className={`${tw.rounded} border border-gray-200 bg-white p-4`}>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              Completed
            </p>
            <CheckCircle className="h-4 w-4 text-gray-400" />
          </div>
          <p className="text-2xl font-semibold text-gray-900">
            {isLoading ? "—" : result.counts.completed.toLocaleString()}
          </p>
          <p className="mt-1 text-xs text-gray-500">
            {isLoading
              ? "Successful purchases for this customer"
              : `${result.counts.pending.toLocaleString()} pending · ${result.counts.failed.toLocaleString()} failed`}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
        <SearchInput
          placeholder="Search transactions, products, or offers..."
          value={searchTerm}
          onChange={setSearchTerm}
        />
        <HeadlessSelect
          value={status}
          onChange={(value) => setStatus(String(value))}
          options={statusOptions}
          placeholder="Status"
          className="w-full"
        />
        <HeadlessSelect
          value={kind}
          onChange={(value) => setKind(String(value))}
          options={kindOptions}
          placeholder="Type"
          className="w-full"
        />
      </div>

      {filtersActive && (
        <div className="mb-4">
          <button
            type="button"
            onClick={clearFilters}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-700 border border-gray-200 ${tw.rounded} hover:bg-gray-50`}
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reset filters
          </button>
        </div>
      )}

      {error && (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 flex items-center justify-between gap-3">
          <span>{error}</span>
          <button
            type="button"
            onClick={() => refetch()}
            className="font-medium underline"
          >
            Retry
          </button>
        </div>
      )}

      {result.warnings.length > 0 && !isLoading && (
        <div className="mb-4 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {result.warnings.map((warning) => (
            <p key={warning}>{warning}</p>
          ))}
        </div>
      )}

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-16">
          <LoadingSpinner variant="modern" size="lg" color="primary" />
          <p className="mt-3 text-sm text-gray-500">
            {progressLabel(progress.phase, progress.checked, progress.total)}
          </p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-12 text-center border border-dashed border-gray-200 rounded-md">
          <p className="text-gray-700 text-sm font-medium">
            {filtersActive
              ? "No purchases match the selected filters"
              : "No purchase records for this customer"}
          </p>
          <p className="text-gray-500 text-sm mt-1">
            {filtersActive
              ? "Try a different status, type, or search term."
              : result.eventsLive
                ? "Live purchase events and billing records will appear here after a transaction is recorded."
                : "A subscriber purchases API or live purchase events are needed before transactions can be shown."}
          </p>
        </div>
      ) : (
        <>
          <p className="text-xs text-gray-500 mb-3">
            Showing {filtered.length.toLocaleString()} transaction
            {filtered.length === 1 ? "" : "s"} for this customer
          </p>
          <div className={`${tw.rounded} overflow-hidden`}>
            <Table<CustomerPurchaseItem>
              columns={columns}
              data={paginated}
              totalItems={filtered.length}
              currentPage={page}
              pageSize={pageSize}
              onPageChange={(nextPage) => {
                setPage(nextPage);
                setExpandedRowId(null);
              }}
              getRowId={(row) => row.id}
              expandedRowId={expandedRowId}
              onExpandChange={(rowId) =>
                setExpandedRowId(rowId == null ? null : String(rowId))
              }
              expandedContent={(row) => (
                <CustomerPurchaseDetailsExpandedRow purchase={row} />
              )}
              style={{
                headerBackground: color.surface.tableHeader,
                headerTextColor: color.surface.tableHeaderText,
                rowBackground: color.surface.tablebodybg,
                rowSpacing: "0 8px",
              }}
            />
          </div>
          {filtered.length > pageSize && (
            <div className="mt-4">
              <Pagination
                currentPage={page}
                pageSize={pageSize}
                totalItems={filtered.length}
                onPageChange={(nextPage) => {
                  setPage(nextPage);
                  setExpandedRowId(null);
                }}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}
