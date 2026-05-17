import { PushNotificationRoute, CreatePushNotificationRouteRequest, UpdatePushNotificationRouteRequest } from "../types/pushNotificationRoute";

export const PUSH_ROUTES_PUSH_ROUTES_DUMMY_DATA: PushNotificationRoute[] = [
  {
    id: 1,
    name: "Firebase Production",
    description: "Firebase Cloud Messaging for iOS and Android",
    gateway_config_id: 10,
    is_active: true,
    created_at: "2026-01-25T12:00:00Z",
    updated_at: "2026-04-21T15:20:00Z",
  },
  {
    id: 2,
    name: "OneSignal Backup",
    description: "OneSignal platform for push notifications",
    gateway_config_id: 11,
    is_active: true,
    created_at: "2026-02-18T11:30:00Z",
    updated_at: "2026-04-19T14:00:00Z",
  },
];

class PushNotificationRouteService {
  async getAllRoutes() {
    return PUSH_ROUTES_PUSH_ROUTES_DUMMY_DATA;
  }

  async getRouteById(id: number) {
    const route = PUSH_ROUTES_PUSH_ROUTES_DUMMY_DATA.find(r => r.id === id);
    if (!route) throw new Error("Route not found");
    return route;
  }

  async createRoute(data: CreatePushNotificationRouteRequest) {
    return {
      id: Date.now(),
      ...data,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  }

  async updateRoute(id: number, data: UpdatePushNotificationRouteRequest) {
    return {
      id,
      ...data,
      created_at: PUSH_ROUTES_PUSH_ROUTES_DUMMY_DATA[0]?.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  }

  async deleteRoute(id: number) {
    return { success: true, message: "Deleted" };
  }
}

export const pushNotificationRouteService = new PushNotificationRouteService();
