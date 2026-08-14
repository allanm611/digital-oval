import type { CreateOfferRequest } from "../types/offer";

export type OfferChannelRouteKind =
  | "sms"
  | "email"
  | "whatsapp"
  | "ussd"
  | "push";

/** Matches Basic Info route dropdown visibility rules. */
export function resolveCommunicationChannelKind(
  channelName?: string,
): OfferChannelRouteKind | null {
  const name = channelName?.toUpperCase()?.trim() ?? "";
  if (!name) return null;
  if (name.includes("USSD")) return "ussd";
  if (name.includes("WHATSAPP")) return "whatsapp";
  if (name.includes("PUSH")) return "push";
  if (name.includes("SMS")) return "sms";
  if (name === "EMAIL" || name.includes("EMAIL")) return "email";
  return null;
}

type RouteFieldSlice = Pick<
  CreateOfferRequest,
  | "route"
  | "sms_route_id"
  | "email_route_id"
  | "whatsapp_route_id"
  | "ussd_route_id"
  | "push_notification_route_id"
  | "transactional_route_id"
>;

export const CHANNEL_ROUTE_FIELD_META: Record<
  OfferChannelRouteKind,
  { label: string; description: string; errorKey: string; requiredMessage: string }
> = {
  sms: {
    label: "SMS Route",
    description:
      "Route used to send the offer campaign message to the customer.",
    errorKey: "sms_route",
    requiredMessage: "SMS route is required",
  },
  email: {
    label: "Email Route",
    description:
      "Route used to send the offer campaign message to the customer.",
    errorKey: "email_route",
    requiredMessage: "Email route is required",
  },
  whatsapp: {
    label: "WhatsApp Route",
    description:
      "Route used to send the offer campaign message to the customer.",
    errorKey: "whatsapp_route",
    requiredMessage: "WhatsApp route is required",
  },
  ussd: {
    label: "USSD Route",
    description:
      "Route used to send the offer campaign message to the customer.",
    errorKey: "ussd_route",
    requiredMessage: "USSD route is required",
  },
  push: {
    label: "Push Notification Route",
    description:
      "Route used to send the offer campaign message to the customer.",
    errorKey: "push_route",
    requiredMessage: "Push notification route is required",
  },
};

export const TRANSACTIONAL_ROUTE_FIELD_META = {
  label: "Transactional Route",
  description:
    "Route over which the transactional success or failure message will be sent.",
  errorKey: "transactional_route",
  requiredMessage: "Transactional route is required",
} as const;

function legacyRouteId(route: string | number | undefined): number | undefined {
  if (route === undefined || route === null || route === "") return undefined;
  const n = Number(route);
  return Number.isFinite(n) ? n : undefined;
}

/** Copy legacy `route` into the typed `*_route_id` field when API omits it (common on edit). */
export function hydrateOfferRouteFields(
  fields: RouteFieldSlice,
  channelKind: OfferChannelRouteKind | null,
): RouteFieldSlice {
  const legacy = legacyRouteId(fields.route);
  if (legacy == null || !channelKind) return fields;

  const next = { ...fields };
  switch (channelKind) {
    case "sms":
      if (!next.sms_route_id) next.sms_route_id = legacy;
      break;
    case "email":
      if (!next.email_route_id) next.email_route_id = legacy;
      break;
    case "whatsapp":
      if (!next.whatsapp_route_id) next.whatsapp_route_id = legacy;
      break;
    case "ussd":
      if (!next.ussd_route_id) next.ussd_route_id = legacy;
      break;
    case "push":
      if (!next.push_notification_route_id) {
        next.push_notification_route_id = legacy;
      }
      break;
    default:
      break;
  }
  return next;
}

export function getEffectiveRouteIdForChannel(
  fields: RouteFieldSlice,
  channelKind: OfferChannelRouteKind,
): number | undefined {
  switch (channelKind) {
    case "sms":
      return fields.sms_route_id ?? legacyRouteId(fields.route);
    case "email":
      return fields.email_route_id ?? legacyRouteId(fields.route);
    case "whatsapp":
      return fields.whatsapp_route_id ?? legacyRouteId(fields.route);
    case "ussd":
      return fields.ussd_route_id ?? legacyRouteId(fields.route);
    case "push":
      return (
        fields.push_notification_route_id ?? legacyRouteId(fields.route)
      );
    default:
      return undefined;
  }
}

export function collectOfferRouteValidationErrors(
  formData: RouteFieldSlice,
  channelName?: string,
): Record<string, string> {
  const errors: Record<string, string> = {};
  const kind = resolveCommunicationChannelKind(channelName);
  if (!kind) return errors;

  const routeId = getEffectiveRouteIdForChannel(formData, kind);
  if (routeId == null) {
    const meta = CHANNEL_ROUTE_FIELD_META[kind];
    errors[meta.errorKey] = meta.requiredMessage;
  }

  if (formData.transactional_route_id == null) {
    errors[TRANSACTIONAL_ROUTE_FIELD_META.errorKey] =
      TRANSACTIONAL_ROUTE_FIELD_META.requiredMessage;
  }

  return errors;
}
