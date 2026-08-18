import type { CommunicationChannel } from "../../../shared/services/communicationChannelService";
import type { RouteChannelType, SMSRoute } from "../types/smsRoute";

export type RouteSelectOption = { value: string; label: string };

const NAME_ALIASES = [
  "name",
  "route_name",
  "routeName",
  "title",
  "configuration_name",
  "provider_name",
  "gateway_provider",
] as const;

function asTrimmedString(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
}

function numericId(value: unknown): number | null {
  if (value == null || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

/**
 * Human-readable route label. Never returns a bare numeric id when a name
 * (or gateway / channel name) is available — that is what made offer Basic Info
 * show "5" instead of the route name.
 */
export function formatRouteSelectLabel(
  route: SMSRoute | Record<string, unknown> | null | undefined,
): string {
  if (!route || typeof route !== "object") return "Unnamed route";

  const record = route as Record<string, unknown>;
  const routeId = record.id;
  const nested =
    record.configuration && typeof record.configuration === "object"
      ? (record.configuration as Record<string, unknown>)
      : undefined;

  const candidates: unknown[] = [
    ...NAME_ALIASES.map((key) => record[key]),
    nested?.name,
    record.channel_name,
  ];

  for (const candidate of candidates) {
    const label = asTrimmedString(candidate);
    if (!label) continue;
    if (routeId != null && label === String(routeId)) continue;
    return label;
  }

  if (routeId != null && String(routeId).trim() !== "") {
    return `Route #${routeId}`;
  }
  return "Unnamed route";
}

export function toRouteSelectOptions(
  routes: Array<SMSRoute | Record<string, unknown>> | null | undefined,
): RouteSelectOption[] {
  const seen = new Set<string>();
  const options: RouteSelectOption[] = [];

  for (const route of routes || []) {
    const id = (route as { id?: unknown }).id;
    if (id == null || id === "") continue;
    const value = String(id);
    if (seen.has(value)) continue;
    seen.add(value);
    options.push({
      value,
      label: formatRouteSelectLabel(route),
    });
  }

  return options;
}

/**
 * True when this route may appear for the offer's selected communication channel.
 * Routes bound to another channel (SMS Flash vs SMS Normal, SMS vs USSD) never match.
 */
export function routeBelongsToOfferChannel(
  route: SMSRoute | Record<string, unknown>,
  options: {
    channelType?: RouteChannelType | "";
    channelId?: number | null;
  },
): boolean {
  const channelId = numericId(options.channelId);
  const channelType = options.channelType || "";
  const routeChannelId = numericId(
    (route as { communication_channel_id?: unknown }).communication_channel_id,
  );
  const routeKind = (route as { channel_type?: RouteChannelType }).channel_type;

  if (routeChannelId != null) {
    if (channelId != null) return routeChannelId === channelId;
    return !channelType || routeKind === channelType;
  }

  if (channelType) {
    return !routeKind || routeKind === channelType;
  }
  return true;
}

/**
 * Routes shown for the offer's selected communication channel.
 *
 * Channel switches must be a local filter of the already-loaded catalog:
 * never mix in a route from the previously selected channel.
 */
export function filterRoutesForOfferChannel(
  routes: SMSRoute[],
  options: {
    channelType?: RouteChannelType | "";
    channel?: Pick<CommunicationChannel, "id"> | null;
    selectedRouteId?: number | null;
  },
): SMSRoute[] {
  const catalog = (routes || []).filter((route) => route.is_active !== false);
  const channelType = options.channelType;
  const channelId = numericId(options.channel?.id);

  const boundToChannel =
    channelId != null
      ? catalog.filter(
          (route) => numericId(route.communication_channel_id) === channelId,
        )
      : [];

  // Prefer exact communication-channel matches (Flash ≠ Normal).
  // Only fall back to untagged / same-kind routes when this channel has none.
  // Never fall back to every route of the same kind — that kept the previous
  // channel's route in the list after a switch.
  const pool =
    boundToChannel.length > 0
      ? boundToChannel
      : catalog.filter((route) =>
          routeBelongsToOfferChannel(route, { channelType, channelId }),
        );

  const selectedId = numericId(options.selectedRouteId);
  if (selectedId == null) return pool;
  if (pool.some((route) => Number(route.id) === selectedId)) return pool;

  const selected =
    catalog.find((route) => Number(route.id) === selectedId) ||
    routes.find((route) => Number(route.id) === selectedId);

  if (
    selected &&
    routeBelongsToOfferChannel(selected, { channelType, channelId })
  ) {
    return [...pool, selected];
  }

  return pool;
}

export function routeSelectOptionsForOfferChannel(
  routes: SMSRoute[],
  options: {
    channelType?: RouteChannelType | "";
    channel?: Pick<CommunicationChannel, "id"> | null;
    selectedRouteId?: number | null;
  },
): RouteSelectOption[] {
  return toRouteSelectOptions(filterRoutesForOfferChannel(routes, options));
}
