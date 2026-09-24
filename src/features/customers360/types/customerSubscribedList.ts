/**
 * Customer 360 subscribed lists — lists this subscriber belongs to.
 *
 * Source of truth:
 *   GET /subscribers/:id/quicklists
 *   GET /subscribers/:id/quicklist-membership
 */

export type SubscribedListType = "quicklist" | "subscription";

export type SubscribedListVerification = "verified" | "hint";

export type CustomerIdentifierKind = "msisdn" | "email" | "id";

export interface CustomerListIdentifiers {
  msisdns: string[];
  emails: string[];
  ids: string[];
}

export interface CustomerSubscribedList {
  id: string;
  listId: number | string;
  name: string;
  description: string;
  listType: SubscribedListType;
  addedAt: string | null;
  status: string;
  matchedIdentifier: string | null;
  matchedIdentifierType: CustomerIdentifierKind | null;
  totalMembers: number | null;
  verification: SubscribedListVerification;
}

export interface CustomerSubscribedListResult {
  memberships: CustomerSubscribedList[];
  systemQuickListCount: number;
  checkedCount: number;
  failedCheckCount: number;
  identifierCount: number;
  source: "live" | "partial";
  warnings: string[];
}

export interface CustomerSubscribedListProgress {
  checked: number;
  total: number;
}
