import type { Offer } from "../../offers/types/offer";
import type { CustomerEvent } from "../types/customerEvent";
import type { CustomerSegmentVia } from "../types/customerSegment";
import type {
  CustomerOfferBucket,
  CustomerOfferCampaignRef,
  CustomerOfferCounts,
  CustomerOfferEvidence,
  CustomerOfferEventRef,
  CustomerOfferItem,
  CustomerOfferReceipt,
  CustomerOfferRedemption,
  CustomerOfferRelationship,
  CustomerOfferStatus,
  CustomerOfferValidity,
  CustomerOfferVerification,
} from "../types/customerOffer";
import { asRecord } from "./customerSegmentHelpers";

export const EMPTY_OFFER_COUNTS: CustomerOfferCounts = {
  total: 0,
  attached: 0,
  received: 0,
  both: 0,
  active: 0,
  inactive: 0,
  redemptionEvents: 0,
};

const REDEEMED_EVENT_TYPES = new Set(["offer_redeemed"]);
const ACCEPTED_EVENT_TYPES = new Set(["offer_accepted"]);
const ATTACHED_RELATIONSHIPS = new Set([
  "attached",
  "attachment",
  "enrolled",
  "linked",
  "eligible",
  "active",
]);
const RECEIVED_RELATIONSHIPS = new Set([
  "received",
  "receipt",
  "presented",
  "sent",
  "delivered",
  "communication",
]);

export type TaggedOfferRow = {
  item: unknown;
  bucket: CustomerOfferBucket;
};

export type HintOffer = {
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
  isAttached: boolean;
  hasReceived: boolean;
  attachedAt: string | null;
  acceptedAt: string | null;
  attachmentSource: string | null;
  presentedAt: string | null;
  channel: string | null;
  reportedRedemptionCount: number;
  receipts: CustomerOfferReceipt[];
  redemptions: CustomerOfferRedemption[];
  campaigns: CustomerOfferCampaignRef[];
  segments: CustomerSegmentVia[];
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
  isAttached: boolean;
  hasReceived: boolean;
  attachedAt: string | null;
  acceptedAt: string | null;
  presentedAt: string | null;
  redeemedAt: string | null;
  reportedRedemptionCount: number;
  lastChannel: string | null;
  attachmentSources: Set<string>;
  receipts: Map<string, CustomerOfferReceipt>;
  redemptions: Map<string, CustomerOfferRedemption>;
  viaCampaigns: Map<number, CustomerOfferCampaignRef>;
  viaSegments: Map<number, CustomerSegmentVia>;
  relatedEvents: Map<string, CustomerOfferEventRef>;
  evidence: Set<CustomerOfferEvidence>;
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

function booleanOrNull(value: unknown): boolean | null {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") {
    if (value === 1) return true;
    if (value === 0) return false;
  }
  const raw = stringOrNull(value)?.toLowerCase();
  if (!raw) return null;
  if (["true", "yes", "1", "y"].includes(raw)) return true;
  if (["false", "no", "0", "n"].includes(raw)) return false;
  return null;
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function laterDate(left: string | null, right: string | null): string | null {
  if (!left) return right;
  if (!right) return left;
  const leftTime = new Date(left).getTime();
  const rightTime = new Date(right).getTime();
  if (Number.isNaN(leftTime)) return right;
  if (Number.isNaN(rightTime)) return left;
  return leftTime >= rightTime ? left : right;
}

function earlierDate(left: string | null, right: string | null): string | null {
  if (!left) return right;
  if (!right) return left;
  const leftTime = new Date(left).getTime();
  const rightTime = new Date(right).getTime();
  if (Number.isNaN(leftTime)) return right;
  if (Number.isNaN(rightTime)) return left;
  return leftTime <= rightTime ? left : right;
}

function pushUniqueRows(
  rows: TaggedOfferRow[],
  value: unknown,
  bucket: CustomerOfferBucket,
) {
  asArray(value).forEach((item) => rows.push({ item, bucket }));
}

function hasRelationshipBuckets(source: Record<string, unknown>): boolean {
  return [
    source.received,
    source.received_offers,
    source.receivedOffers,
    source.attached,
    source.attached_offers,
    source.attachedOffers,
    source.attachments,
  ].some((value) => Array.isArray(value));
}

/**
 * Splits a subscriber-offers payload into received, attached, and redemption rows.
 * A flat offers array is kept as mixed and classified per row.
 */
export function collectOfferRows(payload: unknown): TaggedOfferRow[] {
  if (Array.isArray(payload)) {
    return payload.map((item) => ({ item, bucket: "mixed" as const }));
  }
  const record = asRecord(payload);
  if (!record) return [];
  const nested = asRecord(record.data);
  const source = nested ?? record;
  const rows: TaggedOfferRow[] = [];

  if (hasRelationshipBuckets(source)) {
    pushUniqueRows(rows, source.received ?? source.received_offers ?? source.receivedOffers, "received");
    pushUniqueRows(
      rows,
      source.attached ?? source.attached_offers ?? source.attachedOffers ?? source.attachments,
      "attached",
    );
    pushUniqueRows(rows, source.redemptions ?? source.redemption_history, "redemption");
    return rows;
  }

  pushUniqueRows(
    rows,
    source.offers ?? source.customer_offers ?? source.items ?? source.results,
    "mixed",
  );
  if (rows.length === 0 && Array.isArray(record.data)) {
    pushUniqueRows(rows, record.data, "mixed");
  }
  if (rows.length === 0) {
    pushUniqueRows(rows, source.redemptions ?? source.redemption_history, "redemption");
  }
  return rows;
}

export function unwrapOfferList(payload: unknown): unknown[] {
  return collectOfferRows(payload).map((row) => row.item);
}

export function humanizeOfferStatus(status: CustomerOfferStatus): string {
  return status === "active" ? "Active" : "Inactive";
}

export function humanizeOfferRelationship(
  relationship: CustomerOfferRelationship,
): string {
  if (relationship === "both") return "Received and attached";
  if (relationship === "attached") return "Attached";
  return "Received";
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

export function humanizeValidity(validity: CustomerOfferValidity): string {
  if (validity === "valid") return "Within validity";
  if (validity === "expired") return "Validity ended";
  if (validity === "scheduled") return "Not started";
  return "Validity unknown";
}

function relationshipToken(value: unknown): string | null {
  return stringOrNull(value)?.toLowerCase().replace(/[\s-]+/g, "_") ?? null;
}

function isAttachedToken(value: string | null): boolean {
  if (!value) return false;
  return ATTACHED_RELATIONSHIPS.has(value) || value.includes("attach");
}

function isReceivedToken(value: string | null): boolean {
  if (!value) return false;
  return RECEIVED_RELATIONSHIPS.has(value) || value.includes("receiv");
}

function parseCampaignRefs(row: Record<string, unknown>): CustomerOfferCampaignRef[] {
  const list = asArray(row.campaigns ?? row.via_campaigns ?? row.viaCampaigns);
  const fromList = list
    .map((item) => {
      const record = asRecord(item);
      if (!record) return null;
      const campaignId = numericId(record.campaign_id ?? record.campaignId ?? record.id);
      const campaignName = stringOrNull(
        record.campaign_name ?? record.campaignName ?? record.name,
      );
      if (!campaignId || !campaignName) return null;
      const isActive = booleanOrNull(record.is_active ?? record.isActive);
      return {
        campaignId,
        campaignName,
        campaignStatus: stringOrNull(record.status ?? record.campaign_status),
        isActive,
      };
    })
    .filter((item): item is CustomerOfferCampaignRef => Boolean(item));

  if (fromList.length > 0) return fromList;

  const campaignId = numericId(row.campaign_id ?? row.campaignId);
  const campaignName = stringOrNull(row.campaign_name ?? row.campaignName);
  if (!campaignId || !campaignName) return [];
  return [
    {
      campaignId,
      campaignName,
      campaignStatus: stringOrNull(row.campaign_status ?? row.campaignStatus),
      isActive: booleanOrNull(row.campaign_is_active ?? row.campaignIsActive),
    },
  ];
}

function parseSegmentRefs(row: Record<string, unknown>): CustomerSegmentVia[] {
  const list = asArray(row.segments ?? row.via_segments ?? row.viaSegments);
  const fromList = list
    .map((item) => {
      const record = asRecord(item);
      if (!record) return null;
      const segmentId = numericId(record.segment_id ?? record.segmentId ?? record.id);
      const segmentName = stringOrNull(
        record.segment_name ?? record.segmentName ?? record.name,
      );
      if (!segmentId || !segmentName) return null;
      return { segmentId, segmentName };
    })
    .filter((item): item is CustomerSegmentVia => Boolean(item));

  if (fromList.length > 0) return fromList;

  const segmentId = numericId(row.segment_id ?? row.segmentId);
  const segmentName = stringOrNull(row.segment_name ?? row.segmentName);
  if (!segmentId || !segmentName) return [];
  return [{ segmentId, segmentName }];
}

function parseReceiptRecord(
  item: unknown,
  index: number,
  fallback: { channel: string | null; campaignId: number | null; campaignName: string | null },
): CustomerOfferReceipt | null {
  if (typeof item === "string" && item.trim()) {
    return {
      id: `receipt-${index}-${item.trim()}`,
      receivedAt: item.trim(),
      channel: fallback.channel,
      campaignId: fallback.campaignId,
      campaignName: fallback.campaignName,
      source: null,
    };
  }
  const row = asRecord(item);
  if (!row) return null;
  const receivedAt = stringOrNull(
    row.received_at ??
      row.receivedAt ??
      row.presented_at ??
      row.presentedAt ??
      row.sent_at ??
      row.delivered_at ??
      row.occurred_at ??
      row.created_at,
  );
  const channel = stringOrNull(row.channel ?? row.last_channel) ?? fallback.channel;
  const campaignId = numericId(row.campaign_id ?? row.campaignId) ?? fallback.campaignId;
  const campaignName =
    stringOrNull(row.campaign_name ?? row.campaignName) ?? fallback.campaignName;
  const source = stringOrNull(row.source ?? row.delivery_source ?? row.channel_source);
  const explicitId = stringOrNull(row.receipt_id ?? row.receiptId ?? row.id);
  if (!receivedAt && !channel && !campaignName && !source && !explicitId) return null;
  return {
    id: explicitId || `receipt-${receivedAt ?? "na"}-${channel ?? "na"}-${campaignId ?? index}`,
    receivedAt,
    channel,
    campaignId,
    campaignName,
    source,
  };
}

function parseRedemptionRecord(
  item: unknown,
  index: number,
  fallback: { channel: string | null; campaignId: number | null; campaignName: string | null },
): CustomerOfferRedemption | null {
  const row = asRecord(item);
  if (!row) return null;
  const redeemedAt = stringOrNull(
    row.redeemed_at ??
      row.redeemedAt ??
      row.redeemed_date ??
      row.redeemedDate ??
      row.redemption_date ??
      row.occurred_at ??
      row.created_at,
  );
  const channel = stringOrNull(row.channel ?? row.last_channel) ?? fallback.channel;
  const status = stringOrNull(row.status ?? row.redemption_status);
  const campaignId = numericId(row.campaign_id ?? row.campaignId) ?? fallback.campaignId;
  const campaignName =
    stringOrNull(row.campaign_name ?? row.campaignName) ?? fallback.campaignName;
  const explicitId = stringOrNull(row.redemption_id ?? row.redemptionId);
  if (!redeemedAt && !channel && !status && !explicitId) return null;
  return {
    id:
      explicitId ||
      `redemption-${redeemedAt ?? "na"}-${channel ?? "na"}-${campaignId ?? index}-${status ?? ""}`,
    redeemedAt,
    channel,
    status,
    campaignId,
    campaignName,
  };
}

export function parseHintOffer(
  item: unknown,
  index = 0,
  bucket: CustomerOfferBucket = "mixed",
): HintOffer | null {
  if (typeof item === "string" && item.trim()) {
    return {
      offerId: null,
      name: item.trim(),
      code: "",
      type: "",
      description: "",
      catalogStatus: null,
      valueAmount: null,
      valuePercent: null,
      validFrom: null,
      validTo: null,
      isReusable: false,
      maxUsagePerCustomer: null,
      isAttached: bucket === "attached",
      hasReceived: bucket !== "attached",
      attachedAt: null,
      acceptedAt: null,
      attachmentSource: null,
      presentedAt: null,
      channel: null,
      reportedRedemptionCount: 0,
      receipts: [],
      redemptions: [],
      campaigns: [],
      segments: [],
    };
  }

  const row = asRecord(item);
  if (!row) return null;

  const nested = asRecord(row.offer) || asRecord(row.offer_details);
  const offerId =
    numericId(row.offer_id ?? row.offerId) ??
    numericId(nested?.id ?? nested?.offer_id) ??
    (bucket === "mixed" ? numericId(row.id) : null);
  const name =
    stringOrNull(row.name ?? row.offer_name ?? row.offerName ?? row.title) ??
    stringOrNull(nested?.name ?? nested?.title) ??
    (offerId ? `Offer ${offerId}` : "");
  if (!name && !offerId) return null;

  const relationship = relationshipToken(
    row.relationship ?? row.kind ?? row.link_type ?? row.association ?? row.offer_link,
  );
  const explicitAttached = booleanOrNull(
    row.is_attached ?? row.isAttached ?? row.attached,
  );
  const statusToken = relationshipToken(
    row.customer_status ?? row.customerStatus ?? row.attachment_status ?? row.status,
  );
  const acceptedAt = stringOrNull(row.accepted_at ?? row.acceptedAt);
  const attachedAt = stringOrNull(
    row.attached_at ??
      row.attachedAt ??
      row.enrolled_at ??
      row.enrolledAt ??
      row.added_at ??
      row.addedAt,
  );

  const isAttached =
    explicitAttached === false
      ? false
      : bucket === "attached" ||
        explicitAttached === true ||
        isAttachedToken(relationship) ||
        isAttachedToken(statusToken) ||
        statusToken === "available" ||
        statusToken === "eligible" ||
        statusToken === "accepted" ||
        statusToken === "opted_in" ||
        Boolean(acceptedAt);

  const campaigns = parseCampaignRefs(row);
  const segments = parseSegmentRefs(row);
  const channel = stringOrNull(row.channel ?? row.last_channel ?? row.lastChannel);
  const primaryCampaign = campaigns[0];

  const receiptItems = asArray(
    row.receipts ?? row.deliveries ?? row.received_history,
  );
  const receipts = receiptItems
    .map((entry, receiptIndex) =>
      parseReceiptRecord(entry, receiptIndex, {
        channel,
        campaignId: primaryCampaign?.campaignId ?? null,
        campaignName: primaryCampaign?.campaignName ?? null,
      }),
    )
    .filter((entry): entry is CustomerOfferReceipt => Boolean(entry));

  const presentedAt = stringOrNull(
    row.received_at ??
      row.receivedAt ??
      row.presented_at ??
      row.presentedAt ??
      row.sent_at ??
      row.delivered_at,
  );

  if (
    receipts.length === 0 &&
    (presentedAt || bucket === "received" || isReceivedToken(relationship))
  ) {
    receipts.push({
      id: `receipt-${presentedAt ?? index}-${channel ?? "na"}-${primaryCampaign?.campaignId ?? index}`,
      receivedAt: presentedAt,
      channel,
      campaignId: primaryCampaign?.campaignId ?? null,
      campaignName: primaryCampaign?.campaignName ?? null,
      source: stringOrNull(row.source ?? row.delivery_source),
    });
  }

  const redemptionItems = asArray(row.redemptions ?? row.redemption_history);
  const redemptions = redemptionItems
    .map((entry, redemptionIndex) =>
      parseRedemptionRecord(entry, redemptionIndex, {
        channel,
        campaignId: primaryCampaign?.campaignId ?? null,
        campaignName: primaryCampaign?.campaignName ?? null,
      }),
    )
    .filter((entry): entry is CustomerOfferRedemption => Boolean(entry));

  const redeemedAt = stringOrNull(
    row.redeemed_at ?? row.redeemedAt ?? row.redeemedDate ?? row.redemption_date,
  );
  const redeemedStatus =
    statusToken === "redeemed" || statusToken === "used" || statusToken === "claimed";
  if (redemptions.length === 0 && (redeemedAt || bucket === "redemption" || redeemedStatus)) {
    redemptions.push({
      id: `redemption-${redeemedAt ?? index}-${channel ?? "na"}-${offerId ?? index}`,
      redeemedAt,
      channel,
      status: redeemedStatus ? statusToken : stringOrNull(row.redemption_status),
      campaignId: primaryCampaign?.campaignId ?? null,
      campaignName: primaryCampaign?.campaignName ?? null,
    });
  }

  const reportedRedemptionCount = Math.max(
    numberOrNull(
      row.redemption_count ??
        row.redemptionCount ??
        row.times_redeemed ??
        row.usage_count,
    ) ?? 0,
    redemptions.length,
  );

  const hasReceived =
    bucket === "received" ||
    bucket === "redemption" ||
    isReceivedToken(relationship) ||
    receipts.length > 0 ||
    redemptions.length > 0 ||
    reportedRedemptionCount > 0;

  const attachmentSource = stringOrNull(
    row.attachment_source ?? row.attachmentSource ?? (isAttached ? row.source : null),
  );

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
    description: stringOrNull(row.description ?? nested?.description) || "",
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
      row.value_percent ?? row.discount_percentage ?? nested?.discount_percentage,
    ),
    validFrom: stringOrNull(row.valid_from ?? row.validFrom ?? nested?.valid_from),
    validTo: stringOrNull(row.valid_to ?? row.validTo ?? nested?.valid_to),
    isReusable:
      booleanOrNull(row.is_reusable ?? row.isReusable ?? nested?.is_reusable) ?? false,
    maxUsagePerCustomer: numberOrNull(
      row.max_usage_per_customer ??
        row.maxUsagePerCustomer ??
        nested?.max_usage_per_customer,
    ),
    isAttached,
    hasReceived,
    attachedAt,
    acceptedAt,
    attachmentSource,
    presentedAt: receipts.reduce<string | null>(
      (latest, receipt) => laterDate(latest, receipt.receivedAt),
      presentedAt,
    ),
    channel,
    reportedRedemptionCount,
    receipts,
    redemptions,
    campaigns,
    segments,
  };
}

export function parseHintOffers(
  record: Record<string, unknown> | null | undefined,
): HintOffer[] {
  if (!record) return [];
  return collectOfferRows(record.offers ?? record.customer_offers)
    .map((row, index) => parseHintOffer(row.item, index, row.bucket))
    .filter((item): item is HintOffer => Boolean(item));
}

export function createDraftOffer(
  extras?: Partial<
    Omit<
      DraftCustomerOffer,
      | "viaCampaigns"
      | "viaSegments"
      | "relatedEvents"
      | "evidence"
      | "receipts"
      | "redemptions"
      | "attachmentSources"
    >
  > & {
    viaCampaigns?: CustomerOfferCampaignRef[];
    viaSegments?: CustomerSegmentVia[];
    relatedEvents?: CustomerOfferEventRef[];
    evidence?: CustomerOfferEvidence[];
    receipts?: CustomerOfferReceipt[];
    redemptions?: CustomerOfferRedemption[];
    attachmentSources?: string[];
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
    isAttached: extras?.isAttached ?? false,
    hasReceived: extras?.hasReceived ?? false,
    attachedAt: extras?.attachedAt ?? null,
    acceptedAt: extras?.acceptedAt ?? null,
    presentedAt: extras?.presentedAt ?? null,
    redeemedAt: extras?.redeemedAt ?? null,
    reportedRedemptionCount: extras?.reportedRedemptionCount ?? 0,
    lastChannel: extras?.lastChannel ?? null,
    attachmentSources: new Set(extras?.attachmentSources || []),
    receipts: new Map(),
    redemptions: new Map(),
    viaCampaigns: new Map(),
    viaSegments: new Map(),
    relatedEvents: new Map(),
    evidence: new Set(extras?.evidence || []),
  };
  extras?.receipts?.forEach((item) => draft.receipts.set(item.id, item));
  extras?.redemptions?.forEach((item) => draft.redemptions.set(item.id, item));
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
  source.receipts.forEach((item, id) => {
    if (!target.receipts.has(id)) target.receipts.set(id, item);
  });
  source.redemptions.forEach((item, id) => {
    if (!target.redemptions.has(id)) target.redemptions.set(id, item);
  });
  source.evidence.forEach((item) => target.evidence.add(item));
  source.attachmentSources.forEach((item) => target.attachmentSources.add(item));

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
  target.isAttached = target.isAttached || source.isAttached;
  target.hasReceived = target.hasReceived || source.hasReceived;
  target.attachedAt = earlierDate(target.attachedAt, source.attachedAt);
  target.acceptedAt = earlierDate(target.acceptedAt, source.acceptedAt);
  target.presentedAt = laterDate(target.presentedAt, source.presentedAt);
  target.redeemedAt = laterDate(target.redeemedAt, source.redeemedAt);
  target.reportedRedemptionCount = Math.max(
    target.reportedRedemptionCount,
    source.reportedRedemptionCount,
    target.redemptions.size,
  );
  target.lastChannel = target.lastChannel || source.lastChannel;
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

export function hintToDraft(hint: HintOffer): DraftCustomerOffer {
  const sources: string[] = [];
  if (hint.attachmentSource) sources.push(hint.attachmentSource);
  if (hint.isAttached && hint.campaigns.length > 0) sources.push("Campaign");
  if (hint.isAttached && hint.segments.length > 0) sources.push("Segment");

  const latestRedemption = hint.redemptions.reduce<string | null>(
    (latest, item) => laterDate(latest, item.redeemedAt),
    null,
  );

  return createDraftOffer({
    offerId: hint.offerId,
    name: hint.name,
    code: hint.code,
    type: hint.type,
    description: hint.description,
    catalogStatus: hint.catalogStatus,
    valueAmount: hint.valueAmount,
    valuePercent: hint.valuePercent,
    validFrom: hint.validFrom,
    validTo: hint.validTo,
    isReusable: hint.isReusable,
    maxUsagePerCustomer: hint.maxUsagePerCustomer,
    isAttached: hint.isAttached,
    hasReceived: hint.hasReceived,
    attachedAt: hint.attachedAt,
    acceptedAt: hint.acceptedAt,
    presentedAt: hint.presentedAt,
    redeemedAt: latestRedemption,
    reportedRedemptionCount: hint.reportedRedemptionCount,
    lastChannel: hint.channel,
    attachmentSources: sources,
    receipts: hint.receipts,
    redemptions: hint.redemptions,
    viaCampaigns: hint.campaigns,
    viaSegments: hint.segments,
    evidence: ["subscriber_api"],
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

  const redemption: CustomerOfferRedemption | null = redeemed
    ? {
        id: `event-${event.id}`,
        redeemedAt: event.occurred_at,
        channel: event.channel || null,
        status: event.status || null,
        campaignId: campaign?.campaignId ?? null,
        campaignName: campaign?.campaignName ?? null,
      }
    : null;

  const receipt: CustomerOfferReceipt | null = redeemed
    ? null
    : {
        id: `event-receipt-${event.id}`,
        receivedAt: event.occurred_at,
        channel: event.channel || null,
        campaignId: campaign?.campaignId ?? null,
        campaignName: campaign?.campaignName ?? null,
        source: "Customer event",
      };

  return createDraftOffer({
    offerId: event.offer?.id ?? null,
    name: event.offer?.name || "",
    code: event.offer?.code || "",
    type: event.offer?.type || "",
    description: event.offer?.description || "",
    catalogStatus: event.offer?.status || null,
    isAttached: accepted,
    hasReceived: true,
    attachedAt: accepted ? event.occurred_at : null,
    acceptedAt: accepted ? event.occurred_at : null,
    presentedAt: event.occurred_at,
    redeemedAt: redeemed ? event.occurred_at : null,
    reportedRedemptionCount: redeemed ? 1 : 0,
    lastChannel: event.channel,
    attachmentSources: accepted ? ["Accepted"] : [],
    receipts: receipt ? [receipt] : [],
    redemptions: redemption ? [redemption] : [],
    viaCampaigns: campaign ? [campaign] : [],
    relatedEvents: [eventRef],
    evidence: ["event"],
  });
}

function resolveValidity(draft: DraftCustomerOffer, now: Date): CustomerOfferValidity {
  const status = (draft.catalogStatus || "").toLowerCase();
  if (["expired", "archived"].includes(status)) return "expired";
  const from = draft.validFrom ? new Date(draft.validFrom) : null;
  const until = draft.validTo ? new Date(draft.validTo) : null;
  if (until && !Number.isNaN(until.getTime()) && until.getTime() < now.getTime()) {
    return "expired";
  }
  if (from && !Number.isNaN(from.getTime()) && from.getTime() > now.getTime()) {
    return "scheduled";
  }
  if ((from && !Number.isNaN(from.getTime())) || (until && !Number.isNaN(until.getTime()))) {
    return "valid";
  }
  if (["active", "approved"].includes(status)) return "valid";
  return "unknown";
}

export function resolveOfferStatus(draft: DraftCustomerOffer): CustomerOfferStatus {
  return draft.isAttached ? "active" : "inactive";
}

export function resolveRelationship(
  draft: Pick<DraftCustomerOffer, "isAttached" | "hasReceived">,
): CustomerOfferRelationship {
  if (draft.isAttached && draft.hasReceived) return "both";
  if (draft.isAttached) return "attached";
  return "received";
}

export function canRedeemOffer(input: {
  isAttached: boolean;
  validity: CustomerOfferValidity;
  isReusable: boolean;
  redemptionCount: number;
  maxUsagePerCustomer: number | null;
}): boolean {
  if (!input.isAttached) return false;
  if (input.validity === "expired" || input.validity === "scheduled") return false;
  if (input.redemptionCount > 0 && !input.isReusable) return false;
  if (
    input.maxUsagePerCustomer != null &&
    input.redemptionCount >= input.maxUsagePerCustomer
  ) {
    return false;
  }
  return true;
}

export function usageSummary(offer: Pick<
  CustomerOfferItem,
  "redemptionCount" | "maxUsagePerCustomer" | "isReusable"
>): string {
  const countLabel = `${offer.redemptionCount.toLocaleString()} redemption${
    offer.redemptionCount === 1 ? "" : "s"
  }`;
  if (offer.maxUsagePerCustomer != null) {
    const left = Math.max(0, offer.maxUsagePerCustomer - offer.redemptionCount);
    return `${countLabel} · ${left.toLocaleString()} of ${offer.maxUsagePerCustomer.toLocaleString()} left`;
  }
  return offer.isReusable ? `${countLabel} · reusable` : `${countLabel} · single use`;
}

export function finalizeOffer(
  draft: DraftCustomerOffer,
  now = new Date(),
): CustomerOfferItem {
  const status = resolveOfferStatus(draft);
  const validity = resolveValidity(draft, now);
  const relationship = resolveRelationship(draft);
  const verification: CustomerOfferVerification =
    draft.evidence.has("subscriber_api") ||
    draft.evidence.has("campaign_mapping") ||
    draft.evidence.has("event")
      ? "verified"
      : "hint";

  const relatedEvents = Array.from(draft.relatedEvents.values()).sort((a, b) => {
    return new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime();
  });
  const receipts = Array.from(draft.receipts.values()).sort((a, b) => {
    return (Date.parse(b.receivedAt || "") || 0) - (Date.parse(a.receivedAt || "") || 0);
  });
  const redemptions = Array.from(draft.redemptions.values()).sort((a, b) => {
    return (Date.parse(b.redeemedAt || "") || 0) - (Date.parse(a.redeemedAt || "") || 0);
  });
  const redemptionCount = Math.max(draft.reportedRedemptionCount, redemptions.length);
  const redeemedAt =
    redemptions.reduce<string | null>(
      (latest, item) => laterDate(latest, item.redeemedAt),
      draft.redeemedAt,
    ) ?? null;

  const attachmentSources = Array.from(draft.attachmentSources);
  if (draft.isAttached && attachmentSources.length === 0) {
    attachmentSources.push("Subscriber offer");
  }

  return {
    id: draftKey(draft),
    offerId: draft.offerId,
    name: draft.name || (draft.offerId ? `Offer ${draft.offerId}` : "Untitled offer"),
    code: draft.code,
    type: draft.type,
    description: draft.description,
    status,
    relationship,
    isAttached: draft.isAttached,
    hasReceived: draft.hasReceived,
    validity,
    catalogStatus: draft.catalogStatus,
    valueAmount: draft.valueAmount,
    valuePercent: draft.valuePercent,
    validFrom: draft.validFrom,
    validTo: draft.validTo,
    isReusable: draft.isReusable,
    maxUsagePerCustomer: draft.maxUsagePerCustomer,
    presentedAt:
      receipts.reduce<string | null>(
        (latest, item) => laterDate(latest, item.receivedAt),
        draft.presentedAt,
      ) ?? null,
    attachedAt: draft.attachedAt,
    acceptedAt: draft.acceptedAt,
    redeemedAt,
    redemptionCount,
    canRedeemAgain: canRedeemOffer({
      isAttached: draft.isAttached,
      validity,
      isReusable: draft.isReusable,
      redemptionCount,
      maxUsagePerCustomer: draft.maxUsagePerCustomer,
    }),
    lastChannel: draft.lastChannel || redemptions[0]?.channel || receipts[0]?.channel || null,
    attachmentSources,
    receipts,
    redemptions,
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

const RELATIONSHIP_RANK: Record<CustomerOfferRelationship, number> = {
  both: 0,
  attached: 1,
  received: 2,
};

export function sortOffers(offers: CustomerOfferItem[]): CustomerOfferItem[] {
  return [...offers].sort((a, b) => {
    if (a.status !== b.status) return a.status === "active" ? -1 : 1;
    if (RELATIONSHIP_RANK[a.relationship] !== RELATIONSHIP_RANK[b.relationship]) {
      return RELATIONSHIP_RANK[a.relationship] - RELATIONSHIP_RANK[b.relationship];
    }
    const aTime =
      Date.parse(a.redeemedAt || a.presentedAt || a.attachedAt || "") || 0;
    const bTime =
      Date.parse(b.redeemedAt || b.presentedAt || b.attachedAt || "") || 0;
    if (aTime !== bTime) return bTime - aTime;
    return a.name.localeCompare(b.name);
  });
}

export function countOffers(offers: CustomerOfferItem[]): CustomerOfferCounts {
  return offers.reduce(
    (counts, offer) => {
      counts.total += 1;
      if (offer.isAttached) counts.attached += 1;
      if (offer.hasReceived) counts.received += 1;
      if (offer.relationship === "both") counts.both += 1;
      counts[offer.status] += 1;
      counts.redemptionEvents += offer.redemptionCount;
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

export function uniqueOfferStatuses(offers: CustomerOfferItem[]): CustomerOfferStatus[] {
  const present = new Set(offers.map((item) => item.status));
  return (["active", "inactive"] as CustomerOfferStatus[]).filter((status) =>
    present.has(status),
  );
}

export function filterCustomerOffers(
  offers: CustomerOfferItem[],
  query: {
    search?: string;
    status?: string;
    type?: string;
    relationship?: string;
  },
): CustomerOfferItem[] {
  const search = query.search?.trim().toLowerCase() ?? "";
  const status = query.status && query.status !== "all" ? query.status : "";
  const type = query.type && query.type !== "all" ? query.type : "";
  const relationship =
    query.relationship && query.relationship !== "all" ? query.relationship : "";

  return offers.filter((item) => {
    if (status && item.status !== status) return false;
    if (type && item.type !== type) return false;
    if (relationship === "received" && !item.hasReceived) return false;
    if (relationship === "attached" && !item.isAttached) return false;
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
