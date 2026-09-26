/**
 * Customer 360 interactions — support tickets, care calls, complaints,
 * and other direct contacts for this subscriber.
 *
 * This tab is a care ledger, not:
 *   - Events (full activity stream, including billed usage)
 *   - Communications (outbound campaign / system messages)
 *   - Purchases, offers, or loyalty
 *   - Preferences / DND (consent)
 *
 * `voice_call` usage events stay on Events unless they carry care context
 * (ticket, agent, complaint). Dummy ticket IDs are never used as truth.
 *
 * Resolution:
 *   1. Prefer GET /subscribers/:id/interactions (or /tickets, /call-logs)
 *   2. Derive from live care events only (never fallback/demo events)
 *   3. Keep profile tickets / interactions / complaints hints
 *   4. Never scan a global ticket catalog
 *
 * Recommended backend contract (when available):
 *   GET /subscribers/:id/interactions
 *   Query: search, type, status, from, to, limit, offset
 *   Body: { success, data, pagination,
 *           counts: { open, in_progress, resolved } }
 */

export type CustomerInteractionKind =
  | "ticket"
  | "call"
  | "complaint"
  | "feedback"
  | "inquiry"
  | "other";

export type CustomerInteractionStatus =
  | "open"
  | "in_progress"
  | "pending"
  | "resolved"
  | "closed";

export type CustomerInteractionEvidence =
  | "subscriber_api"
  | "event"
  | "profile_hint";

export type CustomerInteractionVerification = "verified" | "hint";

export type CustomerInteractionLoadPhase = "lookup" | "events";

export interface CustomerInteractionItem {
  id: string;
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
  evidence: CustomerInteractionEvidence[];
  verification: CustomerInteractionVerification;
}

export interface CustomerInteractionCounts {
  total: number;
  open: number;
  resolved: number;
  pending: number;
}

export interface CustomerInteractionResult {
  interactions: CustomerInteractionItem[];
  counts: CustomerInteractionCounts;
  eventCount: number;
  source: "live" | "partial";
  subscriberLookupUsed: boolean;
  eventsLive: boolean;
  warnings: string[];
}

export interface CustomerInteractionProgress {
  phase: CustomerInteractionLoadPhase;
  checked: number;
  total: number;
}
