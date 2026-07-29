export type RewardProviderFieldType =
  | "text"
  | "password"
  | "number"
  | "boolean"
  | "select";

export interface RewardProviderSchemaField {
  name: string;
  label: string;
  type: RewardProviderFieldType;
  required?: boolean;
  placeholder?: string;
  default?: unknown;
  options?: string[];
}

export interface RewardProviderFieldSchema {
  fields: RewardProviderSchemaField[];
}

export type RewardProviderHttpMethod = "POST" | "PUT" | "PATCH" | "GET";

export interface RewardProvider {
  id: number;
  name: string;
  reward_type: string;
  description?: string | null;
  auth_schema: RewardProviderFieldSchema;
  payload_schema: RewardProviderFieldSchema;
  request_template: Record<string, unknown>;
  api_path: string;
  http_method: RewardProviderHttpMethod;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface CreateRewardProviderRequest {
  name: string;
  reward_type: string;
  description?: string | null;
  auth_schema: RewardProviderFieldSchema;
  payload_schema: RewardProviderFieldSchema;
  request_template: Record<string, unknown>;
  api_path: string;
  http_method?: RewardProviderHttpMethod;
  is_active?: boolean;
}

export interface UpdateRewardProviderRequest {
  name?: string;
  reward_type?: string;
  description?: string | null;
  auth_schema?: RewardProviderFieldSchema;
  payload_schema?: RewardProviderFieldSchema;
  request_template?: Record<string, unknown>;
  api_path?: string;
  http_method?: RewardProviderHttpMethod;
  is_active?: boolean;
}

export interface RewardProviderListParams {
  reward_type?: string;
}
