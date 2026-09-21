import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Edit, Eye, Trash2 } from "lucide-react";
import { color, tw } from "../../../shared/utils/utils";
import BackButton from "../../../shared/components/ui/BackButton";
import LoadingSpinner from "../../../shared/components/ui/LoadingSpinner";
import DeleteConfirmModal from "../../../shared/components/ui/DeleteConfirmModal";
import { useToast } from "../../../contexts/ToastContext";
import { extractBackendError } from "../../../shared/utils/errorHandler";
import { AI_MODEL_PROVIDERS } from "../constants/aiModelProviders";
import { aiModelConfigurationService } from "../services/aiModelConfigurationService";
import type { AiModelConfiguration } from "../types/aiModelConfiguration";
import {
  AI_MODELS_HUB_PATH,
  aiModelEditPath,
  aiModelViewPath,
} from "../utils/aiModelNavigation";

function statusLabel(config: AiModelConfiguration | undefined): string {
  if (!config) return "Not configured";
  if (config.source === "environment") {
    return config.is_default
      ? `Server default · ${config.model}`
      : `Server env · ${config.model}`;
  }
  if (!config.is_active) return `Inactive · ${config.model || "no model"}`;
  if (config.is_default) return `Default · ${config.model}`;
  return `Configured · ${config.model}`;
}

function statusTone(config: AiModelConfiguration | undefined): string {
  if (!config) return "text-gray-500";
  if (!config.is_active) return "text-amber-700";
  if (config.source === "environment" || config.is_default) return "text-blue-700";
  return "text-emerald-700";
}

export default function AiModelConfigurationHubPage() {
  const navigate = useNavigate();
  const { success, error: showError } = useToast();
  const [configs, setConfigs] = useState<AiModelConfiguration[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<{
    providerId: AiModelConfiguration["provider_id"];
    name: string;
  } | null>(null);

  useEffect(() => {
    loadConfigs();
  }, []);

  const loadConfigs = async () => {
    try {
      setLoading(true);
      setLoadError("");
      const data = await aiModelConfigurationService.list();
      setConfigs(data);
    } catch (err) {
      const message = extractBackendError(
        err,
        "Failed to load AI model configurations",
      );
      setLoadError(message);
      setConfigs([]);
      showError("Error", message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      await aiModelConfigurationService.delete(pendingDelete.providerId);
      success("Deleted", `${pendingDelete.name} configuration was removed`);
      setPendingDelete(null);
      await loadConfigs();
    } catch (err) {
      showError(
        "Error",
        extractBackendError(err, "Failed to delete AI model configuration"),
      );
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <BackButton
        showBreadcrumb={true}
        currentLabel="AI Model Configuration"
        parentLabel="AI Models"
        parentTo={AI_MODELS_HUB_PATH}
      />

      <p className={`text-sm ${tw.textPrimary}`}>
        Select an AI provider to configure credentials and generation defaults.
        Saved models appear when generating offer message content. View, Edit, and
        Delete appear after a provider is saved.
      </p>

      {loadError && !loading && (
        <div className={`${tw.rounded} border border-red-200 bg-red-50 px-4 py-3`}>
          <p className="text-sm text-red-800">{loadError}</p>
          <button
            type="button"
            onClick={() => void loadConfigs()}
            className="mt-2 text-sm font-medium underline"
            style={{ color: "var(--c-interactive-link)" }}
          >
            Retry
          </button>
        </div>
      )}

      {!loading && !loadError && configs.some((item) => item.source === "environment") && (
        <div className={`${tw.rounded} border border-blue-200 bg-blue-50 px-4 py-3`}>
          <p className="text-sm text-blue-900">
            Gemini is active from the server environment because it is not saved in the
            database yet. Use View to inspect those values, then Edit and Save if you
            want an admin-owned copy.
          </p>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner variant="modern" size="md" color="primary" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {AI_MODEL_PROVIDERS.map((provider) => {
            const config = configs.find((item) => item.provider_id === provider.id);
            const isConfigured = Boolean(config);
            const canDelete = isConfigured && config?.source !== "environment";
            return (
              <div
                key={provider.id}
                onClick={() =>
                  navigate(
                    isConfigured
                      ? aiModelViewPath(provider.id)
                      : aiModelEditPath(provider.id),
                  )
                }
                className={`cursor-pointer ${tw.rounded} border p-6 hover:shadow-lg transition-all duration-200`}
                style={{
                  backgroundColor: color.surface.background,
                  borderColor: color.border.default,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = color.border.accent;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = color.border.default;
                }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <h3 className={`text-sm font-semibold ${tw.textPrimary}`}>
                      {provider.name}
                    </h3>
                    <p className={`text-sm mt-1 truncate ${statusTone(config)}`}>
                      {statusLabel(config)}
                    </p>
                  </div>
                  {isConfigured ? (
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        className={`p-1 icon-edit ${tw.rounded} transition-all duration-200`}
                        title="View configuration"
                        aria-label={`View ${provider.name} configuration`}
                        onClick={(event) => {
                          event.stopPropagation();
                          navigate(aiModelViewPath(provider.id));
                        }}
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        className={`p-1 icon-edit ${tw.rounded} transition-all duration-200`}
                        title="Edit configuration"
                        aria-label={`Edit ${provider.name} configuration`}
                        onClick={(event) => {
                          event.stopPropagation();
                          navigate(aiModelEditPath(provider.id));
                        }}
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      {canDelete ? (
                        <button
                          type="button"
                          className={`p-1 icon-delete ${tw.rounded} transition-all duration-200`}
                          title="Delete configuration"
                          aria-label={`Delete ${provider.name} configuration`}
                          onClick={(event) => {
                            event.stopPropagation();
                            setPendingDelete({
                              providerId: provider.id,
                              name: config?.name || provider.name,
                            });
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <DeleteConfirmModal
        isOpen={Boolean(pendingDelete)}
        onClose={() => {
          if (!deleting) setPendingDelete(null);
        }}
        onConfirm={() => void handleDelete()}
        title="Remove AI model"
        description="This provider will no longer appear when generating message content. You can configure it again later."
        itemName={pendingDelete?.name}
        isLoading={deleting}
      />
    </div>
  );
}
