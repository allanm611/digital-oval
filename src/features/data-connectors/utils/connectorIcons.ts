import {
  Network,
  Radio,
  Zap,
  Database,
  MessageSquare,
  Globe,
  FileText,
  Tag,
} from "lucide-react";
import { ConnectorIconMapping, DataConnectorType } from "../types";

export const connectorIcons: ConnectorIconMapping = {
  tcp: {
    icon: Network,
    color: "text-blue-600",
  },
  websocket: {
    icon: Radio,
    color: "text-purple-600",
  },
  kafka: {
    icon: Zap,
    color: "text-yellow-600",
  },
  jdbc: {
    icon: Database,
    color: "text-green-600",
  },
  sms_inbox: {
    icon: MessageSquare,
    color: "text-orange-600",
  },
  api: {
    icon: Globe,
    color: "text-cyan-600",
  },
  files: {
    icon: FileText,
    color: "text-indigo-600",
  },
  digital_tags: {
    icon: Tag,
    color: "text-rose-600",
  },
};

export const getConnectorIcon = (type: DataConnectorType) => {
  return connectorIcons[type] || connectorIcons.database;
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
    digital_tags: "Digital Plus Tags",
  };

  return displayNames[type] || type;
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
    digital_tags: "Web and tag-based event collection",
  };

  return descriptions[type] || "Data connector";
};
