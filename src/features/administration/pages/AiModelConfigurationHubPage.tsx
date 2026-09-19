import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { color, tw } from "../../../shared/utils/utils";
import BackButton from "../../../shared/components/ui/BackButton";
import LoadingSpinner from "../../../shared/components/ui/LoadingSpinner";
import { useToast } from "../../../contexts/ToastContext";
import { extractBackendError } from "../../../shared/utils/errorHandler";
import { AI_MODEL_PROVIDERS } from "../constants/aiModelProviders";
import ProviderDocsLink from "../components/ProviderDocsLink";
import { aiModelConfigurationService } from "../services/aiModelConfigurationService";
import type { AiModelConfiguration } from "../types/aiModelConfiguration";

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
  const { error: showError } = useToast();
  const [configs, setConfigs] = useState<AiModelConfiguration[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

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

  return (
    <div className="space-y-6">
      <BackButton
        showBreadcrumb={true}
        currentLabel="AI Model Configuration"
        parentTo="/dashboard/administration"
      />

      <p className={`text-sm ${tw.textPrimary}`}>
        Select an AI provider to configure credentials and generation defaults.
        Saved models appear when generating offer message content.
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
            database yet. Open the Gemini card to review those values, then Save if you
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
            return (
              <div
                key={provider.id}
                onClick={() => navigate(`/dashboard/ai-models/${provider.id}`)}
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
                <div className="flex items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <h3 className={`text-sm font-semibold ${tw.textPrimary}`}>
                      {provider.name}
                    </h3>
                    <p className={`text-sm mt-1 truncate ${statusTone(config)}`}>
                      {statusLabel(config)}
                    </p>
                    <ProviderDocsLink
                      name={provider.name}
                      href={provider.docsUrl}
                      className="mt-3"
                      onClick={(event) => event.stopPropagation()}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
