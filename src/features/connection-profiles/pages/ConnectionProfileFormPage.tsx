import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Save } from "lucide-react";
import BackButton from "../../../shared/components/ui/BackButton";
import { navigateBackOrFallback } from "../../../shared/utils/navigation";
import { connectionProfileService } from "../services/connectionProfileService";
import { dataConnectorService } from "../../data-connectors/services/dataConnectorService";
import { serverService } from "../../servers/services/serverService";
import { DataConnectorType } from "../../data-connectors/types/dataConnector";
import { ServerType } from "../../servers/types/server";
import {
  ConnectionProfileType,
  CreateConnectionProfilePayload,
  UpdateConnectionProfilePayload,
  ConnectionTypeEnum,
  DatabaseTypeEnum,
  LoadStrategyEnum,
  EnvironmentEnum,
  DataClassificationEnum,
} from "../types/connectionProfile";
import LoadingSpinner from "../../../shared/components/ui/LoadingSpinner";
import Input from "../../../shared/components/ui/Input";
import HeadlessSelect from "../../../shared/components/ui/HeadlessSelect";
import { useToast } from "../../../contexts/ToastContext";
import { useAuth } from "../../../contexts/AuthContext";
import { useLanguage } from "../../../contexts/LanguageContext";
import { color, tw, button, getButtonStyles } from "../../../shared/utils/utils";
import {
  DATABASE_TYPE_OPTIONS,
} from "../constants/connectionTypes";
import Checkbox from "../../../shared/components/ui/Checkbox";
import {
  APIConfig,
  JDBCConfig,
  KafkaConfig,
  WebSocketConfig,
  TCPConfig,
  FilesConfig,
  SMSInboxConfig,
  ConfigComponentProps,
} from "../../../shared/components/ConnectorConfigComponents";
import { extractBackendError } from "../../../shared/utils/errorHandler";;;

interface ConnectionProfileFormPageProps {
  mode: "create" | "edit";
  defaultConnectionType?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

// Helper to convert formData format to config format and back
const createConfigAdapter = (formData: any, setFormData: (data: any) => void) => ({
  config: formData.metadata || {},
  updateConfiguration: (key: string, value: any) => {
    setFormData({
      ...formData,
      metadata: { ...(formData.metadata || {}), [key]: value },
    });
  },
});

// Note: The configuration field components below have been replaced by shared components
// that are imported from ConnectorConfigComponents.tsx to avoid duplication
export default function ConnectionProfileFormPage({
  mode,
  defaultConnectionType,
  onSuccess,
  onCancel,
}: ConnectionProfileFormPageProps) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { success, error: showError } = useToast();
  const { user } = useAuth();
  const { t } = useLanguage();

  const [loading, setLoading] = useState(mode === "edit");
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<ConnectionProfileType | null>(null);
  const [servers, setServers] = useState<ServerType[]>([]);
  const [loadingServers, setLoadingServers] = useState(false);
  const [serversError, setServersError] = useState<string | null>(null);
  const [connectorTypes, setConnectorTypes] = useState<DataConnectorType[]>([]);
  const [loadingConnectorTypes, setLoadingConnectorTypes] = useState(true);
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});

  const [formData, setFormData] = useState<
    CreateConnectionProfilePayload & {
      metadata?: string | Record<string, unknown>;
    }
  >({
    profile_name: "",
    profile_code: "",
    connection_type: (defaultConnectionType ||
      "database") as ConnectionTypeEnum,
    load_strategy: "full",
    environment: "development",
    batch_size: 1000,
    parallel_threads: 4,
    min_pool_size: 2,
    max_pool_size: 10,
    connection_timeout_seconds: 30,
    idle_timeout_seconds: 600,
    max_retries: 3,
    retry_backoff_multiplier: 2,
    circuit_breaker_threshold: 5,
    data_classification: "internal",
    contains_pii: false,
    gdpr_applicable: false,
    valid_from: new Date().toISOString().split("T")[0],
    server_id: undefined,
    database_name: "",
    database_type: "",
    sync_column_name: "",
    sync_column_type: "",
    health_check_enabled: false,
    health_check_query: "",
    encryption_key_version: undefined,
    metadata: "",
  });

  const togglePasswordVisibility = useCallback((field: string) => {
    setShowPasswords((prev) => ({ ...prev, [field]: !prev[field] }));
  }, []);

  const ensureUniqueIdentifiers = async () => {
    // Note: Backend doesn't have /name/{name} or /code/{code} endpoints
    // Validation will be handled by backend on create/update
    // This function is kept for potential future use but doesn't make API calls
  };

  const loadProfile = useCallback(async () => {
    if (!id) return;

    try {
      setLoading(true);
      const data = await connectionProfileService.getProfile(Number(id));
      setProfile(data);
      setFormData({
        profile_name: data.profile_name,
        profile_code: data.profile_code,
        connection_type: data.connection_type,
        load_strategy: data.load_strategy,
        environment: data.environment,
        batch_size: data.batch_size,
        parallel_threads: data.parallel_threads,
        min_pool_size: data.min_pool_size,
        max_pool_size: data.max_pool_size,
        connection_timeout_seconds: data.connection_timeout_seconds,
        idle_timeout_seconds: data.idle_timeout_seconds,
        max_retries: data.max_retries,
        retry_backoff_multiplier: data.retry_backoff_multiplier,
        circuit_breaker_threshold: data.circuit_breaker_threshold,
        data_classification: data.data_classification,
        contains_pii: data.contains_pii,
        gdpr_applicable: data.gdpr_applicable,
        valid_from: data.valid_from?.split("T")[0] ?? "",
        valid_to: data.valid_to ? data.valid_to.split("T")[0] : null,
        server_id: data.server_id || undefined,
        database_name: data.database_name || undefined,
        database_type: data.database_type || undefined,
        sync_column_name: data.sync_column_name || undefined,
        sync_column_type: data.sync_column_type || undefined,
        health_check_enabled: data.health_check_enabled,
        health_check_query: data.health_check_query || undefined,
        encryption_key_version: data.encryption_key_version,
        metadata: data.metadata ? JSON.stringify(data.metadata) : "",
      });
    } catch (err) {
      console.error("Failed to load connection profile:", err);
      showError("Unable to Load Profile", extractBackendError(error, "Unable to Load Profile. Please try again."));
    } finally {
      setLoading(false);
    }
  }, [id, showError, t]);

  useEffect(() => {
    if (mode === "edit" && id) {
      loadProfile();
    }
  }, [mode, id, loadProfile]);

  useEffect(() => {
    const loadServers = async () => {
      try {
        setLoadingServers(true);
        setServersError(null);
        const response = await serverService.listServers({
          limit: 100,
          offset: 0,
        });

        const serverList = response.data || [];
        setServers(Array.isArray(serverList) ? serverList : []);
      } catch (err) {
        console.error("Failed to load servers:", err);
        setServersError(
          err instanceof Error ? err.message : "Failed to load servers",
        );
        setServers([]);
      } finally {
        setLoadingServers(false);
      }
    };

    loadServers();
  }, []);

  useEffect(() => {
    const loadConnectorTypes = async () => {
      try {
        setLoadingConnectorTypes(true);
        const types = await dataConnectorService.getAvailableConnectorTypes();
        setConnectorTypes(types);
      } catch (err) {
        console.error("Failed to load connector types:", err);
        setConnectorTypes([]);
      } finally {
        setLoadingConnectorTypes(false);
      }
    };

    loadConnectorTypes();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      await ensureUniqueIdentifiers();
      if (mode === "create") {
        // Clean payload - remove undefined values (but keep null)
        const cleanedPayload: Record<string, unknown> = {
          ...formData,
          valid_from: new Date(formData.valid_from).toISOString(),
        };

        if (formData.valid_to) {
          cleanedPayload.valid_to = new Date(formData.valid_to).toISOString();
        }

        // Parse metadata if it's a string and map to configuration
        if (formData.metadata && typeof formData.metadata === "string") {
          try {
            cleanedPayload.configuration = JSON.parse(formData.metadata);
          } catch {
            cleanedPayload.configuration = undefined;
          }
        } else if (formData.metadata) {
          cleanedPayload.configuration = formData.metadata;
        }

        // Add created_by if user is available
        if (user?.user_id) {
          cleanedPayload.created_by = user.user_id;
        }

        // Remove only undefined values (null is valid and should be sent)
        Object.keys(cleanedPayload).forEach((key) => {
          if (cleanedPayload[key] === undefined || cleanedPayload[key] === "") {
            delete cleanedPayload[key];
          }
        });

        const payload =
          cleanedPayload as unknown as CreateConnectionProfilePayload;
        await connectionProfileService.createProfile(payload);
        success("Connection profile created successfully");
      } else if (id) {
        const payload: UpdateConnectionProfilePayload = {
          ...formData,
          valid_from: new Date(formData.valid_from).toISOString(),
          valid_to: formData.valid_to
            ? new Date(formData.valid_to).toISOString()
            : null,
        };

        // Parse metadata if it's a string and map to configuration
        if (payload.metadata && typeof payload.metadata === "string") {
          try {
            payload.configuration = JSON.parse(payload.metadata);
          } catch {
            payload.configuration = undefined;
          }
        } else if (payload.metadata) {
          payload.configuration = payload.metadata;
        }

        await connectionProfileService.updateProfile(Number(id), payload);
        success("Connection profile updated successfully");
      }

      // Call onSuccess callback if provided (for modal use)
      if (onSuccess) {
        onSuccess();
      } else {
        // Otherwise navigate to connection profiles list
        navigate("/dashboard/connection-profiles");
      }
    } catch (err) {
      console.error("Connection profile error:", err);
      const action = mode === "create" ? "create" : "update";
      const actionLabel = action === "create" ? "Create" : "Update";
      showError(        `Unable to ${actionLabel} Profile`,        extractBackendError(err, `Failed to ${action} connection profile. Please try again later.`),      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <LoadingSpinner variant="modern" size="xl" color="primary" />
        <p className={`${tw.textMuted} font-medium mt-4`}>
          Loading connection profile...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {!onSuccess && (
        <BackButton
          fallbackTo="/dashboard/connection-profiles"
          showBreadcrumb={true}
          currentLabel={
            mode === "create"
              ? "Create Connection Profile"
              : "Edit Connection Profile"
          }
        />
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div
          className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm`}
        >
          <h2 className={`${tw.cardHeading} text-gray-900 mb-4`}>
            Basic Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Profile Name *
              </label>
              <Input
                placeholder="Profile name"
                value={formData.profile_name}
                onChange={(val) =>
                  setFormData({ ...formData, profile_name: val })
                }
                variant="medium"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Profile Code *
              </label>
              <Input
                placeholder="Profile code"
                value={formData.profile_code}
                onChange={(val) =>
                  setFormData({ ...formData, profile_code: val })
                }
                variant="medium"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Connection Type *
              </label>
              {loadingConnectorTypes ? (
                <div className="text-sm text-gray-500 py-2">
                  Loading connection types...
                </div>
              ) : (
                <HeadlessSelect
                  options={connectorTypes.map((type) => ({
                    value: type,
                    label: type.charAt(0).toUpperCase() + type.slice(1).replace(/_/g, " "),
                  }))}
                  value={formData.connection_type}
                  onChange={(value) =>
                    setFormData({
                      ...formData,
                      connection_type: (value ||
                        "database") as ConnectionTypeEnum,
                    })
                  }
                />
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Environment *
              </label>
              <HeadlessSelect
                options={[
                  { value: "development", label: "Development" },
                  { value: "staging", label: "Staging" },
                  { value: "production", label: "Production" },
                ]}
                value={formData.environment}
                onChange={(value) =>
                  setFormData({
                    ...formData,
                    environment: (value || "development") as EnvironmentEnum,
                  })
                }
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Data Load Method *
              </label>
              {/* <p className="text-xs text-gray-500 mb-2">
                How new data is brought in.
              </p> */}
              <HeadlessSelect
                options={[
                  { value: "full", label: "Full" },
                  { value: "incremental", label: "Incremental" },
                  { value: "delta", label: "Delta" },
                  { value: "cdc", label: "CDC" },
                  { value: "merge", label: "Merge" },
                  { value: "append", label: "Append" },
                  { value: "upsert", label: "Upsert" },
                ]}
                value={formData.load_strategy}
                onChange={(value) =>
                  setFormData({
                    ...formData,
                    load_strategy: (value || "full") as LoadStrategyEnum,
                  })
                }
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Server
              </label>
              {/* <p className="text-xs text-gray-500 mb-2">
                Select the server endpoint for this connection.
              </p> */}

              {loadingServers && (
                <div className="text-sm text-gray-500 py-2">
                  Loading servers...
                </div>
              )}

              {serversError && (
                <div className="text-sm text-red-500 py-2">
                  Error loading servers: {serversError}
                </div>
              )}

              {!loadingServers && !serversError && servers.length === 0 && (
                <div className="text-sm text-yellow-600 py-2">
                  No servers available. Please create a server first.
                </div>
              )}

              {!loadingServers && !serversError && servers.length > 0 && (
                <HeadlessSelect
                  options={servers.map((server) => ({
                    value: String(server.id),
                    label: `${server.name} (${server.host}${
                      server.port ? `:${server.port}` : ""
                    })`,
                  }))}
                  value={String(formData.server_id || "")}
                  onChange={(value) =>
                    setFormData({
                      ...formData,
                      server_id: value ? Number(value) : undefined,
                    })
                  }
                  placeholder="Select a server..."
                  className="mt-1"
                />
              )}
            </div>
          </div>
        </div>

        {/* Connection Type Specific Configuration */}
        {(formData.connection_type === "api" ||
          formData.connection_type === "kafka" ||
          formData.connection_type === "websocket" ||
          formData.connection_type === "tcp" ||
          formData.connection_type === "jdbc" ||
          formData.connection_type === "sms_inbox" ||
          formData.connection_type === "files") && (
          <div
            className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm`}
          >
            {formData.connection_type === "api" && (
              <APIConfig
                config={formData.metadata || {}}
                updateConfiguration={(key, value) =>
                  setFormData({
                    ...formData,
                    metadata: { ...(formData.metadata || {}), [key]: value },
                  })
                }
                showPasswords={showPasswords}
                togglePasswordVisibility={togglePasswordVisibility}
              />
            )}
            {formData.connection_type === "kafka" && (
              <KafkaConfig
                config={formData.metadata || {}}
                updateConfiguration={(key, value) =>
                  setFormData({
                    ...formData,
                    metadata: { ...(formData.metadata || {}), [key]: value },
                  })
                }
                showPasswords={showPasswords}
                togglePasswordVisibility={togglePasswordVisibility}
              />
            )}
            {formData.connection_type === "websocket" && (
              <WebSocketConfig
                config={formData.metadata || {}}
                updateConfiguration={(key, value) =>
                  setFormData({
                    ...formData,
                    metadata: { ...(formData.metadata || {}), [key]: value },
                  })
                }
                showPasswords={showPasswords}
                togglePasswordVisibility={togglePasswordVisibility}
              />
            )}
            {formData.connection_type === "tcp" && (
              <TCPConfig
                config={formData.metadata || {}}
                updateConfiguration={(key, value) =>
                  setFormData({
                    ...formData,
                    metadata: { ...(formData.metadata || {}), [key]: value },
                  })
                }
                showPasswords={showPasswords}
                togglePasswordVisibility={togglePasswordVisibility}
              />
            )}
            {formData.connection_type === "jdbc" && (
              <JDBCConfig
                config={formData.metadata || {}}
                updateConfiguration={(key, value) =>
                  setFormData({
                    ...formData,
                    metadata: { ...(formData.metadata || {}), [key]: value },
                  })
                }
                showPasswords={showPasswords}
                togglePasswordVisibility={togglePasswordVisibility}
              />
            )}
            {formData.connection_type === "sms_inbox" && (
              <SMSInboxConfig
                config={formData.metadata || {}}
                updateConfiguration={(key, value) =>
                  setFormData({
                    ...formData,
                    metadata: { ...(formData.metadata || {}), [key]: value },
                  })
                }
                showPasswords={showPasswords}
                togglePasswordVisibility={togglePasswordVisibility}
              />
            )}
            {formData.connection_type === "files" && (
              <FilesConfig
                config={formData.metadata || {}}
                updateConfiguration={(key, value) =>
                  setFormData({
                    ...formData,
                    metadata: { ...(formData.metadata || {}), [key]: value },
                  })
                }
                showPasswords={showPasswords}
                togglePasswordVisibility={togglePasswordVisibility}
              />
            )}
          </div>
        )}

        <div
          className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm`}
        >
          <h2 className={`${tw.cardHeading} text-gray-900 mb-4`}>
            Performance Settings
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 ">
                Records Per Batch *
              </label>
              <p className="text-xs text-gray-500 mb-2">
                How many records to process at a time.
              </p>
              <Input type="number"
                value={formData.batch_size}
                onChange={(value) =>
                  setFormData({
                    ...formData,
                    batch_size: Number(String(value)),
                  })
                }
                className={`w-full px-3 py-2 text-sm border border-gray-300 ${tw.rounded} focus:outline-none`}
                required
                min={1}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Number of Parallel Tasks *
              </label>
              <p className="text-xs text-gray-500 mb-2">
                How many tasks run at the same time for faster processing.
              </p>
              <Input type="number"
                value={formData.parallel_threads}
                onChange={(value) =>
                  setFormData({
                    ...formData,
                    parallel_threads: Number(String(value)),
                  })
                }
                className={`w-full px-3 py-2 text-sm border border-gray-300 ${tw.rounded} focus:outline-none`}
                required
                min={1}
                max={32}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Minimum Connections *
              </label>
              {/* <p className="text-xs text-gray-500 mb-1">
                Smallest number of connections to keep open to the service. Example: 2 for always-ready SMS connections.
              </p> */}
              <Input type="number"
                value={formData.min_pool_size}
                onChange={(value) =>
                  setFormData({
                    ...formData,
                    min_pool_size: Number(String(value)),
                  })
                }
                className={`w-full px-3 py-2 text-sm border border-gray-300 ${tw.rounded} focus:outline-none`}
                required
                min={1}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Maximum Connections *
              </label>
              {/* <p className="text-xs text-gray-500 mb-1">
                Largest number of connections allowed at once. 
              </p> */}
              <Input type="number"
                value={formData.max_pool_size}
                onChange={(value) =>
                  setFormData({
                    ...formData,
                    max_pool_size: Number(String(value)),
                  })
                }
                className={`w-full px-3 py-2 text-sm border border-gray-300 ${tw.rounded} focus:outline-none`}
                required
                min={formData.min_pool_size}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 ">
                Connection Wait Time (seconds) *
              </label>
              <p className="text-xs text-gray-500 mb-2">
                How long to wait for a connection before giving up.
              </p>
              <Input type="number"
                value={formData.connection_timeout_seconds}
                onChange={(value) =>
                  setFormData({
                    ...formData,
                    connection_timeout_seconds: Number(String(value)),
                  })
                }
                className={`w-full px-3 py-2 text-sm border border-gray-300 ${tw.rounded} focus:outline-none`}
                required
                min={1}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Idle Disconnect Time (seconds) *
              </label>
              <p className="text-xs text-gray-500 mb-2">
                How long a connection can be unused before closing.
              </p>
              <Input type="number"
                value={formData.idle_timeout_seconds}
                onChange={(value) =>
                  setFormData({
                    ...formData,
                    idle_timeout_seconds: Number(String(value)),
                  })
                }
                className={`w-full px-3 py-2 text-sm border border-gray-300 ${tw.rounded} focus:outline-none`}
                required
                min={1}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Max Retries *
              </label>
              <p className="text-xs text-gray-500 mb-2">
                Maximum number of retry attempts on failure.
              </p>
              <Input type="number"
                value={formData.max_retries}
                onChange={(value) =>
                  setFormData({
                    ...formData,
                    max_retries: Number(String(value)),
                  })
                }
                className={`w-full px-3 py-2 text-sm border border-gray-300 ${tw.rounded} focus:outline-none`}
                required
                min={0}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Retry Backoff Multiplier *
              </label>
              <p className="text-xs text-gray-500 mb-2">
                Exponential backoff multiplier for retries.
              </p>
              <Input type="number"
                value={formData.retry_backoff_multiplier}
                onChange={(value) =>
                  setFormData({
                    ...formData,
                    retry_backoff_multiplier: Number(String(value)),
                  })
                }
                className={`w-full px-3 py-2 text-sm border border-gray-300 ${tw.rounded} focus:outline-none`}
                required
                min={1}
                step={0.1}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Circuit Breaker Threshold *
              </label>
              <p className="text-xs text-gray-500 mb-2">
                Number of failures before circuit opens.
              </p>
              <Input type="number"
                value={formData.circuit_breaker_threshold}
                onChange={(value) =>
                  setFormData({
                    ...formData,
                    circuit_breaker_threshold: Number(String(value)),
                  })
                }
                className={`w-full px-3 py-2 text-sm border border-gray-300 ${tw.rounded} focus:outline-none`}
                required
                min={1}
              />
            </div>
          </div>
        </div>

        <div
          className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm`}
        >
          <h2 className={`${tw.cardHeading} text-gray-900 mb-4`}>
            Data Governance
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Data Classification *
              </label>
              <HeadlessSelect
                options={[
                  { value: "public", label: "Public" },
                  { value: "internal", label: "Internal" },
                  { value: "confidential", label: "Confidential" },
                  { value: "restricted", label: "Restricted" },
                ]}
                value={formData.data_classification}
                onChange={(value) =>
                  setFormData({
                    ...formData,
                    data_classification: (value ||
                      "internal") as DataClassificationEnum,
                  })
                }
              />
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 cursor-pointer" onClick={() =>
                setFormData({
                  ...formData,
                  contains_pii: !formData.contains_pii,
                })
              }>
                <Checkbox
                  id="contains-pii"
                  checked={formData.contains_pii}
                  onChange={() =>
                    setFormData({
                      ...formData,
                      contains_pii: !formData.contains_pii,
                    })
                  }
                  className="w-4 h-4"
                />
                <span className="text-sm font-medium text-gray-700">
                  Contains PII
                </span>
              </div>
              <div className="flex items-center gap-2 cursor-pointer" onClick={() =>
                setFormData({
                  ...formData,
                  gdpr_applicable: !formData.gdpr_applicable,
                })
              }>
                <Checkbox
                  id="gdpr-applicable"
                  checked={formData.gdpr_applicable}
                  onChange={() =>
                    setFormData({
                      ...formData,
                      gdpr_applicable: !formData.gdpr_applicable,
                    })
                  }
                  className="w-4 h-4"
                />
                <span className="text-sm font-medium text-gray-700">
                  GDPR Applicable
                </span>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Valid From *
              </label>
              <Input type="date"
                value={formData.valid_from}
                onChange={(value) =>
                  setFormData({ ...formData, valid_from: String(value) })
                }
                className={`w-full px-3 py-2 text-sm border border-gray-300 ${tw.rounded} focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-gray-400 cursor-pointer`}
                required
                onClick={(e) => (e.target as HTMLInputElement).showPicker?.()}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Valid To
              </label>
              <Input type="date"
                value={formData.valid_to || ""}
                onChange={(value) =>
                  setFormData({
                    ...formData,
                    valid_to: String(value) || null,
                  })
                }
                className={`w-full px-3 py-2 text-sm border border-gray-300 ${tw.rounded} focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-gray-400 cursor-pointer`}
                onClick={(e) => (e.target as HTMLInputElement).showPicker?.()}
              />
            </div>
          </div>
        </div>

        {(formData.load_strategy === "incremental" ||
          formData.load_strategy === "delta" ||
          formData.load_strategy === "cdc") && (
          <div
            className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm`}
          >
            <h2 className={`${tw.cardHeading} text-gray-900 mb-4`}>
              Sync Settings
            </h2>
            <p className="text-xs text-gray-500 mb-4">
              Configure incremental sync settings for detecting changes.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sync Column Name
                </label>
                <p className="text-xs text-gray-500 mb-2">
                  Column used for tracking changes (e.g. modified_at, id).
                </p>
                <Input
                  placeholder="Sync column name"
                  value={formData.sync_column_name || ""}
                  onChange={(val) =>
                    setFormData({
                      ...formData,
                      sync_column_name: val || undefined,
                    })
                  }
                  variant="medium"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sync Column Type
                </label>
                <p className="text-xs text-gray-500 mb-2">
                  Data type of the sync column.
                </p>
                <Input
                  placeholder="Sync column type"
                  value={formData.sync_column_type || ""}
                  onChange={(val) =>
                    setFormData({
                      ...formData,
                      sync_column_type: val || undefined,
                    })
                  }
                  variant="medium"
                />
              </div>
            </div>
          </div>
        )}

        <div
          className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm`}
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className={`${tw.cardHeading} text-gray-900`}>
                Health Checks
              </h2>
              <p className="text-xs text-gray-500 mt-1">
                Monitor connection health with periodic checks.
              </p>
            </div>
            <div className="flex items-center gap-2 cursor-pointer" onClick={() =>
              setFormData({
                ...formData,
                health_check_enabled: !(formData.health_check_enabled || false),
              })
            }>
              <Checkbox
                id="health-check-enabled"
                checked={formData.health_check_enabled || false}
                onChange={() =>
                  setFormData({
                    ...formData,
                    health_check_enabled: !(formData.health_check_enabled || false),
                  })
                }
                className="w-4 h-4"
              />
              <span className="text-sm font-medium text-gray-700">Enabled</span>
            </div>
          </div>

          {formData.health_check_enabled && (
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Health Check Query
              </label>
              <p className="text-xs text-gray-500 mb-2">
                Query to run for health checks (e.g. SELECT 1).
              </p>
              <textarea
                value={formData.health_check_query || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    health_check_query: e.target.value || undefined,
                  })
                }
                className={`w-full px-3 py-2 text-sm border border-gray-300 ${tw.rounded} focus:outline-none font-mono`}
                rows={2}
                placeholder="SELECT 1"
              />
            </div>
          )}
        </div>

        <div
          className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm`}
        >
          <h2 className={`${tw.cardHeading} text-gray-900 mb-4`}>
            Advanced Settings
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Encryption Key Version
              </label>
              <p className="text-xs text-gray-500 mb-2">
                Version of encryption key to use for sensitive data.
              </p>
              <Input type="number"
                value={formData.encryption_key_version || ""}
                onChange={(value) =>
                  setFormData({
                    ...formData,
                    encryption_key_version: String(value)
                      ? Number(String(value))
                      : undefined,
                  })
                }
                className={`w-full px-3 py-2 text-sm border border-gray-300 ${tw.rounded} focus:outline-none`}
                min={1}
              />
            </div>
          </div>
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Metadata
            </label>
            <p className="text-xs text-gray-500 mb-2">
              Additional metadata as JSON (e.g. &#x7B;&quot;key&quot;:
              &quot;value&quot;&#x7D;).
            </p>
            <textarea
              value={formData.metadata || ""}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  metadata: e.target.value || "",
                })
              }
              className={`w-full px-3 py-2 text-sm border border-gray-300 ${tw.rounded} focus:outline-none font-mono`}
              rows={3}
              placeholder='{"key": "value"}'
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={() => {
              if (onCancel) {
                onCancel();
              } else {
                navigateBackOrFallback(
                  navigate,
                  "/dashboard/connection-profiles",
                );
              }
            }}
            className="transition-colors disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-80"
            style={getButtonStyles(button.bordered)}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className={`px-4 py-2 text-white ${tw.rounded} transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2`}
            style={{ backgroundColor: color.primary.action }}
          >
            {saving ? (
              <>
                <LoadingSpinner size="sm" color="white" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                {mode === "create" ? "Create Profile" : "Update Profile"}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
