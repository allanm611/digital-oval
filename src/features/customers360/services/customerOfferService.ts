import { offerService } from "../../offers/services/offerService";
import type {
  CustomerOfferProgress,
  CustomerOfferResult,
} from "../types/customerOffer";
import {
  catalogToDraft,
  countOffers,
  EMPTY_OFFER_COUNTS,
  finalizeOffer,
  hintToDraft,
  mergeDraft,
  parseHintOffer,
  sortOffers,
  unwrapOfferList,
  type DraftCustomerOffer,
} from "../utils/customerOfferHelpers";
import { collectCustomerIdentifiers } from "../utils/customerSubscribedListHelpers";
import { mapWithConcurrency } from "../utils/customerSubscribedListHelpers";
import {
  buildSubscriberIdentifierQuery,
  fetchSubscriberResource,
} from "./subscriberResourceClient";

const CACHE_TTL_MS = 60_000;
const CATALOG_CONCURRENCY = 4;
const OFFER_PATHS = ["/offers"];

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

function draftKey(draft: DraftCustomerOffer): string {
  if (draft.offerId) return `offer-${draft.offerId}`;
  const name = draft.name.trim().toLowerCase();
  return name ? `name-${name}` : `anon-${Math.random().toString(36).slice(2)}`;
}

function upsertDraft(
  byKey: Map<string, DraftCustomerOffer>,
  draft: DraftCustomerOffer,
) {
  const key = draftKey(draft);
  const existing = byKey.get(key);
  byKey.set(key, existing ? mergeDraft(existing, draft) : draft);
}

function finalizeResult(
  byKey: Map<string, DraftCustomerOffer>,
  catalogFailed: number,
): CustomerOfferResult {
  const offers = sortOffers(
    Array.from(byKey.values()).map((draft) => finalizeOffer(draft)),
  );
  const warnings: string[] = [];
  if (catalogFailed > 0) {
    warnings.push(
      `Offer catalog details could not be loaded for ${catalogFailed} offer${catalogFailed === 1 ? "" : "s"}.`,
    );
  }
  return {
    offers,
    counts: countOffers(offers),
    campaignCount: new Set(
      offers.flatMap((item) => item.viaCampaigns.map((campaign) => campaign.campaignId)),
    ).size,
    segmentCount: new Set(
      offers.flatMap((item) => item.viaSegments.map((segment) => segment.segmentId)),
    ).size,
    eventCount: offers.reduce(
      (total, item) => total + item.relatedEvents.length,
      0,
    ),
    source: catalogFailed > 0 ? "partial" : "live",
    subscriberLookupUsed: true,
    eventsLive: false,
    warnings,
  };
}

export type LoadCustomerOffersInput = {
  subscriberId: string | number;
  customerRecord?: Record<string, unknown> | null;
  onProgress?: (progress: CustomerOfferProgress) => void;
  onPartial?: (result: CustomerOfferResult) => void;
  isAborted?: () => boolean;
  skipCache?: boolean;
};

export const customerOfferService = {
  async getCustomerOffers(
    input: LoadCustomerOffersInput,
  ): Promise<CustomerOfferResult> {
    const subscriberId = String(input.subscriberId ?? "").trim();
    const identifiers = collectCustomerIdentifiers(
      input.customerRecord,
      subscriberId,
    );

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

    input.onProgress?.({ phase: "audience", checked: 0, total: 1 });
    const query = buildSubscriberIdentifierQuery(subscriberId, identifiers);
    const { payload } = await fetchSubscriberResource(
      subscriberId,
      OFFER_PATHS,
      query,
    );
    abortIfNeeded(input.isAborted);

    const byKey = new Map<string, DraftCustomerOffer>();
    unwrapOfferList(payload).forEach((item, index) => {
      const hint = parseHintOffer(item, index);
      if (!hint) return;
      const draft = hintToDraft(hint);
      draft.evidence.delete("profile_hint");
      draft.evidence.add("subscriber_api");
      upsertDraft(byKey, draft);
    });
    input.onProgress?.({ phase: "audience", checked: 1, total: 1 });
    input.onPartial?.(finalizeResult(byKey, 0));

    const catalogIds = Array.from(
      new Set(
        Array.from(byKey.values())
          .map((item) => item.offerId)
          .filter((id): id is number => Boolean(id)),
      ),
    );

    if (catalogIds.length === 0) {
      const result = finalizeResult(byKey, 0);
      RESULT_CACHE.set(key, { expires: Date.now() + CACHE_TTL_MS, result });
      return result;
    }

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

    const result = finalizeResult(byKey, catalogFailed);

    RESULT_CACHE.set(key, { expires: Date.now() + CACHE_TTL_MS, result });
    return result;
  },
};

export default customerOfferService;
