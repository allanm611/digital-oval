import { useNavigate } from "react-router-dom";
import { Sparkles } from "lucide-react";
import { color, tw } from "../../../shared/utils/utils";
import BackButton from "../../../shared/components/ui/BackButton";
import { AI_MODEL_CONFIGURATION_PATH } from "../utils/aiModelNavigation";

export default function AiModelsHubPage() {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <BackButton
        showBreadcrumb={true}
        currentLabel="AI Models"
        parentTo="/dashboard/administration"
      />

      <p className={`text-sm ${tw.textPrimary}`}>
        Manage AI providers used across the platform. Open a subsection to
        configure credentials, defaults, and generation settings.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div
          onClick={() => navigate(AI_MODEL_CONFIGURATION_PATH)}
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
            <Sparkles
              className="w-8 h-8 flex-shrink-0"
              style={{ color: "var(--c-icon-color)" }}
            />
            <div className="flex-1 min-w-0">
              <h3 className={`text-lg font-semibold ${tw.textPrimary} mb-1`}>
                AI Model Configuration
              </h3>
              <p className={`text-sm ${tw.textPrimary}`}>
                Configure Gemini, ChatGPT, Anthropic, DeepSeek, Grok and other
                models used to generate offer message content.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
