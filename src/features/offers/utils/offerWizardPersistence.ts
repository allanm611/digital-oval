import type { CreateOfferRequest, UpdateOfferRequest } from "../types/offer";
import type { OfferReward } from "../types/offerReward";
import type { OfferTrackingSource } from "../types/offerTrackingSource";
import {
  getEffectiveRouteIdForChannel,
  resolveCommunicationChannelKind,
  type OfferChannelRouteKind,
} from "./offerChannelRoute";
import { normalizeOfferRewardsWithTracking } from "./normalizeOfferWizardBindings";

export const OFFER_WIZARD_METADATA_VERSION = 2 as const;

export interface OfferWizardMetadata {
  wizard_version?: number;
  /** Wizard reward configurations (authoritative for the create/edit UI) */
  rewards?: OfferReward[];
  /**
   * Alias for backend readers / JSONB column `reward_configuration`.
   * Kept in sync with `rewards` so create + update stay aligned.
   */
  reward_configuration?: OfferReward[];
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

  const sources = Array.isArray(trackingSources)
    ? (trackingSources as OfferTrackingSource[])
    : [];
  const { rewards: normalizedRewards } = normalizeOfferRewardsWithTracking(
    rewards,
    sources,
  );

  return {
    ...base,
    wizard_version: OFFER_WIZARD_METADATA_VERSION,
    rewards: normalizedRewards,
    // Dual-write so backend column / virtual field readers stay in sync
    reward_configuration: normalizedRewards,
    tracking_sources: trackingSources,
    ...routeSnapshot,
  };
}

function coerceRewardList(value: unknown): OfferReward[] {
  return Array.isArray(value) ? (value as OfferReward[]) : [];
}

export function parseOfferWizardMetadata(
  metadata: unknown,
  fallbacks?: {
    trackingSources?: unknown;
    rewardConfiguration?: unknown;
  },
): {
  rewards: OfferReward[];
  trackingSources: unknown[];
  channelRouteId?: number;
  channelRouteKind?: OfferChannelRouteKind;
} {
  const empty = { rewards: [] as OfferReward[], trackingSources: [] as unknown[] };
  const m =
    metadata && typeof metadata === "object"
      ? (metadata as OfferWizardMetadata)
      : null;

  const rewardsFromWizard = coerceRewardList(m?.rewards);
  const rewardsFromAlias = coerceRewardList(m?.reward_configuration);
  const rewardsFromFallback = coerceRewardList(fallbacks?.rewardConfiguration);
  const rewards =
    rewardsFromWizard.length > 0
      ? rewardsFromWizard
      : rewardsFromAlias.length > 0
        ? rewardsFromAlias
        : rewardsFromFallback;

  const trackingFromMeta = Array.isArray(m?.tracking_sources)
    ? m!.tracking_sources
    : [];
  const trackingFromFallback = Array.isArray(fallbacks?.trackingSources)
    ? (fallbacks!.trackingSources as unknown[])
    : [];
  const trackingSources =
    trackingFromMeta.length > 0 ? trackingFromMeta : trackingFromFallback;

  if (!m && rewards.length === 0 && trackingSources.length === 0) {
    return empty;
  }

  return {
    rewards,
    trackingSources,
    channelRouteId:
      typeof m?.channel_route_id === "number" ? m.channel_route_id : undefined,
    channelRouteKind: m?.channel_route_kind,
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
    tracking_sources: _trackingSources,
    reward_configuration: _rewardConfiguration,
    ...core
  } = formData;

  const routePayload = buildOfferRouteApiFields(formData, options.channelName);
  const routeSnapshot = getWizardChannelRouteSnapshot(
    formData,
    options.channelName,
  );
  const metadata = mergeOfferWizardMetadata(
    formData.metadata,
    options.rewards,
    options.trackingSources,
    routeSnapshot,
  );

  // Dual-write top-level JSONB columns expected by database-service create/update.
  // Keeps create aligned with update even if metadata merge is incomplete.
  return {
    ...core,
    ...(description?.trim() ? { description: description.trim() } : {}),
    ...routePayload,
    tracking_sources: metadata.tracking_sources ?? options.trackingSources,
    reward_configuration:
      metadata.reward_configuration ?? metadata.rewards ?? options.rewards,
    metadata,
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
