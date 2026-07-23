import {
  CreateSMSRouteRequest,
  SMSRoute,
  UpdateSMSRouteRequest,
} from "../types/smsRoute";
import { routeService } from "./routeService";

/**
 * Email routes share the same `/routes` backend table.
 * Channel is determined by the linked gateway configuration / communication_channel_id.
 */
class EmailRouteService {
  async getAllRoutes(): Promise<SMSRoute[]> {
    return routeService.getRoutesByChannel("EMAIL");
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

export const emailRouteService = new EmailRouteService();
