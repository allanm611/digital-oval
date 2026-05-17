import { fetchWithAuthInterceptor } from "../../../shared/services/fetchInterceptor";
import { API_CONFIG } from "../../../shared/services/api";
import { ApiResponse } from "../../../shared/types/api";
import { TimeZone, UpdateTimeZoneRequest, CreateTimeZoneRequest } from "../types/timezone";

class TimezoneService {
  private baseUrl = `${API_CONFIG.BASE_URL}/timezones`;

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

  async getTimezones(): Promise<TimeZone[]> {
    const data = await this.request<ApiResponse<TimeZone[]>>("");
    if (data && Array.isArray(data.data)) {
      return data.data;
    }
    return [];
  }

  async getTimezoneById(id: number): Promise<TimeZone> {
    const data = await this.request<ApiResponse<TimeZone>>(`/${id}`);
    if (data && data.data) {
      return data.data;
    }
    return {} as TimeZone;
  }

  async createTimezone(
    payload: CreateTimeZoneRequest
  ): Promise<TimeZone> {
    const data = await this.request<ApiResponse<TimeZone>>("", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    if (data && data.data) {
      return data.data;
    }
    return {} as TimeZone;
  }

  async updateTimezone(
    id: number,
    payload: UpdateTimeZoneRequest
  ): Promise<TimeZone> {
    const data = await this.request<ApiResponse<TimeZone>>(`/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
    if (data && data.data) {
      return data.data;
    }
    return {} as TimeZone;
  }

  async deleteTimezone(id: number): Promise<void> {
    await this.request<ApiResponse<null>>(`/${id}`, {
      method: "DELETE",
    });
  }
}

export const timezoneService = new TimezoneService();
