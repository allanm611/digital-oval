import { extractErrorMessage } from "../../../shared/utils/errorHandler";
import { buildApiUrl, getAuthHeaders } from "../../../shared/services/api";
import type {
  CreateRewardProviderRequest,
  RewardProvider,
  RewardProviderListParams,
  UpdateRewardProviderRequest,
} from "../types/rewardProvider";

const BASE_URL = buildApiUrl("/reward-providers");

class RewardProviderService {
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

  /** GET /reward-providers — active by default; ?include_inactive=true for admin lists */
  async getAll(params?: RewardProviderListParams): Promise<RewardProvider[]> {
    const query = new URLSearchParams();
    if (params?.reward_type) {
      query.set("reward_type", params.reward_type);
    }
    if (params?.include_inactive) {
      query.set("include_inactive", "true");
    }
    const qs = query.toString();
    const result = await this.request<{
      success: boolean;
      data: RewardProvider[];
      total?: number;
    }>(qs ? `?${qs}` : "");
    return result.data || [];
  }

  /** GET /reward-providers/:id */
  async getById(id: number): Promise<RewardProvider> {
    const result = await this.request<{
      success: boolean;
      data: RewardProvider;
    }>(`/${id}`);
    return result.data;
  }

  /** POST /reward-providers */
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

  /** PUT /reward-providers/:id */
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

  /** DELETE /reward-providers/:id — soft-deactivates provider */
  async delete(id: number): Promise<{ success: boolean; message?: string }> {
    return this.request<{ success: boolean; message?: string }>(`/${id}`, {
      method: "DELETE",
    });
  }
}

export const rewardProviderService = new RewardProviderService();

export type {
  CreateRewardProviderRequest,
  RewardProvider,
  RewardProviderListParams,
  UpdateRewardProviderRequest,
} from "../types/rewardProvider";
