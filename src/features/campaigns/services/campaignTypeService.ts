import { fetchWithAuthInterceptor } from "../../../shared/services/fetchInterceptor";
import { API_CONFIG } from "../../../shared/services/api";
import { ApiResponse } from "../../../shared/types/api";

export interface CampaignType {
  id: number;
  name: string;
  description?: string;
  isActive?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface CreateCampaignTypeRequest {
  name: string;
  description?: string;
}

export interface UpdateCampaignTypeRequest {
  name?: string;
  description?: string;
}

class CampaignTypeService {
  private baseUrl = `${API_CONFIG.BASE_URL}/campaign-types`;

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

  // Get all campaign types (fresh data)
  async getAllCampaignTypes(): Promise<ApiResponse<CampaignType[]>> {
    return this.request<ApiResponse<CampaignType[]>>("", {
      method: "GET",
    });
  }

  // Create new campaign type
  async createCampaignType(
    data: CreateCampaignTypeRequest
  ): Promise<ApiResponse<CampaignType>> {
    return this.request<ApiResponse<CampaignType>>("", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  // Update campaign type
  async updateCampaignType(
    id: number,
    data: UpdateCampaignTypeRequest
  ): Promise<ApiResponse<CampaignType>> {
    return this.request<ApiResponse<CampaignType>>("/" + id, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  // Delete campaign type
  async deleteCampaignType(id: number): Promise<ApiResponse<{ message: string }>> {
    return this.request<ApiResponse<{ message: string }>>(`/${id}`, {
      method: "DELETE",
    });
  }
}

export const campaignTypeService = new CampaignTypeService();
