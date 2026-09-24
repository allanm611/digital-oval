import { API_CONFIG, getAuthHeaders } from "../../../shared/services/api";
import { offerService } from "../../offers/services/offerService";
import { customerEventService } from "./customerEventService";
import type {
  CustomerLoyaltyAccount,
  CustomerLoyaltyProgress,
  CustomerLoyaltyResult,
} from "../types/customerLoyalty";
import {
  accountFromEvents,
  applyActivityTotals,
  applyOfferCatalog,
  countActivities,
  createDraftAccount,
  draftKey,
  EMPTY_LOYALTY_ACCOUNT,
  EMPTY_LOYALTY_COUNTS,
  eventToDraft,
  finalizeAccount,
  finalizeActivity,
  findExistingKey,
  mergeAccount,
  mergeActivity,
  parseHintLoyalty,
  parseLoyaltyAccount,
  parseLoyaltyActivity,
  sortActivities,
  unwrapLoyaltyList,
  type DraftLoyaltyAccount,
  type DraftLoyaltyActivity,
} from "../utils/customerLoyaltyHelpers";
import { asRecord } from "../utils/customerSegmentHelpers";
import { mapWithConcurrency } from "../utils/customerSubscribedListHelpers";

const CACHE_TTL_MS = 60_000;
const CATALOG_CONCURRENCY = 4;

const RESULT_CACHE = new Map<
  string,
  { expires: number; result: CustomerLoyaltyResult }
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

function emptyAccount(): CustomerLoyaltyAccount {
  return { ...EMPTY_LOYALTY_ACCOUNT, tierBenefits: [], evidence: [] };
}

function emptyResult(warnings: string[] = []): CustomerLoyaltyResult {
  return {
    account: emptyAccount(),
    activities: [],
    counts: { ...EMPTY_LOYALTY_COUNTS },
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

function upsertActivity(
  byKey: Map<string, DraftLoyaltyActivity>,
  draft: DraftLoyaltyActivity,
) {
  const existingKey = findExistingKey(byKey, draft);
  if (existingKey) {
    const merged = mergeActivity(byKey.get(existingKey)!, draft);
    byKey.delete(existingKey);
    byKey.set(draftKey(merged), merged);
    return;
  }
  byKey.set(draftKey(draft), draft);
}

async function trySubscriberScopedLoyalty(
  subscriberId: string,
): Promise<{
  available: boolean;
  account: DraftLoyaltyAccount | null;
  drafts: DraftLoyaltyActivity[];
}> {
  const encoded = encodeURIComponent(subscriberId);
  const paths = [
    `${API_CONFIG.BASE_URL}/subscribers/${encoded}/loyalty`,
    `${API_CONFIG.BASE_URL}/subscribers/${encoded}/loyalty-account`,
    `${API_CONFIG.BASE_URL}/subscribers/${encoded}/points`,
    `${API_CONFIG.BASE_URL}/subscribers/${encoded}/rewards`,
    `${API_CONFIG.BASE_URL}/subscribers/${encoded}/loyalty/rewards`,
    `${API_CONFIG.BASE_URL}/subscribers/${encoded}/loyalty/history`,
  ];

  const drafts: DraftLoyaltyActivity[] = [];
  let account: DraftLoyaltyAccount | null = null;
  let available = false;

  for (const url of paths) {
    const payload = await tryJsonGet(url);
    if (payload == null) continue;
    available = true;
    const parsedAccount = parseLoyaltyAccount(payload, {
      evidence: "subscriber_api",
    });
    if (parsedAccount) {
      account = account
        ? mergeAccount(account, parsedAccount)
        : parsedAccount;
    }
    unwrapLoyaltyList(payload).forEach((item) => {
      const parsed = parseLoyaltyActivity(item, { evidence: "subscriber_api" });
      if (parsed) drafts.push(parsed);
    });
  }

  return { available, account, drafts };
}

export type LoadCustomerLoyaltyInput = {
  subscriberId: string | number;
  customerRecord?: Record<string, unknown> | null;
  onProgress?: (progress: CustomerLoyaltyProgress) => void;
  isAborted?: () => boolean;
  skipCache?: boolean;
};

export const customerLoyaltyService = {
  invalidateCache(subscriberId?: string | number) {
    if (subscriberId == null || subscriberId === "") {
      RESULT_CACHE.clear();
      return;
    }
    RESULT_CACHE.delete(String(subscriberId));
  },

  async getCustomerLoyalty(
    input: LoadCustomerLoyaltyInput,
  ): Promise<CustomerLoyaltyResult> {
    const subscriberId = String(input.subscriberId ?? "").trim();
    const warnings: string[] = [];

    if (!subscriberId) {
      return emptyResult(["No customer selected."]);
    }

    const cached = input.skipCache ? undefined : RESULT_CACHE.get(subscriberId);
    if (cached && cached.expires > Date.now()) {
      input.onProgress?.({
        phase: "catalog",
        checked: cached.result.activities.length,
        total: cached.result.activities.length,
      });
      return cached.result;
    }

    input.onProgress?.({ phase: "lookup", checked: 0, total: 1 });
    const scoped = await trySubscriberScopedLoyalty(subscriberId);
    input.onProgress?.({ phase: "lookup", checked: 1, total: 1 });

    let accountDraft =
      scoped.account ||
      createDraftAccount({ evidence: [] });
    const byKey = new Map<string, DraftLoyaltyActivity>();
    scoped.drafts.forEach((draft) => upsertActivity(byKey, draft));

    input.onProgress?.({ phase: "events", checked: 0, total: 1 });
    const eventsResult = await customerEventService.getSubscriberEvents(
      subscriberId,
      {},
      { throwOnError: false, customerRecord: input.customerRecord },
    );
    const eventsLive = eventsResult.source === "api";
    let eventCount = 0;
    const liveEvents = eventsLive ? eventsResult.allEvents : [];
    if (eventsLive) {
      liveEvents.forEach((event) => {
        const draft = eventToDraft(event);
        if (!draft) return;
        eventCount += 1;
        upsertActivity(byKey, draft);
      });
      const fromEvents = accountFromEvents(liveEvents);
      if (fromEvents) accountDraft = mergeAccount(accountDraft, fromEvents);
    }
    input.onProgress?.({ phase: "events", checked: 1, total: 1 });

    const hints = parseHintLoyalty(input.customerRecord);
    if (hints.account) accountDraft = mergeAccount(accountDraft, hints.account);
    hints.activities.forEach((draft) => upsertActivity(byKey, draft));

    const drafts = Array.from(byKey.values());
    const offerIds = Array.from(
      new Set(
        drafts
          .map((item) => item.offerId)
          .filter((id): id is number => Boolean(id)),
      ),
    );

    let catalogFailed = 0;
    input.onProgress?.({
      phase: "catalog",
      checked: 0,
      total: offerIds.length,
    });

    if (offerIds.length > 0) {
      let checked = 0;
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
            checked += 1;
            input.onProgress?.({
              phase: "catalog",
              checked,
              total: offerIds.length,
            });
          }
        },
        input.isAborted,
      );
      const offerById = new Map(
        offerRows
          .filter((row) => row.offer)
          .map((row) => [row.offerId, row.offer!]),
      );
      drafts.forEach((draft) => {
        if (!draft.offerId) return;
        const offer = offerById.get(draft.offerId);
        if (offer) applyOfferCatalog(draft, offer);
      });
    }

    const activities = sortActivities(
      drafts.map((draft) => finalizeActivity(draft)),
    );
    const counts = countActivities(activities);
    applyActivityTotals(accountDraft, counts);
    const account = finalizeAccount(accountDraft);

    if (!eventsLive) {
      warnings.push(
        "Live customer events were not available, so loyalty activity could not be confirmed from the event stream.",
      );
    }
    if (catalogFailed > 0) {
      warnings.push(
        `Offer catalog details could not be loaded for ${catalogFailed} linked offer${catalogFailed === 1 ? "" : "s"}.`,
      );
    }
    if (account.balanceEstimated && account.pointsBalance != null) {
      warnings.push(
        "Points balance is estimated from earn and redeem activity because no loyalty account balance was returned.",
      );
    }
    if (
      account.tier &&
      account.verification === "hint" &&
      !account.evidence.includes("subscriber_api")
    ) {
      warnings.push(
        "Program tier is taken from the customer profile and was not verified against a loyalty account.",
      );
    }
    const hintOnly = activities.filter((item) => item.verification === "hint")
      .length;
    if (hintOnly > 0) {
      warnings.push(
        `${hintOnly} reward${hintOnly === 1 ? "" : "s"} came from the customer profile and ${hintOnly === 1 ? "was" : "were"} not verified against the loyalty ledger or events.`,
      );
    }

    const result: CustomerLoyaltyResult = {
      account,
      activities,
      counts,
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

export default customerLoyaltyService;
