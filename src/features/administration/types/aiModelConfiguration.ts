export type AiModelProviderId =
  | "gemini"
  | "openai"
  | "anthropic"
  | "deepseek"
  | "grok"
  | "mistral"
  | "custom";

export interface AiModelOption {
  value: string;
  label: string;
}

export interface AiModelProviderDefinition {
  id: AiModelProviderId;
  name: string;
  description: string;
  docsUrl: string;
  defaultModel: string;
  defaultBaseUrl?: string;
  models: AiModelOption[];
  supportsBaseUrl: boolean;
  supportsOrganization: boolean;
  supportsApiVersion: boolean;
  supportsProjectId: boolean;
  keyPlaceholder: string;
  keyHint: string;
}

export interface AiModelConfiguration {
  id: string;
  provider_id: AiModelProviderId;
  name: string;
  model: string;
  has_api_key: boolean;
  api_key_masked?: string;
  base_url?: string;
  organization?: string;
  api_version?: string;
  project_id?: string;
  temperature: number;
  max_output_tokens: number;
  timeout_ms: number;
  is_active: boolean;
  is_default: boolean;
  created_at?: string;
  updated_at?: string;
}

/** Stored locally only. Never returned from listForGenerate(). */
export interface AiModelConfigurationRecord extends AiModelConfiguration {
  api_key?: string;
}

export interface UpsertAiModelConfigurationRequest {
  name: string;
  model: string;
  api_key?: string;
  base_url?: string;
  organization?: string;
  api_version?: string;
  project_id?: string;
  temperature?: number;
  max_output_tokens?: number;
  timeout_ms?: number;
  is_active?: boolean;
  is_default?: boolean;
}

export interface AiModelGenerateOption {
  id: string;
  provider_id: AiModelProviderId;
  name: string;
  model: string;
  is_default: boolean;
}
