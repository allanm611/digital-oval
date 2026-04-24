import React, { useState } from "react";
import {
  Eye,
  EyeOff,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Listbox } from "@headlessui/react";
import Input from "./ui/Input";
import Checkbox from "./ui/Checkbox";

// Common interface for configuration components
export interface ConfigComponentProps {
  config: any;
  updateConfiguration: (key: string, value: any) => void;
  showPasswords: Record<string, boolean>;
  togglePasswordVisibility: (field: string) => void;
}

// API Configuration Component
export const APIConfig: React.FC<ConfigComponentProps> = ({
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
          <Input
            type="url"
            required
            value={config.url || ""}
            onChange={(value) => updateConfiguration("url", String(value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black text-sm"
            placeholder="https://api.example.com/endpoint"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-black mb-1">
            Host
          </label>
          <Input
            placeholder="api.example.com"
            value={config.host || ""}
            onChange={(value) => updateConfiguration("host", value)}
            variant="medium"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-black mb-1">
            Username
          </label>
          <Input
            placeholder="Optional"
            value={config.username || ""}
            onChange={(value) => updateConfiguration("username", value)}
            variant="medium"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-black mb-1">
            Password
          </label>
          <div className="relative">
            <Input
              type={showPasswords.api_password ? "text" : "password"}
              value={config.password || ""}
              onChange={(value) => updateConfiguration("password", String(value))}
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
        <div className="flex items-center cursor-pointer" onClick={() =>
          updateConfiguration("enable_proxy", !(config.enable_proxy || false))
        }>
          <Checkbox
            id="enable_proxy"
            checked={config.enable_proxy || false}
            onChange={() =>
              updateConfiguration("enable_proxy", !(config.enable_proxy || false))
            }
            className="mr-2 h-4 w-4 text-blue-600"
          />
          <span className="text-sm text-black">
            Enable Proxy
          </span>
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
                      <div className="flex-1">
                        <Input
                          placeholder="Header name"
                          value={key}
                          onChange={(newKey) => {
                            const newHeaders = { ...config.request_headers };
                            delete newHeaders[key];
                            newHeaders[newKey] = value;
                            updateConfiguration("request_headers", newHeaders);
                          }}
                          variant="medium"
                        />
                      </div>
                      <div className="flex-1">
                        <Input
                          placeholder="Header value"
                          value={value as string}
                          onChange={(newValue) =>
                            updateConfiguration("request_headers", {
                              ...config.request_headers,
                              [key]: newValue,
                            })
                          }
                          variant="medium"
                        />
                      </div>
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
                <Input type="number"
                  value={config.response_timeout || 10}
                  onChange={(value) =>
                    updateConfiguration(
                      "response_timeout",
                      parseInt(String(value)) || 10,
                    )
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-black text-sm"
                  min={1}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-black mb-1">
                  Thread Count
                </label>
                <Input type="number"
                  value={config.thread_count || 1}
                  onChange={(value) =>
                    updateConfiguration(
                      "thread_count",
                      parseInt(String(value)) || 1,
                    )
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-black text-sm"
                  min={1}
                  max={100}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-black mb-1">
                  Messages Per Second
                </label>
                <Input type="number"
                  value={config.messages_per_second || 10}
                  onChange={(value) =>
                    updateConfiguration(
                      "messages_per_second",
                      parseInt(String(value)) || 10,
                    )
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-black text-sm"
                  min={1}
                  max={10000}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-black mb-1">
                  Service Message Throttle
                </label>
                <Input type="number"
                  value={config.service_message_throttle || 1}
                  onChange={(value) =>
                    updateConfiguration(
                      "service_message_throttle",
                      parseInt(String(value)) || 1,
                    )
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-black text-sm"
                  min={1}
                  max={100}
                />
              </div>
            </div>

            {/* Response Configuration */}
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-sm font-medium text-black mb-1">
                  Success Response String(s)
                </label>
                <Input
                  placeholder="Success string/header/status"
                  value={config.success_response || ""}
                  onChange={(value) =>
                    updateConfiguration("success_response", value)
                  }
                  variant="medium"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-black mb-1">
                  Result Code XPATH
                </label>
                <Input
                  placeholder="API response code"
                  value={config.result_code || ""}
                  onChange={(value) =>
                    updateConfiguration("result_code", value)
                  }
                  variant="medium"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-black mb-1">
                  Result Code Description XPATH
                </label>
                <Input
                  placeholder="Response description"
                  value={config.result_description || ""}
                  onChange={(value) =>
                    updateConfiguration("result_description", value)
                  }
                  variant="medium"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-black mb-1">
                Result XPath
              </label>
              <Input
                placeholder="//response/result"
                value={config.xpath || ""}
                onChange={(value) => updateConfiguration("xpath", value)}
                variant="medium"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export const JDBCConfig: React.FC<ConfigComponentProps> = ({
  config,
  updateConfiguration,
  showPasswords,
  togglePasswordVisibility,
}) => {
  const [isQueryOpen, setIsQueryOpen] = useState(false);

  return (
    <div className="space-y-4">
      <h4 className="text-sm font-semibold text-black">JDBC Configuration</h4>

      <div>
        <label className="block text-sm font-medium text-black mb-1">
          Database Type
        </label>
        <Listbox
          value={config.database_type || "mysql"}
          onChange={(val) =>
            updateConfiguration("database_type", val)
          }
        >
          <div className="relative">
            <Listbox.Button className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black bg-white text-left">
              {config.database_type === "mysql" ? "MySQL" : config.database_type === "postgres" ? "PostgreSQL" : config.database_type === "mssql" ? "Microsoft SQL Server" : "Oracle"}
            </Listbox.Button>
            <Listbox.Options className="absolute top-full left-0 right-0 mt-1 border border-gray-300 rounded-md bg-white shadow-lg z-50">
              <Listbox.Option value="mysql" className="px-3 py-2 hover:bg-gray-100 text-black cursor-pointer text-sm">MySQL</Listbox.Option>
              <Listbox.Option value="postgres" className="px-3 py-2 hover:bg-gray-100 text-black cursor-pointer text-sm">PostgreSQL</Listbox.Option>
              <Listbox.Option value="mssql" className="px-3 py-2 hover:bg-gray-100 text-black cursor-pointer text-sm">Microsoft SQL Server</Listbox.Option>
              <Listbox.Option value="oracle" className="px-3 py-2 hover:bg-gray-100 text-black cursor-pointer text-sm">Oracle</Listbox.Option>
            </Listbox.Options>
          </div>
        </Listbox>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-black mb-1">Host</label>
          <Input type="text" value={config.host || ""} onChange={(value) => updateConfiguration("host", String(value))} placeholder="localhost" className="w-full px-3 py-2 border border-gray-300 rounded-md text-black text-sm" />
        </div>
        <div>
          <label className="block text-sm font-medium text-black mb-1">Port</label>
          <Input type="number" value={config.port || 3306} onChange={(value) => updateConfiguration("port", parseInt(String(value)) || 3306)} className="w-full px-3 py-2 border border-gray-300 rounded-md text-black" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-black mb-1">Database Name</label>
          <Input placeholder="database_name" value={config.database || ""} onChange={(value) => updateConfiguration("database", value)} variant="medium" />
        </div>
        <div>
          <label className="block text-sm font-medium text-black mb-1">Query Timeout (ms)</label>
          <Input type="number" value={config.queries_timemill || 17000000} onChange={(value) => updateConfiguration("queries_timemill", parseInt(String(value)) || 17000000)} className="w-full px-3 py-2 border border-gray-300 rounded-md text-black" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-black mb-1">Username</label>
          <Input placeholder="Optional" value={config.username || ""} onChange={(value) => updateConfiguration("username", value)} variant="medium" />
        </div>
        <div>
          <label className="block text-sm font-medium text-black mb-1">Password</label>
          <div className="relative">
            <Input type={showPasswords.jdbc_password ? "text" : "password"} value={config.password || ""} onChange={(value) => updateConfiguration("password", String(value))} className="w-full px-3 py-2 pr-8 border border-gray-300 rounded-md text-black" placeholder="••••••••" />
            <button type="button" onClick={() => togglePasswordVisibility("jdbc_password")} className="absolute inset-y-0 right-0 pr-2 flex items-center text-gray-400">
              {showPasswords.jdbc_password ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-black mb-1">Connection String (Optional)</label>
        <Input placeholder="jdbc:mysql://localhost:3306/database" value={config.connection_string || ""} onChange={(value) => updateConfiguration("connection_string", value)} variant="medium" />
      </div>

      <div>
        <button type="button" onClick={() => setIsQueryOpen(!isQueryOpen)} className="w-full flex items-center justify-between hover:bg-gray-50">
          <span className="text-sm font-medium text-black">Query Configuration</span>
          {isQueryOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
        {isQueryOpen && (
          <div className="pt-2">
            <label className="block text-sm font-medium text-black mb-1">SQL Query</label>
            <textarea value={config.select_query || ""} onChange={(e) => updateConfiguration("select_query", e.target.value)} rows={4} className="w-full px-3 py-2 border border-gray-300 rounded-md font-mono text-sm" placeholder="SELECT * FROM table_name WHERE condition" />
          </div>
        )}
      </div>

      <div className="flex items-center cursor-pointer" onClick={() => updateConfiguration("ssl_enabled", !(config.ssl_enabled || false))}>
        <Checkbox id="ssl_enabled" checked={config.ssl_enabled || false} onChange={() => updateConfiguration("ssl_enabled", !(config.ssl_enabled || false))} className="mr-2 h-4 w-4" />
        <span className="text-sm text-black">Enable SSL Connection</span>
      </div>
    </div>
  );
};

export const WebSocketConfig: React.FC<ConfigComponentProps> = ({config, updateConfiguration, showPasswords, togglePasswordVisibility}) => (
  <div className="space-y-4">
    <h4 className="text-sm font-semibold text-black">WebSocket Configuration</h4>
    <div>
      <label className="block text-sm font-medium text-black mb-1">Connection Name</label>
      <Input placeholder="My WebSocket Connection" value={config.connection_name || ""} onChange={(value) => updateConfiguration("connection_name", value)} variant="medium" />
    </div>
    <div>
      <label className="block text-sm font-medium text-black mb-1">URL</label>
      <Input type="url" value={config.url || ""} onChange={(value) => updateConfiguration("url", String(value))} className="w-full px-3 py-2 border border-gray-300 rounded-md text-black text-sm" placeholder="ws://localhost:8080" />
    </div>
    <div>
      <label className="block text-sm font-medium text-black mb-1">HTTP Path</label>
      <Input placeholder="/ws" value={config.http_path || "/ws"} onChange={(value) => updateConfiguration("http_path", value)} variant="medium" />
    </div>
    <div className="grid grid-cols-2 gap-3">
      <div>
        <label className="block text-sm font-medium text-black mb-1">Username</label>
        <Input placeholder="Optional" value={config.username || ""} onChange={(value) => updateConfiguration("username", value)} variant="medium" />
      </div>
      <div>
        <label className="block text-sm font-medium text-black mb-1">Password</label>
        <div className="relative">
          <Input type={showPasswords.websocket_password ? "text" : "password"} value={config.password || ""} onChange={(value) => updateConfiguration("password", String(value))} className="w-full px-3 py-2 pr-8 border border-gray-300 rounded-md text-black" placeholder="••••••••" />
          <button type="button" onClick={() => togglePasswordVisibility("websocket_password")} className="absolute inset-y-0 right-0 pr-2 flex items-center text-gray-400">
            {showPasswords.websocket_password ? <EyeOff size={14} /> : <Eye size={14} />}
          </button>
        </div>
      </div>
    </div>
  </div>
);

export const KafkaConfig: React.FC<ConfigComponentProps> = ({config, updateConfiguration}) => {
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  const handleBrokersChange = (value: string) => {
    const brokers = value.split(",").map((b) => b.trim()).filter((b) => b);
    updateConfiguration("brokers", brokers);
  };
  return (
    <div className="space-y-4">
      <h4 className="text-sm font-semibold text-black">Kafka Configuration</h4>
      <div>
        <label className="block text-sm font-medium text-black mb-1">Connection Name</label>
        <Input placeholder="My Kafka Connection" value={config.connection_name || ""} onChange={(value) => updateConfiguration("connection_name", value)} variant="medium" />
      </div>
      <div>
        <label className="block text-sm font-medium text-black mb-1">Topic Name</label>
        <Input placeholder="my-topic" value={config.topic_name || ""} onChange={(value) => updateConfiguration("topic_name", value)} variant="medium" />
      </div>
      <div className="mb-2">
        <button type="button" onClick={() => setIsAdvancedOpen(!isAdvancedOpen)} className="w-full flex items-center justify-between hover:bg-gray-50 py-2">
          <span className="text-sm font-semibold text-black">Advanced Configuration</span>
          {isAdvancedOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
        {isAdvancedOpen && (
          <div className="space-y-4 pt-2">
            <div>
              <label className="block text-sm font-medium text-black mb-1">Brokers</label>
              <Input placeholder="localhost:9092, localhost:9093" value={Array.isArray(config.brokers) ? config.brokers.join(", ") : config.brokers || ""} onChange={(value) => handleBrokersChange(value)} variant="medium" />
            </div>
            <div>
              <label className="block text-sm font-medium text-black mb-1">Group Identifier</label>
              <Input placeholder="my-consumer-group" value={config.group_identifier || ""} onChange={(value) => updateConfiguration("group_identifier", value)} variant="medium" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export const TCPConfig: React.FC<ConfigComponentProps> = ({config, updateConfiguration}) => (
  <div className="space-y-4">
    <h4 className="text-sm font-semibold text-black">TCP Configuration</h4>
    <div className="grid grid-cols-2 gap-3">
      <div>
        <label className="block text-sm font-medium text-black mb-1">Buffer Size</label>
        <Input type="number" value={config.buffer_size || 8192} onChange={(value) => updateConfiguration("buffer_size", parseInt(String(value)) || 8192)} className="w-full px-3 py-2 border border-gray-300 rounded-md text-black" min="1024" max="1048576" />
      </div>
      <div>
        <label className="block text-sm font-medium text-black mb-1">Socket Timeout (ms)</label>
        <Input type="number" value={config.socket_timeout || 120000} onChange={(value) => updateConfiguration("socket_timeout", parseInt(String(value)) || 120000)} className="w-full px-3 py-2 border border-gray-300 rounded-md text-black" min="1000" max="300000" />
      </div>
    </div>
    <div>
      <label className="block text-sm font-medium text-black mb-1">Decoder</label>
      <Input placeholder="Carnage Returned Line Feed" value={config.decoder || ""} onChange={(value) => updateConfiguration("decoder", value)} variant="medium" />
    </div>
    <div className="space-y-2">
      <div className="flex items-center cursor-pointer" onClick={() => updateConfiguration("non_blocking_io", !(config.non_blocking_io || false))}>
        <Checkbox id="non_blocking_io" checked={config.non_blocking_io || false} onChange={() => updateConfiguration("non_blocking_io", !(config.non_blocking_io || false))} className="mr-2 h-4 w-4" />
        <span className="text-sm text-black">Non-blocking I/O</span>
      </div>
    </div>
  </div>
);

export const FilesConfig: React.FC<ConfigComponentProps> = ({config, updateConfiguration}) => {
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  return (
    <div className="space-y-4">
      <h4 className="text-sm font-semibold text-black">Files Configuration</h4>
      <div>
        <label className="block text-sm font-medium text-black mb-1">Job Name</label>
        <Input placeholder="File Processing Job" value={config.job_name || ""} onChange={(value) => updateConfiguration("job_name", value)} variant="medium" />
      </div>
      <div>
        <label className="block text-sm font-medium text-black mb-1">Protocol</label>
        <Listbox value={config.protocol || "local"} onChange={(val) => updateConfiguration("protocol", val)}>
          <div className="relative">
            <Listbox.Button className="w-full px-3 py-2 border border-gray-300 rounded-md text-black bg-white text-left">
              {config.protocol === "ftp" ? "FTP" : config.protocol === "sftp" ? "SFTP" : "Local File System"}
            </Listbox.Button>
            <Listbox.Options className="absolute top-full left-0 right-0 mt-1 border border-gray-300 rounded-md bg-white shadow-lg z-50">
              <Listbox.Option value="local" className="px-3 py-2 hover:bg-gray-100 text-black cursor-pointer text-sm">Local File System</Listbox.Option>
              <Listbox.Option value="ftp" className="px-3 py-2 hover:bg-gray-100 text-black cursor-pointer text-sm">FTP</Listbox.Option>
              <Listbox.Option value="sftp" className="px-3 py-2 hover:bg-gray-100 text-black cursor-pointer text-sm">SFTP</Listbox.Option>
            </Listbox.Options>
          </div>
        </Listbox>
      </div>
      <div>
        <label className="block text-sm font-medium text-black mb-1">Connection Name</label>
        <Input placeholder="File Connection Name" value={config.Connection_Name || ""} onChange={(value) => updateConfiguration("Connection_Name", value)} variant="medium" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-black mb-1">Input Path</label>
          <Input placeholder="/path/to/input" value={config.input_path || ""} onChange={(value) => updateConfiguration("input_path", value)} variant="medium" />
        </div>
        <div>
          <label className="block text-sm font-medium text-black mb-1">Output Path</label>
          <Input placeholder="/path/to/output" value={config.output_path || ""} onChange={(value) => updateConfiguration("output_path", value)} variant="medium" />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-black mb-1">Regex</label>
        <Input placeholder="*.txt, *.csv" value={config.regex_pattern || ""} onChange={(value) => updateConfiguration("regex_pattern", value)} variant="medium" />
      </div>
    </div>
  );
};

export const SMSInboxConfig: React.FC<ConfigComponentProps> = ({config, updateConfiguration}) => {
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  return (
    <div className="space-y-4">
      <h4 className="text-sm font-semibold text-black">SMS Inbox Configuration</h4>
      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-black mb-1">Connection Name <span className="text-red-500">*</span></label>
          <Input placeholder="MTN_Inbox_Test" required value={config.connection_name || "MTN_Inbox_Test"} onChange={(value) => updateConfiguration("connection_name", value)} variant="medium" />
        </div>
        <div>
          <label className="block text-sm font-medium text-black mb-1">Select Inbox <span className="text-red-500">*</span></label>
          <Input placeholder="2112" required value={config.short_code || "2112"} onChange={(value) => updateConfiguration("short_code", value)} variant="medium" />
        </div>
        <div>
          <label className="block text-sm font-medium text-black mb-1">Provider</label>
          <Listbox value={config.provider || "MTN"} onChange={(val) => updateConfiguration("provider", val)}>
            <div className="relative">
              <Listbox.Button className="w-full px-3 py-2 border border-gray-300 rounded-md text-black bg-white text-left text-sm">{config.provider || "MTN"}</Listbox.Button>
              <Listbox.Options className="absolute top-full left-0 right-0 mt-1 border border-gray-300 rounded-md bg-white shadow-lg z-50">
                <Listbox.Option value="MTN" className="px-3 py-2 hover:bg-gray-100 text-black cursor-pointer text-sm">MTN</Listbox.Option>
                <Listbox.Option value="Jioce" className="px-3 py-2 hover:bg-gray-100 text-black cursor-pointer text-sm">Jioce</Listbox.Option>
                <Listbox.Option value="Test" className="px-3 py-2 hover:bg-gray-100 text-black cursor-pointer text-sm">Test</Listbox.Option>
                <Listbox.Option value="Airtel" className="px-3 py-2 hover:bg-gray-100 text-black cursor-pointer text-sm">Airtel</Listbox.Option>
              </Listbox.Options>
            </div>
          </Listbox>
        </div>
      </div>
      <div>
        <div className="p-3">
          <div className="flex items-center cursor-pointer" onClick={() => updateConfiguration("filter_by_keyword", !(config.filter_by_keyword || false))}>
            <Checkbox id="filter_by_keyword" checked={config.filter_by_keyword || false} onChange={() => updateConfiguration("filter_by_keyword", !(config.filter_by_keyword || false))} className="mr-2 h-4 w-4" />
            <span className="text-sm font-medium text-black">Filter messages based on keyword</span>
          </div>
        </div>
        {config.filter_by_keyword && (
          <div className="space-y-4 pt-2">
            <div>
              <label className="block text-sm font-medium text-black mb-1">Delimiter to identify Keyword</label>
              <Input placeholder="Comma" value={config.keyword_delimiter || ","} onChange={(value) => updateConfiguration("keyword_delimiter", value)} variant="medium" />
            </div>
            <div>
              <label className="block text-sm font-medium text-black mb-1">Keyword to identify messages</label>
              <Input placeholder="Enter keywords to filter" value={config.keyword_identifier || ""} onChange={(value) => updateConfiguration("keyword_identifier", value)} variant="medium" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-black mb-1">Condition on keyword</label>
                <Listbox value={config.keyword_condition || "contains"} onChange={(val) => updateConfiguration("keyword_condition", val)}>
                  <div className="relative">
                    <Listbox.Button className="w-full px-3 py-2 border border-gray-300 rounded-md text-black bg-white text-left text-sm">
                      {config.keyword_condition === "contains" ? "Contains" : config.keyword_condition === "starts_with" ? "Starts with" : config.keyword_condition === "ends_with" ? "Ends with" : "Equals exactly"}
                    </Listbox.Button>
                    <Listbox.Options className="absolute top-full left-0 right-0 mt-1 border border-gray-300 rounded-md bg-white shadow-lg z-50">
                      <Listbox.Option value="contains" className="px-3 py-2 hover:bg-gray-100 text-black cursor-pointer text-sm">Contains</Listbox.Option>
                      <Listbox.Option value="starts_with" className="px-3 py-2 hover:bg-gray-100 text-black cursor-pointer text-sm">Starts with</Listbox.Option>
                      <Listbox.Option value="ends_with" className="px-3 py-2 hover:bg-gray-100 text-black cursor-pointer text-sm">Ends with</Listbox.Option>
                      <Listbox.Option value="equals" className="px-3 py-2 hover:bg-gray-100 text-black cursor-pointer text-sm">Equals exactly</Listbox.Option>
                    </Listbox.Options>
                  </div>
                </Listbox>
              </div>
              <div>
                <label className="block text-sm font-medium text-black mb-1">Value</label>
                <Input placeholder="e.g., VISA, PAYMENT" value={config.keyword_value || ""} onChange={(value) => updateConfiguration("keyword_value", value)} variant="medium" />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
