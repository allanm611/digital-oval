import { buildApiUrl, getAuthHeaders } from "../../../shared/services/api";
import {
  getDataSourceByType,
  getMetricsByType,
  getParametersByType,
  trackingSourcesData,
} from "../../offers/utils/trackingSourcesConfig";
import type {
  CreateTrackingSourceRequest,
  TrackingSourceCatalogItem,
  UpdateTrackingSourceRequest,
} from "../types/trackingSource";
import { isTrackingSourceActive } from "../types/trackingSource";

/**
 * Catalog CRUD for Configuration → Offer Tracking Sources.
 * Backend mount: app.use("/offer-tracking-sources", OfferTrackingSourcesRouter)
 * (distinct from engine `/tracking-sources` attribution catalog)
 */
const API_BASE = buildApiUrl("/offer-tracking-sources");
const LOCAL_STORAGE_KEY = "sentra_offer_tracking_sources_catalog_v1";

const DEFAULT_CONDITIONS = [
  "equals",
  "greater_than",
  "less_than",
  "contains",
  "is_any_of",
];

/** Seed catalog mirrored from type SSOT (offline / empty-API fallback) */
export const SEED_TRACKING_SOURCES: TrackingSourceCatalogItem[] =
  trackingSourcesData.map((def, index) => ({
    id: index + 1,
    name: def.label,
    description: def.description,
    type: def.type,
    dataSource: def.dataSource,
    parameters: [...def.parameters],
    displayMetrics: [...def.displayMetrics],
    conditions: [...DEFAULT_CONDITIONS],
    lookbackPeriod:
      def.type === "usage_metric"
        ? "7d"
        : def.type === "redemption"
          ? "30d"
          : def.type === "churn_prevention"
            ? "90d"
            : "24h",
    isActive: def.type !== "custom",
    created_at: "2025-02-01T09:00:00Z",
    updated_at: "2025-02-06T15:00:00Z",
  }));

function generateLocalId(existing: TrackingSourceCatalogItem[]): number {
  const nums = existing
    .map((i) => Number(i.id))
    .filter((n) => Number.isFinite(n));
  return (nums.length ? Math.max(...nums) : 0) + 1;
}

function readLocalCatalog(): TrackingSourceCatalogItem[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) return SEED_TRACKING_SOURCES.map((s) => ({ ...s }));
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      return SEED_TRACKING_SOURCES.map((s) => ({ ...s }));
    }
    return parsed as TrackingSourceCatalogItem[];
  } catch {
    return SEED_TRACKING_SOURCES.map((s) => ({ ...s }));
  }
}

function writeLocalCatalog(items: TrackingSourceCatalogItem[]): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(items));
  } catch {
    // ignore quota / private mode
  }
}

function parseStringArray(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(String).filter(Boolean);
  if (typeof value === "string" && value.trim()) {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) return parsed.map(String).filter(Boolean);
    } catch {
      return value
        .split(",")
        .map((part) => part.trim())
        .filter(Boolean);
    }
  }
  return [];
}

function unwrapList(payload: unknown): unknown[] {
  if (Array.isArray(payload)) return payload;
  if (payload && typeof payload === "object") {
    const data = (payload as { data?: unknown }).data;
    if (Array.isArray(data)) return data;
  }
  return [];
}

function unwrapOne(payload: unknown): unknown | null {
  if (!payload || typeof payload !== "object") return null;
  const obj = payload as { data?: unknown; success?: boolean };
  if (obj.data != null && typeof obj.data === "object" && !Array.isArray(obj.data)) {
    return obj.data;
  }
  if ("id" in obj && "name" in obj) return obj;
  return null;
}

/**
 * Normalize API (snake_case or camelCase) / local rows into the UI catalog shape.
 * Tolerates the current minimal backend (name, description, is_active) and
 * richer columns when the schema is expanded.
 */
export function normalizeItem(raw: unknown): TrackingSourceCatalogItem {
  const item = (raw && typeof raw === "object" ? raw : {}) as Record<
    string,
    unknown
  >;
  const type = String(
    item.type ?? item.source_type ?? item.sourceType ?? "custom",
  );
  const dataSource = String(
    item.dataSource ??
      item.data_source ??
      getDataSourceByType(type) ??
      "custom_api",
  );
  const parameters = parseStringArray(item.parameters);
  const displayMetrics = parseStringArray(
    item.displayMetrics ?? item.display_metrics,
  );
  const conditions = parseStringArray(item.conditions);
  const isActive = isTrackingSourceActive({
    isActive: item.isActive as boolean | undefined,
    is_active: item.is_active as boolean | undefined,
  });

  return {
    id: (item.id as number | string) ?? "",
    name: String(item.name ?? ""),
    description:
      item.description == null || item.description === ""
        ? undefined
        : String(item.description),
    type,
    dataSource,
    parameters:
      parameters.length > 0 ? parameters : getParametersByType(type),
    displayMetrics:
      displayMetrics.length > 0 ? displayMetrics : getMetricsByType(type),
    conditions: conditions.length > 0 ? conditions : [...DEFAULT_CONDITIONS],
    lookbackPeriod: String(
      item.lookbackPeriod ?? item.lookback_period ?? "24h",
    ),
    customLookbackDate:
      (item.customLookbackDate as string | undefined) ??
      (item.custom_lookback_date as string | undefined) ??
      undefined,
    isActive,
    is_active: isActive,
    created_at: item.created_at as string | undefined,
    updated_at: item.updated_at as string | undefined,
  };
}

/** Body the offer-tracking-sources API accepts (camel + snake for compatibility) */
function toApiPayload(
  data: CreateTrackingSourceRequest | UpdateTrackingSourceRequest,
): Record<string, unknown> {
  const payload: Record<string, unknown> = {};

  if (data.name !== undefined) payload.name = String(data.name).trim();
  if (data.description !== undefined) {
    payload.description =
      data.description == null || !String(data.description).trim()
        ? null
        : String(data.description).trim();
  }
  if (data.type !== undefined) {
    payload.type = data.type;
    payload.source_type = data.type;
  }
  if (data.dataSource !== undefined) {
    payload.dataSource = data.dataSource;
    payload.data_source = data.dataSource;
  }
  if (data.parameters !== undefined) {
    payload.parameters = data.parameters;
  }
  if (data.displayMetrics !== undefined) {
    payload.displayMetrics = data.displayMetrics;
    payload.display_metrics = data.displayMetrics;
  }
  if (data.conditions !== undefined) {
    payload.conditions = data.conditions;
  }
  if (data.lookbackPeriod !== undefined) {
    payload.lookbackPeriod = data.lookbackPeriod;
    payload.lookback_period = data.lookbackPeriod;
  }
  if (data.customLookbackDate !== undefined) {
    payload.customLookbackDate = data.customLookbackDate;
    payload.custom_lookback_date = data.customLookbackDate;
  }
  if (data.isActive !== undefined) {
    payload.isActive = data.isActive;
    payload.is_active = data.isActive;
  }

  return payload;
}

class TrackingSourceService {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
  ): Promise<T> {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers: {
        ...getAuthHeaders(),
        "Content-Type": "application/json",
        ...options.headers,
      },
    });

    if (!response.ok) {
      let message = `HTTP ${response.status}`;
      try {
        const body = await response.json();
        message = body.error || body.message || message;
      } catch {
        // keep status message
      }
      const err = new Error(message) as Error & { status?: number };
      err.status = response.status;
      throw err;
    }

    if (response.status === 204) {
      return undefined as T;
    }

    return response.json();
  }

  async getAll(options?: {
    activeOnly?: boolean;
  }): Promise<TrackingSourceCatalogItem[]> {
    const activeOnly = options?.activeOnly === true;
    // Backend handler checks req.query.isActive; also send is_active for forwards-compat
    const query = activeOnly ? "?isActive=true&is_active=true" : "";

    try {
      const payload = await this.request<unknown>(query);
      const list = unwrapList(payload).map(normalizeItem);
      if (list.length > 0) {
        return activeOnly ? list.filter(isTrackingSourceActive) : list;
      }
      // Empty successful API response is authoritative — do not silently seed
      return [];
    } catch (error) {
      console.warn(
        "[trackingSourceService] GET /offer-tracking-sources failed; using local catalog fallback.",
        error,
      );
    }

    const local = readLocalCatalog().map(normalizeItem);
    return activeOnly ? local.filter(isTrackingSourceActive) : local;
  }

  async getById(
    id: number | string,
  ): Promise<TrackingSourceCatalogItem | null> {
    try {
      const payload = await this.request<unknown>(
        `/${encodeURIComponent(String(id))}`,
      );
      const one = unwrapOne(payload);
      return one ? normalizeItem(one) : null;
    } catch {
      return (
        readLocalCatalog()
          .map(normalizeItem)
          .find((i) => String(i.id) === String(id)) ?? null
      );
    }
  }

  async create(
    data: CreateTrackingSourceRequest,
  ): Promise<TrackingSourceCatalogItem> {
    const body = toApiPayload({
      name: data.name.trim(),
      description: data.description?.trim() || undefined,
      type: data.type,
      dataSource: data.dataSource || getDataSourceByType(data.type),
      parameters: data.parameters ?? getParametersByType(data.type),
      displayMetrics: data.displayMetrics ?? getMetricsByType(data.type),
      conditions: data.conditions ?? [...DEFAULT_CONDITIONS],
      lookbackPeriod: data.lookbackPeriod || "24h",
      customLookbackDate: data.customLookbackDate,
      isActive: data.isActive !== false,
    });

    try {
      const payload = await this.request<unknown>("", {
        method: "POST",
        body: JSON.stringify(body),
      });
      const created = unwrapOne(payload);
      if (created) return normalizeItem(created);
      throw new Error("Create succeeded but response had no tracking source");
    } catch (error) {
      const status = (error as { status?: number })?.status;
      // Only fall back locally on network / unreachable API — not on 4xx validation
      if (status && status >= 400 && status < 600) throw error;
      console.warn(
        "[trackingSourceService] POST /offer-tracking-sources failed; local fallback.",
        error,
      );
    }

    const catalog = readLocalCatalog();
    const now = new Date().toISOString();
    const created: TrackingSourceCatalogItem = {
      id: generateLocalId(catalog),
      name: String(body.name),
      description: (body.description as string | undefined) || undefined,
      type: String(body.type || "custom"),
      dataSource: String(body.dataSource || "custom_api"),
      parameters: parseStringArray(body.parameters),
      displayMetrics: parseStringArray(body.displayMetrics),
      conditions: parseStringArray(body.conditions),
      lookbackPeriod: String(body.lookbackPeriod || "24h"),
      customLookbackDate: body.customLookbackDate as string | undefined,
      isActive: body.isActive !== false,
      created_at: now,
      updated_at: now,
    };
    writeLocalCatalog([...catalog, created]);
    return normalizeItem(created);
  }

  async update(
    id: number | string,
    data: UpdateTrackingSourceRequest,
  ): Promise<TrackingSourceCatalogItem> {
    const body = toApiPayload(data);

    try {
      const payload = await this.request<unknown>(
        `/${encodeURIComponent(String(id))}`,
        {
          method: "PUT",
          body: JSON.stringify(body),
        },
      );
      const updated = unwrapOne(payload);
      if (updated) return normalizeItem(updated);
      throw new Error("Update succeeded but response had no tracking source");
    } catch (error) {
      const status = (error as { status?: number })?.status;
      if (status && status >= 400 && status < 600) throw error;
      console.warn(
        "[trackingSourceService] PUT /offer-tracking-sources failed; local fallback.",
        error,
      );
    }

    const catalog = readLocalCatalog();
    const index = catalog.findIndex((i) => String(i.id) === String(id));
    if (index < 0) throw new Error("Tracking source not found");

    const updated: TrackingSourceCatalogItem = {
      ...catalog[index],
      ...data,
      name: data.name?.trim() ?? catalog[index].name,
      description:
        data.description !== undefined
          ? data.description.trim() || undefined
          : catalog[index].description,
      parameters: data.parameters ?? catalog[index].parameters,
      displayMetrics: data.displayMetrics ?? catalog[index].displayMetrics,
      updated_at: new Date().toISOString(),
    };
    catalog[index] = updated;
    writeLocalCatalog(catalog);
    return normalizeItem(updated);
  }

  async remove(id: number | string): Promise<void> {
    try {
      await this.request<unknown>(`/${encodeURIComponent(String(id))}`, {
        method: "DELETE",
      });
      return;
    } catch (error) {
      const status = (error as { status?: number })?.status;
      if (status && status >= 400 && status < 600) throw error;
      console.warn(
        "[trackingSourceService] DELETE /offer-tracking-sources failed; local fallback.",
        error,
      );
    }

    writeLocalCatalog(
      readLocalCatalog().filter((i) => String(i.id) !== String(id)),
    );
  }

  async setActive(
    id: number | string,
    isActive: boolean,
  ): Promise<TrackingSourceCatalogItem> {
    return this.update(id, { isActive });
  }
}

export const trackingSourceService = new TrackingSourceService();
