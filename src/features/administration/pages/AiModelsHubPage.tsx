import { useNavigate } from "react-router-dom";
import { ArrowUpRight, FlaskConical, Sparkles } from "lucide-react";
import { color, tw } from "../../../shared/utils/utils";
import BackButton from "../../../shared/components/ui/BackButton";
import {
  AI_MODEL_CONFIGURATION_PATH,
  INSIGHT_WORKBENCH_PATH,
} from "../utils/aiModelNavigation";

export default function AiModelsHubPage() {
  const navigate = useNavigate();
  const sections = [
    {
      title: "AI Model Configuration",
      description:
        "Configure Gemini, ChatGPT, Anthropic, DeepSeek, Grok and other providers used to generate offer content.",
      eyebrow: "Platform providers",
      icon: Sparkles,
      path: AI_MODEL_CONFIGURATION_PATH,
    },
    {
      title: "Insight Workbench",
      description:
        "Explore enterprise data, develop analytical models in Python, R, or Scala, and publish governed insights.",
      eyebrow: "Analytics workspace",
      icon: FlaskConical,
      path: INSIGHT_WORKBENCH_PATH,
    },
  ];

  return (
    <div className="space-y-6">
      <BackButton
        showBreadcrumb={true}
        currentLabel="AI Models"
        parentTo="/dashboard/administration"
      />

      <p className={`max-w-3xl text-sm leading-6 ${tw.textSecondary}`}>
        Configure the AI providers used across the platform or open a governed
        workspace for data exploration, analytical model development, and
        reusable insights.
      </p>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {sections.map((section) => {
          const SectionIcon = section.icon;
          return (
            <button
              key={section.title}
              type="button"
              onClick={() => navigate(section.path)}
              className={`${tw.rounded} group border p-6 text-left transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--c-interactive-focus)]`}
              style={{
                backgroundColor: color.surface.background,
                borderColor: color.border.default,
              }}
            >
              <div className="flex items-start gap-4">
                <div
                  className={`${tw.rounded} flex h-12 w-12 shrink-0 items-center justify-center`}
                  style={{ backgroundColor: color.primary.background }}
                >
                  <SectionIcon
                    className="h-6 w-6"
                    style={{ color: color.primary.accent }}
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className={`text-xs font-medium uppercase tracking-wide ${tw.textMuted}`}>
                        {section.eyebrow}
                      </p>
                      <h2 className={`mt-1 text-lg font-semibold ${tw.textPrimary}`}>
                        {section.title}
                      </h2>
                    </div>
                    <ArrowUpRight
                      className={`h-5 w-5 shrink-0 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 ${tw.textMuted}`}
                    />
                  </div>
                  <p className={`mt-2 text-sm leading-6 ${tw.textSecondary}`}>
                    {section.description}
                  </p>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
