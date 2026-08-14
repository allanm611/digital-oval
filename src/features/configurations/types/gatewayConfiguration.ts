export interface GatewayConfiguration {
  id: number;
  name: string;
  provider_id: number;
  channel_id?: number;
  config?: Record<string, unknown>;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
  /** Joined from gateway_providers */
  provider_name?: string;
  /** Joined from communication_channels (backend aliases) */
  channel_value?: string;
  channel_label?: string;
  /** Present on get-by-id from joined provider */
  field_schema?: {
    fields: Array<{
      name: string;
      label: string;
      type: "text" | "password" | "number" | "boolean" | "select";
      required?: boolean;
      placeholder?: string;
      options?: string[];
    }>;
  };
}

export interface CreateGatewayConfigurationRequest {
  name: string;
  provider_id: number;
  config: Record<string, unknown>;
  is_active?: boolean;
}

export interface UpdateGatewayConfigurationRequest {
  name?: string;
  config?: Record<string, unknown>;
  is_active?: boolean;
}

export interface GatewayConfigurationListParams {
  channel_id?: number;
  provider_id?: number;
}
