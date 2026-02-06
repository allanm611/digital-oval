// Type definitions for data connectors feature
import { LucideIcon } from "lucide-react";

export type DataConnectorType =
  | "tcp"
  | "websocket"
  | "kafka"
  | "jdbc"
  | "sms_inbox"
  | "api"
  | "files"
  | "digital_tags"; 

export type DatabaseType = 'mysql' | 'postgres' | 'mssql' | 'oracle';
export type TransactionalMode = 'enabled' | 'disabled' | 'auto';
export type FileProtocol = 'local' | 'ftp' | 'sftp';

// Comprehensive configuration
export interface DataConnectorConfiguration {
  // Common fields (all connector types)
  processor?: string;
  scalability_factor?: number;

  // JDBC fields
  database_type?: DatabaseType;
  host?: string;
  port?: number;
  database?: string;
  username?: string;
  password?: string;
  connection_string?: string;
  select_query?: string;
  queries_timemill?: number; // timeout in milliseconds

  // TCP fields
  queue_name?: string;
  socket_timeout?: number;
  non_blocking_io?: boolean;
  reverse_lookup?: boolean;
  direct_buffers?: boolean;
  buffer_size?: number;
  decoder?: string;

  // WebSocket fields
  http_path?: string;
  url?: string;

  // Kafka fields
  brokers?: string[]; // Can be comma-separated string input
  topic_name?: string;
  group_identifier?: string;
  transactional_mode?: TransactionalMode;

  // SMS Inbox fields
  inbox_id?: string | number;
  filter_by_keyword?: boolean;
  keyword_identifier?: string;
  keyword_condition?: string;
  keyword_value?: string;
  provider?: string;

  // Files fields
  input_path?: string;
  output_path?: string;
  regex_pattern?: string;
  protocol?: FileProtocol;
  Connection_Name?: string; 
  // recharge_event?: string;


  // API fields
  method?: 'GET' | 'POST';
  content_type?: 'XML' | 'JSON' | 'QUERY_STRING';
  request_headers?: Record<string, string>; // renamed from headers
  payload_template?: string;
  enable_proxy?: boolean; // renamed from proxy_enabled
  proxy_url?: string;
  proxy_username?: string;
  proxy_password?: string;
  response_timeout?: number; // renamed from response_timeout_seconds
  thread_count?: number;
  messages_per_second?: number;
  service_message_throttle?: number;
  max_batch_size?: number;
  success_response?: string; // Success Response String/Header/Status
  result_code?: string; // Central API Response Result/Code
  result_description?: string; // Central API Response Result/Description
  xpath?: string; // Central API Response XPATH (renamed from success_xpath)
  api_key?: string;

  // Legacy/compatibility fields (deprecated but kept for backward compatibility)
  headers?: Record<string, string>; // deprecated, use request_headers
  proxy_enabled?: boolean; // deprecated, use enable_proxy
  response_timeout_seconds?: number; // deprecated, use response_timeout

  // Additional configuration
  timeout?: number;
  retry_count?: number;
  ssl_enabled?: boolean;
  additional_config?: Record<string, any>;
}

export interface DataConnector {
  id: string;
  name: string;
  type: DataConnectorType;
  description: string;
  icon: string; 
  color: string;
  is_active: boolean;
  last_used?: string; 
  connection_count?: number;
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
  configuration?: DataConnectorConfiguration;
  metadata?: Record<string, any>;
}

// Frontend-specific interface with processed data
export interface ProcessedDataConnector extends DataConnector {
  lastUsed?: Date; // Processed date
  connectionCount?: number; // Processed number
  iconComponent: LucideIcon; // Processed icon component
  colorClass: string; // Processed color class
}

export interface ConnectorIconMapping {
  [key: string]: {
    icon: LucideIcon;
    color: string;
  };
}

export interface DataConnectorCardProps {
  connector: ProcessedDataConnector;
  onClick?: (connector: ProcessedDataConnector) => void;
  onTestConnection?: (connector: ProcessedDataConnector) => void;
  onEdit?: (connector: ProcessedDataConnector) => void;
  onDelete?: (connector: ProcessedDataConnector) => void;
  className?: string;
  isTesting?: boolean;
}

export interface DataConnectorsGridProps {
  connectors: ProcessedDataConnector[];
  onConnectorClick?: (connector: ProcessedDataConnector) => void;
  onTestConnection?: (connector: ProcessedDataConnector) => void;
  onEdit?: (connector: ProcessedDataConnector) => void;
  onDelete?: (connector: ProcessedDataConnector) => void;
  className?: string;
  loading?: boolean;
}

// API Request/Response types
export interface CreateDataConnectorRequest {
  name: string;
  type: DataConnectorType;
  description?: string;
  configuration?: DataConnectorConfiguration;
  metadata?: Record<string, any>;
}

export interface UpdateDataConnectorRequest {
  name?: string;
  description?: string;
  is_active?: boolean;
  configuration?: DataConnectorConfiguration;
  metadata?: Record<string, any>;
}

export interface DataConnectorFilterParams {
  type?: DataConnectorType;
  is_active?: boolean;
  search?: string;
  limit?: number;
  offset?: number;
  created_by?: string;
}

export interface DataConnectorListResponse {
  data: DataConnector[];
  total: number;
  has_more: boolean;
  limit: number;
  offset: number;
}

export interface DataConnectorStatistics {
  total_connectors: number;
  active_connectors: number;
  inactive_connectors: number;
  total_connection_count: number;
  connectors_by_type: ConnectorTypeCount[];
  recently_used: DataConnector[];
}

export interface ConnectorTypeCount {
  type: DataConnectorType;
  count: number;
  active_count: number;
}

export interface ConnectionTestResult {
  success: boolean;
  message: string;
  response_time_ms?: number;
  error_details?: string;
}

export interface ConnectorTypesResponse {
  types: DataConnectorType[];
}

// Form types for frontend
export interface DataConnectorFormData extends CreateDataConnectorRequest {}

// Error types
export interface ApiError {
  error: string;
  message: string;
}

// Validation result from backend
export interface DataConnectorValidationResult {
  is_valid: boolean;
  errors: string[];
  warnings: string[];
}
