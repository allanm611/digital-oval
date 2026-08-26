import { API_CONFIG, buildApiUrl, getAuthHeaders } from "../../../shared/services/api";
import { campaignFlowService } from "../../campaigns/services/campaignFlowService";
import { campaignService } from "../../campaigns/services/campaignService";
import { segmentService } from "../../segments/services/segmentService";
import type { SegmentType } from "../../segments/types/segment";
import type { CustomerListIdentifiers } from "../types/customerSubscribedList";
import type {
  CustomerSegmentCampaign,
  CustomerSegmentMembership,
  CustomerSegmentProgress,
  CustomerSegmentResult,
} from "../types/customerSegment";
import {
  asRecord,
  matchSegmentMember,
  membershipFromHint,
  membershipFromSegment,
  mergeCampaigns,
  parseCampaignFromUnknown,
  parseHintSegment,
  parseHintSegments,
  sortMemberships,
  unwrapList,
  type HintSegment,
} from "../utils/customerSegmentHelpers";
import {
  collectCustomerIdentifiers,
  extractAddedAt,
  hasAnyIdentifier,
  identifierCount,
  mapWithConcurrency,
} from "../utils/customerSubscribedListHelpers";

const MEMBER_PAGE_SIZE = 50;
const CHECK_CONCURRENCY = 5;
const CAMPAIGN_CONCURRENCY = 4;
const MAX_SEGMENTS = 2000;
const CACHE_TTL_MS = 60_000;
const MEMBERS_BASE_URL = buildApiUrl("/segment-members");

const RESULT_CACHE = new Map<
  string,
  { expires: number; result: CustomerSegmentResult }
>();

type MemberRecord = Record<string, unknown>;

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

function cacheKey(
  subscriberId: string,
  identifiers: CustomerListIdentifiers,
): string {
  return [
    subscriberId,
    identifiers.msisdns.join(","),
    identifiers.emails.join(","),
    identifiers.ids.join(","),
  ].join("|");
}

async function listAllSegments(isAborted?: () => boolean): Promise<SegmentType[]> {
  const pageSize = 100;
  const all: SegmentType[] = [];
  let offset = 0;

  while (all.length < MAX_SEGMENTS) {
    abortIfNeeded(isAborted);
    const response = await segmentService.getSegments({
      limit: pageSize,
      offset,
      skipCache: true,
    });
    const rows = Array.isArray(response?.data) ? response.data : [];
    all.push(...rows);

    const pagination = asRecord(response)?.pagination as
      | { total?: number; hasMore?: boolean }
      | undefined;
    const total = pagination?.total ?? response?.meta?.total;
    if (rows.length === 0 || rows.length < pageSize) break;
    if (pagination?.hasMore === false) break;
    if (typeof total === "number" && all.length >= total) break;
    offset += rows.length;
  }

  return all.slice(0, MAX_SEGMENTS);
}

async function searchMembers(
  segmentId: number,
  query: string,
  identifiers: CustomerListIdentifiers,
): Promise<{ members: MemberRecord[]; filterIgnored: boolean }> {
  try {
    const response = await segmentService.searchSegmentMembers(segmentId, {
      query,
      pageSize: MEMBER_PAGE_SIZE,
      offset: 0,
      skipCache: true,
      filters: {
        identifier: query,
      },
    });
    const members = Array.isArray(response?.data) ? response.data : [];
    const records = members.filter(
      (item): item is MemberRecord => Boolean(item) && typeof item === "object",
    );
    const filterIgnored =
      records.length > 0 &&
      records.every((member) => !matchSegmentMember(member, identifiers));
    return { members: records, filterIgnored };
  } catch {
    return { members: [], filterIgnored: true };
  }
}

async function fetchMemberPage(
  segmentId: number,
  offset: number,
): Promise<MemberRecord[]> {
  const response = await segmentService.getSegmentMembers(segmentId, {
    pageSize: MEMBER_PAGE_SIZE,
    offset,
    skipCache: true,
  });
  const members = Array.isArray(response?.data) ? response.data : [];
  return members.filter(
    (item): item is MemberRecord => Boolean(item) && typeof item === "object",
  );
}

async function findMemberInSegment(
  segment: SegmentType,
  identifiers: CustomerListIdentifiers,
  isAborted?: () => boolean,
): Promise<MemberRecord | null> {
  const probes = [
    identifiers.msisdns[0],
    identifiers.emails[0],
    identifiers.ids[0],
  ].filter((value): value is string => Boolean(value));

  for (const probe of probes) {
    abortIfNeeded(isAborted);
    const page = await searchMembers(segment.id, probe, identifiers);
    const matched = page.members.find((member) =>
      matchSegmentMember(member, identifiers),
    );
    if (matched) return matched;
    if (page.filterIgnored) {
      break;
    }
  }

  abortIfNeeded(isAborted);
  try {
    const firstPage = await fetchMemberPage(segment.id, 0);
    return (
      firstPage.find((member) => matchSegmentMember(member, identifiers)) ??
      null
    );
  } catch {
    return null;
  }
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

async function trySubscriberScopedMemberships(
  subscriberId: string,
): Promise<{ available: boolean; hints: HintSegment[] }> {
  const encoded = encodeURIComponent(subscriberId);
  const paths = [
    `${API_CONFIG.BASE_URL}/subscribers/${encoded}/segments`,
    `${MEMBERS_BASE_URL}/subscriber/${encoded}`,
    `${MEMBERS_BASE_URL}?subscriberId=${encoded}`,
    `${MEMBERS_BASE_URL}?customerId=${encoded}`,
  ];

  for (const url of paths) {
    const payload = await tryJsonGet(url);
    if (payload == null) continue;
    const hints = unwrapList(payload)
      .map((item, index) => parseHintSegment(item, index))
      .filter((item): item is HintSegment => Boolean(item));
    return { available: true, hints };
  }

  return { available: false, hints: [] };
}

function toMembership(
  segment: SegmentType,
  member: MemberRecord | null,
  identifiers: CustomerListIdentifiers,
  verification: CustomerSegmentMembership["verification"],
): CustomerSegmentMembership {
  const match = member ? matchSegmentMember(member, identifiers) : null;
  return membershipFromSegment(segment, {
    addedAt: member ? extractAddedAt(member) : null,
    matchedIdentifier: match?.identifier ?? null,
    matchedIdentifierType: match?.type ?? null,
    verification,
  });
}

async function loadCampaignsForSegment(
  segment: { id: number; name: string },
  isAborted?: () => boolean,
): Promise<CustomerSegmentCampaign[]> {
  abortIfNeeded(isAborted);
  const via = { segmentId: segment.id, segmentName: segment.name };
  const campaigns: CustomerSegmentCampaign[] = [];

  try {
    let offset = 0;
    const limit = 100;
    for (let page = 0; page < 5; page += 1) {
      abortIfNeeded(isAborted);
      const response = await campaignFlowService.getCampaignFlowsBySegment(
        segment.id,
        true,
        undefined,
        limit,
        offset,
      );
      const rows = Array.isArray(response?.data) ? response.data : [];
      rows.forEach((row) => {
        const parsed = parseCampaignFromUnknown(row, via);
        if (parsed) campaigns.push(parsed);
      });
      if (!response?.pagination?.hasMore || rows.length === 0) break;
      offset += rows.length;
    }
  } catch {
    // Usage endpoint below is the fallback.
  }

  try {
    abortIfNeeded(isAborted);
    const usage = await segmentService.getSegmentUsageInCampaigns(segment.id);
    const rows = unwrapList(usage?.data ?? usage);
    rows.forEach((row) => {
      const parsed = parseCampaignFromUnknown(row, via);
      if (parsed) campaigns.push(parsed);
    });
  } catch {
    // Optional enrichment.
  }

  const merged = mergeCampaigns(campaigns);
  const missing = merged.filter(
    (item) =>
      !item.campaignStatus || item.campaignName.startsWith("Campaign "),
  );

  if (missing.length === 0) return merged;

  const details = await mapWithConcurrency(
    missing,
    CAMPAIGN_CONCURRENCY,
    async (item) => {
      try {
        abortIfNeeded(isAborted);
        const campaign = await campaignService.getCampaignById(
          item.campaignId,
          true,
        );
        return {
          campaignId: item.campaignId,
          name: campaign?.name,
          status: campaign?.status ? String(campaign.status) : null,
          type: null as string | null,
        };
      } catch {
        return {
          campaignId: item.campaignId,
          name: undefined,
          status: null,
          type: null,
        };
      }
    },
    isAborted,
  );

  const detailById = new Map(details.map((item) => [item.campaignId, item]));
  return merged.map((campaign) => {
    const detail = detailById.get(campaign.campaignId);
    if (!detail) return campaign;
    return {
      ...campaign,
      campaignName: detail.name || campaign.campaignName,
      campaignStatus: campaign.campaignStatus || detail.status,
      campaignType: campaign.campaignType || detail.type,
    };
  });
}

export type LoadCustomerSegmentsInput = {
  subscriberId: string | number;
  customerRecord?: Record<string, unknown> | null;
  onProgress?: (progress: CustomerSegmentProgress) => void;
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
    const warnings: string[] = [];

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

    const key = cacheKey(subscriberId, identifiers);
    const cached = input.skipCache ? undefined : RESULT_CACHE.get(key);
    if (cached && cached.expires > Date.now()) {
      input.onProgress?.({
        phase: "campaigns",
        checked: cached.result.memberships.length,
        total: cached.result.memberships.length,
      });
      return cached.result;
    }

    const recordHints = parseHintSegments(input.customerRecord);
    const [systemSegments, scoped] = await Promise.all([
      listAllSegments(input.isAborted),
      trySubscriberScopedMemberships(subscriberId),
    ]);

    const segmentById = new Map(systemSegments.map((item) => [item.id, item]));
    const hintById = new Map<number, HintSegment>();
    [...recordHints, ...scoped.hints].forEach((hint) => {
      if (!hintById.has(hint.id)) hintById.set(hint.id, hint);
    });

    input.onProgress?.({
      phase: "segments",
      checked: 0,
      total: scoped.available ? hintById.size || 0 : systemSegments.length,
    });

    let checkedCount = 0;
    let failedCheckCount = 0;
    const memberships: CustomerSegmentMembership[] = [];
    const verifiedIds = new Set<number>();

    const segmentsToCheck: SegmentType[] = scoped.available
      ? Array.from(hintById.values())
          .map((hint) => segmentById.get(hint.id))
          .filter((item): item is SegmentType => Boolean(item))
          .concat(
            Array.from(hintById.values())
              .filter((hint) => !segmentById.has(hint.id))
              .map((hint) => ({
                id: hint.id,
                name: hint.name,
                code: hint.code ?? null,
                type: (hint.type as SegmentType["type"]) || "static",
                category: null,
                parent_segment: null,
                description: hint.description ?? null,
                definition: null,
                query: null,
                count_query: null,
                size_estimate: null,
                last_computed_at: null,
                tags: null,
                is_active: hint.isActive ?? true,
                created_at: "",
                updated_at: "",
                updated_by: null,
                visibility: "private",
                created_by_user_id: null,
              })),
          )
      : systemSegments;

    if (!hasAnyIdentifier(identifiers) && !scoped.available && hintById.size === 0) {
      return {
        memberships: [],
        audienceCampaigns: [],
        systemSegmentCount: systemSegments.length,
        checkedCount: 0,
        failedCheckCount: 0,
        identifierCount: 0,
        source: "live",
        reverseLookupUsed: false,
        warnings: [
          "This customer has no phone number, email, or ID to match against segment members.",
        ],
      };
    }

    if (!hasAnyIdentifier(identifiers) && hintById.size > 0) {
      hintById.forEach((hint) => {
        const listed = segmentById.get(hint.id);
        memberships.push(
          listed
            ? membershipFromSegment(listed, {
                addedAt: hint.addedAt,
                verification: "hint",
              })
            : membershipFromHint(hint),
        );
      });
    } else if (segmentsToCheck.length > 0 && hasAnyIdentifier(identifiers)) {
      const checks = await mapWithConcurrency(
        segmentsToCheck,
        CHECK_CONCURRENCY,
        async (segment) => {
          try {
            abortIfNeeded(input.isAborted);
            const member = await findMemberInSegment(
              segment,
              identifiers,
              input.isAborted,
            );
            return { segment, member, failed: false as const };
          } catch (error) {
            if (isAbortError(error)) throw error;
            return { segment, member: null, failed: true as const };
          } finally {
            checkedCount += 1;
            input.onProgress?.({
              phase: "segments",
              checked: checkedCount,
              total: segmentsToCheck.length,
            });
          }
        },
        input.isAborted,
      );

      const successfullyCheckedIds = new Set(
        checks.filter((check) => !check.failed).map((check) => check.segment.id),
      );

      for (const check of checks) {
        if (check.failed) {
          failedCheckCount += 1;
          const hint = hintById.get(check.segment.id);
          if (hint || scoped.available) {
            memberships.push(
              toMembership(check.segment, null, identifiers, "hint"),
            );
            verifiedIds.add(check.segment.id);
          }
          continue;
        }
        if (check.member) {
          memberships.push(
            toMembership(check.segment, check.member, identifiers, "verified"),
          );
          verifiedIds.add(check.segment.id);
          continue;
        }
        // Reverse lookup / profile hints stay even if member search cannot confirm.
        if (hintById.has(check.segment.id)) {
          memberships.push(
            toMembership(check.segment, null, identifiers, "hint"),
          );
          verifiedIds.add(check.segment.id);
        }
      }

      hintById.forEach((hint, id) => {
        if (verifiedIds.has(id) || successfullyCheckedIds.has(id)) return;
        const listed = segmentById.get(id);
        memberships.push(
          listed
            ? membershipFromSegment(listed, {
                addedAt: hint.addedAt,
                verification: "hint",
              })
            : membershipFromHint(hint),
        );
      });
    } else {
      hintById.forEach((hint) => {
        const listed = segmentById.get(hint.id);
        memberships.push(
          listed
            ? membershipFromSegment(listed, {
                addedAt: hint.addedAt,
                verification: "hint",
              })
            : membershipFromHint(hint),
        );
      });
    }

    if (systemSegments.length >= MAX_SEGMENTS) {
      warnings.push(
        `Stopped after checking ${MAX_SEGMENTS.toLocaleString()} segments. Remaining segments were not evaluated.`,
      );
    }
    if (failedCheckCount > 0) {
      warnings.push(
        `Membership could not be verified for ${failedCheckCount} segment${failedCheckCount === 1 ? "" : "s"}.`,
      );
    }
    if (scoped.available && systemSegments.length > hintById.size) {
      warnings.push(
        "Segment membership used the subscriber lookup. Other system segments were not scanned.",
      );
    }

    input.onProgress?.({
      phase: "campaigns",
      checked: 0,
      total: memberships.length,
    });

    let campaignChecked = 0;
    const withCampaigns = await mapWithConcurrency(
      memberships,
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

    const sorted = sortMemberships(withCampaigns);
    const audienceCampaigns = mergeCampaigns(
      sorted.flatMap((item) => item.campaigns),
    );

    const result: CustomerSegmentResult = {
      memberships: sorted,
      audienceCampaigns,
      systemSegmentCount: systemSegments.length,
      checkedCount: scoped.available
        ? segmentsToCheck.length
        : systemSegments.length,
      failedCheckCount,
      identifierCount: identifierCount(identifiers),
      source: failedCheckCount > 0 ? "partial" : "live",
      reverseLookupUsed: scoped.available,
      warnings: warnings.filter((warning, index, all) => all.indexOf(warning) === index),
    };

    RESULT_CACHE.set(key, { expires: Date.now() + CACHE_TTL_MS, result });
    return result;
  },
};

export default customerSegmentService;
