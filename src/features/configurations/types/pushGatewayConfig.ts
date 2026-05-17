import { PushGatewayEnum } from "../../routes/constants/pushNotificationRouteEnums";

export interface PushGatewayConfig {
  id: number;
  name: string;
  description?: string;
  channel_type: "PUSH";
  provider_type: PushGatewayEnum;
  is_active: boolean;
  credentials: PushGatewayCredentials;
  created_at: string;
  updated_at: string;
  created_by?: number;
  updated_by?: number;
}

export interface PushGatewayCredentials {
  server_key?: string;
  sender_id?: string;
  project_id?: string;
  private_key?: string;
  client_email?: string;
  certificate_path?: string;
  certificate_password?: string;
  team_id?: string;
  key_id?: string;
  bundle_id?: string;
}

export interface CreatePushGatewayConfigRequest {
  name: string;
  description?: string;
  provider_type: PushGatewayEnum;
  is_active?: boolean;
  credentials: PushGatewayCredentials;
}

export interface UpdatePushGatewayConfigRequest
  extends Partial<CreatePushGatewayConfigRequest> {}
