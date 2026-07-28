import { extractErrorMessage } from "../../../shared/utils/errorHandler";
import { buildApiUrl, getAuthHeaders } from "../../../shared/services/api";
import type { RuleRewardType } from "../../../shared/data/rewardProviders";

export interface RewardProvider {
  id: number;
  /** Stable key sent as bundle_subscription_track / bundleTrack */
  provider_key: string;
  name: string;
  allowed_reward_types: RuleRewardType[];
  is_active?: boolean;
  description?: string;
  created_at?: string;
  updated_at?: string;
}

export interface CreateRewardProviderRequest {
  provider_key: string;
  name: string;
  allowed_reward_types: RuleRewardType[];
  is_active?: boolean;
  description?: string;
}

export interface UpdateRewardProviderRequest {
  name?: string;
  allowed_reward_types?: RuleRewardType[];
  is_active?: boolean;
  description?: string;
}

const BASE_URL = buildApiUrl("/reward-providers");

class RewardProviderService {
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

    return response.json();
  }

  async getAll(params?: { active_only?: boolean }): Promise<RewardProvider[]> {
    const query = new URLSearchParams();
    if (params?.active_only) {
      query.set("active_only", "true");
    }
    const qs = query.toString();
    const result = await this.request<{
      success: boolean;
      data: RewardProvider[];
    }>(qs ? `?${qs}` : "");
    return result.data || [];
  }

  async getById(id: number): Promise<RewardProvider> {
    const result = await this.request<{
      success: boolean;
      data: RewardProvider;
    }>(`/${id}`);
    return result.data;
  }

  async create(data: CreateRewardProviderRequest): Promise<RewardProvider> {
    const result = await this.request<{
      success: boolean;
      data: RewardProvider;
    }>("", {
      method: "POST",
      body: JSON.stringify(data),
    });
    return result.data;
  }

  async update(
    id: number,
    data: UpdateRewardProviderRequest,
  ): Promise<RewardProvider> {
    const result = await this.request<{
      success: boolean;
      data: RewardProvider;
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
}

export const rewardProviderService = new RewardProviderService();
