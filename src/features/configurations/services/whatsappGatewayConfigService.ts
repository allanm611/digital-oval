import {
  WhatsAppGatewayConfig,
  CreateWhatsAppGatewayConfigRequest,
  UpdateWhatsAppGatewayConfigRequest,
} from "../types/whatsappGatewayConfig";

export const WHATSAPP_GATEWAY_DUMMY_DATA: WhatsAppGatewayConfig[] = [
  {
    id: 1,
    name: "Twilio WhatsApp",
    description: "WhatsApp Business API via Twilio",
    channel_type: "WHATSAPP",
    provider_type: "TWILIO",
    is_active: true,
    credentials: {
      api_key: "***hidden***",
      api_secret: "***hidden***",
      business_account_id: "102334567890123456",
      phone_number_id: "1234567890123456",
      display_name: "Company Support",
      webhook_url: "https://company.com/webhooks/whatsapp",
      webhook_verify_token: "***hidden***",
    },
    created_at: "2026-01-25T10:15:00Z",
    updated_at: "2026-04-20T13:00:00Z",
  },
  {
    id: 2,
    name: "MessageBird WhatsApp",
    description: "WhatsApp integration via MessageBird",
    channel_type: "WHATSAPP",
    provider_type: "MESSAGEBIRD",
    is_active: false,
    credentials: {
      api_key: "***hidden***",
      business_account_id: "98765432109876543",
      phone_number_id: "9876543210987654",
      display_name: "Company Info",
      webhook_url: "https://company.com/webhooks/messagebird",
    },
    created_at: "2026-02-20T14:45:00Z",
    updated_at: "2026-04-10T11:20:00Z",
  },
];

class WhatsAppGatewayConfigService {
  getDummyConfigs(): WhatsAppGatewayConfig[] {
    return WHATSAPP_GATEWAY_DUMMY_DATA;
  }

  async getAllConfigs(): Promise<WhatsAppGatewayConfig[]> {
    return WHATSAPP_GATEWAY_DUMMY_DATA;
  }

  getConfigById(id: number): Promise<WhatsAppGatewayConfig> {
    const config = WHATSAPP_GATEWAY_DUMMY_DATA.find((c) => c.id === id);
    if (!config) return Promise.reject(new Error("Config not found"));
    return Promise.resolve(config);
  }

  createConfig(data: CreateWhatsAppGatewayConfigRequest): Promise<WhatsAppGatewayConfig> {
    const newConfig: WhatsAppGatewayConfig = {
      id: Date.now(),
      ...data,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    return Promise.resolve(newConfig);
  }

  updateConfig(id: number, data: UpdateWhatsAppGatewayConfigRequest): Promise<WhatsAppGatewayConfig> {
    const config = WHATSAPP_GATEWAY_DUMMY_DATA.find((c) => c.id === id);
    const updatedConfig: WhatsAppGatewayConfig = {
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

export const whatsappGatewayConfigService = new WhatsAppGatewayConfigService();
