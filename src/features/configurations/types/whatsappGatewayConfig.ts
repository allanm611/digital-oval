import { WhatsAppGatewayEnum } from "../../routes/constants/whatsappRouteEnums";

export interface WhatsAppGatewayConfig {
  id: number;
  name: string;
  description?: string;
  channel_type: "WHATSAPP";
  provider_type: WhatsAppGatewayEnum;
  is_active: boolean;
  credentials: WhatsAppGatewayCredentials;
  created_at: string;
  updated_at: string;
  created_by?: number;
  updated_by?: number;
}

export interface WhatsAppGatewayCredentials {
  api_key: string;
  api_secret?: string;
  business_account_id?: string;
  webhook_url?: string;
  webhook_verify_token?: string;
  phone_number_id?: string;
  display_name?: string;
}

export interface CreateWhatsAppGatewayConfigRequest {
  name: string;
  description?: string;
  provider_type: WhatsAppGatewayEnum;
  is_active?: boolean;
  credentials: WhatsAppGatewayCredentials;
}

export interface UpdateWhatsAppGatewayConfigRequest
  extends Partial<CreateWhatsAppGatewayConfigRequest> {}
