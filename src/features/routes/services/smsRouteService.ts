import { SMSRoute, CreateSMSRouteRequest, UpdateSMSRouteRequest } from "../types/smsRoute";

// Dummy SMS routes data
const hardcodedSMSRoutes: SMSRoute[] = [
  {
    id: 1,
    name: "Effortel SMS",
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
    description: "Effortel SMS route",
    created_at: "2026-01-23T12:00:00Z",
    updated_at: "2026-01-23T12:00:00Z",
  },
  {
    id: 2,
    name: "Equitel Gateway",
    gatewayType: "AWS SNS",
    apiEndpoint: "https://sns.us-east-1.amazonaws.com",
    apiKey: "AKIA1234567890ABCDE",
    apiSecret: "your_secret_key_here",
    senderId: "3",
    senderIdName: "Equitel",
    requestMethod: "POST",
    requestFormat: "JSON",
    priority: 2,
    status: "active",
    description: "Equitel backup SMS route",
    created_at: "2026-01-24T10:30:00Z",
    updated_at: "2026-01-24T10:30:00Z",
  },
  {
    id: 3,
    name: "EquitelKE Backup",
    gatewayType: "Custom Gateway",
    apiEndpoint: "https://gateway.example.com/sms",
    apiKey: "custom_api_key_123",
    apiSecret: "custom_secret_456",
    senderId: "4",
    senderIdName: "EquitelKE",
    requestMethod: "POST",
    requestFormat: "JSON",
    priority: 3,
    status: "inactive",
    description: "EquitelKE fallback route",
    created_at: "2026-01-25T14:15:00Z",
    updated_at: "2026-01-25T14:15:00Z",
  },
];

export const smsRouteService = {
  // Get all SMS routes
  getAllRoutes: async (): Promise<SMSRoute[]> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(hardcodedSMSRoutes);
      }, 500);
    });
  },

  // Get a single SMS route by ID
  getRouteById: async (id: number): Promise<SMSRoute | null> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const route = hardcodedSMSRoutes.find((r) => r.id === id);
        resolve(route || null);
      }, 300);
    });
  },

  // Create a new SMS route
  createRoute: async (data: CreateSMSRouteRequest): Promise<SMSRoute> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const newRoute: SMSRoute = {
          id: Math.max(...hardcodedSMSRoutes.map((r) => r.id), 0) + 1,
          ...data,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        hardcodedSMSRoutes.push(newRoute);
        resolve(newRoute);
      }, 500);
    });
  },

  // Update an SMS route
  updateRoute: async (data: UpdateSMSRouteRequest): Promise<SMSRoute> => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const index = hardcodedSMSRoutes.findIndex((r) => r.id === data.id);
        if (index === -1) {
          reject(new Error("Route not found"));
          return;
        }
        const updated: SMSRoute = {
          ...hardcodedSMSRoutes[index],
          ...data,
          updated_at: new Date().toISOString(),
        };
        hardcodedSMSRoutes[index] = updated;
        resolve(updated);
      }, 500);
    });
  },

  // Delete an SMS route
  deleteRoute: async (id: number): Promise<void> => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const index = hardcodedSMSRoutes.findIndex((r) => r.id === id);
        if (index === -1) {
          reject(new Error("Route not found"));
          return;
        }
        hardcodedSMSRoutes.splice(index, 1);
        resolve();
      }, 500);
    });
  },
};
