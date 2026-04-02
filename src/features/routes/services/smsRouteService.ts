import { SMSRoute, CreateSMSRouteRequest, UpdateSMSRouteRequest } from "../types/smsRoute";

// Dummy SMS routes data
const hardcodedSMSRoutes: SMSRoute[] = [
  {
    id: 1,
    name: "Effortel SMS Gateway",
    gatewayType: "Twilio",
    apiEndpoint: "https://api.twilio.com/v1",
    apiKey: "AC1234567890abcdef",
    apiSecret: "your_auth_token_here",
    senderId: "1",
    senderIdName: "Effortel",
    requestMethod: "POST",
    requestFormat: "JSON",
    priority: 1,
    status: "active",
    description: "Effortel SMS Gateway route",
    created_at: "2026-01-23T12:00:00Z",
    updated_at: "2026-01-23T12:00:00Z",
  },
];

export const smsRouteService = {
  // Get all SMS routes
  getAllRoutes: async (): Promise<SMSRoute[]> => {
    return hardcodedSMSRoutes;
  },

  // Get a single SMS route by ID
  getRouteById: async (id: number): Promise<SMSRoute | null> => {
    return hardcodedSMSRoutes.find((r) => r.id === id) || null;
  },

  // Create a new SMS route
  createRoute: async (data: CreateSMSRouteRequest): Promise<SMSRoute> => {
    const newRoute: SMSRoute = {
      id: Math.max(...hardcodedSMSRoutes.map((r) => r.id), 0) + 1,
      ...data,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    hardcodedSMSRoutes.push(newRoute);
    return newRoute;
  },

  // Update an SMS route
  updateRoute: async (data: UpdateSMSRouteRequest): Promise<SMSRoute> => {
    const index = hardcodedSMSRoutes.findIndex((r) => r.id === data.id);
    if (index === -1) {
      throw new Error("Route not found");
    }
    const updated: SMSRoute = {
      ...hardcodedSMSRoutes[index],
      ...data,
      updated_at: new Date().toISOString(),
    };
    hardcodedSMSRoutes[index] = updated;
    return updated;
  },

  // Delete an SMS route
  deleteRoute: async (id: number): Promise<void> => {
    const index = hardcodedSMSRoutes.findIndex((r) => r.id === id);
    if (index === -1) {
      throw new Error("Route not found");
    }
    hardcodedSMSRoutes.splice(index, 1);
  },
};
