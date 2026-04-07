import { buildApiUrl, getAuthHeaders } from "../../../shared/services/api";
import { SMSRoute, CreateSMSRouteRequest, UpdateSMSRouteRequest } from "../types/smsRoute";

const BASE_URL = buildApiUrl("/sms-routes");

class SMSRouteService {
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
      throw new Error(`Failed to fetch from ${url}: ${response.statusText}`);
    }

    return response.json();
  }

  async getAllRoutes() {
    const data = await this.request<{ success: boolean; data: SMSRoute[] }>("");
    return data.data;
  }

  async getRouteById(id: number) {
    const data = await this.request<{ success: boolean; data: SMSRoute }>(
      `/${id}`
    );
    return data.data;
  }

  async createRoute(data: CreateSMSRouteRequest) {
    const response = await this.request<{ success: boolean; data: SMSRoute }>(
      "",
      {
        method: "POST",
        body: JSON.stringify(data),
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    return response.data;
  }

  async updateRoute(id: number, data: UpdateSMSRouteRequest) {
    const response = await this.request<{ success: boolean; data: SMSRoute }>(
      `/${id}`,
      {
        method: "PUT",
        body: JSON.stringify(data),
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    return response.data;
  }

  async deleteRoute(id: number) {
    const response = await this.request<{ success: boolean; message: string }>(
      `/${id}`,
      {
        method: "DELETE",
      }
    );
    return response;
  }
}

export const smsRouteService = new SMSRouteService();
