import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { Copy, Edit, Gift, Trash2 } from "lucide-react";
import BackButton from "../../../shared/components/ui/BackButton";
import { useToast } from "../../../contexts/ToastContext";
import { extractBackendError } from "../../../shared/utils/errorHandler";
import { color, tw, button } from "../../../shared/utils/utils";
import { rewardConfigurationService } from "../services/rewardConfigurationService";
import { rewardProviderService } from "../services/rewardProviderService";
import { RewardConfiguration } from "../types/rewardConfiguration";
import { RewardProviderSchemaField } from "../types/rewardProvider";
import {
  applyProviderDefaultsToTemplate,
  canDuplicateRewardTemplate,
  isDefaultRewardTemplate,
  syncProviderDefaultTemplate,
} from "../utils/rewardTemplateDefaults";
import LoadingSpinner from "../../../shared/components/ui/LoadingSpinner";
import DateFormatter from "../../../shared/components/DateFormatter";
import ActivateDeactivateButton from "../../../shared/components/ui/ActivateDeactivateButton";
import DeleteConfirmModal from "../../../shared/components/ui/DeleteConfirmModal";
import {
  readRewardNavState,
  rewardProviderDetailsPath,
  rewardTemplateDetailsPath,
  rewardTemplateEditPath,
  rewardTemplatesListPath,
} from "../utils/rewardNavigation";

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

function ConfigSection({
  title,
  fields,
  values,
}: {
  title: string;
  fields: RewardProviderSchemaField[];
  values: Record<string, unknown>;
}) {
  const keys = fields.length
    ? [
        ...fields.map((field) => field.name),
        ...Object.keys(values || {}).filter(
          (key) => !fields.some((field) => field.name === key),
        ),
      ]
    : Object.keys(values || {});

  return (
    <div className={`bg-white ${tw.rounded} border border-gray-200 p-6`}>
      <h2 className={`text-sm font-semibold ${tw.textPrimary} mb-6`}>
        {title}
      </h2>
      {keys.length === 0 ? (
        <p className={`text-sm ${tw.textMuted}`}>No values configured.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {keys.map((key) => {
            const value = values?.[key];
            const schemaField = fields.find((f) => f.name === key);
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
  );
}

export default function RewardConfigurationDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { success: showSuccess, error: showError } = useToast();
  const navState = readRewardNavState(location.state);

  const [loading, setLoading] = useState(true);
  const [config, setConfig] = useState<RewardConfiguration | null>(null);
  const [authFields, setAuthFields] = useState<RewardProviderSchemaField[]>(
    [],
  );
  const [payloadFields, setPayloadFields] = useState<
    RewardProviderSchemaField[]
  >([]);
  const [toggling, setToggling] = useState(false);
  const [duplicating, setDuplicating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    loadConfig();
  }, [id]);

  const loadConfig = async () => {
    try {
      setLoading(true);
      if (!id) return;
      const found = await rewardConfigurationService.getById(Number(id));
      let nextConfig = found;

      try {
        const provider = await rewardProviderService.getById(
          found.provider_id,
        );
        setAuthFields(provider.auth_schema?.fields || []);
        setPayloadFields(provider.payload_schema?.fields || []);
        nextConfig = applyProviderDefaultsToTemplate(found, provider);
        if (isDefaultRewardTemplate(found)) {
          void syncProviderDefaultTemplate(provider, found);
        }
      } catch {
        setAuthFields([]);
        setPayloadFields([]);
      }

      setConfig(nextConfig);
    } catch (err) {
      showError(
        extractBackendError(
          err,
          "Failed to load configuration. Please try again.",
        ),
      );
      navigate(
        rewardTemplatesListPath(
          navState?.from === "provider" ? navState.providerId : undefined,
        ),
      );
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async () => {
    if (!config) return;
    const newActive = !(config.is_active !== false);
    if (!newActive && isDefaultRewardTemplate(config)) {
      showError(
        "Default template protected",
        "The provider default template cannot be deactivated.",
      );
      return;
    }
    setToggling(true);
    setConfig((prev) => (prev ? { ...prev, is_active: newActive } : prev));
    try {
      await rewardConfigurationService.update(config.id, {
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

  const handleDuplicate = async () => {
    if (!config) return;
    const eligibility = canDuplicateRewardTemplate(config);
    if (!eligibility.allowed) {
      showError(
        "Cannot duplicate",
        eligibility.reason || "This template cannot be duplicated.",
      );
      return;
    }
    try {
      setDuplicating(true);
      const duplicated = await rewardConfigurationService.duplicate(config.id);
      if (!duplicated.id) {
        throw new Error("Duplicate succeeded but the new template id was missing.");
      }
      showSuccess(
        "Template duplicated",
        `"${duplicated.name}" was created from "${config.name}".`,
      );
      navigate(rewardTemplateDetailsPath(duplicated.id), {
        state: {
          from: navState?.from === "provider" ? "provider" : "list",
          providerId: navState?.providerId ?? config.provider_id,
        },
      });
    } catch (err) {
      showError(
        extractBackendError(
          err,
          "Failed to duplicate reward template. Please try again.",
        ),
      );
    } finally {
      setDuplicating(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!config) return;
    if (isDefaultRewardTemplate(config)) {
      showError(
        "Default template protected",
        "Each reward provider must keep its default template. Duplicate it to create an editable copy.",
      );
      setShowDeleteModal(false);
      return;
    }
    try {
      setDeleting(true);
      await rewardConfigurationService.delete(config.id);
      showSuccess(`"${config.name}" has been deleted successfully.`);
      navigate(
        rewardTemplatesListPath(
          navState?.from === "provider"
            ? navState.providerId ?? config.provider_id
            : undefined,
        ),
      );
    } catch (err) {
      showError(
        extractBackendError(
          err,
          "Failed to delete reward template. Please try again.",
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
          Loading template...
        </p>
      </div>
    );
  }

  if (!config) return null;

  const isDefaultTemplate = isDefaultRewardTemplate(config);
  const duplicateEligibility = canDuplicateRewardTemplate(config);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <BackButton
          showBreadcrumb={true}
          parentLabel="Reward Templates"
          parentTo={rewardTemplatesListPath(
            navState?.from === "provider"
              ? navState.providerId ?? config.provider_id
              : undefined,
          )}
          currentLabel={config.name}
        />

        <div className="flex flex-col sm:flex-row gap-3">
          <ActivateDeactivateButton
            isActive={config.is_active !== false}
            isLoading={toggling}
            onToggle={handleToggleActive}
            disabled={isDefaultTemplate && config.is_active !== false}
          >
            {config.is_active !== false ? "Deactivate" : "Activate"}
          </ActivateDeactivateButton>
          <button
            onClick={() =>
              navigate(rewardTemplateEditPath(config.id), {
                state: {
                  from: "details",
                  parentLabel: config.name,
                  providerId: config.provider_id,
                },
              })
            }
            disabled={isDefaultTemplate}
            title={
              isDefaultTemplate
                ? "Default template cannot be edited. Duplicate it to customise."
                : undefined
            }
            className={`px-4 py-2 text-white text-xs ${tw.rounded} font-semibold transition-all duration-200 flex items-center gap-2 w-fit disabled:opacity-50 disabled:cursor-not-allowed`}
            style={{ backgroundColor: color.primary.action }}
          >
            <Edit className="w-4 h-4" />
            Edit
          </button>
          <button
            onClick={handleDuplicate}
            disabled={!duplicateEligibility.allowed || duplicating}
            title={duplicateEligibility.reason}
            className={`px-4 py-2 text-white text-xs ${tw.rounded} font-semibold transition-all duration-200 flex items-center gap-2 w-fit disabled:opacity-50 disabled:cursor-not-allowed`}
            style={{ backgroundColor: color.primary.action }}
          >
            {duplicating ? (
              <LoadingSpinner size="sm" color="white" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
            {duplicating ? "Duplicating…" : "Duplicate"}
          </button>
          {!isDefaultTemplate ? (
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
          ) : null}
        </div>
      </div>

      <div className={`bg-white ${tw.rounded} border border-gray-200 p-6`}>
        <div className="flex items-start space-x-4 mb-6">
          <div
            className={`h-14 w-14 ${tw.rounded} flex items-center justify-center flex-shrink-0`}
            style={{ backgroundColor: color.primary.accent }}
          >
            <Gift className="w-7 h-7 text-white" />
          </div>
          <div className="flex-1">
            <h2 className={`text-sm font-semibold ${tw.textPrimary} mb-2 flex items-center gap-2`}>
              {config.name}
              {isDefaultTemplate ? (
                <span className="shrink-0 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide rounded bg-emerald-50 text-emerald-800 border border-emerald-100">
                  Default
                </span>
              ) : null}
            </h2>
            <p className={`text-sm ${tw.textSecondary}`}>
              Linked to provider{" "}
              {config.provider_name || `#${config.provider_id}`}
              {config.reward_type ? ` · ${config.reward_type}` : ""}
            </p>
            {isDefaultTemplate ? (
              <p className={`text-xs ${tw.textMuted} mt-2`}>
                This default template is owned by the provider.
              </p>
            ) : null}
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
              Reward Type
            </label>
            <p className={`text-sm font-mono ${tw.textPrimary}`}>
              {config.reward_type || "—"}
            </p>
          </div>
          <div className="space-y-1">
            <label
              className={`text-xs font-medium ${tw.textMuted} uppercase tracking-wide`}
            >
              API Path
            </label>
            <p className={`text-sm font-mono ${tw.textPrimary}`}>
              {config.api_path || "—"}
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

        {config.provider_id && (
          <div className="mt-6 flex flex-wrap gap-4">
            <button
              type="button"
              onClick={() =>
                navigate(rewardProviderDetailsPath(config.provider_id))
              }
              className={`text-sm font-medium underline ${tw.textPrimary}`}
            >
              View reward provider
            </button>
          </div>
        )}
      </div>

      <ConfigSection
        title="Authentication Settings"
        fields={authFields}
        values={(config.auth_config as Record<string, unknown>) || {}}
      />

      <ConfigSection
        title="Payload Settings"
        fields={payloadFields}
        values={(config.payload_config as Record<string, unknown>) || {}}
      />

      {config.request_template &&
        Object.keys(config.request_template).length > 0 && (
          <div className={`bg-white ${tw.rounded} border border-gray-200 p-6`}>
            <h2 className={`text-sm font-semibold ${tw.textPrimary} mb-4`}>
              Request Template Preview
            </h2>
            <p className={`text-xs ${tw.textMuted} mb-4`}>
              Provider template with placeholders resolved at delivery time using
              payload config, subscriber MSISDN, and transaction ID.
            </p>
            <pre
              className={`text-xs font-mono overflow-x-auto p-4 ${tw.rounded} bg-gray-50 border border-gray-200`}
            >
              {JSON.stringify(config.request_template, null, 2)}
            </pre>
          </div>
        )}

      <DeleteConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Reward Template"
        description="This action cannot be undone. Offers and manual rewards that reference this template will be affected."
        itemName={config.name}
        isLoading={deleting}
      />
    </div>
  );
}
