import { useEffect, useMemo, useState } from "react";
import { Award, Medal, RotateCcw, Ticket } from "lucide-react";
import DateFormatter from "../../../shared/components/DateFormatter";
import HeadlessSelect from "../../../shared/components/ui/HeadlessSelect";
import LoadingSpinner from "../../../shared/components/ui/LoadingSpinner";
import Pagination, {
  DEFAULT_PAGE_SIZE,
} from "../../../shared/components/ui/Pagination";
import SearchInput from "../../../shared/components/ui/SearchInput";
import { Table, type TableColumn } from "../../../shared/components/Table";
import { color, tw } from "../../../shared/utils/utils";
import { useCustomerLoyalty } from "../hooks/useCustomerLoyalty";
import type {
  CustomerLoyaltyItem,
  CustomerLoyaltyKind,
  CustomerLoyaltyStatus,
} from "../types/customerLoyalty";
import {
  filterActivities,
  formatPoints,
  humanizeLoyaltyKind,
  humanizeLoyaltyStatus,
  humanizeProgramStatus,
  latestActivityAt,
  uniqueLoyaltyKinds,
  uniqueLoyaltyStatuses,
} from "../utils/customerLoyaltyHelpers";
import CustomerLoyaltyDetailsExpandedRow from "./CustomerLoyaltyDetailsExpandedRow";

type CustomerLoyaltyTabProps = {
  subscriberId?: string | number | null;
  customerRecord?: Record<string, unknown> | null;
};

const ALL = "all";

function kindClassName(kind: CustomerLoyaltyKind): string {
  if (kind === "earn" || kind === "grant") return "bg-green-50 text-green-800";
  if (kind === "redeem") return "bg-teal-50 text-teal-800";
  if (kind === "tier_change") return "bg-sky-50 text-sky-800";
  if (kind === "adjust") return "bg-amber-50 text-amber-800";
  return "bg-gray-100 text-gray-700";
}

function statusClassName(status: CustomerLoyaltyStatus): string {
  if (status === "completed") return "bg-green-50 text-green-800";
  if (status === "pending") return "bg-amber-50 text-amber-800";
  if (status === "failed") return "bg-red-50 text-red-800";
  return "bg-gray-100 text-gray-700";
}

function progressLabel(
  phase: "lookup" | "events" | "catalog",
  checked: number,
  total: number,
): string {
  if (phase === "lookup") return "Checking subscriber loyalty account...";
  if (phase === "events") return "Checking live loyalty events...";
  return total > 0
    ? `Loading linked offers (${checked.toLocaleString()} of ${total.toLocaleString()})...`
    : "Loading linked offers...";
}

export default function CustomerLoyaltyTab({
  subscriberId,
  customerRecord,
}: CustomerLoyaltyTabProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [kind, setKind] = useState(ALL);
  const [status, setStatus] = useState(ALL);
  const [page, setPage] = useState(1);
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);
  const pageSize = DEFAULT_PAGE_SIZE;

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(searchTerm), 300);
    return () => window.clearTimeout(timer);
  }, [searchTerm]);

  const { result, progress, isLoading, error, refetch } = useCustomerLoyalty(
    subscriberId ?? undefined,
    customerRecord,
  );

  const filtered = useMemo(
    () =>
      filterActivities(result.activities, {
        search: debouncedSearch,
        kind,
        status,
      }),
    [result.activities, debouncedSearch, kind, status],
  );

  useEffect(() => {
    setPage(1);
    setExpandedRowId(null);
  }, [debouncedSearch, kind, status, subscriberId]);

  const filtersActive =
    Boolean(debouncedSearch.trim()) || kind !== ALL || status !== ALL;

  const kindOptions = useMemo(
    () => [
      { value: ALL, label: "All types" },
      ...uniqueLoyaltyKinds(result.activities).map((item) => ({
        value: item,
        label: humanizeLoyaltyKind(item),
      })),
    ],
    [result.activities],
  );

  const statusOptions = useMemo(
    () => [
      { value: ALL, label: "All statuses" },
      ...uniqueLoyaltyStatuses(result.activities).map((item) => ({
        value: item,
        label: humanizeLoyaltyStatus(item),
      })),
    ],
    [result.activities],
  );

  const paginated = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page, pageSize]);

  const lastActivity = latestActivityAt(result.activities);
  const account = result.account;

  const columns: TableColumn<CustomerLoyaltyItem>[] = useMemo(
    () => [
      {
        id: "name",
        label: "Reward Name",
        visible: true,
        render: (_, row) => (
          <div className="min-w-[160px]">
            <p className={`text-sm font-medium ${tw.tableFirstColumn}`}>
              {row.name}
            </p>
            {row.rewardType ? (
              <p className="text-xs text-gray-500 mt-0.5">{row.rewardType}</p>
            ) : null}
          </div>
        ),
      },
      {
        id: "kind",
        label: "Type",
        visible: true,
        render: (_, row) => (
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${kindClassName(
              row.kind,
            )}`}
          >
            {humanizeLoyaltyKind(row.kind)}
          </span>
        ),
      },
      {
        id: "points",
        label: "Points",
        visible: true,
        render: (_, row) => (
          <span className="text-sm text-gray-900">
            {formatPoints(row.points)}
          </span>
        ),
      },
      {
        id: "date",
        label: "Redeemed Date",
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
            {humanizeLoyaltyStatus(row.status)}
            {row.verification === "hint" ? " · Unverified" : ""}
          </span>
        ),
      },
    ],
    [],
  );

  const clearFilters = () => {
    setSearchTerm("");
    setDebouncedSearch("");
    setKind(ALL);
    setStatus(ALL);
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
            Loyalty & Rewards
          </h3>
          <p className="text-sm text-gray-500">
            Loyalty points, program tier, and rewards for this customer.
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
              Total Points
            </p>
            <Award className="h-4 w-4 text-gray-400" />
          </div>
          <p className="text-2xl font-semibold text-gray-900">
            {isLoading ? "—" : formatPoints(account.pointsBalance)}
          </p>
          <p className="mt-1 text-xs text-gray-500">
            {isLoading
              ? "Current loyalty balance"
              : account.balanceEstimated
                ? "Estimated from earn and redeem activity"
                : account.pointsEarned != null
                  ? `${formatPoints(account.pointsEarned)} earned lifetime`
                  : "Current loyalty balance"}
          </p>
        </div>
        <div className={`${tw.rounded} border border-gray-200 bg-white p-4`}>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              Current Tier
            </p>
            <Medal className="h-4 w-4 text-gray-400" />
          </div>
          <p className="text-2xl font-semibold text-gray-900">
            {isLoading ? "—" : account.tier || "—"}
          </p>
          <p className="mt-1 text-xs text-gray-500">
            {isLoading
              ? "Loyalty program membership"
              : `${humanizeProgramStatus(account.status)}${
                  account.verification === "hint" && account.tier
                    ? " · Unverified"
                    : ""
                }`}
          </p>
        </div>
        <div className={`${tw.rounded} border border-gray-200 bg-white p-4`}>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              Points Redeemed
            </p>
            <Ticket className="h-4 w-4 text-gray-400" />
          </div>
          <p className="text-2xl font-semibold text-gray-900">
            {isLoading
              ? "—"
              : formatPoints(
                  account.pointsRedeemed ?? result.counts.pointsRedeemed,
                )}
          </p>
          <p className="mt-1 text-xs text-gray-500">
            {isLoading
              ? "Points spent on rewards"
              : lastActivity
                ? "Last activity "
                : "No loyalty activity on file"}
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
      </div>

      {account.tierBenefits.length > 0 && !isLoading && (
        <div className={`${tw.rounded} border border-gray-200 bg-white p-4 mb-6`}>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
            Tier benefits
          </p>
          <ul className="flex flex-wrap gap-2">
            {account.tierBenefits.map((benefit) => (
              <li
                key={benefit}
                className="inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-800"
              >
                {benefit}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mb-4">
        <h4 className="text-base font-semibold text-gray-900 mb-3">
          Redemption History
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <SearchInput
            placeholder="Search rewards, offers, or campaigns..."
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
              ? "No rewards match the selected filters"
              : "No loyalty rewards for this customer"}
          </p>
          <p className="text-gray-500 text-sm mt-1">
            {filtersActive
              ? "Try a different type, status, or search term."
              : result.eventsLive
                ? "Points earned, redeemed, and granted rewards will appear here after the loyalty ledger records them."
                : "A subscriber loyalty API or live points events are needed before rewards can be shown."}
          </p>
        </div>
      ) : (
        <>
          <p className="text-xs text-gray-500 mb-3">
            Showing {filtered.length.toLocaleString()} reward
            {filtered.length === 1 ? "" : "s"} for this customer
          </p>
          <div className={`${tw.rounded} overflow-hidden`}>
            <Table<CustomerLoyaltyItem>
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
                <CustomerLoyaltyDetailsExpandedRow activity={row} />
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
