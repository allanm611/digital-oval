import {
  Network,
  Radio,
  Zap,
  Database,
  MessageSquare,
  Globe,
  FileText,
} from "lucide-react";
import { ConnectorIconMapping, DataConnectorType } from "../types";

const ACCENT_COLOR = "#00BBCC";

export const connectorIcons: ConnectorIconMapping = {
  tcp: {
    icon: Network,
    color: ACCENT_COLOR,
  },
  websocket: {
    icon: Radio,
    color: ACCENT_COLOR,
  },
  kafka: {
    icon: Zap,
    color: ACCENT_COLOR,
  },
  jdbc: {
    icon: Database,
    color: ACCENT_COLOR,
  },
  sms_inbox: {
    icon: MessageSquare,
    color: ACCENT_COLOR,
  },
  api: {
    icon: Globe,
    color: ACCENT_COLOR,
  },
  files: {
    icon: FileText,
    color: ACCENT_COLOR,
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
    digital_tags: "Digital Tags",
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
    digital_tags: "Digital tags integration",
  };

  return descriptions[type] || "Data connector";
};
