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

const BASE_URL = buildApiUrl("/reward-configurations");

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

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(extractErrorMessage(errorBody, response.status));
    }

    return response.json();
  }

  /** GET /reward-configurations — active configurations only; optional ?provider_id= filter */
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
      data: RewardConfiguration[];
      total?: number;
    }>(qs ? `?${qs}` : "");
    return result.data || [];
  }

  /** GET /reward-configurations/:id */
  async getById(id: number): Promise<RewardConfiguration> {
    const result = await this.request<{
      success: boolean;
      data: RewardConfiguration;
    }>(`/${id}`);
    return result.data;
  }

  /** POST /reward-configurations */
  async create(
    data: CreateRewardConfigurationRequest,
  ): Promise<RewardConfiguration> {
    const result = await this.request<{
      success: boolean;
      data: RewardConfiguration;
    }>("", {
      method: "POST",
      body: JSON.stringify(data),
    });
    return result.data;
  }

  /** PUT /reward-configurations/:id */
  async update(
    id: number,
    data: UpdateRewardConfigurationRequest,
  ): Promise<RewardConfiguration> {
    const result = await this.request<{
      success: boolean;
      data: RewardConfiguration;
    }>(`/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
    return result.data;
  }

  /** DELETE /reward-configurations/:id */
  async delete(id: number): Promise<{ success: boolean; message?: string }> {
    return this.request<{ success: boolean; message?: string }>(`/${id}`, {
      method: "DELETE",
    });
  }
}

export const rewardConfigurationService = new RewardConfigurationService();
