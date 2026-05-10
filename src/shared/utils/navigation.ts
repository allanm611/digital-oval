import { NavigateFunction, NavigateOptions, To } from "react-router-dom";

/**
 * Determines whether the router has any previous entries to navigate back to.
 * React Router stores the current index on `window.history.state.idx`.
 */
export function hasNavigationHistory(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  const historyState = window.history?.state as { idx?: number } | null;
  return typeof historyState?.idx === "number" && historyState.idx > 0;
}

/**
 * Attempts to navigate back using the router history.
 * Falls back to the provided destination when no history entries are available.
 */
export function navigateBackOrFallback(
  navigate: NavigateFunction,
  fallbackTo: To,
  options?: NavigateOptions
): void {
  if (hasNavigationHistory()) {
    navigate(-1);
    return;
  }

  navigate(fallbackTo, options);
}

/**
 * Centralized URL builder for all searchable entity types.
 * Single source of truth for navigation paths.
 */
export function getEntityUrl(
  type:
    | "campaign"
    | "offer"
    | "product"
    | "segment"
    | "program"
    | "user"
    | "configuration"
    | "offer-catalog"
    | "product-catalog"
    | "segment-catalog"
    | "campaign-catalog"
    | "quicklist"
    | "control-group"
    | "customer"
    | "kpi"
    | "role",
  id: string | number,
): string {
  switch (type) {
    case "campaign":
      return `/dashboard/campaigns/${id}`;
    case "offer":
      return `/dashboard/offers/${id}`;
    case "product":
      return `/dashboard/products/${id}`;
    case "segment":
      return `/dashboard/segments/${id}`;
    case "program":
      return `/dashboard/programs/${id}`;
    case "user":
      return `/dashboard/user-management/${id}`;
    case "configuration":
      return `/dashboard/configurations/${id}`;
    case "offer-catalog":
      return `/dashboard/offer-catalogs`;
    case "product-catalog":
      return `/dashboard/products/catalogs`;
    case "segment-catalog":
      return `/dashboard/segment-catalogs`;
    case "campaign-catalog":
      return `/dashboard/campaign-catalogs`;
    case "quicklist":
      return `/dashboard/quicklists/${id}`;
    case "control-group":
      return `/dashboard/control-groups/${id}`;
    case "customer":
      return `/dashboard/customers/details/${id}`;
    case "kpi":
      return `/dashboard/kpis/usage-metrics/${id}`;
    case "role":
      return `/dashboard/roles`;
    default:
      return "/dashboard";
  }
}
