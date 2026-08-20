import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Edit, Trash2, Plug } from "lucide-react";
import BackButton from "../../../shared/components/ui/BackButton";
import { useToast } from "../../../contexts/ToastContext";
import { extractBackendError } from "../../../shared/utils/errorHandler";
import { color, tw, button } from "../../../shared/utils/utils";
import { gatewayConfigurationService } from "../services/gatewayConfigurationService";
import { GatewayConfiguration } from "../types/gatewayConfiguration";
import {
  gatewayProtocolLabel,
  resolveGatewayProtocol,
} from "../constants/gatewayProtocol";
import LoadingSpinner from "../../../shared/components/ui/LoadingSpinner";
import DateFormatter from "../../../shared/components/DateFormatter";
import ActivateDeactivateButton from "../../../shared/components/ui/ActivateDeactivateButton";
import DeleteConfirmModal from "../../../shared/components/ui/DeleteConfirmModal";

function isSensitiveKey(key: string): boolean {
  const lower = key.toLowerCase();
  return (
    lower.includes("password") ||
    lower.includes("secret") ||
    lower.includes("token") ||
    lower.includes("api_key") ||
    lower.includes("apikey")
  );
}

function maskValue(value: unknown): string {
  const str = String(value ?? "");
  if (!str) return "—";
  if (str.length <= 4) return "••••";
  return `${str.slice(0, 2)}${"•".repeat(Math.min(str.length - 2, 8))}`;
}

export default function GatewayConfigDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { success: showSuccess, error: showError } = useToast();

  const [loading, setLoading] = useState(true);
  const [config, setConfig] = useState<GatewayConfiguration | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    loadConfig();
  }, [id]);

  const loadConfig = async () => {
    try {
      setLoading(true);
      if (!id) return;
      const found = await gatewayConfigurationService.getById(Number(id));
      setConfig(found);
    } catch (err) {
      showError(
        extractBackendError(
          err,
          "Failed to load configuration. Please try again.",
        ),
      );
      navigate("/dashboard/gateway-configurations");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async () => {
    if (!config) return;
    const newActive = !(config.is_active !== false);
    setToggling(true);
    setConfig((prev) => (prev ? { ...prev, is_active: newActive } : prev));
    try {
      await gatewayConfigurationService.update(config.id, {
        is_active: newActive,
      });
      showSuccess(
        newActive ? "Activated" : "Deactivated",
        newActive
          ? `${config.name} has been activated`
          : `${config.name} has been deactivated`,
      );
    } catch (err) {
      setConfig((prev) =>
        prev ? { ...prev, is_active: !newActive } : prev,
      );
      showError(
        extractBackendError(
          err,
          "Failed to update configuration status. Please try again.",
        ),
      );
    } finally {
      setToggling(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!config) return;
    try {
      setDeleting(true);
      await gatewayConfigurationService.delete(config.id);
      showSuccess(`"${config.name}" has been deleted successfully.`);
      navigate("/dashboard/gateway-configurations");
    } catch (err) {
      showError(
        extractBackendError(
          err,
          "Failed to delete gateway configuration. Please try again.",
        ),
      );
    } finally {
      setDeleting(false);
      setShowDeleteModal(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <LoadingSpinner variant="modern" size="xl" color="primary" />
        <p className={`${tw.textMuted} font-medium mt-4`}>
          Loading configuration...
        </p>
      </div>
    );
  }

  if (!config) return null;

  const schemaFields = config.field_schema?.fields || [];
  const configEntries = Object.entries(config.config || {});
  const protocol = resolveGatewayProtocol({
    protocol: config.field_schema?.protocol,
    field_schema: config.field_schema,
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div className="flex items-center space-x-2 sm:space-x-4">
          <BackButton
            showBreadcrumb={true}
            currentLabel="Gateway Configuration Details"
          />
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <ActivateDeactivateButton
            isActive={config.is_active !== false}
            isLoading={toggling}
            onToggle={handleToggleActive}
          >
            {config.is_active !== false ? "Deactivate" : "Activate"}
          </ActivateDeactivateButton>
          <button
            onClick={() =>
              navigate(`/dashboard/gateway-configurations/${config.id}/edit`)
            }
            className={`px-4 py-2 text-white text-xs ${tw.rounded} font-semibold transition-all duration-200 flex items-center gap-2 w-fit`}
            style={{ backgroundColor: color.primary.action }}
          >
            <Edit className="w-4 h-4" />
            Edit
          </button>
          <button
            onClick={() => setShowDeleteModal(true)}
            className={`${tw.rounded} font-semibold transition-all duration-200 flex items-center gap-2 text-xs w-fit`}
            style={{
              backgroundColor: button.delete.background,
              color: button.delete.color,
              border: button.delete.border,
              padding: `${button.delete.paddingY} ${button.delete.paddingX}`,
              borderRadius: button.delete.borderRadius,
              fontSize: button.delete.fontSize,
            }}
          >
            <Trash2 className="w-4 h-4" />
            Delete
          </button>
        </div>
      </div>

      <div className={`bg-white ${tw.rounded} border border-gray-200 p-6`}>
        <div className="flex items-start space-x-4 mb-6">
          <div
            className={`h-14 w-14 ${tw.rounded} flex items-center justify-center flex-shrink-0`}
            style={{ backgroundColor: color.primary.accent }}
          >
            <Plug className="w-7 h-7 text-white" />
          </div>
          <div className="flex-1">
            <h2 className={`text-sm font-semibold ${tw.textPrimary} mb-2`}>
              {config.name}
            </h2>
            <p className={`text-sm ${tw.textSecondary}`}>
              Linked to provider{" "}
              {config.provider_name || `#${config.provider_id}`}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-1">
            <label
              className={`text-xs font-medium ${tw.textMuted} uppercase tracking-wide`}
            >
              Configuration Name
            </label>
            <p className={`text-sm ${tw.textPrimary}`}>{config.name}</p>
          </div>
          <div className="space-y-1">
            <label
              className={`text-xs font-medium ${tw.textMuted} uppercase tracking-wide`}
            >
              Communication Channel
            </label>
            <p className={`text-sm ${tw.textPrimary}`}>
              {config.channel_label ||
                config.channel_value ||
                (config.channel_id != null
                  ? `Channel #${config.channel_id}`
                  : "—")}
            </p>
          </div>
          <div className="space-y-1">
            <label
              className={`text-xs font-medium ${tw.textMuted} uppercase tracking-wide`}
            >
              Provider
            </label>
            <p className={`text-sm ${tw.textPrimary}`}>
              {config.provider_name || `#${config.provider_id}`}
            </p>
          </div>
          <div className="space-y-1">
            <label
              className={`text-xs font-medium ${tw.textMuted} uppercase tracking-wide`}
            >
              Protocol
            </label>
            <p className={`text-sm ${tw.textPrimary}`}>
              {protocol ? gatewayProtocolLabel(protocol) : "—"}
            </p>
          </div>
          <div className="space-y-1">
            <label
              className={`text-xs font-medium ${tw.textMuted} uppercase tracking-wide`}
            >
              Status
            </label>
            <p
              className={`text-sm font-medium ${
                config.is_active !== false ? tw.success : tw.textMuted
              }`}
            >
              {config.is_active !== false ? "Active" : "Inactive"}
            </p>
          </div>
          <div className="space-y-1">
            <label
              className={`text-xs font-medium ${tw.textMuted} uppercase tracking-wide`}
            >
              Created
            </label>
            <p className={`text-sm ${tw.textPrimary}`}>
              {config.created_at ? (
                <DateFormatter
                  date={config.created_at}
                  useUserTimezone
                  includeTime
                />
              ) : (
                "—"
              )}
            </p>
          </div>
          <div className="space-y-1">
            <label
              className={`text-xs font-medium ${tw.textMuted} uppercase tracking-wide`}
            >
              Last Updated
            </label>
            <p className={`text-sm ${tw.textPrimary}`}>
              {config.updated_at ? (
                <DateFormatter
                  date={config.updated_at}
                  useUserTimezone
                  includeTime
                />
              ) : (
                "—"
              )}
            </p>
          </div>
        </div>
      </div>

      <div className={`bg-white ${tw.rounded} border border-gray-200 p-6`}>
        <h2 className={`text-sm font-semibold ${tw.textPrimary} mb-6`}>
          Credentials
        </h2>
        {configEntries.length === 0 ? (
          <p className={`text-sm ${tw.textMuted}`}>No credentials configured.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {configEntries.map(([key, value]) => {
              const schemaField = schemaFields.find((f) => f.name === key);
              const label = schemaField?.label || key.replace(/_/g, " ");
              const sensitive =
                schemaField?.type === "password" || isSensitiveKey(key);

              let displayValue: string;
              if (typeof value === "boolean") {
                displayValue = value ? "Yes" : "No";
              } else if (sensitive) {
                displayValue = maskValue(value);
              } else {
                const strValue = String(value ?? "");
                displayValue =
                  strValue.length > 60
                    ? `${strValue.substring(0, 57)}...`
                    : strValue || "—";
              }

              return (
                <div key={key} className="space-y-1">
                  <label
                    className={`text-xs font-medium ${tw.textMuted} uppercase tracking-wide`}
                  >
                    {label}
                  </label>
                  <p className={`text-sm ${tw.textPrimary} break-words`}>
                    {displayValue}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <DeleteConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Gateway Configuration"
        description="This action cannot be undone and may affect message delivery."
        itemName={config.name}
        isLoading={deleting}
      />
    </div>
  );
}
