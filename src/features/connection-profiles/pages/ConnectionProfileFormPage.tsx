import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Save } from "lucide-react";
import BackButton from "../../../shared/components/ui/BackButton";
import { navigateBackOrFallback } from "../../../shared/utils/navigation";
import { connectionProfileService } from "../services/connectionProfileService";
import { serverService } from "../../servers/services/serverService";
import { ServerType } from "../../servers/types/server";
import {
  ConnectionProfileType,
  CreateConnectionProfilePayload,
  UpdateConnectionProfilePayload,
  ConnectionTypeEnum,
  LoadStrategyEnum,
  EnvironmentEnum,
  DataClassificationEnum,
} from "../types/connectionProfile";
import LoadingSpinner from "../../../shared/components/ui/LoadingSpinner";
import HeadlessSelect from "../../../shared/components/ui/HeadlessSelect";
import { useToast } from "../../../contexts/ToastContext";
import { useAuth } from "../../../contexts/AuthContext";
import { useLanguage } from "../../../contexts/LanguageContext";
import { color, tw } from "../../../shared/utils/utils";
import { CONNECTION_TYPE_OPTIONS } from "../constants/connectionTypes";

interface ConnectionProfileFormPageProps {
  mode: "create" | "edit";
  defaultConnectionType?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

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
        valid_from: data.valid_from.split("T")[0],
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
      showError(
        t.analytics?.["failed_to_load"] || "Failed to load connection profile",
        err instanceof Error
          ? err.message
          : t.common?.["try_again_later"] || "Please try again later.",
      );
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

        // Parse metadata if it's a string
        if (formData.metadata && typeof formData.metadata === "string") {
          try {
            cleanedPayload.metadata = JSON.parse(formData.metadata);
          } catch {
            cleanedPayload.metadata = undefined;
          }
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

        // Parse metadata if it's a string
        if (payload.metadata && typeof payload.metadata === "string") {
          try {
            payload.metadata = JSON.parse(payload.metadata);
          } catch {
            payload.metadata = undefined;
          }
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
      const errorMessage =
        err instanceof Error
          ? err.message
          : typeof err === "object" && err !== null && "message" in err
            ? String(err.message)
            : "Please try again later.";
      console.error("Connection profile error:", err);
      const action = mode === "create" ? "create" : "update";
      const translationKey =
        mode === "create" ? "failed_to_create" : "failed_to_update";
      showError(
        t.analytics?.[translationKey] ||
          `Failed to ${action} connection profile`,
        errorMessage,
      );
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
        <BackButton fallbackTo="/dashboard/connection-profiles" showBreadcrumb={true} currentLabel={mode === "create" ? "Create Connection Profile" : "Edit Connection Profile"} />
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
              <input
                type="text"
                value={formData.profile_name}
                onChange={(e) =>
                  setFormData({ ...formData, profile_name: e.target.value })
                }
                className={`w-full px-3 py-2 text-sm border border-gray-300 ${tw.rounded} focus:outline-none`}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Profile Code *
              </label>
              <input
                type="text"
                value={formData.profile_code}
                onChange={(e) =>
                  setFormData({ ...formData, profile_code: e.target.value })
                }
                className={`w-full px-3 py-2 text-sm border border-gray-300 ${tw.rounded} focus:outline-none`}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Connection Type *
              </label>
              <HeadlessSelect
                options={CONNECTION_TYPE_OPTIONS}
                value={formData.connection_type}
                onChange={(value) =>
                  setFormData({
                    ...formData,
                    connection_type: (value ||
                      "database") as ConnectionTypeEnum,
                  })
                }
              />
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
              <label className="block text-sm font-medium text-gray-700 ">
                Data Load Method *
              </label>
              <p className="text-xs text-gray-500 mb-2">
                How new data is brought in.
              </p>
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
              <p className="text-xs text-gray-500 mb-2">
                Select the server endpoint for this connection.
              </p>

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
            {formData.connection_type === "database" && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Database Name
                  </label>
                  <p className="text-xs text-gray-500 mb-2">
                    Name of the database to connect to.
                  </p>
                  <input
                    type="text"
                    value={formData.database_name || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        database_name: e.target.value || undefined,
                      })
                    }
                    className={`w-full px-3 py-2 text-sm border border-gray-300 ${tw.rounded} focus:outline-none`}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Database Type
                  </label>
                  <p className="text-xs text-gray-500 mb-2">
                    Type of database (e.g. MySQL, PostgreSQL, Oracle).
                  </p>
                  <input
                    type="text"
                    value={formData.database_type || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        database_type: e.target.value || undefined,
                      })
                    }
                    className={`w-full px-3 py-2 text-sm border border-gray-300 ${tw.rounded} focus:outline-none`}
                  />
                </div>
              </>
            )}
          </div>
        </div>

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
              <input
                type="number"
                value={formData.batch_size}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    batch_size: Number(e.target.value),
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
              <input
                type="number"
                value={formData.parallel_threads}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    parallel_threads: Number(e.target.value),
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
              <input
                type="number"
                value={formData.min_pool_size}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    min_pool_size: Number(e.target.value),
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
              <input
                type="number"
                value={formData.max_pool_size}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    max_pool_size: Number(e.target.value),
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
              <input
                type="number"
                value={formData.connection_timeout_seconds}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    connection_timeout_seconds: Number(e.target.value),
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
              <input
                type="number"
                value={formData.idle_timeout_seconds}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    idle_timeout_seconds: Number(e.target.value),
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
              <input
                type="number"
                value={formData.max_retries}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    max_retries: Number(e.target.value),
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
              <input
                type="number"
                value={formData.retry_backoff_multiplier}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    retry_backoff_multiplier: Number(e.target.value),
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
              <input
                type="number"
                value={formData.circuit_breaker_threshold}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    circuit_breaker_threshold: Number(e.target.value),
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
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.contains_pii}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      contains_pii: e.target.checked,
                    })
                  }
                  className="w-4 h-4"
                />
                <span className="text-sm font-medium text-gray-700">
                  Contains PII
                </span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.gdpr_applicable}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      gdpr_applicable: e.target.checked,
                    })
                  }
                  className="w-4 h-4"
                />
                <span className="text-sm font-medium text-gray-700">
                  GDPR Applicable
                </span>
              </label>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Valid From *
              </label>
              <input
                type="date"
                value={formData.valid_from}
                onChange={(e) =>
                  setFormData({ ...formData, valid_from: e.target.value })
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
              <input
                type="date"
                value={formData.valid_to || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    valid_to: e.target.value || null,
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
                <input
                  type="text"
                  value={formData.sync_column_name || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      sync_column_name: e.target.value || undefined,
                    })
                  }
                  className={`w-full px-3 py-2 text-sm border border-gray-300 ${tw.rounded} focus:outline-none`}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sync Column Type
                </label>
                <p className="text-xs text-gray-500 mb-2">
                  Data type of the sync column.
                </p>
                <input
                  type="text"
                  value={formData.sync_column_type || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      sync_column_type: e.target.value || undefined,
                    })
                  }
                  className={`w-full px-3 py-2 text-sm border border-gray-300 ${tw.rounded} focus:outline-none`}
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
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.health_check_enabled || false}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    health_check_enabled: e.target.checked,
                  })
                }
                className="w-4 h-4"
              />
              <span className="text-sm font-medium text-gray-700">Enabled</span>
            </label>
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
              <input
                type="number"
                value={formData.encryption_key_version || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    encryption_key_version: e.target.value
                      ? Number(e.target.value)
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
            className={`px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 ${tw.rounded} transition-colors`}
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
