import { useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import {
  CreateServerPayload,
  ServerEnvironment,
  ServerProtocol,
  ServerType,
} from "../types/server";
import { serverService } from "../services/serverService";
import { useToast } from "../../../contexts/ToastContext";
import { tw, zIndex } from "../../../shared/utils/utils";
import HeadlessSelect from "../../../shared/components/ui/HeadlessSelect";

interface CreateServerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (server: ServerType) => void;
}

const defaultFormValues = {
  name: "",
  code: "",
  protocol: "http" as ServerProtocol,
  host: "",
  environment: "dev" as ServerEnvironment,
  region: "",
  port: "",
  base_path: "",
  timeout_seconds: 30,
  max_retries: 3,
  health_check_enabled: true,
  health_check_url: "",
  health_check_interval_seconds: 300,
  circuit_breaker_enabled: true,
  circuit_breaker_threshold: 5,
  tls_enabled: false,
  authentication_type: "",
};

export default function CreateServerModal({
  isOpen,
  onClose,
  onSuccess,
}: CreateServerModalProps) {
  const { success, error } = useToast();
  const [form, setForm] = useState({ ...defaultFormValues });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  if (!isOpen) {
    return null;
  }

  const handleChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type, checked } = event.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!form.name.trim()) newErrors.name = "Name is required";
    if (!form.code.trim()) newErrors.code = "Code is required";
    if (!form.host.trim()) newErrors.host = "Host is required";
    if (!form.protocol) newErrors.protocol = "Protocol is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!validate()) return;

    const payload: CreateServerPayload = {
      name: form.name.trim(),
      code: form.code.trim(),
      protocol: form.protocol,
      host: form.host.trim(),
      environment: form.environment || undefined,
      region: form.region || undefined,
      port: form.port ? Number(form.port) : undefined,
      base_path: form.base_path || undefined,
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
    };

    setIsSubmitting(true);
    try {
      const newServer = await serverService.createServer(payload);
      success("Server created", `${newServer.name} is now available.`);
      setForm({ ...defaultFormValues });
      onSuccess(newServer);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Unable to create server.";
      error("Failed to create server", message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 flex items-center justify-center bg-black/40 px-4"
      style={{ zIndex: zIndex.modal }}
    >
      <div className={`w-full max-w-2xl ${tw.rounded} bg-white shadow-2xl`}>
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Add Server</h2>
            <p className="text-sm text-gray-500">
              Define the destination endpoint CVM jobs will target.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-gray-500 hover:bg-gray-100"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-6 space-y-6">
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
                value={form.protocol}
                onChange={(value) =>
                  handleChange({
                    target: { name: "protocol", value: value as string },
                  } as React.ChangeEvent<HTMLInputElement>)
                }
                options={["http", "https", "ftp", "sftp", "tcp", "smtp"].map(
                  (protocol) => ({
                    label: protocol.toUpperCase(),
                    value: protocol,
                  })
                )}
                placeholder="Select protocol"
                className="mt-1 w-full"
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
                value={form.environment}
                onChange={(value) =>
                  handleChange({
                    target: { name: "environment", value: value as string },
                  } as React.ChangeEvent<HTMLInputElement>)
                }
                options={[
                  { value: "dev", label: "DEV" },
                  { value: "staging", label: "STAGING" },
                  { value: "production", label: "PRODUCTION" },
                  { value: "dr", label: "DR" },
                ]}
                placeholder="Select environment"
                className="mt-1 w-full"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">
                Region
              </label>
              <input
                type="text"
                name="region"
                value={form.region}
                onChange={handleChange}
                className={`mt-1 w-full ${tw.rounded} border border-gray-200 px-3 py-2 text-sm focus:border-gray-400 focus:outline-none`}
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">Port</label>
              <input
                type="number"
                name="port"
                value={form.port}
                onChange={handleChange}
                className={`mt-1 w-full ${tw.rounded} border border-gray-200 px-3 py-2 text-sm focus:border-gray-400 focus:outline-none`}
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">
                Base Path
              </label>
              <input
                type="text"
                name="base_path"
                value={form.base_path}
                onChange={handleChange}
                className={`mt-1 w-full ${tw.rounded} border border-gray-200 px-3 py-2 text-sm focus:border-gray-400 focus:outline-none`}
              />
            </div>
          </div>

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

          <div className={`space-y-4 ${tw.rounded} border border-gray-100 p-4`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">
                  Health Checks
                </p>
                <p className="text-xs text-gray-500">
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
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
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

          <div className={`space-y-4 ${tw.rounded} border border-gray-100 p-4`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">
                  Circuit Breaker
                </p>
                <p className="text-xs text-gray-500">
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
              <div>
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
            className={`flex items-center justify-between ${tw.rounded} border border-gray-100 p-4`}
          >
            <div>
              <p className="text-sm font-medium text-gray-900">TLS</p>
              <p className="text-xs text-gray-500">
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

          <div>
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

          <div className="flex items-center justify-end gap-3 border-t border-gray-100 pt-4">
            <button
              type="button"
              onClick={onClose}
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
              {isSubmitting ? "Saving..." : "Save Server"}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
