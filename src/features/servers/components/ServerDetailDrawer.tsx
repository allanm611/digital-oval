import { X, ShieldCheck, AlertTriangle, Activity } from "lucide-react";
import { ServerType } from "../types/server";
import { color, tw } from "../../../shared/utils/utils";

type ServerDetailDrawerProps = {
  server: ServerType | null;
  onClose: () => void;
};

const InfoRow = ({
  label,
  value,
}: {
  label: string;
  value: string | number | null | undefined;
}) => (
  <div className="flex flex-col gap-1">
    <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
      {label}
    </span>
    <span className={`text-sm ${tw.textPrimary}`}>
      {value === undefined || value === null || value === ""
        ? "—"
        : (value as string)}
    </span>
  </div>
);

export default function ServerDetailDrawer({
  server,
  onClose,
}: ServerDetailDrawerProps) {
  if (!server) return null;

  const endpoint = `${server.protocol}://${server.host}${
    server.port ? `:${server.port}` : ""
  }${server.base_path || ""}`;

  const metadataEntries = Object.entries(server.metadata || {});

  return (
    <div className="fixed inset-0 z-50 flex">
      <div
        className="flex-1 bg-black/30"
        onClick={onClose}
        role="presentation"
      />
      <div className="w-full max-w-xl bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b border-gray-200 px-6 py-5">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-gray-400">
              Server
            </p>
            <h2 className="text-2xl font-semibold text-gray-900">
              {server.name}
            </h2>
            <p className="mt-1 text-sm text-gray-500">Code: {server.code}</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-gray-500 hover:bg-gray-100"
            aria-label="Close server details"
          >
            <X size={20} />
          </button>
        </div>

        <div className="space-y-8 px-6 py-6 overflow-y-auto max-h-[calc(100vh-120px)]">
          <section className="space-y-4">
            <p className="text-sm font-semibold uppercase tracking-wide text-gray-400">
              Connection
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <InfoRow label="Environment" value={server.environment} />
              <InfoRow label="Region" value={server.region} />
              <InfoRow label="Protocol" value={server.protocol} />
              <InfoRow label="Endpoint" value={endpoint.replace(/\/+$/, "")} />
              <InfoRow
                label="Timeout (s)"
                value={server.timeout_seconds?.toString()}
              />
              <InfoRow
                label="Max Retries"
                value={server.max_retries?.toString()}
              />
            </div>
          </section>

          <section className="space-y-4">
            <div className="flex items-center gap-2">
              {server.health_check_enabled ? (
                <ShieldCheck
                  size={18}
                  style={{ color: color.status.success }}
                />
              ) : (
                <AlertTriangle
                  size={18}
                  style={{ color: color.status.warning }}
                />
              )}
              <p className="text-sm font-semibold uppercase tracking-wide text-gray-400">
                Health Monitoring
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <InfoRow
                label="Health Checks"
                value={server.health_check_enabled ? "Enabled" : "Disabled"}
              />
              <InfoRow
                label="Health Check URL"
                value={server.health_check_url}
              />
              <InfoRow
                label="Last Status"
                value={server.last_health_check_status}
              />
              <InfoRow
                label="Last Checked At"
                value={
                  server.last_health_check_at
                    ? new Date(server.last_health_check_at).toLocaleString()
                    : null
                }
              />
              <InfoRow
                label="Failures"
                value={server.consecutive_health_failures?.toString()}
              />
              <InfoRow
                label="Interval (s)"
                value={server.health_check_interval_seconds?.toString()}
              />
            </div>
          </section>

          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <Activity size={18} style={{ color: color.status.info }} />
              <p className="text-sm font-semibold uppercase tracking-wide text-gray-400">
                Status & Controls
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <InfoRow label="Active" value={server.is_active ? "Yes" : "No"} />
              <InfoRow
                label="Deprecated"
                value={server.is_deprecated ? "Yes" : "No"}
              />
              <InfoRow
                label="Circuit Breaker"
                value={server.circuit_breaker_enabled ? "Enabled" : "Disabled"}
              />
              <InfoRow
                label="Circuit Threshold"
                value={server.circuit_breaker_threshold?.toString()}
              />
              <InfoRow
                label="TLS"
                value={server.tls_enabled ? "Enabled" : "Disabled"}
              />
              <InfoRow label="Auth Type" value={server.authentication_type} />
            </div>
          </section>

          {metadataEntries.length > 0 && (
            <section className="space-y-2">
              <p className="text-sm font-semibold uppercase tracking-wide text-gray-400">
                Metadata
              </p>
              <div className={`space-y-3 ${tw.rounded} border border-gray-200 bg-gray-50 p-4`}>
                {metadataEntries.map(([key, value]) => (
                  <div
                    key={key}
                    className={`flex flex-col gap-1 ${tw.rounded} bg-white p-3 text-sm`}
                  >
                    <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                      {key}
                    </span>
                    <span className={`${tw.textPrimary}`}>
                      {typeof value === "object"
                        ? JSON.stringify(value, null, 2)
                        : String(value)}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
