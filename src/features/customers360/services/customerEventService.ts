import { campaignService } from "../../campaigns/services/campaignService";
import { offerService } from "../../offers/services/offerService";
import { offerCreativeService } from "../../offers/services/offerCreativeService";
import type { CreativeChannel } from "../../offers/types/offerCreative";
import { API_CONFIG, getAuthHeaders } from "../../../shared/services/api";
import { engineTrackingSourceService } from "../../configurations/services/engineTrackingSourceService";
import type {
  CustomerEvent,
  CustomerEventCampaignSummary,
  CustomerEventCreativeSummary,
  CustomerEventListResult,
  CustomerEventOfferSummary,
  CustomerEventQuery,
  TrackingSourceOption,
} from "../types/customerEvent";
import {
  aggregateEventCounts,
  buildEventFacets,
  EMPTY_EVENT_COUNTS,
  filterCustomerEvents,
  generateFallbackCustomerEvents,
  isCommunicationLinkedEvent,
  normalizeCustomerEvent,
  parseApiCounts,
  toCreativeChannel,
  unwrapEventList,
} from "../utils/customerEventHelpers";

function mergeOffer(
  base: CustomerEventOfferSummary | null,
  live: CustomerEventOfferSummary | null,
): CustomerEventOfferSummary | null {
  if (!base && !live) return null;
  return {
    id: live?.id ?? base?.id ?? null,
    name: live?.name || base?.name || "",
    code: live?.code || base?.code || "",
    type: live?.type || base?.type || "",
    status: live?.status || base?.status || "",
    description: live?.description || base?.description || "",
  };
}

function mergeCampaign(
  base: CustomerEventCampaignSummary | null,
  live: CustomerEventCampaignSummary | null,
): CustomerEventCampaignSummary | null {
  if (!base && !live) return null;
  return {
    id: live?.id ?? base?.id ?? null,
    name: live?.name || base?.name || "",
    code: live?.code || base?.code || "",
    status: live?.status || base?.status || "",
    type: live?.type || base?.type || "",
  };
}

function mergeCreative(
  base: CustomerEventCreativeSummary | null,
  live: CustomerEventCreativeSummary | null,
): CustomerEventCreativeSummary | null {
  if (!base && !live) return null;
  return {
    id: live?.id ?? base?.id ?? null,
    name: live?.name || base?.name || "",
    channel: live?.channel || base?.channel || "",
    title: live?.title || base?.title || "",
    locale: live?.locale || base?.locale || "",
    text_body: live?.text_body || base?.text_body || "",
    html_body: live?.html_body || base?.html_body || "",
  };
}

const offerCache = new Map<number, CustomerEventOfferSummary>();
const campaignCache = new Map<number, CustomerEventCampaignSummary>();
const creativeCache = new Map<number, CustomerEventCreativeSummary>();
const latestCreativeCache = new Map<string, CustomerEventCreativeSummary>();
const FALLBACK_CACHE = new Map<string, CustomerEvent[]>();

function emptyEventResult(
  source: CustomerEventListResult["source"] = "fallback",
): CustomerEventListResult {
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
    source,
  };
}

async function fetchOfferSummary(
  id: number,
): Promise<CustomerEventOfferSummary | null> {
  const cached = offerCache.get(id);
  if (cached) return cached;
  try {
    const response = await offerService.getOfferById(id);
    const offer = response?.data;
    if (!offer) return null;
    const summary: CustomerEventOfferSummary = {
      id: offer.id,
      name: offer.name || "",
      code: offer.code || "",
      type: String(offer.offer_type_label || offer.offer_type || ""),
      status: String(offer.status || offer.lifecycle_status || ""),
      description: offer.description || "",
    };
    offerCache.set(id, summary);
    return summary;
  } catch {
    return null;
  }
}

async function fetchCampaignSummary(
  id: number,
): Promise<CustomerEventCampaignSummary | null> {
  const cached = campaignCache.get(id);
  if (cached) return cached;
  try {
    const campaign = await campaignService.getCampaignById(id);
    if (!campaign) return null;
    const summary: CustomerEventCampaignSummary = {
      id: campaign.id,
      name: campaign.name || "",
      code: campaign.code || "",
      status: String(campaign.status || ""),
      type: String(campaign.objective || ""),
    };
    campaignCache.set(id, summary);
    return summary;
  } catch {
    return null;
  }
}

async function fetchCreativeSummary(
  id: number,
): Promise<CustomerEventCreativeSummary | null> {
  const cached = creativeCache.get(id);
  if (cached) return cached;
  try {
    const response = await offerCreativeService.getById(id);
    const creative = response?.data;
    if (!creative) return null;
    const summary: CustomerEventCreativeSummary = {
      id: creative.id,
      name: creative.name || "",
      channel: String(creative.channel || ""),
      title: creative.title || "",
      locale: creative.locale || "",
      text_body: creative.text_body || "",
      html_body: creative.html_body || "",
    };
    creativeCache.set(id, summary);
    return summary;
  } catch {
    return null;
  }
}

async function fetchLatestCreative(
  offerId: number,
  channel: CreativeChannel,
): Promise<CustomerEventCreativeSummary | null> {
  const cacheKey = `${offerId}:${channel}`;
  const cached = latestCreativeCache.get(cacheKey);
  if (cached) return cached;
  try {
    const response = await offerCreativeService.getLatestByOfferAndChannel(
      offerId,
      channel,
    );
    const creative = response?.data;
    if (!creative) return null;
    const summary: CustomerEventCreativeSummary = {
      id: creative.id,
      name: creative.name || "",
      channel: String(creative.channel || channel),
      title: creative.title || "",
      locale: creative.locale || "",
      text_body: creative.text_body || "",
      html_body: creative.html_body || "",
    };
    if (summary.id) creativeCache.set(summary.id, summary);
    latestCreativeCache.set(cacheKey, summary);
    return summary;
  } catch {
    return null;
  }
}

async function loadEventRelatedDetails(
  event: CustomerEvent,
): Promise<CustomerEvent> {
  const offerId = event.offer?.id ?? null;
  const campaignId = event.campaign?.id ?? null;
  const creativeId = event.creative?.id ?? null;
  const creativeChannel =
    toCreativeChannel(event.creative?.channel || event.channel);

  const [offer, campaign, creative] = await Promise.all([
    offerId ? fetchOfferSummary(offerId) : Promise.resolve(null),
    campaignId ? fetchCampaignSummary(campaignId) : Promise.resolve(null),
    creativeId
      ? fetchCreativeSummary(creativeId)
      : offerId && creativeChannel && isCommunicationLinkedEvent(event)
        ? fetchLatestCreative(offerId, creativeChannel)
        : Promise.resolve(null),
  ]);

  return {
    ...event,
    offer: mergeOffer(event.offer, offer),
    campaign: mergeCampaign(event.campaign, campaign),
    creative: mergeCreative(event.creative, creative),
    message: event.message,
  };
}

function queryToSearchParams(query: CustomerEventQuery): URLSearchParams {
  const params = new URLSearchParams();
  if (query.search?.trim()) params.set("search", query.search.trim());
  const eventTypes = (query.event_types || []).filter(
    (item) => item && item !== "all",
  );
  if (eventTypes.length > 0) {
    eventTypes.forEach((type) => params.append("event_type", type));
  } else if (query.event_type && query.event_type !== "all") {
    params.set("event_type", query.event_type);
  }
  if (query.tracking_source_id && query.tracking_source_id !== "all") {
    params.set("tracking_source_id", query.tracking_source_id);
  }
  if (query.origin && query.origin !== "all") params.set("origin", query.origin);
  if (query.status && query.status !== "all") params.set("status", query.status);
  if (query.channel && query.channel !== "all") params.set("channel", query.channel);
  if (query.time_preset) params.set("preset", query.time_preset);
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

function getFallbackResult(
  subscriberId: string,
  query: CustomerEventQuery,
): CustomerEventListResult {
  try {
    return buildResult(getFallbackEvents(subscriberId), query, "fallback");
  } catch {
    return emptyEventResult("fallback");
  }
}

export const customerEventService = {
  async getSubscriberEvents(
    subscriberId: string | number,
    query: CustomerEventQuery = {},
  ): Promise<CustomerEventListResult> {
    const id = String(subscriberId);
    if (!id) return emptyEventResult("fallback");

    try {
      return await fetchFromApi(id, query);
    } catch {
      // Events API is not always deployed yet; keep the profile usable.
      return getFallbackResult(id, query);
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

  loadEventRelatedDetails,
};

export default customerEventService;
