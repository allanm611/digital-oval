import { useEffect, useState, type ReactNode } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Edit, Sparkles, Trash2 } from "lucide-react";
import BackButton from "../../../shared/components/ui/BackButton";
import LoadingSpinner from "../../../shared/components/ui/LoadingSpinner";
import ActivateDeactivateButton from "../../../shared/components/ui/ActivateDeactivateButton";
import DeleteConfirmModal from "../../../shared/components/ui/DeleteConfirmModal";
import DateFormatter from "../../../shared/components/DateFormatter";
import { useToast } from "../../../contexts/ToastContext";
import { extractBackendError } from "../../../shared/utils/errorHandler";
import { button, color, tw } from "../../../shared/utils/utils";
import { getAiModelProvider } from "../constants/aiModelProviders";
import { aiModelConfigurationService } from "../services/aiModelConfigurationService";
import type { AiModelConfiguration } from "../types/aiModelConfiguration";
import ProviderDocsLink from "../components/ProviderDocsLink";
import {
  AI_MODEL_CONFIGURATION_PATH,
  aiModelEditPath,
} from "../utils/aiModelNavigation";

function DetailField({
  label,
  value,
}: {
  label: string;
  value?: ReactNode;
}) {
  const display = value === 0 || value === false ? String(value) : value || "—";
  return (
    <div>
      <p className={`text-xs uppercase tracking-wide ${tw.textMuted}`}>{label}</p>
      <p className={`text-sm mt-1 break-words ${tw.textPrimary}`}>{display}</p>
    </div>
  );
}

function sourceLabel(source?: string): string {
  if (source === "environment") return "Server environment";
  if (source === "database") return "Saved configuration";
  return "Saved configuration";
}

export default function AiModelConfigurationDetailsPage() {
  const { providerId } = useParams<{ providerId: string }>();
  const navigate = useNavigate();
  const { success, error: showError } = useToast();
  const catalog = getAiModelProvider(providerId);

  const [loading, setLoading] = useState(true);
  const [config, setConfig] = useState<AiModelConfiguration | null>(null);
  const [toggling, setToggling] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (!catalog) {
      navigate(AI_MODEL_CONFIGURATION_PATH, { replace: true });
      return;
    }
    loadConfig();
  }, [providerId]);

  const loadConfig = async () => {
    if (!catalog) return;
    try {
      setLoading(true);
      const existing = await aiModelConfigurationService.getByProvider(catalog.id);
      if (!existing) {
        navigate(aiModelEditPath(catalog.id), { replace: true });
        return;
      }
      setConfig(existing);
    } catch (err) {
      showError(
        "Error",
        extractBackendError(err, "Failed to load this AI model configuration"),
      );
      navigate(AI_MODEL_CONFIGURATION_PATH);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async () => {
    if (!config) return;
    const nextActive = !config.is_active;
    setToggling(true);
    setConfig((prev) => (prev ? { ...prev, is_active: nextActive } : prev));
    try {
      const saved = await aiModelConfigurationService.setActive(config, nextActive);
      setConfig(saved);
      success(
        nextActive ? "Activated" : "Deactivated",
        `${config.name} is ${nextActive ? "active for message generation" : "inactive and hidden from Generate"}`,
      );
    } catch (err) {
      setConfig((prev) => (prev ? { ...prev, is_active: !nextActive } : prev));
      showError(
        "Error",
        extractBackendError(err, "Failed to update provider status"),
      );
    } finally {
      setToggling(false);
    }
  };

  const handleDelete = async () => {
    if (!config || !catalog) return;
    setDeleting(true);
    try {
      await aiModelConfigurationService.delete(catalog.id);
      success("Deleted", `${config.name} configuration was removed`);
      setConfirmDelete(false);
      navigate(AI_MODEL_CONFIGURATION_PATH);
    } catch (err) {
      showError(
        "Error",
        extractBackendError(err, "Failed to delete AI model configuration"),
      );
    } finally {
      setDeleting(false);
    }
  };

  if (!catalog || loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <LoadingSpinner variant="modern" size="xl" color="primary" />
        <p className={`${tw.textMuted} font-medium mt-4`}>Loading configuration...</p>
      </div>
    );
  }

  if (!config) return null;

  const displayName = config.name || catalog.name;
  const viewTitle = `${displayName}`;
  const canDelete = config.source !== "environment";
  const isActive = config.is_active !== false;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <BackButton
          showBreadcrumb={true}
          currentLabel={viewTitle}
          parentLabel="AI Model Configuration"
          parentTo={AI_MODEL_CONFIGURATION_PATH}
        />
        <div className="flex items-center gap-2">
          <ActivateDeactivateButton
            isActive={isActive}
            isLoading={toggling}
            onToggle={() => void handleToggleActive()}
          >
            {isActive ? "Deactivate" : "Activate"}
          </ActivateDeactivateButton>
          <button
            type="button"
            onClick={() =>
              navigate(aiModelEditPath(catalog.id), {
                state: { from: "details" },
              })
            }
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white rounded-md"
            style={{ backgroundColor: color.primary.action }}
          >
            <Edit className="w-4 h-4" />
            Edit
          </button>
          {canDelete ? (
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
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

      <div className={`${tw.rounded} border p-6 ${tw.borderDefault} bg-[var(--c-surface-card-bg)]`}>
        <div className="flex items-start gap-4 mb-6">
          <div
            className="w-14 h-14 rounded-lg flex items-center justify-center shrink-0"
            style={{ backgroundColor: color.primary.action }}
          >
            <Sparkles className="w-7 h-7 text-white" />
          </div>
          <div className="min-w-0">
            <h1 className={`text-xl font-semibold ${tw.textPrimary}`}>{viewTitle}</h1>
            <p className={`text-sm mt-1 ${tw.textPrimary}`}>
              {catalog.name} · {config.model || "No model"}
              {isActive ? " · Active" : " · Inactive"}
              {config.is_default ? " · Default for generation" : ""}
            </p>
            <p className={`text-sm mt-2 ${tw.textMuted}`}>{catalog.description}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <DetailField label="Display name" value={displayName} />
          <DetailField label="Provider" value={catalog.name} />
          <DetailField label="Model" value={config.model} />
          <DetailField
            label="API key"
            value={
              config.has_api_key
                ? config.api_key_masked || "Saved on server"
                : "Not saved"
            }
          />
          {catalog.supportsBaseUrl ? (
            <DetailField label="Base URL" value={config.base_url} />
          ) : null}
          {catalog.supportsApiVersion ? (
            <DetailField label="API version" value={config.api_version} />
          ) : null}
          {catalog.supportsOrganization ? (
            <DetailField label="Organization" value={config.organization} />
          ) : null}
          {catalog.supportsProjectId ? (
            <DetailField label="Project ID" value={config.project_id} />
          ) : null}
          <DetailField label="Temperature" value={config.temperature} />
          <DetailField label="Max output tokens" value={config.max_output_tokens} />
          <DetailField label="Timeout (ms)" value={config.timeout_ms} />
          <DetailField label="Status" value={isActive ? "Active" : "Inactive"} />
          <DetailField
            label="Default for generation"
            value={config.is_default ? "Yes" : "No"}
          />
          <DetailField label="Source" value={sourceLabel(config.source)} />
          {config.force_ipv4 !== undefined ? (
            <DetailField
              label="Force IPv4 (server)"
              value={config.force_ipv4 ? "Enabled" : "Disabled"}
            />
          ) : null}
          <DetailField
            label="Updated"
            value={
              config.updated_at ? (
                <DateFormatter date={config.updated_at} includeTime useUserTimezone />
              ) : undefined
            }
          />
        </div>

        <div className="mt-6">
          <ProviderDocsLink name={catalog.name} href={catalog.docsUrl} />
        </div>
      </div>

      <DeleteConfirmModal
        isOpen={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={() => void handleDelete()}
        title="Remove AI model"
        description="This provider will no longer appear when generating message content. You can configure it again later."
        itemName={displayName}
        isLoading={deleting}
      />
    </div>
  );
}
