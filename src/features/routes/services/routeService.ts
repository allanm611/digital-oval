import { extractErrorMessage } from "../../../shared/utils/errorHandler";
import { buildApiUrl, getAuthHeaders } from "../../../shared/services/api";
import { communicationChannelService } from "../../../shared/services/communicationChannelService";
import {
  gatewayConfigurationService,
} from "../../configurations/services/gatewayConfigurationService";
import {
  CreateSMSRouteRequest,
  RouteChannelType,
  SMSRoute,
  UpdateSMSRouteRequest,
} from "../types/smsRoute";

const BASE_URL = buildApiUrl("/routes");

/** Map communication channel codes to UI channel buckets. */
export function resolveChannelType(codeOrName?: string | null): RouteChannelType {
  const value = (codeOrName || "").toUpperCase();
  if (!value) return "";
  if (value.includes("SMS")) return "SMS";
  if (value.includes("EMAIL")) return "EMAIL";
  if (value.includes("PUSH")) return "PUSH";
  if (value.includes("WHATSAPP") || value.includes("MESSENGER")) return "WHATSAPP";
  if (value.includes("USSD")) return "USSD";
  return "";
}

function asRouteArray(payload: unknown, depth = 0): SMSRoute[] {
  if (Array.isArray(payload)) return payload as SMSRoute[];
  if (!payload || typeof payload !== "object" || depth > 3) return [];
  const record = payload as Record<string, unknown>;
  for (const key of ["data", "items", "routes", "results"]) {
    if (!(key in record)) continue;
    const nested = record[key];
    if (Array.isArray(nested)) return nested as SMSRoute[];
    const inner = asRouteArray(nested, depth + 1);
    if (inner.length > 0) return inner;
  }
  return [];
}

function asPositiveInt(value: unknown): number | null {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : null;
}

function readListTotal(payload: unknown, depth = 0): number | null {
  if (!payload || typeof payload !== "object" || depth > 3) return null;
  const record = payload as Record<string, unknown>;
  const direct =
    asPositiveInt(record.total) ??
    asPositiveInt(record.count) ??
    asPositiveInt(record.totalCount);
  if (direct != null) return direct;

  for (const key of ["pagination", "meta", "data"]) {
    if (!(key in record)) continue;
    const nested = record[key];
    if (nested && typeof nested === "object" && !Array.isArray(nested)) {
      const fromNested = readListTotal(nested, depth + 1);
      if (fromNested != null) return fromNested;
    }
  }
  return null;
}

function readHasMore(payload: unknown): boolean | null {
  if (!payload || typeof payload !== "object") return null;
  const record = payload as Record<string, unknown>;
  const pagination =
    record.pagination && typeof record.pagination === "object"
      ? (record.pagination as Record<string, unknown>)
      : record.meta && typeof record.meta === "object"
        ? (record.meta as Record<string, unknown>)
        : record;
  if (typeof pagination.hasMore === "boolean") return pagination.hasMore;
  if (typeof pagination.has_more === "boolean") return pagination.has_more;
  return null;
}

function dedupeRoutesById(routes: SMSRoute[]): SMSRoute[] {
  const seen = new Set<number>();
  const unique: SMSRoute[] = [];
  for (const route of routes) {
    const id = Number(route.id);
    if (!Number.isFinite(id) || seen.has(id)) continue;
    seen.add(id);
    unique.push(route);
  }
  return unique;
}

function asTrimmedString(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed || undefined;
}

function pickRouteName(raw: SMSRoute & Record<string, unknown>): string {
  const nested =
    raw.configuration && typeof raw.configuration === "object"
      ? (raw.configuration as Record<string, unknown>)
      : undefined;
  const candidates = [
    raw.name,
    raw["route_name"],
    raw["routeName"],
    raw["title"],
    raw.configuration_name,
    nested?.name,
    raw.provider_name,
    raw.gateway_provider,
  ];
  for (const candidate of candidates) {
    const label = asTrimmedString(candidate);
    if (!label) continue;
    if (raw.id != null && label === String(raw.id)) continue;
    return label;
  }
  return raw.id != null ? `Route #${raw.id}` : "Unnamed route";
}

function readFailoverFromConfig(config?: Record<string, unknown>) {
  if (!config || typeof config !== "object") {
    return {
      backup_route_id: undefined as number | null | undefined,
      use_backup_on_failure: false,
      retry_attempts: 3,
    };
  }
  const backupRaw = config.backup_route_id;
  const backup =
    backupRaw == null || backupRaw === "" || backupRaw === 0
      ? null
      : Number(backupRaw);

  return {
    backup_route_id: Number.isFinite(backup as number) ? (backup as number) : null,
    use_backup_on_failure: Boolean(config.use_backup_on_failure),
    retry_attempts:
      config.retry_attempts != null && config.retry_attempts !== ""
        ? Number(config.retry_attempts)
        : 3,
  };
}

function normalizeRoute(raw: SMSRoute): SMSRoute {
  const record = raw as SMSRoute & Record<string, unknown>;
  const configurationId =
    raw.configuration_id ?? raw.gateway_config_id ?? null;
  const failover = readFailoverFromConfig(raw.config);

  return {
    ...raw,
    name: pickRouteName(record),
    configuration_id: configurationId,
    gateway_config_id: configurationId ?? undefined,
    is_active: raw.is_active !== false,
    backup_route_id:
      raw.backup_route_id !== undefined
        ? raw.backup_route_id
        : failover.backup_route_id,
    use_backup_on_failure:
      raw.use_backup_on_failure !== undefined
        ? raw.use_backup_on_failure
        : failover.use_backup_on_failure,
    retry_attempts:
      raw.retry_attempts !== undefined
        ? raw.retry_attempts
        : failover.retry_attempts,
  };
}

/**
 * Build API body matching backend Joi schemas.
 * Failover UI fields are folded into `config` JSONB (supported by create + update).
 * Create accepts configuration_id; update may reject it until backend is extended.
 */
function toApiPayload(
  data: CreateSMSRouteRequest | UpdateSMSRouteRequest,
  _mode: "create" | "update",
): Record<string, unknown> {
  const configurationId =
    data.configuration_id ?? data.gateway_config_id ?? undefined;

  const payload: Record<string, unknown> = {};

  if (data.name !== undefined) payload.name = data.name;
  if (data.description !== undefined) payload.description = data.description;
  if (data.is_active !== undefined) payload.is_active = data.is_active;
  if (data.communication_channel_id !== undefined) {
    payload.communication_channel_id = data.communication_channel_id;
  }
  if (data.gateway_provider !== undefined) {
    payload.gateway_provider = data.gateway_provider;
  }

  const hasFailoverInput =
    data.backup_route_id !== undefined ||
    data.use_backup_on_failure !== undefined ||
    data.retry_attempts !== undefined;

  if (data.config !== undefined || hasFailoverInput) {
    const baseConfig =
      data.config && typeof data.config === "object" ? { ...data.config } : {};

    if (data.use_backup_on_failure !== undefined) {
      baseConfig.use_backup_on_failure = data.use_backup_on_failure;
    }
    if (data.backup_route_id !== undefined) {
      baseConfig.backup_route_id =
        data.backup_route_id && data.backup_route_id > 0
          ? data.backup_route_id
          : null;
    }
    if (data.retry_attempts !== undefined) {
      baseConfig.retry_attempts = data.retry_attempts;
    }

    // When failover is off, clear backup linkage but keep retry preference
    if (baseConfig.use_backup_on_failure === false) {
      baseConfig.backup_route_id = null;
    }

    payload.config = baseConfig;
  }

  if (configurationId != null && configurationId > 0) {
    payload.configuration_id = configurationId;
  }

  return payload;
}

const ROUTE_CATALOG_TTL_MS = 30_000;
let routeCatalogCache: { data: SMSRoute[]; at: number } | null = null;
let routeCatalogInflight: Promise<SMSRoute[]> | null = null;

function invalidateRouteCatalogCache() {
  routeCatalogCache = null;
  routeCatalogInflight = null;
}

class RouteService {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
  ): Promise<T> {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      headers: {
        ...getAuthHeaders(),
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(extractErrorMessage(errorBody, response.status));
    }

    const json = await response.json();
    if (json && json.success === false) {
      throw new Error(json.error || json.message || "Request failed");
    }
    return json;
  }

  async getAllRoutes(): Promise<SMSRoute[]> {
    const first = await this.request<unknown>("");
    const collected = asRouteArray(first).map(normalizeRoute);
    const total = readListTotal(first);
    const hasMore = readHasMore(first);

    if ((total == null || collected.length >= total) && hasMore !== true) {
      return dedupeRoutesById(collected);
    }

    const pageSize = Math.max(collected.length, 50);
    let offset = collected.length;
    let safety = 0;
    while (safety < 50) {
      safety += 1;
      if (total != null && collected.length >= total) break;
      const next = await this.request<unknown>(
        `?limit=${pageSize}&offset=${offset}`,
      );
      const batch = asRouteArray(next).map(normalizeRoute);
      if (batch.length === 0) break;
      collected.push(...batch);
      offset += batch.length;
      if (batch.length < pageSize) break;
      if (readHasMore(next) === false) break;
    }

    return dedupeRoutesById(collected);
  }

  /**
   * Enrich routes with channel + gateway config display fields.
   * Channel type comes from communication_channel_id or linked configuration.
   * Cached + in-flight deduped so offer channel switching never refetches.
   */
  async getAllRoutesEnriched(options?: {
    skipCache?: boolean;
  }): Promise<SMSRoute[]> {
    const skipCache = options?.skipCache === true;
    if (
      !skipCache &&
      routeCatalogCache &&
      Date.now() - routeCatalogCache.at < ROUTE_CATALOG_TTL_MS
    ) {
      return routeCatalogCache.data;
    }
    if (!skipCache && routeCatalogInflight) {
      return routeCatalogInflight;
    }

    const load = this.loadAllRoutesEnriched().then((data) => {
      routeCatalogCache = { data, at: Date.now() };
      return data;
    });
    routeCatalogInflight = load;
    try {
      return await load;
    } finally {
      if (routeCatalogInflight === load) {
        routeCatalogInflight = null;
      }
    }
  }

  private async loadAllRoutesEnriched(): Promise<SMSRoute[]> {
    const [routes, configs, channels] = await Promise.all([
      this.getAllRoutes(),
      gatewayConfigurationService.getAll().catch(() => []),
      communicationChannelService.getAll().catch(() => []),
    ]);

    const configById = new Map(
      (Array.isArray(configs) ? configs : []).map((c) => [c.id, c]),
    );
    const channelById = new Map(
      (Array.isArray(channels) ? channels : []).map((c) => [c.id, c]),
    );

    return routes.map((route) =>
      this.withChannelAndGateway(route, configById, channelById),
    );
  }

  private withChannelAndGateway(
    route: SMSRoute,
    configById: Map<
      number,
      {
        id: number;
        name?: string;
        channel_id?: number;
        channel_value?: string;
        channel_label?: string;
        provider_name?: string;
      }
    >,
    channelById: Map<number, { id: number; name?: string; code?: string }>,
  ): SMSRoute {
    const config =
      route.configuration_id != null
        ? configById.get(route.configuration_id)
        : undefined;
    const inferredChannelId =
      route.communication_channel_id ?? config?.channel_id ?? null;
    const channel =
      inferredChannelId != null ? channelById.get(inferredChannelId) : undefined;
    const channelCode = channel?.code || config?.channel_value || undefined;
    const channelType = resolveChannelType(channelCode || channel?.name);

    return {
      ...route,
      communication_channel_id: inferredChannelId,
      channel_type: channelType || undefined,
      channel_code: channelCode,
      channel_name: channel?.name || config?.channel_label,
      configuration_name: config?.name,
      provider_name: config?.provider_name || route.gateway_provider,
      gateway_provider:
        config?.provider_name || route.gateway_provider || undefined,
    };
  }

  async getRoutesByChannel(channelType: RouteChannelType): Promise<SMSRoute[]> {
    if (!channelType) return this.getAllRoutesEnriched();
    const enriched = await this.getAllRoutesEnriched();
    return enriched.filter((r) => r.channel_type === channelType);
  }

  async getRouteById(id: number): Promise<SMSRoute> {
    const result = await this.request<{ success: boolean; data: SMSRoute }>(
      `/${id}`,
    );
    return normalizeRoute(result.data);
  }

  async getRouteByIdEnriched(id: number): Promise<SMSRoute> {
    const [route, configs, channels] = await Promise.all([
      this.getRouteById(id),
      gatewayConfigurationService.getAll().catch(() => []),
      communicationChannelService.getAll().catch(() => []),
    ]);

    const configById = new Map((configs || []).map((c) => [c.id, c]));
    const channelById = new Map((channels || []).map((c) => [c.id, c]));
    return this.withChannelAndGateway(route, configById, channelById);
  }

  async createRoute(data: CreateSMSRouteRequest): Promise<SMSRoute> {
    const result = await this.request<{ success: boolean; data: SMSRoute }>(
      "",
      {
        method: "POST",
        body: JSON.stringify(toApiPayload(data, "create")),
      },
    );
    const created = normalizeRoute(result.data);
    invalidateRouteCatalogCache();
    return created;
  }

  async updateRoute(
    id: number,
    data: UpdateSMSRouteRequest,
  ): Promise<SMSRoute> {
    const payload = toApiPayload(data, "update");

    // Backend update Joi currently may reject configuration_id.
    // Retry without it if validation fails so name/status updates still work.
    try {
      const result = await this.request<{ success: boolean; data: SMSRoute }>(
        `/${id}`,
        {
          method: "PUT",
          body: JSON.stringify(payload),
        },
      );
      const updated = normalizeRoute(result.data);
      invalidateRouteCatalogCache();
      return updated;
    } catch (err) {
      if (
        payload.configuration_id != null &&
        err instanceof Error &&
        /configuration_id|not allowed|must be/i.test(err.message)
      ) {
        const { configuration_id: _, ...withoutConfigId } = payload;
        if (Object.keys(withoutConfigId).length === 0) {
          throw new Error(
            "Changing gateway configuration requires a backend update to accept configuration_id on PUT /routes/:id",
          );
        }
        const result = await this.request<{ success: boolean; data: SMSRoute }>(
          `/${id}`,
          {
            method: "PUT",
            body: JSON.stringify(withoutConfigId),
          },
        );
        const updated = normalizeRoute(result.data);
        invalidateRouteCatalogCache();
        return updated;
      }
      throw err;
    }
  }

  async deleteRoute(id: number): Promise<{ success: boolean; message?: string }> {
    const result = await this.request<{ success: boolean; message?: string }>(
      `/${id}`,
      {
        method: "DELETE",
      },
    );
    invalidateRouteCatalogCache();
    return result;
  }
}

/** Canonical multi-channel route client for `/routes`. */
export const routeService = new RouteService();

/**
 * Historical export name — SMS UI and offers still import this.
 * Prefer `routeService` for new code; use getRoutesByChannel("SMS") when filtering.
 */
export const smsRouteService = routeService;
