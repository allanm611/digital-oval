import { DataConnector, DataConnectorType, DataConnectorConfiguration } from "../types";
import { tw, color } from "../../../shared/utils/utils";
import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { getConnectorDisplayName } from "../utils/connectorIcons";

interface ConnectorConfigDisplayProps {
  connector: DataConnector;
  isEditMode?: boolean;
  onConfigChange?: (updatedConfig: DataConnectorConfiguration) => void;
}

export default function ConnectorConfigDisplay({
  connector,
  isEditMode = false,
  onConfigChange,
}: ConnectorConfigDisplayProps) {
  const config = connector.configuration ?? {};
  const type = connector.type;

  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});

  if (!config || Object.keys(config).length === 0) {
    return (
      <div className="text-center py-8 text-sm text-gray-500">
        No configuration defined for this connector yet.
      </div>
    );
  }

  // Helper to update nested config and call parent callback
  const handleChange = (key: keyof DataConnectorConfiguration, value: unknown) => {
    if (!onConfigChange) return;
    const newConfig = { ...config, [key]: value };
    onConfigChange(newConfig);
  };

  const PasswordField = ({ field }: { field: keyof DataConnectorConfiguration }) => {
    const value = config[field] as string | undefined;
    const id = field as string;
    const visible = showPasswords[id] ?? false;

    return (
      <div className="relative">
        <input
          type={visible ? "text" : "password"}
          value={value ?? ""}
          onChange={(e) => handleChange(field, e.target.value)}
          className={`w-full px-3 py-2 text-sm border border-gray-300 ${tw.rounded} pr-10 focus:outline-none focus:ring-2 focus:ring-blue-400`}
          disabled={!isEditMode}
        />
        <button
          type="button"
          onClick={() => setShowPasswords(prev => ({ ...prev, [id]: !prev[id] }))}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
          disabled={!isEditMode}
        >
          {visible ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
    );
  };

  const renderCommonFields = () => (
    <>
      {config.scalability_factor !== undefined && (
        <DetailField label="Scalability Factor" value={config.scalability_factor} type="number" />
      )}
      {config.timeout !== undefined && (
        <DetailField label="Timeout (ms)" value={config.timeout} type="number" />
      )}
      {config.retry_count !== undefined && (
        <DetailField label="Retry Count" value={config.retry_count} type="number" />
      )}
      {config.ssl_enabled !== undefined && (
        <DetailField label="SSL Enabled" value={config.ssl_enabled ? "Yes" : "No"} />
      )}
    </>
  );

  const DetailField = ({
    label,
    value,
    type = "text",
    fullWidth = false,
  }: {
    label: string;
    value: unknown;
    type?: "text" | "number" | "password";
    fullWidth?: boolean;
  }) => {
    let displayValue: React.ReactNode = typeof value === "string" || typeof value === "number" || typeof value === "boolean" ? value : (value ? String(value) : "—");

    if (type === "password" && typeof value === "string" && value.length > 0) {
      displayValue = isEditMode ? <PasswordField field={label.toLowerCase() as keyof DataConnectorConfiguration} /> : "••••••••";
    }

    return (
      <div className={fullWidth ? "col-span-2" : ""}>
        <label className="block text-sm font-medium text-gray-600 mb-1 uppercase tracking-wide">
          {label}
        </label>
        {isEditMode && type !== "password" ? (
          <input
            type={type}
            value={typeof value === "string" || typeof value === "number" ? value : ""}
            onChange={(e) => handleChange(label.toLowerCase() as keyof DataConnectorConfiguration, e.target.value)}
            className={`w-full px-3 py-2 text-sm border border-gray-300 ${tw.rounded} focus:outline-none focus:ring-2 focus:ring-blue-400`}
          />
        ) : (
          <div className={`text-sm font-medium ${tw.textPrimary}`}>{displayValue}</div>
        )}
      </div>
    );
  };

  const renderTypeSpecific = () => {
    switch (type) {
      case "jdbc":
        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <DetailField label="Database Type" value={config.database_type} />
            <DetailField label="Host" value={config.host} />
            <DetailField label="Port" value={config.port} type="number" />
            <DetailField label="Database" value={config.database} />
            <DetailField label="Username" value={config.username} />
            <DetailField label="Password" value={config.password} type="password" />
            <DetailField label="Connection String" value={config.connection_string} fullWidth />
            <DetailField label="Select Query" value={config.select_query} fullWidth />
            {renderCommonFields()}
          </div>
        );

      case "api":
        return (
          <div className="space-y-5">
            <DetailField label="URL" value={config.url} fullWidth />
            <DetailField label="Method" value={config.method} />
            <DetailField label="Content Type" value={config.content_type} />
            <DetailField label="Response Timeout (s)" value={config.response_timeout_seconds} type="number" />
            <DetailField label="Thread Count" value={config.thread_count} type="number" />
            <DetailField label="Messages/sec" value={config.messages_per_second} type="number" />
            <DetailField label="Proxy Enabled" value={config.proxy_enabled ? "Yes" : "No"} />
            {config.proxy_enabled && (
              <>
                <DetailField label="Proxy URL" value={config.proxy_url} fullWidth />
                <DetailField label="Proxy Username" value={config.proxy_username} />
                <DetailField label="Proxy Password" value={config.proxy_password} type="password" />
              </>
            )}
            {renderCommonFields()}
          </div>
        );

      case "tcp":
        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <DetailField label="Host" value={config.host} />
            <DetailField label="Port" value={config.port} type="number" />
            <DetailField label="Queue Name" value={config.queue_name} />
            <DetailField label="Socket Timeout (ms)" value={config.socket_timeout} type="number" />
            <DetailField label="Non-blocking I/O" value={config.non_blocking_io ? "Yes" : "No"} />
            <DetailField label="Reverse Lookup" value={config.reverse_lookup ? "Yes" : "No"} />
            <DetailField label="Direct Buffers" value={config.direct_buffers ? "Yes" : "No"} />
            {renderCommonFields()}
          </div>
        );

      case "websocket":
        return (
          <div className="space-y-5">
            <DetailField label="URL" value={config.url} fullWidth />
            <DetailField label="HTTP Path" value={config.http_path} />
            <DetailField label="Username" value={config.username} />
            <DetailField label="Password" value={config.password} type="password" />
            {renderCommonFields()}
          </div>
        );

      case "kafka":
        return (
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1 uppercase">Brokers</label>
              <div className="text-sm text-gray-900">
                {config.brokers?.join(", ") || "—"}
              </div>
            </div>
            <DetailField label="Topic Name" value={config.topic_name} />
            <DetailField label="Group Identifier" value={config.group_identifier} />
            <DetailField label="Transactional Mode" value={config.transactional_mode} />
            {renderCommonFields()}
          </div>
        );

      case "files":
        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <DetailField label="Protocol" value={config.protocol} />
            <DetailField label="Host" value={config.host} />
            <DetailField label="Port" value={config.port} type="number" />
            <DetailField label="Username" value={config.username} />
            <DetailField label="Password" value={config.password} type="password" />
            <DetailField label="Input Path" value={config.input_path} fullWidth />
            <DetailField label="Output Path" value={config.output_path} fullWidth />
            <DetailField label="Regex Pattern" value={config.regex_pattern} fullWidth />
            {renderCommonFields()}
          </div>
        );

      case "sms_inbox":
        return (
          <div className="space-y-5">
            <DetailField label="Provider" value={config.provider} />
            <DetailField label="Inbox ID" value={config.inbox_id} />
            <DetailField label="Filter by Keyword" value={config.filter_by_keyword ? "Yes" : "No"} />
            {config.filter_by_keyword && (
              <>
                <DetailField label="Keyword Identifier" value={config.keyword_identifier} />
                <DetailField label="Keyword Condition" value={config.keyword_condition} />
                <DetailField label="Keyword Value" value={config.keyword_value} />
              </>
            )}
            {renderCommonFields()}
          </div>
        );

      default:
        return (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
            <p className="text-yellow-800 font-medium">
              Configuration viewer not implemented for type: <strong>{type}</strong>
            </p>
            <p className="text-sm text-yellow-700 mt-2">
              Raw configuration:
            </p>
            <pre className="mt-3 bg-white p-4 rounded text-left text-sm overflow-auto max-h-80">
              {JSON.stringify(config, null, 2)}
            </pre>
          </div>
        );
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-semibold text-gray-900 mb-4">
          {connector.name} Configuration ({getConnectorDisplayName(type)})
        </h3>
        {renderTypeSpecific()}
      </div>
    </div>
  );
}