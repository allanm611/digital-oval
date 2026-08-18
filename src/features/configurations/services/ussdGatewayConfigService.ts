import {
  USSDGatewayConfig,
  CreateUSSDGatewayConfigRequest,
  UpdateUSSDGatewayConfigRequest,
} from "../types/ussdGatewayConfig";

export const USSD_GATEWAY_DUMMY_DATA: USSDGatewayConfig[] = [
  {
    id: 1,
    name: "Infobip Production",
    description: "Infobip USSD gateway for production",
    channel_type: "USSD",
    provider_type: "INFOBIP",
    is_active: true,
    credentials: {
      api_endpoint: "https://api.infobip.com/ussd/1/send",
      api_key: "***hidden***",
      api_secret: "***hidden***",
      request_method: "POST",
      request_format: "JSON",
    },
    created_at: "2026-01-15T10:20:00Z",
    updated_at: "2026-04-18T14:30:00Z",
  },
  {
    id: 2,
    name: "Twilio USSD",
    description: "Twilio USSD gateway",
    channel_type: "USSD",
    provider_type: "TWILIO",
    is_active: true,
    credentials: {
      api_endpoint: "https://api.twilio.com/2010-04-01/Accounts/ACXXXXX/Messages.json",
      api_key: "***hidden***",
      request_method: "POST",
      request_format: "FORM_DATA",
    },
    created_at: "2026-02-05T08:15:00Z",
    updated_at: "2026-04-20T09:45:00Z",
  },
];

class USSDGatewayConfigService {
  getDummyConfigs(): USSDGatewayConfig[] {
    return USSD_GATEWAY_DUMMY_DATA;
  }

  getAllConfigs(): Promise<USSDGatewayConfig[]> {
    return Promise.resolve(USSD_GATEWAY_DUMMY_DATA);
  }

  getConfigById(id: number): Promise<USSDGatewayConfig> {
    const config = USSD_GATEWAY_DUMMY_DATA.find((c) => c.id === id);
    if (!config) return Promise.reject(new Error("Config not found"));
    return Promise.resolve(config);
  }

  createConfig(data: CreateUSSDGatewayConfigRequest): Promise<USSDGatewayConfig> {
    const newConfig: USSDGatewayConfig = {
      id: Date.now(),
      ...data,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    return Promise.resolve(newConfig);
  }

  updateConfig(id: number, data: UpdateUSSDGatewayConfigRequest): Promise<USSDGatewayConfig> {
    const config = USSD_GATEWAY_DUMMY_DATA.find((c) => c.id === id);
    const updatedConfig: USSDGatewayConfig = {
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

export const ussdGatewayConfigService = new USSDGatewayConfigService();
