import { fetchWithAuthInterceptor } from "../../../shared/services/fetchInterceptor";
import { ApiResponse } from "../../../shared/types/api";
import { ConfigurationItem } from "../components/ConfigurationManager";
import { buildApiUrl } from "../../../shared/services/api";

class CampaignObjectiveService {
  private baseUrl = buildApiUrl("/campaign-objectives");

  private async request<T>(
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
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.error || errorData.message || `HTTP ${response.status}`
      );
    }

    return response.json();
  }

  async getCampaignObjectives(): Promise<ConfigurationItem[]> {
    const data = await this.request<ApiResponse<ConfigurationItem[]>>("");
    if (data && Array.isArray(data.data)) {
      return data.data;
    }
    return [];
  }

  async getCampaignObjectiveById(id: number): Promise<ConfigurationItem> {
    const data = await this.request<ApiResponse<ConfigurationItem>>(`/${id}`);
    if (data && data.data) {
      return data.data;
    }
    return {} as ConfigurationItem;
  }

  async createCampaignObjective(
    payload: Partial<ConfigurationItem>
  ): Promise<ConfigurationItem> {
    const data = await this.request<ApiResponse<ConfigurationItem>>("", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    if (data && data.data) {
      return data.data;
    }
    return {} as ConfigurationItem;
  }

  async updateCampaignObjective(
    id: number,
    payload: Partial<ConfigurationItem>
  ): Promise<ConfigurationItem> {
    const data = await this.request<ApiResponse<ConfigurationItem>>(`/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
    if (data && data.data) {
      return data.data;
    }
    return {} as ConfigurationItem;
  }

  async deleteCampaignObjective(id: number): Promise<void> {
    await this.request<void>(`/${id}`, {
      method: "DELETE",
    });
  }
}

export const campaignObjectiveService = new CampaignObjectiveService();
