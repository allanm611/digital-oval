import { EmailGatewayEnum } from "../../routes/constants/emailRouteEnums";

export interface EmailGatewayConfig {
  id: number;
  name: string;
  description?: string;
  channel_type: "EMAIL";
  provider_type: EmailGatewayEnum;
  is_active: boolean;
  credentials: EmailGatewayCredentials;
  created_at: string;
  updated_at: string;
  created_by?: number;
  updated_by?: number;
}

export interface EmailGatewayCredentials {
  smtp_host: string;
  smtp_port: number;
  smtp_username: string;
  smtp_password: string;
  from_address: string;
  tls_enabled?: boolean;
  reply_to_address?: string;
}

export interface CreateEmailGatewayConfigRequest {
  name: string;
  description?: string;
  provider_type: EmailGatewayEnum;
  is_active?: boolean;
  credentials: EmailGatewayCredentials;
}

export interface UpdateEmailGatewayConfigRequest
  extends Partial<CreateEmailGatewayConfigRequest> {}
