import type { CustomerEvent } from "../types/customerEvent";
import type {
  CustomerCommunicationChannel,
  CustomerCommunicationCounts,
  CustomerCommunicationEvidence,
  CustomerCommunicationItem,
  CustomerCommunicationOrigin,
  CustomerCommunicationStatus,
  CustomerCommunicationVerification,
} from "../types/customerCommunication";
import type { CustomerIdentifierKind } from "../types/customerSubscribedList";
import { asRecord } from "./customerSegmentHelpers";
import { stripHtmlPreview } from "./customerEventHelpers";
import { extractAddedAt } from "./customerSubscribedListHelpers";

export const EMPTY_COMMUNICATION_COUNTS: CustomerCommunicationCounts = {
  total: 0,
  delivered: 0,
  failed: 0,
  pending: 0,
};

/**
 * Message deliveries the catalog already uses. Kept so existing event
 * codes still qualify even when the code does not follow the delivery
 * naming pattern (for example `order_confirmation` or `price_drop_alert`).
 */
const COMMUNICATION_DELIVERY_EVENT_TYPES = new Set([
  "message_sent",
  "message_delivered",
  "message_failed",
  "message_bounced",
  "message_opened",
  "message_clicked",
  "message_read",
  "campaign_executed",
  "welcome_email",
  "promotional_sms",
  "price_drop_alert",
  "order_confirmation",
  "delivery_notification",
  "new_products",
  "newsletter",
  "order_alert",
  "received_message",
]);

/**
 * Customer-originated messages. These are activity, not a send to the
 * customer. `received_message` is intentionally absent: in this catalog it
 * means the customer was delivered a campaign or offer message.
 */
const CUSTOMER_ORIGINATED_MESSAGE_TYPES = new Set([
  "message_received",
  "inbound_message",
  "customer_sms",
  "mo_sms",
]);

/**
 * Events that belong on another Customer 360 tab. A creative or message
 * payload on these types does not make them a communication.
 */
const NON_COMMUNICATION_EVENT_TYPES = new Set([
  "offer_redeemed",
  "offer_accepted",
  "offer_presented",
  "opt_in",
  "opt_out",
  "app_login",
  "ussd_session",
  "recharge",
  "bundle_purchase",
  "data_usage",
  "voice_call",
  "points_earned",
  "points_redeemed",
  "loyalty_tier_changed",
  "reward_granted",
  "support_ticket_created",
  "complaint_logged",
  "customer_care_contact",
  "device_registered",
  "sim_swap",
  "account_suspended",
]);

/** Whole-token domains that are never a message send, even if a channel word appears in the code. */
const OTHER_DOMAIN_TYPE_PATTERN =
  /(^|_)(offer|opt_in|opt_out|unsubscribe|consent|dnd|preference|recharge|bundle|purchase|payment|points|loyalty|reward|ticket|complaint|sim_swap|usage|redeem)(_|$)/;

/**
 * Matches delivery codes the backend can add without a frontend change:
 * `sms_delivered`, `email_bounced`, `push_notification`, `whatsapp_message`.
 */
const COMMUNICATION_DELIVERY_TYPE_PATTERN =
  /(^|_)(message|email|sms|push|whatsapp|newsletter|notification)(_|$)/;

const CAMPAIGN_DELIVERY_TYPE_PATTERN = /^campaign_(executed|sent|message)/;

function normalizeEventTypeCode(value: string): string {
  return value.trim().toLowerCase().replace(/[\s-]+/g, "_");
}

function isOtherCustomerDomain(type: string): boolean {
  return (
    CUSTOMER_ORIGINATED_MESSAGE_TYPES.has(type) ||
    NON_COMMUNICATION_EVENT_TYPES.has(type) ||
    OTHER_DOMAIN_TYPE_PATTERN.test(type)
  );
}

export type DraftCommunication = {
  subject: string;
  body: string;
  channel: CustomerCommunicationChannel;
  status: CustomerCommunicationStatus;
  sentAt: string | null;
  deliveredAt: string | null;
  recipient: string | null;
  matchedIdentifierType: CustomerIdentifierKind | null;
  origin: CustomerCommunicationOrigin;
  campaignId: number | null;
  campaignName: string | null;
  offerId: number | null;
  offerName: string | null;
  broadcastId: string | null;
  broadcastName: string | null;
  executionId: string | null;
  creativeId: number | null;
  creativeName: string | null;
  eventId: string | null;
  eventType: string | null;
  eventTypeLabel: string | null;
  evidence: Set<CustomerCommunicationEvidence>;
};

export function numericId(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value) && value > 0) {
    return Math.trunc(value);
  }
  if (typeof value === "string") {
    const parsed = Number(value.trim());
    if (Number.isFinite(parsed) && parsed > 0) return Math.trunc(parsed);
  }
  return null;
}

export function stringOrNull(value: unknown): string | null {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed ? trimmed : null;
  }
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return null;
}

export function unwrapCommunicationList(payload: unknown): unknown[] {
  if (Array.isArray(payload)) return payload;
  const record = asRecord(payload);
  if (!record) return [];
  const nested = asRecord(record.data);
  const candidates = [
    record.data,
    record.communications,
    record.messages,
    record.logs,
    record.delivery_logs,
    record.items,
    record.results,
    nested?.data,
    nested?.communications,
    nested?.messages,
    nested?.logs,
    nested?.delivery_logs,
    nested?.items,
  ];
  for (const candidate of candidates) {
    if (Array.isArray(candidate)) return candidate;
  }
  return [];
}

export function normalizeChannel(value: unknown): CustomerCommunicationChannel {
  const raw = String(value || "").trim().toLowerCase();
  if (raw === "email" || raw === "e-mail") return "email";
  if (raw === "sms" || raw === "text" || raw === "short_code") return "sms";
  if (raw === "push" || raw === "push_notification") return "push";
  if (raw === "whatsapp" || raw === "wa") return "whatsapp";
  if (raw === "ussd") return "ussd";
  if (raw === "app" || raw === "inapp" || raw === "in-app") return "app";
  if (raw === "voice" || raw === "ivr" || raw === "obd") return "voice";
  return "other";
}

export function normalizeStatus(value: unknown): CustomerCommunicationStatus {
  const raw = String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");
  if (["pending", "queued", "processing", "scheduled"].includes(raw)) {
    return "pending";
  }
  if (["sent", "submitted"].includes(raw)) return "sent";
  if (["delivered", "success", "completed", "ok"].includes(raw)) {
    return "delivered";
  }
  if (raw === "opened") return "opened";
  if (raw === "clicked") return "clicked";
  if (["read", "seen"].includes(raw)) return "read";
  if (["failed", "error", "rejected", "undelivered"].includes(raw)) {
    return "failed";
  }
  if (["bounced", "bounce"].includes(raw)) return "bounced";
  return "sent";
}

export function normalizeOrigin(value: unknown): CustomerCommunicationOrigin {
  const raw = String(value || "").trim().toLowerCase();
  if (raw.includes("campaign") || raw.includes("broadcast")) return "campaign";
  if (raw.includes("manual") || raw.includes("ad_hoc") || raw.includes("adhoc")) {
    return "manual";
  }
  if (raw.includes("system") || raw.includes("transactional")) return "system";
  return "unknown";
}

export function humanizeCommunicationChannel(
  channel: CustomerCommunicationChannel | string,
): string {
  const value = normalizeChannel(channel);
  if (value === "sms") return "SMS";
  if (value === "ussd") return "USSD";
  if (value === "whatsapp") return "WhatsApp";
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export function humanizeCommunicationStatus(
  status: CustomerCommunicationStatus | string,
): string {
  const value = normalizeStatus(status);
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export function humanizeCommunicationOrigin(
  origin: CustomerCommunicationOrigin,
): string {
  if (origin === "campaign") return "Campaign";
  if (origin === "manual") return "Manual";
  if (origin === "system") return "System";
  return "Unknown";
}

function laterDate(left: string | null, right: string | null): string | null {
  if (!left) return right;
  if (!right) return left;
  return new Date(left).getTime() >= new Date(right).getTime() ? left : right;
}

function preferText(current: string, incoming: string): string {
  if (!current) return incoming;
  if (!incoming) return current;
  if (incoming.length > current.length) return incoming;
  return current;
}

export function createDraft(
  extras?: Partial<Omit<DraftCommunication, "evidence">> & {
    evidence?: CustomerCommunicationEvidence[];
  },
): DraftCommunication {
  return {
    subject: extras?.subject || "",
    body: extras?.body || "",
    channel: extras?.channel || "other",
    status: extras?.status || "sent",
    sentAt: extras?.sentAt ?? null,
    deliveredAt: extras?.deliveredAt ?? null,
    recipient: extras?.recipient ?? null,
    matchedIdentifierType: extras?.matchedIdentifierType ?? null,
    origin: extras?.origin || "unknown",
    campaignId: extras?.campaignId ?? null,
    campaignName: extras?.campaignName ?? null,
    offerId: extras?.offerId ?? null,
    offerName: extras?.offerName ?? null,
    broadcastId: extras?.broadcastId ?? null,
    broadcastName: extras?.broadcastName ?? null,
    executionId: extras?.executionId ?? null,
    creativeId: extras?.creativeId ?? null,
    creativeName: extras?.creativeName ?? null,
    eventId: extras?.eventId ?? null,
    eventType: extras?.eventType ?? null,
    eventTypeLabel: extras?.eventTypeLabel ?? null,
    evidence: new Set(extras?.evidence || []),
  };
}

export function mergeDraft(
  target: DraftCommunication,
  source: DraftCommunication,
): DraftCommunication {
  source.evidence.forEach((item) => target.evidence.add(item));
  target.subject = preferText(target.subject, source.subject);
  target.body = preferText(target.body, source.body);
  if (target.channel === "other" && source.channel !== "other") {
    target.channel = source.channel;
  }
  target.status = rankStatus(source.status) > rankStatus(target.status)
    ? source.status
    : target.status;
  target.sentAt = laterDate(target.sentAt, source.sentAt);
  target.deliveredAt = laterDate(target.deliveredAt, source.deliveredAt);
  target.recipient = target.recipient || source.recipient;
  target.matchedIdentifierType =
    target.matchedIdentifierType || source.matchedIdentifierType;
  if (target.origin === "unknown" && source.origin !== "unknown") {
    target.origin = source.origin;
  }
  target.campaignId = target.campaignId ?? source.campaignId;
  target.campaignName = target.campaignName || source.campaignName;
  target.offerId = target.offerId ?? source.offerId;
  target.offerName = target.offerName || source.offerName;
  target.broadcastId = target.broadcastId || source.broadcastId;
  target.broadcastName = target.broadcastName || source.broadcastName;
  target.executionId = target.executionId || source.executionId;
  target.creativeId = target.creativeId ?? source.creativeId;
  target.creativeName = target.creativeName || source.creativeName;
  target.eventId = target.eventId || source.eventId;
  target.eventType = target.eventType || source.eventType;
  target.eventTypeLabel = target.eventTypeLabel || source.eventTypeLabel;
  return target;
}

function rankStatus(status: CustomerCommunicationStatus): number {
  const rank: Record<CustomerCommunicationStatus, number> = {
    pending: 1,
    sent: 2,
    delivered: 3,
    opened: 4,
    read: 5,
    clicked: 6,
    failed: 7,
    bounced: 8,
  };
  return rank[status] ?? 0;
}

export function draftKey(draft: DraftCommunication): string {
  if (draft.eventId) return `event-${draft.eventId}`;
  if (draft.executionId && draft.channel) {
    return `exec-${draft.executionId}-${draft.channel}-${draft.recipient || ""}`;
  }
  if (draft.broadcastId && draft.recipient) {
    return `broadcast-${draft.broadcastId}-${draft.channel}-${draft.recipient}`;
  }
  const sent = draft.sentAt || "";
  const subject = draft.subject.trim().toLowerCase();
  return `msg-${draft.channel}-${subject}-${sent}-${draft.recipient || ""}`;
}

function nearTime(left: string | null, right: string | null, windowMs = 120_000): boolean {
  if (!left || !right) return false;
  const a = Date.parse(left);
  const b = Date.parse(right);
  if (Number.isNaN(a) || Number.isNaN(b)) return false;
  return Math.abs(a - b) <= windowMs;
}

export function findExistingKey(
  byKey: Map<string, DraftCommunication>,
  draft: DraftCommunication,
): string | null {
  const canonical = draftKey(draft);
  if (byKey.has(canonical)) return canonical;

  for (const [key, item] of byKey) {
    if (draft.eventId && item.eventId === draft.eventId) return key;
    if (
      draft.executionId &&
      item.executionId === draft.executionId &&
      item.channel === draft.channel
    ) {
      return key;
    }
    if (
      draft.broadcastId &&
      item.broadcastId === draft.broadcastId &&
      item.channel === draft.channel &&
      (draft.recipient === item.recipient || nearTime(draft.sentAt, item.sentAt))
    ) {
      return key;
    }
    if (
      item.channel === draft.channel &&
      draft.subject &&
      item.subject &&
      draft.subject.trim().toLowerCase() === item.subject.trim().toLowerCase() &&
      nearTime(draft.sentAt, item.sentAt)
    ) {
      return key;
    }
  }
  return null;
}

export function parseCommunicationRecord(
  item: unknown,
  extras?: {
    evidence?: CustomerCommunicationEvidence;
    matchedIdentifierType?: CustomerIdentifierKind | null;
  },
): DraftCommunication | null {
  const row = asRecord(item);
  if (!row) return null;

  const nested =
    asRecord(row.message) ||
    asRecord(row.message_template) ||
    asRecord(row.content);
  const campaign =
    asRecord(row.campaign) || asRecord(row.campaign_details);
  const offer = asRecord(row.offer) || asRecord(row.offer_details);
  const creative = asRecord(row.creative) || asRecord(row.offer_creative);

  const subject =
    stringOrNull(
      row.subject ??
        row.title ??
        row.name ??
        nested?.subject ??
        nested?.title ??
        nested?.body,
    ) || "";
  const body =
    stringOrNull(
      row.body ??
        row.body_text ??
        row.body_preview ??
        row.content ??
        nested?.body ??
        nested?.content ??
        nested?.html_body,
    ) || "";
  const sentAt =
    stringOrNull(
      row.sent_at ??
        row.sentAt ??
        row.created_at ??
        row.date ??
        nested?.sent_at,
    ) ?? extractAddedAt(row);

  if (!subject && !body && !sentAt) return null;

  const campaignId =
    numericId(row.campaign_id ?? row.campaignId) ??
    numericId(campaign?.id ?? campaign?.campaign_id);
  const originFromSource = normalizeOrigin(
    row.origin ?? row.source_type ?? row.source ?? row.broadcast_type,
  );

  return createDraft({
    subject: subject || (body ? stripHtmlPreview(body).slice(0, 80) : "Untitled message"),
    body: body ? stripHtmlPreview(body) : "",
    channel: normalizeChannel(
      row.channel ?? row.channel_code ?? row.delivery_channel,
    ),
    status: normalizeStatus(row.status ?? row.delivery_status),
    sentAt,
    deliveredAt: stringOrNull(
      row.delivered_at ?? row.deliveredAt ?? nested?.delivered_at,
    ),
    recipient: stringOrNull(
      row.recipient ??
        row.recipient_identifier ??
        row.msisdn ??
        row.email ??
        row.phone,
    ),
    matchedIdentifierType: extras?.matchedIdentifierType ?? null,
    origin: campaignId ? "campaign" : originFromSource,
    campaignId,
    campaignName: stringOrNull(
      row.campaign_name ?? campaign?.name ?? campaign?.campaign_name,
    ),
    offerId:
      numericId(row.offer_id ?? row.offerId) ??
      numericId(offer?.id ?? offer?.offer_id),
    offerName: stringOrNull(row.offer_name ?? offer?.name),
    broadcastId: stringOrNull(
      row.broadcast_id ?? row.broadcastId ?? row.run_id,
    ),
    broadcastName: stringOrNull(row.broadcast_name ?? row.broadcastName),
    executionId: stringOrNull(row.execution_id ?? row.executionId),
    creativeId: numericId(row.creative_id ?? creative?.id),
    creativeName: stringOrNull(row.creative_name ?? creative?.name),
    eventId: stringOrNull(row.event_id ?? row.eventId),
    eventType: stringOrNull(row.event_type ?? row.eventType),
    eventTypeLabel: stringOrNull(
      row.event_type_label ?? row.eventTypeLabel,
    ),
    evidence: extras?.evidence ? [extras.evidence] : [],
  });
}

export function parseHintCommunications(
  record: Record<string, unknown> | null | undefined,
): DraftCommunication[] {
  if (!record) return [];
  return unwrapCommunicationList(
    record.communications ??
      record.communication_history ??
      record.messages,
  )
    .map((item) =>
      parseCommunicationRecord(item, { evidence: "profile_hint" }),
    )
    .filter((item): item is DraftCommunication => Boolean(item));
}

/**
 * True when this event is a communication sent to the customer.
 *
 * The decision is the event type, not the presence of a creative. Offer,
 * consent, usage, and care events stay on their own tabs. A new delivery
 * code is included when its name is a channel or message lifecycle, or
 * when the payload direction is explicitly outbound and the type is not
 * another customer domain.
 */
export function isCommunicationRelatedEvent(event: CustomerEvent): boolean {
  const type = normalizeEventTypeCode(event.event_type);
  if (!type || isOtherCustomerDomain(type)) return false;

  if (event.message?.direction === "outbound") return true;
  if (
    event.message?.direction === "inbound" &&
    !COMMUNICATION_DELIVERY_EVENT_TYPES.has(type)
  ) {
    return false;
  }
  if (COMMUNICATION_DELIVERY_EVENT_TYPES.has(type)) return true;
  if (COMMUNICATION_DELIVERY_TYPE_PATTERN.test(type)) return true;
  if (CAMPAIGN_DELIVERY_TYPE_PATTERN.test(type)) return true;
  return false;
}

export function isOutboundCommunicationEvent(event: CustomerEvent): boolean {
  return isCommunicationRelatedEvent(event);
}

export function eventToDraft(event: CustomerEvent): DraftCommunication | null {
  if (!isCommunicationRelatedEvent(event)) return null;

  const body =
    event.message?.content ||
    event.creative?.text_body ||
    stripHtmlPreview(event.creative?.html_body || "") ||
    event.description;

  return createDraft({
    subject:
      event.message?.subject ||
      event.creative?.title ||
      event.event_type_label ||
      event.description,
    body,
    channel: normalizeChannel(event.creative?.channel || event.channel),
    status: normalizeStatus(event.status),
    sentAt: event.message?.sent_at || event.occurred_at,
    deliveredAt: event.message?.delivered_at,
    origin: event.campaign?.id ? "campaign" : "system",
    campaignId: event.campaign?.id ?? null,
    campaignName: event.campaign?.name || null,
    offerId: event.offer?.id ?? null,
    offerName: event.offer?.name || null,
    creativeId: event.creative?.id ?? null,
    creativeName: event.creative?.name || event.creative?.title || null,
    eventId: event.id,
    eventType: event.event_type,
    eventTypeLabel: event.event_type_label || null,
    evidence: ["event"],
  });
}

export function finalizeCommunication(
  draft: DraftCommunication,
): CustomerCommunicationItem {
  const verification: CustomerCommunicationVerification =
    draft.evidence.has("subscriber_api") ||
    draft.evidence.has("delivery_log") ||
    draft.evidence.has("event")
      ? "verified"
      : "hint";

  return {
    id: draftKey(draft),
    subject: draft.subject || "Untitled message",
    body: draft.body,
    channel: draft.channel,
    status: draft.status,
    sentAt: draft.sentAt,
    deliveredAt: draft.deliveredAt,
    recipient: draft.recipient,
    matchedIdentifierType: draft.matchedIdentifierType,
    origin: draft.origin,
    campaignId: draft.campaignId,
    campaignName: draft.campaignName,
    offerId: draft.offerId,
    offerName: draft.offerName,
    broadcastId: draft.broadcastId,
    broadcastName: draft.broadcastName,
    executionId: draft.executionId,
    creativeId: draft.creativeId,
    creativeName: draft.creativeName,
    eventId: draft.eventId,
    eventType: draft.eventType,
    eventTypeLabel: draft.eventTypeLabel,
    evidence: Array.from(draft.evidence),
    verification,
  };
}

export function sortCommunications(
  items: CustomerCommunicationItem[],
): CustomerCommunicationItem[] {
  return [...items].sort((a, b) => {
    const aTime = Date.parse(a.sentAt || a.deliveredAt || "") || 0;
    const bTime = Date.parse(b.sentAt || b.deliveredAt || "") || 0;
    if (aTime !== bTime) return bTime - aTime;
    return a.subject.localeCompare(b.subject);
  });
}

export function countCommunications(
  items: CustomerCommunicationItem[],
): CustomerCommunicationCounts {
  return items.reduce(
    (counts, item) => {
      counts.total += 1;
      if (item.status === "failed" || item.status === "bounced") {
        counts.failed += 1;
      } else if (item.status === "pending") {
        counts.pending += 1;
      } else {
        counts.delivered += 1;
      }
      return counts;
    },
    { ...EMPTY_COMMUNICATION_COUNTS },
  );
}

export function uniqueChannels(
  items: CustomerCommunicationItem[],
): CustomerCommunicationChannel[] {
  return Array.from(new Set(items.map((item) => item.channel))).sort();
}

export function uniqueStatuses(
  items: CustomerCommunicationItem[],
): CustomerCommunicationStatus[] {
  const present = new Set(items.map((item) => item.status));
  return (
    [
      "pending",
      "sent",
      "delivered",
      "opened",
      "read",
      "clicked",
      "failed",
      "bounced",
    ] as CustomerCommunicationStatus[]
  ).filter((status) => present.has(status));
}

export function uniqueOrigins(
  items: CustomerCommunicationItem[],
): CustomerCommunicationOrigin[] {
  return Array.from(new Set(items.map((item) => item.origin)));
}

export function uniqueEventTypes(
  items: CustomerCommunicationItem[],
): Array<{ value: string; label: string }> {
  const labels = new Map<string, string>();
  items.forEach((item) => {
    if (!item.eventType || labels.has(item.eventType)) return;
    labels.set(item.eventType, item.eventTypeLabel || item.eventType);
  });
  return Array.from(labels.entries())
    .map(([value, label]) => ({ value, label }))
    .sort((a, b) => a.label.localeCompare(b.label));
}

export function filterCommunications(
  items: CustomerCommunicationItem[],
  query: {
    search?: string;
    channel?: string;
    status?: string;
    origin?: string;
    eventType?: string;
  },
): CustomerCommunicationItem[] {
  const search = query.search?.trim().toLowerCase() ?? "";
  const channel = query.channel && query.channel !== "all" ? query.channel : "";
  const status = query.status && query.status !== "all" ? query.status : "";
  const origin = query.origin && query.origin !== "all" ? query.origin : "";
  const eventType =
    query.eventType && query.eventType !== "all" ? query.eventType : "";

  return items.filter((item) => {
    if (channel && item.channel !== channel) return false;
    if (status && item.status !== status) return false;
    if (origin && item.origin !== origin) return false;
    if (eventType && item.eventType !== eventType) return false;
    if (!search) return true;
    return (
      item.subject.toLowerCase().includes(search) ||
      item.body.toLowerCase().includes(search) ||
      (item.campaignName || "").toLowerCase().includes(search) ||
      (item.offerName || "").toLowerCase().includes(search) ||
      (item.recipient || "").toLowerCase().includes(search)
    );
  });
}

export function latestSentAt(items: CustomerCommunicationItem[]): string | null {
  return items.reduce<string | null>((latest, item) => {
    return laterDate(latest, item.sentAt);
  }, null);
}
