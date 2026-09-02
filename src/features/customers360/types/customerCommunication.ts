/**
 * Customer 360 communications — outbound messages actually sent to this
 * customer across channels.
 *
 * This tab is a delivery ledger, not:
 *   - Events (full activity stream, including logins and redemptions)
 *   - Campaigns (audience membership)
 *   - Offers (eligibility / redemption)
 *   - Preferences (opt-in / DND — separate tab)
 *
 * Resolution:
 *   1. Prefer GET /subscribers/:id/communications (or /messages)
 *   2. Match communication logs and campaign broadcast delivery logs
 *      against this customer's phone / email / IDs
 *   3. Include live outbound events only (never fallback/demo events)
 *   4. Keep profile communication hints when they cannot be confirmed
 *
 * Recommended backend contract (when available):
 *   GET /subscribers/:id/communications
 *   Query: search, channel, status, origin, from, to, limit, offset
 *   Body: { success, data, pagination, counts: { sent, delivered, failed } }
 */

import type { CustomerIdentifierKind } from "./customerSubscribedList";

export type CustomerCommunicationChannel =
  | "email"
  | "sms"
  | "push"
  | "whatsapp"
  | "ussd"
  | "app"
  | "voice"
  | "other";

export type CustomerCommunicationStatus =
  | "pending"
  | "sent"
  | "delivered"
  | "opened"
  | "clicked"
  | "read"
  | "failed"
  | "bounced";

export type CustomerCommunicationOrigin =
  | "campaign"
  | "manual"
  | "system"
  | "unknown";

export type CustomerCommunicationEvidence =
  | "subscriber_api"
  | "delivery_log"
  | "event"
  | "profile_hint";

export type CustomerCommunicationVerification = "verified" | "hint";

export type CustomerCommunicationLoadPhase =
  | "lookup"
  | "logs"
  | "broadcasts"
  | "events";

export interface CustomerCommunicationItem {
  id: string;
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
  evidence: CustomerCommunicationEvidence[];
  verification: CustomerCommunicationVerification;
}

export interface CustomerCommunicationCounts {
  total: number;
  delivered: number;
  failed: number;
  pending: number;
}

export interface CustomerCommunicationResult {
  communications: CustomerCommunicationItem[];
  counts: CustomerCommunicationCounts;
  campaignCount: number;
  broadcastCount: number;
  eventCount: number;
  source: "live" | "partial";
  subscriberLookupUsed: boolean;
  eventsLive: boolean;
  warnings: string[];
}

export interface CustomerCommunicationProgress {
  phase: CustomerCommunicationLoadPhase;
  checked: number;
  total: number;
}
