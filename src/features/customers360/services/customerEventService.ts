import { API_CONFIG, getAuthHeaders } from "../../../shared/services/api";
import { engineTrackingSourceService } from "../../configurations/services/engineTrackingSourceService";
import type {
  CustomerEvent,
  CustomerEventListResult,
  CustomerEventQuery,
  TrackingSourceOption,
} from "../types/customerEvent";
import {
  aggregateEventCounts,
  buildEventFacets,
  EMPTY_EVENT_COUNTS,
  filterCustomerEvents,
  generateFallbackCustomerEvents,
  normalizeCustomerEvent,
  parseApiCounts,
  unwrapEventList,
} from "../utils/customerEventHelpers";

const FALLBACK_CACHE = new Map<string, CustomerEvent[]>();

function queryToSearchParams(query: CustomerEventQuery): URLSearchParams {
  const params = new URLSearchParams();
  if (query.search?.trim()) params.set("search", query.search.trim());
  if (query.event_type && query.event_type !== "all") {
    params.set("event_type", query.event_type);
  }
  if (query.tracking_source_id && query.tracking_source_id !== "all") {
    params.set("tracking_source_id", query.tracking_source_id);
  }
  if (query.origin && query.origin !== "all") params.set("origin", query.origin);
  if (query.status && query.status !== "all") params.set("status", query.status);
  if (query.channel && query.channel !== "all") params.set("channel", query.channel);
  if (query.time_preset && query.time_preset !== "custom") {
    params.set("preset", query.time_preset);
  }
  if (query.date_from) params.set("from", query.date_from);
  if (query.date_to) params.set("to", query.date_to);
  params.set("limit", String(query.limit ?? 500));
  params.set("offset", String(query.offset ?? 0));
  return params;
}

function buildResult(
  allEvents: CustomerEvent[],
  query: CustomerEventQuery,
  source: "api" | "fallback",
  apiCounts?: CustomerEventListResult["counts"] | null,
): CustomerEventListResult {
  const now = new Date();
  const attributeFiltered = filterCustomerEvents(
    allEvents,
    { ...query, time_preset: "all", date_from: undefined, date_to: undefined },
    now,
  );
  const events = filterCustomerEvents(allEvents, query, now);

  return {
    events,
    allEvents,
    total: events.length,
    counts: apiCounts || aggregateEventCounts(attributeFiltered, now),
    facets: buildEventFacets(allEvents),
    source,
  };
}

async function fetchFromApi(
  subscriberId: string,
  query: CustomerEventQuery,
): Promise<CustomerEventListResult> {
  const params = queryToSearchParams(query);
  const url = `${API_CONFIG.BASE_URL}/subscribers/${encodeURIComponent(subscriberId)}/events?${params.toString()}`;
  const response = await fetch(url, {
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error(`Events API returned ${response.status}`);
  }

  const payload = await response.json();
  const record =
    payload && typeof payload === "object"
      ? (payload as Record<string, unknown>)
      : {};

  if (record.success === false) {
    throw new Error(
      typeof record.message === "string"
        ? record.message
        : "Events API returned an unsuccessful response",
    );
  }

  const rawEvents = unwrapEventList(payload);
  const allEvents = rawEvents
    .map((item, index) => normalizeCustomerEvent(item, index))
    .filter((item): item is CustomerEvent => Boolean(item));

  const apiCounts = parseApiCounts(record.counts);

  return buildResult(allEvents, query, "api", apiCounts);
}

function getFallbackEvents(subscriberId: string): CustomerEvent[] {
  const cached = FALLBACK_CACHE.get(subscriberId);
  if (cached) return cached;
  const generated = generateFallbackCustomerEvents(subscriberId);
  FALLBACK_CACHE.set(subscriberId, generated);
  return generated;
}

export const customerEventService = {
  async getSubscriberEvents(
    subscriberId: string | number,
    query: CustomerEventQuery = {},
  ): Promise<CustomerEventListResult> {
    const id = String(subscriberId);
    if (!id) {
      return {
        events: [],
        allEvents: [],
        total: 0,
        counts: EMPTY_EVENT_COUNTS,
        facets: {
          event_types: [],
          tracking_sources: [],
          statuses: [],
          channels: [],
        },
        source: "fallback",
      };
    }

    try {
      return await fetchFromApi(id, query);
    } catch {
      return buildResult(getFallbackEvents(id), query, "fallback");
    }
  },

  async getTrackingSourceOptions(): Promise<TrackingSourceOption[]> {
    try {
      const sources = await engineTrackingSourceService.getAll({
        is_active: true,
        limit: 200,
      });
      if (sources.length > 0) {
        return sources.map((source) => ({
          id: String(source.id),
          name: source.name || source.code,
          sourceType: String(source.sourceType || ""),
        }));
      }
    } catch {
      // Catalog may be empty or unreachable; event facets still populate the filter.
    }
    return [];
  },
};

export default customerEventService;
