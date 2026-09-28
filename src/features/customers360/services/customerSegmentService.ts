import { campaignFlowService } from "../../campaigns/services/campaignFlowService";
import { campaignService } from "../../campaigns/services/campaignService";
import { segmentService } from "../../segments/services/segmentService";
import type {
  CustomerSegmentCampaign,
  CustomerSegmentMembership,
  CustomerSegmentProgress,
  CustomerSegmentResult,
} from "../types/customerSegment";
import {
  applyCampaignIdentities,
  membershipFromHint,
  mergeCampaigns,
  parseCampaignFromUnknown,
  parseHintSegment,
  placeholderCampaignIds,
  sortMemberships,
  unwrapList,
  type CampaignIdentity,
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
const NAME_LOOKUP_CONCURRENCY = 6;
const CACHE_TTL_MS = 60_000;
const FLOW_PAGE_SIZE = 50;
const FLOW_PAGE_CAP = 6;
const SEGMENT_PATHS = ["/segments", "/segment-membership"];

const RESULT_CACHE = new Map<
  string,
  { expires: number; result: CustomerSegmentResult }
>();

const CAMPAIGN_IDENTITY_CACHE = new Map<
  number,
  { expires: number; identity: CampaignIdentity }
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

async function fetchSegmentFlows(
  segmentId: number,
  isAborted?: () => boolean,
): Promise<unknown[]> {
  const rows: unknown[] = [];
  let offset = 0;

  for (let page = 0; page < FLOW_PAGE_CAP; page += 1) {
    abortIfNeeded(isAborted);
    const response = await campaignFlowService.getCampaignFlowsBySegment(
      segmentId,
      true,
      undefined,
      FLOW_PAGE_SIZE,
      offset,
    );
    const batch = Array.isArray(response?.data) ? response.data : [];
    rows.push(...batch);
    if (!response?.pagination?.hasMore || batch.length < FLOW_PAGE_SIZE) break;
    offset += FLOW_PAGE_SIZE;
  }

  return rows;
}

async function loadCampaignsForSegment(
  segment: { id: number; name: string },
  isAborted?: () => boolean,
): Promise<CustomerSegmentCampaign[]> {
  abortIfNeeded(isAborted);
  const via = { segmentId: segment.id, segmentName: segment.name };
  const campaigns: CustomerSegmentCampaign[] = [];

  try {
    const rows = await fetchSegmentFlows(segment.id, isAborted);
    rows.forEach((row) => {
      const parsed = parseCampaignFromUnknown(row, via);
      if (parsed) campaigns.push(parsed);
    });
  } catch (error) {
    if (isAbortError(error)) throw error;
  }

  const needsNames =
    campaigns.length === 0 || placeholderCampaignIds(campaigns).length > 0;
  if (needsNames) {
    try {
      abortIfNeeded(isAborted);
      const usage = await segmentService.getSegmentUsageInCampaigns(segment.id);
      unwrapList(usage?.data ?? usage).forEach((row) => {
        const parsed = parseCampaignFromUnknown(row, via);
        if (parsed) campaigns.push(parsed);
      });
    } catch (error) {
      if (isAbortError(error)) throw error;
    }
  }

  return mergeCampaigns(campaigns);
}

async function resolveCampaignIdentities(
  campaigns: CustomerSegmentCampaign[],
  options: { skipCache?: boolean; isAborted?: () => boolean },
): Promise<Map<number, CampaignIdentity>> {
  const resolved = new Map<number, CampaignIdentity>();
  const now = Date.now();
  const missing: number[] = [];

  placeholderCampaignIds(campaigns).forEach((id) => {
    const cached = CAMPAIGN_IDENTITY_CACHE.get(id);
    if (!options.skipCache && cached && cached.expires > now) {
      resolved.set(id, cached.identity);
      return;
    }
    missing.push(id);
  });

  await mapWithConcurrency(
    missing,
    NAME_LOOKUP_CONCURRENCY,
    async (id) => {
      abortIfNeeded(options.isAborted);
      try {
        const campaign = await campaignService.getCampaignById(id);
        const name = campaign?.name?.trim();
        if (!name || name === "—" || name === "-") return;
        const identity: CampaignIdentity = {
          name,
          status: campaign.status ? String(campaign.status) : null,
        };
        CAMPAIGN_IDENTITY_CACHE.set(id, {
          expires: Date.now() + CACHE_TTL_MS,
          identity,
        });
        resolved.set(id, identity);
      } catch (error) {
        if (isAbortError(error)) throw error;
      }
    },
    options.isAborted,
  );

  return resolved;
}

async function withCampaignNames(
  memberships: CustomerSegmentMembership[],
  identifiers: ReturnType<typeof collectCustomerIdentifiers>,
  options: { skipCache?: boolean; isAborted?: () => boolean },
): Promise<CustomerSegmentResult> {
  const identities = await resolveCampaignIdentities(
    memberships.flatMap((item) => item.campaigns),
    options,
  );
  const named = applyCampaignIdentities(memberships, identities);
  const unresolved = placeholderCampaignIds(
    named.flatMap((item) => item.campaigns),
  ).filter((id) => !identities.has(id)).length;
  return toSegmentResult(named, identifiers, {
    warnings:
      unresolved > 0
        ? [
            unresolved === 1
              ? "1 campaign name could not be loaded."
              : `${unresolved} campaign names could not be loaded.`,
          ]
        : [],
  });
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
      const result = await withCampaignNames(memberships, identifiers, {
        skipCache: input.skipCache,
        isAborted: input.isAborted,
      });
      RESULT_CACHE.set(key, { expires: Date.now() + CACHE_TTL_MS, result });
      return result;
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
    const result = await withCampaignNames(withCampaigns, identifiers, {
      skipCache: input.skipCache,
      isAborted: input.isAborted,
    });

    RESULT_CACHE.set(key, { expires: Date.now() + CACHE_TTL_MS, result });
    return result;
  },
};

export default customerSegmentService;
