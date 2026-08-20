import { extractErrorMessage } from "../../../shared/utils/errorHandler";
import { buildApiUrl, getAuthHeaders } from "../../../shared/services/api";

export interface GatewayProviderField {
  name: string;
  label: string;
  type: "text" | "password" | "number" | "boolean" | "select";
  required?: boolean;
  placeholder?: string;
  options?: string[];
  /** Seeded into new gateway configurations when the field is empty. */
  default?: string | number | boolean;
}

export interface GatewayProviderFieldSchema {
  protocol?: string;
  fields: GatewayProviderField[];
}

export interface GatewayProvider {
  id: number;
  name: string;
  channel_id?: number;
  protocol?: string;
  field_schema?: GatewayProviderFieldSchema;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
  channel_value?: string;
  channel_label?: string;
}

export interface CreateGatewayProviderRequest {
  name: string;
  channel_id: number;
  protocol: string;
  field_schema: GatewayProviderFieldSchema;
  is_active?: boolean;
}

export interface UpdateGatewayProviderRequest {
  name?: string;
  channel_id?: number;
  protocol?: string;
  field_schema?: GatewayProviderFieldSchema;
  is_active?: boolean;
}

export interface GatewayProtocolPreset {
  protocol: string;
  fields: GatewayProviderField[];
}

export interface SupportedGatewayProtocol {
  protocol: string;
  field_schema: GatewayProtocolPreset;
}

const BASE_URL = buildApiUrl("/gateway-providers");
const PROTOCOLS_CACHE_TTL_MS = 5 * 60 * 1000;

let supportedProtocolsCache: {
  data: SupportedGatewayProtocol[];
  fetchedAt: number;
} | null = null;

const protocolPresetCache = new Map<string, GatewayProtocolPreset>();

function isAbortError(error: unknown): boolean {
  return (
    (error instanceof DOMException && error.name === "AbortError") ||
    (error instanceof Error && error.name === "AbortError")
  );
}

function normalizeProtocolCode(value?: string | null): string {
  return (value || "").trim().toLowerCase();
}

function cloneFields(fields: GatewayProviderField[] = []): GatewayProviderField[] {
  return fields.map((field) => ({
    ...field,
    options: field.options ? [...field.options] : undefined,
  }));
}

function asFieldList(value: unknown): GatewayProviderField[] {
  return Array.isArray(value) ? (value as GatewayProviderField[]) : [];
}

function normalizePreset(
  protocol: string,
  schema?: Partial<GatewayProtocolPreset> | GatewayProviderFieldSchema | null,
): GatewayProtocolPreset {
  const code = normalizeProtocolCode(schema?.protocol || protocol);
  return {
    protocol: code,
    fields: cloneFields(asFieldList(schema?.fields)),
  };
}

function normalizeSupportedProtocol(item: unknown): SupportedGatewayProtocol | null {
  if (!item || typeof item !== "object") return null;
  const raw = item as {
    protocol?: string;
    field_schema?: GatewayProtocolPreset | GatewayProviderFieldSchema;
    fields?: GatewayProviderField[];
  };
  const protocol = normalizeProtocolCode(raw.protocol || raw.field_schema?.protocol);
  if (!protocol) return null;
  const preset = normalizePreset(protocol, {
    protocol,
    fields: raw.field_schema?.fields || raw.fields || [],
  });
  return {
    protocol,
    field_schema: preset,
  };
}

function rememberPreset(preset: GatewayProtocolPreset) {
  if (!preset.protocol) return;
  protocolPresetCache.set(preset.protocol, {
    protocol: preset.protocol,
    fields: cloneFields(preset.fields),
  });
}

function rememberSupportedProtocols(items: SupportedGatewayProtocol[]) {
  supportedProtocolsCache = {
    data: items.map((item) => ({
      protocol: item.protocol,
      field_schema: {
        protocol: item.field_schema.protocol,
        fields: cloneFields(item.field_schema.fields),
      },
    })),
    fetchedAt: Date.now(),
  };
  items.forEach((item) => rememberPreset(item.field_schema));
}

class GatewayProviderService {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
  ): Promise<T> {
    const { headers, ...rest } = options;
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      ...rest,
      headers: {
        ...getAuthHeaders(),
        ...(headers || {}),
      },
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(extractErrorMessage(errorBody, response.status));
    }

    return response.json();
  }

  async getAll(params?: {
    channel_id?: number;
  }): Promise<GatewayProvider[]> {
    const query = new URLSearchParams();
    if (params?.channel_id != null) {
      query.set("channel_id", String(params.channel_id));
    }
    const qs = query.toString();
    const result = await this.request<{
      success: boolean;
      data: GatewayProvider[];
    }>(qs ? `?${qs}` : "");
    return result.data || [];
  }

  async getById(id: number): Promise<GatewayProvider> {
    const result = await this.request<{
      success: boolean;
      data: GatewayProvider;
    }>(`/${id}`);
    if (!result.data) {
      throw new Error("Gateway provider not found");
    }
    return result.data;
  }

  async create(data: CreateGatewayProviderRequest): Promise<GatewayProvider> {
    const result = await this.request<{
      success: boolean;
      data: GatewayProvider;
    }>("", {
      method: "POST",
      body: JSON.stringify(data),
    });
    return result.data;
  }

  async update(
    id: number,
    data: UpdateGatewayProviderRequest,
  ): Promise<GatewayProvider> {
    const result = await this.request<{
      success: boolean;
      data: GatewayProvider;
    }>(`/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
    return result.data;
  }

  async delete(id: number): Promise<void> {
    await this.request<{ success: boolean; message?: string }>(`/${id}`, {
      method: "DELETE",
    });
  }

  /**
   * GET /gateway-providers/protocols
   * Backend is the source of truth for supported protocols and default fields.
   */
  async getSupportedProtocols(options?: {
    force?: boolean;
    signal?: AbortSignal;
  }): Promise<SupportedGatewayProtocol[]> {
    const cacheIsFresh =
      !options?.force &&
      supportedProtocolsCache &&
      Date.now() - supportedProtocolsCache.fetchedAt < PROTOCOLS_CACHE_TTL_MS;

    if (cacheIsFresh && supportedProtocolsCache) {
      return supportedProtocolsCache.data.map((item) => ({
        protocol: item.protocol,
        field_schema: {
          protocol: item.field_schema.protocol,
          fields: cloneFields(item.field_schema.fields),
        },
      }));
    }

    try {
      const result = await this.request<{
        success: boolean;
        data?: unknown[];
      }>("/protocols", { signal: options?.signal });

      const protocols = (result.data || [])
        .map(normalizeSupportedProtocol)
        .filter((item): item is SupportedGatewayProtocol => Boolean(item));

      rememberSupportedProtocols(protocols);
      return protocols;
    } catch (error) {
      if (isAbortError(error)) throw error;
      if (supportedProtocolsCache?.data?.length) {
        return supportedProtocolsCache.data.map((item) => ({
          protocol: item.protocol,
          field_schema: {
            protocol: item.field_schema.protocol,
            fields: cloneFields(item.field_schema.fields),
          },
        }));
      }
      throw error;
    }
  }

  /**
   * GET /gateway-providers/protocols/:protocol
   * Used on cache miss and when resetting a provider to protocol defaults.
   */
  async getProtocolPreset(
    protocol: string,
    options?: { signal?: AbortSignal; skipCache?: boolean },
  ): Promise<GatewayProtocolPreset> {
    const code = normalizeProtocolCode(protocol);
    if (!code) {
      throw new Error("Protocol is required");
    }
    if (code === "custom") {
      return { protocol: "custom", fields: [] };
    }

    if (!options?.skipCache) {
      const cached = protocolPresetCache.get(code);
      if (cached) {
        return {
          protocol: cached.protocol,
          fields: cloneFields(cached.fields),
        };
      }
    }

    const result = await this.request<{
      success: boolean;
      protocol?: string;
      field_schema?: GatewayProtocolPreset | GatewayProviderFieldSchema;
    }>(`/protocols/${encodeURIComponent(code)}`, {
      signal: options?.signal,
    });

    const preset = normalizePreset(
      result.protocol || code,
      result.field_schema,
    );
    rememberPreset(preset);
    return preset;
  }
}

export const gatewayProviderService = new GatewayProviderService();
