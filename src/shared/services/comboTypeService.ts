import { buildApiUrl, getAuthHeaders } from "./api";

export interface ComboResource {
  resource_type: "data" | "voice" | "sms" | "on-net" | "international" | string;
  unit: string;
  unit_value: number;
  validity_hours?: number;
  price?: number;
  shared_validity?: boolean;
  shared_validity_hours?: number;
}

export interface ComboType {
  id: number;
  name: string;
  description?: string;
  is_active: boolean;
  combo_resources: ComboResource[];
  shared_validity: boolean;
  validity_hours?: number;
  price?: number;
  created_at: string;
  updated_at: string;
  created_by?: number;
  updated_by?: number;
}

export interface CreateComboTypeRequest {
  name: string;
  description?: string;
  is_active?: boolean;
  combo_resources: ComboResource[];
  shared_validity?: boolean;
  validity_hours?: number;
  price?: number;
  created_by?: number;
}

export interface UpdateComboTypeRequest {
  name?: string;
  description?: string;
  is_active?: boolean;
  combo_resources?: ComboResource[];
  shared_validity?: boolean;
  validity_hours?: number;
  price?: number;
  updated_by?: number;
}

const BASE_URL = buildApiUrl("/combo-types");

class ComboTypeService {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${BASE_URL}${endpoint}`;
    const response = await fetch(url, {
      headers: {
        ...getAuthHeaders(),
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch from ${url}: ${response.statusText}`);
    }

    return response.json();
  }

  async getAll() {
    const data = await this.request<{ success: boolean; data: ComboType[] }>("");
    return data.data;
  }

  async getById(id: number) {
    const data = await this.request<{ success: boolean; data: ComboType }>(
      `/${id}`
    );
    return data.data;
  }

  async create(data: CreateComboTypeRequest) {
    const response = await this.request<{ success: boolean; data: ComboType }>(
      "",
      {
        method: "POST",
        body: JSON.stringify(data),
      }
    );
    return response.data;
  }

  async update(id: number, data: UpdateComboTypeRequest) {
    const response = await this.request<{ success: boolean; data: ComboType }>(
      `/${id}`,
      {
        method: "PUT",
        body: JSON.stringify(data),
      }
    );
    return response.data;
  }

  async delete(id: number) {
    const response = await this.request<{ success: boolean; message: string }>(
      `/${id}`,
      {
        method: "DELETE",
      }
    );
    return response;
  }
}

export const comboTypeService = new ComboTypeService();
