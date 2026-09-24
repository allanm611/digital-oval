/**
 * Customer 360 offers — offers available to this customer, or redeemed by them.
 *
 * Source of truth:
 *   GET /subscribers/:id/offers keyed by subscriber id.
 *
 * Query: subscriber_id, identifier, identifier_type, msisdn, email, skipCache
 * Body: { success, data, pagination }
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
