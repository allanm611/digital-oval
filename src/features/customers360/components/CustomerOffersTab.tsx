import { useEffect, useMemo, useState } from "react";
import CustomerProfileEntityLink from "../navigation/CustomerProfileEntityLink";
import { Gift, Link2, RotateCcw, Ticket } from "lucide-react";
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
import type {
  CustomerOfferItem,
  CustomerOfferStatus,
} from "../types/customerOffer";
import {
  filterCustomerOffers,
  humanizeOfferStatus,
  humanizeOfferType,
  humanizeValidity,
  latestRedeemedAt,
  uniqueOfferStatuses,
  uniqueOfferTypes,
  usageSummary,
} from "../utils/customerOfferHelpers";
import CustomerOfferDetailsExpandedRow from "./CustomerOfferDetailsExpandedRow";

type CustomerOffersTabProps = {
  subscriberId?: string | number | null;
  customerRecord?: Record<string, unknown> | null;
};

const ALL = "all";

function statusClassName(status: CustomerOfferStatus): string {
  return status === "active"
    ? "bg-green-50 text-green-800"
    : "bg-gray-100 text-gray-700";
}

function progressLabel(
  phase: "audience" | "events" | "catalog",
  checked: number,
  total: number,
): string {
  if (phase === "audience") {
    return "Loading offers this customer has received or is attached to...";
  }
  if (phase === "events") {
    return "Checking live redemption events...";
  }
  return total > 0
    ? `Loading offer catalog (${checked.toLocaleString()} of ${total.toLocaleString()})...`
    : "Loading offer catalog...";
}

function RelationshipBadges({ offer }: { offer: CustomerOfferItem }) {
  return (
    <div className="flex flex-wrap gap-1">
      {offer.hasReceived ? (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-sky-50 text-sky-800">
          Received
        </span>
      ) : null}
      {offer.isAttached ? (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-teal-50 text-teal-800">
          Attached
        </span>
      ) : null}
    </div>
  );
}

export default function CustomerOffersTab({
  subscriberId,
  customerRecord,
}: CustomerOffersTabProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [relationship, setRelationship] = useState(ALL);
  const [status, setStatus] = useState(ALL);
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
        relationship,
        status,
        type,
      }),
    [result.offers, debouncedSearch, relationship, status, type],
  );

  useEffect(() => {
    setPage(1);
    setExpandedRowId(null);
  }, [debouncedSearch, relationship, status, type, subscriberId]);

  const filtersActive =
    Boolean(debouncedSearch.trim()) ||
    relationship !== ALL ||
    status !== ALL ||
    type !== ALL;

  const relationshipOptions = useMemo(
    () => [
      { value: ALL, label: "All links" },
      { value: "received", label: "Received" },
      { value: "attached", label: "Attached" },
    ],
    [],
  );

  const statusOptions = useMemo(
    () => [
      { value: ALL, label: "All statuses" },
      ...uniqueOfferStatuses(result.offers).map((item) => ({
        value: item,
        label: humanizeOfferStatus(item),
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
        id: "relationship",
        label: "Link",
        visible: true,
        render: (_, row) => <RelationshipBadges offer={row} />,
      },
      {
        id: "status",
        label: "Status",
        visible: true,
        render: (_, row) => (
          <div className="min-w-[108px]">
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusClassName(
                row.status,
              )}`}
            >
              {humanizeOfferStatus(row.status)}
            </span>
            {row.validity === "expired" || row.validity === "scheduled" ? (
              <p className="mt-1 text-xs text-amber-700">
                {humanizeValidity(row.validity)}
              </p>
            ) : null}
          </div>
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
        id: "redemptions",
        label: "Redemptions",
        visible: true,
        render: (_, row) => (
          <div className="min-w-[150px]">
            <p className="text-sm text-gray-900">{usageSummary(row)}</p>
            {row.redeemedAt ? (
              <DateFormatter
                date={row.redeemedAt}
                includeTime
                useUserTimezone
                className="text-xs text-gray-500"
              />
            ) : (
              <p className="text-xs text-gray-400">No redemption yet</p>
            )}
          </div>
        ),
      },
      {
        id: "viaCampaigns",
        label: "Linked through",
        visible: true,
        render: (_, row) => (
          <div className="flex flex-wrap gap-1 min-w-[160px]">
            {row.viaCampaigns.length === 0 && row.viaSegments.length === 0 ? (
              <span className="text-sm text-gray-400">
                {row.isAttached ? "Direct attachment" : "—"}
              </span>
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
            {row.viaSegments.length > 0 ? (
              <p className="mt-1 w-full truncate text-xs text-gray-500">
                {row.viaSegments.map((segment) => segment.segmentName).join(", ")}
              </p>
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
    setRelationship(ALL);
    setStatus(ALL);
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
          <p className="text-sm text-gray-500 max-w-3xl">
            Each row is one offer for this customer: how they received it, and
            whether they are attached to the reward. Attachment keeps the status
            Active. Redemptions are counted separately and can happen more than
            once.
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
              Attached
            </p>
            <Link2 className="h-4 w-4 text-gray-400" />
          </div>
          <p className="text-2xl font-semibold text-gray-900">
            {isLoading && result.offers.length === 0
              ? "—"
              : result.counts.attached.toLocaleString()}
          </p>
          <p className="mt-1 text-xs text-gray-500">
            {isLoading
              ? "Checking reward attachment"
              : `${result.counts.active.toLocaleString()} active while attached`}
          </p>
        </div>
        <div className={`${tw.rounded} border border-gray-200 bg-white p-4`}>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              Received
            </p>
            <Gift className="h-4 w-4 text-gray-400" />
          </div>
          <p className="text-2xl font-semibold text-gray-900">
            {isLoading && result.offers.length === 0
              ? "—"
              : result.counts.received.toLocaleString()}
          </p>
          <p className="mt-1 text-xs text-gray-500">
            {isLoading
              ? "Checking deliveries"
              : result.counts.both > 0
                ? `${result.counts.both.toLocaleString()} also attached`
                : "Delivered to this customer"}
          </p>
        </div>
        <div className={`${tw.rounded} border border-gray-200 bg-white p-4`}>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              Redemptions
            </p>
            <Ticket className="h-4 w-4 text-gray-400" />
          </div>
          <p className="text-2xl font-semibold text-gray-900">
            {isLoading && result.offers.length === 0
              ? "—"
              : result.counts.redemptionEvents.toLocaleString()}
          </p>
          <p className="mt-1 text-xs text-gray-500">
            {isLoading
              ? "Counting every use"
              : lastRedeemed
                ? "Last redeemed "
                : "No redemption on file. Repeat uses stay on the same offer."}
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
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3 mb-4">
        <SearchInput
          placeholder="Search offers, campaigns, or segments..."
          value={searchTerm}
          onChange={setSearchTerm}
        />
        <HeadlessSelect
          value={relationship}
          onChange={(value) => setRelationship(String(value))}
          options={relationshipOptions}
          placeholder="Link"
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
              : "No offers are received or attached for this customer"}
          </p>
          <p className="text-gray-500 text-sm mt-1">
            {filtersActive
              ? "Try a different link, status, type, or search term."
              : "Received offers appear when this customer is delivered an offer. Attached offers stay Active while the customer is linked to the reward."}
          </p>
        </div>
      ) : (
        <>
          <p className="text-xs text-gray-500 mb-3">
            Showing {filtered.length.toLocaleString()} offer
            {filtered.length === 1 ? "" : "s"}. Open a row to see how it was
            received, how the customer is attached, and each redemption.
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
