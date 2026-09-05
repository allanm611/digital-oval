import { API_CONFIG, getAuthHeaders } from "../../../shared/services/api";
import { customerEventService } from "./customerEventService";
import type {
  CustomerInteractionProgress,
  CustomerInteractionResult,
} from "../types/customerInteraction";
import {
  countInteractions,
  draftKey,
  EMPTY_INTERACTION_COUNTS,
  eventToDraft,
  finalizeInteraction,
  findExistingKey,
  mergeDraft,
  parseHintInteractions,
  parseInteractionRecord,
  sortInteractions,
  unwrapInteractionList,
  type DraftInteraction,
} from "../utils/customerInteractionHelpers";
import { asRecord } from "../utils/customerSegmentHelpers";

const CACHE_TTL_MS = 60_000;

const RESULT_CACHE = new Map<
  string,
  { expires: number; result: CustomerInteractionResult }
>();

function abortIfNeeded(isAborted?: () => boolean) {
  if (isAborted?.()) {
    throw new DOMException("Aborted", "AbortError");
  }
}

function emptyResult(warnings: string[] = []): CustomerInteractionResult {
  return {
    interactions: [],
    counts: { ...EMPTY_INTERACTION_COUNTS },
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
  byKey: Map<string, DraftInteraction>,
  draft: DraftInteraction,
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

async function trySubscriberScopedInteractions(
  subscriberId: string,
): Promise<{ available: boolean; drafts: DraftInteraction[] }> {
  const encoded = encodeURIComponent(subscriberId);
  const paths = [
    `${API_CONFIG.BASE_URL}/subscribers/${encoded}/interactions`,
    `${API_CONFIG.BASE_URL}/subscribers/${encoded}/tickets`,
    `${API_CONFIG.BASE_URL}/subscribers/${encoded}/support-tickets`,
    `${API_CONFIG.BASE_URL}/subscribers/${encoded}/call-logs`,
    `${API_CONFIG.BASE_URL}/subscribers/${encoded}/complaints`,
  ];

  const drafts: DraftInteraction[] = [];
  let available = false;

  for (const url of paths) {
    const payload = await tryJsonGet(url);
    if (payload == null) continue;
    available = true;
    unwrapInteractionList(payload).forEach((item) => {
      const parsed = parseInteractionRecord(item, { evidence: "subscriber_api" });
      if (parsed) drafts.push(parsed);
    });
  }

  return { available, drafts };
}

export type LoadCustomerInteractionsInput = {
  subscriberId: string | number;
  customerRecord?: Record<string, unknown> | null;
  onProgress?: (progress: CustomerInteractionProgress) => void;
  isAborted?: () => boolean;
  skipCache?: boolean;
};

export const customerInteractionService = {
  invalidateCache(subscriberId?: string | number) {
    if (subscriberId == null || subscriberId === "") {
      RESULT_CACHE.clear();
      return;
    }
    RESULT_CACHE.delete(String(subscriberId));
  },

  async getCustomerInteractions(
    input: LoadCustomerInteractionsInput,
  ): Promise<CustomerInteractionResult> {
    const subscriberId = String(input.subscriberId ?? "").trim();
    const warnings: string[] = [];

    if (!subscriberId) {
      return emptyResult(["No customer selected."]);
    }

    const cached = input.skipCache ? undefined : RESULT_CACHE.get(subscriberId);
    if (cached && cached.expires > Date.now()) {
      input.onProgress?.({
        phase: "events",
        checked: cached.result.interactions.length,
        total: cached.result.interactions.length,
      });
      return cached.result;
    }

    abortIfNeeded(input.isAborted);
    input.onProgress?.({ phase: "lookup", checked: 0, total: 1 });
    const scoped = await trySubscriberScopedInteractions(subscriberId);
    input.onProgress?.({ phase: "lookup", checked: 1, total: 1 });

    const byKey = new Map<string, DraftInteraction>();
    scoped.drafts.forEach((draft) => upsertDraft(byKey, draft));

    abortIfNeeded(input.isAborted);
    input.onProgress?.({ phase: "events", checked: 0, total: 1 });
    const eventsResult = await customerEventService.getSubscriberEvents(
      subscriberId,
      { time_preset: "all", limit: 500 },
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

    parseHintInteractions(input.customerRecord).forEach((draft) => {
      upsertDraft(byKey, draft);
    });

    const interactions = sortInteractions(
      Array.from(byKey.values()).map((draft) => finalizeInteraction(draft)),
    );

    if (!eventsLive) {
      warnings.push(
        "Live customer events were not available, so interactions could not be confirmed from the care event stream.",
      );
    }
    const hintOnly = interactions.filter((item) => item.verification === "hint")
      .length;
    if (hintOnly > 0) {
      warnings.push(
        `${hintOnly} interaction${hintOnly === 1 ? "" : "s"} came from the customer profile and ${hintOnly === 1 ? "was" : "were"} not verified against tickets or events.`,
      );
    }

    const result: CustomerInteractionResult = {
      interactions,
      counts: countInteractions(interactions),
      eventCount,
      source: !eventsLive ? "partial" : "live",
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

export default customerInteractionService;
