import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { color, tw } from "../../../shared/utils/utils";
import BackButton from "../../../shared/components/ui/BackButton";
import LoadingSpinner from "../../../shared/components/ui/LoadingSpinner";
import { useToast } from "../../../contexts/ToastContext";
import { extractBackendError } from "../../../shared/utils/errorHandler";
import { AI_MODEL_PROVIDERS } from "../constants/aiModelProviders";
import { aiModelConfigurationService } from "../services/aiModelConfigurationService";
import type { AiModelConfiguration } from "../types/aiModelConfiguration";

function statusLabel(config: AiModelConfiguration | undefined): string {
  if (!config) return "Not configured";
  if (!config.is_active) return `Inactive · ${config.model || "no model"}`;
  if (config.is_default) return `Default · ${config.model}`;
  return `Configured · ${config.model}`;
}

export default function AiModelConfigurationHubPage() {
  const navigate = useNavigate();
  const { error: showError } = useToast();
  const [configs, setConfigs] = useState<AiModelConfiguration[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadConfigs();
  }, []);

  const loadConfigs = async () => {
    try {
      setLoading(true);
      const data = await aiModelConfigurationService.list();
      setConfigs(data);
    } catch (err) {
      showError(
        "Error",
        extractBackendError(err, "Failed to load AI model configurations"),
      );
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

      <p className={`text-sm ${tw.textSecondary}`}>
        Select an AI provider to configure credentials and generation defaults.
        Saved models appear when generating offer message content.
      </p>

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
                <div className="flex items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <h3 className={`text-sm font-semibold ${tw.textPrimary}`}>
                      {provider.name}
                    </h3>
                    <p className={`text-xs mt-1 truncate ${tw.textSecondary}`}>
                      {statusLabel(config)}
                    </p>
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
