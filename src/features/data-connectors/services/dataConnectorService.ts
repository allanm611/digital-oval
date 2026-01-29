import {
  DataConnector,
  DataConnectorType,
  JDBCConfig,
  APIConfig,
  TCPConfig,
  WebSocketConfig,
  KafkaConfig,
  FileConfig,
  SMSInboxConfig,
} from "../types";
import {
  getConnectorIcon,
  getConnectorDisplayName,
  getConnectorDescription,
} from "../utils/connectorIcons";

// Mock data for demonstration - in a real app, this would come from an API
const mockConnectors: DataConnector[] = [
  {
    id: "1",
    name: "JDBC",
    type: "jdbc",
    description: getConnectorDescription("jdbc"),
    icon: getConnectorIcon("jdbc").icon,
    color: getConnectorIcon("jdbc").color,
    isActive: true,
    lastUsed: new Date("2026-01-20"),
    connectionCount: 15,
    config: {
      type: "jdbc",
      hostname: "db.example.com",
      port: 5432,
      database: "customer_db",
      username: "db_user",
      password: "********",
      driver: "postgresql",
      connectionString: "jdbc:postgresql://db.example.com:5432/customer_db",
    } as JDBCConfig,
  },
  {
    id: "2",
    name: "API",
    type: "api",
    description: getConnectorDescription("api"),
    icon: getConnectorIcon("api").icon,
    color: getConnectorIcon("api").color,
    isActive: true,
    lastUsed: new Date("2026-01-14"),
    connectionCount: 3,
    config: {
      type: "api",
      url: "https://api.example.com/v1",
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "Sentra/1.0",
      },
      authentication: {
        type: "bearer",
        credentials: {
          token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
        },
      },
    } as APIConfig,
  },
  {
    id: "3",
    name: "Sms inbox",
    type: "sms_inbox",
    description: getConnectorDescription("sms_inbox"),
    icon: getConnectorIcon("sms_inbox").icon,
    color: getConnectorIcon("sms_inbox").color,
    isActive: false,
    lastUsed: new Date("2026-01-10"),
    connectionCount: 1,
    config: {
      type: "sms_inbox",
      provider: "Twilio",
      credentials: {
        accountSid: "AC****",
        authToken: "********",
      },
      phoneNumber: "+1234567890",
      apiEndpoint: "https://api.twilio.com",
    } as SMSInboxConfig,
  },
  {
    id: "4",
    name: "TCP",
    type: "tcp",
    description: getConnectorDescription("tcp"),
    icon: getConnectorIcon("tcp").icon,
    color: getConnectorIcon("tcp").color,
    isActive: true,
    lastUsed: new Date("2024-01-13"),
    connectionCount: 7,
    config: {
      type: "tcp",
      host: "10.0.0.5",
      port: 9000,
      protocol: "tcp/ip",
    } as TCPConfig,
  },
  {
    id: "5",
    name: "Kafka",
    type: "kafka",
    description: getConnectorDescription("kafka"),
    icon: getConnectorIcon("kafka").icon,
    color: getConnectorIcon("kafka").color,
    isActive: false,
    lastUsed: new Date("2026-01-17"),
    connectionCount: 250,
    config: {
      type: "kafka",
      brokers: [
        "kafka-1.example.com:9092",
        "kafka-2.example.com:9092",
        "kafka-3.example.com:9092",
      ],
      topics: ["customer_events", "orders"],
      groupId: "sentra-consumer-group",
      clientId: "sentra-client-1",
    } as KafkaConfig,
  },
  {
    id: "6",
    name: "Websocket",
    type: "websocket",
    description: getConnectorDescription("websocket"),
    icon: getConnectorIcon("websocket").icon,
    color: getConnectorIcon("websocket").color,
    isActive: true,
    lastUsed: new Date("2024-01-16"),
    connectionCount: 4,
    config: {
      type: "websocket",
      url: "wss://events.example.com/stream",
      protocols: ["chat", "superchat"],
      reconnect: true,
      reconnectInterval: 5000,
    } as WebSocketConfig,
  },
  {
    id: "7",
    name: "File",
    type: "files",
    description: getConnectorDescription("files"),
    icon: getConnectorIcon("files").icon,
    color: getConnectorIcon("files").color,
    isActive: true,
    lastUsed: new Date("2026-01-11"),
    connectionCount: 2,
    config: {
      type: "files",
      path: "/data/uploads/customer_data",
      fileType: "SFTP",
      credentials: {
        username: "sftp_user",
        password: "********",
      },
    } as FileConfig,
  },
];

export interface FetchDataConnectorsParams {
  type?: DataConnectorType;
  isActive?: boolean;
  search?: string;
  limit?: number;
  offset?: number;
}

export interface DataConnectorsResponse {
  data: DataConnector[];
  total: number;
  hasMore: boolean;
}

/**
 * Fetch data connectors with optional filtering
 */
export const fetchDataConnectors = async (
  params: FetchDataConnectorsParams = {},
): Promise<DataConnectorsResponse> => {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 500));

  let filteredConnectors = [...mockConnectors];

  // Filter by type
  if (params.type) {
    filteredConnectors = filteredConnectors.filter(
      (connector) => connector.type === params.type,
    );
  }

  // Filter by active status
  if (params.isActive !== undefined) {
    filteredConnectors = filteredConnectors.filter(
      (connector) => connector.isActive === params.isActive,
    );
  }

  // Filter by search term
  if (params.search) {
    const searchLower = params.search.toLowerCase();
    filteredConnectors = filteredConnectors.filter(
      (connector) =>
        connector.name.toLowerCase().includes(searchLower) ||
        connector.description.toLowerCase().includes(searchLower) ||
        getConnectorDisplayName(connector.type)
          .toLowerCase()
          .includes(searchLower),
    );
  }

  // Apply pagination
  const limit = params.limit || 20;
  const offset = params.offset || 0;
  const paginatedConnectors = filteredConnectors.slice(offset, offset + limit);

  return {
    data: paginatedConnectors,
    total: filteredConnectors.length,
    hasMore: offset + limit < filteredConnectors.length,
  };
};

/**
 * Get a single data connector by ID
 */
export const fetchDataConnectorById = async (
  id: string,
): Promise<DataConnector | null> => {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 300));

  return mockConnectors.find((connector) => connector.id === id) || null;
};

/**
 * Get available connector types
 */
export const getAvailableConnectorTypes = (): DataConnectorType[] => {
  return [
    "jdbc",
    "api",
    "kafka",
    "websocket",
    "tcp",
    "files",
    "sms_inbox",
  ] as DataConnectorType[];
};

/**
 * Create a new data connector
 */
export const createDataConnector = async (
  connectorData: Omit<DataConnector, "id" | "icon" | "color">,
): Promise<DataConnector> => {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 800));

  const newConnector: DataConnector = {
    ...connectorData,
    id: Date.now().toString(),
    icon: getConnectorIcon(connectorData.type).icon,
    color: getConnectorIcon(connectorData.type).color,
  };

  // In a real app, this would be sent to the API
  mockConnectors.push(newConnector);

  return newConnector;
};

/**
 * Update an existing data connector
 */
export const updateDataConnector = async (
  id: string,
  updates: Partial<Omit<DataConnector, "id" | "icon" | "color">>,
): Promise<DataConnector | null> => {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 600));

  const connectorIndex = mockConnectors.findIndex((c) => c.id === id);
  if (connectorIndex === -1) {
    return null;
  }

  const updatedConnector = {
    ...mockConnectors[connectorIndex],
    ...updates,
  };

  mockConnectors[connectorIndex] = updatedConnector;

  return updatedConnector;
};

/**
 * Delete a data connector
 */
export const deleteDataConnector = async (id: string): Promise<boolean> => {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 500));

  const connectorIndex = mockConnectors.findIndex((c) => c.id === id);
  if (connectorIndex === -1) {
    return false;
  }

  mockConnectors.splice(connectorIndex, 1);
  return true;
};
