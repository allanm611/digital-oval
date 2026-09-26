import type {
  CustomerSubscribedListProgress,
  CustomerSubscribedListResult,
} from "../types/customerSubscribedList";
import {
  collectCustomerIdentifiers,
  identifierCount,
  parseSubscriberListMemberships,
  sortMemberships,
} from "../utils/customerSubscribedListHelpers";
import {
  buildSubscriberIdentifierQuery,
  fetchSubscriberResource,
} from "./subscriberResourceClient";

const CACHE_TTL_MS = 60_000;
const QUICKLIST_PATHS = ["/quicklists", "/quicklist-membership"];

const RESULT_CACHE = new Map<
  string,
  { expires: number; result: CustomerSubscribedListResult }
>();

function cacheKey(subscriberId: string): string {
  return subscriberId;
}

export type LoadSubscribedListsInput = {
  subscriberId: string | number;
  customerRecord?: Record<string, unknown> | null;
  onProgress?: (progress: CustomerSubscribedListProgress) => void;
  isAborted?: () => boolean;
  skipCache?: boolean;
};

export const customerSubscribedListService = {
  async getSubscribedLists(
    input: LoadSubscribedListsInput,
  ): Promise<CustomerSubscribedListResult> {
    const subscriberId = String(input.subscriberId ?? "").trim();
    const identifiers = collectCustomerIdentifiers(
      input.customerRecord,
      subscriberId,
    );

    if (!subscriberId) {
      return {
        memberships: [],
        systemQuickListCount: 0,
        checkedCount: 0,
        failedCheckCount: 0,
        identifierCount: 0,
        source: "live",
        warnings: ["No customer selected."],
      };
    }

    const key = cacheKey(subscriberId);
    const cached = input.skipCache ? undefined : RESULT_CACHE.get(key);
    if (cached && cached.expires > Date.now()) {
      input.onProgress?.({
        checked: cached.result.checkedCount,
        total: cached.result.systemQuickListCount,
      });
      return cached.result;
    }

    input.onProgress?.({ checked: 0, total: 1 });
    const query = buildSubscriberIdentifierQuery(subscriberId, identifiers);
    const { payload } = await fetchSubscriberResource(
      subscriberId,
      QUICKLIST_PATHS,
      query,
    );

    if (input.isAborted?.()) {
      throw new DOMException("Aborted", "AbortError");
    }

    const memberships = sortMemberships(parseSubscriberListMemberships(payload));
    input.onProgress?.({ checked: 1, total: 1 });

    const result: CustomerSubscribedListResult = {
      memberships,
      systemQuickListCount: memberships.length,
      checkedCount: memberships.length,
      failedCheckCount: 0,
      identifierCount: identifierCount(identifiers),
      source: "live",
      warnings: [],
    };

    RESULT_CACHE.set(key, { expires: Date.now() + CACHE_TTL_MS, result });
    return result;
  },
};

export default customerSubscribedListService;
