import { useEffect, useMemo, useState } from "react";
import CustomerProfileEntityLink from "../navigation/CustomerProfileEntityLink";
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
  CustomerSegmentMembership,
  CustomerSegmentProgress,
  CustomerSegmentResult,
} from "../types/customerSegment";
import {
  filterMemberships,
  humanizeCampaignStatus,
  humanizeFlowType,
  humanizeSegmentType,
  uniqueSegmentTypes,
} from "../utils/customerSegmentHelpers";
import { humanizeIdentifierType } from "../utils/customerSubscribedListHelpers";

type CustomerSegmentsTabProps = {
  subscriberId?: string | number | null;
  result: CustomerSegmentResult;
  progress: CustomerSegmentProgress;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
  isEnriching?: boolean;
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

function CampaignLinks({
  campaigns,
}: {
  campaigns: CustomerSegmentCampaign[];
}) {
  if (campaigns.length === 0) {
    return <span className="text-sm text-gray-400">None mapped</span>;
  }

  const preview = campaigns.slice(0, 2);
  return (
    <div className="min-w-[160px]">
      <div className="flex flex-wrap gap-1">
        {preview.map((campaign) => (
          <CustomerProfileEntityLink
            key={campaign.campaignId}
            to={`/dashboard/campaigns/${campaign.campaignId}`}
            className="inline-flex max-w-[160px] truncate rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-800 hover:underline"
            title={campaign.campaignName}
          >
            {campaign.campaignName}
          </CustomerProfileEntityLink>
        ))}
      </div>
      {campaigns.length > 2 ? (
        <p className="mt-1 text-xs text-gray-500">
          +{campaigns.length - 2} more
        </p>
      ) : null}
    </div>
  );
}

export default function CustomerSegmentsTab({
  subscriberId,
  result,
  progress,
  isLoading,
  error,
  refetch,
  isEnriching = false,
}: CustomerSegmentsTabProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [type, setType] = useState(ALL);
  const [campaignUsage, setCampaignUsage] = useState<"all" | "mapped" | "unmapped">(
    "all",
  );
  const [page, setPage] = useState(1);
  const [expandedRowId, setExpandedRowId] = useState<number | string | null>(
    null,
  );
  const pageSize = DEFAULT_PAGE_SIZE;

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(searchTerm), 300);
    return () => window.clearTimeout(timer);
  }, [searchTerm]);

  const filtered = useMemo(
    () =>
      filterMemberships(result.memberships, {
        search: debouncedSearch,
        type,
        campaignUsage,
      }),
    [result.memberships, debouncedSearch, type, campaignUsage],
  );

  useEffect(() => {
    setPage(1);
    setExpandedRowId(null);
  }, [debouncedSearch, type, campaignUsage, subscriberId]);

  const filtersActive =
    Boolean(debouncedSearch.trim()) || type !== ALL || campaignUsage !== ALL;

  const typeOptions = useMemo(
    () => [
      { value: ALL, label: "All types" },
      ...uniqueSegmentTypes(result.memberships).map((item) => ({
        value: item,
        label: humanizeSegmentType(item),
      })),
    ],
    [result.memberships],
  );

  const paginated = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page, pageSize]);

  const columns: TableColumn<CustomerSegmentMembership>[] = useMemo(
    () => [
      {
        id: "name",
        label: "Segment",
        visible: true,
        render: (_, row) => (
          <div className="min-w-[180px]">
            <CustomerProfileEntityLink
              to={`/dashboard/segments/${row.segmentId}`}
              className={`text-sm font-medium hover:underline ${tw.tableFirstColumn}`}
            >
              {row.name}
            </CustomerProfileEntityLink>
            {row.code ? (
              <p className="text-xs text-gray-500 mt-0.5">{row.code}</p>
            ) : row.description ? (
              <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">
                {row.description}
              </p>
            ) : null}
          </div>
        ),
      },
      {
        id: "type",
        label: "Type",
        visible: true,
        render: (_, row) => (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800">
            {humanizeSegmentType(row.type)}
          </span>
        ),
      },
      {
        id: "addedAt",
        label: "Added Date",
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
            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusClassName(
              row.isActive ? "active" : "inactive",
              row.isActive,
            )}`}
          >
            {row.isActive ? "Active" : "Inactive"}
            {row.verification === "hint" ? " · Unverified" : ""}
          </span>
        ),
      },
      {
        id: "campaigns",
        label: "Campaigns",
        visible: true,
        render: (_, row) => <CampaignLinks campaigns={row.campaigns} />,
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
              {row.verification === "hint" ? " · From profile hint" : ""}
            </p>
          </div>
        ),
      },
    ],
    [],
  );

  const clearFilters = () => {
    setSearchTerm("");
    setDebouncedSearch("");
    setType(ALL);
    setCampaignUsage("all");
  };

  if (!subscriberId) {
    return (
      <div className="py-12 text-center">
        <p className="text-gray-500 text-sm">No customer selected</p>
      </div>
    );
  }

  const membershipCount = result.memberships.length;
  const campaignCount = result.audienceCampaigns.length;
  const latestAdded = result.memberships.find((item) => item.addedAt)?.addedAt;

  return (
    <div>
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">
            Segments
          </h3>
          <p className="text-sm text-gray-500">
            Segments this customer is a member of, and the campaigns those
            segments are mapped to.
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
            <Layers className="h-4 w-4 text-gray-400" />
          </div>
          <p className="text-2xl font-semibold text-gray-900">
            {isLoading && membershipCount === 0
              ? "—"
              : membershipCount.toLocaleString()}
          </p>
          <p className="mt-1 text-xs text-gray-500">
            Segments this customer belongs to
          </p>
        </div>
        <div className={`${tw.rounded} border border-gray-200 bg-white p-4`}>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              Mapped campaigns
            </p>
            <Megaphone className="h-4 w-4 text-gray-400" />
          </div>
          <p className="text-2xl font-semibold text-gray-900">
            {isLoading && campaignCount === 0 && !isEnriching
              ? "—"
              : campaignCount.toLocaleString()}
          </p>
          <p className="mt-1 text-xs text-gray-500">
            Campaigns targeting these segments
          </p>
        </div>
        <div className={`${tw.rounded} border border-gray-200 bg-white p-4`}>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
            Last added
          </p>
          <p className="text-sm font-semibold text-gray-900">
            {isLoading && !latestAdded ? (
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
          placeholder="Search segments or campaigns..."
          value={searchTerm}
          onChange={setSearchTerm}
        />
        <HeadlessSelect
          value={type}
          onChange={(value) => setType(String(value))}
          options={typeOptions}
          placeholder="Segment type"
          className="w-full"
        />
        <HeadlessSelect
          value={campaignUsage}
          onChange={(value) =>
            setCampaignUsage(String(value) as "all" | "mapped" | "unmapped")
          }
          options={[
            { value: ALL, label: "All campaign mappings" },
            { value: "mapped", label: "Used in campaigns" },
            { value: "unmapped", label: "Not used in campaigns" },
          ]}
          placeholder="Campaign usage"
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

      {isEnriching && membershipCount > 0 && (
        <div className="mb-4 rounded-md border border-gray-200 bg-gray-50 px-4 py-2 text-sm text-gray-600">
          Mapping campaigns for {progress.checked.toLocaleString()} of{" "}
          {progress.total.toLocaleString()} segments...
        </div>
      )}

      {isLoading && membershipCount === 0 ? (
        <div className="flex flex-col items-center justify-center py-16">
          <LoadingSpinner variant="modern" size="lg" color="primary" />
          <p className="mt-3 text-sm text-gray-500">
            {progress.phase === "campaigns"
              ? `Loading campaigns for ${progress.checked.toLocaleString()} of ${progress.total.toLocaleString()} segments...`
              : progress.total > 0
                ? `Checking membership in ${progress.checked.toLocaleString()} of ${progress.total.toLocaleString()} segments...`
                : "Loading system segments..."}
          </p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-12 text-center border border-dashed border-gray-200 rounded-md">
          <p className="text-gray-700 text-sm font-medium">
            {filtersActive
              ? "No segments match the selected filters"
              : "This customer is not a member of any segments"}
          </p>
          <p className="text-gray-500 text-sm mt-1">
            {filtersActive
              ? "Try a different type, campaign mapping, or search term."
              : result.systemSegmentCount > 0
                ? `${result.systemSegmentCount.toLocaleString()} system segment${result.systemSegmentCount === 1 ? " was" : "s were"} checked.`
                : "No segments exist in the system yet."}
          </p>
        </div>
      ) : (
        <>
          <p className="text-xs text-gray-500 mb-3">
            Showing {filtered.length.toLocaleString()} segment
            {filtered.length === 1 ? "" : "s"} this customer belongs to
          </p>
          <div className={`${tw.rounded} overflow-hidden`}>
            <Table<CustomerSegmentMembership>
              columns={columns}
              data={paginated}
              totalItems={filtered.length}
              currentPage={page}
              pageSize={pageSize}
              onPageChange={setPage}
              getRowId={(row) => row.id}
              expandedRowId={expandedRowId}
              onExpandChange={setExpandedRowId}
              expandedContent={(row) => (
                <div className="px-2 py-3">
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-500 mb-2">
                    Campaigns using {row.name}
                  </p>
                  {row.campaigns.length === 0 ? (
                    <p className="text-sm text-gray-500">
                      This segment is not mapped to any campaigns.
                    </p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full text-sm">
                        <thead>
                          <tr className="text-left text-xs uppercase tracking-wide text-gray-500">
                            <th className="py-2 pr-4">Campaign</th>
                            <th className="py-2 pr-4">Status</th>
                            <th className="py-2 pr-4">Flow</th>
                            <th className="py-2 pr-4">Offer</th>
                            <th className="py-2">Last used</th>
                          </tr>
                        </thead>
                        <tbody>
                          {row.campaigns.map((campaign) => (
                            <tr
                              key={campaign.campaignId}
                              className="border-t border-gray-100"
                            >
                              <td className="py-2 pr-4">
                                <CustomerProfileEntityLink
                                  to={`/dashboard/campaigns/${campaign.campaignId}`}
                                  className="font-medium text-gray-900 hover:underline"
                                >
                                  {campaign.campaignName}
                                </CustomerProfileEntityLink>
                              </td>
                              <td className="py-2 pr-4">
                                <span
                                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusClassName(
                                    campaign.campaignStatus,
                                    campaign.isActive ?? true,
                                  )}`}
                                >
                                  {humanizeCampaignStatus(
                                    campaign.campaignStatus ||
                                      (campaign.isActive === false
                                        ? "inactive"
                                        : "active"),
                                  )}
                                </span>
                              </td>
                              <td className="py-2 pr-4 text-gray-700">
                                {humanizeFlowType(campaign.flowType)}
                              </td>
                              <td className="py-2 pr-4 text-gray-700">
                                {campaign.offerName || "—"}
                              </td>
                              <td className="py-2 text-gray-700">
                                {campaign.lastUsed ? (
                                  <DateFormatter
                                    date={campaign.lastUsed}
                                    includeTime
                                    useUserTimezone
                                    className="text-sm text-gray-700"
                                  />
                                ) : (
                                  "—"
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
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
                onPageChange={setPage}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}
