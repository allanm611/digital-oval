import { fetchWithAuthInterceptor } from "../../../shared/services/fetchInterceptor";
import { API_CONFIG } from "../../../shared/services/api";
import { ApiResponse } from "../../../shared/types/api";

export interface ComboType {
  id: number;
  name: string;
  description?: string;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
  created_by?: string;
  updated_by?: string;
}

export interface CreateComboTypeRequest {
  name: string;
  description?: string;
  is_active?: boolean;
}

export interface UpdateComboTypeRequest {
  name?: string;
  description?: string;
  is_active?: boolean;
}

class ComboTypeService {
  private baseUrl = `${API_CONFIG.BASE_URL}/combo-types`;

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

  // Get all combo types (fresh data)
  async getAllComboTypes(): Promise<ApiResponse<ComboType[]>> {
    return this.request<ApiResponse<ComboType[]>>("");
  }

  // Get combo type by ID
  async getComboTypeById(id: number): Promise<ComboType> {
    const response = await this.request<ApiResponse<ComboType>>(`/${id}`);
    return response.data;
  }

  // Create new combo type
  async createComboType(
    data: CreateComboTypeRequest
  ): Promise<ApiResponse<ComboType>> {
    return this.request<ApiResponse<ComboType>>("", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  // Update combo type
  async updateComboType(
    id: number,
    data: UpdateComboTypeRequest
  ): Promise<ApiResponse<ComboType>> {
    return this.request<ApiResponse<ComboType>>(`/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  // Delete combo type
  async deleteComboType(id: number): Promise<ApiResponse<{ message: string }>> {
    return this.request<ApiResponse<{ message: string }>>(`/${id}`, {
      method: "DELETE",
    });
  }
}

export const comboTypeService = new ComboTypeService();
