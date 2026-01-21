import { useNavigate } from "react-router-dom";
import { Mail, Gift } from "lucide-react";
import { color, tw } from "../../../shared/utils/utils";

export default function ManualBroadcastsHubPage() {
  const navigate = useNavigate();

  const actions = [
    {
      title: "Manual Communications",
      description: "Send targeted messages to your audience",
      icon: Mail,
      onClick: () => navigate("/dashboard/manual-communications"),
    },
    {
      title: "Manual Rewards",
      description: "Distribute rewards to specific customers",
      icon: Gift,
      onClick: () => navigate("/dashboard/manual-rewards"),
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className={`text-xl sm:text-2xl font-bold ${tw.textPrimary}`}>
            Manual Broadcasts
          </h1>
          <p className={`${tw.textSecondary} mt-2 text-sm`}>
            Choose an action to execute
          </p>
        </div>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {actions.map((action) => {
            const Icon = action.icon;
            return (
              <button
                key={action.title}
                onClick={action.onClick}
                className={`cursor-pointer ${tw.rounded} border p-6 hover:shadow-lg transition-all duration-200 text-left`}
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
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
