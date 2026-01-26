import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ShieldCheck,
  AlertTriangle,
  Activity,
  Pencil,
  HeartPulse,
  Loader2,
  Power,
  Archive,
  Zap,
  RotateCcw,
  Upload,
  MoreVertical,
} from "lucide-react";
import { serverService } from "../services/serverService";
import { ServerType } from "../types/server";
import LoadingSpinner from "../../../shared/components/ui/LoadingSpinner";
import HeadlessSelect from "../../../shared/components/ui/HeadlessSelect";
import BackButton from "../../../shared/components/ui/BackButton";
import { useToast } from "../../../contexts/ToastContext";
import { useConfirm } from "../../../contexts/ConfirmContext";
import { useAuth } from "../../../contexts/AuthContext";
import { useLanguage } from "../../../contexts/LanguageContext";
import { color, tw, button } from "../../../shared/utils/utils";
import { navigateBackOrFallback } from "../../../shared/utils/navigation";

const InfoRow = ({
  label,
  value,
}: {
  label: string;
  value: string | number | null | undefined;
}) => (
  <div className="flex flex-col gap-1">
    <span className="text-xs font-semibold uppercase tracking-wide text-black">
      {label}
    </span>
    <span className="text-sm text-black">
      {value === undefined || value === null || value === "" ? "—" : value}
    </span>
  </div>
);

export default function ServerDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { error: showError, success } = useToast();
  const { confirm } = useConfirm();
  const { user } = useAuth();
  const { t } = useLanguage();

  const [server, setServer] = useState<ServerType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [actionState, setActionState] = useState<
    | "activate"
    | "deactivate"
    | "health"
    | "deprecate"
    | "circuit-breaker"
    | "reset-health"
    | null
  >(null);
  const [showPushHealthModal, setShowPushHealthModal] = useState(false);
  const [healthResultStatus, setHealthResultStatus] = useState<
    "healthy" | "unhealthy"
  >("healthy");
  const [healthResultDetails, setHealthResultDetails] = useState("");
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const moreMenuRef = useRef<HTMLDivElement>(null);

  const loadServer = useCallback(async () => {
    if (!id) {
      setErrorMessage(t("errors.serverIdMissing"));
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setErrorMessage(null);
      const response = await serverService.getServerById(Number(id));
      setServer(response);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : t("errors.failedLoadServer");
      setErrorMessage(message);
      showError(t("errors.unableLoadServer"), message);
    } finally {
      setIsLoading(false);
    }
  }, [id, showError, t]);

  useEffect(() => {
    loadServer();
  }, [loadServer]);

  // Close more menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        moreMenuRef.current &&
        !moreMenuRef.current.contains(event.target as Node)
      ) {
        setShowMoreMenu(false);
      }
    };

    if (showMoreMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showMoreMenu]);

  const endpoint = useMemo(() => {
    if (!server) return "";
    return `${server.protocol}://${server.host}${
      server.port ? `:${server.port}` : ""
    }${server.base_path || ""}`.replace(/\/+$/, "");
  }, [server]);

  const handleActivationToggle = async () => {
    if (!server) return;
    const action = server.is_active ? "deactivate" : "activate";

    const confirmed = await confirm({
      title: `${action === "activate" ? "Activate" : "Deactivate"} Server`,
      message: `Are you sure you want to ${action} "${server.name}"?`,
      type: action === "activate" ? "success" : "warning",
      confirmText: action === "activate" ? "Activate" : "Deactivate",
      cancelText: "Cancel",
    });

    if (!confirmed) return;

    setActionState(action);
    try {
      if (action === "activate") {
        await serverService.activateServer(server.id);
      } else {
        await serverService.deactivateServer(server.id);
      }
      success(
        `Server ${action === "activate" ? "activated" : "deactivated"}`,
        `${server.name} is now ${
          action === "activate" ? "active" : "inactive"
        }.`
      );
      await loadServer();
    } catch (err) {
      showError(
        `Failed to ${action} server`,
        err instanceof Error ? err.message : "Please try again."
      );
    } finally {
      setActionState(null);
    }
  };

  const handleDeprecationToggle = async () => {
    if (!server) return;
    const nextAction = server.is_deprecated ? "undeprecate" : "deprecate";

    const confirmed = await confirm({
      title: `${nextAction === "deprecate" ? "Deprecate" : "Restore"} Server`,
      message: `Are you sure you want to ${nextAction} "${server.name}"?`,
      type: nextAction === "deprecate" ? "warning" : "info",
      confirmText: nextAction === "deprecate" ? "Deprecate" : "Restore",
      cancelText: "Cancel",
    });

    if (!confirmed) return;

    setActionState("deprecate");
    try {
      if (nextAction === "deprecate") {
        await serverService.deprecateServer(server.id);
      } else {
        await serverService.undeprecateServer(server.id);
      }
      success(
        `Server ${nextAction === "deprecate" ? "deprecated" : "restored"}`,
        nextAction === "deprecate"
          ? `${server.name} will no longer receive new jobs.`
          : `${server.name} is available again.`
      );
      await loadServer();
    } catch (err) {
      showError(
        `Failed to ${nextAction} server`,
        err instanceof Error ? err.message : "Please try again."
      );
    } finally {
      setActionState(null);
    }
  };

  const handleHealthToggle = async () => {
    if (!server) return;
    const action = server.health_check_enabled ? "disable" : "enable";

    const confirmed = await confirm({
      title: `${action === "enable" ? "Enable" : "Disable"} Health Checks`,
      message: `Are you sure you want to ${action} health monitoring for "${server.name}"?`,
      type: action === "enable" ? "success" : "warning",
      confirmText: action === "enable" ? "Enable" : "Disable",
      cancelText: "Cancel",
    });

    if (!confirmed) return;

    setActionState("health");
    try {
      if (action === "enable") {
        await serverService.enableHealthCheck(server.id, {
          healthCheckUrl: server.health_check_url || undefined,
        });
      } else {
        await serverService.disableHealthCheck(server.id);
      }
      success(
        `Health checks ${action === "enable" ? "enabled" : "disabled"}`,
        action === "enable"
          ? `${server.name} will report health automatically.`
          : `${server.name} will no longer be monitored.`
      );
      await loadServer();
    } catch (err) {
      showError(
        `Failed to ${action} health checks`,
        err instanceof Error ? err.message : "Please try again."
      );
    } finally {
      setActionState(null);
    }
  };

  const handleCircuitBreakerToggle = async () => {
    if (!server) return;
    const action = server.circuit_breaker_enabled ? "disable" : "enable";

    const confirmed = await confirm({
      title: `${action === "enable" ? "Enable" : "Disable"} Circuit Breaker`,
      message: `Are you sure you want to ${action} the circuit breaker for "${server.name}"?`,
      type: action === "enable" ? "success" : "warning",
      confirmText: action === "enable" ? "Enable" : "Disable",
      cancelText: "Cancel",
    });

    if (!confirmed) return;

    setActionState("circuit-breaker");
    try {
      if (action === "enable") {
        await serverService.enableCircuitBreaker(server.id);
      } else {
        await serverService.disableCircuitBreaker(server.id);
      }
      success(
        `Circuit breaker ${action === "enable" ? "enabled" : "disabled"}`,
        `Circuit breaker for ${server.name} is now ${
          action === "enable" ? "enabled" : "disabled"
        }.`
      );
      await loadServer();
    } catch (err) {
      showError(
        `Failed to ${action} circuit breaker`,
        err instanceof Error ? err.message : "Please try again."
      );
    } finally {
      setActionState(null);
    }
  };

  const handleResetHealthCheck = async () => {
    if (!server) return;

    const confirmed = await confirm({
      title: "Reset Health Check",
      message: `Are you sure you want to reset the health check state for "${server.name}"?`,
      type: "warning",
      confirmText: "Reset",
      cancelText: "Cancel",
    });

    if (!confirmed) return;

    setActionState("reset-health");
    try {
      await serverService.resetHealthCheck(server.id);
      success(
        "Health check reset",
        `Health check state for ${server.name} has been reset.`
      );
      await loadServer();
    } catch (err) {
      showError(
        "Failed to reset health check",
        err instanceof Error ? err.message : "Please try again."
      );
    } finally {
      setActionState(null);
    }
  };

  const handlePushHealthCheckResult = async () => {
    if (!server) return;

    const confirmed = await confirm({
      title: "Push Health Check Result",
      message: `Push a ${healthResultStatus} health check result for "${server.name}"?`,
      type: healthResultStatus === "healthy" ? "success" : "warning",
      confirmText: "Push",
      cancelText: "Cancel",
    });

    if (!confirmed) return;

    setActionState("reset-health");
    try {
      await serverService.pushHealthCheckResult(server.id, {
        status: healthResultStatus,
        details: healthResultDetails || undefined,
      });
      success(
        "Health check result pushed",
        `${healthResultStatus} status has been recorded for ${server.name}.`
      );
      setShowPushHealthModal(false);
      setHealthResultDetails("");
      await loadServer();
    } catch (err) {
      showError(
        "Failed to push health check result",
        err instanceof Error ? err.message : "Please try again."
      );
    } finally {
      setActionState(null);
    }
  };

  const isActivationLoading =
    actionState === "activate" || actionState === "deactivate";
  const isHealthLoading = actionState === "health";
  const isDeprecationLoading = actionState === "deprecate";
  const isCircuitBreakerLoading = actionState === "circuit-breaker";
  const isResetHealthLoading = actionState === "reset-health";

  const handleEdit = () => {
    if (!id) return;
    navigate(`/dashboard/servers/${id}/edit`);
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center">
        <LoadingSpinner variant="modern" size="lg" color="primary" />
        <p className="mt-3 text-sm text-black">Loading server details…</p>
      </div>
    );
  }

  if (errorMessage || !server) {
    return (
      <div
        className={`${tw.rounded} border border-gray-200 bg-white p-8 text-center shadow-sm`}
      >
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-500">
          <AlertTriangle size={20} />
        </div>
        <h2 className="text-lg font-semibold text-black">
          {t("errors.unableLoadServer")}
        </h2>
        <p className="mt-2 text-sm text-black">
          {errorMessage || t("errors.serverNotFound")}
        </p>
        <button
          onClick={() => navigateBackOrFallback(navigate, "/dashboard/servers")}
          className={`mt-4 inline-flex items-center gap-2 ${tw.rounded} border border-gray-200 px-4 py-2 text-sm font-medium text-black hover:bg-gray-50`}
        >
          <BackButton
            fallbackTo="/dashboard/servers"
            iconSize="w-4 h-4"
            className="p-0 text-black hover:text-black"
          />
          Go back
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <BackButton fallbackTo="/dashboard/servers" iconSize="w-4 h-4" />
        <div className="flex items-center gap-2">
          <button
            onClick={handleActivationToggle}
            disabled={isActivationLoading}
            className={`inline-flex items-center gap-2 ${tw.rounded} text-sm font-medium transition-colors`}
            style={{
              backgroundColor: button.secondaryAction.background,
              color: button.secondaryAction.color,
              border: button.secondaryAction.border,
              padding: `${button.secondaryAction.paddingY} ${button.secondaryAction.paddingX}`,
              borderRadius: button.secondaryAction.borderRadius,
              fontSize: button.secondaryAction.fontSize,
              opacity: isActivationLoading ? 0.6 : 1,
            }}
            title={server.is_active ? "Deactivate server" : "Activate server"}
          >
            {isActivationLoading ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Power size={16} />
            )}
            {server.is_active ? "Deactivate" : "Activate"}
          </button>
          <button
            onClick={handleEdit}
            className={`inline-flex items-center gap-2 ${tw.rounded} px-3 py-2 text-sm font-semibold text-white transition-colors`}
            style={{ backgroundColor: color.primary.action }}
            title="Edit server"
          >
            <Pencil size={16} />
            Edit
          </button>
          {/* More Menu */}
          <div className="relative" ref={moreMenuRef}>
            <button
              onClick={() => setShowMoreMenu(!showMoreMenu)}
              className={`inline-flex items-center gap-2 justify-center ${tw.rounded} border border-gray-200 px-3 py-2 text-sm font-medium text-black hover:bg-gray-50 transition-colors`}
              title="More actions"
            >
              <MoreVertical size={16} />
              <span>More</span>
            </button>
            {showMoreMenu && (
              <div
                className={`absolute right-0 top-full mt-1 w-56 bg-white ${tw.rounded} shadow-lg border border-gray-200 py-1 z-10`}
              >
                <button
                  onClick={() => {
                    handleHealthToggle();
                    setShowMoreMenu(false);
                  }}
                  disabled={isHealthLoading}
                  className={`w-full text-left px-4 py-2 text-sm text-black hover:bg-gray-50 flex items-center gap-2 ${
                    isHealthLoading ? "opacity-60" : ""
                  }`}
                >
                  {isHealthLoading ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <HeartPulse size={16} />
                  )}
                  {server.health_check_enabled
                    ? "Disable Health Checks"
                    : "Enable Health Checks"}
                </button>
                <button
                  onClick={() => {
                    handleDeprecationToggle();
                    setShowMoreMenu(false);
                  }}
                  disabled={isDeprecationLoading}
                  className={`w-full text-left px-4 py-2 text-sm text-black hover:bg-gray-50 flex items-center gap-2 ${
                    isDeprecationLoading ? "opacity-60" : ""
                  }`}
                >
                  {isDeprecationLoading ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Archive size={16} />
                  )}
                  {server.is_deprecated ? "Restore Server" : "Deprecate Server"}
                </button>
                <button
                  onClick={() => {
                    handleCircuitBreakerToggle();
                    setShowMoreMenu(false);
                  }}
                  disabled={isCircuitBreakerLoading}
                  className={`w-full text-left px-4 py-2 text-sm text-black hover:bg-gray-50 flex items-center gap-2 ${
                    isCircuitBreakerLoading ? "opacity-60" : ""
                  }`}
                >
                  {isCircuitBreakerLoading ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Zap size={16} />
                  )}
                  {server.circuit_breaker_enabled
                    ? "Disable Circuit Breaker"
                    : "Enable Circuit Breaker"}
                </button>
                {server.health_check_enabled && (
                  <>
                    <div className="border-t border-gray-200 my-1" />
                    <button
                      onClick={() => {
                        handleResetHealthCheck();
                        setShowMoreMenu(false);
                      }}
                      disabled={isResetHealthLoading}
                      className={`w-full text-left px-4 py-2 text-sm text-black hover:bg-gray-50 flex items-center gap-2 ${
                        isResetHealthLoading ? "opacity-60" : ""
                      }`}
                    >
                      {isResetHealthLoading ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <RotateCcw size={16} />
                      )}
                      Reset Health Check
                    </button>
                    <button
                      onClick={() => {
                        setShowPushHealthModal(true);
                        setShowMoreMenu(false);
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-black hover:bg-gray-50 flex items-center gap-2"
                    >
                      <Upload size={16} />
                      Push Health Result
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <div
        className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm`}
      >
        <div className="flex flex-col gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-black">
              Server
            </p>
            <h1 className="text-2xl font-semibold text-black">{server.name}</h1>
            <p className="text-sm text-black">Code: {server.code}</p>
          </div>
          <div className="flex items-center gap-2">
            <span
              className="inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold text-white"
              style={{
                backgroundColor: color.primary.accent,
              }}
            >
              {server.is_active ? "Active" : "Inactive"}
            </span>
            {server.is_deprecated && (
              <span
                className="inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold text-white"
                style={{
                  backgroundColor: color.primary.accent,
                }}
              >
                Deprecated
              </span>
            )}
          </div>
        </div>

        <div className="mt-6 grid gap-6 md:grid-cols-3">
          <div
            className={`${tw.rounded} border border-gray-100 bg-gray-50/80 p-4`}
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-black">
              Environment
            </p>
            <div className="mt-2 text-black">
              <span className="font-semibold uppercase">
                {server.environment}
              </span>
            </div>
            <p className="mt-1 text-sm text-black">
              Region: {server.region || "—"}
            </p>
          </div>
          <div
            className={`${tw.rounded} border border-gray-100 bg-gray-50/80 p-4`}
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-black">
              Protocol
            </p>
            <div className="mt-2 text-black">
              <span className="font-semibold uppercase">{server.protocol}</span>
            </div>
            <p className="mt-1 text-sm text-black">
              TLS: {server.tls_enabled ? "Enabled" : "Disabled"}
            </p>
          </div>
          <div
            className={`${tw.rounded} border border-gray-100 bg-gray-50/80 p-4`}
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-black">
              Endpoint
            </p>
            <p className="mt-2 font-mono text-xs text-black break-all">
              {endpoint}
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section
          className={`space-y-4 ${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm`}
        >
          <div className="flex items-center gap-2">
            <Activity size={20} style={{ color: color.status.info }} />
            <h2 className="text-base font-semibold text-black">
              Connection & Limits
            </h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <InfoRow label="Host" value={server.host} />
            <InfoRow label="Port" value={server.port?.toString() ?? "—"} />
            <InfoRow
              label="Timeout (seconds)"
              value={server.timeout_seconds?.toString()}
            />
            <InfoRow
              label="Max retries"
              value={server.max_retries?.toString()}
            />
            <InfoRow
              label="Circuit breaker"
              value={server.circuit_breaker_enabled ? "Enabled" : "Disabled"}
            />
            <InfoRow
              label="Circuit threshold"
              value={server.circuit_breaker_threshold?.toString()}
            />
            <InfoRow label="Base path" value={server.base_path} />
            <InfoRow
              label="Authentication type"
              value={server.authentication_type}
            />
          </div>
        </section>

        <section
          className={`space-y-4 ${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm`}
        >
          <div className="flex items-center gap-2">
            {server.health_check_enabled ? (
              <ShieldCheck size={20} style={{ color: color.status.success }} />
            ) : (
              <AlertTriangle
                size={20}
                style={{ color: color.status.warning }}
              />
            )}
            <h2 className="text-base font-semibold text-black">
              Health Monitoring
            </h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <InfoRow
              label="Health checks"
              value={server.health_check_enabled ? "Enabled" : "Disabled"}
            />
            <InfoRow label="Health URL" value={server.health_check_url} />
            <InfoRow
              label="Interval (seconds)"
              value={server.health_check_interval_seconds?.toString()}
            />
            <InfoRow
              label="Last status"
              value={server.last_health_check_status}
            />
            <InfoRow
              label="Last checked"
              value={
                server.last_health_check_at
                  ? new Date(server.last_health_check_at).toLocaleString()
                  : "Never"
              }
            />
            <InfoRow
              label="Consecutive failures"
              value={server.consecutive_health_failures?.toString()}
            />
          </div>
        </section>
      </div>

      {/* Push Health Check Result Modal */}
      {showPushHealthModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div
            className={`w-full max-w-md ${tw.rounded} bg-white p-6 shadow-xl`}
          >
            <h3 className="text-lg font-semibold text-black">
              Push Health Check Result
            </h3>
            <p className="mt-2 text-sm text-black">
              Manually record a health check result for {server.name}
            </p>
            <div className="mt-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Status
                </label>
                <HeadlessSelect
                  options={[
                    { value: "healthy", label: "Healthy" },
                    { value: "unhealthy", label: "Unhealthy" },
                  ]}
                  value={healthResultStatus}
                  onChange={(value) =>
                    setHealthResultStatus(value as "healthy" | "unhealthy")
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-black">
                  Details (optional)
                </label>
                <textarea
                  value={healthResultDetails}
                  onChange={(e) => setHealthResultDetails(e.target.value)}
                  placeholder="Additional details about the health check..."
                  className={`mt-1 w-full ${tw.rounded} border border-gray-200 px-3 py-2 text-sm focus:border-gray-400 focus:outline-none`}
                  rows={3}
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowPushHealthModal(false);
                  setHealthResultDetails("");
                }}
                className={`${tw.rounded} border border-gray-200 px-4 py-2 text-sm font-medium text-black hover:bg-gray-50`}
              >
                Cancel
              </button>
              <button
                onClick={handlePushHealthCheckResult}
                disabled={isResetHealthLoading}
                className={`${tw.rounded} bg-black px-4 py-2 text-sm font-semibold text-white disabled:opacity-50`}
              >
                {isResetHealthLoading ? "Pushing..." : "Push Result"}
              </button>
            </div>
          </div>
        </div>
      )}

      {server.metadata && Object.keys(server.metadata).length > 0 && (
        <section
          className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm`}
        >
          <h2 className="text-base font-semibold text-black">Metadata</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {Object.entries(server.metadata).map(([key, value]) => (
              <div
                key={key}
                className={`${tw.rounded} border border-gray-100 bg-gray-50 p-4 text-sm`}
              >
                <p className="text-xs font-semibold uppercase tracking-wide text-black">
                  {key}
                </p>
                <p className="mt-1 text-black">
                  {typeof value === "object"
                    ? JSON.stringify(value, null, 2)
                    : String(value)}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
