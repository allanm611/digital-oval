import { useNavigate } from "react-router-dom";
import { Mail, Gift, Send, Zap } from "lucide-react";
import { color, tw } from "../../../shared/utils/utils";
import { useLanguage } from "../../../contexts/LanguageContext";

export default function ManualBroadcastsHubPage() {
  const navigate = useNavigate();
  const { t } = useLanguage() as { t: { manualActions: { manualCommunications: string; sendTargetedMessages: string; manualRewards: string; distributeRewards: string; manualBroadcasts: string; chooseAction: string } } };

  const actions = [
    {
      title: t.manualActions.manualCommunications,
      description: t.manualActions.sendTargetedMessages,
      icon: Mail,
      onClick: () => navigate("/dashboard/manual-communications", {
        state: { returnTo: { pathname: "/dashboard/manual-broadcasts" } }
      }),
    },
    {
      title: t.manualActions.manualRewards,
      description: t.manualActions.distributeRewards,
      icon: Gift,
      onClick: () => navigate("/dashboard/manual-rewards"),
    },
    {
      title: "SMS Test",
      description: "Test the SMS endpoint by sending a test message",
      icon: Send,
      onClick: () => navigate("/dashboard/sms-test"),
    },
    {
      title: "Manual Rewards Test",
      description: "Test reward distribution",
      icon: Zap,
      onClick: () => navigate("/dashboard/manual-rewards-test"),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className={`text-xl sm:text-2xl font-bold ${tw.textPrimary}`}>
          {t.manualActions.manualBroadcasts}
        </h1>
        <p className={`${tw.textSecondary} mt-2 text-sm`}>
          {t.manualActions.chooseAction}
        </p>
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
