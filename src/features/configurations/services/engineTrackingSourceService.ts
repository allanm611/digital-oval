import { buildApiUrl, getAuthHeaders, API_CONFIG } from "../../../shared/services/api";
import { extractErrorMessage } from "../../../shared/utils/errorHandler";
import type {
  CreateEngineTrackingSourceFieldPayload,
  CreateEngineTrackingSourcePayload,
  EngineTrackingSource,
  EngineTrackingSourceField,
  EngineTrackingSourceListParams,
  EngineTrackingSourceSearchParams,
  TrackingSelectorConfigRow,
  TrackingSelectorField,
  TrackingSelectorOperator,
  TrackingSelectorSource,
  UpdateEngineTrackingSourceFieldPayload,
  UpdateEngineTrackingSourcePayload,
} from "../types/engineTrackingSource";

/**
 * Engine attribution catalog CRUD.
 * Backend mount: app.use("/tracking-sources", TrackingSourcesRouter)
 *
 * Do not reuse trackingSourceService — that talks to /offer-tracking-sources.
 */
const API_BASE = buildApiUrl(API_CONFIG.ENDPOINTS.TRACKING_SOURCES);

async function parseErrorResponse(response: Response): Promise<string> {
  try {
    const body = await response.json();
    return (
      body.error ||
      body.message ||
      (Array.isArray(body.details) ? body.details.join("; ") : null) ||
      extractErrorMessage(JSON.stringify(body), response.status)
    );
  } catch {
    return `HTTP ${response.status}`;
  }
}

function unwrapList<T>(payload: unknown): T[] {
  if (Array.isArray(payload)) return payload as T[];
  if (payload && typeof payload === "object") {
    const data = (payload as { data?: unknown }).data;
    if (Array.isArray(data)) return data as T[];
  }
  return [];
}

function unwrapOne<T extends { id?: unknown }>(payload: unknown): T | null {
  if (!payload || typeof payload !== "object") return null;
  const obj = payload as { data?: T } & T;
  if (obj.data && typeof obj.data === "object" && "id" in obj.data) {
    return obj.data;
  }
  if ("id" in obj) return obj as T;
  return null;
}

function normalizeField(raw: Record<string, unknown>): EngineTrackingSourceField {
  return {
    id: Number(raw.id),
    trackingSourceId: Number(
      raw.trackingSourceId ?? raw.tracking_source_id ?? 0,
    ),
    fieldName: String(raw.fieldName ?? raw.field_name ?? ""),
    fieldKey: String(raw.fieldKey ?? raw.field_key ?? ""),
    dataType: String(raw.dataType ?? raw.data_type ?? "text"),
    isRequired: raw.isRequired === true || raw.is_required === true,
    isPrimaryKey: raw.isPrimaryKey === true || raw.is_primary_key === true,
    isAmountField: raw.isAmountField === true || raw.is_amount_field === true,
    isRevenueField:
      raw.isRevenueField === true || raw.is_revenue_field === true,
    isProductField:
      raw.isProductField === true || raw.is_product_field === true,
    displayOrder: Number(raw.displayOrder ?? raw.display_order ?? 0),
    description: (raw.description as string | null | undefined) ?? null,
    isActive: raw.isActive !== false && raw.is_active !== false,
    createdAt: (raw.createdAt ?? raw.created_at) as string | undefined,
    updatedAt: (raw.updatedAt ?? raw.updated_at) as string | undefined,
  };
}

function normalizeSource(raw: Record<string, unknown>): EngineTrackingSource {
  const fieldsRaw = raw.fields;
  return {
    id: Number(raw.id),
    name: String(raw.name ?? ""),
    code: String(raw.code ?? ""),
    sourceType: String(raw.sourceType ?? raw.source_type ?? "custom"),
    description: (raw.description as string | null | undefined) ?? null,
    attributionWindowHours: Number(
      raw.attributionWindowHours ?? raw.attribution_window_hours ?? 72,
    ),
    cooldownHours: Number(raw.cooldownHours ?? raw.cooldown_hours ?? 0),
    criteria: (raw.criteria as EngineTrackingSource["criteria"]) ?? null,
    rules: raw.rules ?? raw.criteria,
    includedProductCodes: Array.isArray(raw.includedProductCodes)
      ? (raw.includedProductCodes as string[])
      : Array.isArray(raw.included_product_codes)
        ? (raw.included_product_codes as string[])
        : null,
    excludedProductCodes: Array.isArray(raw.excludedProductCodes)
      ? (raw.excludedProductCodes as string[])
      : Array.isArray(raw.excluded_product_codes)
        ? (raw.excluded_product_codes as string[])
        : null,
    minAmount:
      raw.minAmount != null
        ? Number(raw.minAmount)
        : raw.min_amount != null
          ? Number(raw.min_amount)
          : null,
    maxAmount:
      raw.maxAmount != null
        ? Number(raw.maxAmount)
        : raw.max_amount != null
          ? Number(raw.max_amount)
          : null,
    isActive: raw.isActive !== false && raw.is_active !== false,
    fields: Array.isArray(fieldsRaw)
      ? fieldsRaw.map((f) => normalizeField(f as Record<string, unknown>))
      : undefined,
    createdAt: (raw.createdAt ?? raw.created_at) as string | undefined,
    updatedAt: (raw.updatedAt ?? raw.updated_at) as string | undefined,
    metadata: (raw.metadata as Record<string, unknown> | null) ?? null,
  };
}

/**
 * Group flat selector-config rows into Sources → Fields → Operators.
 */
export function buildSelectorTree(
  rows: TrackingSelectorConfigRow[],
): TrackingSelectorSource[] {
  const sources = new Map<number, TrackingSelectorSource>();

  for (const row of rows) {
    const sourceId = Number(
      row.tracking_source_id ??
        row.trackingSourceId ??
        row.source_id ??
        0,
    );
    if (!sourceId) continue;

    let source = sources.get(sourceId);
    if (!source) {
      source = {
        id: sourceId,
        name: String(row.source_name ?? row.sourceName ?? ""),
        code: String(row.source_code ?? row.sourceCode ?? ""),
        sourceType: String(row.source_type ?? row.sourceType ?? ""),
        fields: [],
      };
      sources.set(sourceId, source);
    }

    const fieldId = Number(row.field_id ?? row.fieldId ?? 0);
    if (!fieldId) continue;

    let field = source.fields.find((f) => f.id === fieldId);
    if (!field) {
      field = {
        id: fieldId,
        fieldName: String(row.field_name ?? row.fieldName ?? ""),
        fieldKey: String(row.field_key ?? row.fieldKey ?? ""),
        dataType: String(row.data_type ?? row.dataType ?? "text"),
        displayOrder: Number(row.display_order ?? row.displayOrder ?? 0),
        operators: [],
      };
      source.fields.push(field);
    }

    const operatorId = Number(row.operator_id ?? row.operatorId ?? 0);
    if (!operatorId) continue;
    if (field.operators.some((o) => o.id === operatorId)) continue;

    const operator: TrackingSelectorOperator = {
      id: operatorId,
      code: String(row.operator_code ?? row.operatorCode ?? ""),
      symbol: String(row.operator_symbol ?? row.operatorSymbol ?? ""),
      name: String(
        row.operator_name ??
          row.operatorName ??
          row.operator_symbol ??
          row.operatorSymbol ??
          "",
      ),
      displayOrder: Number(row.display_order ?? row.displayOrder ?? 0),
    };
    field.operators.push(operator);
  }

  return Array.from(sources.values()).map((s) => ({
    ...s,
    fields: [...s.fields].sort((a, b) => a.displayOrder - b.displayOrder),
  }));
}

class EngineTrackingSourceService {
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
      throw new Error(await parseErrorResponse(response));
    }

    if (response.status === 204) {
      return undefined as T;
    }

    return response.json();
  }

  /** GET /tracking-sources */
  async getAll(
    params?: EngineTrackingSourceListParams,
  ): Promise<EngineTrackingSource[]> {
    const query = new URLSearchParams();
    if (params?.is_active !== undefined) {
      query.set("is_active", String(params.is_active));
    }
    if (params?.source_type) {
      query.set("source_type", params.source_type);
    }
    if (params?.limit != null) query.set("limit", String(params.limit));
    if (params?.offset != null) query.set("offset", String(params.offset));
    const qs = query.toString();
    const result = await this.request<unknown>(qs ? `?${qs}` : "");
    return unwrapList<Record<string, unknown>>(result).map(normalizeSource);
  }

  /** GET /tracking-sources/search */
  async search(
    params?: EngineTrackingSourceSearchParams,
  ): Promise<EngineTrackingSource[]> {
    const query = new URLSearchParams();
    if (params?.q) query.set("q", params.q);
    if (params?.name) query.set("name", params.name);
    if (params?.code) query.set("code", params.code);
    if (params?.source_type) query.set("source_type", params.source_type);
    if (params?.is_active !== undefined) {
      query.set("is_active", String(params.is_active));
    }
    if (params?.limit != null) query.set("limit", String(params.limit));
    if (params?.offset != null) query.set("offset", String(params.offset));
    const qs = query.toString();
    const result = await this.request<unknown>(
      qs ? `/search?${qs}` : "/search",
    );
    return unwrapList<Record<string, unknown>>(result).map(normalizeSource);
  }

  /** GET /tracking-sources/:id (includes fields) */
  async getById(id: number): Promise<EngineTrackingSource> {
    const result = await this.request<unknown>(`/${id}`);
    const one = unwrapOne<Record<string, unknown>>(result);
    if (!one) throw new Error(`Tracking source ${id} not found`);
    return normalizeSource(one);
  }

  /** POST /tracking-sources */
  async create(
    data: CreateEngineTrackingSourcePayload,
  ): Promise<EngineTrackingSource> {
    const result = await this.request<unknown>("", {
      method: "POST",
      body: JSON.stringify(data),
    });
    const one = unwrapOne<Record<string, unknown>>(result);
    if (!one) throw new Error("Failed to create tracking source");
    return normalizeSource(one);
  }

  /** PUT /tracking-sources/:id */
  async update(
    id: number,
    data: UpdateEngineTrackingSourcePayload,
  ): Promise<EngineTrackingSource> {
    const result = await this.request<unknown>(`/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
    const one = unwrapOne<Record<string, unknown>>(result);
    if (!one) throw new Error(`Failed to update tracking source ${id}`);
    return normalizeSource(one);
  }

  /**
   * DELETE /tracking-sources/:id
   * Soft-delete by default; pass hard=true for hard delete.
   */
  async delete(
    id: number,
    options?: { hard?: boolean },
  ): Promise<{ success: boolean; message?: string }> {
    const qs = options?.hard ? "?hard=true" : "";
    return this.request<{ success: boolean; message?: string }>(`/${id}${qs}`, {
      method: "DELETE",
    });
  }

  /** GET /tracking-sources/selector-config → tree */
  async getSelectorConfig(): Promise<TrackingSelectorSource[]> {
    const result = await this.request<unknown>("/selector-config");
    const rows = unwrapList<TrackingSelectorConfigRow>(result);
    return buildSelectorTree(rows);
  }

  /** Raw flat rows (for debugging / custom grouping) */
  async getSelectorConfigRows(): Promise<TrackingSelectorConfigRow[]> {
    const result = await this.request<unknown>("/selector-config");
    return unwrapList<TrackingSelectorConfigRow>(result);
  }

  /** POST /tracking-sources/:id/fields */
  async addField(
    sourceId: number,
    data: CreateEngineTrackingSourceFieldPayload,
  ): Promise<EngineTrackingSourceField> {
    const result = await this.request<unknown>(`/${sourceId}/fields`, {
      method: "POST",
      body: JSON.stringify(data),
    });
    const one = unwrapOne<Record<string, unknown>>(result);
    if (!one) throw new Error("Failed to add field");
    return normalizeField(one);
  }

  /** PUT /tracking-sources/:id/fields/:fieldId */
  async updateField(
    sourceId: number,
    fieldId: number,
    data: UpdateEngineTrackingSourceFieldPayload,
  ): Promise<EngineTrackingSourceField> {
    const result = await this.request<unknown>(
      `/${sourceId}/fields/${fieldId}`,
      {
        method: "PUT",
        body: JSON.stringify(data),
      },
    );
    const one = unwrapOne<Record<string, unknown>>(result);
    if (!one) throw new Error("Failed to update field");
    return normalizeField(one);
  }

  /** DELETE /tracking-sources/:id/fields/:fieldId (soft) */
  async deleteField(sourceId: number, fieldId: number): Promise<void> {
    await this.request<unknown>(`/${sourceId}/fields/${fieldId}`, {
      method: "DELETE",
    });
  }

  /** POST /tracking-sources/fields/:fieldId/operators */
  async addOperatorToField(
    fieldId: number,
    operatorId: number,
    displayOrder?: number,
  ): Promise<unknown> {
    const result = await this.request<unknown>(
      `/fields/${fieldId}/operators`,
      {
        method: "POST",
        body: JSON.stringify({
          operator_id: operatorId,
          display_order: displayOrder ?? 0,
        }),
      },
    );
    return result;
  }

  /**
   * Resolve an engine source matching offer-catalog type/code heuristics.
   * Used when attaching offer tracking sources so reward mappings can FK correctly.
   */
  async resolveByCodeOrType(
    codeOrType: string,
  ): Promise<EngineTrackingSource | null> {
    const needle = String(codeOrType || "")
      .trim()
      .toLowerCase();
    if (!needle) return null;

    try {
      const byCode = await this.search({ code: needle, is_active: true, limit: 5 });
      const exact = byCode.find((s) => s.code.toLowerCase() === needle);
      if (exact) return exact;
    } catch {
      // fall through to list scan
    }

    try {
      const all = await this.getAll({ is_active: true, limit: 200 });
      return (
        all.find((s) => s.code.toLowerCase() === needle) ||
        all.find((s) => s.sourceType.toLowerCase() === needle) ||
        null
      );
    } catch {
      return null;
    }
  }

  /** Fields for a selector source (or empty). */
  getFieldsForSource(
    tree: TrackingSelectorSource[],
    sourceId: number,
  ): TrackingSelectorField[] {
    return tree.find((s) => s.id === sourceId)?.fields ?? [];
  }

  toSelectOptions(
    sources: EngineTrackingSource[],
  ): { value: string; label: string }[] {
    return sources.map((s) => ({
      value: String(s.id),
      label: `${s.name} (${s.code})`,
    }));
  }
}

export const engineTrackingSourceService = new EngineTrackingSourceService();

export type {
  CreateEngineTrackingSourcePayload,
  EngineTrackingSource,
  EngineTrackingSourceField,
  UpdateEngineTrackingSourcePayload,
} from "../types/engineTrackingSource";
