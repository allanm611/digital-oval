import { extractErrorMessage } from "../utils/errorHandler";
import { buildApiUrl, getAuthHeaders } from "./api";

export interface UtilityDto {
  id: number;
  name: string;
  value: string;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUtilityRequest {
  name: string;
  value: string;
  description?: string | null;
  is_active?: boolean;
}

export interface UpdateUtilityRequest {
  name?: string;
  description?: string | null;
  is_active?: boolean;
}

const BASE_URL = buildApiUrl("/utilities");

class UtilitiesService {
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

  async getAllUtilities(limit?: number, offset?: number) {
    try {
      const params = new URLSearchParams();
      if (limit) params.append("limit", limit.toString());
      if (offset) params.append("offset", offset.toString());
      const query = params.toString() ? `?${params.toString()}` : "";
      const data = await this.request<UtilityDto[]>(`/${query}`);
      return data;
    } catch (err) {
      console.error("Failed to fetch utilities:", err);
      return [];
    }
  }

  async getUtilityById(id: number) {
    try {
      const data = await this.request<UtilityDto>(`/${id}`);
      return data;
    } catch (err) {
      console.error(`Failed to fetch utility ${id}:`, err);
      throw err;
    }
  }

  async createUtility(data: CreateUtilityRequest) {
    const response = await this.request<UtilityDto>("", {
      method: "POST",
      body: JSON.stringify(data),
      headers: {
        "Content-Type": "application/json",
      },
    });
    return response;
  }

  async updateUtility(id: number, data: UpdateUtilityRequest) {
    const response = await this.request<UtilityDto>(`/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
      headers: {
        "Content-Type": "application/json",
      },
    });
    return response;
  }

  async toggleUtilityStatus(id: number) {
    const response = await this.request<UtilityDto>(`/${id}/toggle`, {
      method: "PATCH",
    });
    return response;
  }

  async deleteUtility(id: number) {
    await this.request(`/${id}`, {
      method: "DELETE",
    });
  }
}

export const utilitiesService = new UtilitiesService();
