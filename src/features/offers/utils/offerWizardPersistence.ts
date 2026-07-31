import type { CreateOfferRequest, UpdateOfferRequest } from "../types/offer";
import type { OfferReward } from "../types/offerReward";
import {
  getEffectiveRouteIdForChannel,
  resolveCommunicationChannelKind,
  type OfferChannelRouteKind,
} from "./offerChannelRoute";

export const OFFER_WIZARD_METADATA_VERSION = 1 as const;

export interface OfferWizardMetadata {
  wizard_version?: number;
  rewards?: OfferReward[];
  tracking_sources?: unknown[];
  /** UI-only: persisted when API accepts only `route` */
  channel_route_id?: number;
  channel_route_kind?: OfferChannelRouteKind;
}

/** Fields the database-service offers API accepts for routing (see Joi/schema). */
export type OfferRouteApiFields = Pick<
  CreateOfferRequest,
  "route" | "communication_channel_id"
>;

export function buildOfferRouteApiFields(
  formData: Pick<
    CreateOfferRequest,
    | "route"
    | "sms_route_id"
    | "email_route_id"
    | "whatsapp_route_id"
    | "ussd_route_id"
    | "push_notification_route_id"
    | "communication_channel_id"
  >,
  channelName?: string,
): OfferRouteApiFields {
  const kind = resolveCommunicationChannelKind(channelName);
  const effectiveRoute =
    kind != null ? getEffectiveRouteIdForChannel(formData, kind) : undefined;

  const payload: OfferRouteApiFields = {};

  if (formData.communication_channel_id != null) {
    payload.communication_channel_id = formData.communication_channel_id;
  }
  if (effectiveRoute != null) {
    payload.route = effectiveRoute;
  } else if (formData.route != null && formData.route !== "") {
    payload.route = formData.route;
  }

  return payload;
}

export function getWizardChannelRouteSnapshot(
  formData: Pick<
    CreateOfferRequest,
    | "route"
    | "sms_route_id"
    | "email_route_id"
    | "whatsapp_route_id"
    | "ussd_route_id"
    | "push_notification_route_id"
  >,
  channelName?: string,
): Pick<OfferWizardMetadata, "channel_route_id" | "channel_route_kind"> {
  const kind = resolveCommunicationChannelKind(channelName);
  if (!kind) return {};
  const id = getEffectiveRouteIdForChannel(formData, kind);
  if (id == null) return { channel_route_kind: kind };
  return { channel_route_id: id, channel_route_kind: kind };
}

export function mergeOfferWizardMetadata(
  existingMetadata: object | undefined,
  rewards: OfferReward[],
  trackingSources: unknown[],
  routeSnapshot?: Pick<
    OfferWizardMetadata,
    "channel_route_id" | "channel_route_kind"
  >,
): OfferWizardMetadata {
  const base =
    existingMetadata && typeof existingMetadata === "object"
      ? { ...(existingMetadata as OfferWizardMetadata) }
      : {};

  return {
    ...base,
    wizard_version: OFFER_WIZARD_METADATA_VERSION,
    rewards,
    tracking_sources: trackingSources,
    ...routeSnapshot,
  };
}

export function parseOfferWizardMetadata(metadata: unknown): {
  rewards: OfferReward[];
  trackingSources: unknown[];
  channelRouteId?: number;
  channelRouteKind?: OfferChannelRouteKind;
} {
  if (!metadata || typeof metadata !== "object") {
    return { rewards: [], trackingSources: [] };
  }
  const m = metadata as OfferWizardMetadata;
  return {
    rewards: Array.isArray(m.rewards) ? m.rewards : [],
    trackingSources: Array.isArray(m.tracking_sources)
      ? m.tracking_sources
      : [],
    channelRouteId:
      typeof m.channel_route_id === "number"
        ? m.channel_route_id
        : undefined,
    channelRouteKind: m.channel_route_kind,
  };
}

/** Sets typed route id and legacy `route` when user picks a channel route. */
export function withChannelRouteSelected(
  formData: CreateOfferRequest,
  routeId: number,
  kind: OfferChannelRouteKind,
): CreateOfferRequest {
  const next = { ...formData, route: routeId };
  switch (kind) {
    case "sms":
      return { ...next, sms_route_id: routeId };
    case "email":
      return { ...next, email_route_id: routeId };
    case "whatsapp":
      return { ...next, whatsapp_route_id: routeId };
    case "ussd":
      return { ...next, ussd_route_id: routeId };
    case "push":
      return { ...next, push_notification_route_id: routeId };
    default:
      return next;
  }
}

export function buildOfferCreatePayload(
  formData: CreateOfferRequest,
  options: {
    channelName?: string;
    rewards: OfferReward[];
    trackingSources: unknown[];
  },
): CreateOfferRequest {
  const {
    description,
    offer_type,
    sms_route_id: _sms,
    email_route_id: _email,
    whatsapp_route_id: _wa,
    ussd_route_id: _ussd,
    push_notification_route_id: _push,
    route: _legacyRoute,
    communication_channel_id: _channelId,
    metadata: _metadata,
    ...core
  } = formData;

  const routePayload = buildOfferRouteApiFields(formData, options.channelName);
  const routeSnapshot = getWizardChannelRouteSnapshot(
    formData,
    options.channelName,
  );

  return {
    ...core,
    ...(description?.trim() ? { description: description.trim() } : {}),
    ...routePayload,
    metadata: mergeOfferWizardMetadata(
      formData.metadata,
      options.rewards,
      options.trackingSources,
      routeSnapshot,
    ),
  };
}

export function buildOfferUpdatePayload(
  formData: CreateOfferRequest,
  options: {
    channelName?: string;
    rewards: OfferReward[];
    trackingSources: unknown[];
    updatedBy?: number;
  },
): UpdateOfferRequest {
  const createShape = buildOfferCreatePayload(formData, options);
  const { offer_type: _ot, ...updateFields } = createShape;

  return {
    ...updateFields,
    ...(options.updatedBy != null ? { updated_by: options.updatedBy } : {}),
  };
}
