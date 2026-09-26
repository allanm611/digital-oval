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

function channelTypeOf(codeOrName?: string | null): RouteChannelType | "" {
  const value = (codeOrName || "").toUpperCase();
  if (!value) return "";
  if (value.includes("SMS")) return "SMS";
  if (value.includes("EMAIL")) return "EMAIL";
  if (value.includes("PUSH")) return "PUSH";
  if (value.includes("WHATSAPP") || value.includes("MESSENGER")) return "WHATSAPP";
  if (value.includes("USSD")) return "USSD";
  return "";
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

  return options.sort((a, b) =>
    a.label.localeCompare(b.label, undefined, { sensitivity: "base" }),
  );
}

type OfferChannelFilterOptions = {
  channelType?: RouteChannelType | "";
  channelId?: number | null;
  /**
   * When true, keep Flash ≠ Normal: only exact channel-id matches plus
   * untagged same-kind routes. When false (only one Email/SMS/… channel),
   * show every active route of that kind so orphaned FKs are not hidden.
   */
  restrictToChannelId?: boolean;
};

function sameTypeChannelCount(
  channels: Array<Pick<CommunicationChannel, "id" | "name" | "code">> | null | undefined,
  channelType?: RouteChannelType | "",
): number {
  if (!channelType) return 0;
  const seen = new Set<number>();
  for (const channel of channels || []) {
    const id = numericId(channel.id);
    if (id == null || seen.has(id)) continue;
    if (channelTypeOf(channel.code || channel.name) !== channelType) continue;
    seen.add(id);
  }
  return seen.size;
}

/**
 * True when this route may appear for the offer's selected communication channel.
 * Never mixes kinds (SMS into Email). Distinct variants of the same kind
 * (SMS Flash vs SMS Normal) stay split only when both channels exist.
 */
export function routeBelongsToOfferChannel(
  route: SMSRoute | Record<string, unknown>,
  options: OfferChannelFilterOptions,
): boolean {
  const channelId = numericId(options.channelId);
  const channelType = options.channelType || "";
  const routeChannelId = numericId(
    (route as { communication_channel_id?: unknown }).communication_channel_id,
  );
  const routeKind = (route as { channel_type?: RouteChannelType }).channel_type;

  if (channelType && routeKind && routeKind !== channelType) {
    return false;
  }

  if (options.restrictToChannelId && channelId != null) {
    if (routeChannelId != null) return routeChannelId === channelId;
    return !routeKind || routeKind === channelType;
  }

  if (channelType) {
    return !routeKind || routeKind === channelType;
  }

  if (channelId != null && routeChannelId != null) {
    return routeChannelId === channelId;
  }
  return true;
}

export type OfferRouteSelectOptions = {
  channelType?: RouteChannelType | "";
  channel?: Pick<CommunicationChannel, "id" | "name" | "code"> | null;
  selectedRouteId?: number | null;
  allChannels?: Array<Pick<CommunicationChannel, "id" | "name" | "code">> | null;
};

/**
 * Routes shown for the offer's selected communication channel.
 *
 * Channel switches must be a local filter of the already-loaded catalog:
 * never mix in a route from a different channel kind.
 */
export function filterRoutesForOfferChannel(
  routes: SMSRoute[],
  options: OfferRouteSelectOptions,
): SMSRoute[] {
  const catalog = (routes || []).filter((route) => route.is_active !== false);
  const channelType = options.channelType || "";
  const channelId = numericId(options.channel?.id);
  const restrictToChannelId =
    sameTypeChannelCount(options.allChannels, channelType) > 1;

  const membership = { channelType, channelId, restrictToChannelId };
  const pool = catalog.filter((route) =>
    routeBelongsToOfferChannel(route, membership),
  );

  const selectedId = numericId(options.selectedRouteId);
  if (selectedId == null) return pool;
  if (pool.some((route) => Number(route.id) === selectedId)) return pool;

  const selected =
    catalog.find((route) => Number(route.id) === selectedId) ||
    routes.find((route) => Number(route.id) === selectedId);

  if (selected && routeBelongsToOfferChannel(selected, membership)) {
    return [...pool, selected];
  }

  return pool;
}

export function routeSelectOptionsForOfferChannel(
  routes: SMSRoute[],
  options: OfferRouteSelectOptions,
): RouteSelectOption[] {
  return toRouteSelectOptions(filterRoutesForOfferChannel(routes, options));
}
