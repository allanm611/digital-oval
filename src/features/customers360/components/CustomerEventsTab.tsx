import { useEffect, useMemo, useState } from "react";
import { Activity, Calendar, Clock, RotateCcw, X } from "lucide-react";
import DateFormatter from "../../../shared/components/DateFormatter";
import HeadlessMultiSelect from "../../../shared/components/ui/HeadlessMultiSelect";
import HeadlessSelect from "../../../shared/components/ui/HeadlessSelect";
import Input from "../../../shared/components/ui/Input";
import LoadingSpinner from "../../../shared/components/ui/LoadingSpinner";
import Pagination, {
  DEFAULT_PAGE_SIZE,
} from "../../../shared/components/ui/Pagination";
import SearchInput from "../../../shared/components/ui/SearchInput";
import { Table, type TableColumn } from "../../../shared/components/Table";
import { color, tw } from "../../../shared/utils/utils";
import { useCustomerEvents } from "../hooks/useCustomerEvents";
import CustomerEventDetailsExpandedRow from "./CustomerEventDetailsExpandedRow";
import type {
  CustomerEvent,
  CustomerEventCountBucket,
  CustomerEventOrigin,
  EventTimePreset,
} from "../types/customerEvent";
import {
  aggregateEventCounts,
  CHANNEL_FILTER_OPTIONS,
  EMPTY_COUNT_BUCKET,
  EVENT_TIME_TABS,
  filterCustomerEvents,
  hasActiveEventFilters,
  humanizeChannel,
  humanizeOrigin,
  normalizeDateOrder,
  todayDateInputValue,
} from "../utils/customerEventHelpers";

type CustomerEventsTabProps = {
  subscriberId?: string | number | null;
};

type TimeTabKey = (typeof EVENT_TIME_TABS)[number]["key"];

const ALL = "all";
const DEFAULT_PRESET: EventTimePreset = "last_30d";

const originOptions = [
  { value: ALL, label: "All origins" },
  { value: "customer", label: "Customer-driven" },
  { value: "system", label: "System events" },
];

function statusClassName(status: string): string {
  const value = status.toLowerCase();
  if (["opened", "clicked", "read", "completed", "recorded"].includes(value)) {
    return "bg-green-50 text-green-800";
  }
  if (["failed", "bounced", "rejected"].includes(value)) {
    return "bg-red-50 text-red-800";
  }
  if (["sent", "delivered"].includes(value)) {
    return "bg-sky-50 text-sky-800";
  }
  return "bg-gray-100 text-gray-700";
}

function formatCustomRangeLabel(dateFrom: string, dateTo: string): string {
  if (!dateFrom && !dateTo) return "Pick dates";
  if (dateFrom && dateTo) return `${dateFrom} → ${dateTo}`;
  if (dateFrom) return `From ${dateFrom}`;
  return `Until ${dateTo}`;
}

export default function CustomerEventsTab({
  subscriberId,
}: CustomerEventsTabProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [eventTypes, setEventTypes] = useState<string[]>([]);
  const [trackingSourceId, setTrackingSourceId] = useState(ALL);
  const [channel, setChannel] = useState(ALL);
  const [origin, setOrigin] = useState<CustomerEventOrigin | typeof ALL>(ALL);
  const [timePreset, setTimePreset] = useState<EventTimePreset>(DEFAULT_PRESET);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [customPickerOpen, setCustomPickerOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);
  const pageSize = DEFAULT_PAGE_SIZE;
  const today = todayDateInputValue();

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(searchTerm), 300);
    return () => window.clearTimeout(timer);
  }, [searchTerm]);

  const query = useMemo(
    () => ({
      search: debouncedSearch,
      event_types: eventTypes,
      tracking_source_id: trackingSourceId,
      channel,
      origin,
      time_preset: timePreset,
      date_from: timePreset === "custom" ? dateFrom : undefined,
      date_to: timePreset === "custom" ? dateTo : undefined,
    }),
    [
      debouncedSearch,
      eventTypes,
      trackingSourceId,
      channel,
      origin,
      timePreset,
      dateFrom,
      dateTo,
    ],
  );

  const { result, trackingSources, isLoading, error, refetch } =
    useCustomerEvents(subscriberId ?? undefined);

  const filteredEvents = useMemo(
    () => filterCustomerEvents(result.allEvents, query),
    [result.allEvents, query],
  );

  const counts = useMemo(
    () => aggregateEventCounts(result.allEvents),
    [result.allEvents],
  );

  const customCount = useMemo((): CustomerEventCountBucket => {
    if (!dateFrom && !dateTo) return EMPTY_COUNT_BUCKET;
    const ranged = filterCustomerEvents(result.allEvents, {
      time_preset: "custom",
      date_from: dateFrom,
      date_to: dateTo,
    });
    return ranged.reduce(
      (bucket, event) => {
        bucket.total += 1;
        bucket[event.origin] += 1;
        return bucket;
      },
      { total: 0, customer: 0, system: 0 } as CustomerEventCountBucket,
    );
  }, [result.allEvents, dateFrom, dateTo]);

  useEffect(() => {
    setPage(1);
    setExpandedRowId(null);
  }, [
    debouncedSearch,
    eventTypes,
    trackingSourceId,
    channel,
    origin,
    timePreset,
    dateFrom,
    dateTo,
  ]);

  const filtersActive = hasActiveEventFilters(query, DEFAULT_PRESET);

  const eventTypeOptions = useMemo(
    () =>
      result.facets.event_types.map((item) => ({
        value: item.value,
        label: item.count ? `${item.label} (${item.count})` : item.label,
      })),
    [result.facets.event_types],
  );

  const trackingSourceOptions = useMemo(() => {
    const labels = new Map<string, string>();
    result.facets.tracking_sources.forEach((item) => {
      labels.set(item.value, item.label);
    });
    trackingSources.forEach((source) => {
      const key = source.sourceType || source.id;
      if (!labels.has(source.id) && !labels.has(key)) {
        labels.set(key, source.name);
      }
    });
    return [
      { value: ALL, label: "All tracking sources" },
      ...Array.from(labels.entries())
        .sort((a, b) => a[1].localeCompare(b[1]))
        .map(([value, label]) => ({ value, label })),
    ];
  }, [result.facets.tracking_sources, trackingSources]);

  const channelOptions = useMemo(() => {
    const labels = new Map<string, string>();
    CHANNEL_FILTER_OPTIONS.forEach((item) => {
      labels.set(item.value, item.label);
    });
    result.facets.channels.forEach((item) => {
      if (!labels.has(item.value)) {
        labels.set(item.value, humanizeChannel(item.label || item.value));
      }
    });
    return [
      { value: ALL, label: "All Channels" },
      ...Array.from(labels.entries()).map(([value, label]) => ({
        value,
        label,
      })),
    ];
  }, [result.facets.channels]);

  const paginatedEvents = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredEvents.slice(start, start + pageSize);
  }, [filteredEvents, page, pageSize]);

  const columns: TableColumn<CustomerEvent>[] = useMemo(
    () => [
      {
        id: "event_type_label",
        label: "Event Type",
        visible: true,
        render: (_, row) => (
          <div className="min-w-[140px]">
            <p className={`text-sm font-medium ${tw.tableFirstColumn}`}>
              {row.event_type_label}
            </p>
            <p className="text-xs text-gray-500 font-mono">{row.event_type}</p>
          </div>
        ),
      },
      {
        id: "description",
        label: "Description",
        visible: true,
        render: (_, row) => (
          <span className="text-sm text-gray-700">{row.description || "—"}</span>
        ),
      },
      {
        id: "tracking_source_name",
        label: "Tracking Source",
        visible: true,
        render: (_, row) => (
          <span className="text-sm text-gray-900">
            {row.tracking_source_name || "—"}
          </span>
        ),
      },
      {
        id: "channel",
        label: "Channel",
        visible: true,
        render: (_, row) => (
          <span className="text-sm text-gray-900">
            {humanizeChannel(row.channel)}
          </span>
        ),
      },
      {
        id: "origin",
        label: "Origin",
        visible: true,
        render: (_, row) => (
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
              row.origin === "customer"
                ? "bg-teal-50 text-teal-800"
                : "bg-violet-50 text-violet-800"
            }`}
          >
            {humanizeOrigin(row.origin)}
          </span>
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
            {row.status}
          </span>
        ),
      },
      {
        id: "occurred_at",
        label: "Occurred At",
        visible: true,
        render: (_, row) => (
          <DateFormatter
            date={row.occurred_at}
            includeTime
            useUserTimezone
            className="text-sm text-gray-700"
          />
        ),
      },
    ],
    [],
  );

  const applyTimePreset = (preset: TimeTabKey) => {
    if (preset === "custom") {
      setTimePreset("custom");
      setCustomPickerOpen(true);
      return;
    }
    setTimePreset(preset);
    setCustomPickerOpen(false);
    setDateFrom("");
    setDateTo("");
  };

  const updateCustomDate = (field: "from" | "to", value: string) => {
    const nextFrom = field === "from" ? value : dateFrom;
    const nextTo = field === "to" ? value : dateTo;
    const ordered = normalizeDateOrder(nextFrom, nextTo);
    setDateFrom(ordered.from);
    setDateTo(ordered.to);
    if (ordered.from && ordered.to) {
      setCustomPickerOpen(false);
    }
  };

  const clearFilters = () => {
    setSearchTerm("");
    setDebouncedSearch("");
    setEventTypes([]);
    setTrackingSourceId(ALL);
    setChannel(ALL);
    setOrigin(ALL);
    setTimePreset(DEFAULT_PRESET);
    setDateFrom("");
    setDateTo("");
    setCustomPickerOpen(false);
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
            Customer Events
          </h3>
          <p className="text-sm text-gray-500">
            Counts of customer-driven and system events.
          </p>
        </div>
        {filtersActive && (
          <button
            type="button"
            onClick={clearFilters}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-700 border border-gray-200 ${tw.rounded} hover:bg-gray-50`}
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reset filters
          </button>
        )}
      </div>

      <div
        className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-4"
        role="tablist"
        aria-label="Event time window"
      >
        {EVENT_TIME_TABS.map((window) => {
          const isCustom = window.key === "custom";
          const bucket = isCustom ? customCount : counts[window.key];
          const isActive = timePreset === window.key;
          const showCustomCount = isCustom && Boolean(dateFrom || dateTo);
          return (
            <button
              key={window.key}
              type="button"
              onClick={() => applyTimePreset(window.key)}
              role="tab"
              aria-selected={timePreset === window.key}
              title={
                isCustom && dateFrom && dateTo && !customPickerOpen
                  ? "Click to edit the date range"
                  : window.hint
              }
              className={`${tw.rounded} border bg-white p-4 text-left transition-all duration-150 cursor-pointer ${
                isActive
                  ? "translate-y-1 shadow-inner"
                  : "border-gray-200 hover:shadow-sm hover:-translate-y-0.5"
              }`}
              style={
                isActive
                  ? {
                      borderColor: color.primary.accent,
                      borderWidth: 2,
                      backgroundColor: "rgba(0, 187, 204, 0.08)",
                      boxShadow: `inset 0 2px 4px rgba(0, 187, 204, 0.18)`,
                    }
                  : undefined
              }
            >
              <div className="flex items-center justify-between gap-2 mb-2">
                <p
                  className={`text-xs font-medium uppercase tracking-wide ${
                    isActive ? "text-gray-800" : "text-gray-500"
                  }`}
                >
                  {window.label}
                </p>
                {window.key === "last_1h" || window.key === "last_24h" ? (
                  <Clock
                    className="h-4 w-4"
                    style={{ color: isActive ? color.primary.accent : undefined }}
                  />
                ) : isCustom ? (
                  <Calendar
                    className="h-4 w-4"
                    style={{ color: isActive ? color.primary.accent : undefined }}
                  />
                ) : (
                  <Activity
                    className="h-4 w-4"
                    style={{ color: isActive ? color.primary.accent : undefined }}
                  />
                )}
              </div>
              <p className="text-2xl font-semibold text-gray-900">
                {isLoading
                  ? "—"
                  : isCustom && !showCustomCount
                    ? "—"
                    : bucket.total.toLocaleString()}
              </p>
              <p className="mt-2 text-xs text-gray-500">
                {isCustom
                  ? formatCustomRangeLabel(dateFrom, dateTo)
                  : `${bucket.customer.toLocaleString()} customer · ${bucket.system.toLocaleString()} system`}
              </p>
            </button>
          );
        })}
      </div>

      {timePreset === "custom" && customPickerOpen && (
        <div
          className={`${tw.rounded} border bg-white p-4 mb-4 grid grid-cols-1 md:grid-cols-2 gap-3`}
          style={{ borderColor: color.primary.accent }}
        >
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
              Start date
            </p>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
              <Input
                type="date"
                value={dateFrom}
                max={dateTo || today}
                onChange={(value) => updateCustomDate("from", String(value))}
                placeholder="Start date"
                className="pl-10 pr-10"
                onClick={(e) =>
                  (e.currentTarget as HTMLInputElement).showPicker?.()
                }
              />
              {dateFrom && (
                <button
                  type="button"
                  onClick={() => setDateFrom("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  aria-label="Clear start date"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
              End date
            </p>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
              <Input
                type="date"
                value={dateTo}
                min={dateFrom || undefined}
                max={today}
                onChange={(value) => updateCustomDate("to", String(value))}
                placeholder="End date"
                className="pl-10 pr-10"
                onClick={(e) =>
                  (e.currentTarget as HTMLInputElement).showPicker?.()
                }
              />
              {dateTo && (
                <button
                  type="button"
                  onClick={() => setDateTo("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  aria-label="Clear end date"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
          {!dateFrom && !dateTo ? (
            <p className="md:col-span-2 text-xs text-gray-500">
              Choose a start and end date. The end date is inclusive, and cannot
              be in the future.
            </p>
          ) : null}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-3 mb-6">
        <SearchInput
          placeholder="Search events..."
          value={searchTerm}
          onChange={setSearchTerm}
        />
        <HeadlessSelect
          value={channel}
          onChange={(value) => setChannel(String(value))}
          options={channelOptions}
          placeholder="All Channels"
          className="w-full"
        />
        <HeadlessMultiSelect
          value={eventTypes}
          onChange={(value) => setEventTypes(value.map(String))}
          options={eventTypeOptions}
          placeholder="All event types"
          searchable
          showCheckboxes
          hideSelectedChips
          className="w-full"
        />
        <HeadlessSelect
          value={trackingSourceId}
          onChange={(value) => setTrackingSourceId(String(value))}
          options={trackingSourceOptions}
          placeholder="Tracking source"
          searchable
          className="w-full"
        />
        <HeadlessSelect
          value={origin}
          onChange={(value) =>
            setOrigin(String(value) as CustomerEventOrigin | typeof ALL)
          }
          options={originOptions}
          placeholder="Origin"
          className="w-full"
        />
      </div>

      {error && (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 flex items-center justify-between gap-3">
          <span>{error}</span>
          <button
            type="button"
            onClick={() => void refetch()}
            className="font-medium underline"
          >
            Retry
          </button>
        </div>
      )}

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-16">
          <LoadingSpinner variant="modern" size="lg" color="primary" />
          <p className="mt-3 text-sm text-gray-500">Loading customer events...</p>
        </div>
      ) : filteredEvents.length === 0 ? (
        <div className="py-12 text-center border border-dashed border-gray-200 rounded-md">
          <p className="text-gray-700 text-sm font-medium">
            {filtersActive
              ? "No events match the selected filters"
              : "No events recorded yet"}
          </p>
          <p className="text-gray-500 text-sm mt-1">
            {filtersActive
              ? "Try a different event type, tracking source, or time window."
              : "Customer-driven and system events will appear here as they occur."}
          </p>
        </div>
      ) : (
        <>
          <p className="text-xs text-gray-500 mb-3">
            Showing {filteredEvents.length.toLocaleString()} event
            {filteredEvents.length === 1 ? "" : "s"} in this preview window
          </p>
          <div className={`${tw.rounded} overflow-hidden`}>
            <Table<CustomerEvent>
              columns={columns}
              data={paginatedEvents}
              totalItems={filteredEvents.length}
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
                <CustomerEventDetailsExpandedRow event={row} />
              )}
              style={{
                headerBackground: color.surface.tableHeader,
                headerTextColor: color.surface.tableHeaderText,
                rowBackground: color.surface.tablebodybg,
                rowSpacing: "0 8px",
              }}
            />
          </div>
          {filteredEvents.length > pageSize && (
            <div className="mt-4">
              <Pagination
                currentPage={page}
                pageSize={pageSize}
                totalItems={filteredEvents.length}
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
