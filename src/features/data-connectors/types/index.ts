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

// Type-specific configurations
export interface JDBCConfig {
  type: "jdbc";
  hostname: string;
  port: number;
  database: string;
  username: string;
  password: string;
  driver?: string;
  connectionString?: string;
}

export interface APIConfig {
  type: "api";
  url: string;
  method: "GET" | "POST" | "PUT" | "DELETE";
  headers?: Record<string, string>;
  authentication: {
    type: "none" | "basic" | "bearer" | "api_key";
    credentials?: Record<string, string>;
  };
}

export interface TCPConfig {
  type: "tcp";
  host: string;
  port: number;
  protocol?: string;
}

export interface WebSocketConfig {
  type: "websocket";
  url: string;
  protocols?: string[];
  reconnect?: boolean;
  reconnectInterval?: number;
}

export interface KafkaConfig {
  type: "kafka";
  brokers: string[];
  topics: string[];
  groupId?: string;
  clientId?: string;
}

export interface FileConfig {
  type: "files";
  path: string;
  fileType: "SFTP" | "FTP" | "S3" | "Azure Blob" | "Local";
  credentials?: {
    username?: string;
    password?: string;
    accessKey?: string;
    secretKey?: string;
  };
}

export interface SMSInboxConfig {
  type: "sms_inbox";
  provider: string;
  credentials: Record<string, string>;
  phoneNumber?: string;
  apiEndpoint?: string;
}

// Discriminated union
export type DataConnectorConfig =
  | JDBCConfig
  | APIConfig
  | TCPConfig
  | WebSocketConfig
  | KafkaConfig
  | FileConfig
  | SMSInboxConfig;

export interface DataConnector {
  id: string;
  name: string;
  type: DataConnectorType;
  description: string;
  icon: LucideIcon;
  color: string;
  isActive: boolean;
  lastUsed?: Date;
  connectionCount?: number;
  config?: DataConnectorConfig;
}

export interface ConnectorIconMapping {
  [key: string]: {
    icon: LucideIcon;
    color: string;
  };
}

export interface DataConnectorCardProps {
  connector: DataConnector;
  onClick?: (connector: DataConnector) => void;
  className?: string;
}

export interface DataConnectorsGridProps {
  connectors: DataConnector[];
  onConnectorClick?: (connector: DataConnector) => void;
  className?: string;
}
