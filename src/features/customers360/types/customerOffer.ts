/**
 * Customer 360 offers — one row per offer, with two independent links:
 *   - received: the customer was delivered this offer (possibly more than once)
 *   - attached: the customer is linked to the reward
 *
 * Status rule: attached => active. Redemptions never replace that status.
 * An offer may be redeemed many times while it stays active.
 *
 * Source of truth:
 *   GET /subscribers/:id/offers keyed by subscriber id.
 *   Buckets: received / attached / redemptions, or a mixed offers list.
 */

import type { CustomerSegmentVia } from "./customerSegment";

/** Active when the customer is attached to the reward. */
export type CustomerOfferStatus = "active" | "inactive";

export type CustomerOfferRelationship = "received" | "attached" | "both";

export type CustomerOfferValidity = "valid" | "expired" | "scheduled" | "unknown";

export type CustomerOfferEvidence =
  | "subscriber_api"
  | "campaign_mapping"
  | "event"
  | "profile_hint";

export type CustomerOfferVerification = "verified" | "hint";

export type CustomerOfferLoadPhase = "audience" | "events" | "catalog";

export type CustomerOfferBucket = "received" | "attached" | "redemption" | "mixed";

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

/** One delivery of the offer to this customer. */
export interface CustomerOfferReceipt {
  id: string;
  receivedAt: string | null;
  channel: string | null;
  campaignId: number | null;
  campaignName: string | null;
  source: string | null;
}

/** One use of the offer. Several of these can exist on the same offer. */
export interface CustomerOfferRedemption {
  id: string;
  redeemedAt: string | null;
  channel: string | null;
  status: string | null;
  campaignId: number | null;
  campaignName: string | null;
}

export interface CustomerOfferItem {
  id: string;
  offerId: number | null;
  name: string;
  code: string;
  type: string;
  description: string;
  /** Active only while the customer is attached to the reward. */
  status: CustomerOfferStatus;
  relationship: CustomerOfferRelationship;
  isAttached: boolean;
  hasReceived: boolean;
  /** Catalog window. Independent of attachment status. */
  validity: CustomerOfferValidity;
  catalogStatus: string | null;
  valueAmount: number | null;
  valuePercent: number | null;
  validFrom: string | null;
  validTo: string | null;
  isReusable: boolean;
  maxUsagePerCustomer: number | null;
  /** Latest known delivery. */
  presentedAt: string | null;
  attachedAt: string | null;
  acceptedAt: string | null;
  /** Latest known redemption. */
  redeemedAt: string | null;
  redemptionCount: number;
  /** True when attachment, validity, reuse, and the usage cap still allow another redemption. */
  canRedeemAgain: boolean;
  lastChannel: string | null;
  attachmentSources: string[];
  receipts: CustomerOfferReceipt[];
  redemptions: CustomerOfferRedemption[];
  viaCampaigns: CustomerOfferCampaignRef[];
  viaSegments: CustomerSegmentVia[];
  relatedEvents: CustomerOfferEventRef[];
  evidence: CustomerOfferEvidence[];
  verification: CustomerOfferVerification;
}

export interface CustomerOfferCounts {
  total: number;
  attached: number;
  received: number;
  both: number;
  active: number;
  inactive: number;
  redemptionEvents: number;
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
