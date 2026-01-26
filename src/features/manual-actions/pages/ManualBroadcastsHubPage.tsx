import { useNavigate } from "react-router-dom";
import { Mail, Gift, ArrowLeft } from "lucide-react";
import { color, tw } from "../../../shared/utils/utils";
import { navigateBackOrFallback } from "../../../shared/utils/navigation";
import { useLanguage } from "../../../contexts/LanguageContext";

export default function ManualBroadcastsHubPage() {
  const navigate = useNavigate();
  const { t } = useLanguage();

  const actions = [
    {
      title: t.manualActions.manualCommunications,
      description: t.manualActions.sendTargetedMessages,
      icon: Mail,
      onClick: () => navigate("/dashboard/manual-communications"),
    },
    {
      title: t.manualActions.manualRewards,
      description: t.manualActions.distributeRewards,
      icon: Gift,
      onClick: () => navigate("/dashboard/manual-rewards"),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center space-x-2 sm:space-x-4">
          <button
            onClick={() => navigateBackOrFallback(navigate, "/dashboard")}
            className={`p-2 text-gray-600 hover:text-gray-800 ${tw.rounded} transition-colors`}
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className={`text-xl sm:text-2xl font-bold ${tw.textPrimary}`}>
              {t.manualActions.manualBroadcasts}
            </h1>
            <p className={`${tw.textSecondary} mt-2 text-sm`}>
              {t.manualActions.chooseAction}
            </p>
          </div>
        </div>
      </div>

      {/* Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <div
              key={action.title}
              onClick={action.onClick}
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
                <Icon
                  className="w-8 h-8 flex-shrink-0"
                  style={{ color: color.primary.action }}
                />
                <div className="flex-1">
                  <h3
                    className={`text-lg font-semibold ${tw.textPrimary} mb-1`}
                  >
                    {action.title}
                  </h3>
                  <p className={`text-sm ${tw.textSecondary}`}>
                    {action.description}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
