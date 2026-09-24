import { useEffect, useMemo, useState } from "react";
import CustomerProfileEntityLink from "../navigation/CustomerProfileEntityLink";
import { Gift, RotateCcw, Sparkles, Ticket } from "lucide-react";
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
import { useCustomerOffers } from "../hooks/useCustomerOffers";
import type { CustomerOfferItem, CustomerOfferState } from "../types/customerOffer";
import {
  filterCustomerOffers,
  humanizeOfferState,
  humanizeOfferType,
  latestRedeemedAt,
  uniqueOfferStates,
  uniqueOfferTypes,
} from "../utils/customerOfferHelpers";
import CustomerOfferDetailsExpandedRow from "./CustomerOfferDetailsExpandedRow";

type CustomerOffersTabProps = {
  subscriberId?: string | number | null;
  customerRecord?: Record<string, unknown> | null;
};

const ALL = "all";

function stateClassName(state: CustomerOfferState): string {
  if (state === "redeemed") return "bg-green-50 text-green-800";
  if (state === "available") return "bg-teal-50 text-teal-800";
  if (state === "accepted") return "bg-sky-50 text-sky-800";
  if (state === "expired") return "bg-gray-100 text-gray-700";
  return "bg-amber-50 text-amber-800";
}

function progressLabel(
  phase: "audience" | "events" | "catalog",
  checked: number,
  total: number,
): string {
  if (phase === "audience") {
    return total > 0
      ? `Resolving audience offers (${checked.toLocaleString()} of ${total.toLocaleString()})...`
      : "Finding segment and campaign mappings...";
  }
  if (phase === "events") {
    return "Checking live redemption events...";
  }
  return total > 0
    ? `Loading offer catalog (${checked.toLocaleString()} of ${total.toLocaleString()})...`
    : "Loading offer catalog...";
}

export default function CustomerOffersTab({
  subscriberId,
  customerRecord,
}: CustomerOffersTabProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [state, setState] = useState(ALL);
  const [type, setType] = useState(ALL);
  const [page, setPage] = useState(1);
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);
  const pageSize = DEFAULT_PAGE_SIZE;

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(searchTerm), 300);
    return () => window.clearTimeout(timer);
  }, [searchTerm]);

  const { result, progress, isLoading, isEnriching, error, refetch } = useCustomerOffers(
    subscriberId ?? undefined,
    customerRecord,
  );

  const filtered = useMemo(
    () =>
      filterCustomerOffers(result.offers, {
        search: debouncedSearch,
        state,
        type,
      }),
    [result.offers, debouncedSearch, state, type],
  );

  useEffect(() => {
    setPage(1);
    setExpandedRowId(null);
  }, [debouncedSearch, state, type, subscriberId]);

  const filtersActive =
    Boolean(debouncedSearch.trim()) || state !== ALL || type !== ALL;

  const stateOptions = useMemo(
    () => [
      { value: ALL, label: "All statuses" },
      ...uniqueOfferStates(result.offers).map((item) => ({
        value: item,
        label: humanizeOfferState(item),
      })),
    ],
    [result.offers],
  );

  const typeOptions = useMemo(
    () => [
      { value: ALL, label: "All types" },
      ...uniqueOfferTypes(result.offers).map((item) => ({
        value: item,
        label: humanizeOfferType(item),
      })),
    ],
    [result.offers],
  );

  const paginated = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page, pageSize]);

  const lastRedeemed = latestRedeemedAt(result.offers);

  const columns: TableColumn<CustomerOfferItem>[] = useMemo(
    () => [
      {
        id: "name",
        label: "Offer Name",
        visible: true,
        render: (_, row) => (
          <div className="min-w-[180px]">
            {row.offerId ? (
              <CustomerProfileEntityLink
                to={`/dashboard/offers/${row.offerId}`}
                className={`text-sm font-medium hover:underline ${tw.tableFirstColumn}`}
              >
                {row.name}
              </CustomerProfileEntityLink>
            ) : (
              <p className={`text-sm font-medium ${tw.tableFirstColumn}`}>
                {row.name}
              </p>
            )}
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
            {humanizeOfferType(row.type)}
          </span>
        ),
      },
      {
        id: "state",
        label: "Status",
        visible: true,
        render: (_, row) => (
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${stateClassName(
              row.state,
            )}`}
          >
            {humanizeOfferState(row.state)}
            {row.verification === "hint" ? " · Unverified" : ""}
          </span>
        ),
      },
      {
        id: "value",
        label: "Value",
        visible: true,
        render: (_, row) =>
          row.valueAmount != null ? (
            <CurrencyFormatter amount={row.valueAmount} />
          ) : row.valuePercent != null ? (
            <span className="text-sm text-gray-900">{row.valuePercent}%</span>
          ) : (
            <span className="text-sm text-gray-400">—</span>
          ),
      },
      {
        id: "redeemedAt",
        label: "Redeemed Date",
        visible: true,
        render: (_, row) =>
          row.redeemedAt ? (
            <DateFormatter
              date={row.redeemedAt}
              includeTime
              useUserTimezone
              className="text-sm text-gray-700"
            />
          ) : (
            <span className="text-sm text-gray-400">—</span>
          ),
      },
      {
        id: "viaCampaigns",
        label: "Via campaigns",
        visible: true,
        render: (_, row) => (
          <div className="flex flex-wrap gap-1 min-w-[160px]">
            {row.viaCampaigns.length === 0 ? (
              <span className="text-sm text-gray-400">—</span>
            ) : (
              row.viaCampaigns.slice(0, 2).map((campaign) => (
                <CustomerProfileEntityLink
                  key={campaign.campaignId}
                  to={`/dashboard/campaigns/${campaign.campaignId}`}
                  className="inline-flex max-w-[160px] truncate rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-800 hover:underline"
                  title={campaign.campaignName}
                >
                  {campaign.campaignName}
                </CustomerProfileEntityLink>
              ))
            )}
            {row.viaCampaigns.length > 2 ? (
              <span className="text-xs text-gray-500">
                +{row.viaCampaigns.length - 2}
              </span>
            ) : null}
          </div>
        ),
      },
    ],
    [],
  );

  const clearFilters = () => {
    setSearchTerm("");
    setDebouncedSearch("");
    setState(ALL);
    setType(ALL);
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
          <h3 className="text-lg font-semibold text-gray-900 mb-1">Offers</h3>
          <p className="text-sm text-gray-500">
            Offers available to this customer through campaign-segment mapping,
            and offers they have accepted or redeemed.
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
              Available
            </p>
            <Sparkles className="h-4 w-4 text-gray-400" />
          </div>
          <p className="text-2xl font-semibold text-gray-900">
            {isLoading && result.offers.length === 0
              ? "—"
              : result.counts.available.toLocaleString()}
          </p>
          <p className="mt-1 text-xs text-gray-500">
            Eligible now via this customer's audience
          </p>
        </div>
        <div className={`${tw.rounded} border border-gray-200 bg-white p-4`}>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              Redeemed
            </p>
            <Ticket className="h-4 w-4 text-gray-400" />
          </div>
          <p className="text-2xl font-semibold text-gray-900">
            {isLoading && result.offers.length === 0
              ? "—"
              : result.counts.redeemed.toLocaleString()}
          </p>
          <p className="mt-1 text-xs text-gray-500">
            {isLoading
              ? "Confirmed from live offer events"
              : lastRedeemed
                ? "Last redeemed "
                : "No redemption on file"}
            {!isLoading && lastRedeemed ? (
              <DateFormatter
                date={lastRedeemed}
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
              Offers found
            </p>
            <Gift className="h-4 w-4 text-gray-400" />
          </div>
          <p className="text-2xl font-semibold text-gray-900">
            {isLoading && result.offers.length === 0
              ? "—"
              : result.counts.total.toLocaleString()}
          </p>
          <p className="mt-1 text-xs text-gray-500">
            {isLoading
              ? "From campaigns, events, and catalog"
              : `From ${result.campaignCount.toLocaleString()} campaign${result.campaignCount === 1 ? "" : "s"} and ${result.segmentCount.toLocaleString()} segment${result.segmentCount === 1 ? "" : "s"}`}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
        <SearchInput
          placeholder="Search offers, campaigns, or segments..."
          value={searchTerm}
          onChange={setSearchTerm}
        />
        <HeadlessSelect
          value={state}
          onChange={(value) => setState(String(value))}
          options={stateOptions}
          placeholder="Status"
          className="w-full"
        />
        <HeadlessSelect
          value={type}
          onChange={(value) => setType(String(value))}
          options={typeOptions}
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

      {isEnriching && result.offers.length > 0 && (
        <div className="mb-4 rounded-md border border-gray-200 bg-gray-50 px-4 py-2 text-sm text-gray-600">
          Enriching offer catalog {progress.checked.toLocaleString()} of{" "}
          {progress.total.toLocaleString()}...
        </div>
      )}

      {isLoading && result.offers.length === 0 ? (
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
              ? "No offers match the selected filters"
              : "No offers are available or redeemed for this customer"}
          </p>
          <p className="text-gray-500 text-sm mt-1">
            {filtersActive
              ? "Try a different status, type, or search term."
              : result.segmentCount === 0
                ? "This customer is not in any mapped segments, so no campaign offers were found."
                : result.campaignCount === 0
                  ? "This customer's segments are not mapped to campaign offers."
                  : "Audience mappings were found, but none resolved to an offer catalog item."}
          </p>
        </div>
      ) : (
        <>
          <p className="text-xs text-gray-500 mb-3">
            Showing {filtered.length.toLocaleString()} offer
            {filtered.length === 1 ? "" : "s"} available or redeemed by this
            customer
          </p>
          <div className={`${tw.rounded} overflow-hidden`}>
            <Table<CustomerOfferItem>
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
                <CustomerOfferDetailsExpandedRow offer={row} />
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
