import { campaignFlowService } from "../../campaigns/services/campaignFlowService";
import { segmentService } from "../../segments/services/segmentService";
import type {
  CustomerSegmentCampaign,
  CustomerSegmentProgress,
  CustomerSegmentResult,
} from "../types/customerSegment";
import {
  membershipFromHint,
  mergeCampaigns,
  parseCampaignFromUnknown,
  parseHintSegment,
  sortMemberships,
  unwrapList,
} from "../utils/customerSegmentHelpers";
import {
  collectCustomerIdentifiers,
  identifierCount,
  mapWithConcurrency,
} from "../utils/customerSubscribedListHelpers";
import {
  buildSubscriberIdentifierQuery,
  fetchSubscriberResource,
} from "./subscriberResourceClient";

const CAMPAIGN_CONCURRENCY = 8;
const CACHE_TTL_MS = 60_000;
const SEGMENT_PATHS = ["/segments", "/segment-membership"];

const RESULT_CACHE = new Map<
  string,
  { expires: number; result: CustomerSegmentResult }
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

async function loadCampaignsForSegment(
  segment: { id: number; name: string },
  isAborted?: () => boolean,
): Promise<CustomerSegmentCampaign[]> {
  abortIfNeeded(isAborted);
  const via = { segmentId: segment.id, segmentName: segment.name };
  const campaigns: CustomerSegmentCampaign[] = [];

  try {
    const response = await campaignFlowService.getCampaignFlowsBySegment(
      segment.id,
      true,
      undefined,
      50,
      0,
    );
    const rows = Array.isArray(response?.data) ? response.data : [];
    rows.forEach((row) => {
      const parsed = parseCampaignFromUnknown(row, via);
      if (parsed) campaigns.push(parsed);
    });
  } catch {
    // Usage endpoint below is the fallback.
  }

  if (campaigns.length === 0) {
    try {
      abortIfNeeded(isAborted);
      const usage = await segmentService.getSegmentUsageInCampaigns(segment.id);
      unwrapList(usage?.data ?? usage).forEach((row) => {
        const parsed = parseCampaignFromUnknown(row, via);
        if (parsed) campaigns.push(parsed);
      });
    } catch {
      // Optional enrichment.
    }
  }

  return mergeCampaigns(campaigns);
}

function toSegmentResult(
  memberships: CustomerSegmentResult["memberships"],
  identifiers: ReturnType<typeof collectCustomerIdentifiers>,
  extra?: Partial<CustomerSegmentResult>,
): CustomerSegmentResult {
  const sorted = sortMemberships(memberships);
  return {
    memberships: sorted,
    audienceCampaigns: mergeCampaigns(
      sorted.flatMap((item) => item.campaigns),
    ),
    systemSegmentCount: memberships.length,
    checkedCount: memberships.length,
    failedCheckCount: 0,
    identifierCount: identifierCount(identifiers),
    source: "live",
    reverseLookupUsed: true,
    warnings: [],
    ...extra,
  };
}

export type LoadCustomerSegmentsInput = {
  subscriberId: string | number;
  customerRecord?: Record<string, unknown> | null;
  onProgress?: (progress: CustomerSegmentProgress) => void;
  onPartial?: (result: CustomerSegmentResult) => void;
  isAborted?: () => boolean;
  skipCache?: boolean;
};

export const customerSegmentService = {
  async getCustomerSegments(
    input: LoadCustomerSegmentsInput,
  ): Promise<CustomerSegmentResult> {
    const subscriberId = String(input.subscriberId ?? "").trim();
    const identifiers = collectCustomerIdentifiers(
      input.customerRecord,
      subscriberId,
    );

    if (!subscriberId) {
      return {
        memberships: [],
        audienceCampaigns: [],
        systemSegmentCount: 0,
        checkedCount: 0,
        failedCheckCount: 0,
        identifierCount: 0,
        source: "live",
        reverseLookupUsed: false,
        warnings: ["No customer selected."],
      };
    }

    const key = cacheKey(subscriberId);
    const cached = input.skipCache ? undefined : RESULT_CACHE.get(key);
    if (cached && cached.expires > Date.now()) {
      input.onProgress?.({
        phase: "campaigns",
        checked: cached.result.memberships.length,
        total: cached.result.memberships.length,
      });
      return cached.result;
    }

    input.onProgress?.({ phase: "segments", checked: 0, total: 1 });
    const query = buildSubscriberIdentifierQuery(subscriberId, identifiers);
    const { payload } = await fetchSubscriberResource(
      subscriberId,
      SEGMENT_PATHS,
      query,
    );
    abortIfNeeded(input.isAborted);

    const memberships = unwrapList(payload)
      .map((item, index) => parseHintSegment(item, index))
      .filter((item): item is NonNullable<typeof item> => Boolean(item))
      .map((hint) => membershipFromHint(hint, "verified"));

    const pending = memberships.filter((item) => item.campaigns.length === 0);
    const partial = toSegmentResult(memberships, identifiers);
    input.onPartial?.(partial);
    input.onProgress?.({
      phase: "campaigns",
      checked: memberships.length - pending.length,
      total: memberships.length,
    });

    if (pending.length === 0) {
      RESULT_CACHE.set(key, { expires: Date.now() + CACHE_TTL_MS, result: partial });
      return partial;
    }

    let campaignChecked = memberships.length - pending.length;
    const enriched = await mapWithConcurrency(
      pending,
      CAMPAIGN_CONCURRENCY,
      async (membership) => {
        try {
          const campaigns = await loadCampaignsForSegment(
            { id: membership.segmentId, name: membership.name },
            input.isAborted,
          );
          return { ...membership, campaigns };
        } catch (error) {
          if (isAbortError(error)) throw error;
          return membership;
        } finally {
          campaignChecked += 1;
          input.onProgress?.({
            phase: "campaigns",
            checked: campaignChecked,
            total: memberships.length,
          });
        }
      },
      input.isAborted,
    );

    const byId = new Map(enriched.map((item) => [item.id, item]));
    const withCampaigns = memberships.map(
      (item) => byId.get(item.id) ?? item,
    );
    const result = toSegmentResult(withCampaigns, identifiers);

    RESULT_CACHE.set(key, { expires: Date.now() + CACHE_TTL_MS, result });
    return result;
  },
};

export default customerSegmentService;
