import type { SegmentType } from "../../segments/types/segment";
import type {
  CustomerIdentifierKind,
  CustomerListIdentifiers,
} from "../types/customerSubscribedList";
import type {
  CustomerSegmentCampaign,
  CustomerSegmentMembership,
  CustomerSegmentVia,
} from "../types/customerSegment";
import {
  extractAddedAt,
  matchMemberRecord,
} from "./customerSubscribedListHelpers";

export type HintSegment = {
  id: number;
  name: string;
  code?: string;
  type?: string;
  description?: string;
  addedAt?: string | null;
  isActive?: boolean;
};

export function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

export function unwrapList(payload: unknown): unknown[] {
  if (Array.isArray(payload)) return payload;
  const record = asRecord(payload);
  if (!record) return [];
  const nested = asRecord(record.data);
  const candidates = [
    record.data,
    record.segments,
    record.memberships,
    record.items,
    nested?.data,
    nested?.segments,
    nested?.memberships,
    nested?.items,
  ];
  for (const candidate of candidates) {
    if (Array.isArray(candidate)) return candidate;
  }
  return [];
}

function numericId(value: unknown): number | null {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function stringOrNull(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

export function parseHintSegments(
  record: Record<string, unknown> | null | undefined,
): HintSegment[] {
  if (!record) return [];
  return unwrapList(record.segments ?? record.segment_memberships)
    .map((item, index) => parseHintSegment(item, index))
    .filter((item): item is HintSegment => Boolean(item));
}

export function parseHintSegment(
  item: unknown,
  index = 0,
): HintSegment | null {
  if (typeof item === "string" && item.trim()) {
    return { id: index + 1, name: item.trim() };
  }
  const row = asRecord(item);
  if (!row) return null;
  const id = numericId(row.id ?? row.segment_id ?? row.segmentId);
  const name = stringOrNull(row.name ?? row.segment_name ?? row.segmentName);
  if (!id && !name) return null;
  return {
    id: id ?? index + 1,
    name: name || `Segment ${id ?? index + 1}`,
    code: stringOrNull(row.code),
    type: stringOrNull(row.type ?? row.segment_type) ?? undefined,
    description: stringOrNull(row.description) ?? undefined,
    addedAt: extractAddedAt(row) ?? stringOrNull(row.addedDate),
    isActive:
      typeof row.is_active === "boolean"
        ? row.is_active
        : typeof row.isActive === "boolean"
          ? row.isActive
          : undefined,
  };
}

export function matchSegmentMember(
  member: Record<string, unknown>,
  identifiers: CustomerListIdentifiers,
): { identifier: string; type: CustomerIdentifierKind } | null {
  const nested = [
    asRecord(member.subscriber),
    asRecord(member.customer),
    asRecord(member.member),
  ].filter((item): item is Record<string, unknown> => Boolean(item));

  for (const record of [member, ...nested]) {
    const match = matchMemberRecord(record, identifiers);
    if (match) return match;
  }
  return null;
}

export function humanizeSegmentType(type: string | null | undefined): string {
  if (!type) return "—";
  return type
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export function humanizeCampaignStatus(status: string | null | undefined): string {
  if (!status) return "—";
  return status
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export function humanizeFlowType(flowType: string | null | undefined): string {
  if (!flowType) return "—";
  return flowType
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export function membershipFromSegment(
  segment: Pick<
    SegmentType,
    | "id"
    | "name"
    | "code"
    | "description"
    | "type"
    | "is_active"
    | "size_estimate"
  >,
  extras: {
    addedAt?: string | null;
    matchedIdentifier?: string | null;
    matchedIdentifierType?: CustomerIdentifierKind | null;
    verification: CustomerSegmentMembership["verification"];
    campaigns?: CustomerSegmentCampaign[];
    memberCount?: number | null;
  },
): CustomerSegmentMembership {
  return {
    id: `segment-${segment.id}`,
    segmentId: segment.id,
    name: segment.name || `Segment ${segment.id}`,
    code: segment.code,
    description: segment.description || "",
    type: String(segment.type || "static"),
    isActive: Boolean(segment.is_active),
    addedAt: extras.addedAt ?? null,
    matchedIdentifier: extras.matchedIdentifier ?? null,
    matchedIdentifierType: extras.matchedIdentifierType ?? null,
    memberCount:
      extras.memberCount ??
      (typeof segment.size_estimate === "number" ? segment.size_estimate : null),
    verification: extras.verification,
    campaigns: extras.campaigns ?? [],
  };
}

export function membershipFromHint(
  hint: HintSegment,
): CustomerSegmentMembership {
  return {
    id: `segment-${hint.id}`,
    segmentId: hint.id,
    name: hint.name,
    code: hint.code ?? null,
    description: hint.description || "",
    type: String(hint.type || "static"),
    isActive: hint.isActive ?? true,
    addedAt: hint.addedAt ?? null,
    matchedIdentifier: null,
    matchedIdentifierType: null,
    memberCount: null,
    verification: "hint",
    campaigns: [],
  };
}

export function parseCampaignFromUnknown(
  item: unknown,
  via: CustomerSegmentVia,
): CustomerSegmentCampaign | null {
  const row = asRecord(item);
  if (!row) return null;
  const campaignId = numericId(
    row.campaign_id ?? row.campaignId ?? row.id,
  );
  if (!campaignId) return null;
  const campaignName =
    stringOrNull(row.campaign_name ?? row.campaignName ?? row.name) ||
    `Campaign ${campaignId}`;
  return {
    campaignId,
    campaignName,
    campaignStatus: stringOrNull(
      row.campaign_status ?? row.campaignStatus ?? row.status,
    ),
    campaignType: stringOrNull(
      row.campaign_type ?? row.campaignType ?? row.type,
    ),
    flowType: stringOrNull(row.flow_type ?? row.flowType),
    offerId: numericId(row.offer_id ?? row.offerId),
    offerName: stringOrNull(row.offer_name ?? row.offerName ?? row.title),
    isActive:
      typeof row.is_active === "boolean"
        ? row.is_active
        : typeof row.isActive === "boolean"
          ? row.isActive
          : null,
    lastUsed:
      stringOrNull(row.last_used ?? row.lastUsed) ?? extractAddedAt(row),
    usageCount:
      typeof row.usage_count === "number"
        ? row.usage_count
        : typeof row.usageCount === "number"
          ? row.usageCount
          : null,
    viaSegments: [via],
  };
}

export function mergeCampaigns(
  campaigns: CustomerSegmentCampaign[],
): CustomerSegmentCampaign[] {
  const byId = new Map<number, CustomerSegmentCampaign>();

  for (const campaign of campaigns) {
    const existing = byId.get(campaign.campaignId);
    if (!existing) {
      byId.set(campaign.campaignId, {
        ...campaign,
        viaSegments: [...campaign.viaSegments],
      });
      continue;
    }

    const viaById = new Map(
      existing.viaSegments.map((item) => [item.segmentId, item]),
    );
    campaign.viaSegments.forEach((item) => viaById.set(item.segmentId, item));

    byId.set(campaign.campaignId, {
      campaignId: existing.campaignId,
      campaignName:
        existing.campaignName.startsWith("Campaign ") &&
        !campaign.campaignName.startsWith("Campaign ")
          ? campaign.campaignName
          : existing.campaignName,
      campaignStatus: existing.campaignStatus || campaign.campaignStatus,
      campaignType: existing.campaignType || campaign.campaignType,
      flowType: existing.flowType || campaign.flowType,
      offerId: existing.offerId ?? campaign.offerId,
      offerName: existing.offerName || campaign.offerName,
      isActive: existing.isActive ?? campaign.isActive,
      lastUsed: laterDate(existing.lastUsed, campaign.lastUsed),
      usageCount:
      existing.usageCount == null
        ? campaign.usageCount
        : campaign.usageCount == null
          ? existing.usageCount
          : Math.max(existing.usageCount, campaign.usageCount),
      viaSegments: Array.from(viaById.values()),
    });
  }

  return Array.from(byId.values()).sort((a, b) => {
    const aTime = a.lastUsed ? new Date(a.lastUsed).getTime() : 0;
    const bTime = b.lastUsed ? new Date(b.lastUsed).getTime() : 0;
    if (aTime !== bTime) return bTime - aTime;
    return a.campaignName.localeCompare(b.campaignName);
  });
}

function laterDate(left: string | null, right: string | null): string | null {
  if (!left) return right;
  if (!right) return left;
  return new Date(left).getTime() >= new Date(right).getTime() ? left : right;
}

export function sortMemberships(
  memberships: CustomerSegmentMembership[],
): CustomerSegmentMembership[] {
  return [...memberships].sort((a, b) => {
    if (a.campaigns.length !== b.campaigns.length) {
      return b.campaigns.length - a.campaigns.length;
    }
    const aTime = a.addedAt ? new Date(a.addedAt).getTime() : 0;
    const bTime = b.addedAt ? new Date(b.addedAt).getTime() : 0;
    if (aTime !== bTime) return bTime - aTime;
    return a.name.localeCompare(b.name);
  });
}

export function uniqueSegmentTypes(
  memberships: CustomerSegmentMembership[],
): string[] {
  return Array.from(new Set(memberships.map((item) => item.type))).sort();
}

export function uniqueCampaignStatuses(
  campaigns: CustomerSegmentCampaign[],
): string[] {
  return Array.from(
    new Set(
      campaigns
        .map((item) => item.campaignStatus)
        .filter((item): item is string => Boolean(item)),
    ),
  ).sort();
}

export function filterMemberships(
  memberships: CustomerSegmentMembership[],
  query: {
    search?: string;
    type?: string;
    campaignUsage?: "all" | "mapped" | "unmapped";
  },
): CustomerSegmentMembership[] {
  const search = query.search?.trim().toLowerCase() ?? "";
  const type = query.type && query.type !== "all" ? query.type : "";
  const campaignUsage = query.campaignUsage ?? "all";

  return memberships.filter((item) => {
    if (type && item.type !== type) return false;
    if (campaignUsage === "mapped" && item.campaigns.length === 0) return false;
    if (campaignUsage === "unmapped" && item.campaigns.length > 0) return false;
    if (!search) return true;
    const campaignHaystack = item.campaigns
      .map((campaign) => campaign.campaignName)
      .join(" ")
      .toLowerCase();
    return (
      item.name.toLowerCase().includes(search) ||
      (item.code || "").toLowerCase().includes(search) ||
      item.description.toLowerCase().includes(search) ||
      (item.matchedIdentifier || "").toLowerCase().includes(search) ||
      campaignHaystack.includes(search)
    );
  });
}

export function filterAudienceCampaigns(
  campaigns: CustomerSegmentCampaign[],
  query: { search?: string; status?: string },
): CustomerSegmentCampaign[] {
  const search = query.search?.trim().toLowerCase() ?? "";
  const status = query.status && query.status !== "all" ? query.status : "";

  return campaigns.filter((item) => {
    if (status && item.campaignStatus !== status) return false;
    if (!search) return true;
    const segmentHaystack = item.viaSegments
      .map((segment) => segment.segmentName)
      .join(" ")
      .toLowerCase();
    return (
      item.campaignName.toLowerCase().includes(search) ||
      (item.offerName || "").toLowerCase().includes(search) ||
      segmentHaystack.includes(search)
    );
  });
}
