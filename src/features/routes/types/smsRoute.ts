import { NotificationChannelEnum, SmsGatewayEnum } from "../constants/smsRouteEnums";

export type RequestMethod = "POST" | "GET" | "PUT" | "PATCH" | "DELETE";
export type RequestFormat = "JSON" | "XML" | "FORM_DATA";

export interface SMSRoute {
  id: number;
  name: string;
  description?: string;
  gateway_config_id: number;
  communication_channel?: NotificationChannelEnum;
  is_active: boolean;
  backup_route_id?: number;
  use_backup_on_failure?: boolean;
  retry_attempts?: number;
  created_at: string;
  updated_at: string;
  created_by?: number;
  updated_by?: number;
}

export interface CreateSMSRouteRequest {
  name: string;
  description?: string;
  gateway_config_id: number;
  communication_channel?: NotificationChannelEnum;
  is_active?: boolean;
  backup_route_id?: number;
  use_backup_on_failure?: boolean;
  retry_attempts?: number;
}

export interface UpdateSMSRouteRequest {
  name?: string;
  description?: string;
  gateway_config_id?: number;
  communication_channel?: NotificationChannelEnum;
  is_active?: boolean;
  backup_route_id?: number;
  use_backup_on_failure?: boolean;
  retry_attempts?: number;
}
