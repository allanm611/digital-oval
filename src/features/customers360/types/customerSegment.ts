/**
 * Customer 360 segments — segments this subscriber belongs to.
 *
 * Source of truth:
 *   GET /subscribers/:id/segments
 *   GET /subscribers/:id/segment-membership
 */

import type { CustomerIdentifierKind } from "./customerSubscribedList";

export type CustomerSegmentVerification = "verified" | "hint";

export type CustomerSegmentLoadPhase = "segments" | "campaigns";

export interface CustomerSegmentVia {
  segmentId: number;
  segmentName: string;
}

export interface CustomerSegmentCampaign {
  campaignId: number;
  campaignName: string;
  campaignStatus: string | null;
  campaignType: string | null;
  flowType: string | null;
  offerId: number | null;
  offerName: string | null;
  isActive: boolean | null;
  lastUsed: string | null;
  usageCount: number | null;
  viaSegments: CustomerSegmentVia[];
}

export interface CustomerSegmentMembership {
  id: string;
  segmentId: number;
  name: string;
  code: string | null;
  description: string;
  type: string;
  isActive: boolean;
  addedAt: string | null;
  matchedIdentifier: string | null;
  matchedIdentifierType: CustomerIdentifierKind | null;
  memberCount: number | null;
  verification: CustomerSegmentVerification;
  campaigns: CustomerSegmentCampaign[];
}

export interface CustomerSegmentResult {
  memberships: CustomerSegmentMembership[];
  audienceCampaigns: CustomerSegmentCampaign[];
  systemSegmentCount: number;
  checkedCount: number;
  failedCheckCount: number;
  identifierCount: number;
  source: "live" | "partial";
  reverseLookupUsed: boolean;
  warnings: string[];
}

export interface CustomerSegmentProgress {
  phase: CustomerSegmentLoadPhase;
  checked: number;
  total: number;
}
