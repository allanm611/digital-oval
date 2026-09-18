import { API_CONFIG, buildApiUrl, getAuthHeaders } from "../../../shared/services/api";
import {
  DEFAULT_AI_MAX_OUTPUT_TOKENS,
  DEFAULT_AI_TEMPERATURE,
  DEFAULT_AI_TIMEOUT_MS,
  getAiModelProvider,
  isAiModelProviderId,
} from "../constants/aiModelProviders";
import type {
  AiModelConfigSource,
  AiModelConfiguration,
  AiModelGenerateOption,
  AiModelProviderId,
  UpsertAiModelConfigurationRequest,
} from "../types/aiModelConfiguration";

const API_BASE = buildApiUrl(API_CONFIG.ENDPOINTS.AI_MODEL_CONFIGURATIONS);
// const API_BASE = "http://localhost:11008/ai-model-configurations";

export class AiModelApiError extends Error {
  status?: number;
  code?: string;
}

function asNumber(value: unknown, fallback: number): number {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
}

function asSource(value: unknown): AiModelConfigSource | undefined {
  if (value === "environment" || value === "database") return value;
  return undefined;
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
  const obj = payload as { data?: unknown };
  if (obj.data != null && typeof obj.data === "object" && !Array.isArray(obj.data)) {
    return obj.data;
  }
  if ("id" in obj || "provider_id" in obj) return obj;
  return null;
}

function normalizeRecord(raw: unknown): AiModelConfiguration | null {
  if (!raw || typeof raw !== "object") return null;
  const data = raw as Record<string, unknown>;
  const providerRaw = String(data.provider_id || data.providerId || data.id || "");
  if (!isAiModelProviderId(providerRaw)) return null;
  const provider = getAiModelProvider(providerRaw);

  return {
    id: String(data.id || providerRaw),
    provider_id: providerRaw,
    name: String(data.name || provider?.name || providerRaw).trim() || providerRaw,
    model: String(data.model || provider?.defaultModel || "").trim(),
    has_api_key: Boolean(data.has_api_key ?? data.hasApiKey),
    api_key_masked: String(data.api_key_masked || data.apiKeyMasked || "") || undefined,
    base_url: String(data.base_url || data.baseUrl || "") || undefined,
    organization: String(data.organization || "") || undefined,
    api_version: String(data.api_version || data.apiVersion || "") || undefined,
    project_id: String(data.project_id || data.projectId || "") || undefined,
    temperature: asNumber(data.temperature, DEFAULT_AI_TEMPERATURE),
    max_output_tokens: asNumber(
      data.max_output_tokens ?? data.maxOutputTokens,
      DEFAULT_AI_MAX_OUTPUT_TOKENS,
    ),
    timeout_ms: asNumber(data.timeout_ms ?? data.timeoutMs, DEFAULT_AI_TIMEOUT_MS),
    is_active: data.is_active !== false && data.isActive !== false,
    is_default: Boolean(data.is_default ?? data.isDefault),
    source: asSource(data.source),
    force_ipv4:
      data.force_ipv4 === true || data.forceIpv4 === true
        ? true
        : data.force_ipv4 === false || data.forceIpv4 === false
          ? false
          : undefined,
    created_at: data.created_at
      ? String(data.created_at)
      : data.createdAt
        ? String(data.createdAt)
        : undefined,
    updated_at: data.updated_at
      ? String(data.updated_at)
      : data.updatedAt
        ? String(data.updatedAt)
        : undefined,
  };
}

function toGenerateOption(config: AiModelConfiguration): AiModelGenerateOption {
  return {
    id: config.id,
    provider_id: config.provider_id,
    name: config.name,
    model: config.model,
    is_default: Boolean(config.is_default),
    source: config.source,
  };
}

class AiModelConfigurationService {
  private async request(endpoint: string, options: RequestInit = {}): Promise<unknown> {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers: {
        ...getAuthHeaders(),
        ...options.headers,
      },
    });

    let payload: unknown = {};
    const contentType = response.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      payload = await response.json().catch(() => ({}));
    } else if (response.status !== 204) {
      const text = await response.text();
      payload = text ? { error: text } : {};
    }

    if (!response.ok) {
      const body = payload as { error?: string; message?: string; code?: string };
      const err = new AiModelApiError(
        body.error || body.message || `HTTP ${response.status}`,
      );
      err.status = response.status;
      err.code = body.code;
      throw err;
    }

    if (response.status === 204) return undefined;
    return payload;
  }

  async list(): Promise<AiModelConfiguration[]> {
    const payload = await this.request("");
    return unwrapList(payload)
      .map(normalizeRecord)
      .filter((item): item is AiModelConfiguration => Boolean(item));
  }

  async getByProvider(providerId: AiModelProviderId): Promise<AiModelConfiguration | null> {
    try {
      const payload = await this.request(`/${encodeURIComponent(providerId)}`);
      const record = normalizeRecord(unwrapOne(payload));
      return record;
    } catch (error) {
      if (error instanceof AiModelApiError && error.status === 404) {
        return null;
      }
      throw error;
    }
  }

  async upsert(
    providerId: AiModelProviderId,
    data: UpsertAiModelConfigurationRequest,
  ): Promise<AiModelConfiguration> {
    const provider = getAiModelProvider(providerId);
    const body: Record<string, unknown> = {
      provider_id: providerId,
      name: data.name.trim() || provider?.name || providerId,
      model: data.model.trim(),
      base_url: data.base_url?.trim() || undefined,
      organization: data.organization?.trim() || undefined,
      api_version: data.api_version?.trim() || undefined,
      project_id: data.project_id?.trim() || undefined,
      temperature: data.temperature ?? DEFAULT_AI_TEMPERATURE,
      max_output_tokens: data.max_output_tokens ?? DEFAULT_AI_MAX_OUTPUT_TOKENS,
      timeout_ms: data.timeout_ms ?? DEFAULT_AI_TIMEOUT_MS,
      is_active: data.is_active !== false,
      is_default: Boolean(data.is_default),
    };

    const apiKey = data.api_key?.trim();
    if (apiKey) {
      body.api_key = apiKey;
    }

    const payload = await this.request(`/${encodeURIComponent(providerId)}`, {
      method: "PUT",
      body: JSON.stringify(body),
    });
    const saved = normalizeRecord(unwrapOne(payload));
    if (!saved) {
      throw new AiModelApiError("Save succeeded but the response had no configuration");
    }
    return saved;
  }

  async delete(providerId: AiModelProviderId): Promise<void> {
    await this.request(`/${encodeURIComponent(providerId)}`, { method: "DELETE" });
  }

  async listForGenerate(): Promise<AiModelGenerateOption[]> {
    const configs = await this.list();
    return configs
      .filter((config) => config.is_active && config.has_api_key && config.model)
      .sort(
        (a, b) =>
          Number(b.is_default) - Number(a.is_default) || a.name.localeCompare(b.name),
      )
      .map(toGenerateOption);
  }
}

export const aiModelConfigurationService = new AiModelConfigurationService();
