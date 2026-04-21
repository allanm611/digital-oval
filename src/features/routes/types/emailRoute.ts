import { EmailGatewayEnum } from "../constants/emailRouteEnums";

export interface EmailRoute {
  id: number;
  name: string;
  description?: string;
  gateway_provider: EmailGatewayEnum;
  smtp_host: string;
  smtp_port: number;
  smtp_username: string;
  smtp_password: string;
  from_address: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by?: number;
  updated_by?: number;
}

export interface CreateEmailRouteRequest {
  name: string;
  description?: string;
  gateway_provider: EmailGatewayEnum;
  smtp_host: string;
  smtp_port: number;
  smtp_username: string;
  smtp_password: string;
  from_address: string;
  is_active?: boolean;
}

export interface UpdateEmailRouteRequest {
  name?: string;
  description?: string;
  gateway_provider?: EmailGatewayEnum;
  smtp_host?: string;
  smtp_port?: number;
  smtp_username?: string;
  smtp_password?: string;
  from_address?: string;
  is_active?: boolean;
}
