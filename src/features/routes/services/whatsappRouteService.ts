import { buildApiUrl, getAuthHeaders } from "../../../shared/services/api";
import { WhatsAppRoute, CreateWhatsAppRouteRequest, UpdateWhatsAppRouteRequest } from "../types/whatsappRoute";

const BASE_URL = buildApiUrl("/whatsapp-routes");

export const WHATSAPP_ROUTES_WHATSAPP_ROUTES_DUMMY_DATA: WhatsAppRoute[] = [
  {
    id: 1,
    name: "Meta Business API",
    description: "Meta Business API WhatsApp integration for main channel",
    gateway_provider: "META_BUSINESS_API",
    is_active: true,
    created_at: "2026-01-20T10:30:00Z",
    updated_at: "2026-04-22T14:45:00Z",
  },
  {
    id: 2,
    name: "Twilio WhatsApp",
    description: "Twilio WhatsApp API for backup and testing",
    gateway_provider: "TWILIO_WHATSAPP",
    is_active: true,
    created_at: "2026-02-14T09:15:00Z",
    updated_at: "2026-04-19T16:20:00Z",
  },
  {
    id: 3,
    name: "Custom WhatsApp Gateway",
    description: "Custom WhatsApp gateway for special campaigns",
    gateway_provider: "CUSTOM",
    is_active: false,
    created_at: "2026-03-10T11:00:00Z",
    updated_at: "2026-04-16T13:30:00Z",
  },
];

class WhatsAppRouteService {
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
      const data = await this.request<{ success: boolean; data: WhatsAppRoute[] }>("");
      return data.data;
    } catch (err) {
      return WHATSAPP_ROUTES_DUMMY_DATA;
    }
  }

  async getRouteById(id: number) {
    try {
      const data = await this.request<{ success: boolean; data: WhatsAppRoute }>(
        `/${id}`
      );
      return data.data;
    } catch (err) {
      const route = WHATSAPP_ROUTES_DUMMY_DATA.find(r => r.id === id);
      if (route) return route;
      throw err;
    }
  }

  async createRoute(data: CreateWhatsAppRouteRequest) {
    const response = await this.request<{ success: boolean; data: WhatsAppRoute }>(
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

  async updateRoute(id: number, data: UpdateWhatsAppRouteRequest) {
    const response = await this.request<{ success: boolean; data: WhatsAppRoute }>(
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

export const whatsappRouteService = new WhatsAppRouteService();
