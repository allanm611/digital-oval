import { buildApiUrl, getAuthHeaders } from "../../../shared/services/api";
import { extractErrorMessage } from "../../../shared/utils/errorHandler";
import {
  CreateSMSRouteRequest,
  SMSRoute,
  UpdateSMSRouteRequest,
} from "../types/smsRoute";
import { routeService } from "./routeService";

/**
 * @deprecated Prefer importing from `./routeService`.
 * Kept so existing imports (`smsRouteService`) continue to work against `/routes`.
 */
const BASE_URL = buildApiUrl("/routes");

class SMSRouteService {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
  ): Promise<T> {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      headers: {
        ...getAuthHeaders(),
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(extractErrorMessage(errorBody, response.status));
    }

    const json = await response.json();
    if (json && json.success === false) {
      throw new Error(json.error || json.message || "Request failed");
    }
    return json;
  }

  async getAllRoutes(): Promise<SMSRoute[]> {
    return routeService.getRoutesByChannel("SMS");
  }

  async getRouteById(id: number): Promise<SMSRoute> {
    return routeService.getRouteByIdEnriched(id);
  }

  async createRoute(data: CreateSMSRouteRequest): Promise<SMSRoute> {
    return routeService.createRoute(data);
  }

  async updateRoute(id: number, data: UpdateSMSRouteRequest): Promise<SMSRoute> {
    return routeService.updateRoute(id, data);
  }

  async deleteRoute(id: number) {
    return routeService.deleteRoute(id);
  }
}

export const smsRouteService = new SMSRouteService();

// Re-export canonical service for callers that need all channels
export { routeService } from "./routeService";
