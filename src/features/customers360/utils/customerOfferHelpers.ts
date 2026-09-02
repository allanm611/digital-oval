import type { Offer } from "../../offers/types/offer";
import type { CustomerEvent } from "../types/customerEvent";
import type { CustomerSegmentVia } from "../types/customerSegment";
import type {
  CustomerOfferCampaignRef,
  CustomerOfferCounts,
  CustomerOfferEvidence,
  CustomerOfferEventRef,
  CustomerOfferItem,
  CustomerOfferState,
  CustomerOfferVerification,
} from "../types/customerOffer";
import { asRecord } from "./customerSegmentHelpers";
import { extractAddedAt } from "./customerSubscribedListHelpers";

export const EMPTY_OFFER_COUNTS: CustomerOfferCounts = {
  total: 0,
  available: 0,
  redeemed: 0,
  accepted: 0,
  expired: 0,
  inactive: 0,
};

const REDEEMED_EVENT_TYPES = new Set(["offer_redeemed"]);
const ACCEPTED_EVENT_TYPES = new Set(["offer_accepted"]);

export type HintOffer = {
  offerId: number | null;
  name: string;
  code: string;
  type: string;
  description: string;
  stateHint: CustomerOfferState | null;
  catalogStatus: string | null;
  valueAmount: number | null;
  valuePercent: number | null;
  redeemedAt: string | null;
  presentedAt: string | null;
};

export type DraftCustomerOffer = {
  offerId: number | null;
  name: string;
  code: string;
  type: string;
  description: string;
  catalogStatus: string | null;
  valueAmount: number | null;
  valuePercent: number | null;
  validFrom: string | null;
  validTo: string | null;
  isReusable: boolean;
  maxUsagePerCustomer: number | null;
  presentedAt: string | null;
  acceptedAt: string | null;
  redeemedAt: string | null;
  redemptionCount: number;
  lastChannel: string | null;
  viaCampaigns: Map<number, CustomerOfferCampaignRef>;
  viaSegments: Map<number, CustomerSegmentVia>;
  relatedEvents: Map<string, CustomerOfferEventRef>;
  evidence: Set<CustomerOfferEvidence>;
  stateHint: CustomerOfferState | null;
};

export function numericId(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value) && value > 0) {
    return Math.trunc(value);
  }
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return null;
    const parsed = Number(trimmed);
    if (Number.isFinite(parsed) && parsed > 0) return Math.trunc(parsed);
  }
  return null;
}

export function stringOrNull(value: unknown): string | null {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed ? trimmed : null;
  }
  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }
  return null;
}

export function numberOrNull(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

export function unwrapOfferList(payload: unknown): unknown[] {
  if (Array.isArray(payload)) return payload;
  const record = asRecord(payload);
  if (!record) return [];
  const nested = asRecord(record.data);
  const candidates = [
    record.data,
    record.offers,
    record.redemptions,
    record.items,
    record.results,
    nested?.data,
    nested?.offers,
    nested?.redemptions,
    nested?.items,
  ];
  for (const candidate of candidates) {
    if (Array.isArray(candidate)) return candidate;
  }
  return [];
}

function laterDate(left: string | null, right: string | null): string | null {
  if (!left) return right;
  if (!right) return left;
  return new Date(left).getTime() >= new Date(right).getTime() ? left : right;
}

export function humanizeOfferState(state: CustomerOfferState): string {
  if (state === "available") return "Available";
  if (state === "redeemed") return "Redeemed";
  if (state === "accepted") return "Accepted";
  if (state === "expired") return "Expired";
  return "Inactive";
}

export function humanizeOfferType(type: string | null | undefined): string {
  if (!type) return "—";
  return type
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export function humanizeCatalogStatus(status: string | null | undefined): string {
  if (!status) return "—";
  return status
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function normalizeStateHint(value: unknown): CustomerOfferState | null {
  const raw = stringOrNull(value)?.toLowerCase().replace(/[\s-]+/g, "_");
  if (!raw) return null;
  if (raw === "redeemed" || raw === "used" || raw === "claimed") return "redeemed";
  if (raw === "accepted" || raw === "opted_in") return "accepted";
  if (raw === "available" || raw === "active" || raw === "eligible") {
    return "available";
  }
  if (raw === "expired" || raw === "lapsed") return "expired";
  if (raw === "inactive" || raw === "paused" || raw === "cancelled" || raw === "canceled") {
    return "inactive";
  }
  return null;
}

export function createDraftOffer(
  extras?: Partial<Omit<DraftCustomerOffer, "viaCampaigns" | "viaSegments" | "relatedEvents" | "evidence">> & {
    viaCampaigns?: CustomerOfferCampaignRef[];
    viaSegments?: CustomerSegmentVia[];
    relatedEvents?: CustomerOfferEventRef[];
    evidence?: CustomerOfferEvidence[];
  },
): DraftCustomerOffer {
  const draft: DraftCustomerOffer = {
    offerId: extras?.offerId ?? null,
    name: extras?.name || "",
    code: extras?.code || "",
    type: extras?.type || "",
    description: extras?.description || "",
    catalogStatus: extras?.catalogStatus ?? null,
    valueAmount: extras?.valueAmount ?? null,
    valuePercent: extras?.valuePercent ?? null,
    validFrom: extras?.validFrom ?? null,
    validTo: extras?.validTo ?? null,
    isReusable: extras?.isReusable ?? false,
    maxUsagePerCustomer: extras?.maxUsagePerCustomer ?? null,
    presentedAt: extras?.presentedAt ?? null,
    acceptedAt: extras?.acceptedAt ?? null,
    redeemedAt: extras?.redeemedAt ?? null,
    redemptionCount: extras?.redemptionCount ?? 0,
    lastChannel: extras?.lastChannel ?? null,
    viaCampaigns: new Map(),
    viaSegments: new Map(),
    relatedEvents: new Map(),
    evidence: new Set(extras?.evidence || []),
    stateHint: extras?.stateHint ?? null,
  };
  extras?.viaCampaigns?.forEach((item) => draft.viaCampaigns.set(item.campaignId, item));
  extras?.viaSegments?.forEach((item) => draft.viaSegments.set(item.segmentId, item));
  extras?.relatedEvents?.forEach((item) => draft.relatedEvents.set(item.eventId, item));
  return draft;
}

export function mergeDraft(
  target: DraftCustomerOffer,
  source: DraftCustomerOffer,
): DraftCustomerOffer {
  source.viaCampaigns.forEach((item, id) => {
    const existing = target.viaCampaigns.get(id);
    target.viaCampaigns.set(id, existing ? mergeCampaignRef(existing, item) : item);
  });
  source.viaSegments.forEach((item, id) => {
    if (!target.viaSegments.has(id)) target.viaSegments.set(id, item);
  });
  source.relatedEvents.forEach((item, id) => {
    if (!target.relatedEvents.has(id)) target.relatedEvents.set(id, item);
  });
  source.evidence.forEach((item) => target.evidence.add(item));

  target.offerId = target.offerId ?? source.offerId;
  target.name = preferName(target.name, source.name);
  target.code = target.code || source.code;
  target.type = target.type || source.type;
  target.description = target.description || source.description;
  target.catalogStatus = target.catalogStatus || source.catalogStatus;
  target.valueAmount = target.valueAmount ?? source.valueAmount;
  target.valuePercent = target.valuePercent ?? source.valuePercent;
  target.validFrom = target.validFrom || source.validFrom;
  target.validTo = target.validTo || source.validTo;
  target.isReusable = target.isReusable || source.isReusable;
  target.maxUsagePerCustomer =
    target.maxUsagePerCustomer ?? source.maxUsagePerCustomer;
  target.presentedAt = laterDate(target.presentedAt, source.presentedAt);
  target.acceptedAt = laterDate(target.acceptedAt, source.acceptedAt);
  target.redeemedAt = laterDate(target.redeemedAt, source.redeemedAt);
  target.redemptionCount = Math.max(target.redemptionCount, source.redemptionCount);
  target.lastChannel = target.lastChannel || source.lastChannel;
  target.stateHint = target.stateHint || source.stateHint;
  return target;
}

function preferName(current: string, incoming: string): string {
  if (!current) return incoming;
  if (!incoming) return current;
  if (current.startsWith("Offer ") && !incoming.startsWith("Offer ")) {
    return incoming;
  }
  return current;
}

function mergeCampaignRef(
  existing: CustomerOfferCampaignRef,
  incoming: CustomerOfferCampaignRef,
): CustomerOfferCampaignRef {
  return {
    campaignId: existing.campaignId,
    campaignName: preferName(existing.campaignName, incoming.campaignName),
    campaignStatus: existing.campaignStatus || incoming.campaignStatus,
    isActive: existing.isActive ?? incoming.isActive,
  };
}

export function draftKey(draft: {
  offerId: number | null;
  name: string;
  code: string;
}): string {
  if (draft.offerId) return `offer-${draft.offerId}`;
  const code = draft.code.trim().toLowerCase();
  if (code) return `code-${code}`;
  const name = draft.name.trim().toLowerCase();
  if (name) return `name-${name}`;
  return `anon-${Math.random().toString(36).slice(2)}`;
}

export function parseHintOffer(item: unknown, index = 0): HintOffer | null {
  if (typeof item === "string" && item.trim()) {
    return {
      offerId: null,
      name: item.trim(),
      code: "",
      type: "",
      description: "",
      stateHint: null,
      catalogStatus: null,
      valueAmount: null,
      valuePercent: null,
      redeemedAt: null,
      presentedAt: null,
    };
  }

  const row = asRecord(item);
  if (!row) return null;

  const nested = asRecord(row.offer) || asRecord(row.offer_details);
  const offerId =
    numericId(row.offer_id ?? row.offerId ?? row.id) ??
    numericId(nested?.id ?? nested?.offer_id);
  const name =
    stringOrNull(row.name ?? row.offer_name ?? row.offerName ?? row.title) ??
    stringOrNull(nested?.name ?? nested?.title) ??
    (offerId ? `Offer ${offerId}` : "");
  if (!name && !offerId) return null;

  return {
    offerId,
    name: name || `Offer ${index + 1}`,
    code: stringOrNull(row.code ?? row.offer_code ?? nested?.code) || "",
    type:
      stringOrNull(
        row.type ??
          row.offer_type ??
          row.offerType ??
          row.offer_type_label ??
          nested?.offer_type_label ??
          nested?.offer_type,
      ) || "",
    description:
      stringOrNull(row.description ?? nested?.description) || "",
    stateHint: normalizeStateHint(
      row.customer_status ?? row.customerStatus ?? row.status,
    ),
    catalogStatus: stringOrNull(
      row.catalog_status ?? row.lifecycle_status ?? nested?.status,
    ),
    valueAmount: numberOrNull(
      row.value ??
        row.value_amount ??
        row.discount_amount ??
        row.bonus_value ??
        nested?.discount_amount ??
        nested?.bonus_value,
    ),
    valuePercent: numberOrNull(
      row.value_percent ??
        row.discount_percentage ??
        nested?.discount_percentage,
    ),
    redeemedAt:
      stringOrNull(
        row.redeemed_at ??
          row.redeemedAt ??
          row.redeemedDate ??
          row.redemption_date,
      ) ?? null,
    presentedAt:
      extractAddedAt(row) ??
      stringOrNull(row.presented_at ?? row.presentedAt ?? row.valid_from),
  };
}

export function parseHintOffers(
  record: Record<string, unknown> | null | undefined,
): HintOffer[] {
  if (!record) return [];
  return unwrapOfferList(record.offers ?? record.customer_offers)
    .map((item, index) => parseHintOffer(item, index))
    .filter((item): item is HintOffer => Boolean(item));
}

export function hintToDraft(hint: HintOffer): DraftCustomerOffer {
  return createDraftOffer({
    offerId: hint.offerId,
    name: hint.name,
    code: hint.code,
    type: hint.type,
    description: hint.description,
    catalogStatus: hint.catalogStatus,
    valueAmount: hint.valueAmount,
    valuePercent: hint.valuePercent,
    presentedAt: hint.presentedAt,
    redeemedAt: hint.redeemedAt,
    redemptionCount: hint.redeemedAt || hint.stateHint === "redeemed" ? 1 : 0,
    evidence: ["profile_hint"],
    stateHint: hint.stateHint,
  });
}

export function catalogToDraft(offer: Offer): DraftCustomerOffer {
  return createDraftOffer({
    offerId: offer.id,
    name: offer.name || `Offer ${offer.id}`,
    code: offer.code || "",
    type: String(offer.offer_type_label || offer.offer_type || ""),
    description: offer.description || "",
    catalogStatus: String(offer.status || offer.lifecycle_status || ""),
    valueAmount: numberOrNull(offer.discount_amount ?? offer.bonus_value),
    valuePercent: numberOrNull(offer.discount_percentage),
    validFrom: offer.valid_from || null,
    validTo: offer.valid_to || null,
    isReusable: Boolean(offer.is_reusable),
    maxUsagePerCustomer: numberOrNull(offer.max_usage_per_customer),
  });
}

export function isRedeemedEvent(event: CustomerEvent): boolean {
  const type = event.event_type.toLowerCase();
  const label = event.event_type_label.toLowerCase();
  return (
    REDEEMED_EVENT_TYPES.has(type) ||
    type.includes("offer_redeem") ||
    label.includes("offer redeemed")
  );
}

export function isAcceptedEvent(event: CustomerEvent): boolean {
  const type = event.event_type.toLowerCase();
  const label = event.event_type_label.toLowerCase();
  return (
    ACCEPTED_EVENT_TYPES.has(type) ||
    type.includes("offer_accept") ||
    label.includes("offer accepted")
  );
}

export function eventHasOfferContext(event: CustomerEvent): boolean {
  return Boolean(
    event.offer?.id ||
      event.offer?.name ||
      event.offer?.code ||
      isRedeemedEvent(event) ||
      isAcceptedEvent(event),
  );
}

export function eventToDraft(event: CustomerEvent): DraftCustomerOffer | null {
  if (!eventHasOfferContext(event)) return null;

  const redeemed = isRedeemedEvent(event);
  const accepted = isAcceptedEvent(event);
  const eventRef: CustomerOfferEventRef = {
    eventId: event.id,
    eventType: event.event_type,
    eventTypeLabel: event.event_type_label || event.event_type,
    occurredAt: event.occurred_at,
    channel: event.channel,
    status: event.status,
  };

  const campaign =
    event.campaign?.id != null
      ? {
          campaignId: event.campaign.id,
          campaignName: event.campaign.name || `Campaign ${event.campaign.id}`,
          campaignStatus: event.campaign.status || null,
          isActive: null,
        }
      : null;

  return createDraftOffer({
    offerId: event.offer?.id ?? null,
    name: event.offer?.name || "",
    code: event.offer?.code || "",
    type: event.offer?.type || "",
    description: event.offer?.description || "",
    catalogStatus: event.offer?.status || null,
    presentedAt: event.occurred_at,
    acceptedAt: accepted ? event.occurred_at : null,
    redeemedAt: redeemed ? event.occurred_at : null,
    redemptionCount: redeemed ? 1 : 0,
    lastChannel: event.channel,
    viaCampaigns: campaign ? [campaign] : [],
    relatedEvents: [eventRef],
    evidence: ["event"],
    stateHint: redeemed ? "redeemed" : accepted ? "accepted" : null,
  });
}

function isActiveCampaignStatus(status: string | null, isActive: boolean | null): boolean {
  if (isActive === false) return false;
  const value = (status || "active").toLowerCase();
  if (["inactive", "completed", "cancelled", "canceled", "expired", "archived"].includes(value)) {
    return false;
  }
  if (["paused", "draft", "pending"].includes(value)) return false;
  return true;
}

function isExpiredCatalog(draft: DraftCustomerOffer, now: Date): boolean {
  const status = (draft.catalogStatus || "").toLowerCase();
  if (["expired", "archived"].includes(status)) return true;
  if (!draft.validTo) return false;
  const until = new Date(draft.validTo);
  return !Number.isNaN(until.getTime()) && until.getTime() < now.getTime();
}

function isInactiveCatalog(draft: DraftCustomerOffer): boolean {
  const status = (draft.catalogStatus || "").toLowerCase();
  return ["paused", "draft", "rejected", "pending_approval"].includes(status);
}

export function resolveOfferState(
  draft: DraftCustomerOffer,
  now = new Date(),
): CustomerOfferState {
  if (draft.redeemedAt || draft.redemptionCount > 0 || draft.stateHint === "redeemed") {
    return "redeemed";
  }
  if (draft.acceptedAt || draft.stateHint === "accepted") {
    return "accepted";
  }
  if (draft.stateHint === "expired" || isExpiredCatalog(draft, now)) {
    return "expired";
  }
  if (draft.stateHint === "inactive" || isInactiveCatalog(draft)) {
    return "inactive";
  }

  const hasLiveCampaign = Array.from(draft.viaCampaigns.values()).some((campaign) =>
    isActiveCampaignStatus(campaign.campaignStatus, campaign.isActive),
  );
  const mapped = draft.evidence.has("campaign_mapping") || draft.evidence.has("subscriber_api");

  if (mapped && draft.viaCampaigns.size > 0 && !hasLiveCampaign) {
    return "inactive";
  }
  if (mapped || draft.stateHint === "available" || draft.evidence.has("profile_hint")) {
    return "available";
  }
  return "available";
}

export function finalizeOffer(
  draft: DraftCustomerOffer,
  now = new Date(),
): CustomerOfferItem {
  const state = resolveOfferState(draft, now);
  const verification: CustomerOfferVerification =
    draft.evidence.has("subscriber_api") ||
    draft.evidence.has("campaign_mapping") ||
    draft.evidence.has("event")
      ? "verified"
      : "hint";

  const relatedEvents = Array.from(draft.relatedEvents.values()).sort((a, b) => {
    return new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime();
  });

  return {
    id: draftKey(draft),
    offerId: draft.offerId,
    name: draft.name || (draft.offerId ? `Offer ${draft.offerId}` : "Untitled offer"),
    code: draft.code,
    type: draft.type,
    description: draft.description,
    state,
    catalogStatus: draft.catalogStatus,
    valueAmount: draft.valueAmount,
    valuePercent: draft.valuePercent,
    validFrom: draft.validFrom,
    validTo: draft.validTo,
    isReusable: draft.isReusable,
    maxUsagePerCustomer: draft.maxUsagePerCustomer,
    presentedAt: draft.presentedAt,
    acceptedAt: draft.acceptedAt,
    redeemedAt: draft.redeemedAt,
    redemptionCount: draft.redemptionCount,
    lastChannel: draft.lastChannel || relatedEvents[0]?.channel || null,
    viaCampaigns: Array.from(draft.viaCampaigns.values()).sort((a, b) =>
      a.campaignName.localeCompare(b.campaignName),
    ),
    viaSegments: Array.from(draft.viaSegments.values()).sort((a, b) =>
      a.segmentName.localeCompare(b.segmentName),
    ),
    relatedEvents,
    evidence: Array.from(draft.evidence),
    verification,
  };
}

const STATE_RANK: Record<CustomerOfferState, number> = {
  redeemed: 0,
  accepted: 1,
  available: 2,
  expired: 3,
  inactive: 4,
};

export function sortOffers(offers: CustomerOfferItem[]): CustomerOfferItem[] {
  return [...offers].sort((a, b) => {
    if (STATE_RANK[a.state] !== STATE_RANK[b.state]) {
      return STATE_RANK[a.state] - STATE_RANK[b.state];
    }
    const aTime = Date.parse(a.redeemedAt || a.acceptedAt || a.presentedAt || "") || 0;
    const bTime = Date.parse(b.redeemedAt || b.acceptedAt || b.presentedAt || "") || 0;
    if (aTime !== bTime) return bTime - aTime;
    return a.name.localeCompare(b.name);
  });
}

export function countOffers(offers: CustomerOfferItem[]): CustomerOfferCounts {
  return offers.reduce(
    (counts, offer) => {
      counts.total += 1;
      counts[offer.state] += 1;
      return counts;
    },
    { ...EMPTY_OFFER_COUNTS },
  );
}

export function uniqueOfferTypes(offers: CustomerOfferItem[]): string[] {
  return Array.from(
    new Set(offers.map((item) => item.type).filter((item) => Boolean(item))),
  ).sort();
}

export function uniqueOfferStates(offers: CustomerOfferItem[]): CustomerOfferState[] {
  const present = new Set(offers.map((item) => item.state));
  return (["available", "redeemed", "accepted", "expired", "inactive"] as CustomerOfferState[]).filter(
    (state) => present.has(state),
  );
}

export function filterCustomerOffers(
  offers: CustomerOfferItem[],
  query: { search?: string; state?: string; type?: string },
): CustomerOfferItem[] {
  const search = query.search?.trim().toLowerCase() ?? "";
  const state = query.state && query.state !== "all" ? query.state : "";
  const type = query.type && query.type !== "all" ? query.type : "";

  return offers.filter((item) => {
    if (state && item.state !== state) return false;
    if (type && item.type !== type) return false;
    if (!search) return true;
    const campaignHaystack = item.viaCampaigns
      .map((campaign) => campaign.campaignName)
      .join(" ")
      .toLowerCase();
    const segmentHaystack = item.viaSegments
      .map((segment) => segment.segmentName)
      .join(" ")
      .toLowerCase();
    return (
      item.name.toLowerCase().includes(search) ||
      item.code.toLowerCase().includes(search) ||
      item.type.toLowerCase().includes(search) ||
      item.description.toLowerCase().includes(search) ||
      campaignHaystack.includes(search) ||
      segmentHaystack.includes(search)
    );
  });
}

export function latestRedeemedAt(offers: CustomerOfferItem[]): string | null {
  return offers.reduce<string | null>((latest, offer) => {
    return laterDate(latest, offer.redeemedAt);
  }, null);
}
