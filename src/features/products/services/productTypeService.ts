import { fetchWithAuthInterceptor } from "../../../shared/services/fetchInterceptor";
import { API_CONFIG } from "../../../shared/services/api";
import { ApiResponse } from "../../../shared/types/api";

export interface ProductType {
  id: number;
  name: string;
  description?: string;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
  created_by?: string;
  updated_by?: string;
}

export interface CreateProductTypeRequest {
  name: string;
  description?: string;
  is_active?: boolean;
}

export interface UpdateProductTypeRequest {
  name?: string;
  description?: string;
  is_active?: boolean;
}

class ProductTypeService {
  private baseUrl = `${API_CONFIG.BASE_URL}/product-types`;

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

  // Get all product types (fresh data)
  async getAllProductTypes(): Promise<ApiResponse<ProductType[]>> {
    return this.request<ApiResponse<ProductType[]>>("");
  }

  // Create new product type
  async createProductType(
    data: CreateProductTypeRequest
  ): Promise<ApiResponse<ProductType>> {
    return this.request<ApiResponse<ProductType>>("", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  // Update product type
  async updateProductType(
    id: number,
    data: UpdateProductTypeRequest
  ): Promise<ApiResponse<ProductType>> {
    return this.request<ApiResponse<ProductType>>(`/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  // Delete product type
  async deleteProductType(id: number): Promise<ApiResponse<{ message: string }>> {
    return this.request<ApiResponse<{ message: string }>>(`/${id}`, {
      method: "DELETE",
    });
  }
}

export const productTypeService = new ProductTypeService();
