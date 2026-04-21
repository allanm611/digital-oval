import { buildApiUrl, getAuthHeaders } from "../../../shared/services/api";
import { EmailRoute, CreateEmailRouteRequest, UpdateEmailRouteRequest } from "../types/emailRoute";

const BASE_URL = buildApiUrl("/email-routes");

class EmailRouteService {
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
    const data = await this.request<{ success: boolean; data: EmailRoute[] }>("");
    return data.data;
  }

  async getRouteById(id: number) {
    const data = await this.request<{ success: boolean; data: EmailRoute }>(
      `/${id}`
    );
    return data.data;
  }

  async createRoute(data: CreateEmailRouteRequest) {
    const response = await this.request<{ success: boolean; data: EmailRoute }>(
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

  async updateRoute(id: number, data: UpdateEmailRouteRequest) {
    const response = await this.request<{ success: boolean; data: EmailRoute }>(
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

export const emailRouteService = new EmailRouteService();
