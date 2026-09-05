import { useEffect, useMemo, useState } from "react";
import { CheckCircle, Headset, RotateCcw, Ticket } from "lucide-react";
import DateFormatter from "../../../shared/components/DateFormatter";
import HeadlessSelect from "../../../shared/components/ui/HeadlessSelect";
import LoadingSpinner from "../../../shared/components/ui/LoadingSpinner";
import Pagination, {
  DEFAULT_PAGE_SIZE,
} from "../../../shared/components/ui/Pagination";
import SearchInput from "../../../shared/components/ui/SearchInput";
import { Table, type TableColumn } from "../../../shared/components/Table";
import { color, tw } from "../../../shared/utils/utils";
import { useCustomerInteractions } from "../hooks/useCustomerInteractions";
import type {
  CustomerInteractionItem,
  CustomerInteractionStatus,
} from "../types/customerInteraction";
import {
  filterInteractions,
  humanizeInteractionKind,
  humanizeInteractionStatus,
  latestInteractionAt,
  uniqueInteractionKinds,
  uniqueInteractionStatuses,
} from "../utils/customerInteractionHelpers";
import CustomerInteractionDetailsExpandedRow from "./CustomerInteractionDetailsExpandedRow";

type CustomerInteractionsTabProps = {
  subscriberId?: string | number | null;
  customerRecord?: Record<string, unknown> | null;
};

const ALL = "all";

function statusClassName(status: CustomerInteractionStatus): string {
  if (status === "resolved") return "bg-green-50 text-green-800";
  if (status === "in_progress" || status === "pending") {
    return "bg-amber-50 text-amber-800";
  }
  if (status === "open") return "bg-sky-50 text-sky-800";
  return "bg-gray-100 text-gray-700";
}

function progressLabel(
  phase: "lookup" | "events",
  checked: number,
  total: number,
): string {
  if (phase === "lookup") return "Checking subscriber tickets and call logs...";
  return total > 0
    ? `Checking live care events (${checked.toLocaleString()} of ${total.toLocaleString()})...`
    : "Checking live care events...";
}

export default function CustomerInteractionsTab({
  subscriberId,
  customerRecord,
}: CustomerInteractionsTabProps) {
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

  const { result, progress, isLoading, error, refetch } = useCustomerInteractions(
    subscriberId ?? undefined,
    customerRecord,
  );

  const filtered = useMemo(
    () =>
      filterInteractions(result.interactions, {
        search: debouncedSearch,
        status,
        kind,
      }),
    [result.interactions, debouncedSearch, status, kind],
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
      ...uniqueInteractionStatuses(result.interactions).map((item) => ({
        value: item,
        label: humanizeInteractionStatus(item),
      })),
    ],
    [result.interactions],
  );

  const kindOptions = useMemo(
    () => [
      { value: ALL, label: "All types" },
      ...uniqueInteractionKinds(result.interactions).map((item) => ({
        value: item,
        label: humanizeInteractionKind(item),
      })),
    ],
    [result.interactions],
  );

  const paginated = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page, pageSize]);

  const lastActivity = latestInteractionAt(result.interactions);

  const columns: TableColumn<CustomerInteractionItem>[] = useMemo(
    () => [
      {
        id: "ticketId",
        label: "Ticket ID",
        visible: true,
        render: (_, row) => (
          <p className={`text-sm font-medium ${tw.tableFirstColumn}`}>
            {row.ticketId}
          </p>
        ),
      },
      {
        id: "kind",
        label: "Type",
        visible: true,
        render: (_, row) => (
          <span className="text-sm text-gray-700">
            {humanizeInteractionKind(row.kind)}
          </span>
        ),
      },
      {
        id: "subject",
        label: "Subject",
        visible: true,
        render: (_, row) => (
          <div className="min-w-[160px]">
            <p className="text-sm text-gray-900">{row.subject}</p>
            {row.agent ? (
              <p className="text-xs text-gray-500 mt-0.5">{row.agent}</p>
            ) : null}
          </div>
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
            {humanizeInteractionStatus(row.status)}
            {row.verification === "hint" ? " · Unverified" : ""}
          </span>
        ),
      },
      {
        id: "date",
        label: "Date",
        visible: true,
        render: (_, row) =>
          row.occurredAt ? (
            <DateFormatter
              date={row.occurredAt}
              includeTime
              useUserTimezone
              className="text-sm text-gray-700"
            />
          ) : (
            <span className="text-sm text-gray-400">—</span>
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
            Interactions
          </h3>
          <p className="text-sm text-gray-500">
            Support tickets, call logs, and other care contacts for this
            customer.
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
              Interactions
            </p>
            <Headset className="h-4 w-4 text-gray-400" />
          </div>
          <p className="text-2xl font-semibold text-gray-900">
            {isLoading ? "—" : result.counts.total.toLocaleString()}
          </p>
          <p className="mt-1 text-xs text-gray-500">
            {isLoading
              ? "From tickets, call logs, and care events"
              : lastActivity
                ? "Last activity "
                : "No interaction date on file"}
            {!isLoading && lastActivity ? (
              <DateFormatter
                date={lastActivity}
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
              Open
            </p>
            <Ticket className="h-4 w-4 text-gray-400" />
          </div>
          <p className="text-2xl font-semibold text-gray-900">
            {isLoading ? "—" : result.counts.open.toLocaleString()}
          </p>
          <p className="mt-1 text-xs text-gray-500">
            {isLoading
              ? "Tickets still awaiting resolution"
              : `${result.counts.pending.toLocaleString()} pending`}
          </p>
        </div>
        <div className={`${tw.rounded} border border-gray-200 bg-white p-4`}>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              Resolved
            </p>
            <CheckCircle className="h-4 w-4 text-gray-400" />
          </div>
          <p className="text-2xl font-semibold text-gray-900">
            {isLoading ? "—" : result.counts.resolved.toLocaleString()}
          </p>
          <p className="mt-1 text-xs text-gray-500">
            Resolved or closed contacts for this customer
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
        <SearchInput
          placeholder="Search tickets, subjects, or agents..."
          value={searchTerm}
          onChange={setSearchTerm}
        />
        <HeadlessSelect
          value={kind}
          onChange={(value) => setKind(String(value))}
          options={kindOptions}
          placeholder="Type"
          className="w-full"
        />
        <HeadlessSelect
          value={status}
          onChange={(value) => setStatus(String(value))}
          options={statusOptions}
          placeholder="Status"
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
              ? "No interactions match the selected filters"
              : "No support tickets or call logs for this customer"}
          </p>
          <p className="text-gray-500 text-sm mt-1">
            {filtersActive
              ? "Try a different type, status, or search term."
              : result.eventsLive
                ? "Care tickets, complaints, and support calls will appear here after they are recorded."
                : "A subscriber interactions API or live care events are needed before tickets can be shown."}
          </p>
        </div>
      ) : (
        <>
          <p className="text-xs text-gray-500 mb-3">
            Showing {filtered.length.toLocaleString()} interaction
            {filtered.length === 1 ? "" : "s"} for this customer
          </p>
          <div className={`${tw.rounded} overflow-hidden`}>
            <Table<CustomerInteractionItem>
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
                <CustomerInteractionDetailsExpandedRow interaction={row} />
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
