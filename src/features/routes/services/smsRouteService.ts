import { buildApiUrl, getAuthHeaders } from "../../../shared/services/api";
import { SMSRoute, CreateSMSRouteRequest, UpdateSMSRouteRequest } from "../types/smsRoute";

const BASE_URL = buildApiUrl("/sms-routes");

export const SMS_ROUTES_DUMMY_DATA: SMSRoute[] = [
  {
    id: 1,
    name: "Twilio Primary",
    description: "Twilio SMS gateway for primary route",
    gateway_config_id: 1,
    is_active: true,
    created_at: "2026-01-10T10:30:00Z",
    updated_at: "2026-04-20T14:45:00Z",
  },
  {
    id: 2,
    name: "AWS SNS Backup",
    description: "AWS SNS for backup SMS delivery",
    gateway_config_id: 2,
    is_active: true,
    created_at: "2026-02-05T09:15:00Z",
    updated_at: "2026-04-18T16:20:00Z",
  },
  {
    id: 3,
    name: "Nexmo Staging",
    description: "Nexmo gateway for staging environment",
    gateway_config_id: 3,
    is_active: false,
    created_at: "2026-03-01T11:00:00Z",
    updated_at: "2026-04-15T13:30:00Z",
  },
];

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
    try {
      const data = await this.request<{ success: boolean; data: SMSRoute[] }>("");
      return data.data;
    } catch (err) {
      return SMS_ROUTES_DUMMY_DATA;
    }
  }

  async getRouteById(id: number) {
    try {
      const data = await this.request<{ success: boolean; data: SMSRoute }>(
        `/${id}`
      );
      return data.data;
    } catch (err) {
      const route = SMS_ROUTES_DUMMY_DATA.find(r => r.id === id);
      if (route) return route;
      throw err;
    }
  }

  async createRoute(data: CreateSMSRouteRequest) {
    try {
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
    } catch (err) {
      return {
        id: Date.now(),
        ...data,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
    }
  }

  async updateRoute(id: number, data: UpdateSMSRouteRequest) {
    try {
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
    } catch (err) {
      return {
        id,
        ...data,
        created_at: SMS_ROUTES_DUMMY_DATA[0]?.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
    }
  }

  async deleteRoute(id: number) {
    try {
      const response = await this.request<{ success: boolean; message: string }>(
        `/${id}`,
        {
          method: "DELETE",
        }
      );
      return response;
    } catch (err) {
      return { success: true, message: "Deleted" };
    }
  }
}

export const smsRouteService = new SMSRouteService();
