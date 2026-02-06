import {
  Network,
  Radio,
  Zap,
  Database,
  MessageSquare,
  Globe,
  FileText,
} from "lucide-react";
import { ConnectorIconMapping, DataConnectorType, DataConnector, ProcessedDataConnector } from "../types";

// Distinct hex colors per connector type (for inline style and Tailwind fallback)
const CONNECTOR_COLORS = {
  tcp: "#2563eb",       // blue-600
  websocket: "#7c3aed", // purple-600
  kafka: "#ca8a04",     // yellow-600
  jdbc: "#16a34a",      // green-600
  sms_inbox: "#ea580c", // orange-600
  api: "#0891b2",       // cyan-600
  files: "#4f46e5",     // indigo-600
  digital_tags: "#dc2626", // red-600
} as const;

export const connectorIcons: ConnectorIconMapping = {
  tcp: {
    icon: Network,
    color: CONNECTOR_COLORS.tcp,
  },
  websocket: {
    icon: Radio,
    color: CONNECTOR_COLORS.websocket,
  },
  kafka: {
    icon: Zap,
    color: CONNECTOR_COLORS.kafka,
  },
  jdbc: {
    icon: Database,
    color: CONNECTOR_COLORS.jdbc,
  },
  sms_inbox: {
    icon: MessageSquare,
    color: CONNECTOR_COLORS.sms_inbox,
  },
  api: {
    icon: Globe,
    color: CONNECTOR_COLORS.api,
  },
  files: {
    icon: FileText,
    color: CONNECTOR_COLORS.files,
  },
  digital_tags: {
    icon: FileText, // fallback icon
    color: CONNECTOR_COLORS.digital_tags,
  },
};

export const getConnectorIcon = (type: DataConnectorType) => {
  return connectorIcons[type] || connectorIcons.jdbc;
};

export const getConnectorDisplayName = (type: DataConnectorType): string => {
  const displayNames: Record<DataConnectorType, string> = {
    tcp: "TCP",
    websocket: "WebSocket",
    kafka: "Kafka",
    jdbc: "JDBC",
    sms_inbox: "SMS Inbox",
    api: "API",
    files: "Files",
    digital_tags: "Digital Tags",
  };

  return displayNames[type] || type;
};

export function processDataConnectors(
  items: DataConnector[]
): ProcessedDataConnector[] {
  return items.map((item) => ({
    ...item,
    lastUsed: item.last_used ? new Date(item.last_used) : undefined,
    connectionCount: item.connection_count ?? 0,
    iconComponent: getConnectorIcon(item.type).icon,
    colorClass: getConnectorIcon(item.type).color,
  }));
};

export const getConnectorDescription = (type: DataConnectorType): string => {
  const descriptions: Record<DataConnectorType, string> = {
    tcp: "TCP socket streams (connection)",
    websocket: "Real-time WebSocket connection",
    kafka: "Apache Kafka message streaming",
    jdbc: "Connect to databases via JDBC",
    sms_inbox: "SMS inbox integration",
    api: "Integrate with REST and GraphQL APIs",
    files: "File upload and processing",
    digital_tags: "Digital tags integration",
  };

  return descriptions[type] || "Data connector";
};
