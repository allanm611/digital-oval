import type { CreateOfferRequest } from "../types/offer";

export type OfferChannelRouteKind =
  | "sms"
  | "email"
  | "whatsapp"
  | "ussd"
  | "push";

function classifyChannelToken(value?: string | null): OfferChannelRouteKind | null {
  const name = value?.toUpperCase()?.trim() ?? "";
  if (!name) return null;
  if (name.includes("USSD")) return "ussd";
  if (name.includes("WHATSAPP")) return "whatsapp";
  if (name.includes("PUSH")) return "push";
  if (name.includes("SMS")) return "sms";
  if (name.includes("EMAIL") || name.includes("E-MAIL")) return "email";
  return null;
}

/**
 * Matches Basic Info route dropdown visibility rules.
 * Accepts a channel name, code, or channel object so a code of EMAIL still
 * resolves when the display name is something like "Corporate Mail".
 */
export function resolveCommunicationChannelKind(
  channelName?: string | { name?: string; code?: string } | null,
  channelCode?: string,
): OfferChannelRouteKind | null {
  if (channelName && typeof channelName === "object") {
    return (
      classifyChannelToken(channelName.code) ??
      classifyChannelToken(channelName.name)
    );
  }
  return (
    classifyChannelToken(channelCode) ?? classifyChannelToken(channelName)
  );
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


export function channelKindToRouteType(
  kind: OfferChannelRouteKind | null | undefined,
): "SMS" | "EMAIL" | "WHATSAPP" | "USSD" | "PUSH" | "" {
  switch (kind) {
    case "sms":
      return "SMS";
    case "email":
      return "EMAIL";
    case "whatsapp":
      return "WHATSAPP";
    case "ussd":
      return "USSD";
    case "push":
      return "PUSH";
    default:
      return "";
  }
}

export const CHANNEL_ROUTE_FIELD_META: Record<
  OfferChannelRouteKind,
  { label: string; description: string; errorKey: string; requiredMessage: string }
> = {
  sms: {
    label: "SMS Route",
    description:
      "Route used to send the broadcast message to the customer.",
    errorKey: "sms_route",
    requiredMessage: "SMS route is required",
  },
  email: {
    label: "Email Route",
    description:
      "Route used to send the broadcast message to the customer.",
    errorKey: "email_route",
    requiredMessage: "Email route is required",
  },
  whatsapp: {
    label: "WhatsApp Route",
    description:
      "Route used to send the broadcast message to the customer.",
    errorKey: "whatsapp_route",
    requiredMessage: "WhatsApp route is required",
  },
  ussd: {
    label: "USSD Route",
    description:
      "Route used to send the broadcast message to the customer.",
    errorKey: "ussd_route",
    requiredMessage: "USSD route is required",
  },
  push: {
    label: "Push Notification Route",
    description:
      "Route used to send the broadcast message to the customer.",
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

/** Reset campaign + transactional route fields when the communication channel changes. */
export function clearedOfferRouteFields(): Pick<
  CreateOfferRequest,
  | "route"
  | "sms_route_id"
  | "email_route_id"
  | "whatsapp_route_id"
  | "ussd_route_id"
  | "push_notification_route_id"
  | "transactional_route_id"
> {
  return {
    route: undefined,
    sms_route_id: undefined,
    email_route_id: undefined,
    whatsapp_route_id: undefined,
    ussd_route_id: undefined,
    push_notification_route_id: undefined,
    transactional_route_id: undefined,
  };
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
  channelName?: string | { name?: string; code?: string } | null,
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
