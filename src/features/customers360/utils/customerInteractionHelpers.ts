import type { CustomerEvent } from "../types/customerEvent";
import type {
  CustomerInteractionCounts,
  CustomerInteractionEvidence,
  CustomerInteractionItem,
  CustomerInteractionKind,
  CustomerInteractionStatus,
  CustomerInteractionVerification,
} from "../types/customerInteraction";
import { asRecord } from "./customerSegmentHelpers";
import { extractAddedAt } from "./customerSubscribedListHelpers";

export const EMPTY_INTERACTION_COUNTS: CustomerInteractionCounts = {
  total: 0,
  open: 0,
  resolved: 0,
  pending: 0,
};

const INTERACTION_EVENT_TYPES = new Set([
  "support_ticket_created",
  "support_ticket_updated",
  "support_ticket_resolved",
  "complaint_logged",
  "customer_care_contact",
  "feedback_submitted",
  "inquiry_logged",
  "call_log",
  "care_call",
  "inbound_call",
]);

const EXCLUDED_EVENT_TYPES = new Set([
  "promotional_sms",
  "welcome_email",
  "campaign_executed",
  "newsletter",
  "order_confirmation",
  "offer_redeemed",
  "offer_accepted",
  "bundle_purchase",
  "recharge",
  "points_earned",
  "points_redeemed",
  "opt_in",
  "opt_out",
  "app_login",
  "data_usage",
  "ussd_session",
  "customer_sms",
  "received_message",
  "message_received",
  "message_sent",
]);

export type DraftInteraction = {
  ticketId: string;
  kind: CustomerInteractionKind;
  subject: string;
  description: string;
  notes: string | null;
  status: CustomerInteractionStatus;
  occurredAt: string | null;
  resolvedAt: string | null;
  channel: string | null;
  agent: string | null;
  eventId: string | null;
  evidence: Set<CustomerInteractionEvidence>;
};

export function stringOrNull(value: unknown): string | null {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed ? trimmed : null;
  }
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return null;
}

export function unwrapInteractionList(payload: unknown): unknown[] {
  if (Array.isArray(payload)) return payload;
  const record = asRecord(payload);
  if (!record) return [];
  const nested = asRecord(record.data);
  const candidates = [
    record.data,
    record.interactions,
    record.tickets,
    record.call_logs,
    record.complaints,
    record.items,
    record.results,
    nested?.data,
    nested?.interactions,
    nested?.tickets,
    nested?.call_logs,
    nested?.complaints,
    nested?.items,
  ];
  for (const candidate of candidates) {
    if (Array.isArray(candidate)) return candidate;
  }
  return [];
}

export function normalizeKind(value: unknown): CustomerInteractionKind {
  const raw = String(value || "")
    .trim()
    .toLowerCase();
  if (raw.includes("ticket") || raw.includes("technical") || raw.includes("support")) {
    return "ticket";
  }
  if (raw.includes("call") || raw.includes("ivr") || raw.includes("voice")) {
    return "call";
  }
  if (raw.includes("complaint")) return "complaint";
  if (raw.includes("feedback")) return "feedback";
  if (raw.includes("inquir") || raw.includes("question")) return "inquiry";
  return "other";
}

export function normalizeStatus(value: unknown): CustomerInteractionStatus {
  const raw = String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");
  if (["in_progress", "working", "assigned"].includes(raw)) return "in_progress";
  if (raw === "open" || raw === "new" || raw === "created") return "open";
  if (["pending", "queued", "waiting"].includes(raw)) return "pending";
  if (["resolved", "done", "completed", "success"].includes(raw)) return "resolved";
  if (["closed", "cancelled", "canceled"].includes(raw)) return "closed";
  return "open";
}

export function humanizeInteractionKind(
  kind: CustomerInteractionKind | string,
): string {
  if (kind === "ticket") return "Support";
  if (kind === "call") return "Call";
  if (kind === "complaint") return "Complaint";
  if (kind === "feedback") return "Feedback";
  if (kind === "inquiry") return "Inquiry";
  return "Other";
}

export function humanizeInteractionStatus(
  status: CustomerInteractionStatus | string,
): string {
  if (status === "in_progress") return "In progress";
  if (status === "open") return "Open";
  if (status === "pending") return "Pending";
  if (status === "resolved") return "Resolved";
  if (status === "closed") return "Closed";
  return String(status || "Open");
}

function preferText(current: string, incoming: string): string {
  if (!current) return incoming;
  if (!incoming) return current;
  if (incoming.length > current.length) return incoming;
  return current;
}

export function createDraft(
  extras?: Partial<Omit<DraftInteraction, "evidence">> & {
    evidence?: CustomerInteractionEvidence[];
  },
): DraftInteraction {
  return {
    ticketId: extras?.ticketId || "",
    kind: extras?.kind || "other",
    subject: extras?.subject || "",
    description: extras?.description || "",
    notes: extras?.notes ?? null,
    status: extras?.status || "open",
    occurredAt: extras?.occurredAt ?? null,
    resolvedAt: extras?.resolvedAt ?? null,
    channel: extras?.channel ?? null,
    agent: extras?.agent ?? null,
    eventId: extras?.eventId ?? null,
    evidence: new Set(extras?.evidence || []),
  };
}

export function draftKey(draft: DraftInteraction): string {
  if (draft.ticketId) return `ticket-${draft.ticketId.toLowerCase()}`;
  if (draft.eventId) return `event-${draft.eventId}`;
  const stamp = draft.occurredAt || "";
  return `care-${draft.kind}-${draft.subject.toLowerCase()}-${stamp}`;
}

export function findExistingKey(
  byKey: Map<string, DraftInteraction>,
  draft: DraftInteraction,
): string | null {
  const canonical = draftKey(draft);
  if (byKey.has(canonical)) return canonical;
  for (const [key, item] of byKey) {
    if (draft.ticketId && item.ticketId === draft.ticketId) return key;
    if (draft.eventId && item.eventId === draft.eventId) return key;
  }
  return null;
}

export function mergeDraft(
  target: DraftInteraction,
  source: DraftInteraction,
): DraftInteraction {
  source.evidence.forEach((item) => target.evidence.add(item));
  target.ticketId = target.ticketId || source.ticketId;
  if (target.kind === "other" && source.kind !== "other") target.kind = source.kind;
  target.subject = preferText(target.subject, source.subject);
  target.description = preferText(target.description, source.description);
  target.notes = target.notes || source.notes;
  if (source.status === "resolved" || source.status === "closed") {
    target.status = source.status;
  } else if (target.status === "open" && source.status === "in_progress") {
    target.status = "in_progress";
  }
  target.occurredAt = target.occurredAt || source.occurredAt;
  target.resolvedAt = target.resolvedAt || source.resolvedAt;
  target.channel = target.channel || source.channel;
  target.agent = target.agent || source.agent;
  target.eventId = target.eventId || source.eventId;
  return target;
}

function looksLikeInteraction(row: Record<string, unknown>): boolean {
  const kind = String(row.kind ?? row.type ?? row.interaction_type ?? "").toLowerCase();
  if (
    row.ticket_id ||
    row.ticketId ||
    row.ticket_number ||
    row.complaint_id ||
    row.call_id
  ) {
    return true;
  }
  if (/ticket|call|complaint|feedback|inquir|support|care/.test(kind)) {
    return true;
  }
  if (row.subject || row.notes || row.agent || row.resolution) return true;
  return false;
}

export function parseInteractionRecord(
  item: unknown,
  extras?: { evidence?: CustomerInteractionEvidence },
): DraftInteraction | null {
  const row = asRecord(item);
  if (!row || !looksLikeInteraction(row)) return null;

  const ticketId =
    stringOrNull(
      row.ticket_id ??
        row.ticketId ??
        row.ticket_number ??
        row.reference ??
        row.id,
    ) || "";
  const kind = normalizeKind(
    row.kind ?? row.type ?? row.interaction_type ?? row.category,
  );
  const subject =
    stringOrNull(row.subject ?? row.title ?? row.summary ?? row.name) ||
    stringOrNull(row.description) ||
    "Interaction";
  const status = normalizeStatus(row.status ?? row.resolution_status ?? row.resolution);
  const occurredAt =
    stringOrNull(
      row.occurred_at ??
        row.opened_at ??
        row.created_at ??
        row.date ??
        row.call_at,
    ) ?? extractAddedAt(row);

  return createDraft({
    ticketId,
    kind,
    subject,
    description: stringOrNull(row.description ?? row.details ?? row.body) || "",
    notes: stringOrNull(row.notes ?? row.note ?? row.comment),
    status,
    occurredAt,
    resolvedAt: stringOrNull(
      row.resolved_at ?? row.closed_at ?? row.completed_at,
    ),
    channel: stringOrNull(row.channel ?? row.contact_channel),
    agent: stringOrNull(row.agent ?? row.agent_name ?? row.handled_by ?? row.owner),
    eventId: stringOrNull(row.event_id ?? row.eventId),
    evidence: extras?.evidence ? [extras.evidence] : [],
  });
}

export function parseHintInteractions(
  record: Record<string, unknown> | null | undefined,
): DraftInteraction[] {
  if (!record) return [];
  return unwrapInteractionList(
    record.interactions ??
      record.tickets ??
      record.support_tickets ??
      record.call_logs ??
      record.complaints,
  )
    .map((item) => parseInteractionRecord(item, { evidence: "profile_hint" }))
    .filter((item): item is DraftInteraction => Boolean(item));
}

export function isInteractionEvent(event: CustomerEvent): boolean {
  const type = event.event_type.toLowerCase();
  if (EXCLUDED_EVENT_TYPES.has(type)) return false;
  if (INTERACTION_EVENT_TYPES.has(type)) return true;
  if (/ticket|complaint|feedback|inquir|customer_care|care_call|call_log/.test(type)) {
    return true;
  }
  const care = event.interaction;
  if (!care) return false;
  if (care.ticket_id || care.agent || care.subject) return true;
  if (type === "voice_call") {
    return Boolean(care.ticket_id || care.agent || care.kind);
  }
  return false;
}

export function eventToDraft(event: CustomerEvent): DraftInteraction | null {
  if (!isInteractionEvent(event)) return null;
  const care = event.interaction;
  const kind = normalizeKind(care?.kind || event.event_type);
  const subject =
    care?.subject ||
    event.event_type_label ||
    event.description ||
    "Interaction";
  const status = normalizeStatus(
    care?.resolution ||
      (/resolved|closed/.test(event.event_type.toLowerCase())
        ? "resolved"
        : event.status),
  );

  return createDraft({
    ticketId: care?.ticket_id || "",
    kind,
    subject,
    description: event.description || care?.notes || "",
    notes: care?.notes || null,
    status,
    occurredAt: event.occurred_at,
    resolvedAt:
      status === "resolved" || status === "closed" ? event.occurred_at : null,
    channel: event.channel,
    agent: care?.agent ?? null,
    eventId: event.id,
    evidence: ["event"],
  });
}

export function finalizeInteraction(
  draft: DraftInteraction,
): CustomerInteractionItem {
  const verification: CustomerInteractionVerification =
    draft.evidence.has("subscriber_api") || draft.evidence.has("event")
      ? "verified"
      : "hint";
  return {
    id: draftKey(draft),
    ticketId: draft.ticketId || draft.eventId || draftKey(draft),
    kind: draft.kind,
    subject: draft.subject || "Interaction",
    description: draft.description,
    notes: draft.notes,
    status: draft.status,
    occurredAt: draft.occurredAt,
    resolvedAt: draft.resolvedAt,
    channel: draft.channel,
    agent: draft.agent,
    eventId: draft.eventId,
    evidence: Array.from(draft.evidence),
    verification,
  };
}

export function sortInteractions(
  items: CustomerInteractionItem[],
): CustomerInteractionItem[] {
  return [...items].sort((a, b) => {
    const aTime = Date.parse(a.occurredAt || "") || 0;
    const bTime = Date.parse(b.occurredAt || "") || 0;
    if (aTime !== bTime) return bTime - aTime;
    return a.subject.localeCompare(b.subject);
  });
}

export function countInteractions(
  items: CustomerInteractionItem[],
): CustomerInteractionCounts {
  return items.reduce(
    (counts, item) => {
      counts.total += 1;
      if (item.status === "resolved" || item.status === "closed") {
        counts.resolved += 1;
      } else if (item.status === "pending") {
        counts.pending += 1;
        counts.open += 1;
      } else {
        counts.open += 1;
      }
      return counts;
    },
    { ...EMPTY_INTERACTION_COUNTS },
  );
}

export function uniqueInteractionKinds(
  items: CustomerInteractionItem[],
): CustomerInteractionKind[] {
  return Array.from(new Set(items.map((item) => item.kind))).sort();
}

export function uniqueInteractionStatuses(
  items: CustomerInteractionItem[],
): CustomerInteractionStatus[] {
  const present = new Set(items.map((item) => item.status));
  return (
    ["open", "in_progress", "pending", "resolved", "closed"] as CustomerInteractionStatus[]
  ).filter((status) => present.has(status));
}

export function filterInteractions(
  items: CustomerInteractionItem[],
  query: { search?: string; kind?: string; status?: string },
): CustomerInteractionItem[] {
  const search = query.search?.trim().toLowerCase() ?? "";
  const kind = query.kind && query.kind !== "all" ? query.kind : "";
  const status = query.status && query.status !== "all" ? query.status : "";
  return items.filter((item) => {
    if (kind && item.kind !== kind) return false;
    if (status && item.status !== status) return false;
    if (!search) return true;
    return (
      item.ticketId.toLowerCase().includes(search) ||
      item.subject.toLowerCase().includes(search) ||
      item.description.toLowerCase().includes(search) ||
      (item.notes || "").toLowerCase().includes(search) ||
      (item.agent || "").toLowerCase().includes(search)
    );
  });
}

export function latestInteractionAt(
  items: CustomerInteractionItem[],
): string | null {
  return items.reduce<string | null>((latest, item) => {
    if (!item.occurredAt) return latest;
    if (!latest) return item.occurredAt;
    return Date.parse(item.occurredAt) >= Date.parse(latest)
      ? item.occurredAt
      : latest;
  }, null);
}
