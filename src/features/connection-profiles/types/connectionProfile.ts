export type ConnectionTypeEnum =
  | "database"
  | "jdbc"
  | "api"
  | "webhook"
  | "kafka"
  | "tcp"
  | "websocket"
  | "sms_inbox"
  | "files"
  | "sftp"
  | "ftp"
  | string;

export type DatabaseTypeEnum =
  | "mysql"
  | "postgres"
  | "mssql"
  | "oracle"
  | string;

export type LoadStrategyEnum =
  | "full"
  | "incremental"
  | "delta"
  | "cdc"
  | "merge"
  | "append"
  | "upsert"
  | string;

export type DataClassificationEnum =
  | "public"
  | "internal"
  | "confidential"
  | "restricted"
  | string;

export type EnvironmentEnum =
  | "dev"
  | "staging"
  | "production"
  | "dr"
  | string;

export interface ConnectionProfileType {
  id: number;
  profile_name: string;
  profile_code: string;
  connection_type: ConnectionTypeEnum;
  server_id: number | null;
  database_name: string | null;
  database_type: string | null;
  load_strategy: LoadStrategyEnum;
  sync_column_name: string | null;
  sync_column_type: string | null;
  batch_size: number;
  parallel_threads: number;
  min_pool_size: number;
  max_pool_size: number;
  connection_timeout_seconds: number;
  idle_timeout_seconds: number;
  max_retries: number;
  retry_backoff_multiplier: number;
  circuit_breaker_threshold: number;
  health_check_enabled: boolean;
  health_check_query: string | null;
  last_health_check_at: string | null;
  last_health_check_status: string | null;
  data_classification: DataClassificationEnum;
  contains_pii: boolean;
  gdpr_applicable: boolean;
  environment: EnvironmentEnum;
  is_active: boolean;
  valid_from: string;
  valid_to: string | null;
  encryption_key_version: number;
  created_at: string;
  updated_at: string;
  created_by: number | null;
  updated_by: number | null;
  last_used_at: string | null;
  metadata: Record<string, unknown> | null;
}

export interface CreateConnectionProfilePayload {
  profile_name: string;
  profile_code: string;
  connection_type: ConnectionTypeEnum;
  load_strategy: LoadStrategyEnum;
  environment: EnvironmentEnum;
  batch_size: number;
  parallel_threads: number;
  min_pool_size: number;
  max_pool_size: number;
  connection_timeout_seconds: number;
  idle_timeout_seconds: number;
  max_retries: number;
  retry_backoff_multiplier: number;
  circuit_breaker_threshold: number;
  data_classification: DataClassificationEnum;
  contains_pii: boolean;
  gdpr_applicable: boolean;
  valid_from: string;
  server_id?: number;
  database_name?: string;
  database_type?: string;
  sync_column_name?: string;
  sync_column_type?: string;
  health_check_enabled?: boolean;
  health_check_query?: string;
  valid_to?: string | null;
  encryption_key_version?: number;
  metadata?: Record<string, unknown>;
  configuration?: Record<string, unknown>;
}

export type UpdateConnectionProfilePayload =
  Partial<CreateConnectionProfilePayload> & {
    updated_by?: number;
    is_active?: boolean;
    last_health_check_status?: string | null;
    last_health_check_at?: string | null;
    last_used_at?: string | null;
  };

export interface ConnectionProfileListQuery {
  limit?: number;
  offset?: number;
  skipCache?: boolean;
}

export interface ConnectionProfileListResponse {
  data: ConnectionProfileType[];
  count?: number;
  pagination?: {
    limit?: number;
    offset?: number;
    total?: number;
    hasMore?: boolean;
  };
}

export interface ConnectionProfileSearchQuery {
  profile_name?: string;
  profile_code?: string;
  server_id?: number;
  database_name?: string;
  database_type?: string;
  connection_type?: ConnectionTypeEnum;
  load_strategy?: LoadStrategyEnum;
  environment?: EnvironmentEnum;
  data_classification?: DataClassificationEnum;
  contains_pii?: boolean;
  gdpr_applicable?: boolean;
  health_check_enabled?: boolean;
  is_active?: boolean;
  min_batch_size?: number;
  max_batch_size?: number;
  min_parallel_threads?: number;
  max_parallel_threads?: number;
  limit?: number;
  offset?: number;
  skipCache?: boolean;
}

export interface ConnectionProfileSearchResponse {
  success?: boolean;
  data: ConnectionProfileType[];
  pagination?: {
    limit?: number;
    offset?: number;
    total?: number;
    hasMore?: boolean;
  };
  source?: "cache" | "database" | "database-forced";
}

export interface ConnectionProfileStatsItem {
  count: number;
}

export interface ConnectionProfileTypeStatsItem extends ConnectionProfileStatsItem {
  connection_type: ConnectionTypeEnum | string;
}

export interface ConnectionProfileEnvironmentStatsItem extends ConnectionProfileStatsItem {
  environment: EnvironmentEnum | string;
}

export interface ConnectionProfileDataGovernanceStats {
  classificationCounts?: Record<string, number>;
  piiCount?: number;
  gdprCount?: number;
  total?: number;
  [key: string]: number | Record<string, number> | undefined;
}

export interface BulkActivateConnectionProfilesRequest {
  profile_ids: number[];
  updated_by?: number;
}

export interface BulkActivateConnectionProfilesResponse {
  activated: number;
  total: number;
  errors?: Array<{ id: number; message: string }>;
}

export interface AutoDeactivateExpiredRequest {
  updated_by?: number;
}

export interface AutoDeactivateExpiredResponse {
  deactivated: number;
}

export interface ConnectionProfileHealthCheckPayload {
  status: "healthy" | "unhealthy";
}

export interface ConnectionProfileValidityPayload {
  valid_from: string;
  valid_to: string | null;
  updated_by?: number;
}

export interface ConnectionProfileValidityResponse {
  data: {
    id: number;
    is_valid: boolean;
  };
  success?: boolean;
}
