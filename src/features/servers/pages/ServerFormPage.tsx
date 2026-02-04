import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import BackButton from "../../../shared/components/ui/BackButton";
import {
  CreateServerPayload,
  ServerEnvironment,
  ServerProtocol,
  ServerType,
  UpdateServerPayload,
} from "../types/server";
import { serverService } from "../services/serverService";
import { useToast } from "../../../contexts/ToastContext";
import { useAuth } from "../../../contexts/AuthContext";
import { useLanguage } from "../../../contexts/LanguageContext";
import { color, tw } from "../../../shared/utils/utils";
import { navigateBackOrFallback } from "../../../shared/utils/navigation";
import LoadingSpinner from "../../../shared/components/ui/LoadingSpinner";
import HeadlessSelect from "../../../shared/components/ui/HeadlessSelect";

type ServerFormPageProps = {
  mode: "create" | "edit";
};

const defaultFormValues = {
  name: "",
  code: "",
  protocol: "http" as ServerProtocol,
  host: "",
  environment: "dev" as ServerEnvironment,
  region: "",
  port: "",
  base_path: "",
  server_type: "",
  timeout_seconds: 30,
  max_retries: 3,
  health_check_enabled: true,
  health_check_url: "",
  health_check_interval_seconds: 300,
  circuit_breaker_enabled: true,
  circuit_breaker_threshold: 5,
  tls_enabled: false,
  authentication_type: "",
  metadata: "",
};

export default function ServerFormPage({ mode }: ServerFormPageProps) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { success, error } = useToast();
  const { user } = useAuth();
  const { t } = useLanguage();

  const [form, setForm] = useState({ ...defaultFormValues });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(mode === "edit");
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (mode === "edit" && id) {
      const loadServer = async () => {
        try {
          setIsLoading(true);
          const server = await serverService.getServerById(Number(id));
          setForm({
            name: server.name || "",
            code: server.code || "",
            protocol: server.protocol || "http",
            host: server.host || "",
            environment: (server.environment as ServerEnvironment) || "dev",
            region: server.region || "",
            port: server.port ? String(server.port) : "",
            base_path: server.base_path || "",
            server_type: server.server_type || "",
            timeout_seconds: server.timeout_seconds || 30,
            max_retries: server.max_retries || 3,
            health_check_enabled: server.health_check_enabled || false,
            health_check_url: server.health_check_url || "",
            health_check_interval_seconds:
              server.health_check_interval_seconds || 300,
            circuit_breaker_enabled: server.circuit_breaker_enabled || false,
            circuit_breaker_threshold: server.circuit_breaker_threshold || 5,
            tls_enabled: server.tls_enabled || false,
            authentication_type: server.authentication_type || "",
            metadata: server.metadata ? JSON.stringify(server.metadata) : "",
          });
        } catch (err) {
          const message =
            err instanceof Error ? err.message : t.errors.unableLoadServer;
          error(t.errors.failedLoadServer, message);
          navigate("/dashboard/servers");
        } finally {
          setIsLoading(false);
        }
      };
      loadServer();
    }
  }, [mode, id, navigate, error, t]);

  const handleChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value, type } = event.target;
    const checked = (event.target as HTMLInputElement).checked;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!form.name.trim()) newErrors.name = t.validation.nameRequired;
    if (!form.code.trim()) newErrors.code = t.validation.codeRequired;
    if (!form.host.trim()) newErrors.host = t.validation.hostRequired;
    if (!form.protocol) newErrors.protocol = t.validation.protocolRequired;
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      if (mode === "create") {
        const payload: CreateServerPayload = {
          name: form.name.trim(),
          code: form.code.trim(),
          protocol: form.protocol,
          host: form.host.trim(),
          environment: form.environment || undefined,
          region: form.region || undefined,
          port: form.port ? Number(form.port) : undefined,
          base_path: form.base_path || undefined,
          server_type: form.server_type || undefined,
          timeout_seconds: Number(form.timeout_seconds) || undefined,
          max_retries: Number(form.max_retries) || undefined,
          health_check_enabled: form.health_check_enabled,
          health_check_url: form.health_check_url || undefined,
          health_check_interval_seconds:
            Number(form.health_check_interval_seconds) || undefined,
          circuit_breaker_enabled: form.circuit_breaker_enabled,
          circuit_breaker_threshold:
            Number(form.circuit_breaker_threshold) || undefined,
          tls_enabled: form.tls_enabled,
          authentication_type: form.authentication_type || undefined,
          metadata: form.metadata ? JSON.parse(form.metadata) : undefined,
          user_id: user?.user_id,
        };

        const newServer = await serverService.createServer(payload);
        success(
          t.success.serverCreated,
          t("success.serverCreatedMessage", { name: newServer.name }),
        );
        navigate("/dashboard/servers");
      } else if (mode === "edit" && id) {
        const payload: UpdateServerPayload = {
          name: form.name.trim(),
          code: form.code.trim(),
          protocol: form.protocol,
          host: form.host.trim(),
          environment: form.environment || undefined,
          region: form.region || undefined,
          port: form.port ? Number(form.port) : undefined,
          base_path: form.base_path || undefined,
          server_type: form.server_type || undefined,
          timeout_seconds: Number(form.timeout_seconds) || undefined,
          max_retries: Number(form.max_retries) || undefined,
          health_check_enabled: form.health_check_enabled,
          health_check_url: form.health_check_url || undefined,
          health_check_interval_seconds:
            Number(form.health_check_interval_seconds) || undefined,
          circuit_breaker_enabled: form.circuit_breaker_enabled,
          circuit_breaker_threshold:
            Number(form.circuit_breaker_threshold) || undefined,
          tls_enabled: form.tls_enabled,
          authentication_type: form.authentication_type || undefined,
          metadata: form.metadata ? JSON.parse(form.metadata) : undefined,
          user_id: user?.user_id ? String(user.user_id) : undefined,
        };

        const updatedServer = await serverService.updateServer(
          Number(id),
          payload,
        );
        success(
          t.success.serverUpdated,
          t("success.serverUpdatedMessage", { name: updatedServer.name }),
        );
        navigate(`/dashboard/servers/${id}`);
      }
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : t(
              `errors.unableUpdate${mode === "create" ? "Create" : "Update"}Server`,
            );
      error(
        t(`errors.failed${mode === "create" ? "Create" : "Update"}Server`),
        message,
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner variant="modern" size="lg" color="primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <BackButton fallbackTo="/dashboard/servers" />
        <div>
          <h1 className={`${tw.mainHeading} ${tw.textPrimary}`}>
            {mode === "create" ? "Add Server" : "Edit Server"}
          </h1>
          <p className={`${tw.textSecondary} mt-2 text-sm`}>
            {mode === "create"
              ? "Define the destination endpoint CVM jobs will target."
              : "Update server configuration and monitoring settings."}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div
          className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm`}
        >
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Basic Information
          </h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="text-sm font-medium text-gray-700">
                Name<span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                className={`mt-1 w-full ${tw.rounded} border border-gray-200 px-3 py-2 text-sm focus:border-gray-400 focus:outline-none`}
              />
              {errors.name && (
                <p className="mt-1 text-xs text-red-500">{errors.name}</p>
              )}
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">
                Code<span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="code"
                value={form.code}
                onChange={handleChange}
                className={`mt-1 w-full ${tw.rounded} border border-gray-200 px-3 py-2 text-sm focus:border-gray-400 focus:outline-none`}
              />
              {errors.code && (
                <p className="mt-1 text-xs text-red-500">{errors.code}</p>
              )}
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">
                Protocol<span className="text-red-500">*</span>
              </label>
              <HeadlessSelect
                options={[
                  { value: "http", label: "HTTP" },
                  { value: "https", label: "HTTPS" },
                  { value: "ftp", label: "FTP" },
                  { value: "ftps", label: "FTPS" },
                  { value: "sftp", label: "SFTP" },
                  { value: "tcp", label: "TCP" },
                  { value: "smtp", label: "SMTP" },
                  { value: "smtps", label: "SMTPS" },
                ]}
                value={form.protocol}
                onChange={(value) =>
                  setForm((prev) => ({
                    ...prev,
                    protocol: value as ServerProtocol,
                  }))
                }
                placeholder="Select protocol"
                className="mt-1"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">
                Host<span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="host"
                value={form.host}
                onChange={handleChange}
                className={`mt-1 w-full ${tw.rounded} border border-gray-200 px-3 py-2 text-sm focus:border-gray-400 focus:outline-none`}
              />
              {errors.host && (
                <p className="mt-1 text-xs text-red-500">{errors.host}</p>
              )}
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">
                Environment
              </label>
              <HeadlessSelect
                options={[
                  { value: "dev", label: "DEV" },
                  { value: "staging", label: "STAGING" },
                  { value: "production", label: "PRODUCTION" },
                  { value: "dr", label: "DR" },
                ]}
                value={form.environment}
                onChange={(value) =>
                  setForm((prev) => ({
                    ...prev,
                    environment: value as ServerEnvironment,
                  }))
                }
                placeholder="Select environment"
                className="mt-1"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">
                Region
              </label>
              <p className="text-xs text-gray-500 mb-1">
                The physical or logical location of the server (e.g. Uganda,
                EU-West).
              </p>
              <input
                type="text"
                name="region"
                value={form.region}
                onChange={handleChange}
                className={`w-full ${tw.rounded} border border-gray-200 px-3 py-2 text-sm focus:border-gray-400 focus:outline-none`}
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">Port</label>
              <p className="text-xs text-gray-500 mb-1">
                The network port used to connect (e.g. 80 for HTTP, 443 for
                HTTPS).
              </p>
              <input
                type="number"
                name="port"
                value={form.port}
                onChange={handleChange}
                className={`w-full ${tw.rounded} border border-gray-200 px-3 py-2 text-sm focus:border-gray-400 focus:outline-none`}
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">
                Base Path
              </label>
              <p className="text-xs text-gray-500 mb-1">
                The starting path for API calls (e.g. /api/v1).
              </p>
              <input
                type="text"
                name="base_path"
                value={form.base_path}
                onChange={handleChange}
                className={`w-full ${tw.rounded} border border-gray-200 px-3 py-2 text-sm focus:border-gray-400 focus:outline-none`}
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">
                Server Type
              </label>
              <p className="text-xs text-gray-500 mb-1">
                Classification of server type (e.g. database, api, file-storage).
              </p>
              <input
                type="text"
                name="server_type"
                value={form.server_type}
                onChange={handleChange}
                className={`w-full ${tw.rounded} border border-gray-200 px-3 py-2 text-sm focus:border-gray-400 focus:outline-none`}
              />
            </div>
          </div>
        </div>

        <div
          className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm`}
        >
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Connection Settings
          </h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="text-sm font-medium text-gray-700">
                Timeout (seconds)
              </label>
              <input
                type="number"
                name="timeout_seconds"
                value={form.timeout_seconds}
                onChange={handleChange}
                className={`mt-1 w-full ${tw.rounded} border border-gray-200 px-3 py-2 text-sm focus:border-gray-400 focus:outline-none`}
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">
                Max Retries
              </label>
              <input
                type="number"
                name="max_retries"
                value={form.max_retries}
                onChange={handleChange}
                className={`mt-1 w-full ${tw.rounded} border border-gray-200 px-3 py-2 text-sm focus:border-gray-400 focus:outline-none`}
              />
            </div>
          </div>
        </div>

        <div
          className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm`}
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Health Checks
              </h2>
              <p className="text-xs text-gray-500 mt-1">
                Automatically monitor availability and latency.
              </p>
            </div>
            <label className="inline-flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                name="health_check_enabled"
                checked={form.health_check_enabled}
                onChange={handleChange}
                className="h-4 w-4 rounded border-gray-300 text-black focus:ring-black"
              />
              Enabled
            </label>
          </div>

          {form.health_check_enabled && (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 mt-4">
              <div>
                <label className="text-sm font-medium text-gray-700">
                  Health Check URL
                </label>
                <input
                  type="text"
                  name="health_check_url"
                  value={form.health_check_url}
                  onChange={handleChange}
                  className={`mt-1 w-full ${tw.rounded} border border-gray-200 px-3 py-2 text-sm focus:border-gray-400 focus:outline-none`}
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">
                  Interval (seconds)
                </label>
                <input
                  type="number"
                  name="health_check_interval_seconds"
                  value={form.health_check_interval_seconds}
                  onChange={handleChange}
                  className={`mt-1 w-full ${tw.rounded} border border-gray-200 px-3 py-2 text-sm focus:border-gray-400 focus:outline-none`}
                />
              </div>
            </div>
          )}
        </div>

        <div
          className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm`}
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Circuit Breaker
              </h2>
              <p className="text-xs text-gray-500 mt-1">
                Pause calls after repeated failures.
              </p>
            </div>
            <label className="inline-flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                name="circuit_breaker_enabled"
                checked={form.circuit_breaker_enabled}
                onChange={handleChange}
                className="h-4 w-4 rounded border-gray-300 text-black focus:ring-black"
              />
              Enabled
            </label>
          </div>

          {form.circuit_breaker_enabled && (
            <div className="mt-4">
              <label className="text-sm font-medium text-gray-700">
                Failure Threshold
              </label>
              <input
                type="number"
                name="circuit_breaker_threshold"
                value={form.circuit_breaker_threshold}
                onChange={handleChange}
                className={`mt-1 w-full ${tw.rounded} border border-gray-200 px-3 py-2 text-sm focus:border-gray-400 focus:outline-none`}
              />
            </div>
          )}
        </div>

        <div
          className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm`}
        >
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Advanced Settings
          </h2>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700">
                Metadata
              </label>
              <p className="text-xs text-gray-500 mb-1">
                Additional metadata as JSON (e.g. &#x7B;&quot;key&quot;: &quot;value&quot;&#x7D;).
              </p>
              <textarea
                name="metadata"
                value={form.metadata}
                onChange={handleChange}
                className={`w-full ${tw.rounded} border border-gray-200 px-3 py-2 text-sm focus:border-gray-400 focus:outline-none font-mono`}
                rows={3}
                placeholder='{"key": "value"}'
              />
            </div>
          </div>
        </div>

        <div
          className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm`}
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">TLS</h2>
              <p className="text-xs text-gray-500 mt-1">
                Require secure transport for requests.
              </p>
            </div>
            <label className="inline-flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                name="tls_enabled"
                checked={form.tls_enabled}
                onChange={handleChange}
                className="h-4 w-4 rounded border-gray-300 text-black focus:ring-black"
              />
              Enabled
            </label>
          </div>

          <div className="mt-4">
            <label className="text-sm font-medium text-gray-700">
              Authentication Type
            </label>
            <input
              type="text"
              name="authentication_type"
              value={form.authentication_type}
              onChange={handleChange}
              className={`mt-1 w-full ${tw.rounded} border border-gray-200 px-3 py-2 text-sm focus:border-gray-400 focus:outline-none`}
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-gray-200 pt-4">
          <button
            type="button"
            onClick={() =>
              navigateBackOrFallback(navigate, "/dashboard/servers")
            }
            className={`${tw.rounded} border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50`}
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            className={`${tw.button} inline-flex items-center gap-2 px-6 py-2 text-sm`}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {mode === "create" ? "Creating..." : "Updating..."}
              </>
            ) : (
              `${mode === "create" ? "Create" : "Update"} Server`
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
