/**
 * Extraction definition stored on cvm.connection_profile_pipelines.
 * Credentials stay on the connection profile. This record only describes
 * how rows are read, transformed, and written.
 */

export type PipelineActionType = "PULL" | "PUSH" | "READ" | "SYNC";

export type PipelineSourceType = "FTP_FILE" | "DATABASE_QUERY" | "REST_API";

export type PipelineLoadStrategy = "BATCH_INSERT" | "UPSERT" | "APPEND";

export type FieldDataType =
  | "string"
  | "number"
  | "integer"
  | "boolean"
  | "date"
  | "timestamp"
  | "json";

export type FieldConversion =
  | "none"
  | "trim"
  | "uppercase"
  | "lowercase"
  | "to_number"
  | "to_integer"
  | "to_boolean"
  | "to_date"
  | "to_timestamp"
  | "json_extract";

/** One Quicklist-style column mapping. Persisted inside field_mappings JSONB. */
export interface FieldMapping {
  source_field: string;
  target_column: string;
  data_type: FieldDataType;
  conversion: FieldConversion;
  /** Date format, or JSON path when conversion is json_extract. */
  format?: string;
  default_value?: string;
  required: boolean;
  /** Rows match on these columns when load_strategy is UPSERT. */
  is_upsert_key: boolean;
}

export interface FtpFileSourceConfig {
  remote_path: string;
  file_pattern: string;
  file_format: "csv" | "tsv" | "json" | "parquet" | "xlsx" | "fixed_width";
  delimiter: string;
  has_header: boolean;
  encoding: string;
  archive_after_read: boolean;
  archive_path: string;
}

export interface DatabaseQuerySourceConfig {
  query: string;
  incremental_column: string;
  incremental_type: "none" | "timestamp" | "numeric";
  /** JSON object string edited in the form, stored as an object. */
  parameters_json: string;
}

export interface RestApiSourceConfig {
  endpoint: string;
  method: "GET" | "POST";
  response_path: string;
  pagination: "none" | "offset" | "page" | "cursor";
  page_param: string;
  size_param: string;
  page_size: number;
  query_params_json: string;
  headers_json: string;
  body_template: string;
}

export interface FieldMappingDraft extends FieldMapping {
  key: string;
}

export interface PipelineFormState {
  connection_profile_id: string;
  pipeline_name: string;
  action_type: PipelineActionType;
  source_type: PipelineSourceType;
  ftp: FtpFileSourceConfig;
  database: DatabaseQuerySourceConfig;
  rest: RestApiSourceConfig;
  mappings: FieldMappingDraft[];
  target_schema: string;
  target_table: string;
  load_strategy: PipelineLoadStrategy;
  batch_size: string;
  is_active: boolean;
}

export interface ConnectionProfilePipeline {
  id: number;
  connection_profile_id: number;
  pipeline_name: string;
  action_type: PipelineActionType;
  source_type: PipelineSourceType;
  source_config: Record<string, unknown>;
  field_mappings: FieldMapping[];
  target_schema: string;
  target_table: string;
  load_strategy: PipelineLoadStrategy;
  batch_size: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  profile_name?: string;
  connection_type?: string;
}

export interface PipelineWritePayload {
  connection_profile_id: number;
  pipeline_name: string;
  action_type: PipelineActionType;
  source_type: PipelineSourceType;
  source_config: Record<string, unknown>;
  field_mappings: FieldMapping[];
  target_schema: string;
  target_table: string;
  load_strategy: PipelineLoadStrategy;
  batch_size: number;
  is_active: boolean;
}

export interface PipelineListQuery {
  connection_profile_id?: number;
  action_type?: PipelineActionType;
  source_type?: PipelineSourceType;
  is_active?: boolean;
  limit?: number;
  offset?: number;
  skipCache?: boolean;
}

export interface PipelineListResponse {
  data: ConnectionProfilePipeline[];
  count?: number;
  /** sample = local rows used until /connection-profile-pipelines is deployed */
  source?: "api" | "sample";
  pagination?: {
    limit?: number;
    offset?: number;
    total?: number;
    hasMore?: boolean;
  };
}
