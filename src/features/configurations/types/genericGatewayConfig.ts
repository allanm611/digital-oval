export interface GatewayConfig {
  id: number;
  name: string;
  description?: string;
  channel_type: string;
  provider_type: string;
  is_active: boolean;
  credentials: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface CreateGatewayConfigRequest {
  name: string;
  description?: string;
  channel_type: string;
  provider_type: string;
  is_active: boolean;
  credentials: Record<string, any>;
}

export interface UpdateGatewayConfigRequest {
  name: string;
  description?: string;
  channel_type: string;
  provider_type: string;
  is_active: boolean;
  credentials: Record<string, any>;
}
