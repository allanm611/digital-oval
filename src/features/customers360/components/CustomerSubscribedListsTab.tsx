import { useEffect, useMemo, useState } from "react";
import CustomerProfileEntityLink from "../navigation/CustomerProfileEntityLink";
import { ListChecks, RotateCcw, Users } from "lucide-react";
import DateFormatter from "../../../shared/components/DateFormatter";
import HeadlessSelect from "../../../shared/components/ui/HeadlessSelect";
import LoadingSpinner from "../../../shared/components/ui/LoadingSpinner";
import Pagination, {
  DEFAULT_PAGE_SIZE,
} from "../../../shared/components/ui/Pagination";
import SearchInput from "../../../shared/components/ui/SearchInput";
import { Table, type TableColumn } from "../../../shared/components/Table";
import { color, tw } from "../../../shared/utils/utils";
import { useCustomerSubscribedLists } from "../hooks/useCustomerSubscribedLists";
import type { CustomerSubscribedList } from "../types/customerSubscribedList";
import {
  filterMemberships,
  humanizeIdentifierType,
  humanizeListStatus,
  uniqueStatuses,
} from "../utils/customerSubscribedListHelpers";

type CustomerSubscribedListsTabProps = {
  subscriberId?: string | number | null;
  customerRecord?: Record<string, unknown> | null;
};

const ALL = "all";

function statusClassName(status: string): string {
  const value = status.toLowerCase();
  if (["active", "subscribed", "member", "completed"].includes(value)) {
    return "bg-green-50 text-green-800";
  }
  if (["unsubscribed", "removed", "inactive", "opted_out"].includes(value)) {
    return "bg-gray-100 text-gray-700";
  }
  if (["pending", "processing"].includes(value)) {
    return "bg-amber-50 text-amber-800";
  }
  if (["failed", "error"].includes(value)) {
    return "bg-red-50 text-red-800";
  }
  return "bg-sky-50 text-sky-800";
}

export default function CustomerSubscribedListsTab({
  subscriberId,
  customerRecord,
}: CustomerSubscribedListsTabProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [status, setStatus] = useState(ALL);
  const [listType, setListType] = useState(ALL);
  const [page, setPage] = useState(1);
  const pageSize = DEFAULT_PAGE_SIZE;

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(searchTerm), 300);
    return () => window.clearTimeout(timer);
  }, [searchTerm]);

  const { result, progress, isLoading, error, refetch } =
    useCustomerSubscribedLists(subscriberId ?? undefined, customerRecord);

  const filtered = useMemo(
    () =>
      filterMemberships(result.memberships, {
        search: debouncedSearch,
        status,
        listType,
      }),
    [result.memberships, debouncedSearch, status, listType],
  );

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, status, listType, subscriberId]);

  const filtersActive =
    Boolean(debouncedSearch.trim()) || status !== ALL || listType !== ALL;

  const statusOptions = useMemo(
    () => [
      { value: ALL, label: "All status" },
      ...uniqueStatuses(result.memberships).map((item) => ({
        value: item,
        label: humanizeListStatus(item),
      })),
    ],
    [result.memberships],
  );

  const typeOptions = useMemo(() => {
    const types = Array.from(
      new Set(result.memberships.map((item) => item.listType)),
    );
    return [
      { value: ALL, label: "All list types" },
      ...types.map((item) => ({
        value: item,
        label: item === "quicklist" ? "QuickList" : "Subscription",
      })),
    ];
  }, [result.memberships]);

  const paginated = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page, pageSize]);

  const columns: TableColumn<CustomerSubscribedList>[] = useMemo(
    () => [
      {
        id: "name",
        label: "List Name",
        visible: true,
        render: (_, row) => (
          <div className="min-w-[180px]">
            {row.listType === "quicklist" ? (
              <CustomerProfileEntityLink
                to={`/dashboard/quick-lists/${row.listId}`}
                className={`text-sm font-medium hover:underline ${tw.tableFirstColumn}`}
              >
                {row.name}
              </CustomerProfileEntityLink>
            ) : (
              <p className={`text-sm font-medium ${tw.tableFirstColumn}`}>
                {row.name}
              </p>
            )}
            {row.description ? (
              <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">
                {row.description}
              </p>
            ) : null}
          </div>
        ),
      },
      {
        id: "listType",
        label: "Type",
        visible: true,
        render: (_, row) => (
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
              row.listType === "quicklist"
                ? "bg-teal-50 text-teal-800"
                : "bg-violet-50 text-violet-800"
            }`}
          >
            {row.listType === "quicklist" ? "QuickList" : "Subscription"}
          </span>
        ),
      },
      {
        id: "addedAt",
        label: "Date Added",
        visible: true,
        render: (_, row) =>
          row.addedAt ? (
            <DateFormatter
              date={row.addedAt}
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
            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusClassName(row.status)}`}
          >
            {humanizeListStatus(row.status)}
          </span>
        ),
      },
      {
        id: "matchedIdentifier",
        label: "Matched On",
        visible: true,
        render: (_, row) => (
          <div>
            <p className="text-sm text-gray-900">
              {row.matchedIdentifier || "—"}
            </p>
            <p className="text-xs text-gray-500">
              {humanizeIdentifierType(row.matchedIdentifierType)}
              {row.verification === "hint" ? " · Unverified" : ""}
            </p>
          </div>
        ),
      },
      {
        id: "totalMembers",
        label: "List Size",
        visible: true,
        render: (_, row) => (
          <span className="text-sm text-gray-900">
            {typeof row.totalMembers === "number"
              ? row.totalMembers.toLocaleString()
              : "—"}
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
    setListType(ALL);
  };

  if (!subscriberId) {
    return (
      <div className="py-12 text-center">
        <p className="text-gray-500 text-sm">No customer selected</p>
      </div>
    );
  }

  const membershipCount = result.memberships.length;
  const latestAdded = result.memberships.find((item) => item.addedAt)?.addedAt;

  return (
    <div>
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">
            Subscribed Lists
          </h3>
          <p className="text-sm text-gray-500">
            Lists this customer belongs to. Every QuickList in the system is
            checked for membership, including the date the member was added.
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
              Memberships
            </p>
            <ListChecks className="h-4 w-4 text-gray-400" />
          </div>
          <p className="text-2xl font-semibold text-gray-900">
            {isLoading ? "—" : membershipCount.toLocaleString()}
          </p>
          <p className="mt-1 text-xs text-gray-500">
            Lists this customer is a member of
          </p>
        </div>
        <div className={`${tw.rounded} border border-gray-200 bg-white p-4`}>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              QuickLists checked
            </p>
            <Users className="h-4 w-4 text-gray-400" />
          </div>
          <p className="text-2xl font-semibold text-gray-900">
            {isLoading && progress.total === 0
              ? "—"
              : `${(isLoading ? progress.checked : result.checkedCount).toLocaleString()} / ${(isLoading ? progress.total : result.systemQuickListCount).toLocaleString()}`}
          </p>
          <p className="mt-1 text-xs text-gray-500">
            System QuickLists evaluated for this member
          </p>
        </div>
        <div className={`${tw.rounded} border border-gray-200 bg-white p-4`}>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
            Last added
          </p>
          <p className="text-sm font-semibold text-gray-900">
            {isLoading ? (
              "—"
            ) : latestAdded ? (
              <DateFormatter
                date={latestAdded}
                includeTime
                useUserTimezone
                className="text-sm font-semibold text-gray-900"
              />
            ) : (
              "No add date on file"
            )}
          </p>
          <p className="mt-1 text-xs text-gray-500">
            Most recent membership timestamp
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
        <SearchInput
          placeholder="Search lists..."
          value={searchTerm}
          onChange={setSearchTerm}
        />
        <HeadlessSelect
          value={listType}
          onChange={(value) => setListType(String(value))}
          options={typeOptions}
          placeholder="List type"
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
            {progress.total > 0
              ? `Checking membership in ${progress.checked.toLocaleString()} of ${progress.total.toLocaleString()} QuickLists...`
              : "Loading system QuickLists..."}
          </p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-12 text-center border border-dashed border-gray-200 rounded-md">
          <p className="text-gray-700 text-sm font-medium">
            {filtersActive
              ? "No lists match the selected filters"
              : "This customer is not a member of any lists"}
          </p>
          <p className="text-gray-500 text-sm mt-1">
            {filtersActive
              ? "Try a different list type, status, or search term."
              : result.systemQuickListCount > 0
                ? `${result.systemQuickListCount.toLocaleString()} system QuickList${result.systemQuickListCount === 1 ? " was" : "s were"} checked.`
                : "No QuickLists exist in the system yet."}
          </p>
        </div>
      ) : (
        <>
          <p className="text-xs text-gray-500 mb-3">
            Showing {filtered.length.toLocaleString()} list
            {filtered.length === 1 ? "" : "s"} this customer belongs to
          </p>
          <div className={`${tw.rounded} overflow-hidden`}>
            <Table<CustomerSubscribedList>
              columns={columns}
              data={paginated}
              totalItems={filtered.length}
              currentPage={page}
              pageSize={pageSize}
              onPageChange={setPage}
              getRowId={(row) => row.id}
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
                onPageChange={setPage}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}
