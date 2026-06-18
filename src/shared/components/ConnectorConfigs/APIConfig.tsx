import React, { useState } from "react";
import { Eye, EyeOff, ChevronDown, ChevronUp } from "lucide-react";
import Input from "../ui/Input";
import Textarea from "../ui/Textarea";
import HeadlessSelect from "../ui/HeadlessSelect";
import Checkbox from "../ui/Checkbox";
import { ConfigComponentProps } from "./types";

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
    <div className="space-y-6">
      <h4 className="text-sm font-semibold text-gray-700">API Configuration</h4>

      {/* Basic Connection Fields */}
      <div className="grid grid-cols-2 gap-6">
        <Input
          type="url"
          required
          label="Base URL *"
          value={config.base_url || ""}
          onChange={(value) => updateConfiguration("base_url", String(value))}
          placeholder="https://api.example.com/v1"
        />
        <Input
          label="Host"
          placeholder="api.example.com"
          value={config.host || ""}
          onChange={(value) => updateConfiguration("host", value)}
        />
      </div>

      <div className="grid grid-cols-2 gap-6">
        <Input
          label="Username"
          placeholder="Optional"
          value={config.username || ""}
          onChange={(value) => updateConfiguration("username", value)}
        />
        <Input
          type={showPasswords.api_password ? "text" : "password"}
          label="Password"
          value={config.password || ""}
          onChange={(value) => updateConfiguration("password", String(value))}
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

      <div className="grid grid-cols-2 gap-6">
        <HeadlessSelect
          label="Content Type"
          options={[
            { value: "XML", label: "XML" },
            { value: "JSON", label: "JSON" },
            { value: "QUERY_STRING", label: "Query String" },
          ]}
          value={config.content_type || "JSON"}
          onChange={(val) => updateConfiguration("content_type", val)}
        />
        <HeadlessSelect
          label="Method"
          options={[
            { value: "POST", label: "POST" },
            { value: "GET", label: "GET" },
          ]}
          value={config.method || "POST"}
          onChange={(val) => updateConfiguration("method", val)}
        />
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
          <span className="text-sm text-gray-700">
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
          <span className="text-sm font-semibold text-gray-700">
            Advanced configuration
          </span>
          {isAdvancedOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>

        {isAdvancedOpen && (
          <div className="space-y-6 pt-2">
            {/* Request Headers */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
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
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Add Header
                </button>
              </div>
            </div>

            {/* Request Data */}
            {config.method === "POST" && (
              <Textarea
                label="Request Data"
                value={config.payload_template || ""}
                onChange={(value) =>
                  updateConfiguration("payload_template", value)
                }
                rows={4}
                placeholder={
                  config.content_type === "XML"
                    ? "<request>...</request>"
                    : '{"key": "value"}'
                }
                className="font-mono"
              />
            )}

            {/* Performance Settings */}
            <div className="grid grid-cols-4 gap-6">
              <Input
                type="number"
                label="Response Timeout (sec)"
                value={config.response_timeout || 10}
                onChange={(value) =>
                  updateConfiguration(
                    "response_timeout",
                    parseInt(String(value)) || 10,
                  )
                }
                min={1}
              />
              <Input
                type="number"
                label="Thread Count"
                value={config.thread_count || 1}
                onChange={(value) =>
                  updateConfiguration(
                    "thread_count",
                    parseInt(String(value)) || 1,
                  )
                }
                min={1}
                max={100}
              />
              <Input
                type="number"
                label="Messages Per Second"
                value={config.messages_per_second || 10}
                onChange={(value) =>
                  updateConfiguration(
                    "messages_per_second",
                    parseInt(String(value)) || 10,
                  )
                }
                min={1}
                max={10000}
              />
              <Input
                type="number"
                label="Service Message Throttle"
                value={config.service_message_throttle || 1}
                onChange={(value) =>
                  updateConfiguration(
                    "service_message_throttle",
                    parseInt(String(value)) || 1,
                  )
                }
                min={1}
                max={100}
              />
            </div>

            {/* Response Configuration */}
            <div className="grid grid-cols-3 gap-6">
              <Input
                label="Success Response String(s)"
                placeholder="Success string/header/status"
                value={config.success_response || ""}
                onChange={(value) =>
                  updateConfiguration("success_response", value)
                }
              />
              <Input
                label="Result Code XPATH"
                placeholder="API response code"
                value={config.result_code || ""}
                onChange={(value) =>
                  updateConfiguration("result_code", value)
                }
              />
              <Input
                label="Result Code Description XPATH"
                placeholder="Response description"
                value={config.result_description || ""}
                onChange={(value) =>
                  updateConfiguration("result_description", value)
                }
              />
            </div>

            <Input
              label="Result XPath"
              placeholder="//response/result"
              value={config.xpath || ""}
              onChange={(value) => updateConfiguration("xpath", value)}
            />
          </div>
        )}
      </div>
    </div>
  );
};
