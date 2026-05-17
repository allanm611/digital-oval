import { EmailGatewayEnum } from "../constants/emailRouteEnums";

export interface EmailRoute {
  id: number;
  name: string;
  description?: string;
  gateway_config_id: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by?: number;
  updated_by?: number;
}

export interface CreateEmailRouteRequest {
  name: string;
  description?: string;
  gateway_config_id: number;
  is_active?: boolean;
}

export interface UpdateEmailRouteRequest {
  name?: string;
  description?: string;
  gateway_config_id?: number;
  is_active?: boolean;
}
