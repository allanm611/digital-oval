import { fetchWithAuthInterceptor } from "../../../shared/services/fetchInterceptor";
import { ApiResponse } from "../../../shared/types/api";
import { ConfigurationItem } from "../../../features/configurations/components/ConfigurationManager";
import { buildApiUrl } from "../../../shared/services/api";

class DepartmentService {
  private baseUrl = buildApiUrl("/departments");

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

  async getDepartments(): Promise<ConfigurationItem[]> {
    try {
      const data = await this.request<ApiResponse<ConfigurationItem[]>>("");
      if (data && Array.isArray(data.data)) {
        return data.data;
      }
      // If response is an array directly (not wrapped in data)
      if (Array.isArray(data)) {
        return data;
      }
      return [];
    } catch (error) {
      console.error("Department fetch error:", error);
      throw error;
    }
  }

  async getDepartmentById(id: number): Promise<ConfigurationItem> {
    const data = await this.request<ApiResponse<ConfigurationItem>>(`/${id}`);
    if (data && data.data) {
      return data.data;
    }
    return {} as ConfigurationItem;
  }

  async createDepartment(
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

  async updateDepartment(
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

  async deleteDepartment(id: number): Promise<void> {
    await this.request<void>(`/${id}`, {
      method: "DELETE",
    });
  }
}

export const departmentService = new DepartmentService();
