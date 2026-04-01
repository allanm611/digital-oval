import { fetchWithAuthInterceptor } from "../../../shared/services/fetchInterceptor";
import { API_CONFIG } from "../../../shared/services/api";
import { ApiResponse } from "../../../shared/types/api";

export interface RewardType {
  id: number;
  name: string;
  description?: string;
  reward_key: string;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
  created_by?: string;
  updated_by?: string;
}

export interface CreateRewardTypeRequest {
  name: string;
  description?: string;
  reward_key: string;
  is_active?: boolean;
}

export interface UpdateRewardTypeRequest {
  name?: string;
  description?: string;
  is_active?: boolean;
}

class RewardTypeService {
  private baseUrl = `${API_CONFIG.BASE_URL}/reward-types`;

  async request<T>(
    endpoint: string,
    options?: RequestInit
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = {
      "Content-Type": "application/json",
      ...options?.headers,
    };

    const response = await fetchWithAuthInterceptor(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `HTTP ${response.status}`);
    }

    return response.json();
  }

  // Get all reward types (fresh data)
  async getAllRewardTypes(): Promise<ApiResponse<RewardType[]>> {
    return this.request<ApiResponse<RewardType[]>>("");
  }

  // Create new reward type
  async createRewardType(
    data: CreateRewardTypeRequest
  ): Promise<ApiResponse<RewardType>> {
    return this.request<ApiResponse<RewardType>>("");
  }

  // Update reward type
  async updateRewardType(
    id: number,
    data: UpdateRewardTypeRequest
  ): Promise<ApiResponse<RewardType>> {
    return this.request<ApiResponse<RewardType>>(`/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  // Delete reward type
  async deleteRewardType(id: number): Promise<ApiResponse<{ message: string }>> {
    return this.request<ApiResponse<{ message: string }>>(`/${id}`, {
      method: "DELETE",
    });
  }
}

export const rewardTypeService = new RewardTypeService();
