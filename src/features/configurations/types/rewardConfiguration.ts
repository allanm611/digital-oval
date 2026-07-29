export interface RewardConfiguration {
  id: number;
  name: string;
  provider_id: number;
  auth_config: Record<string, unknown>;
  payload_config: Record<string, unknown>;
  is_active?: boolean;
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
}

export interface UpdateRewardConfigurationRequest {
  name?: string;
  auth_config?: Record<string, unknown>;
  payload_config?: Record<string, unknown>;
  is_active?: boolean;
}

export interface RewardConfigurationListParams {
  provider_id?: number;
}
