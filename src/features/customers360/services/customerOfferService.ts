import { API_CONFIG, getAuthHeaders } from "../../../shared/services/api";
import { campaignFlowService } from "../../campaigns/services/campaignFlowService";
import { offerService } from "../../offers/services/offerService";
import { customerEventService } from "./customerEventService";
import { customerSegmentService } from "./customerSegmentService";
import type { CustomerSegmentCampaign, CustomerSegmentVia } from "../types/customerSegment";
import type {
  CustomerOfferCampaignRef,
  CustomerOfferItem,
  CustomerOfferProgress,
  CustomerOfferResult,
} from "../types/customerOffer";
import {
  catalogToDraft,
  countOffers,
  createDraftOffer,
  draftKey,
  EMPTY_OFFER_COUNTS,
  eventToDraft,
  finalizeOffer,
  hintToDraft,
  mergeDraft,
  numericId,
  parseHintOffer,
  parseHintOffers,
  sortOffers,
  unwrapOfferList,
  type DraftCustomerOffer,
} from "../utils/customerOfferHelpers";
import { asRecord } from "../utils/customerSegmentHelpers";
import { mapWithConcurrency } from "../utils/customerSubscribedListHelpers";

const CACHE_TTL_MS = 60_000;
const CATALOG_CONCURRENCY = 4;
const CAMPAIGN_OFFER_CONCURRENCY = 4;
const MAX_CAMPAIGNS_TO_EXPAND = 100;

const RESULT_CACHE = new Map<
  string,
  { expires: number; result: CustomerOfferResult }
>();

function isAbortError(error: unknown): boolean {
  return (
    (error instanceof DOMException && error.name === "AbortError") ||
    (error instanceof Error && error.name === "AbortError")
  );
}

function abortIfNeeded(isAborted?: () => boolean) {
  if (isAborted?.()) {
    throw new DOMException("Aborted", "AbortError");
  }
}

function cacheKey(subscriberId: string): string {
  return subscriberId;
}

function emptyResult(warnings: string[] = []): CustomerOfferResult {
  return {
    offers: [],
    counts: { ...EMPTY_OFFER_COUNTS },
    campaignCount: 0,
    segmentCount: 0,
    eventCount: 0,
    source: "live",
    subscriberLookupUsed: false,
    eventsLive: false,
    warnings,
  };
}

async function tryJsonGet(url: string): Promise<unknown | null> {
  try {
    const response = await fetch(url, { headers: getAuthHeaders() });
    if (!response.ok) return null;
    const payload = await response.json();
    const record = asRecord(payload);
    if (record?.success === false) return null;
    return payload;
  } catch {
    return null;
  }
}

async function trySubscriberScopedOffers(
  subscriberId: string,
): Promise<{ available: boolean; drafts: DraftCustomerOffer[] }> {
  const encoded = encodeURIComponent(subscriberId);
  const paths = [
    `${API_CONFIG.BASE_URL}/subscribers/${encoded}/offers`,
    `${API_CONFIG.BASE_URL}/subscribers/${encoded}/redemptions`,
  ];

  const drafts: DraftCustomerOffer[] = [];
  let available = false;

  for (const url of paths) {
    const payload = await tryJsonGet(url);
    if (payload == null) continue;
    available = true;
    unwrapOfferList(payload).forEach((item, index) => {
      const hint = parseHintOffer(item, index);
      if (!hint) return;
      const draft = hintToDraft(hint);
      draft.evidence.delete("profile_hint");
      draft.evidence.add("subscriber_api");
      drafts.push(draft);
    });
  }

  return { available, drafts };
}

function campaignToRef(
  campaign: Pick<
    CustomerSegmentCampaign,
    "campaignId" | "campaignName" | "campaignStatus" | "isActive"
  >,
): CustomerOfferCampaignRef {
  return {
    campaignId: campaign.campaignId,
    campaignName: campaign.campaignName,
    campaignStatus: campaign.campaignStatus,
    isActive: campaign.isActive,
  };
}

function mappingDraft(input: {
  offerId: number | null;
  offerName: string | null;
  campaign: CustomerOfferCampaignRef;
  segments: CustomerSegmentVia[];
  presentedAt: string | null;
}): DraftCustomerOffer {
  return createDraftOffer({
    offerId: input.offerId,
    name: input.offerName || (input.offerId ? `Offer ${input.offerId}` : ""),
    presentedAt: input.presentedAt,
    viaCampaigns: [input.campaign],
    viaSegments: input.segments,
    evidence: ["campaign_mapping"],
  });
}

function collectMappingDrafts(
  memberships: Array<{
    segmentId: number;
    name: string;
    campaigns: CustomerSegmentCampaign[];
  }>,
): {
  drafts: DraftCustomerOffer[];
  campaignIds: number[];
  segmentsByCampaign: Map<number, CustomerSegmentVia[]>;
  campaignsById: Map<number, CustomerOfferCampaignRef>;
} {
  const drafts: DraftCustomerOffer[] = [];
  const segmentsByCampaign = new Map<number, Map<number, CustomerSegmentVia>>();
  const campaignsById = new Map<number, CustomerOfferCampaignRef>();

  for (const membership of memberships) {
    const via: CustomerSegmentVia = {
      segmentId: membership.segmentId,
      segmentName: membership.name,
    };
    for (const campaign of membership.campaigns) {
      const ref = campaignToRef(campaign);
      campaignsById.set(campaign.campaignId, ref);
      const segmentMap =
        segmentsByCampaign.get(campaign.campaignId) ??
        new Map<number, CustomerSegmentVia>();
      segmentMap.set(via.segmentId, via);
      segmentsByCampaign.set(campaign.campaignId, segmentMap);

      if (campaign.offerId || campaign.offerName) {
        drafts.push(
          mappingDraft({
            offerId: campaign.offerId,
            offerName: campaign.offerName,
            campaign: ref,
            segments: [via],
            presentedAt: campaign.lastUsed,
          }),
        );
      }
    }
  }

  return {
    drafts,
    campaignIds: Array.from(campaignsById.keys()),
    segmentsByCampaign: new Map(
      Array.from(segmentsByCampaign.entries()).map(([id, map]) => [
        id,
        Array.from(map.values()),
      ]),
    ),
    campaignsById,
  };
}

async function loadOffersForCampaigns(
  campaignIds: number[],
  campaignsById: Map<number, CustomerOfferCampaignRef>,
  segmentsByCampaign: Map<number, CustomerSegmentVia[]>,
  isAborted?: () => boolean,
): Promise<DraftCustomerOffer[]> {
  const ids = campaignIds.slice(0, MAX_CAMPAIGNS_TO_EXPAND);
  const rows = await mapWithConcurrency(
    ids,
    CAMPAIGN_OFFER_CONCURRENCY,
    async (campaignId) => {
      abortIfNeeded(isAborted);
      try {
        const response = await campaignFlowService.getCampaignOffers(
          campaignId,
          true,
        );
        const offers = Array.isArray(response?.data) ? response.data : [];
        return { campaignId, offers };
      } catch (error) {
        if (isAbortError(error)) throw error;
        return { campaignId, offers: [] as Array<{ id: number; name?: string; code?: string }> };
      }
    },
    isAborted,
  );

  const drafts: DraftCustomerOffer[] = [];
  for (const row of rows) {
    const campaign = campaignsById.get(row.campaignId);
    if (!campaign) continue;
    const segments = segmentsByCampaign.get(row.campaignId) || [];
    for (const offer of row.offers) {
      const offerId = numericId(offer.id);
      if (!offerId) continue;
      drafts.push(
        createDraftOffer({
          offerId,
          name: offer.name || `Offer ${offerId}`,
          code: offer.code || "",
          viaCampaigns: [campaign],
          viaSegments: segments,
          evidence: ["campaign_mapping"],
        }),
      );
    }
  }
  return drafts;
}

function findExistingKey(
  byKey: Map<string, DraftCustomerOffer>,
  draft: DraftCustomerOffer,
): string | null {
  if (draft.offerId) {
    const byId = `offer-${draft.offerId}`;
    if (byKey.has(byId)) return byId;
  }

  const code = draft.code.trim().toLowerCase();
  const name = draft.name.trim().toLowerCase();

  for (const [key, item] of byKey) {
    if (draft.offerId && item.offerId === draft.offerId) return key;
    if (
      draft.offerId &&
      item.offerId &&
      draft.offerId !== item.offerId
    ) {
      continue;
    }
    if (code && item.code.trim().toLowerCase() === code) return key;
    if (
      !draft.offerId &&
      !item.offerId &&
      name &&
      item.name.trim().toLowerCase() === name
    ) {
      return key;
    }
  }
  return null;
}

function upsertDraft(
  byKey: Map<string, DraftCustomerOffer>,
  draft: DraftCustomerOffer,
) {
  const existingKey = findExistingKey(byKey, draft);
  if (existingKey) {
    const merged = mergeDraft(byKey.get(existingKey)!, draft);
    byKey.delete(existingKey);
    byKey.set(draftKey(merged), merged);
    return;
  }
  byKey.set(draftKey(draft), draft);
}

export type LoadCustomerOffersInput = {
  subscriberId: string | number;
  customerRecord?: Record<string, unknown> | null;
  onProgress?: (progress: CustomerOfferProgress) => void;
  isAborted?: () => boolean;
  skipCache?: boolean;
};

export const customerOfferService = {
  async getCustomerOffers(
    input: LoadCustomerOffersInput,
  ): Promise<CustomerOfferResult> {
    const subscriberId = String(input.subscriberId ?? "").trim();
    const warnings: string[] = [];

    if (!subscriberId) {
      return emptyResult(["No customer selected."]);
    }

    const key = cacheKey(subscriberId);
    const cached = input.skipCache ? undefined : RESULT_CACHE.get(key);
    if (cached && cached.expires > Date.now()) {
      input.onProgress?.({
        phase: "catalog",
        checked: cached.result.offers.length,
        total: cached.result.offers.length,
      });
      return cached.result;
    }

    input.onProgress?.({ phase: "audience", checked: 0, total: 0 });

    const [scoped, audience] = await Promise.all([
      trySubscriberScopedOffers(subscriberId),
      customerSegmentService.getCustomerSegments({
        subscriberId,
        customerRecord: input.customerRecord,
        skipCache: input.skipCache,
        isAborted: input.isAborted,
        onProgress: (progress) => {
          input.onProgress?.({
            phase: "audience",
            checked: progress.checked,
            total: progress.total,
          });
        },
      }),
    ]);

    abortIfNeeded(input.isAborted);

    const mappings = collectMappingDrafts(audience.memberships);
    input.onProgress?.({
      phase: "audience",
      checked: mappings.campaignIds.length,
      total: mappings.campaignIds.length,
    });

    const campaignOfferDrafts = await loadOffersForCampaigns(
      mappings.campaignIds,
      mappings.campaignsById,
      mappings.segmentsByCampaign,
      input.isAborted,
    );

    input.onProgress?.({ phase: "events", checked: 0, total: 1 });
    const eventsResult = await customerEventService.getSubscriberEvents(
      subscriberId,
      { time_preset: "all", limit: 500 },
    );
    const eventsLive = eventsResult.source === "api";
    const liveEvents = eventsLive ? eventsResult.allEvents : [];
    input.onProgress?.({ phase: "events", checked: 1, total: 1 });

    const byKey = new Map<string, DraftCustomerOffer>();
    scoped.drafts.forEach((draft) => upsertDraft(byKey, draft));
    mappings.drafts.forEach((draft) => upsertDraft(byKey, draft));
    campaignOfferDrafts.forEach((draft) => upsertDraft(byKey, draft));

    if (eventsLive) {
      liveEvents.forEach((event) => {
        const draft = eventToDraft(event);
        if (draft) upsertDraft(byKey, draft);
      });
    }

    const profileHints = parseHintOffers(input.customerRecord);
    profileHints.forEach((hint) => {
      upsertDraft(byKey, hintToDraft(hint));
    });

    const drafts = Array.from(byKey.values());
    const catalogIds = Array.from(
      new Set(
        drafts
          .map((item) => item.offerId)
          .filter((id): id is number => Boolean(id)),
      ),
    );

    input.onProgress?.({
      phase: "catalog",
      checked: 0,
      total: catalogIds.length,
    });

    let catalogChecked = 0;
    let catalogFailed = 0;
    const catalogRows = await mapWithConcurrency(
      catalogIds,
      CATALOG_CONCURRENCY,
      async (offerId) => {
        abortIfNeeded(input.isAborted);
        try {
          const response = await offerService.getOfferById(offerId);
          return { offerId, offer: response?.data ?? null, failed: false as const };
        } catch (error) {
          if (isAbortError(error)) throw error;
          catalogFailed += 1;
          return { offerId, offer: null, failed: true as const };
        } finally {
          catalogChecked += 1;
          input.onProgress?.({
            phase: "catalog",
            checked: catalogChecked,
            total: catalogIds.length,
          });
        }
      },
      input.isAborted,
    );

    for (const row of catalogRows) {
      if (!row.offer) continue;
      upsertDraft(byKey, catalogToDraft(row.offer));
    }

    const offers: CustomerOfferItem[] = sortOffers(
      Array.from(byKey.values()).map((draft) => finalizeOffer(draft)),
    );

    if (!eventsLive) {
      warnings.push(
        "Live customer events were not available, so redemption could not be confirmed from the event stream.",
      );
    }
    if (audience.warnings.length > 0 && mappings.campaignIds.length === 0) {
      warnings.push(...audience.warnings);
    }
    if (mappings.campaignIds.length >= MAX_CAMPAIGNS_TO_EXPAND) {
      warnings.push(
        `Stopped expanding campaign offers after ${MAX_CAMPAIGNS_TO_EXPAND.toLocaleString()} campaigns.`,
      );
    }
    if (catalogFailed > 0) {
      warnings.push(
        `Offer catalog details could not be loaded for ${catalogFailed} offer${catalogFailed === 1 ? "" : "s"}.`,
      );
    }
    const hintOnly = offers.filter((item) => item.verification === "hint").length;
    if (hintOnly > 0) {
      warnings.push(
        `${hintOnly} offer${hintOnly === 1 ? "" : "s"} came from the customer profile and ${hintOnly === 1 ? "was" : "were"} not verified against campaigns or events.`,
      );
    }

    const uniqueWarnings = warnings.filter(
      (warning, index, all) => all.indexOf(warning) === index,
    );

    const result: CustomerOfferResult = {
      offers,
      counts: countOffers(offers),
      campaignCount: mappings.campaignIds.length,
      segmentCount: audience.memberships.length,
      eventCount: liveEvents.filter((event) => eventToDraft(event)).length,
      source:
        catalogFailed > 0 || audience.source === "partial" || !eventsLive
          ? "partial"
          : "live",
      subscriberLookupUsed: scoped.available,
      eventsLive,
      warnings: uniqueWarnings,
    };

    RESULT_CACHE.set(key, { expires: Date.now() + CACHE_TTL_MS, result });
    return result;
  },
};

export default customerOfferService;
