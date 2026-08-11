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
    const obj = payload as Record<string, unknown>;
    for (const key of ["data", "items", "results", "sources", "rows"]) {
      const candidate = obj[key];
      if (Array.isArray(candidate)) return candidate as T[];
      if (candidate && typeof candidate === "object") {
        const nested = candidate as Record<string, unknown>;
        for (const nestedKey of ["data", "items", "results", "sources", "rows"]) {
          if (Array.isArray(nested[nestedKey])) {
            return nested[nestedKey] as T[];
          }
        }
      }
    }
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

function normalizeOperator(
  raw: Record<string, unknown>,
): TrackingSelectorOperator | null {
  const id = Number(raw.id ?? raw.operator_id ?? raw.operatorId ?? 0);
  if (!id) return null;
  return {
    id,
    code: String(raw.code ?? raw.operator_code ?? raw.operatorCode ?? ""),
    symbol: String(
      raw.symbol ?? raw.operator_symbol ?? raw.operatorSymbol ?? "",
    ),
    name: String(
      raw.name ??
        raw.operator_name ??
        raw.operatorName ??
        raw.symbol ??
        raw.operator_symbol ??
        raw.operatorSymbol ??
        "",
    ),
    displayOrder: Number(
      raw.displayOrder ?? raw.display_order ?? raw.operator_display_order ?? 0,
    ),
  };
}

function normalizeFieldOperators(
  raw: Record<string, unknown>,
): TrackingSelectorOperator[] {
  const operatorsRaw =
    raw.operators ?? raw.field_operators ?? raw.fieldOperators ?? [];
  if (!Array.isArray(operatorsRaw)) return [];
  const out: TrackingSelectorOperator[] = [];
  for (const item of operatorsRaw) {
    if (!item || typeof item !== "object") continue;
    const op = normalizeOperator(item as Record<string, unknown>);
    if (op && !out.some((existing) => existing.id === op.id)) {
      out.push(op);
    }
  }
  return out.sort((a, b) => a.displayOrder - b.displayOrder);
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

/** Convert catalog fields (from list/detail) into selector-tree fields. */
export function fieldsToSelectorFields(
  fields: EngineTrackingSourceField[] | undefined | null,
  operatorsByFieldId?: Map<number, TrackingSelectorOperator[]>,
): TrackingSelectorField[] {
  if (!fields?.length) return [];
  return fields
    .filter((f) => f.isActive !== false)
    .map((f) => ({
      id: f.id,
      fieldName: f.fieldName,
      fieldKey: f.fieldKey,
      dataType: String(f.dataType),
      displayOrder: f.displayOrder,
      operators: operatorsByFieldId?.get(f.id) ?? [],
    }))
    .sort((a, b) => a.displayOrder - b.displayOrder);
}

export function sourceToSelectorSource(
  source: EngineTrackingSource,
  operatorsByFieldId?: Map<number, TrackingSelectorOperator[]>,
): TrackingSelectorSource {
  return {
    id: source.id,
    name: source.name,
    code: source.code,
    sourceType: String(source.sourceType),
    fields: fieldsToSelectorFields(source.fields, operatorsByFieldId),
  };
}

/**
 * Merge catalog fields into the selector tree without wiping richer operator data.
 * Prefer existing tree field operators when present; fill missing fields from catalog.
 */
export function mergeSourcesIntoSelectorTree(
  tree: TrackingSelectorSource[],
  sources: EngineTrackingSource[],
): TrackingSelectorSource[] {
  if (!sources.length) return tree;
  const byId = new Map(tree.map((s) => [s.id, { ...s, fields: [...s.fields] }]));

  for (const source of sources) {
    const activeFields = (source.fields || []).filter(
      (f) => f.isActive !== false,
    );
    if (!activeFields.length && !byId.has(source.id)) continue;

    const existing = byId.get(source.id);
    if (!existing) {
      byId.set(source.id, sourceToSelectorSource(source));
      continue;
    }

    const fieldMap = new Map(existing.fields.map((f) => [f.id, { ...f }]));
    for (const field of activeFields) {
      const prev = fieldMap.get(field.id);
      if (prev) {
        fieldMap.set(field.id, {
          ...prev,
          fieldName: field.fieldName || prev.fieldName,
          fieldKey: field.fieldKey || prev.fieldKey,
          dataType: String(field.dataType || prev.dataType),
          displayOrder: field.displayOrder ?? prev.displayOrder,
          operators: prev.operators?.length ? prev.operators : [],
        });
      } else {
        fieldMap.set(field.id, {
          id: field.id,
          fieldName: field.fieldName,
          fieldKey: field.fieldKey,
          dataType: String(field.dataType),
          displayOrder: field.displayOrder,
          operators: [],
        });
      }
    }

    byId.set(source.id, {
      id: source.id,
      name: source.name || existing.name,
      code: source.code || existing.code,
      sourceType: String(source.sourceType || existing.sourceType),
      fields: Array.from(fieldMap.values()).sort(
        (a, b) => a.displayOrder - b.displayOrder,
      ),
    });
  }

  return Array.from(byId.values());
}

function looksLikeNestedSelectorSource(item: unknown): boolean {
  if (!item || typeof item !== "object") return false;
  const obj = item as Record<string, unknown>;
  return (
    (obj.id != null || obj.tracking_source_id != null || obj.trackingSourceId != null) &&
    (Array.isArray(obj.fields) || Array.isArray(obj.parameters))
  );
}

/**
 * Parse nested selector-config payloads shaped as Sources → Fields → Operators.
 */
export function parseNestedSelectorTree(
  items: unknown[],
): TrackingSelectorSource[] {
  const sources: TrackingSelectorSource[] = [];

  for (const item of items) {
    if (!looksLikeNestedSelectorSource(item)) continue;
    const raw = item as Record<string, unknown>;
    const sourceId = Number(
      raw.id ?? raw.tracking_source_id ?? raw.trackingSourceId ?? 0,
    );
    if (!sourceId) continue;

    const fieldsRaw = (raw.fields ?? raw.parameters ?? []) as unknown[];
    const fields: TrackingSelectorField[] = [];

    for (const fieldItem of fieldsRaw) {
      if (!fieldItem || typeof fieldItem !== "object") continue;
      const fieldRaw = fieldItem as Record<string, unknown>;
      const fieldId = Number(fieldRaw.id ?? fieldRaw.field_id ?? fieldRaw.fieldId ?? 0);
      if (!fieldId) continue;
      if (fieldRaw.isActive === false || fieldRaw.is_active === false) continue;

      fields.push({
        id: fieldId,
        fieldName: String(fieldRaw.fieldName ?? fieldRaw.field_name ?? ""),
        fieldKey: String(fieldRaw.fieldKey ?? fieldRaw.field_key ?? ""),
        dataType: String(fieldRaw.dataType ?? fieldRaw.data_type ?? "text"),
        displayOrder: Number(
          fieldRaw.displayOrder ?? fieldRaw.display_order ?? 0,
        ),
        operators: normalizeFieldOperators(fieldRaw),
      });
    }

    sources.push({
      id: sourceId,
      name: String(raw.name ?? raw.source_name ?? raw.sourceName ?? ""),
      code: String(raw.code ?? raw.source_code ?? raw.sourceCode ?? ""),
      sourceType: String(
        raw.sourceType ?? raw.source_type ?? raw.sourceType ?? "",
      ),
      fields: fields.sort((a, b) => a.displayOrder - b.displayOrder),
    });
  }

  return sources;
}

/**
 * Normalize any selector-config API payload into Sources → Fields → Operators.
 */
export function parseSelectorConfigPayload(
  payload: unknown,
): TrackingSelectorSource[] {
  const items = unwrapList<unknown>(payload);
  if (!items.length) return [];

  if (items.some(looksLikeNestedSelectorSource)) {
    const nested = parseNestedSelectorTree(items);
    if (nested.length) return nested;
  }

  return buildSelectorTree(items as TrackingSelectorConfigRow[]);
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

  /** GET /tracking-sources/selector-config → tree (flat rows or nested sources) */
  async getSelectorConfig(): Promise<TrackingSelectorSource[]> {
    const result = await this.request<unknown>("/selector-config");
    return parseSelectorConfigPayload(result);
  }

  /** Raw flat rows (for debugging / custom grouping) */
  async getSelectorConfigRows(): Promise<TrackingSelectorConfigRow[]> {
    const result = await this.request<unknown>("/selector-config");
    return unwrapList<TrackingSelectorConfigRow>(result);
  }

  /**
   * GET /tracking-sources/:id as a selector source (fields + nested operators when present).
   * Used to enrich parameter counts / rule builders when selector-config is sparse.
   */
  async getSelectorSourceById(id: number): Promise<TrackingSelectorSource> {
    const result = await this.request<unknown>(`/${id}`);
    const one = unwrapOne<Record<string, unknown>>(result);
    if (!one) throw new Error(`Tracking source ${id} not found`);

    const nested = parseNestedSelectorTree([one]);
    if (nested[0]?.fields?.length) {
      return nested[0];
    }

    return sourceToSelectorSource(normalizeSource(one));
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
