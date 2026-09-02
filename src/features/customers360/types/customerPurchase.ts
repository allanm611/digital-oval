/**
 * Customer 360 purchase history — commercial transactions for this subscriber.
 *
 * This tab is a transaction ledger, not:
 *   - Offers (eligibility / redemption intent)
 *   - Communications (order confirmation messages)
 *   - Events (full activity stream, including logins and usage)
 *   - Loyalty (points earned / redeemed)
 *
 * A purchase may be linked to an offer, campaign, or catalog product, but the
 * row represents money or product exchanged, not marketing membership.
 *
 * Resolution:
 *   1. Prefer GET /subscribers/:id/purchases (or /transactions, /orders)
 *   2. Derive from live purchase events only (bundle, recharge, offer
 *      redemption with product/amount). Never use fallback/demo events.
 *   3. Keep profile purchases / transactions / orders hints
 *   4. Enrich product and offer names from the live catalogs
 *
 * Recommended backend contract (when available):
 *   GET /subscribers/:id/purchases
 *   Query: search, status, product_id, offer_id, from, to, limit, offset
 *   Body: { success, data, pagination,
 *           counts: { completed, pending, cancelled, total_spend } }
 */

export type CustomerPurchaseStatus =
  | "completed"
  | "pending"
  | "cancelled"
  | "failed"
  | "refunded";

export type CustomerPurchaseKind =
  | "product"
  | "bundle"
  | "recharge"
  | "offer"
  | "other";

export type CustomerPurchaseEvidence =
  | "subscriber_api"
  | "event"
  | "profile_hint";

export type CustomerPurchaseVerification = "verified" | "hint";

export type CustomerPurchaseLoadPhase = "lookup" | "events" | "catalog";

export interface CustomerPurchaseItem {
  id: string;
  transactionId: string;
  productId: number | null;
  productName: string;
  productCode: string;
  productType: string;
  kind: CustomerPurchaseKind;
  amount: number | null;
  currency: string | null;
  quantity: number | null;
  status: CustomerPurchaseStatus;
  purchasedAt: string | null;
  paymentMethod: string | null;
  channel: string | null;
  offerId: number | null;
  offerName: string | null;
  campaignId: number | null;
  campaignName: string | null;
  eventId: string | null;
  evidence: CustomerPurchaseEvidence[];
  verification: CustomerPurchaseVerification;
}

export interface CustomerPurchaseCounts {
  total: number;
  completed: number;
  pending: number;
  failed: number;
  totalSpend: number;
}

export interface CustomerPurchaseResult {
  purchases: CustomerPurchaseItem[];
  counts: CustomerPurchaseCounts;
  eventCount: number;
  source: "live" | "partial";
  subscriberLookupUsed: boolean;
  eventsLive: boolean;
  warnings: string[];
}

export interface CustomerPurchaseProgress {
  phase: CustomerPurchaseLoadPhase;
  checked: number;
  total: number;
}
