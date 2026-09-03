/**
 * Customer 360 loyalty & rewards — points account and reward ledger
 * for this subscriber.
 *
 * This tab is a loyalty ledger, not:
 *   - Offers (catalog eligibility / offer redemption)
 *   - Purchases (money or product exchanged)
 *   - Communications (messages about rewards)
 *   - Events (full activity stream)
 *   - Manual Rewards admin (operator batches — only subscriber-scoped
 *     grants for this customer)
 *
 * A row is points earned, redeemed, granted, expired, or a tier change.
 * offer_redeemed is included only when the event carries points or a
 * loyalty reward type.
 *
 * Resolution:
 *   1. Prefer GET /subscribers/:id/loyalty (or /points, /rewards, history)
 *   2. Derive activity from live loyalty events only. Never use
 *      fallback/demo events. Never scan the manual-reward or offer catalogs.
 *   3. Keep profile loyalty / points / tier hints
 *   4. Enrich linked offer names from the live offer catalog
 *
 * Recommended backend contract (when available):
 *   GET /subscribers/:id/loyalty
 *   Query: search, kind, status, from, to, limit, offset
 *   Body: { success, data: { account, history }, pagination,
 *           counts: { earned, redeemed, balance } }
 */

export type CustomerLoyaltyProgramStatus =
  | "active"
  | "inactive"
  | "pending"
  | "unknown";

export type CustomerLoyaltyKind =
  | "earn"
  | "redeem"
  | "grant"
  | "expire"
  | "adjust"
  | "tier_change";

export type CustomerLoyaltyStatus =
  | "completed"
  | "pending"
  | "failed"
  | "cancelled";

export type CustomerLoyaltyEvidence =
  | "subscriber_api"
  | "event"
  | "profile_hint";

export type CustomerLoyaltyVerification = "verified" | "hint";

export type CustomerLoyaltyLoadPhase = "lookup" | "events" | "catalog";

export interface CustomerLoyaltyAccount {
  programName: string | null;
  status: CustomerLoyaltyProgramStatus;
  tier: string | null;
  tierBenefits: string[];
  pointsBalance: number | null;
  pointsEarned: number | null;
  pointsRedeemed: number | null;
  balanceEstimated: boolean;
  enrolledAt: string | null;
  evidence: CustomerLoyaltyEvidence[];
  verification: CustomerLoyaltyVerification;
}

export interface CustomerLoyaltyItem {
  id: string;
  name: string;
  kind: CustomerLoyaltyKind;
  points: number | null;
  pointsBalanceAfter: number | null;
  status: CustomerLoyaltyStatus;
  occurredAt: string | null;
  rewardType: string | null;
  channel: string | null;
  offerId: number | null;
  offerName: string | null;
  campaignId: number | null;
  campaignName: string | null;
  manualRewardId: number | null;
  eventId: string | null;
  evidence: CustomerLoyaltyEvidence[];
  verification: CustomerLoyaltyVerification;
}

export interface CustomerLoyaltyCounts {
  total: number;
  earned: number;
  redeemed: number;
  granted: number;
  pointsEarned: number;
  pointsRedeemed: number;
}

export interface CustomerLoyaltyResult {
  account: CustomerLoyaltyAccount;
  activities: CustomerLoyaltyItem[];
  counts: CustomerLoyaltyCounts;
  eventCount: number;
  source: "live" | "partial";
  subscriberLookupUsed: boolean;
  eventsLive: boolean;
  warnings: string[];
}

export interface CustomerLoyaltyProgress {
  phase: CustomerLoyaltyLoadPhase;
  checked: number;
  total: number;
}
