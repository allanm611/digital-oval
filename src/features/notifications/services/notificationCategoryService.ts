import { fetchWithAuthInterceptor } from "../../../shared/services/fetchInterceptor";
import { ApiResponse } from "../../../shared/types/api";
import { ConfigurationItem } from "../../configurations/components/ConfigurationManager";
import { buildApiUrl } from "../../../shared/services/api";

class NotificationCategoryService {
  private baseUrl = buildApiUrl("/notifications/categories");

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

  async getNotificationCategories(): Promise<ConfigurationItem[]> {
    const data = await this.request<ApiResponse<ConfigurationItem[]>>("");
    if (data && Array.isArray(data.data)) {
      return data.data;
    }
    return [];
  }

  async getNotificationCategoryById(id: string): Promise<ConfigurationItem> {
    const data = await this.request<ApiResponse<ConfigurationItem>>(`/${id}`);
    if (data && data.data) {
      return data.data;
    }
    return {} as ConfigurationItem;
  }

  async createNotificationCategory(
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

  async updateNotificationCategory(
    id: string,
    payload: Partial<ConfigurationItem>
  ): Promise<ConfigurationItem> {
    const data = await this.request<ApiResponse<ConfigurationItem>>(`/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
    if (data && data.data) {
      return data.data;
    }
    return {} as ConfigurationItem;
  }

  async deleteNotificationCategory(id: string): Promise<void> {
    await this.request<void>(`/${id}`, {
      method: "DELETE",
    });
  }
}

export const notificationCategoryService = new NotificationCategoryService();
