import {
  PushGatewayConfig,
  CreatePushGatewayConfigRequest,
  UpdatePushGatewayConfigRequest,
} from "../types/pushGatewayConfig";

export const PUSH_GATEWAY_DUMMY_DATA: PushGatewayConfig[] = [
  {
    id: 1,
    name: "Firebase Production",
    description: "Firebase Cloud Messaging for production",
    channel_type: "PUSH",
    provider_type: "FIREBASE",
    is_active: true,
    credentials: {
      server_key: "***hidden***",
      sender_id: "123456789012",
      project_id: "company-firebase-project",
      private_key: "***hidden***",
      client_email: "firebase-adminsdk@company-firebase-project.iam.gserviceaccount.com",
    },
    created_at: "2026-01-12T11:30:00Z",
    updated_at: "2026-04-19T14:15:00Z",
  },
  {
    id: 2,
    name: "Apple APNS",
    description: "Apple Push Notification service",
    channel_type: "PUSH",
    provider_type: "APNS",
    is_active: true,
    credentials: {
      certificate_path: "/certs/apns_production.p8",
      certificate_password: "***hidden***",
      team_id: "ABCD123456",
      key_id: "XYZKEY1234",
      bundle_id: "com.company.app",
    },
    created_at: "2026-01-18T09:45:00Z",
    updated_at: "2026-04-20T10:30:00Z",
  },
];

class PushGatewayConfigService {
  getDummyConfigs(): PushGatewayConfig[] {
    return PUSH_GATEWAY_DUMMY_DATA;
  }

  getAllConfigs(): Promise<PushGatewayConfig[]> {
    return Promise.resolve(PUSH_GATEWAY_DUMMY_DATA);
  }

  getConfigById(id: number): Promise<PushGatewayConfig> {
    const config = PUSH_GATEWAY_DUMMY_DATA.find((c) => c.id === id);
    if (!config) return Promise.reject(new Error("Config not found"));
    return Promise.resolve(config);
  }

  createConfig(data: CreatePushGatewayConfigRequest): Promise<PushGatewayConfig> {
    const newConfig: PushGatewayConfig = {
      id: Date.now(),
      ...data,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    return Promise.resolve(newConfig);
  }

  updateConfig(id: number, data: UpdatePushGatewayConfigRequest): Promise<PushGatewayConfig> {
    const config = PUSH_GATEWAY_DUMMY_DATA.find((c) => c.id === id);
    const updatedConfig: PushGatewayConfig = {
      id,
      ...data,
      created_at: config?.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    return Promise.resolve(updatedConfig);
  }

  deleteConfig(id: number): Promise<{ success: boolean; message: string }> {
    return Promise.resolve({ success: true, message: "Deleted" });
  }
}

export const pushGatewayConfigService = new PushGatewayConfigService();
