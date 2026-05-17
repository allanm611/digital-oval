import { SmsGatewayEnum } from "../../routes/constants/smsRouteEnums";

export interface SMSGatewayConfig {
  id: number;
  name: string;
  description?: string;
  channel_type: "SMS";
  provider_type: SmsGatewayEnum;
  is_active: boolean;
  credentials: SMSGatewayCredentials;
  created_at: string;
  updated_at: string;
  created_by?: number;
  updated_by?: number;
}

export interface SMSGatewayCredentials {
  api_key: string;
  api_secret?: string;
  account_sid?: string;
  phone_number?: string;
  gateway_url?: string;
  messaging_service_id?: string;
}

export interface CreateSMSGatewayConfigRequest {
  name: string;
  description?: string;
  provider_type: SmsGatewayEnum;
  is_active?: boolean;
  credentials: SMSGatewayCredentials;
}

export interface UpdateSMSGatewayConfigRequest
  extends Partial<CreateSMSGatewayConfigRequest> {}
