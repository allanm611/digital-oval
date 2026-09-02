/**
 * Customer 360 offers — offers available to this customer, or redeemed by them.
 *
 * An offer is a catalog item. Customers do not "belong" to offers the way they
 * belong to segments or lists. Availability is derived from the live CVM graph:
 *
 *   segment membership → campaign flow → offer
 *
 * Redemption is derived from the live event stream (`offer_redeemed` /
 * `offer_accepted`), not from the offer catalog status.
 *
 * Resolution:
 *   1. Prefer GET /subscribers/:id/offers (and /redemptions) when those exist
 *   2. Derive available offers from this customer's segment→campaign mappings
 *   3. Confirm redemptions from live customer events only (never fallback events)
 *   4. Keep profile `offers` hints when they cannot be confirmed
 *   5. Enrich each offer from the live offer catalog
 *
 * Recommended backend contract (when available):
 *   GET /subscribers/:id/offers
 *   Query: search, status, type, limit, offset
 *   Body: { success, data, pagination, counts: { available, redeemed, accepted } }
 */

import type { CustomerSegmentVia } from "./customerSegment";

export type CustomerOfferState =
  | "available"
  | "redeemed"
  | "accepted"
  | "expired"
  | "inactive";

export type CustomerOfferEvidence =
  | "subscriber_api"
  | "campaign_mapping"
  | "event"
  | "profile_hint";

export type CustomerOfferVerification = "verified" | "hint";

export type CustomerOfferLoadPhase = "audience" | "events" | "catalog";

export interface CustomerOfferCampaignRef {
  campaignId: number;
  campaignName: string;
  campaignStatus: string | null;
  isActive: boolean | null;
}

export interface CustomerOfferEventRef {
  eventId: string;
  eventType: string;
  eventTypeLabel: string;
  occurredAt: string;
  channel: string;
  status: string;
}

export interface CustomerOfferItem {
  id: string;
  offerId: number | null;
  name: string;
  code: string;
  type: string;
  description: string;
  /** Customer-facing state: available vs redeemed, not catalog lifecycle. */
  state: CustomerOfferState;
  /** Catalog / lifecycle status from the offer record. */
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
  viaCampaigns: CustomerOfferCampaignRef[];
  viaSegments: CustomerSegmentVia[];
  relatedEvents: CustomerOfferEventRef[];
  evidence: CustomerOfferEvidence[];
  verification: CustomerOfferVerification;
}

export interface CustomerOfferCounts {
  total: number;
  available: number;
  redeemed: number;
  accepted: number;
  expired: number;
  inactive: number;
}

export interface CustomerOfferResult {
  offers: CustomerOfferItem[];
  counts: CustomerOfferCounts;
  campaignCount: number;
  segmentCount: number;
  eventCount: number;
  source: "live" | "partial";
  subscriberLookupUsed: boolean;
  eventsLive: boolean;
  warnings: string[];
}

export interface CustomerOfferProgress {
  phase: CustomerOfferLoadPhase;
  checked: number;
  total: number;
}
