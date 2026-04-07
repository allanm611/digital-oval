import React, { useState, useEffect, useCallback } from "react";
import {
  X,
  CheckCircle,
  XCircle,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Listbox } from "@headlessui/react";
import {
  DataConnectorFormData,
  DataConnectorType,
  ProcessedDataConnector,
  ConnectionTestResult,
  DatabaseType,
  TransactionalMode,
  FileProtocol,
} from "../types/dataConnector";
import { getConnectorDisplayName } from "../utils/connectorIcons";
import { dataConnectorService } from "../services/dataConnectorService";
import { color, zIndex } from "../../../shared/utils/utils";
import Checkbox from "../../../shared/components/ui/Checkbox";

interface DataConnectorFormProps {
  connector?: ProcessedDataConnector;
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: DataConnectorFormData) => Promise<void>;
  loading?: boolean;
  availableTypes?: DataConnectorType[];
}

// Configuration schemas for different connector types
const connectorConfigDefaults: Record<DataConnectorType, any> = {
  api: {
    content_type: "JSON",
    method: "POST",
    enable_proxy: false,
    response_timeout: 10,
    thread_count: 1,
    messages_per_second: 10,
    service_message_throttle: 1,
    request_headers: {},
  },
  jdbc: {
    database_type: "mysql",
    host: "",
    port: 3306,
    username: "",
    password: "",
    database: "",
    connection_string: "",
    select_query: "SELECT * FROM table_name",
    queries_timemill: 17000000,
    ssl_enabled: false,
  },
  tcp: {
    buffer_size: 8192,
    socket_timeout: 120000,
    decoder: "",
    non_blocking_io: false,
    reverse_lookup: false,
    direct_buffers: false,
  },
  websocket: {
    url: "ws://localhost:8080",
    http_path: "/ws",
    username: "",
    password: "",
  },
  kafka: {
    topic_name: "",
    brokers: ["localhost:9092"],
    group_identifier: "",
    transactional_mode: "disabled",
  },
  files: {
    protocol: "local",
    Connection_Name: "",
    input_path: "",
    output_path: "",
    regex_pattern: "*.txt",
    multi_dir_by: "created_by",
    job_name: "",
  },
  sms_inbox: {
    provider: "MTN",
    connection_name: "MTN_Inbox_Test",
    short_code: "2112",
    filter_by_keyword: false,
    keyword_delimiter: ",",
    keyword_identifier: "",
    keyword_condition: "",
    keyword_value: "",
  },
  digital_tags: {
    connection_name: "",
    tag_prefix: "",
    enable_tracking: true,
  },
};

// Common Interface for Configuration Components
interface ConfigComponentProps {
  config: any;
  updateConfiguration: (key: string, value: any) => void;
  showPasswords: Record<string, boolean>;
  togglePasswordVisibility: (field: string) => void;
}

// ==================== COMPONENTS FOR EACH CONNECTOR TYPE ====================

// API Configuration Component
const APIConfig: React.FC<ConfigComponentProps> = ({
  config,
  updateConfiguration,
  showPasswords,
  togglePasswordVisibility,
}) => {
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);

  const handleAddHeader = () => {
    const newHeaders = { ...(config.request_headers || {}) };
    let index = 1;
    while (`header_${index}` in newHeaders) index++;
    newHeaders[`header_${index}`] = "";
    updateConfiguration("request_headers", newHeaders);
  };

  const handleRemoveHeader = (key: string) => {
    const newHeaders = { ...(config.request_headers || {}) };
    delete newHeaders[key];
    updateConfiguration("request_headers", newHeaders);
  };

  return (
    <div className="space-y-4">
      <h4 className="text-sm font-semibold text-black">API Configuration</h4>

      {/* Basic Connection Fields */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-black mb-1">
            URL <span className="text-red-500">*</span>
          </label>
          <input
            type="url"
            required
            value={config.url || ""}
            onChange={(e) => updateConfiguration("url", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black text-sm"
            placeholder="https://api.example.com/endpoint"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-black mb-1">
            Host
          </label>
          <input
            type="text"
            value={config.host || ""}
            onChange={(e) => updateConfiguration("host", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black text-sm"
            placeholder="api.example.com"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-black mb-1">
            Username
          </label>
          <input
            type="text"
            value={config.username || ""}
            onChange={(e) => updateConfiguration("username", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black text-sm"
            placeholder="Optional"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-black mb-1">
            Password
          </label>
          <div className="relative">
            <input
              type={showPasswords.api_password ? "text" : "password"}
              value={config.password || ""}
              onChange={(e) => updateConfiguration("password", e.target.value)}
              className="w-full px-3 py-2 pr-8 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
              placeholder="••••••••"
            />
            <button
              type="button"
              onClick={() => togglePasswordVisibility("api_password")}
              className="absolute inset-y-0 right-0 pr-2 flex items-center text-gray-400 hover:text-gray-600"
            >
              {showPasswords.api_password ? (
                <EyeOff size={14} />
              ) : (
                <Eye size={14} />
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-black mb-1">
            Content Type
          </label>
          <Listbox
            value={config.content_type || "JSON"}
            onChange={(val) => updateConfiguration("content_type", val)}
          >
            <div className="relative">
              <Listbox.Button className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black bg-white text-left text-sm">
                {config.content_type || "JSON"}
              </Listbox.Button>
              <Listbox.Options className="absolute top-full left-0 right-0 mt-1 border border-gray-300 rounded-md bg-white shadow-lg z-50">
                <Listbox.Option
                  value="XML"
                  className="px-3 py-2 hover:bg-gray-100 text-black cursor-pointer text-sm"
                >
                  XML
                </Listbox.Option>
                <Listbox.Option
                  value="JSON"
                  className="px-3 py-2 hover:bg-gray-100 text-black cursor-pointer text-sm"
                >
                  JSON
                </Listbox.Option>
                <Listbox.Option
                  value="QUERY_STRING"
                  className="px-3 py-2 hover:bg-gray-100 text-black cursor-pointer text-sm"
                >
                  Query String
                </Listbox.Option>
              </Listbox.Options>
            </div>
          </Listbox>
        </div>
        <div>
          <label className="block text-sm font-medium text-black mb-1">
            Method
          </label>
          <Listbox
            value={config.method || "POST"}
            onChange={(val) => updateConfiguration("method", val)}
          >
            <div className="relative">
              <Listbox.Button className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black bg-white text-left text-sm">
                {config.method || "POST"}
              </Listbox.Button>
              <Listbox.Options className="absolute top-full left-0 right-0 mt-1 border border-gray-300 rounded-md bg-white shadow-lg z-50">
                <Listbox.Option
                  value="POST"
                  className="px-3 py-2 hover:bg-gray-100 text-black cursor-pointer text-sm"
                >
                  POST
                </Listbox.Option>
                <Listbox.Option
                  value="GET"
                  className="px-3 py-2 hover:bg-gray-100 text-black cursor-pointer text-sm"
                >
                  GET
                </Listbox.Option>
              </Listbox.Options>
            </div>
          </Listbox>
        </div>
        <div className="flex items-center">
          <Checkbox
            id="enable_proxy"
            checked={config.enable_proxy || false}
            onChange={(e) =>
              updateConfiguration("enable_proxy", e.target.checked)
            }
            className="mr-2 h-4 w-4 text-blue-600"
          />
          <label htmlFor="enable_proxy" className="text-sm text-black">
            Enable Proxy
          </label>
        </div>
      </div>

      {/* Advanced Settings Section */}
      <div className="mb-2">
        <button
          type="button"
          onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
          className="w-full flex items-center justify-between hover:bg-gray-50 py-2"
        >
          <span className="text-sm font-semibold text-black">
            Advanced configuration
          </span>
          {isAdvancedOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>

        {isAdvancedOpen && (
          <div className="space-y-4 pt-2">
            {/* Request Headers */}
            <div>
              <label className="block text-sm font-medium text-black mb-2">
                Request Headers
              </label>
              <div className="space-y-2">
                {Object.entries(config.request_headers || {}).map(
                  ([key, value]) => (
                    <div key={key} className="flex gap-2">
                      <input
                        type="text"
                        value={key}
                        onChange={(e) => {
                          const newHeaders = { ...config.request_headers };
                          delete newHeaders[key];
                          newHeaders[e.target.value] = value;
                          updateConfiguration("request_headers", newHeaders);
                        }}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
                        placeholder="Header name"
                      />
                      <input
                        type="text"
                        value={value as string}
                        onChange={(e) =>
                          updateConfiguration("request_headers", {
                            ...config.request_headers,
                            [key]: e.target.value,
                          })
                        }
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
                        placeholder="Header value"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveHeader(key)}
                        className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-md"
                      >
                        ×
                      </button>
                    </div>
                  ),
                )}
                <button
                  type="button"
                  onClick={handleAddHeader}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-black hover:bg-gray-50 transition-colors"
                >
                  Add Header
                </button>
              </div>
            </div>

            {/* Request Data */}
            {config.method === "POST" && (
              <div>
                <label className="block text-sm font-medium text-black mb-1">
                  Request Data
                </label>
                <textarea
                  value={config.payload_template || ""}
                  onChange={(e) =>
                    updateConfiguration("payload_template", e.target.value)
                  }
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md font-mono text-sm text-black"
                  placeholder={
                    config.content_type === "XML"
                      ? "<request>...</request>"
                      : '{"key": "value"}'
                  }
                />
              </div>
            )}

            {/* Performance Settings */}
            <div className="grid grid-cols-4 gap-3">
              <div>
                <label className="block text-sm font-medium text-black mb-1">
                  Response Timeout (sec)
                </label>
                <input
                  type="number"
                  value={config.response_timeout || 10}
                  onChange={(e) =>
                    updateConfiguration(
                      "response_timeout",
                      parseInt(e.target.value) || 10,
                    )
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-black text-sm"
                  min="1"
                  max="300"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-black mb-1">
                  Thread Count
                </label>
                <input
                  type="number"
                  value={config.thread_count || 1}
                  onChange={(e) =>
                    updateConfiguration(
                      "thread_count",
                      parseInt(e.target.value) || 1,
                    )
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-black text-sm"
                  min="1"
                  max="100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-black mb-1">
                  Messages Per Second
                </label>
                <input
                  type="number"
                  value={config.messages_per_second || 10}
                  onChange={(e) =>
                    updateConfiguration(
                      "messages_per_second",
                      parseInt(e.target.value) || 10,
                    )
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-black text-sm"
                  min="1"
                  max="10000"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-black mb-1">
                  Service Message Throttle
                </label>
                <input
                  type="number"
                  value={config.service_message_throttle || 1}
                  onChange={(e) =>
                    updateConfiguration(
                      "service_message_throttle",
                      parseInt(e.target.value) || 1,
                    )
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-black text-sm"
                  min="1"
                  max="100"
                />
              </div>
            </div>

            {/* Response Configuration */}
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-sm font-medium text-black mb-1">
                  Success Response String(s)
                </label>
                <input
                  type="text"
                  value={config.success_response || ""}
                  onChange={(e) =>
                    updateConfiguration("success_response", e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  placeholder="Success string/header/status"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-black mb-1">
                  Result Code XPATH
                </label>
                <input
                  type="text"
                  value={config.result_code || ""}
                  onChange={(e) =>
                    updateConfiguration("result_code", e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  placeholder="API response code"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-black mb-1">
                  Result Code Description XPATH
                </label>
                <input
                  type="text"
                  value={config.result_description || ""}
                  onChange={(e) =>
                    updateConfiguration("result_description", e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  placeholder="Response description"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-black mb-1">
                Result XPath
              </label>
              <input
                type="text"
                value={config.xpath || ""}
                onChange={(e) => updateConfiguration("xpath", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                placeholder="//response/result"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// JDBC Configuration Component
const JDBCConfig: React.FC<ConfigComponentProps> = ({
  config,
  updateConfiguration,
  showPasswords,
  togglePasswordVisibility,
}) => {
  const [isQueryOpen, setIsQueryOpen] = useState(false);

  return (
    <div className="space-y-4">
      <h4 className="text-sm font-semibold text-black">JDBC Configuration</h4>

      {/* Database Type Selection */}
      <div>
        <label className="block text-sm font-medium text-black mb-1">
          Database Type
        </label>
        <Listbox
          value={config.database_type || "mysql"}
          onChange={(val) =>
            updateConfiguration("database_type", val as DatabaseType)
          }
        >
          <div className="relative">
            <Listbox.Button className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black bg-white text-left">
              {config.database_type
                ? config.database_type === "mysql"
                  ? "MySQL"
                  : config.database_type === "postgres"
                    ? "PostgreSQL"
                    : config.database_type === "mssql"
                      ? "Microsoft SQL Server"
                      : "Oracle"
                : "MySQL"}
            </Listbox.Button>
            <Listbox.Options className="absolute top-full left-0 right-0 mt-1 border border-gray-300 rounded-md bg-white shadow-lg z-50">
              <Listbox.Option
                value="mysql"
                className="px-3 py-2 hover:bg-gray-100 text-black cursor-pointer text-sm"
              >
                MySQL
              </Listbox.Option>
              <Listbox.Option
                value="postgres"
                className="px-3 py-2 hover:bg-gray-100 text-black cursor-pointer text-sm"
              >
                PostgreSQL
              </Listbox.Option>
              <Listbox.Option
                value="mssql"
                className="px-3 py-2 hover:bg-gray-100 text-black cursor-pointer text-sm"
              >
                Microsoft SQL Server
              </Listbox.Option>
              <Listbox.Option
                value="oracle"
                className="px-3 py-2 hover:bg-gray-100 text-black cursor-pointer text-sm"
              >
                Oracle
              </Listbox.Option>
            </Listbox.Options>
          </div>
        </Listbox>
      </div>

      {/* Connection Details */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-black mb-1">
            Host
          </label>
          <input
            type="text"
            value={config.host || ""}
            onChange={(e) => updateConfiguration("host", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black text-sm"
            placeholder="localhost"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-black mb-1">
            Port
          </label>
          <input
            type="number"
            value={config.port || 3306}
            onChange={(e) =>
              updateConfiguration("port", parseInt(e.target.value) || 3306)
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-black mb-1">
            Database Name
          </label>
          <input
            type="text"
            value={config.database || ""}
            onChange={(e) => updateConfiguration("database", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black text-sm"
            placeholder="database_name"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-black mb-1">
            Query Timeout (ms)
          </label>
          <input
            type="number"
            value={config.queries_timemill || 17000000}
            onChange={(e) =>
              updateConfiguration(
                "queries_timemill",
                parseInt(e.target.value) || 17000000,
              )
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-black mb-1">
            Username
          </label>
          <input
            type="text"
            value={config.username || ""}
            onChange={(e) => updateConfiguration("username", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-black mb-1">
            Password
          </label>
          <div className="relative">
            <input
              type={showPasswords.jdbc_password ? "text" : "password"}
              value={config.password || ""}
              onChange={(e) => updateConfiguration("password", e.target.value)}
              className="w-full px-3 py-2 pr-8 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
              placeholder="••••••••"
            />
            <button
              type="button"
              onClick={() => togglePasswordVisibility("jdbc_password")}
              className="absolute inset-y-0 right-0 pr-2 flex items-center text-gray-400 hover:text-gray-600"
            >
              {showPasswords.jdbc_password ? (
                <EyeOff size={14} />
              ) : (
                <Eye size={14} />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Connection String (Optional) */}
      <div>
        <label className="block text-sm font-medium text-black mb-1">
          Connection String (Optional - overrides above settings)
        </label>
        <input
          type="text"
          value={config.connection_string || ""}
          onChange={(e) =>
            updateConfiguration("connection_string", e.target.value)
          }
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-black"
          placeholder="jdbc:mysql://localhost:3306/database"
        />
      </div>

      {/* Query Configuration */}
      <div>
        <button
          type="button"
          onClick={() => setIsQueryOpen(!isQueryOpen)}
          className="w-full flex items-center justify-between hover:bg-gray-50"
        >
          <span className="text-sm font-medium text-black">
            Query Configuration
          </span>
          {isQueryOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>

        {isQueryOpen && (
          <div className="pt-2">
            <label className="block text-sm font-medium text-black mb-1">
              SQL Query
            </label>
            <textarea
              value={config.select_query || ""}
              onChange={(e) =>
                updateConfiguration("select_query", e.target.value)
              }
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md font-mono text-sm"
              placeholder="SELECT * FROM table_name WHERE condition"
            />
            <p className="mt-1 text-xs text-gray-500">
              Use this query to fetch data from the database
            </p>
          </div>
        )}
      </div>

      {/* SSL Option */}
      <div className="flex items-center">
        <Checkbox
          id="ssl_enabled"
          checked={config.ssl_enabled || false}
          onChange={(e) => updateConfiguration("ssl_enabled", e.target.checked)}
          className="mr-2 h-4 w-4 text-blue-600"
        />
        <label htmlFor="ssl_enabled" className="text-sm text-black">
          Enable SSL Connection
        </label>
      </div>
    </div>
  );
};

// WebSocket Configuration Component
const WebSocketConfig: React.FC<ConfigComponentProps> = ({
  config,
  updateConfiguration,
  showPasswords,
  togglePasswordVisibility,
}) => {
  return (
    <div className="space-y-4">
      <h4 className="text-sm font-semibold text-black">
        WebSocket Configuration
      </h4>

      <div>
        <label className="block text-sm font-medium text-black mb-1">
          Connection Name
        </label>
        <input
          type="text"
          value={config.connection_name || ""}
          onChange={(e) =>
            updateConfiguration("connection_name", e.target.value)
          }
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="My WebSocket Connection"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-black mb-1">URL</label>
        <input
          type="url"
          value={config.url || ""}
          onChange={(e) => updateConfiguration("url", e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="ws://localhost:8080"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-black mb-1">
          HTTP Path
        </label>
        <input
          type="text"
          value={config.http_path || "/ws"}
          onChange={(e) => updateConfiguration("http_path", e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="/ws"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-black mb-1">
            Username
          </label>
          <input
            type="text"
            value={config.username || ""}
            onChange={(e) => updateConfiguration("username", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Optional"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-black mb-1">
            Password
          </label>
          <div className="relative">
            <input
              type={showPasswords.websocket_password ? "text" : "password"}
              value={config.password || ""}
              onChange={(e) => updateConfiguration("password", e.target.value)}
              className="w-full px-3 py-2 pr-8 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="••••••••"
            />
            <button
              type="button"
              onClick={() => togglePasswordVisibility("websocket_password")}
              className="absolute inset-y-0 right-0 pr-2 flex items-center text-gray-400 hover:text-gray-600"
            >
              {showPasswords.websocket_password ? (
                <EyeOff size={14} />
              ) : (
                <Eye size={14} />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Kafka Configuration Component
const KafkaConfig: React.FC<ConfigComponentProps> = ({
  config,
  updateConfiguration,
}) => {
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);

  const handleBrokersChange = (value: string) => {
    const brokers = value
      .split(",")
      .map((b) => b.trim())
      .filter((b) => b);
    updateConfiguration("brokers", brokers);
  };

  return (
    <div className="space-y-4">
      <h4 className="text-sm font-semibold text-black">Kafka Configuration</h4>

      <div>
        <label className="block text-sm font-medium text-black mb-1">
          Connection Name
        </label>
        <input
          type="text"
          value={config.connection_name || ""}
          onChange={(e) =>
            updateConfiguration("connection_name", e.target.value)
          }
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="My Kafka Connection"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-black mb-1">
          Topic Name
        </label>
        <input
          type="text"
          value={config.topic_name || ""}
          onChange={(e) => updateConfiguration("topic_name", e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="my-topic"
        />
      </div>

      {/* Advanced Settings */}
      <div className="mb-2">
        <button
          type="button"
          onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
          className="w-full flex items-center justify-between hover:bg-gray-50 py-2"
        >
          <span className="text-sm font-semibold text-black">
            Advanced Configuration
          </span>
          {isAdvancedOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>

        {isAdvancedOpen && (
          <div className="space-y-4 pt-2">
            <div>
              <label className="block text-sm font-medium text-black mb-1">
                Brokers
              </label>
              <input
                type="text"
                value={
                  Array.isArray(config.brokers)
                    ? config.brokers.join(", ")
                    : config.brokers || ""
                }
                onChange={(e) => handleBrokersChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-black text-sm"
                placeholder="localhost:9092, localhost:9093"
              />
              <p className="mt-1 text-xs text-gray-500">
                Comma-separated list of broker addresses
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-black mb-1">
                Group Identifier
              </label>
              <input
                type="text"
                value={config.group_identifier || ""}
                onChange={(e) =>
                  updateConfiguration("group_identifier", e.target.value)
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-black text-sm"
                placeholder="my-consumer-group"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-black mb-1">
                Transactional Mode
              </label>
              <Listbox
                value={config.transactional_mode || "disabled"}
                onChange={(val) =>
                  updateConfiguration(
                    "transactional_mode",
                    val as TransactionalMode,
                  )
                }
              >
                <div className="relative">
                  <Listbox.Button className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black bg-white text-left text-sm">
                    {config.transactional_mode === "disabled"
                      ? "Disabled"
                      : config.transactional_mode === "enabled"
                        ? "Enabled"
                        : "Auto"}
                  </Listbox.Button>
                  <Listbox.Options className="absolute top-full left-0 right-0 mt-1 border border-gray-300 rounded-md bg-white shadow-lg z-50">
                    <Listbox.Option
                      value="disabled"
                      className="px-3 py-2 hover:bg-gray-100 text-black cursor-pointer text-sm"
                    >
                      Disabled
                    </Listbox.Option>
                    <Listbox.Option
                      value="enabled"
                      className="px-3 py-2 hover:bg-gray-100 text-black cursor-pointer text-sm"
                    >
                      Enabled
                    </Listbox.Option>
                    <Listbox.Option
                      value="auto"
                      className="px-3 py-2 hover:bg-gray-100 text-black cursor-pointer text-sm"
                    >
                      Auto
                    </Listbox.Option>
                  </Listbox.Options>
                </div>
              </Listbox>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// TCP Configuration Component
const TCPConfig: React.FC<ConfigComponentProps> = ({
  config,
  updateConfiguration,
}) => {
  return (
    <div className="space-y-4">
      <h4 className="text-sm font-semibold text-black">TCP Configuration</h4>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-black mb-1">
            Buffer Size
          </label>
          <input
            type="number"
            value={config.buffer_size || 8192}
            onChange={(e) =>
              updateConfiguration(
                "buffer_size",
                parseInt(e.target.value) || 8192,
              )
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            min="1024"
            max="1048576"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-black mb-1">
            Socket Timeout (ms)
          </label>
          <input
            type="number"
            value={config.socket_timeout || 120000}
            onChange={(e) =>
              updateConfiguration(
                "socket_timeout",
                parseInt(e.target.value) || 120000,
              )
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            min="1000"
            max="300000"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-black mb-1">
          Decoder
        </label>
        <input
          type="text"
          value={config.decoder || ""}
          onChange={(e) => updateConfiguration("decoder", e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Carnage Returned Line Feed"
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center">
          <Checkbox
            id="non_blocking_io"
            checked={config.non_blocking_io || false}
            onChange={(e) =>
              updateConfiguration("non_blocking_io", e.target.checked)
            }
            className="mr-2 h-4 w-4 text-blue-600"
          />
          <label htmlFor="non_blocking_io" className="text-sm text-black">
            Non-blocking I/O
          </label>
        </div>
        <div className="flex items-center">
          <Checkbox
            id="reverse_lookup"
            checked={config.reverse_lookup || false}
            onChange={(e) =>
              updateConfiguration("reverse_lookup", e.target.checked)
            }
            className="mr-2 h-4 w-4 text-blue-600"
          />
          <label htmlFor="reverse_lookup" className="text-sm text-black">
            Reverse Lookup
          </label>
        </div>
        <div className="flex items-center">
          <Checkbox
            id="direct_buffers"
            checked={config.direct_buffers || false}
            onChange={(e) =>
              updateConfiguration("direct_buffers", e.target.checked)
            }
            className="mr-2 h-4 w-4 text-blue-600"
          />
          <label htmlFor="direct_buffers" className="text-sm text-black">
            Direct Buffers
          </label>
        </div>
      </div>
    </div>
  );
};

// Files Configuration Component
const FilesConfig: React.FC<ConfigComponentProps> = ({
  config,
  updateConfiguration,
}) => {
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);

  return (
    <div className="space-y-4">
      <h4 className="text-sm font-semibold text-black">Files Configuration</h4>

      <div>
        <label className="block text-sm font-medium text-black mb-1">
          Job Name
        </label>
        <input
          type="text"
          value={config.job_name || ""}
          onChange={(e) => updateConfiguration("job_name", e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="File Processing Job"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-black mb-1">
          Protocol
        </label>
        <Listbox
          value={config.protocol || "local"}
          onChange={(val) =>
            updateConfiguration("protocol", val as FileProtocol)
          }
        >
          <div className="relative">
            <Listbox.Button className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black bg-white text-left">
              {config.protocol === "ftp"
                ? "FTP"
                : config.protocol === "sftp"
                  ? "SFTP"
                  : "Local File System"}
            </Listbox.Button>
            <Listbox.Options className="absolute top-full left-0 right-0 mt-1 border border-gray-300 rounded-md bg-white shadow-lg z-50">
              <Listbox.Option
                value="local"
                className="px-3 py-2 hover:bg-gray-100 text-black cursor-pointer text-sm"
              >
                Local File System
              </Listbox.Option>
              <Listbox.Option
                value="ftp"
                className="px-3 py-2 hover:bg-gray-100 text-black cursor-pointer text-sm"
              >
                FTP
              </Listbox.Option>
              <Listbox.Option
                value="sftp"
                className="px-3 py-2 hover:bg-gray-100 text-black cursor-pointer text-sm"
              >
                SFTP
              </Listbox.Option>
            </Listbox.Options>
          </div>
        </Listbox>
      </div>

      <div>
        <label className="block text-sm font-medium text-black mb-1">
          Connection Name
        </label>
        <input
          type="text"
          value={config.Connection_Name || ""}
          onChange={(e) =>
            updateConfiguration("Connection_Name", e.target.value)
          }
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="File Connection Name"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-black mb-1">
            Input Path
          </label>
          <input
            type="text"
            value={config.input_path || ""}
            onChange={(e) => updateConfiguration("input_path", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="/path/to/input"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-black mb-1">
            Output Path
          </label>
          <input
            type="text"
            value={config.output_path || ""}
            onChange={(e) => updateConfiguration("output_path", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="/path/to/output"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-black mb-1">
          Regex
        </label>
        <input
          type="text"
          value={config.regex_pattern || ""}
          onChange={(e) => updateConfiguration("regex_pattern", e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="*.txt, *.csv, data_*.log"
        />
        <p className="mt-1 text-xs text-gray-500">
          Pattern to match files (e.g., *.txt, *.csv)
        </p>
      </div>

      {(config.protocol === "ftp" || config.protocol === "sftp") && (
        <>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-black mb-1">
                Host
              </label>
              <input
                type="text"
                value={config.host || ""}
                onChange={(e) => updateConfiguration("host", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-black text-sm"
                placeholder="ftp.example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-black mb-1">
                Port
              </label>
              <input
                type="number"
                value={config.port || (config.protocol === "sftp" ? 22 : 21)}
                onChange={(e) =>
                  updateConfiguration("port", parseInt(e.target.value))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-black text-sm"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-black mb-1">
                Username
              </label>
              <input
                type="text"
                value={config.username || ""}
                onChange={(e) =>
                  updateConfiguration("username", e.target.value)
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-black text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-black mb-1">
                Password
              </label>
              <input
                type="password"
                value={config.password || ""}
                onChange={(e) =>
                  updateConfiguration("password", e.target.value)
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-black text-sm"
              />
            </div>
          </div>
        </>
      )}

      {/* Advanced Settings */}
      <div className="border border-gray-200 rounded-md mb-2">
        <button
          type="button"
          onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
          className="w-full flex items-center justify-between px-3 py-2 bg-gray-50 hover:bg-gray-100 rounded-t-md"
        >
          <span className="text-sm font-semibold text-black">
            Advanced configuration
          </span>
          {isAdvancedOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>

        {isAdvancedOpen && (
          <div className="space-y-4 pt-2">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-black mb-1">
                  Polling Interval (sec)
                </label>
                <input
                  type="number"
                  value={config.polling_interval || 60}
                  onChange={(e) =>
                    updateConfiguration(
                      "polling_interval",
                      parseInt(e.target.value) || 60,
                    )
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-black text-sm"
                  min="5"
                  max="3600"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-black mb-1">
                  Max File Size (MB)
                </label>
                <input
                  type="number"
                  value={config.max_file_size || 100}
                  onChange={(e) =>
                    updateConfiguration(
                      "max_file_size",
                      parseInt(e.target.value) || 100,
                    )
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-black text-sm"
                  min="1"
                  max="10000"
                />
              </div>
            </div>

            <div className="flex items-center">
              <Checkbox
                id="delete_after_process"
                checked={config.delete_after_process || false}
                onChange={(e) =>
                  updateConfiguration("delete_after_process", e.target.checked)
                }
                className="mr-2 h-4 w-4 text-blue-600"
              />
              <label
                htmlFor="delete_after_process"
                className="text-sm text-black"
              >
                Delete files after processing
              </label>
            </div>

            <div className="flex items-center">
              <Checkbox
                id="create_backup"
                checked={config.create_backup || true}
                onChange={(e) =>
                  updateConfiguration("create_backup", e.target.checked)
                }
                className="mr-2 h-4 w-4 text-blue-600"
              />
              <label htmlFor="create_backup" className="text-sm text-black">
                Create backup before processing
              </label>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// SMS Inbox Configuration Component - UPDATED BASED ON IMAGE
const SMSInboxConfig: React.FC<ConfigComponentProps> = ({
  config,
  updateConfiguration,
}) => {
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);

  return (
    <div className="space-y-4">
      <h4 className="text-sm font-semibold text-black">
        SMS Inbox Configuration
      </h4>

      {/* Details Section */}
      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-black mb-1">
            Connection Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            value={config.connection_name || "MTN_Inbox_Test"}
            onChange={(e) =>
              updateConfiguration("connection_name", e.target.value)
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="MTN_Inbox_Test"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-black mb-1">
            Select Inbox <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            value={config.short_code || "2112"}
            onChange={(e) => updateConfiguration("short_code", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="2112"
          />
          <p className="mt-1 text-xs text-gray-500">
            Enter the SMS short code/number for this inbox
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-black mb-1">
            Provider
          </label>
          <Listbox
            value={config.provider || "MTN"}
            onChange={(val) => updateConfiguration("provider", val)}
          >
            <div className="relative">
              <Listbox.Button className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black bg-white text-left text-sm">
                {config.provider || "MTN"}
              </Listbox.Button>
              <Listbox.Options className="absolute top-full left-0 right-0 mt-1 border border-gray-300 rounded-md bg-white shadow-lg z-50">
                <Listbox.Option
                  value="MTN"
                  className="px-3 py-2 hover:bg-gray-100 text-black cursor-pointer text-sm"
                >
                  MTN
                </Listbox.Option>
                <Listbox.Option
                  value="Jioce"
                  className="px-3 py-2 hover:bg-gray-100 text-black cursor-pointer text-sm"
                >
                  Jioce
                </Listbox.Option>
                <Listbox.Option
                  value="Test"
                  className="px-3 py-2 hover:bg-gray-100 text-black cursor-pointer text-sm"
                >
                  Test
                </Listbox.Option>
                <Listbox.Option
                  value="Equitel"
                  className="px-3 py-2 hover:bg-gray-100 text-black cursor-pointer text-sm"
                >
                  Equitel
                </Listbox.Option>
                <Listbox.Option
                  value="Airtel"
                  className="px-3 py-2 hover:bg-gray-100 text-black cursor-pointer text-sm"
                >
                  Airtel
                </Listbox.Option>
                <Listbox.Option
                  value="custom"
                  className="px-3 py-2 hover:bg-gray-100 text-black cursor-pointer text-sm"
                >
                  Custom Provider
                </Listbox.Option>
              </Listbox.Options>
            </div>
          </Listbox>
        </div>
      </div>

      {/* Keyword Filter Section */}
      <div>
        <div className="p-3">
          <div className="flex items-center">
            <Checkbox
              id="filter_by_keyword"
              checked={config.filter_by_keyword || false}
              onChange={(e) =>
                updateConfiguration("filter_by_keyword", e.target.checked)
              }
              className="mr-2 h-4 w-4 text-blue-600"
            />
            <label
              htmlFor="filter_by_keyword"
              className="text-sm font-medium text-black"
            >
              Filter messages based on keyword
            </label>
          </div>
        </div>

        {config.filter_by_keyword && (
          <div className="space-y-4 pt-2">
            <div>
              <label className="block text-sm font-medium text-black mb-1">
                Delimiter to identify Keyword
              </label>
              <input
                type="text"
                value={config.keyword_delimiter || ","}
                onChange={(e) =>
                  updateConfiguration("keyword_delimiter", e.target.value)
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-black text-sm"
                placeholder="Comma"
              />
              <p className="mt-1 text-xs text-gray-500">
                Separator used to identify keywords in messages
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-black mb-1">
                Keyword to identify messages
              </label>
              <input
                type="text"
                value={config.keyword_identifier || ""}
                onChange={(e) =>
                  updateConfiguration("keyword_identifier", e.target.value)
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-black text-sm"
                placeholder="Enter keywords to filter"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-black mb-1">
                  Condition on keyword
                </label>
                <Listbox
                  value={config.keyword_condition || "contains"}
                  onChange={(val) =>
                    updateConfiguration("keyword_condition", val)
                  }
                >
                  <div className="relative">
                    <Listbox.Button className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black bg-white text-left text-sm">
                      {config.keyword_condition === "contains"
                        ? "Contains"
                        : config.keyword_condition === "starts_with"
                          ? "Starts with"
                          : config.keyword_condition === "ends_with"
                            ? "Ends with"
                            : config.keyword_condition === "equals"
                              ? "Equals exactly"
                              : "Does not contain"}
                    </Listbox.Button>
                    <Listbox.Options className="absolute top-full left-0 right-0 mt-1 border border-gray-300 rounded-md bg-white shadow-lg z-50">
                      <Listbox.Option
                        value="contains"
                        className="px-3 py-2 hover:bg-gray-100 text-black cursor-pointer text-sm"
                      >
                        Contains
                      </Listbox.Option>
                      <Listbox.Option
                        value="starts_with"
                        className="px-3 py-2 hover:bg-gray-100 text-black cursor-pointer text-sm"
                      >
                        Starts with
                      </Listbox.Option>
                      <Listbox.Option
                        value="ends_with"
                        className="px-3 py-2 hover:bg-gray-100 text-black cursor-pointer text-sm"
                      >
                        Ends with
                      </Listbox.Option>
                      <Listbox.Option
                        value="equals"
                        className="px-3 py-2 hover:bg-gray-100 text-black cursor-pointer text-sm"
                      >
                        Equals exactly
                      </Listbox.Option>
                      <Listbox.Option
                        value="not_contains"
                        className="px-3 py-2 hover:bg-gray-100 text-black cursor-pointer text-sm"
                      >
                        Does not contain
                      </Listbox.Option>
                    </Listbox.Options>
                  </div>
                </Listbox>
              </div>
              <div>
                <label className="block text-sm font-medium text-black mb-1">
                  Value
                </label>
                <input
                  type="text"
                  value={config.keyword_value || ""}
                  onChange={(e) =>
                    updateConfiguration("keyword_value", e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-black text-sm"
                  placeholder="e.g., VISA, PAYMENT"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Advanced Configuration */}
      <div className="border border-gray-200 rounded-md mb-2">
        <button
          type="button"
          onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
          className="w-full flex items-center justify-between px-3 py-2 bg-gray-50 hover:bg-gray-100 rounded-t-md"
        >
          <span className="text-sm font-semibold text-black">
            Advanced configuration
          </span>
          {isAdvancedOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>

        {isAdvancedOpen && (
          <div className="space-y-4 pt-2">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-black mb-1">
                  Polling Interval (sec)
                </label>
                <input
                  type="number"
                  value={config.polling_interval || 30}
                  onChange={(e) =>
                    updateConfiguration(
                      "polling_interval",
                      parseInt(e.target.value) || 30,
                    )
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-black text-sm"
                  min="5"
                  max="300"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-black mb-1">
                  Max Messages
                </label>
                <input
                  type="number"
                  value={config.max_messages || 100}
                  onChange={(e) =>
                    updateConfiguration(
                      "max_messages",
                      parseInt(e.target.value) || 100,
                    )
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-black text-sm"
                  min="1"
                  max="1000"
                />
              </div>
            </div>

            <div className="flex items-center">
              <Checkbox
                id="archive_messages"
                checked={config.archive_messages || true}
                onChange={(e) =>
                  updateConfiguration("archive_messages", e.target.checked)
                }
                className="mr-2 h-4 w-4 text-blue-600"
              />
              <label htmlFor="archive_messages" className="text-sm text-black">
                Archive processed messages
              </label>
            </div>

            <div className="flex items-center">
              <Checkbox
                id="process_unread_only"
                checked={config.process_unread_only || true}
                onChange={(e) =>
                  updateConfiguration("process_unread_only", e.target.checked)
                }
                className="mr-2 h-4 w-4 text-blue-600"
              />
              <label
                htmlFor="process_unread_only"
                className="text-sm text-black"
              >
                Process unread messages only
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium text-black mb-1">
                Retry Failed Messages
              </label>
              <input
                type="number"
                value={config.retry_count || 3}
                onChange={(e) =>
                  updateConfiguration(
                    "retry_count",
                    parseInt(e.target.value) || 3,
                  )
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-black text-sm"
                min="0"
                max="10"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Advanced Settings Component (Common for all types)
const AdvancedSettings: React.FC<{
  config: any;
  updateConfiguration: (key: string, value: any) => void;
}> = ({ config, updateConfiguration }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="mb-2">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between hover:bg-gray-50 py-2"
      >
        <span className="text-sm font-semibold text-black">
          Advanced Settings
        </span>
        {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>

      {isOpen && (
        <div className="space-y-4 pt-2">
          <div>
            <label className="block text-sm font-medium text-black mb-1">
              Select Data Processor
            </label>
            <Listbox
              value={config.processor || "flystream"}
              onChange={(val) => updateConfiguration("processor", val)}
            >
              <div className="relative">
                <Listbox.Button className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black bg-white text-left text-sm">
                  {config.processor === "default"
                    ? "Default"
                    : config.processor === "custom"
                      ? "Custom"
                      : config.processor === "batch"
                        ? "Batch Processor"
                        : config.processor === "stream"
                          ? "Stream Processor"
                          : "flystream"}
                </Listbox.Button>
                <Listbox.Options className="absolute top-full left-0 right-0 mt-1 border border-gray-300 rounded-md bg-white shadow-lg z-50">
                  <Listbox.Option
                    value="flystream"
                    className="px-3 py-2 hover:bg-gray-100 text-black cursor-pointer text-sm"
                  >
                    flystream
                  </Listbox.Option>
                  <Listbox.Option
                    value="default"
                    className="px-3 py-2 hover:bg-gray-100 text-black cursor-pointer text-sm"
                  >
                    Default
                  </Listbox.Option>
                  <Listbox.Option
                    value="custom"
                    className="px-3 py-2 hover:bg-gray-100 text-black cursor-pointer text-sm"
                  >
                    Custom
                  </Listbox.Option>
                  <Listbox.Option
                    value="batch"
                    className="px-3 py-2 hover:bg-gray-100 text-black cursor-pointer text-sm"
                  >
                    Batch Processor
                  </Listbox.Option>
                  <Listbox.Option
                    value="stream"
                    className="px-3 py-2 hover:bg-gray-100 text-black cursor-pointer text-sm"
                  >
                    Stream Processor
                  </Listbox.Option>
                </Listbox.Options>
              </div>
            </Listbox>
            <p className="mt-1 text-xs text-gray-500">
              Select the data processor for this connector
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-black mb-1">
                Scalability Factor
              </label>
              <input
                type="number"
                value={config.scalability_factor || 1}
                onChange={(e) =>
                  updateConfiguration(
                    "scalability_factor",
                    parseInt(e.target.value) || 1,
                  )
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-black text-sm"
                min="1"
                max="100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-black mb-1">
                Max Retry Count
              </label>
              <input
                type="number"
                value={config.max_retry_count || 3}
                onChange={(e) =>
                  updateConfiguration(
                    "max_retry_count",
                    parseInt(e.target.value) || 3,
                  )
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-black text-sm"
                min="0"
                max="10"
              />
            </div>
          </div>

          <div className="flex items-center">
            <Checkbox
              id="enable_monitoring"
              checked={config.enable_monitoring || true}
              onChange={(e) =>
                updateConfiguration("enable_monitoring", e.target.checked)
              }
              className="mr-2 h-4 w-4 text-blue-600"
            />
            <label htmlFor="enable_monitoring" className="text-sm text-black">
              Enable monitoring
            </label>
          </div>

          <div className="flex items-center">
            <Checkbox
              id="enable_logging"
              checked={config.enable_logging || true}
              onChange={(e) =>
                updateConfiguration("enable_logging", e.target.checked)
              }
              className="mr-2 h-4 w-4 text-blue-600"
            />
            <label htmlFor="enable_logging" className="text-sm text-black">
              Enable detailed logging
            </label>
          </div>
        </div>
      )}
    </div>
  );
};

// ==================== MAIN FORM COMPONENT ====================

const DataConnectorForm: React.FC<DataConnectorFormProps> = ({
  connector,
  isOpen,
  onClose,
  onSave,
  loading = false,
  availableTypes,
}) => {
  const [formData, setFormData] = useState<DataConnectorFormData>({
    name: "",
    type: "api",
    description: "",
    configuration: {},
  });

  const [testingConnection, setTestingConnection] = useState(false);
  const [testResult, setTestResult] = useState<ConnectionTestResult | null>(
    null,
  );
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>(
    {},
  );

  const togglePasswordVisibility = useCallback((field: string) => {
    setShowPasswords((prev) => ({ ...prev, [field]: !prev[field] }));
  }, []);

  const updateConfiguration = useCallback((key: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      configuration: { ...prev.configuration, [key]: value },
    }));
  }, []);

  const handleTypeChange = useCallback((newType: DataConnectorType) => {
    const defaults = connectorConfigDefaults[newType];
    setFormData((prev) => ({
      ...prev,
      type: newType,
      configuration: defaults || {},
    }));
    setTestResult(null);
    setShowPasswords({});
  }, []);

  // Reset form when connector changes or modal opens
  useEffect(() => {
    if (connector) {
      setFormData({
        name: connector.name,
        type: connector.type,
        description: connector.description,
        configuration:
          connector.configuration ||
          connectorConfigDefaults[connector.type] ||
          {},
      });
    } else {
      setFormData({
        name: "",
        type: "api",
        description: "",
        configuration: connectorConfigDefaults.api,
      });
    }
    setTestResult(null);
    setShowPasswords({});
  }, [connector, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await onSave(formData);
      onClose();
    } catch (error) {
      console.error("Failed to save connector:", error);
    }
  };

  const handleTestConnection = async () => {
    setTestingConnection(true);
    setTestResult(null);

    try {
      const result = await dataConnectorService.testConnectionConfig(
        formData.type,
        formData.configuration || {},
      );
      setTestResult(result);
    } catch (err) {
      setTestResult({
        success: false,
        message: "Unexpected error during test",
        error_details: err instanceof Error ? err.message : undefined,
      });
    } finally {
      setTestingConnection(false);
    }
  };

  if (!isOpen) return null;

  const connectorTypes: DataConnectorType[] =
    availableTypes && availableTypes.length > 0
      ? availableTypes
      : ["tcp", "websocket", "kafka", "jdbc", "sms_inbox", "api", "files"];
  const isEditing = !!connector;
  const config = formData.configuration || {};

  // Render configuration component based on connector type
  const renderConfigComponent = () => {
    const props = {
      config,
      updateConfiguration,
      showPasswords,
      togglePasswordVisibility,
    };

    switch (formData.type) {
      case "api":
        return <APIConfig {...props} />;
      case "jdbc":
        return <JDBCConfig {...props} />;
      case "websocket":
        return <WebSocketConfig {...props} />;
      case "kafka":
        return <KafkaConfig {...props} />;
      case "tcp":
        return <TCPConfig {...props} />;
      case "files":
        return <FilesConfig {...props} />;
      case "sms_inbox":
        return <SMSInboxConfig {...props} />;
      default:
        return null;
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4"
      style={{ zIndex: zIndex.modal }}
    >
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="sticky top-0 bg-white flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-black">
            {isEditing
              ? `Edit ${getConnectorDisplayName(formData.type)} Connection`
              : "Create New Connector"}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close"
          >
            <X size={24} />
          </button>
        </div>

        {/* Form Content - Scrollable */}
        <div className="flex-1 overflow-y-auto">
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-black">
                Basic Information
              </h3>

              <div>
                <label className="block text-sm font-medium text-black mb-1">
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, name: e.target.value }))
                  }
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                  placeholder="Enter connector name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-black mb-1">
                  Type <span className="text-red-500">*</span>
                </label>
                <Listbox value={formData.type} onChange={handleTypeChange}>
                  <div className="relative">
                    <Listbox.Button className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black bg-white text-left text-sm">
                      {getConnectorDisplayName(formData.type)}
                    </Listbox.Button>
                    <Listbox.Options className="absolute top-full left-0 right-0 mt-1 border border-gray-300 rounded-md bg-white shadow-lg z-50">
                      {connectorTypes.map((type) => (
                        <Listbox.Option
                          key={type}
                          value={type}
                          className="px-3 py-2 hover:bg-gray-100 text-black cursor-pointer text-sm"
                        >
                          {getConnectorDisplayName(type)}
                        </Listbox.Option>
                      ))}
                    </Listbox.Options>
                  </div>
                </Listbox>
              </div>

              <div>
                <label className="block text-sm font-medium text-black mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black text-sm"
                  placeholder="Enter connector description"
                />
              </div>
            </div>

            {/* Connection Parameters */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-black">
                Connection Details
              </h3>
              <div className="space-y-4">{renderConfigComponent()}</div>
            </div>

            {/* Advanced Settings */}
            <AdvancedSettings
              config={config}
              updateConfiguration={updateConfiguration}
            />

            {/* Test Result */}
            {testResult && (
              <div
                className={`p-4 rounded-md border ${testResult.success ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}`}
              >
                <div className="flex items-start">
                  {testResult.success ? (
                    <CheckCircle className="h-5 w-5 text-green-600 mr-2 flex-shrink-0 mt-0.5" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-600 mr-2 flex-shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <p
                      className={`font-medium ${testResult.success ? "text-green-800" : "text-red-800"}`}
                    >
                      {testResult.message}
                    </p>
                    {testResult.error_details && (
                      <p className="text-sm text-red-700 mt-1">
                        {testResult.error_details}
                      </p>
                    )}
                    {testResult.response_time_ms && (
                      <p className="text-sm text-gray-600 mt-1">
                        Response time: {testResult.response_time_ms}ms
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </form>
        </div>

        {/* Footer with Actions */}
        <div className="sticky bottom-0 bg-white p-6">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={handleTestConnection}
              disabled={testingConnection}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-black bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {testingConnection ? "Testing..." : "Test Connection"}
            </button>

            <div className="flex space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-black bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                onClick={handleSubmit}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white rounded-md font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ backgroundColor: color.primary.action }}
              >
                {loading ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DataConnectorForm;
