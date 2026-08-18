/** Mirrors cvm-backend manual-rewards API (snake_case on wire). */

export type ManualRewardApiStatus =
  | "pending"
  | "applied"
  | "scheduled"
  | "failed";

export type ManualRewardApiType =
  | "bundle"
  | "airtime"
  | "points"
  | "discount"
  | "cashback";

export interface ManualRewardResource {
  id: number;
  name: string;
  description?: string;
  reward_type: ManualRewardApiType;
  reward_value: string;
  bundle_track?: string;
  audience_type?: "file" | "quicklist" | "direct";
  quicklist_id?: number;
  recipient_count: number;
  status: ManualRewardApiStatus;
  applied_count: number;
  failed_count: number;
  apply_type: "now" | "later";
  scheduled_at?: string;
  preview_data?: Record<string, unknown>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by?: number;
  updated_by?: number;
}

export interface CreateManualRewardRequest {
  reward_configuration_id: number;
  msisdn?: string;
  msisdns?: string[];
  rewardType?: ManualRewardApiType;
  rewardValue?: string;
  bundleTrack?: string;
  description?: string;
  audienceName?: string;
  audienceDescription?: string;
  uploadType?: "direct" | "quicklist" | "file";
  quicklistId?: number;
  rowCount?: number;
  applyType?: "now" | "later";
  applyDate?: string;
  applyTime?: string;
  previewData?: Record<string, unknown>;
}

export interface CreateManualRewardGrantedResource {
  configuration_id?: number;
  configuration_name?: string;
  provider_name?: string;
  reward_type?: string;
  api_path?: string;
  parameters_granted?: Record<string, unknown>;
}

export interface CreateManualRewardImmediateData {
  reward_id?: number;
  id?: number;
  msisdn?: string;
  status?: ManualRewardApiStatus;
  granted_resource?: CreateManualRewardGrantedResource;
  provider_response?: unknown;
  error?: { message?: string } | null;
  applied_count?: number;
  failed_count?: number;
}

export interface CreateManualRewardResponse {
  success: boolean;
  message?: string;
  transaction_id?: string;
  data?: ManualRewardResource | CreateManualRewardImmediateData;
  error?: string;
}

export interface ManualRewardListParams {
  limit?: number;
  offset?: number;
  status?: ManualRewardApiStatus;
  rewardType?: ManualRewardApiType;
}

/** PUT /manual-reward/:id — matches backend Joi body (camelCase) */
export interface UpdateManualRewardRequest {
  audienceName?: string;
  audienceDescription?: string;
  uploadType?: "file" | "quicklist";
  quicklistId?: number;
  rowCount?: number;
  rewardType?: ManualRewardApiType;
  rewardValue?: string;
  bundleTrack?: string;
  description?: string;
  applyType?: "now" | "later";
  applyDate?: string;
  applyTime?: string;
  status?: ManualRewardApiStatus;
  /** Merged into existing preview_data (runtime config overrides, config link) */
  previewData?: Record<string, unknown>;
}

export interface UpdateManualRewardResponse {
  success: boolean;
  data: ManualRewardResource;
}

export interface ApplyManualRewardResponse {
  success: boolean;
  message?: string;
  data?: {
    success?: boolean;
    applied?: number;
    failed?: number;
  };
}
