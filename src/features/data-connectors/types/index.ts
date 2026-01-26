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
