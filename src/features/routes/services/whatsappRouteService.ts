import { WhatsAppRoute, CreateWhatsAppRouteRequest, UpdateWhatsAppRouteRequest } from "../types/whatsappRoute";

export const WHATSAPP_ROUTES_DUMMY_DATA: WhatsAppRoute[] = [
  {
    id: 1,
    name: "Twilio Primary",
    description: "Primary Twilio account for WhatsApp messaging",
    gateway_config_id: 1,
    gateway_provider: "TWILIO",
    backup_route_id: 2,
    use_backup_on_failure: true,
    retry_attempts: 3,
    is_active: true,
    created_at: "2026-01-20T08:00:00Z",
    updated_at: "2026-04-22T10:15:00Z",
  },
  {
    id: 2,
    name: "MessageBird Backup",
    description: "Backup WhatsApp provider via MessageBird",
    gateway_config_id: 2,
    gateway_provider: "MESSAGEBIRD",
    backup_route_id: 1,
    use_backup_on_failure: true,
    retry_attempts: 3,
    is_active: true,
    created_at: "2026-02-14T14:30:00Z",
    updated_at: "2026-04-20T09:45:00Z",
  },
];

class WhatsAppRouteService {
  async getAllRoutes() {
    return WHATSAPP_ROUTES_DUMMY_DATA;
  }

  async getRouteById(id: number) {
    const route = WHATSAPP_ROUTES_DUMMY_DATA.find(r => r.id === id);
    if (!route) throw new Error("Route not found");
    return route;
  }

  async createRoute(data: CreateWhatsAppRouteRequest) {
    return {
      id: Date.now(),
      ...data,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  }

  async updateRoute(id: number, data: UpdateWhatsAppRouteRequest) {
    return { success: true, message: "Route updated successfully" };
  }

  async deleteRoute(id: number) {
    return { success: true, message: "Deleted" };
  }
}

export const whatsappRouteService = new WhatsAppRouteService();
