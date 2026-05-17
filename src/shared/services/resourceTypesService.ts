import { extractErrorMessage } from "../utils/errorHandler";
import { buildApiUrl, getAuthHeaders } from "./api";

export interface ResourceTypeDto {
  id: number;
  name: string;
  value: string;
  unit: string;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateResourceTypeRequest {
  name: string;
  value: string;
  unit: string;
  description?: string | null;
  is_active?: boolean;
}

export interface UpdateResourceTypeRequest {
  name?: string;
  description?: string | null;
  is_active?: boolean;
}

const BASE_URL = buildApiUrl("/resource-types");

class ResourceTypesService {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
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
      const errorBody = await response.text();
      const errorMessage = extractErrorMessage(errorBody, response.status);
      throw new Error(errorMessage);
    }

    return response.json();
  }

  async getAllResourceTypes(limit?: number, offset?: number) {
    try {
      const params = new URLSearchParams();
      if (limit) params.append("limit", limit.toString());
      if (offset) params.append("offset", offset.toString());
      const query = params.toString() ? `?${params.toString()}` : "";
      const data = await this.request<ResourceTypeDto[]>(`/${query}`);
      return data;
    } catch (err) {
      console.error("Failed to fetch resource types:", err);
      return [];
    }
  }

  async getResourceTypeById(id: number) {
    try {
      const data = await this.request<ResourceTypeDto>(`/${id}`);
      return data;
    } catch (err) {
      console.error(`Failed to fetch resource type ${id}:`, err);
      throw err;
    }
  }

  async createResourceType(data: CreateResourceTypeRequest) {
    const response = await this.request<ResourceTypeDto>("", {
      method: "POST",
      body: JSON.stringify(data),
      headers: {
        "Content-Type": "application/json",
      },
    });
    return response;
  }

  async updateResourceType(id: number, data: UpdateResourceTypeRequest) {
    const response = await this.request<ResourceTypeDto>(`/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
      headers: {
        "Content-Type": "application/json",
      },
    });
    return response;
  }

  async toggleResourceTypeStatus(id: number) {
    const response = await this.request<ResourceTypeDto>(`/${id}/toggle`, {
      method: "PATCH",
    });
    return response;
  }

  async deleteResourceType(id: number) {
    await this.request(`/${id}`, {
      method: "DELETE",
    });
  }

  async getAvailableUnits() {
    try {
      const data = await this.request<{ data: string[] }>("/meta/units");
      return data.data;
    } catch (err) {
      console.error("Failed to fetch available units:", err);
      return [];
    }
  }
}

export const resourceTypesService = new ResourceTypesService();
