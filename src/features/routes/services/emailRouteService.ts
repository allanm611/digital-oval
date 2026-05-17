import { EmailRoute, CreateEmailRouteRequest, UpdateEmailRouteRequest } from "../types/emailRoute";

export const EMAIL_ROUTES_DUMMY_DATA: EmailRoute[] = [
  {
    id: 1,
    name: "SendGrid Production",
    description: "SendGrid SMTP for production email campaigns",
    gateway_config_id: 1,
    is_active: true,
    created_at: "2026-01-15T10:30:00Z",
    updated_at: "2026-04-20T14:45:00Z",
  },
  {
    id: 2,
    name: "AWS SES Backup",
    description: "AWS SES for backup email delivery",
    gateway_config_id: 2,
    is_active: true,
    created_at: "2026-02-10T09:15:00Z",
    updated_at: "2026-04-18T16:20:00Z",
  },
  {
    id: 3,
    name: "Mailgun Staging",
    description: "Mailgun SMTP for staging environment",
    gateway_config_id: 3,
    is_active: false,
    created_at: "2026-03-05T11:00:00Z",
    updated_at: "2026-04-15T13:30:00Z",
  },
];

class EmailRouteService {
  async getAllRoutes() {
    return EMAIL_ROUTES_DUMMY_DATA;
  }

  async getRouteById(id: number) {
    const route = EMAIL_ROUTES_DUMMY_DATA.find(r => r.id === id);
    if (!route) throw new Error("Route not found");
    return route;
  }

  async createRoute(data: CreateEmailRouteRequest) {
    return {
      id: Date.now(),
      ...data,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  }

  async updateRoute(id: number, data: UpdateEmailRouteRequest) {
    return {
      id,
      ...data,
      created_at: EMAIL_ROUTES_DUMMY_DATA[0]?.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  }

  async deleteRoute(id: number) {
    return { success: true, message: "Deleted" };
  }
}

export const emailRouteService = new EmailRouteService();
