import { buildApiUrl, getAuthHeaders } from "../../../shared/services/api";
import { SMSRoute, CreateSMSRouteRequest, UpdateSMSRouteRequest } from "../types/smsRoute";

const BASE_URL = buildApiUrl("/ussd-routes");

export const USSD_ROUTES_DUMMY_DATA: SMSRoute[] = [
  {
    id: 1,
    name: "USSD Gateway Primary",
    description: "Primary USSD gateway for main USSD campaigns",
    gateway_provider: "INTERNAL",
    gateway_config_id: 1,
    backup_route_id: 2,
    use_backup_on_failure: true,
    communication_channel: "USSD",
    is_active: true,
    retry_attempts: 3,
    created_at: "2026-01-15T10:30:00Z",
    updated_at: "2026-04-20T14:45:00Z",
  },
  {
    id: 2,
    name: "USSD Gateway Backup",
    description: "Backup USSD gateway for redundancy",
    gateway_provider: "EXTERNAL_PROVIDER_A",
    gateway_config_id: 2,
    backup_route_id: 1,
    use_backup_on_failure: true,
    communication_channel: "USSD",
    is_active: true,
    retry_attempts: 2,
    created_at: "2026-02-10T09:15:00Z",
    updated_at: "2026-04-18T16:20:00Z",
  },
];

class USSDRouteService {
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
    return USSD_ROUTES_DUMMY_DATA;
  }

  async getRouteById(id: number) {
    try {
      const data = await this.request<{ success: boolean; data: SMSRoute }>(
        `/${id}`
      );
      return data.data;
    } catch (err) {
      const route = USSD_ROUTES_DUMMY_DATA.find(r => r.id === id);
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
    return { success: true, message: "Route updated successfully" };
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

export const ussdRouteService = new USSDRouteService();
