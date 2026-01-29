import { DataConnector } from "../types";
import { tw, color } from "../../../shared/utils/utils";

interface ConnectorConfigDisplayProps {
  connector: DataConnector;
  isEditMode?: boolean;
  onConfigChange?: (field: string, value: unknown) => void;
}

interface DetailFieldProps {
  label: string;
  value: unknown;
  fullWidth?: boolean;
  isEditMode?: boolean;
  onChange?: (value: unknown) => void;
  type?: "text" | "number" | "password" | "email";
}

const DetailField: React.FC<DetailFieldProps> = ({
  label,
  value,
  fullWidth = false,
  isEditMode = false,
  onChange,
  type = "text",
}) => {
  // Mask sensitive credentials
  const displayValue =
    type === "password" && typeof value === "string"
      ? "••••••••"
      : value ?? "";

  return (
    <div className={fullWidth ? "col-span-2" : ""}>
      <label className="block text-xs font-medium text-gray-600 mb-1 uppercase tracking-wide">
        {label}
      </label>
      {isEditMode && onChange ? (
        <input
          type={type}
          value={displayValue}
          onChange={(e) => onChange(e.target.value)}
          className={`w-full px-3 py-2 text-sm border border-gray-300 ${tw.rounded} focus:outline-none focus:ring-2 focus:ring-gray-400`}
        />
      ) : (
        <p className={`text-sm font-medium ${tw.textPrimary}`}>{displayValue}</p>
      )}
    </div>
  );
};

export default function ConnectorConfigDisplay({
  connector,
  isEditMode = false,
  onConfigChange,
}: ConnectorConfigDisplayProps) {
  if (!connector.config) {
    return (
      <p className={tw.textSecondary}>No configuration available</p>
    );
  }

  const renderJDBCConfig = () => {
    const config = connector.config;
    if (config.type !== "jdbc") return null;

    return (
      <div className="grid grid-cols-2 gap-4">
        <DetailField
          label="Hostname"
          value={config.hostname}
          isEditMode={isEditMode}
          onChange={(val) => onConfigChange?.("hostname", val)}
        />
        <DetailField
          label="Port"
          value={config.port}
          type="number"
          isEditMode={isEditMode}
          onChange={(val) => onConfigChange?.("port", val)}
        />
        <DetailField
          label="Database"
          value={config.database}
          isEditMode={isEditMode}
          onChange={(val) => onConfigChange?.("database", val)}
        />
        <DetailField
          label="Username"
          value={config.username}
          isEditMode={isEditMode}
          onChange={(val) => onConfigChange?.("username", val)}
        />
        <DetailField
          label="Password"
          value={config.password}
          type="password"
          isEditMode={isEditMode}
          onChange={(val) => onConfigChange?.("password", val)}
        />
        <DetailField
          label="Driver"
          value={config.driver || "N/A"}
          isEditMode={isEditMode}
          onChange={(val) => onConfigChange?.("driver", val)}
        />
        <DetailField
          label="Connection String"
          value={config.connectionString || "N/A"}
          fullWidth
          isEditMode={isEditMode}
          onChange={(val) => onConfigChange?.("connectionString", val)}
        />
      </div>
    );
  };

  const renderAPIConfig = () => {
    const config = connector.config;
    if (config.type !== "api") return null;

    return (
      <div className="space-y-4">
        <DetailField
          label="URL"
          value={config.url}
          fullWidth
          isEditMode={isEditMode}
          onChange={(val) => onConfigChange?.("url", val)}
        />
        <DetailField
          label="Method"
          value={config.method}
          isEditMode={isEditMode}
          onChange={(val) => onConfigChange?.("method", val)}
        />
        <DetailField
          label="Authentication Type"
          value={config.authentication.type}
          isEditMode={isEditMode}
          onChange={(val) =>
            onConfigChange?.("authType", val)
          }
        />
        {config.headers && (
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-2 uppercase tracking-wide">
              Headers
            </label>
            <div className={`${tw.rounded} bg-gray-50 p-3 text-sm`}>
              {Object.entries(config.headers).map(([key, val]) => (
                <div key={key} className="text-gray-700">
                  <span className="font-medium">{key}:</span> {val}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderTCPConfig = () => {
    const config = connector.config;
    if (config.type !== "tcp") return null;

    return (
      <div className="grid grid-cols-2 gap-4">
        <DetailField
          label="Host"
          value={config.host}
          isEditMode={isEditMode}
          onChange={(val) => onConfigChange?.("host", val)}
        />
        <DetailField
          label="Port"
          value={config.port}
          type="number"
          isEditMode={isEditMode}
          onChange={(val) => onConfigChange?.("port", val)}
        />
        <DetailField
          label="Protocol"
          value={config.protocol || "tcp/ip"}
          isEditMode={isEditMode}
          onChange={(val) => onConfigChange?.("protocol", val)}
        />
      </div>
    );
  };

  const renderWebSocketConfig = () => {
    const config = connector.config;
    if (config.type !== "websocket") return null;

    return (
      <div className="space-y-4">
        <DetailField
          label="URL"
          value={config.url}
          fullWidth
          isEditMode={isEditMode}
          onChange={(val) => onConfigChange?.("url", val)}
        />
        {config.protocols && config.protocols.length > 0 && (
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-2 uppercase tracking-wide">
              Protocols
            </label>
            <p className={`text-sm font-medium ${tw.textPrimary}`}>
              {config.protocols.join(", ")}
            </p>
          </div>
        )}
        <div className="grid grid-cols-2 gap-4">
          <DetailField
            label="Auto Reconnect"
            value={config.reconnect ? "Yes" : "No"}
          />
          {config.reconnectInterval && (
            <DetailField
              label="Reconnect Interval (ms)"
              value={config.reconnectInterval}
            />
          )}
        </div>
      </div>
    );
  };

  const renderKafkaConfig = () => {
    const config = connector.config;
    if (config.type !== "kafka") return null;

    return (
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-2 uppercase tracking-wide">
            Brokers
          </label>
          <div className={`${tw.rounded} bg-gray-50 p-3 text-sm`}>
            {config.brokers.map((broker, idx) => (
              <div key={idx} className="text-gray-700">
                {broker}
              </div>
            ))}
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-2 uppercase tracking-wide">
            Topics
          </label>
          <div className={`${tw.rounded} bg-gray-50 p-3 text-sm`}>
            {config.topics.map((topic, idx) => (
              <div key={idx} className="text-gray-700">
                {topic}
              </div>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <DetailField
            label="Consumer Group ID"
            value={config.groupId || "N/A"}
          />
          <DetailField
            label="Client ID"
            value={config.clientId || "N/A"}
          />
        </div>
      </div>
    );
  };

  const renderFileConfig = () => {
    const config = connector.config;
    if (config.type !== "files") return null;

    return (
      <div className="space-y-4">
        <DetailField
          label="Path"
          value={config.path}
          fullWidth
          isEditMode={isEditMode}
          onChange={(val) => onConfigChange?.("path", val)}
        />
        <DetailField
          label="File Type"
          value={config.fileType}
          isEditMode={isEditMode}
          onChange={(val) => onConfigChange?.("fileType", val)}
        />
        {config.credentials && (
          <div className="grid grid-cols-2 gap-4">
            {config.credentials.username && (
              <DetailField
                label="Username"
                value={config.credentials.username}
                isEditMode={isEditMode}
                onChange={(val) =>
                  onConfigChange?.("credUsername", val)
                }
              />
            )}
            {config.credentials.password && (
              <DetailField
                label="Password"
                value={config.credentials.password}
                type="password"
                isEditMode={isEditMode}
                onChange={(val) =>
                  onConfigChange?.("credPassword", val)
                }
              />
            )}
          </div>
        )}
      </div>
    );
  };

  const renderSMSInboxConfig = () => {
    const config = connector.config;
    if (config.type !== "sms_inbox") return null;

    return (
      <div className="space-y-4">
        <DetailField
          label="Provider"
          value={config.provider}
          isEditMode={isEditMode}
          onChange={(val) => onConfigChange?.("provider", val)}
        />
        <DetailField
          label="Phone Number"
          value={config.phoneNumber || "N/A"}
          isEditMode={isEditMode}
          onChange={(val) => onConfigChange?.("phoneNumber", val)}
        />
        <DetailField
          label="API Endpoint"
          value={config.apiEndpoint || "N/A"}
          fullWidth
          isEditMode={isEditMode}
          onChange={(val) => onConfigChange?.("apiEndpoint", val)}
        />
        {config.credentials && Object.keys(config.credentials).length > 0 && (
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-2 uppercase tracking-wide">
              Credentials
            </label>
            <div className={`${tw.rounded} bg-gray-50 p-3 text-sm space-y-1`}>
              {Object.entries(config.credentials).map(([key, val]) => (
                <div key={key} className="text-gray-700">
                  <span className="font-medium">{key}:</span> ••••••••
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {connector.config.type === "jdbc" && renderJDBCConfig()}
      {connector.config.type === "api" && renderAPIConfig()}
      {connector.config.type === "tcp" && renderTCPConfig()}
      {connector.config.type === "websocket" && renderWebSocketConfig()}
      {connector.config.type === "kafka" && renderKafkaConfig()}
      {connector.config.type === "files" && renderFileConfig()}
      {connector.config.type === "sms_inbox" && renderSMSInboxConfig()}
    </div>
  );
}
