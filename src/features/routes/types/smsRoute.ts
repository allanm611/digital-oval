/**
 * Communication Route — maps to backend `system.sms_routes` via `/routes`.
 * Despite the historical "SMS" naming, one route table serves all channels.
 * Channel is resolved via communication_channel_id and/or configuration_id → gateway config.
 *
 * Failover fields (backup_route_id, use_backup_on_failure, retry_attempts) are stored
 * in the route `config` JSONB until dedicated DB columns exist.
 */

export type RouteChannelType = "SMS" | "EMAIL" | "PUSH" | "WHATSAPP" | "USSD" | "";

/** Failover settings persisted under route.config */
export interface RouteFailoverConfig {
  backup_route_id?: number | null;
  use_backup_on_failure?: boolean;
  retry_attempts?: number;
}

export interface SMSRoute {
  id: number;
  name: string;
  description?: string;
  /** Preferred FK → system.gateway_configurations.id */
  configuration_id?: number | null;
  /**
   * FE alias for configuration_id (normalized in routeService).
   * Prefer configuration_id in new code.
   */
  gateway_config_id?: number;
  /** Legacy provider key; prefer configuration_id */
  gateway_provider?: string;
  communication_channel_id?: number | null;
  is_active: boolean;
  config?: Record<string, unknown> & RouteFailoverConfig;
  /** Normalized from config for UI */
  backup_route_id?: number | null;
  use_backup_on_failure?: boolean;
  retry_attempts?: number;
  created_at?: string;
  updated_at?: string;
  created_by?: string;
  updated_by?: string;
  /** Enriched client-side from communication channels / gateway configs */
  channel_type?: RouteChannelType;
  channel_code?: string;
  channel_name?: string;
  configuration_name?: string;
  provider_name?: string;
}

export interface CreateSMSRouteRequest {
  name: string;
  description?: string;
  configuration_id?: number | null;
  /** @deprecated alias — mapped to configuration_id by the service */
  gateway_config_id?: number;
  communication_channel_id?: number | null;
  is_active?: boolean;
  /** Legacy — only if not using configuration_id */
  gateway_provider?: string;
  config?: Record<string, unknown> & RouteFailoverConfig;
  backup_route_id?: number | null;
  use_backup_on_failure?: boolean;
  retry_attempts?: number;
}

export interface UpdateSMSRouteRequest {
  name?: string;
  description?: string;
  configuration_id?: number | null;
  /** @deprecated alias — mapped to configuration_id by the service */
  gateway_config_id?: number;
  communication_channel_id?: number | null;
  is_active?: boolean;
  gateway_provider?: string;
  config?: Record<string, unknown> & RouteFailoverConfig;
  backup_route_id?: number | null;
  use_backup_on_failure?: boolean;
  retry_attempts?: number;
}
