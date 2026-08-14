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
  /**
   * When true (default), the field can be changed on reward templates
   * (create/edit) and on grant/rule runtime overrides.
   * When false, the value is locked to the provider schema default on create,
   * and to the saved template value on edit / overrides.
   * Undefined from older providers is treated as editable for backward compatibility.
   */
  is_editable?: boolean;
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
  /** When true, list includes inactive providers (configuration management UI) */
  include_inactive?: boolean;
}
