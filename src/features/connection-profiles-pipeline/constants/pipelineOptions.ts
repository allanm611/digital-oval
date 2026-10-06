import {
  PipelineActionType,
  PipelineLoadStrategy,
  PipelineSourceType,
  FieldConversion,
  FieldDataType,
} from "../types/pipeline";

export const ACTION_TYPE_OPTIONS: Array<{
  value: PipelineActionType;
  label: string;
  description: string;
}> = [
  {
    value: "PULL",
    label: "Pull",
    description: "Ingest rows from the source into the warehouse.",
  },
  {
    value: "PUSH",
    label: "Push",
    description: "Export rows from the warehouse to the remote system.",
  },
  {
    value: "READ",
    label: "Read",
    description: "Query the source without a scheduled load.",
  },
  {
    value: "SYNC",
    label: "Sync",
    description: "Keep the target aligned with the source.",
  },
];

export const SOURCE_TYPE_OPTIONS: Array<{
  value: PipelineSourceType;
  label: string;
  description: string;
}> = [
  {
    value: "FTP_FILE",
    label: "File",
    description: "Remote folder, file pattern, and file format.",
  },
  {
    value: "DATABASE_QUERY",
    label: "Database query",
    description: "SQL run through the connection profile.",
  },
  {
    value: "REST_API",
    label: "REST API",
    description: "HTTP endpoint, response path, and pagination.",
  },
  {
    value: "KAFKA",
    label: "Kafka",
    description: "Messages from the topic configured on the connection profile.",
  },
  {
    value: "WEBSOCKET",
    label: "WebSocket",
    description: "Messages from the WebSocket configured on the connection profile.",
  },
  {
    value: "TCP",
    label: "TCP",
    description: "Records from the TCP connection configured on the connection profile.",
  },
  {
    value: "SMS_INBOX",
    label: "SMS inbox",
    description: "Messages from the inbox configured on the connection profile.",
  },
];

export const LOAD_STRATEGY_OPTIONS: Array<{
  value: PipelineLoadStrategy;
  label: string;
  description: string;
}> = [
  {
    value: "BATCH_INSERT",
    label: "Batch insert",
    description: "Insert each batch as new rows.",
  },
  {
    value: "UPSERT",
    label: "Upsert",
    description: "Match on key columns, then insert or update.",
  },
  {
    value: "APPEND",
    label: "Append",
    description: "Add rows without checking for duplicates.",
  },
];

export const FILE_FORMAT_OPTIONS = [
  { value: "csv", label: "CSV" },
  { value: "tsv", label: "TSV" },
  { value: "json", label: "JSON" },
  { value: "parquet", label: "Parquet" },
  { value: "xlsx", label: "Excel" },
  { value: "fixed_width", label: "Fixed width" },
];

export const DATA_TYPE_OPTIONS: Array<{ value: FieldDataType; label: string }> = [
  { value: "string", label: "String" },
  { value: "number", label: "Number" },
  { value: "integer", label: "Integer" },
  { value: "boolean", label: "Boolean" },
  { value: "date", label: "Date" },
  { value: "timestamp", label: "Timestamp" },
  { value: "json", label: "JSON" },
];

export const CONVERSION_OPTIONS: Array<{
  value: FieldConversion;
  label: string;
}> = [
  { value: "none", label: "None" },
  { value: "trim", label: "Trim" },
  { value: "uppercase", label: "Uppercase" },
  { value: "lowercase", label: "Lowercase" },
  { value: "to_number", label: "To number" },
  { value: "to_integer", label: "To integer" },
  { value: "to_boolean", label: "To boolean" },
  { value: "to_date", label: "To date" },
  { value: "to_timestamp", label: "To timestamp" },
  { value: "json_extract", label: "JSON extract" },
];

export const FILE_CONNECTION_TYPES = [
  "ftp",
  "sftp",
  "files",
  "s3",
  "azure_blob",
  "blob",
  "azure",
];

export const DATABASE_CONNECTION_TYPES = [
  "database",
  "jdbc",
  "postgres",
  "postgresql",
  "mysql",
  "mssql",
  "sqlserver",
  "oracle",
];

export const API_CONNECTION_TYPES = ["api", "webhook", "http", "rest"];

export const KAFKA_CONNECTION_TYPES = ["kafka"];

export const WEBSOCKET_CONNECTION_TYPES = ["websocket"];

export const TCP_CONNECTION_TYPES = ["tcp"];

export const SMS_CONNECTION_TYPES = ["sms_inbox", "sms"];

export const OBJECT_STORAGE_CONNECTION_TYPES = [
  "s3",
  "azure_blob",
  "blob",
  "azure",
];

export function labelFor<T extends string>(
  options: Array<{ value: T; label: string }>,
  value: T,
): string {
  return options.find((option) => option.value === value)?.label ?? value;
}

export function recommendedSourceType(
  connectionType?: string | null,
): PipelineSourceType | null {
  const type = (connectionType || "").trim().toLowerCase();
  if (FILE_CONNECTION_TYPES.includes(type)) return "FTP_FILE";
  if (DATABASE_CONNECTION_TYPES.includes(type)) return "DATABASE_QUERY";
  if (API_CONNECTION_TYPES.includes(type)) return "REST_API";
  if (KAFKA_CONNECTION_TYPES.includes(type)) return "KAFKA";
  if (WEBSOCKET_CONNECTION_TYPES.includes(type)) return "WEBSOCKET";
  if (TCP_CONNECTION_TYPES.includes(type)) return "TCP";
  if (SMS_CONNECTION_TYPES.includes(type)) return "SMS_INBOX";
  return null;
}

export function sourceMatchesConnection(
  sourceType: PipelineSourceType,
  connectionType?: string | null,
): boolean {
  const recommended = recommendedSourceType(connectionType);
  return recommended !== null && recommended === sourceType;
}
