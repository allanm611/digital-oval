import {
  CreateSMSRouteRequest,
  SMSRoute,
  UpdateSMSRouteRequest,
} from "../types/smsRoute";
import { routeService } from "./routeService";

/**
 * USSD routes share `/routes` (no separate /ussd-routes backend).
 */
class UssdRouteService {
  async getAllRoutes(): Promise<SMSRoute[]> {
    return routeService.getRoutesByChannel("USSD");
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

export const ussdRouteService = new UssdRouteService();
