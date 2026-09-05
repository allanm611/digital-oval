import { createContext, useContext, useMemo, type ReactNode } from "react";
import { Link, useLocation, type LinkProps } from "react-router-dom";
import {
  appendC360ReturnTo,
  splitHref,
  writePendingCustomerReturn,
} from "../../../shared/utils/navigation";

export const CUSTOMER_PROFILE_TAB_PARAM = "tab";
export const CUSTOMER_PROFILE_OVERVIEW_TAB = "overview";

export function buildCustomerDetailsLocation(
  customerId: string | number,
  tab?: string | null,
): { pathname: string; search: string } {
  const pathname = `/dashboard/customers/details/${customerId}`;
  if (!tab || tab === CUSTOMER_PROFILE_OVERVIEW_TAB) {
    return { pathname, search: "" };
  }
  return {
    pathname,
    search: `?${CUSTOMER_PROFILE_TAB_PARAM}=${encodeURIComponent(tab)}`,
  };
}

export function customerReturnHref(
  pathname: string,
  search: string,
  tab?: string | null,
): string {
  const params = new URLSearchParams(
    search.startsWith("?") ? search.slice(1) : search,
  );
  if (!tab || tab === CUSTOMER_PROFILE_OVERVIEW_TAB) {
    params.delete(CUSTOMER_PROFILE_TAB_PARAM);
  } else {
    params.set(CUSTOMER_PROFILE_TAB_PARAM, tab);
  }
  const nextSearch = params.toString();
  return `${pathname}${nextSearch ? `?${nextSearch}` : ""}`;
}

type CustomerProfileNavigationValue = {
  customerId: string | number | null;
  tab: string;
};

const CustomerProfileNavigationContext =
  createContext<CustomerProfileNavigationValue | null>(null);

export function CustomerProfileNavigationProvider({
  customerId,
  tab,
  children,
}: {
  customerId?: string | number | null;
  tab: string;
  children: ReactNode;
}) {
  const value = useMemo(
    () => ({
      customerId: customerId ?? null,
      tab,
    }),
    [customerId, tab],
  );

  return (
    <CustomerProfileNavigationContext.Provider value={value}>
      {children}
    </CustomerProfileNavigationContext.Provider>
  );
}

export function useCustomerProfileNavigation() {
  return useContext(CustomerProfileNavigationContext);
}

/**
 * Links from Customer 360 tables carry the current profile URL (including
 * ?tab=) both as location.state and as a durable `c360` query param.
 */
export default function CustomerProfileEntityLink({
  state,
  to,
  onClick,
  ...props
}: LinkProps) {
  const location = useLocation();
  const navigation = useCustomerProfileNavigation();
  const detailsMatch = location.pathname.match(
    /\/customers\/details\/([^/]+)/,
  );
  const tab =
    navigation?.tab ||
    new URLSearchParams(
      location.search.startsWith("?") ? location.search.slice(1) : location.search,
    ).get(CUSTOMER_PROFILE_TAB_PARAM) ||
    CUSTOMER_PROFILE_OVERVIEW_TAB;
  const customerId = navigation?.customerId ?? detailsMatch?.[1] ?? null;
  const returnHref = detailsMatch
    ? customerReturnHref(location.pathname, location.search, tab)
    : null;
  const mergedTo = returnHref ? appendC360ReturnTo(to, returnHref) : to;
  const mergedState = returnHref
    ? {
        ...(state && typeof state === "object" ? state : {}),
        returnTo: {
          ...splitHref(returnHref),
          parentLabel: "Customer Details",
        },
      }
    : state;

  return (
    <Link
      {...props}
      to={mergedTo}
      state={mergedState}
      onClick={(event) => {
        if (customerId && returnHref) {
          writePendingCustomerReturn({
            customerId: String(customerId),
            tab,
            href: returnHref,
          });
        }
        onClick?.(event);
      }}
    />
  );
}
