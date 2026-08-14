import { extractErrorMessage } from "../../../shared/utils/errorHandler";
import { buildApiUrl, getAuthHeaders } from "../../../shared/services/api";
import type {
  CreateRewardConfigurationRequest,
  RewardConfiguration,
  RewardConfigurationListParams,
  UpdateRewardConfigurationRequest,
} from "../types/rewardConfiguration";

export type {
  CreateRewardConfigurationRequest,
  RewardConfiguration,
  RewardConfigurationListParams,
  UpdateRewardConfigurationRequest,
} from "../types/rewardConfiguration";

/** Canonical path; `/reward-configurations` remains a backend alias. */
const BASE_URL = buildApiUrl("/reward-templates");

function asRecord(value: unknown): Record<string, unknown> {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        return parsed as Record<string, unknown>;
      }
    } catch {
      return {};
    }
  }
  return {};
}

export function normalizeRewardConfiguration(
  raw: unknown,
): RewardConfiguration {
  const item = (raw || {}) as Record<string, unknown>;
  const isDefault =
    item.is_default === true || item.is_default_template === true;

  return {
    id: Number(item.id) || 0,
    name: String(item.name || ""),
    provider_id: Number(item.provider_id) || 0,
    auth_config: asRecord(item.auth_config),
    payload_config: asRecord(item.payload_config),
    is_active: item.is_active !== false,
    is_default: isDefault,
    is_default_template: isDefault,
    created_at: item.created_at != null ? String(item.created_at) : undefined,
    updated_at: item.updated_at != null ? String(item.updated_at) : undefined,
    provider_name:
      item.provider_name != null ? String(item.provider_name) : undefined,
    reward_type:
      item.reward_type != null ? String(item.reward_type) : undefined,
    api_path: item.api_path != null ? String(item.api_path) : undefined,
    request_template:
      item.request_template && typeof item.request_template === "object"
        ? (item.request_template as Record<string, unknown>)
        : undefined,
  };
}

class RewardConfigurationService {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
  ): Promise<T> {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders(),
        ...options.headers,
      },
      ...options,
    });

    const errorBody = await response.text();
    if (!response.ok) {
      throw new Error(extractErrorMessage(errorBody, response.status));
    }

    if (!errorBody) {
      return {} as T;
    }

    let payload: T & { success?: boolean; error?: string; message?: string };
    try {
      payload = JSON.parse(errorBody);
    } catch {
      throw new Error(extractErrorMessage(errorBody, response.status));
    }

    if (payload?.success === false) {
      throw new Error(
        payload.error || payload.message || "Request failed",
      );
    }

    return payload;
  }

  /** GET /reward-templates — optional ?provider_id= filter */
  async getAll(
    params?: RewardConfigurationListParams,
  ): Promise<RewardConfiguration[]> {
    const query = new URLSearchParams();
    if (params?.provider_id != null) {
      query.set("provider_id", String(params.provider_id));
    }
    if (params?.include_inactive) {
      query.set("include_inactive", "true");
    }
    const qs = query.toString();
    const result = await this.request<{
      success: boolean;
      data: unknown[];
      total?: number;
    }>(qs ? `?${qs}` : "");
    return (result.data || []).map(normalizeRewardConfiguration);
  }

  /** GET /reward-templates/:id */
  async getById(id: number): Promise<RewardConfiguration> {
    const result = await this.request<{
      success: boolean;
      data: unknown;
    }>(`/${id}`);
    return normalizeRewardConfiguration(result.data);
  }

  /** POST /reward-templates */
  async create(
    data: CreateRewardConfigurationRequest,
  ): Promise<RewardConfiguration> {
    const result = await this.request<{
      success: boolean;
      data: unknown;
    }>("", {
      method: "POST",
      body: JSON.stringify(data),
    });
    return normalizeRewardConfiguration(result.data);
  }

  /** PUT /reward-templates/:id */
  async update(
    id: number,
    data: UpdateRewardConfigurationRequest,
  ): Promise<RewardConfiguration> {
    const result = await this.request<{
      success: boolean;
      data: unknown;
    }>(`/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
    return normalizeRewardConfiguration(result.data);
  }

  /**
   * POST /reward-templates/:id/duplicate
   * Creates an independent copy named "{original} - copy" with
   * is_default_template = false.
   */
  async duplicate(id: number): Promise<RewardConfiguration> {
    const result = await this.request<{
      success: boolean;
      message?: string;
      data: unknown;
    }>(`/${id}/duplicate`, {
      method: "POST",
    });
    return normalizeRewardConfiguration(result.data);
  }

  /** DELETE /reward-templates/:id */
  async delete(id: number): Promise<{ success: boolean; message?: string }> {
    return this.request<{ success: boolean; message?: string }>(`/${id}`, {
      method: "DELETE",
    });
  }
}

export const rewardConfigurationService = new RewardConfigurationService();
