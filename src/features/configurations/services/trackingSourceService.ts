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

const API_BASE = buildApiUrl("/tracking-sources");
const LOCAL_STORAGE_KEY = "sentra_tracking_sources_catalog_v1";

const DEFAULT_CONDITIONS = [
  "equals",
  "greater_than",
  "less_than",
  "contains",
  "is_any_of",
];

/** Seed catalog mirrored from type SSOT */
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
    // ignore
  }
}

function unwrapList(payload: unknown): TrackingSourceCatalogItem[] {
  if (Array.isArray(payload)) return payload as TrackingSourceCatalogItem[];
  if (payload && typeof payload === "object") {
    const data = (payload as { data?: unknown }).data;
    if (Array.isArray(data)) return data as TrackingSourceCatalogItem[];
  }
  return [];
}

function unwrapOne(payload: unknown): TrackingSourceCatalogItem | null {
  if (!payload || typeof payload !== "object") return null;
  const obj = payload as { data?: TrackingSourceCatalogItem } & TrackingSourceCatalogItem;
  if (obj.data && typeof obj.data === "object" && "id" in obj.data) {
    return normalizeItem(obj.data);
  }
  if ("id" in obj && "name" in obj) return normalizeItem(obj);
  return null;
}

function normalizeItem(
  item: TrackingSourceCatalogItem,
): TrackingSourceCatalogItem {
  return {
    ...item,
    parameters: Array.isArray(item.parameters) ? item.parameters : [],
    displayMetrics: Array.isArray(item.displayMetrics)
      ? item.displayMetrics
      : [],
    conditions: Array.isArray(item.conditions)
      ? item.conditions
      : [...DEFAULT_CONDITIONS],
    dataSource: item.dataSource || getDataSourceByType(String(item.type)),
    isActive: isTrackingSourceActive(item),
  };
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
        // keep
      }
      throw new Error(message);
    }

    return response.json();
  }

  async getAll(options?: {
    activeOnly?: boolean;
  }): Promise<TrackingSourceCatalogItem[]> {
    const activeOnly = options?.activeOnly === true;
    try {
      const payload = await this.request<unknown>(
        activeOnly ? "?is_active=true" : "",
      );
      const list = unwrapList(payload).map(normalizeItem);
      if (list.length > 0) {
        return activeOnly ? list.filter(isTrackingSourceActive) : list;
      }
    } catch {
      // fall through
    }

    const local = readLocalCatalog().map(normalizeItem);
    return activeOnly ? local.filter(isTrackingSourceActive) : local;
  }

  async getById(
    id: number | string,
  ): Promise<TrackingSourceCatalogItem | null> {
    try {
      const payload = await this.request<unknown>(`/${encodeURIComponent(String(id))}`);
      return unwrapOne(payload);
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
    const body: CreateTrackingSourceRequest = {
      name: data.name.trim(),
      description: data.description?.trim() || undefined,
      type: data.type,
      dataSource: data.dataSource || getDataSourceByType(data.type),
      parameters:
        data.parameters ?? getParametersByType(data.type),
      displayMetrics:
        data.displayMetrics ?? getMetricsByType(data.type),
      conditions: data.conditions ?? [...DEFAULT_CONDITIONS],
      lookbackPeriod: data.lookbackPeriod || "24h",
      customLookbackDate: data.customLookbackDate,
      isActive: data.isActive !== false,
    };

    try {
      const payload = await this.request<unknown>("", {
        method: "POST",
        body: JSON.stringify(body),
      });
      const created = unwrapOne(payload);
      if (created) return created;
    } catch {
      // local fallback
    }

    const catalog = readLocalCatalog();
    const now = new Date().toISOString();
    const created: TrackingSourceCatalogItem = {
      id: generateLocalId(catalog),
      name: body.name,
      description: body.description,
      type: body.type,
      dataSource: body.dataSource,
      parameters: body.parameters || [],
      displayMetrics: body.displayMetrics || [],
      conditions: body.conditions,
      lookbackPeriod: body.lookbackPeriod,
      customLookbackDate: body.customLookbackDate,
      isActive: body.isActive !== false,
      created_at: now,
      updated_at: now,
    };
    writeLocalCatalog([...catalog, created]);
    return created;
  }

  async update(
    id: number | string,
    data: UpdateTrackingSourceRequest,
  ): Promise<TrackingSourceCatalogItem> {
    try {
      const payload = await this.request<unknown>(
        `/${encodeURIComponent(String(id))}`,
        {
          method: "PUT",
          body: JSON.stringify(data),
        },
      );
      const updated = unwrapOne(payload);
      if (updated) return updated;
    } catch {
      // local fallback
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
    } catch {
      // local fallback
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
