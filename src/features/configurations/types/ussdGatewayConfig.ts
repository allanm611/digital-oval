export type USSDGatewayProvider = "INFOBIP" | "TWILIO" | "JAMBAZ" | "LIQUID_INTELLIGENT" | "AFRICASTALKING" | "INTERNAL";

export interface USSDGatewayConfig {
  id: number;
  name: string;
  description?: string;
  channel_type: "USSD";
  provider_type: USSDGatewayProvider;
  is_active: boolean;
  credentials: USSDGatewayCredentials;
  created_at: string;
  updated_at: string;
  created_by?: number;
  updated_by?: number;
}

export interface USSDGatewayCredentials {
  api_endpoint: string;
  api_key: string;
  api_secret?: string;
  request_method?: string;
  request_format?: string;
}

export interface CreateUSSDGatewayConfigRequest {
  name: string;
  description?: string;
  provider_type: USSDGatewayProvider;
  is_active?: boolean;
  credentials: USSDGatewayCredentials;
}

export interface UpdateUSSDGatewayConfigRequest extends Partial<CreateUSSDGatewayConfigRequest> {}
