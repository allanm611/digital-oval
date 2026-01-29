import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Save } from "lucide-react";
import BackButton from "../../../shared/components/ui/BackButton";
import { navigateBackOrFallback } from "../../../shared/utils/navigation";
import { connectionProfileService } from "../services/connectionProfileService";
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

  const [formData, setFormData] = useState<CreateConnectionProfilePayload>({
    profile_name: "",
    profile_code: "",
    connection_type: (defaultConnectionType || "database") as ConnectionTypeEnum,
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
        metadata: data.metadata || undefined,
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

        // Add created_by if user is available
        if (user?.user_id) {
          cleanedPayload.created_by = user.user_id;
        }

        // Remove only undefined values (null is valid and should be sent)
        Object.keys(cleanedPayload).forEach((key) => {
          if (cleanedPayload[key] === undefined) {
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
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <BackButton fallbackTo="/dashboard/connection-profiles" />
          <div className="ml-2 sm:ml-4">
            <h1 className={`${tw.mainHeading} ${tw.textPrimary}`}>
              {mode === "create"
                ? "Create Connection Profile"
                : "Edit Connection Profile"}
            </h1>
            <p className={`${tw.textSecondary} mt-1 text-sm`}>
              {mode === "create"
                ? "Configure a new connection profile"
                : `Editing: ${profile?.profile_name || ""}`}
            </p>
          </div>
        </div>
      </div>

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
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Server ID
              </label>
              <input
                type="number"
                value={formData.server_id || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    server_id: e.target.value
                      ? Number(e.target.value)
                      : undefined,
                  })
                }
                className={`w-full px-3 py-2 text-sm border border-gray-300 ${tw.rounded} focus:outline-none`}
              />
            </div>
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

        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={() => {
              if (onCancel) {
                onCancel();
              } else {
                navigateBackOrFallback(navigate, "/dashboard/connection-profiles");
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
