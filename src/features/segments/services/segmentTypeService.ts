import { fetchWithAuthInterceptor } from "../../../shared/services/fetchInterceptor";
import { API_CONFIG } from "../../../shared/services/api";
import { ApiResponse } from "../../../shared/types/api";

export interface SegmentType {
  id: number;
  name: string;
  description?: string;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
  created_by?: string;
  updated_by?: string;
}

export interface CreateSegmentTypeRequest {
  name: string;
  description?: string;
  is_active?: boolean;
}

export interface UpdateSegmentTypeRequest {
  name?: string;
  description?: string;
  is_active?: boolean;
}

class SegmentTypeService {
  private baseUrl = `${API_CONFIG.BASE_URL}/segment-types`;

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

  // Get all segment types (fresh data)
  async getAllSegmentTypes(): Promise<ApiResponse<SegmentType[]>> {
    return this.request<ApiResponse<SegmentType[]>>("");
  }

  // Create new segment type
  async createSegmentType(
    data: CreateSegmentTypeRequest
  ): Promise<ApiResponse<SegmentType>> {
    return this.request<ApiResponse<SegmentType>>("");
  }

  // Update segment type
  async updateSegmentType(
    id: number,
    data: UpdateSegmentTypeRequest
  ): Promise<ApiResponse<SegmentType>> {
    return this.request<ApiResponse<SegmentType>>(`/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  // Delete segment type
  async deleteSegmentType(id: number): Promise<ApiResponse<{ message: string }>> {
    return this.request<ApiResponse<{ message: string }>>(`/${id}`, {
      method: "DELETE",
    });
  }
}

export const segmentTypeService = new SegmentTypeService();
