/**
 * Extraction definition stored on cvm.connection_profile_pipelines.
 * Credentials stay on the connection profile. This record only describes
 * how rows are read, transformed, and written.
 */

import type { PipelineScheduleDraft } from "../utils/pipelineSchedule";

export type PipelineActionType = "PULL" | "PUSH" | "READ" | "SYNC";

export type PipelineSourceType =
  | "FTP_FILE"
  | "DATABASE_QUERY"
  | "REST_API"
  | "KAFKA"
  | "WEBSOCKET"
  | "TCP"
  | "SMS_INBOX";

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

export type MissingValueStrategy =
  | "skip_field"
  | "null"
  | "default"
  | "error";

/** One ETL mapping persisted inside field_mappings JSONB. */
export interface FieldMapping {
  source_field: string;
  target_field: string;
  data_type: FieldDataType;
  conversion: FieldConversion;
  /** Date format, or JSON path when conversion is json_extract. */
  format?: string;
  default_value?: string;
  required: boolean;
  /** Rows match on these columns when load_strategy is UPSERT. */
  is_upsert_key: boolean;
  missing_value_strategy?: MissingValueStrategy;
}

export interface FtpFileSourceConfig {
  remote_path: string;
  file_pattern: string;
  file_format: "csv" | "tsv" | "json" | "parquet" | "xlsx" | "fixed_width";
  delimiter: string;
  has_headers: boolean;
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

/** Read options that are not already stored on the connection profile. */
export interface StreamSourceConfig {
  start_from: "latest" | "earliest";
  record_separator: "newline" | "crlf" | "comma";
  subscribe_message: string;
  keyword: string;
}

export interface FieldMappingDraft extends Omit<FieldMapping, "target_field"> {
  key: string;
  /** Form-facing label; serialized as the ETL runtime's target_field. */
  target_column: string;
}

export interface PipelineFormState {
  connection_profile_id: string;
  pipeline_name: string;
  action_type: PipelineActionType;
  source_type: PipelineSourceType;
  ftp: FtpFileSourceConfig;
  database: DatabaseQuerySourceConfig;
  rest: RestApiSourceConfig;
  stream: StreamSourceConfig;
  mappings: FieldMappingDraft[];
  target_schema: string;
  target_table: string;
  load_strategy: PipelineLoadStrategy;
  batch_size: string;
  is_active: boolean;
  schedule: PipelineScheduleDraft;
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
  schedule_enabled?: boolean;
  schedule_cron?: string | null;
  schedule_timezone?: string;
  last_executed_at?: string | null;
  next_execution_at?: string | null;
  execution_count?: number;
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
  schedule_enabled: boolean;
  schedule_cron: string | null;
  schedule_timezone: string;
}

export type PipelineUpdatePayload = Partial<PipelineWritePayload>;

export interface PipelineListQuery {
  connection_profile_id?: number;
  action_type?: PipelineActionType;
  source_type?: PipelineSourceType;
  is_active?: boolean;
}

export interface PipelineListResponse {
  data: ConnectionProfilePipeline[];
  count: number;
}

export interface PipelineExecutionError {
  stage?: string;
  message?: string;
  error?: string;
  details?: unknown;
}

export interface PipelineExecutionResult {
  success: boolean;
  pipeline_id: number;
  pipeline_name?: string;
  target_table?: string;
  extracted_records?: number;
  transformed_records?: number;
  loaded_records?: number;
  execution_time_ms: number;
  errors?: PipelineExecutionError[];
}
