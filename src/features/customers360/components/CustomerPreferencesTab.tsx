import { useEffect, useMemo, useState } from "react";
import { BellOff, Globe, RotateCcw, Smartphone } from "lucide-react";
import DateFormatter from "../../../shared/components/DateFormatter";
import HeadlessSelect from "../../../shared/components/ui/HeadlessSelect";
import LoadingSpinner from "../../../shared/components/ui/LoadingSpinner";
import Pagination, {
  DEFAULT_PAGE_SIZE,
} from "../../../shared/components/ui/Pagination";
import SearchInput from "../../../shared/components/ui/SearchInput";
import { Table, type TableColumn } from "../../../shared/components/Table";
import { color, tw } from "../../../shared/utils/utils";
import { useCustomerPreferences } from "../hooks/useCustomerPreferences";
import type {
  CustomerChannelPreference,
  CustomerPreferenceConsentStatus,
  CustomerPreferenceItem,
} from "../types/customerPreference";
import {
  filterConsents,
  humanizeConsentStatus,
  humanizePreferenceChannel,
  humanizePreferenceKind,
  uniqueConsentChannels,
  uniqueConsentStatuses,
} from "../utils/customerPreferenceHelpers";
import CustomerPreferenceDetailsExpandedRow from "./CustomerPreferenceDetailsExpandedRow";

type CustomerPreferencesTabProps = {
  subscriberId?: string | number | null;
  customerRecord?: Record<string, unknown> | null;
};

const ALL = "all";

function statusClassName(status: CustomerPreferenceConsentStatus): string {
  if (status === "opted_in") return "bg-green-50 text-green-800";
  if (status === "opted_out") return "bg-red-50 text-red-800";
  if (status === "preferred") return "bg-sky-50 text-sky-800";
  return "bg-gray-100 text-gray-700";
}

function progressLabel(
  phase: "lookup" | "dnd" | "events" | "catalog",
  checked: number,
  total: number,
): string {
  if (phase === "lookup") return "Checking subscriber preferences...";
  if (phase === "dnd") {
    return total > 0
      ? `Matching DND subscriptions (${checked.toLocaleString()} of ${total.toLocaleString()})...`
      : "Matching DND subscriptions...";
  }
  if (phase === "events") return "Checking live opt-in events...";
  return "Loading channel and DND type labels...";
}

function ChannelCard({ item }: { item: CustomerChannelPreference }) {
  return (
    <div
      className={`${tw.rounded} border border-gray-100 px-4 py-3`}
      style={{ backgroundColor: "var(--c-readonly-field-bg)" }}
    >
      <p className="text-xs uppercase text-gray-500 mb-1">{item.channelLabel}</p>
      <p className="text-sm font-semibold text-gray-900">
        {humanizeConsentStatus(item.status)}
        {item.verification === "hint" ? " · Unverified" : ""}
      </p>
      {item.categories.length > 0 ? (
        <p className="text-xs text-gray-500 mt-1">
          {item.categories.slice(0, 3).join(", ")}
          {item.categories.length > 3 ? ` +${item.categories.length - 3}` : ""}
        </p>
      ) : null}
    </div>
  );
}

export default function CustomerPreferencesTab({
  subscriberId,
  customerRecord,
}: CustomerPreferencesTabProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [channel, setChannel] = useState(ALL);
  const [status, setStatus] = useState(ALL);
  const [page, setPage] = useState(1);
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);
  const pageSize = DEFAULT_PAGE_SIZE;

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(searchTerm), 300);
    return () => window.clearTimeout(timer);
  }, [searchTerm]);

  const { result, progress, isLoading, error, refetch } = useCustomerPreferences(
    subscriberId ?? undefined,
    customerRecord,
  );

  const filtered = useMemo(
    () =>
      filterConsents(result.consents, {
        search: debouncedSearch,
        channel,
        status,
      }),
    [result.consents, debouncedSearch, channel, status],
  );

  useEffect(() => {
    setPage(1);
    setExpandedRowId(null);
  }, [debouncedSearch, channel, status, subscriberId]);

  const filtersActive =
    Boolean(debouncedSearch.trim()) || channel !== ALL || status !== ALL;

  const channelOptions = useMemo(
    () => [
      { value: ALL, label: "All channels" },
      ...uniqueConsentChannels(result.consents).map((item) => ({
        value: item,
        label: humanizePreferenceChannel(item),
      })),
    ],
    [result.consents],
  );

  const statusOptions = useMemo(
    () => [
      { value: ALL, label: "All statuses" },
      ...uniqueConsentStatuses(result.consents).map((item) => ({
        value: item,
        label: humanizeConsentStatus(item),
      })),
    ],
    [result.consents],
  );

  const paginated = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page, pageSize]);

  const settings = result.settings;
  const hasPrivacy =
    settings.personalization != null ||
    settings.dataSharing != null ||
    settings.contentCategories.length > 0 ||
    Boolean(settings.frequency);

  const columns: TableColumn<CustomerPreferenceItem>[] = useMemo(
    () => [
      {
        id: "name",
        label: "Preference",
        visible: true,
        render: (_, row) => (
          <div className="min-w-[160px]">
            <p className={`text-sm font-medium ${tw.tableFirstColumn}`}>
              {row.name}
            </p>
            <p className="text-xs text-gray-500 mt-0.5">
              {humanizePreferenceKind(row.kind)}
              {row.category ? ` · ${row.category}` : ""}
            </p>
          </div>
        ),
      },
      {
        id: "channel",
        label: "Channel",
        visible: true,
        render: (_, row) => (
          <span className="text-sm text-gray-700">
            {row.channelLabel || "—"}
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
            {humanizeConsentStatus(row.status)}
            {row.verification === "hint" ? " · Unverified" : ""}
          </span>
        ),
      },
      {
        id: "updatedAt",
        label: "Updated",
        visible: true,
        render: (_, row) =>
          row.updatedAt ? (
            <DateFormatter
              date={row.updatedAt}
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
    setChannel(ALL);
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
            Preferences
          </h3>
          <p className="text-sm text-gray-500">
            Channel consent, DND opt-outs, and profile communication settings
            for this customer.
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
              Language
            </p>
            <Globe className="h-4 w-4 text-gray-400" />
          </div>
          <p className="text-2xl font-semibold text-gray-900">
            {isLoading ? "—" : settings.languageLabel || "—"}
          </p>
          <p className="mt-1 text-xs text-gray-500">
            {isLoading
              ? "Preferred language"
              : settings.language
                ? settings.verification === "hint"
                  ? "From customer profile · Unverified"
                  : "Preferred language"
                : "No language on file"}
          </p>
        </div>
        <div className={`${tw.rounded} border border-gray-200 bg-white p-4`}>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              Preferred channel
            </p>
            <Smartphone className="h-4 w-4 text-gray-400" />
          </div>
          <p className="text-2xl font-semibold text-gray-900">
            {isLoading ? "—" : settings.preferredChannelLabel || "—"}
          </p>
          <p className="mt-1 text-xs text-gray-500">
            Routing preference, not full opt-in
          </p>
        </div>
        <div className={`${tw.rounded} border border-gray-200 bg-white p-4`}>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              Active opt-outs
            </p>
            <BellOff className="h-4 w-4 text-gray-400" />
          </div>
          <p className="text-2xl font-semibold text-gray-900">
            {isLoading ? "—" : result.counts.optedOut.toLocaleString()}
          </p>
          <p className="mt-1 text-xs text-gray-500">
            {isLoading
              ? "DND and withdrawn consent"
              : `${result.counts.channels.toLocaleString()} channel${result.counts.channels === 1 ? "" : "s"} on file`}
          </p>
        </div>
      </div>

      {result.channels.length > 0 && !isLoading && (
        <div className="mb-6">
          <h4 className="text-base font-semibold text-gray-900 mb-3">
            Channel Preferences
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {result.channels.map((item) => (
              <ChannelCard key={item.id} item={item} />
            ))}
          </div>
        </div>
      )}

      {hasPrivacy && !isLoading && (
        <div className="mb-6">
          <h4 className="text-base font-semibold text-gray-900 mb-3">
            Privacy & content
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {settings.frequency ? (
              <div
                className={`${tw.rounded} border border-gray-100 px-4 py-3`}
                style={{ backgroundColor: "var(--c-readonly-field-bg)" }}
              >
                <p className="text-xs uppercase text-gray-500 mb-1">Frequency</p>
                <p className="text-sm font-semibold text-gray-900">
                  {settings.frequency}
                </p>
              </div>
            ) : null}
            {settings.personalization != null ? (
              <div
                className={`${tw.rounded} border border-gray-100 px-4 py-3`}
                style={{ backgroundColor: "var(--c-readonly-field-bg)" }}
              >
                <p className="text-xs uppercase text-gray-500 mb-1">
                  Personalization
                </p>
                <p className="text-sm font-semibold text-gray-900">
                  {settings.personalization ? "Allowed" : "Not allowed"}
                </p>
              </div>
            ) : null}
            {settings.dataSharing != null ? (
              <div
                className={`${tw.rounded} border border-gray-100 px-4 py-3`}
                style={{ backgroundColor: "var(--c-readonly-field-bg)" }}
              >
                <p className="text-xs uppercase text-gray-500 mb-1">
                  Data sharing
                </p>
                <p className="text-sm font-semibold text-gray-900">
                  {settings.dataSharing ? "Allowed" : "Not allowed"}
                </p>
              </div>
            ) : null}
          </div>
          {settings.contentCategories.length > 0 ? (
            <ul className="flex flex-wrap gap-2 mt-3">
              {settings.contentCategories.map((category) => (
                <li
                  key={category}
                  className="inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-800"
                >
                  {category}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      )}

      <div className="mb-4">
        <h4 className="text-base font-semibold text-gray-900 mb-3">
          Consent & DND
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <SearchInput
            placeholder="Search channels, categories, or DND types..."
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
              ? "No preferences match the selected filters"
              : "No channel consent or DND records for this customer"}
          </p>
          <p className="text-gray-500 text-sm mt-1">
            {filtersActive
              ? "Try a different channel, status, or search term."
              : "Language and preferred channel can be edited on the customer profile. Opt-outs are managed in DND Management."}
          </p>
        </div>
      ) : (
        <>
          <p className="text-xs text-gray-500 mb-3">
            Showing {filtered.length.toLocaleString()} preference
            {filtered.length === 1 ? "" : "s"} for this customer
          </p>
          <div className={`${tw.rounded} overflow-hidden`}>
            <Table<CustomerPreferenceItem>
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
                <CustomerPreferenceDetailsExpandedRow item={row} />
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
