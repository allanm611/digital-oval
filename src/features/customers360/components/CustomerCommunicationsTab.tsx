import { useEffect, useMemo, useState } from "react";
import CustomerProfileEntityLink from "../navigation/CustomerProfileEntityLink";
import { Mail, RotateCcw, Send, XCircle } from "lucide-react";
import DateFormatter from "../../../shared/components/DateFormatter";
import HeadlessSelect from "../../../shared/components/ui/HeadlessSelect";
import LoadingSpinner from "../../../shared/components/ui/LoadingSpinner";
import Pagination, {
  DEFAULT_PAGE_SIZE,
} from "../../../shared/components/ui/Pagination";
import SearchInput from "../../../shared/components/ui/SearchInput";
import { Table, type TableColumn } from "../../../shared/components/Table";
import { color, tw } from "../../../shared/utils/utils";
import { useCustomerCommunications } from "../hooks/useCustomerCommunications";
import type {
  CustomerCommunicationItem,
  CustomerCommunicationStatus,
} from "../types/customerCommunication";
import {
  filterCommunications,
  humanizeCommunicationChannel,
  humanizeCommunicationOrigin,
  humanizeCommunicationStatus,
  latestSentAt,
  uniqueChannels,
  uniqueOrigins,
  uniqueStatuses,
} from "../utils/customerCommunicationHelpers";
import CustomerCommunicationDetailsExpandedRow from "./CustomerCommunicationDetailsExpandedRow";

type CustomerCommunicationsTabProps = {
  subscriberId?: string | number | null;
  customerRecord?: Record<string, unknown> | null;
  refreshToken?: number;
};

const ALL = "all";

function statusClassName(status: CustomerCommunicationStatus): string {
  if (["delivered", "opened", "clicked", "read"].includes(status)) {
    return "bg-green-50 text-green-800";
  }
  if (["failed", "bounced"].includes(status)) {
    return "bg-red-50 text-red-800";
  }
  if (status === "sent") return "bg-sky-50 text-sky-800";
  return "bg-amber-50 text-amber-800";
}

function progressLabel(
  phase: "lookup" | "logs" | "broadcasts" | "events",
  checked: number,
  total: number,
): string {
  if (phase === "lookup") return "Checking subscriber communications...";
  if (phase === "logs") return "Matching communication delivery logs...";
  if (phase === "broadcasts") {
    return total > 0
      ? `Checking campaign broadcasts (${checked.toLocaleString()} of ${total.toLocaleString()})...`
      : "Finding campaign broadcasts for this customer...";
  }
  return "Checking live outbound events...";
}

export default function CustomerCommunicationsTab({
  subscriberId,
  customerRecord,
  refreshToken = 0,
}: CustomerCommunicationsTabProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [channel, setChannel] = useState(ALL);
  const [status, setStatus] = useState(ALL);
  const [origin, setOrigin] = useState(ALL);
  const [page, setPage] = useState(1);
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);
  const pageSize = DEFAULT_PAGE_SIZE;

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(searchTerm), 300);
    return () => window.clearTimeout(timer);
  }, [searchTerm]);

  const { result, progress, isLoading, error, refetch } =
    useCustomerCommunications(
      subscriberId ?? undefined,
      customerRecord,
      refreshToken,
    );

  const filtered = useMemo(
    () =>
      filterCommunications(result.communications, {
        search: debouncedSearch,
        channel,
        status,
        origin,
      }),
    [result.communications, debouncedSearch, channel, status, origin],
  );

  useEffect(() => {
    setPage(1);
    setExpandedRowId(null);
  }, [debouncedSearch, channel, status, origin, subscriberId]);

  const filtersActive =
    Boolean(debouncedSearch.trim()) ||
    channel !== ALL ||
    status !== ALL ||
    origin !== ALL;

  const channelOptions = useMemo(
    () => [
      { value: ALL, label: "All channels" },
      ...uniqueChannels(result.communications).map((item) => ({
        value: item,
        label: humanizeCommunicationChannel(item),
      })),
    ],
    [result.communications],
  );

  const statusOptions = useMemo(
    () => [
      { value: ALL, label: "All statuses" },
      ...uniqueStatuses(result.communications).map((item) => ({
        value: item,
        label: humanizeCommunicationStatus(item),
      })),
    ],
    [result.communications],
  );

  const originOptions = useMemo(
    () => [
      { value: ALL, label: "All sources" },
      ...uniqueOrigins(result.communications).map((item) => ({
        value: item,
        label: humanizeCommunicationOrigin(item),
      })),
    ],
    [result.communications],
  );

  const paginated = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page, pageSize]);

  const lastSent = latestSentAt(result.communications);

  const columns: TableColumn<CustomerCommunicationItem>[] = useMemo(
    () => [
      {
        id: "subject",
        label: "Subject",
        visible: true,
        render: (_, row) => (
          <div className="min-w-[180px]">
            <p className={`text-sm font-medium ${tw.tableFirstColumn}`}>
              {row.subject}
            </p>
            {row.body ? (
              <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">
                {row.body}
              </p>
            ) : null}
          </div>
        ),
      },
      {
        id: "channel",
        label: "Channel",
        visible: true,
        render: (_, row) => (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800">
            {humanizeCommunicationChannel(row.channel)}
          </span>
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
            {humanizeCommunicationStatus(row.status)}
            {row.verification === "hint" ? " · Unverified" : ""}
          </span>
        ),
      },
      {
        id: "sentAt",
        label: "Sent Date",
        visible: true,
        render: (_, row) =>
          row.sentAt ? (
            <DateFormatter
              date={row.sentAt}
              includeTime
              useUserTimezone
              className="text-sm text-gray-700"
            />
          ) : (
            <span className="text-sm text-gray-400">—</span>
          ),
      },
      {
        id: "campaignName",
        label: "Campaign",
        visible: true,
        render: (_, row) =>
          row.campaignId ? (
            <CustomerProfileEntityLink
              to={`/dashboard/campaigns/${row.campaignId}`}
              className="text-sm font-medium hover:underline"
              style={{ color: color.primary.action }}
            >
              {row.campaignName || `Campaign #${row.campaignId}`}
            </CustomerProfileEntityLink>
          ) : (
            <span className="text-sm text-gray-400">
              {row.origin === "manual" ? "Manual send" : "—"}
            </span>
          ),
      },
    ],
    [],
  );

  const clearFilters = () => {
    setSearchTerm("");
    setDebouncedSearch("");
    setChannel(ALL);
    setStatus(ALL);
    setOrigin(ALL);
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
            Communication History
          </h3>
          <p className="text-sm text-gray-500">
            Messages sent to this customer across all channels — campaign
            broadcasts, manual sends, and system messages.
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
              Sent
            </p>
            <Send className="h-4 w-4 text-gray-400" />
          </div>
          <p className="text-2xl font-semibold text-gray-900">
            {isLoading ? "—" : result.counts.total.toLocaleString()}
          </p>
          <p className="mt-1 text-xs text-gray-500">
            {isLoading
              ? "Outbound messages for this customer"
              : lastSent
                ? "Last sent "
                : "No send date on file"}
            {!isLoading && lastSent ? (
              <DateFormatter
                date={lastSent}
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
              Delivered
            </p>
            <Mail className="h-4 w-4 text-gray-400" />
          </div>
          <p className="text-2xl font-semibold text-gray-900">
            {isLoading ? "—" : result.counts.delivered.toLocaleString()}
          </p>
          <p className="mt-1 text-xs text-gray-500">
            Sent, delivered, opened, or clicked
          </p>
        </div>
        <div className={`${tw.rounded} border border-gray-200 bg-white p-4`}>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              Failed
            </p>
            <XCircle className="h-4 w-4 text-gray-400" />
          </div>
          <p className="text-2xl font-semibold text-gray-900">
            {isLoading ? "—" : result.counts.failed.toLocaleString()}
          </p>
          <p className="mt-1 text-xs text-gray-500">
            Failed or bounced deliveries
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
        <SearchInput
          placeholder="Search subject, campaign, or recipient..."
          value={searchTerm}
          onChange={setSearchTerm}
        />
        <HeadlessSelect
          value={channel}
          onChange={(value) => setChannel(String(value))}
          options={channelOptions}
          placeholder="Channel"
          className="w-full"
        />
        <HeadlessSelect
          value={status}
          onChange={(value) => setStatus(String(value))}
          options={statusOptions}
          placeholder="Status"
          className="w-full"
        />
        <HeadlessSelect
          value={origin}
          onChange={(value) => setOrigin(String(value))}
          options={originOptions}
          placeholder="Source"
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
              ? "No communications match the selected filters"
              : "No communications have been sent to this customer"}
          </p>
          <p className="text-gray-500 text-sm mt-1">
            {filtersActive
              ? "Try a different channel, status, source, or search term."
              : "Campaign broadcasts, manual sends, and system messages will appear here after they are delivered."}
          </p>
        </div>
      ) : (
        <>
          <p className="text-xs text-gray-500 mb-3">
            Showing {filtered.length.toLocaleString()} communication
            {filtered.length === 1 ? "" : "s"} sent to this customer
          </p>
          <div className={`${tw.rounded} overflow-hidden`}>
            <Table<CustomerCommunicationItem>
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
                <CustomerCommunicationDetailsExpandedRow item={row} />
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
