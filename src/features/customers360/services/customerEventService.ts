import { campaignService } from "../../campaigns/services/campaignService";
import { offerService } from "../../offers/services/offerService";
import { offerCreativeService } from "../../offers/services/offerCreativeService";
import type { CreativeChannel } from "../../offers/types/offerCreative";
import { engineTrackingSourceService } from "../../configurations/services/engineTrackingSourceService";
import { communicationChannelService } from "../../../shared/services/communicationChannelService";
import { asRecord } from "../utils/customerSegmentHelpers";
import {
  fetchSubscriberResource,
  SubscriberResourceError,
} from "./subscriberResourceClient";
import type {
  CustomerEvent,
  CustomerEventCampaignSummary,
  CustomerEventCreativeSummary,
  CustomerEventListResult,
  CustomerEventOfferSummary,
  CustomerEventQuery,
  CommunicationChannelOption,
  TrackingSourceOption,
} from "../types/customerEvent";
import {
  aggregateEventCounts,
  buildEventFacets,
  EMPTY_EVENT_COUNTS,
  filterCustomerEvents,
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

const EVENT_PAGE_SIZE = 50;
const EVENT_MAX_PAGES = 10;
const SERVER_PRESETS = new Set([
  "last_1h",
  "last_24h",
  "last_7d",
  "last_30d",
  "last_90d",
]);

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
  if (query.time_preset && SERVER_PRESETS.has(query.time_preset)) {
    params.set("preset", query.time_preset);
  }
  if (query.time_preset === "custom") {
    if (query.date_from) params.set("from", query.date_from);
    if (query.date_to) params.set("to", query.date_to);
  }
  if (query.limit != null) {
    params.set(
      "limit",
      String(Math.min(Math.max(query.limit, 1), EVENT_PAGE_SIZE)),
    );
  }
  if ((query.offset ?? 0) > 0) {
    params.set("offset", String(query.offset));
  }
  return params;
}

function paginationHasMore(payload: unknown, pageSize: number): boolean {
  const record = asRecord(payload);
  const pagination = asRecord(record?.pagination) || asRecord(record?.meta);
  if (!pagination) return false;
  if (pagination.hasMore === true || pagination.has_more === true) return true;
  const total = Number(pagination.total ?? pagination.count);
  const offset = Number(pagination.offset ?? 0);
  const limit = Number(pagination.limit ?? pageSize);
  if (Number.isFinite(total) && Number.isFinite(offset) && Number.isFinite(limit)) {
    return offset + limit < total;
  }
  return false;
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

async function fetchEventsPage(
  subscriberId: string,
  query: URLSearchParams | undefined,
): Promise<unknown> {
  const { payload } = await fetchSubscriberResource(
    subscriberId,
    ["/events"],
    query,
  );
  return payload;
}

async function fetchFromApi(
  subscriberId: string,
  query: CustomerEventQuery,
): Promise<CustomerEventListResult> {
  const collected: CustomerEvent[] = [];
  let apiCounts: CustomerEventListResult["counts"] | null = null;
  let useBareQuery = false;

  for (let page = 0; page < EVENT_MAX_PAGES; page += 1) {
    const offset = collected.length;
    const pageQuery = queryToSearchParams({
      ...query,
      limit: offset > 0 ? EVENT_PAGE_SIZE : query.limit,
      offset,
    });
    const requestQuery = pageQuery.toString() ? pageQuery : undefined;
    let payload: unknown;
    try {
      payload = await fetchEventsPage(
        subscriberId,
        useBareQuery ? undefined : requestQuery,
      );
    } catch (error) {
      const isBadRequest =
        error instanceof SubscriberResourceError && error.status === 400;
      if (isBadRequest && !useBareQuery && page === 0 && requestQuery) {
        useBareQuery = true;
        payload = await fetchEventsPage(subscriberId, undefined);
      } else {
        throw error;
      }
    }

    const record = asRecord(payload) ?? {};
    const pageEvents = unwrapEventList(payload)
      .map((item, index) =>
        normalizeCustomerEvent(item, collected.length + index),
      )
      .filter((item): item is CustomerEvent => Boolean(item));

    if (!apiCounts) apiCounts = parseApiCounts(record.counts);
    collected.push(...pageEvents);

    if (useBareQuery) break;
    if (pageEvents.length === 0) break;
    if (!paginationHasMore(payload, EVENT_PAGE_SIZE)) break;
  }

  return buildResult(collected, query, "api", apiCounts);
}

export type GetSubscriberEventsOptions = {
  throwOnError?: boolean;
  customerRecord?: Record<string, unknown> | null;
};

export const customerEventService = {
  async getSubscriberEvents(
    subscriberId: string | number,
    query: CustomerEventQuery = {},
    options?: GetSubscriberEventsOptions,
  ): Promise<CustomerEventListResult> {
    const id = String(subscriberId ?? "").trim();
    if (!id) return emptyEventResult("api");

    try {
      return await fetchFromApi(id, query);
    } catch (error) {
      if (options?.throwOnError === false) {
        return emptyEventResult("fallback");
      }
      throw error;
    }
  },

  async getTrackingSourceOptions(): Promise<TrackingSourceOption[]> {
    const toOptions = (
      sources: Array<{
        id: number;
        name: string;
        code: string;
        sourceType?: string;
        isActive?: boolean;
      }>,
    ): TrackingSourceOption[] =>
      sources
        .filter((source) => source.isActive !== false)
        .map((source) => ({
          id: String(source.id),
          name: source.name || source.code || String(source.id),
          code: source.code || String(source.id),
          sourceType: String(source.sourceType || ""),
        }));

    try {
      const active = await engineTrackingSourceService.getAll({
        is_active: true,
        limit: 500,
      });
      if (active.length > 0) return toOptions(active);
    } catch {
      // Retry without the active filter — some environments ignore or reject it.
    }

    try {
      return toOptions(
        await engineTrackingSourceService.getAll({ limit: 500 }),
      );
    } catch {
      return [];
    }
  },

  async getCommunicationChannelOptions(): Promise<CommunicationChannelOption[]> {
    try {
      const channels = await communicationChannelService.getAll();
      return channels
        .filter((channel) => {
          const record = channel as { is_active?: boolean; isActive?: boolean };
          return record.is_active !== false && record.isActive !== false;
        })
        .map((channel) => ({
          id: String(channel.id),
          name: channel.name || channel.code || String(channel.id),
          code: String(channel.code || channel.id).trim(),
        }));
    } catch {
      return [];
    }
  },

  loadEventRelatedDetails,
};

export default customerEventService;
