import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Layers, Megaphone, RotateCcw } from "lucide-react";
import DateFormatter from "../../../shared/components/DateFormatter";
import HeadlessSelect from "../../../shared/components/ui/HeadlessSelect";
import LoadingSpinner from "../../../shared/components/ui/LoadingSpinner";
import Pagination, {
  DEFAULT_PAGE_SIZE,
} from "../../../shared/components/ui/Pagination";
import SearchInput from "../../../shared/components/ui/SearchInput";
import { Table, type TableColumn } from "../../../shared/components/Table";
import { color, tw } from "../../../shared/utils/utils";
import type {
  CustomerSegmentCampaign,
  CustomerSegmentProgress,
  CustomerSegmentResult,
} from "../types/customerSegment";
import {
  filterAudienceCampaigns,
  humanizeCampaignStatus,
  humanizeFlowType,
  uniqueCampaignStatuses,
} from "../utils/customerSegmentHelpers";

type CustomerCampaignsTabProps = {
  subscriberId?: string | number | null;
  result: CustomerSegmentResult;
  progress: CustomerSegmentProgress;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
};

const ALL = "all";

function statusClassName(status: string | null, isActive: boolean): string {
  const value = (status || (isActive ? "active" : "inactive")).toLowerCase();
  if (["active", "live", "running", "scheduled"].includes(value)) {
    return "bg-green-50 text-green-800";
  }
  if (["paused", "pending", "draft"].includes(value)) {
    return "bg-amber-50 text-amber-800";
  }
  if (["inactive", "completed", "cancelled", "canceled"].includes(value)) {
    return "bg-gray-100 text-gray-700";
  }
  return "bg-sky-50 text-sky-800";
}

export default function CustomerCampaignsTab({
  subscriberId,
  result,
  progress,
  isLoading,
  error,
  refetch,
}: CustomerCampaignsTabProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [status, setStatus] = useState(ALL);
  const [page, setPage] = useState(1);
  const pageSize = DEFAULT_PAGE_SIZE;

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(searchTerm), 300);
    return () => window.clearTimeout(timer);
  }, [searchTerm]);

  const filtered = useMemo(
    () =>
      filterAudienceCampaigns(result.audienceCampaigns, {
        search: debouncedSearch,
        status,
      }),
    [result.audienceCampaigns, debouncedSearch, status],
  );

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, status, subscriberId]);

  const filtersActive = Boolean(debouncedSearch.trim()) || status !== ALL;

  const statusOptions = useMemo(
    () => [
      { value: ALL, label: "All statuses" },
      ...uniqueCampaignStatuses(result.audienceCampaigns).map((item) => ({
        value: item,
        label: humanizeCampaignStatus(item),
      })),
    ],
    [result.audienceCampaigns],
  );

  const paginated = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page, pageSize]);

  const columns: TableColumn<CustomerSegmentCampaign>[] = useMemo(
    () => [
      {
        id: "campaignName",
        label: "Campaign",
        visible: true,
        render: (_, row) => (
          <Link
            to={`/dashboard/campaigns/${row.campaignId}`}
            className={`text-sm font-medium hover:underline ${tw.tableFirstColumn}`}
          >
            {row.campaignName}
          </Link>
        ),
      },
      {
        id: "campaignStatus",
        label: "Status",
        visible: true,
        render: (_, row) => (
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusClassName(
              row.campaignStatus,
              row.isActive ?? true,
            )}`}
          >
            {humanizeCampaignStatus(
              row.campaignStatus || (row.isActive === false ? "inactive" : "active"),
            )}
          </span>
        ),
      },
      {
        id: "flowType",
        label: "Flow",
        visible: true,
        render: (_, row) => (
          <span className="text-sm text-gray-900">
            {humanizeFlowType(row.flowType)}
          </span>
        ),
      },
      {
        id: "viaSegments",
        label: "Audience via",
        visible: true,
        render: (_, row) => (
          <div className="flex flex-wrap gap-1 min-w-[160px]">
            {row.viaSegments.length === 0 ? (
              <span className="text-sm text-gray-400">—</span>
            ) : (
              row.viaSegments.map((segment) => (
                <Link
                  key={segment.segmentId}
                  to={`/dashboard/segments/${segment.segmentId}`}
                  className="inline-flex max-w-[180px] truncate rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-800 hover:underline"
                  title={segment.segmentName}
                >
                  {segment.segmentName}
                </Link>
              ))
            )}
          </div>
        ),
      },
      {
        id: "offerName",
        label: "Offer",
        visible: true,
        render: (_, row) => (
          <span className="text-sm text-gray-900">{row.offerName || "—"}</span>
        ),
      },
      {
        id: "lastUsed",
        label: "Mapped",
        visible: true,
        render: (_, row) =>
          row.lastUsed ? (
            <DateFormatter
              date={row.lastUsed}
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
            Campaigns
          </h3>
          <p className="text-sm text-gray-500">
            Campaigns this customer is in because they belong to a mapped
            segment — not send or participation history.
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
              Audience campaigns
            </p>
            <Megaphone className="h-4 w-4 text-gray-400" />
          </div>
          <p className="text-2xl font-semibold text-gray-900">
            {isLoading ? "—" : result.audienceCampaigns.length.toLocaleString()}
          </p>
          <p className="mt-1 text-xs text-gray-500">
            Unique campaigns mapped to this member's segments
          </p>
        </div>
        <div className={`${tw.rounded} border border-gray-200 bg-white p-4`}>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              Source segments
            </p>
            <Layers className="h-4 w-4 text-gray-400" />
          </div>
          <p className="text-2xl font-semibold text-gray-900">
            {isLoading ? "—" : result.memberships.length.toLocaleString()}
          </p>
          <p className="mt-1 text-xs text-gray-500">
            Segment memberships used to resolve audience
          </p>
        </div>
        <div className={`${tw.rounded} border border-gray-200 bg-white p-4`}>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
            Active mappings
          </p>
          <p className="text-2xl font-semibold text-gray-900">
            {isLoading
              ? "—"
              : result.audienceCampaigns
                  .filter(
                    (item) =>
                      item.isActive !== false &&
                      (item.campaignStatus || "active").toLowerCase() ===
                        "active",
                  )
                  .length.toLocaleString()}
          </p>
          <p className="mt-1 text-xs text-gray-500">
            Campaigns currently marked active
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
        <SearchInput
          placeholder="Search campaigns, offers, or segments..."
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
            {progress.phase === "campaigns"
              ? `Resolving campaigns for ${progress.checked.toLocaleString()} of ${progress.total.toLocaleString()} segments...`
              : progress.total > 0
                ? `Finding segment memberships (${progress.checked.toLocaleString()} of ${progress.total.toLocaleString()})...`
                : "Loading audience mappings..."}
          </p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-12 text-center border border-dashed border-gray-200 rounded-md">
          <p className="text-gray-700 text-sm font-medium">
            {filtersActive
              ? "No campaigns match the selected filters"
              : result.memberships.length === 0
                ? "This customer is not in any segments, so no campaign audience was found"
                : "This customer's segments are not mapped to any campaigns"}
          </p>
          <p className="text-gray-500 text-sm mt-1">
            {filtersActive
              ? "Try a different status or search term."
              : "Audience is derived from segment membership, then campaign-flow mappings."}
          </p>
        </div>
      ) : (
        <>
          <p className="text-xs text-gray-500 mb-3">
            Showing {filtered.length.toLocaleString()} campaign
            {filtered.length === 1 ? "" : "s"} this customer is in via segment
            mapping
          </p>
          <div className={`${tw.rounded} overflow-hidden`}>
            <Table<CustomerSegmentCampaign>
              columns={columns}
              data={paginated}
              totalItems={filtered.length}
              currentPage={page}
              pageSize={pageSize}
              onPageChange={setPage}
              getRowId={(row) => String(row.campaignId)}
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
