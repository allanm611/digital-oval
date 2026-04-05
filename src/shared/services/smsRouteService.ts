import { buildApiUrl, getAuthHeaders } from "./api";

export interface SmsRoute {
  id: number;
  name: string;
  description?: string;
  gateway_provider?: string;
  communication_channel_id?: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by?: number;
  updated_by?: number;
}

export interface CreateSmsRouteRequest {
  name: string;
  description?: string;
  gateway_provider?: string;
  communication_channel_id?: number;
  is_active?: boolean;
}

export interface UpdateSmsRouteRequest {
  name?: string;
  description?: string;
  gateway_provider?: string;
  communication_channel_id?: number;
  is_active?: boolean;
}

const BASE_URL = buildApiUrl("/sms-routes");

class SmsRouteService {
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
    const data = await this.request<{ success: boolean; data: SmsRoute[] }>("");
    return data.data;
  }

  async getById(id: number) {
    const data = await this.request<{ success: boolean; data: SmsRoute }>(
      `/${id}`
    );
    return data.data;
  }

  async create(data: CreateSmsRouteRequest) {
    const response = await this.request<{ success: boolean; data: SmsRoute }>(
      "",
      {
        method: "POST",
        body: JSON.stringify(data),
      }
    );
    return response.data;
  }

  async update(id: number, data: UpdateSmsRouteRequest) {
    const response = await this.request<{ success: boolean; data: SmsRoute }>(
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

export const smsRouteService = new SmsRouteService();
