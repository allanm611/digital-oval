import { DataConnectorType } from "../types";

export const DATA_CONNECTOR_TYPE_OPTIONS = [
  { value: "jdbc" as DataConnectorType, label: "JDBC (Database)" },
  { value: "api" as DataConnectorType, label: "REST API" },
  { value: "kafka" as DataConnectorType, label: "Kafka" },
  { value: "websocket" as DataConnectorType, label: "WebSocket" },
  { value: "tcp" as DataConnectorType, label: "TCP" },
  { value: "files" as DataConnectorType, label: "Files" },
  { value: "sms_inbox" as DataConnectorType, label: "SMS Inbox" },
  { value: "digital_tags" as DataConnectorType, label: "Digital Tags" },
] as const;

/**
 * Maps data connector types to connection profile types
 * Used to filter connection profiles by data connector type
 */
export const DATA_CONNECTOR_TO_CONNECTION_PROFILE_TYPE_MAP: Record<
  DataConnectorType,
  string[]
> = {
  jdbc: ["database"], // JDBC connects to databases
  api: ["api", "webhook"], // API can use REST APIs or webhooks
  kafka: ["kafka"], // Kafka uses Kafka connection profiles
  websocket: [], // WebSocket doesn't have a direct connection profile type
  tcp: [], // TCP doesn't have a direct connection profile type
  files: ["sftp", "ftp", "s3", "azure_blob"], // Files can use various storage types
  sms_inbox: [], // SMS inbox doesn't have a direct connection profile type
  digital_tags: [], // Digital tags doesn't have a direct connection profile type
};

/**
 * Get connection profile types that can be used with a data connector
 */
export function getConnectionProfileTypesForDataConnector(
  dataConnectorType: DataConnectorType,
): string[] {
  return DATA_CONNECTOR_TO_CONNECTION_PROFILE_TYPE_MAP[dataConnectorType] || [];
}
