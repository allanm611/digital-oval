import { API_CONFIG, getAuthHeaders } from "../../../shared/services/api";
import { offerService } from "../../offers/services/offerService";
import { productService } from "../../products/services/productService";
import { customerEventService } from "./customerEventService";
import type {
  CustomerPurchaseProgress,
  CustomerPurchaseResult,
} from "../types/customerPurchase";
import {
  applyOfferCatalog,
  applyProductCatalog,
  countPurchases,
  draftKey,
  EMPTY_PURCHASE_COUNTS,
  eventToDraft,
  finalizePurchase,
  findExistingKey,
  mergeDraft,
  numericId,
  parseHintPurchases,
  parsePurchaseRecord,
  sortPurchases,
  unwrapPurchaseList,
  type DraftPurchase,
} from "../utils/customerPurchaseHelpers";
import { asRecord } from "../utils/customerSegmentHelpers";
import { mapWithConcurrency } from "../utils/customerSubscribedListHelpers";

const CACHE_TTL_MS = 60_000;
const CATALOG_CONCURRENCY = 4;

const RESULT_CACHE = new Map<
  string,
  { expires: number; result: CustomerPurchaseResult }
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

function emptyResult(warnings: string[] = []): CustomerPurchaseResult {
  return {
    purchases: [],
    counts: { ...EMPTY_PURCHASE_COUNTS },
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

function upsertDraft(
  byKey: Map<string, DraftPurchase>,
  draft: DraftPurchase,
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

async function trySubscriberScopedPurchases(
  subscriberId: string,
): Promise<{ available: boolean; drafts: DraftPurchase[] }> {
  const encoded = encodeURIComponent(subscriberId);
  const paths = [
    `${API_CONFIG.BASE_URL}/subscribers/${encoded}/purchases`,
    `${API_CONFIG.BASE_URL}/subscribers/${encoded}/transactions`,
    `${API_CONFIG.BASE_URL}/subscribers/${encoded}/orders`,
  ];

  const drafts: DraftPurchase[] = [];
  let available = false;

  for (const url of paths) {
    const payload = await tryJsonGet(url);
    if (payload == null) continue;
    available = true;
    unwrapPurchaseList(payload).forEach((item) => {
      const parsed = parsePurchaseRecord(item, { evidence: "subscriber_api" });
      if (parsed) drafts.push(parsed);
    });
  }

  return { available, drafts };
}

async function resolveProductIdForOffer(
  offerId: number,
  isAborted?: () => boolean,
): Promise<number | null> {
  abortIfNeeded(isAborted);
  try {
    const primary = await offerService.getPrimaryProductByOffer(offerId);
    const productId = numericId(primary?.data?.product_id);
    if (productId) return productId;
  } catch (error) {
    if (isAbortError(error)) throw error;
  }

  abortIfNeeded(isAborted);
  try {
    const linked = await offerService.getProductsByOffer(offerId, { limit: 20 });
    const rows = Array.isArray(linked?.data) ? linked.data : [];
    const primary = rows.find((row) => row.is_primary) ?? rows[0];
    return numericId(primary?.product_id);
  } catch (error) {
    if (isAbortError(error)) throw error;
    return null;
  }
}

export type LoadCustomerPurchasesInput = {
  subscriberId: string | number;
  customerRecord?: Record<string, unknown> | null;
  onProgress?: (progress: CustomerPurchaseProgress) => void;
  isAborted?: () => boolean;
  skipCache?: boolean;
};

export const customerPurchaseService = {
  invalidateCache(subscriberId?: string | number) {
    if (subscriberId == null || subscriberId === "") {
      RESULT_CACHE.clear();
      return;
    }
    RESULT_CACHE.delete(String(subscriberId));
  },

  async getCustomerPurchases(
    input: LoadCustomerPurchasesInput,
  ): Promise<CustomerPurchaseResult> {
    const subscriberId = String(input.subscriberId ?? "").trim();
    const warnings: string[] = [];

    if (!subscriberId) {
      return emptyResult(["No customer selected."]);
    }

    const cached = input.skipCache ? undefined : RESULT_CACHE.get(subscriberId);
    if (cached && cached.expires > Date.now()) {
      input.onProgress?.({
        phase: "catalog",
        checked: cached.result.purchases.length,
        total: cached.result.purchases.length,
      });
      return cached.result;
    }

    input.onProgress?.({ phase: "lookup", checked: 0, total: 1 });
    const scoped = await trySubscriberScopedPurchases(subscriberId);
    input.onProgress?.({ phase: "lookup", checked: 1, total: 1 });

    const byKey = new Map<string, DraftPurchase>();
    scoped.drafts.forEach((draft) => upsertDraft(byKey, draft));

    input.onProgress?.({ phase: "events", checked: 0, total: 1 });
    const eventsResult = await customerEventService.getSubscriberEvents(
      subscriberId,
      {},
      { throwOnError: false, customerRecord: input.customerRecord },
    );
    const eventsLive = eventsResult.source === "api";
    let eventCount = 0;
    if (eventsLive) {
      eventsResult.allEvents.forEach((event) => {
        const draft = eventToDraft(event);
        if (!draft) return;
        eventCount += 1;
        upsertDraft(byKey, draft);
      });
    }
    input.onProgress?.({ phase: "events", checked: 1, total: 1 });

    parseHintPurchases(input.customerRecord).forEach((draft) => {
      upsertDraft(byKey, draft);
    });

    const drafts = Array.from(byKey.values());
    const offerIdsNeedingProduct = Array.from(
      new Set(
        drafts
          .filter((item) => item.offerId && !item.productId)
          .map((item) => item.offerId as number),
      ),
    );

    input.onProgress?.({
      phase: "catalog",
      checked: 0,
      total: offerIdsNeedingProduct.length,
    });

    const offerProductIds = new Map<number, number>();
    if (offerIdsNeedingProduct.length > 0) {
      let checked = 0;
      const resolved = await mapWithConcurrency(
        offerIdsNeedingProduct,
        CATALOG_CONCURRENCY,
        async (offerId) => {
          try {
            const productId = await resolveProductIdForOffer(
              offerId,
              input.isAborted,
            );
            return { offerId, productId };
          } catch (error) {
            if (isAbortError(error)) throw error;
            return { offerId, productId: null };
          } finally {
            checked += 1;
            input.onProgress?.({
              phase: "catalog",
              checked,
              total: offerIdsNeedingProduct.length,
            });
          }
        },
        input.isAborted,
      );
      resolved.forEach((row) => {
        if (row.productId) offerProductIds.set(row.offerId, row.productId);
      });
      drafts.forEach((draft) => {
        if (draft.productId || !draft.offerId) return;
        const productId = offerProductIds.get(draft.offerId);
        if (productId) draft.productId = productId;
      });
    }

    const productIds = Array.from(
      new Set(
        drafts
          .map((item) => item.productId)
          .filter((id): id is number => Boolean(id)),
      ),
    );
    const offerIds = Array.from(
      new Set(
        drafts
          .map((item) => item.offerId)
          .filter((id): id is number => Boolean(id)),
      ),
    );

    const catalogTotal = productIds.length + offerIds.length;
    let catalogChecked = 0;
    let catalogFailed = 0;
    input.onProgress?.({
      phase: "catalog",
      checked: 0,
      total: catalogTotal,
    });

    const productRows = await mapWithConcurrency(
      productIds,
      CATALOG_CONCURRENCY,
      async (productId) => {
        abortIfNeeded(input.isAborted);
        try {
          const response = await productService.getProductById(productId);
          return { productId, product: response?.data ?? null };
        } catch (error) {
          if (isAbortError(error)) throw error;
          catalogFailed += 1;
          return { productId, product: null };
        } finally {
          catalogChecked += 1;
          input.onProgress?.({
            phase: "catalog",
            checked: catalogChecked,
            total: catalogTotal,
          });
        }
      },
      input.isAborted,
    );

    const offerRows = await mapWithConcurrency(
      offerIds,
      CATALOG_CONCURRENCY,
      async (offerId) => {
        abortIfNeeded(input.isAborted);
        try {
          const response = await offerService.getOfferById(offerId);
          return { offerId, offer: response?.data ?? null };
        } catch (error) {
          if (isAbortError(error)) throw error;
          catalogFailed += 1;
          return { offerId, offer: null };
        } finally {
          catalogChecked += 1;
          input.onProgress?.({
            phase: "catalog",
            checked: catalogChecked,
            total: catalogTotal,
          });
        }
      },
      input.isAborted,
    );

    const productById = new Map(
      productRows
        .filter((row) => row.product)
        .map((row) => [row.productId, row.product!]),
    );
    const offerById = new Map(
      offerRows
        .filter((row) => row.offer)
        .map((row) => [row.offerId, row.offer!]),
    );

    drafts.forEach((draft) => {
      if (draft.offerId) {
        const offer = offerById.get(draft.offerId);
        if (offer) applyOfferCatalog(draft, offer);
      }
      if (draft.productId) {
        const product = productById.get(draft.productId);
        if (product) applyProductCatalog(draft, product);
      }
    });

    const purchases = sortPurchases(
      drafts.map((draft) => finalizePurchase(draft)),
    );

    if (!eventsLive) {
      warnings.push(
        "Live customer events were not available, so purchases could not be confirmed from the event stream.",
      );
    }
    if (catalogFailed > 0) {
      warnings.push(
        `Catalog details could not be loaded for ${catalogFailed} product or offer${catalogFailed === 1 ? "" : "s"}.`,
      );
    }
    const hintOnly = purchases.filter((item) => item.verification === "hint")
      .length;
    if (hintOnly > 0) {
      warnings.push(
        `${hintOnly} purchase${hintOnly === 1 ? "" : "s"} came from the customer profile and ${hintOnly === 1 ? "was" : "were"} not verified against transactions or events.`,
      );
    }

    const result: CustomerPurchaseResult = {
      purchases,
      counts: countPurchases(purchases),
      eventCount,
      source: catalogFailed > 0 || !eventsLive ? "partial" : "live",
      subscriberLookupUsed: scoped.available,
      eventsLive,
      warnings: warnings.filter(
        (warning, index, all) => all.indexOf(warning) === index,
      ),
    };

    RESULT_CACHE.set(subscriberId, {
      expires: Date.now() + CACHE_TTL_MS,
      result,
    });
    return result;
  },
};

export default customerPurchaseService;
