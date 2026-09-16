import { API_CONFIG, buildApiUrl, getAuthHeaders } from "../../../shared/services/api";
import {
  DEFAULT_AI_MAX_OUTPUT_TOKENS,
  DEFAULT_AI_TEMPERATURE,
  DEFAULT_AI_TIMEOUT_MS,
  getAiModelProvider,
  isAiModelProviderId,
} from "../constants/aiModelProviders";
import type {
  AiModelConfiguration,
  AiModelConfigurationRecord,
  AiModelGenerateOption,
  AiModelProviderId,
  UpsertAiModelConfigurationRequest,
} from "../types/aiModelConfiguration";

const API_BASE = buildApiUrl(API_CONFIG.ENDPOINTS.AI_MODEL_CONFIGURATIONS);
const LOCAL_STORAGE_KEY = "sentra.aiModelConfigurations.v1";

function maskApiKey(key: string | undefined): string | undefined {
  const value = String(key || "").trim();
  if (!value) return undefined;
  if (value.length <= 8) return "••••••••";
  return `•••• ${value.slice(-4)}`;
}

function toPublic(record: AiModelConfigurationRecord): AiModelConfiguration {
  const { api_key, ...rest } = record;
  return {
    ...rest,
    has_api_key: Boolean(record.has_api_key || api_key),
    api_key_masked: record.api_key_masked || maskApiKey(api_key),
  };
}

function toGenerateOption(config: AiModelConfiguration): AiModelGenerateOption {
  return {
    id: config.id,
    provider_id: config.provider_id,
    name: config.name,
    model: config.model,
    is_default: Boolean(config.is_default),
  };
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

function asNumber(value: unknown, fallback: number): number {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
}

function normalizeRecord(raw: unknown): AiModelConfigurationRecord | null {
  if (!raw || typeof raw !== "object") return null;
  const data = raw as Record<string, unknown>;
  const providerRaw = String(data.provider_id || data.providerId || data.id || "");
  if (!isAiModelProviderId(providerRaw)) return null;
  const provider = getAiModelProvider(providerRaw);
  const apiKey = String(data.api_key || data.apiKey || "").trim();
  const name = String(data.name || provider?.name || providerRaw).trim();
  const model = String(data.model || provider?.defaultModel || "").trim();

  return {
    id: String(data.id || providerRaw),
    provider_id: providerRaw,
    name: name || providerRaw,
    model,
    has_api_key: Boolean(data.has_api_key ?? data.hasApiKey ?? apiKey),
    api_key: apiKey || undefined,
    api_key_masked: String(data.api_key_masked || data.apiKeyMasked || "") || maskApiKey(apiKey),
    base_url: String(data.base_url || data.baseUrl || provider?.defaultBaseUrl || "") || undefined,
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
    created_at: data.created_at ? String(data.created_at) : data.createdAt ? String(data.createdAt) : undefined,
    updated_at: data.updated_at ? String(data.updated_at) : data.updatedAt ? String(data.updatedAt) : undefined,
  };
}

function readLocal(): AiModelConfigurationRecord[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map(normalizeRecord)
      .filter((item): item is AiModelConfigurationRecord => Boolean(item));
  } catch {
    return [];
  }
}

function writeLocal(items: AiModelConfigurationRecord[]): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(items));
  } catch {
    // ignore quota / private mode
  }
}

function applyDefaultFlag(
  items: AiModelConfigurationRecord[],
  providerId: AiModelProviderId,
  isDefault: boolean,
): AiModelConfigurationRecord[] {
  if (!isDefault) return items;
  return items.map((item) => ({
    ...item,
    is_default: item.provider_id === providerId,
  }));
}

class AiModelConfigurationService {
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers: {
        ...getAuthHeaders(),
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

  private shouldUseLocalFallback(error: unknown): boolean {
    const status = (error as { status?: number })?.status;
    return !status || status === 404 || status === 501 || status >= 500;
  }

  async list(): Promise<AiModelConfiguration[]> {
    try {
      const payload = await this.request<unknown>("");
      const list = unwrapList(payload)
        .map(normalizeRecord)
        .filter((item): item is AiModelConfigurationRecord => Boolean(item))
        .map(toPublic);
      return list;
    } catch (error) {
      if (!this.shouldUseLocalFallback(error)) throw error;
    }
    return readLocal().map(toPublic);
  }

  async getByProvider(
    providerId: AiModelProviderId,
  ): Promise<AiModelConfiguration | null> {
    try {
      const payload = await this.request<unknown>(
        `/${encodeURIComponent(providerId)}`,
      );
      const one = unwrapOne(payload);
      const record = one ? normalizeRecord(one) : null;
      return record ? toPublic(record) : null;
    } catch (error) {
      if (!this.shouldUseLocalFallback(error)) throw error;
    }
    const local = readLocal().find((item) => item.provider_id === providerId);
    return local ? toPublic(local) : null;
  }

  async upsert(
    providerId: AiModelProviderId,
    data: UpsertAiModelConfigurationRequest,
  ): Promise<AiModelConfiguration> {
    const provider = getAiModelProvider(providerId);
    const body = {
      provider_id: providerId,
      name: data.name.trim() || provider?.name || providerId,
      model: data.model.trim(),
      api_key: data.api_key?.trim() || undefined,
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

    try {
      const payload = await this.request<unknown>(`/${encodeURIComponent(providerId)}`, {
        method: "PUT",
        body: JSON.stringify(body),
      });
      const saved = unwrapOne(payload);
      if (saved) {
        const record = normalizeRecord(saved);
        if (record) return toPublic(record);
      }
      throw new Error("Save succeeded but the response had no configuration");
    } catch (error) {
      if (!this.shouldUseLocalFallback(error)) throw error;
    }

    const now = new Date().toISOString();
    const existing = readLocal();
    const previous = existing.find((item) => item.provider_id === providerId);
    const nextRecord: AiModelConfigurationRecord = {
      id: providerId,
      provider_id: providerId,
      name: body.name,
      model: body.model,
      has_api_key: Boolean(body.api_key || previous?.api_key),
      api_key: body.api_key || previous?.api_key,
      api_key_masked: maskApiKey(body.api_key || previous?.api_key),
      base_url: body.base_url || previous?.base_url,
      organization: body.organization || previous?.organization,
      api_version: body.api_version || previous?.api_version,
      project_id: body.project_id || previous?.project_id,
      temperature: body.temperature,
      max_output_tokens: body.max_output_tokens,
      timeout_ms: body.timeout_ms,
      is_active: body.is_active,
      is_default: body.is_default,
      created_at: previous?.created_at || now,
      updated_at: now,
    };

    const withoutCurrent = existing.filter((item) => item.provider_id !== providerId);
    writeLocal(applyDefaultFlag([...withoutCurrent, nextRecord], providerId, body.is_default));
    return toPublic(nextRecord);
  }

  async listForGenerate(): Promise<AiModelGenerateOption[]> {
    const configs = await this.list();
    return configs
      .filter((config) => config.is_active && config.has_api_key && config.model)
      .sort((a, b) => Number(b.is_default) - Number(a.is_default) || a.name.localeCompare(b.name))
      .map(toGenerateOption);
  }
}

export const aiModelConfigurationService = new AiModelConfigurationService();
