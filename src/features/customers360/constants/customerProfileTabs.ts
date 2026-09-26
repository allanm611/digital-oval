import { CUSTOMER_PROFILE_OVERVIEW_TAB } from "../navigation/CustomerProfileEntityLink";

export type CustomerProfileTabId =
  | "overview"
  | "device"
  | "activity"
  | "engagement"
  | "segments"
  | "offers"
  | "subscribedLists"
  | "campaigns"
  | "communications"
  | "purchases"
  | "loyalty"
  | "preferences"
  | "interactions";

/**
 * Identity-first Customer 360 order:
 * profile → accounts/devices → activity and engagement.
 * Tab ids are stable URL values (`?tab=`); do not rename them when reordering.
 */
export const CUSTOMER_PROFILE_TABS: Array<{
  id: CustomerProfileTabId;
  label: string;
}> = [
  { id: "overview", label: "Customer Information" },
  { id: "device", label: "Account & Device" },
  { id: "activity", label: "Events" },
  { id: "subscribedLists", label: "Subscribed Lists" },
  { id: "engagement", label: "Analytics" },
  { id: "segments", label: "Segments" },
  { id: "offers", label: "Offers" },
  { id: "campaigns", label: "Campaigns" },
  { id: "communications", label: "Communications" },
  { id: "purchases", label: "Purchase History" },
  { id: "loyalty", label: "Loyalty & Rewards" },
  { id: "preferences", label: "Preferences" },
  { id: "interactions", label: "Interactions" },
];

export const CUSTOMER_PROFILE_TAB_IDS = new Set(
  CUSTOMER_PROFILE_TABS.map((tab) => tab.id),
);

export const CUSTOMER_PROFILE_TAB_PANEL_ID = "customer-profile-tab-panel";

export function parseCustomerProfileTab(
  value: string | null,
): CustomerProfileTabId {
  if (value && CUSTOMER_PROFILE_TAB_IDS.has(value as CustomerProfileTabId)) {
    return value as CustomerProfileTabId;
  }
  return CUSTOMER_PROFILE_OVERVIEW_TAB as CustomerProfileTabId;
}
