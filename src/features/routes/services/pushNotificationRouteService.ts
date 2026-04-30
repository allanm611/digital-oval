import { buildApiUrl, getAuthHeaders } from "../../../shared/services/api";
import { PushNotificationRoute, CreatePushNotificationRouteRequest, UpdatePushNotificationRouteRequest } from "../types/pushNotificationRoute";

const BASE_URL = buildApiUrl("/push-notification-routes");

export const PUSH_ROUTES_PUSH_ROUTES_DUMMY_DATA: PushNotificationRoute[] = [
  {
    id: 1,
    name: "Firebase Production",
    description: "Firebase Cloud Messaging for production environment",
    gateway_provider: "FIREBASE",
    is_active: true,
    created_at: "2026-01-15T10:30:00Z",
    updated_at: "2026-04-20T14:45:00Z",
  },
  {
    id: 2,
    name: "OneSignal Backup",
    description: "OneSignal backup gateway for redundancy",
    gateway_provider: "ONESIGNAL",
    is_active: true,
    created_at: "2026-02-10T09:15:00Z",
    updated_at: "2026-04-18T16:20:00Z",
  },
  {
    id: 3,
    name: "Pusher Staging",
    description: "Pusher gateway for staging environment testing",
    gateway_provider: "PUSHER",
    is_active: false,
    created_at: "2026-03-05T11:00:00Z",
    updated_at: "2026-04-15T13:30:00Z",
  },
];

class PushNotificationRouteService {
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
      const data = await this.request<{ success: boolean; data: PushNotificationRoute[] }>("");
      return data.data;
    } catch (err) {
      return PUSH_ROUTES_DUMMY_DATA;
    }
  }

  async getRouteById(id: number) {
    try {
      const data = await this.request<{ success: boolean; data: PushNotificationRoute }>(
        `/${id}`
      );
      return data.data;
    } catch (err) {
      const route = PUSH_ROUTES_DUMMY_DATA.find(r => r.id === id);
      if (route) return route;
      throw err;
    }
  }

  async createRoute(data: CreatePushNotificationRouteRequest) {
    const response = await this.request<{ success: boolean; data: PushNotificationRoute }>(
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

  async updateRoute(id: number, data: UpdatePushNotificationRouteRequest) {
    const response = await this.request<{ success: boolean; data: PushNotificationRoute }>(
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

export const pushNotificationRouteService = new PushNotificationRouteService();
