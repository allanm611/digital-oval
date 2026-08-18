export interface RewardConfiguration {
  id: number;
  name: string;
  provider_id: number;
  auth_config: Record<string, unknown>;
  payload_config: Record<string, unknown>;
  is_active?: boolean;
  /**
   * System default template for the provider (one per provider).
   * Seeded on provider create / lazy-ensured for legacy providers.
   * Kept in sync with the provider schema when the provider is edited
   * (locked credentials such as username always inherit the current default).
   * Canonical API field is `is_default_template`; `is_default` is the UI alias.
   */
  is_default?: boolean;
  is_default_template?: boolean;
  /**
   * Client-only fallback built from provider schema defaults when the API
   * cannot persist a default template yet. Not a real configuration id.
   */
  is_virtual?: boolean;
  /** Set on virtual templates when persistence failed (UI diagnostics) */
  _persistenceError?: string;
  created_at?: string;
  updated_at?: string;
  /** Joined from reward_providers (list/get responses) */
  provider_name?: string;
  reward_type?: string;
  api_path?: string;
  /** Present on get-by-id from joined provider */
  request_template?: Record<string, unknown>;
}

export interface CreateRewardConfigurationRequest {
  name: string;
  provider_id: number;
  auth_config: Record<string, unknown>;
  payload_config: Record<string, unknown>;
  is_active?: boolean;
  /** When true, marks this as the provider's default reward template */
  is_default?: boolean;
}

export interface UpdateRewardConfigurationRequest {
  name?: string;
  auth_config?: Record<string, unknown>;
  payload_config?: Record<string, unknown>;
  is_active?: boolean;
  is_default?: boolean;
}

export interface RewardConfigurationListParams {
  provider_id?: number;
  /** When true, list includes inactive configurations (configuration management UI) */
  include_inactive?: boolean;
}
