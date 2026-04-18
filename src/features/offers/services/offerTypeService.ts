import { fetchWithAuthInterceptor } from "../../../shared/services/fetchInterceptor";
import { API_CONFIG } from "../../../shared/services/api";
import { ApiResponse } from "../../../shared/types/api";

export interface OfferType {
  id: number;
  name: string;
  description?: string;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
  created_by?: string;
  updated_by?: string;
}

export interface CreateOfferTypeRequest {
  name: string;
  description?: string;
  is_active?: boolean;
}

export interface UpdateOfferTypeRequest {
  name?: string;
  description?: string;
  is_active?: boolean;
}

class OfferTypeService {
  private baseUrl = `${API_CONFIG.BASE_URL}/offer-types`;

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

  // Get all offer types (fresh data)
  async getAllOfferTypes(): Promise<ApiResponse<OfferType[]>> {
    return this.request<ApiResponse<OfferType[]>>("");
  }

  // Create new offer type
  async createOfferType(
    data: CreateOfferTypeRequest
  ): Promise<ApiResponse<OfferType>> {
    return this.request<ApiResponse<OfferType>>("", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  // Update offer type
  async updateOfferType(
    id: number,
    data: UpdateOfferTypeRequest
  ): Promise<ApiResponse<OfferType>> {
    return this.request<ApiResponse<OfferType>>("/", {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  // Delete offer type
  async deleteOfferType(id: number): Promise<ApiResponse<{ message: string }>> {
    return this.request<ApiResponse<{ message: string }>>(`/${id}`, {
      method: "DELETE",
    });
  }
}

export const offerTypeService = new OfferTypeService();
