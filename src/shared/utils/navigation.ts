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

/** Explicit return path for BackButton (e.g. Customer 360 tab → entity details). */
export type ReturnToLocation = {
  pathname: string;
  search?: string;
  hash?: string;
  state?: unknown;
  parentLabel?: string;
  fromModal?: boolean;
  catalogId?: number | string;
  section?: string;
};

export function getReturnToFromState(
  locationState: unknown,
): ReturnToLocation | null {
  if (!locationState || typeof locationState !== "object") return null;
  const returnTo = (locationState as { returnTo?: unknown }).returnTo;
  if (!returnTo || typeof returnTo !== "object") return null;
  const pathname = (returnTo as ReturnToLocation).pathname;
  if (!pathname || typeof pathname !== "string") return null;
  return returnTo as ReturnToLocation;
}

export function navigateToReturnTo(
  navigate: NavigateFunction,
  returnTo: ReturnToLocation,
): void {
  const nextState: Record<string, unknown> = {
    ...((returnTo.state && typeof returnTo.state === "object"
      ? (returnTo.state as Record<string, unknown>)
      : {})),
  };
  if (returnTo.fromModal) nextState.fromModal = true;
  if (returnTo.catalogId != null) nextState.catalogId = returnTo.catalogId;
  if (returnTo.section) nextState.focusSection = returnTo.section;

  const search = normalizeSearch(returnTo.search);
  navigate(
    {
      pathname: returnTo.pathname,
      search,
      hash: returnTo.hash || "",
    },
    {
      replace: true,
      state: Object.keys(nextState).length > 0 ? nextState : undefined,
    },
  );
}

export const C360_RETURN_PARAM = "c360";
const C360_PENDING_STORAGE_KEY = "c360:pendingReturn";

function normalizeSearch(search?: string): string {
  if (!search) return "";
  return search.startsWith("?") ? search : `?${search}`;
}

export function splitHref(href: string): {
  pathname: string;
  search: string;
  hash: string;
} {
  const hashIndex = href.indexOf("#");
  const hash = hashIndex >= 0 ? href.slice(hashIndex) : "";
  const withoutHash = hashIndex >= 0 ? href.slice(0, hashIndex) : href;
  const queryIndex = withoutHash.indexOf("?");
  return {
    pathname: queryIndex >= 0 ? withoutHash.slice(0, queryIndex) : withoutHash,
    search: queryIndex >= 0 ? withoutHash.slice(queryIndex) : "",
    hash,
  };
}

export function hrefFromReturnTo(returnTo: ReturnToLocation): string {
  return `${returnTo.pathname}${normalizeSearch(returnTo.search)}${returnTo.hash || ""}`;
}

export function parseC360ReturnParam(search: string): ReturnToLocation | null {
  const params = new URLSearchParams(
    search.startsWith("?") ? search.slice(1) : search,
  );
  const raw = params.get(C360_RETURN_PARAM);
  if (!raw) return null;
  const href = raw.startsWith("/") ? raw : `/${raw}`;
  if (!href.startsWith("/dashboard/customers/details/")) return null;
  const parts = splitHref(href);
  return {
    ...parts,
    parentLabel: "Customer Details",
  };
}

export function getResolvedReturnTo(location: {
  search: string;
  state: unknown;
}): ReturnToLocation | null {
  // Immediate parent (campaign → offer) lives in state. The durable Customer 360
  // `c360` query is the fallback when that state was dropped.
  return getReturnToFromState(location.state) || parseC360ReturnParam(location.search);
}

export function locationAsReturnTo(
  location: { pathname: string; search?: string; hash?: string },
  extras?: Partial<ReturnToLocation>,
): ReturnToLocation {
  return {
    pathname: location.pathname,
    search: location.search || "",
    hash: location.hash || "",
    ...extras,
  };
}

export function navigatePreservingReturn(
  navigate: NavigateFunction,
  to: To,
  location: { pathname: string; search: string; hash?: string },
  parentLabel?: string,
): void {
  const originC360 = parseC360ReturnParam(location.search);
  navigate(originC360 ? appendC360ReturnTo(to, hrefFromReturnTo(originC360)) : to, {
    state: {
      returnTo: locationAsReturnTo(location, { parentLabel }),
    },
  });
}

export function appendC360ReturnTo(to: To, returnHref: string): To {
  const apply = (pathname: string, search: string, hash = "") => {
    const params = new URLSearchParams(
      search.startsWith("?") ? search.slice(1) : search,
    );
    params.set(C360_RETURN_PARAM, returnHref);
    const nextSearch = params.toString();
    return {
      pathname,
      search: nextSearch ? `?${nextSearch}` : "",
      hash,
    };
  };

  if (typeof to === "number") return to;
  if (typeof to === "string") {
    const parts = splitHref(to);
    const next = apply(parts.pathname, parts.search, parts.hash);
    return `${next.pathname}${next.search}${next.hash}`;
  }
  const next = apply(to.pathname || "", to.search || "", to.hash || "");
  return { ...to, ...next };
}

const PENDING_RETURN_TTL_MS = 30 * 60 * 1000;

export function writePendingCustomerReturn(payload: {
  customerId: string;
  tab: string;
  href: string;
}) {
  try {
    sessionStorage.setItem(
      C360_PENDING_STORAGE_KEY,
      JSON.stringify({ ...payload, savedAt: Date.now() }),
    );
  } catch {
    // Ignore quota / private-mode failures.
  }
}

export function consumePendingCustomerReturn(
  customerId: string,
): { tab: string } | null {
  try {
    const raw = sessionStorage.getItem(C360_PENDING_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as {
      customerId?: string;
      tab?: string;
      savedAt?: number;
    };
    if (String(parsed.customerId) !== String(customerId)) return null;
    sessionStorage.removeItem(C360_PENDING_STORAGE_KEY);
    if (
      typeof parsed.savedAt === "number" &&
      Date.now() - parsed.savedAt > PENDING_RETURN_TTL_MS
    ) {
      return null;
    }
    if (!parsed.tab) return null;
    return { tab: parsed.tab };
  } catch {
    return null;
  }
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
