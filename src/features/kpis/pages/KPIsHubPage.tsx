import { useNavigate } from "react-router-dom";
import { ListChecks, DollarSign, Activity, Zap, ArrowLeft } from "lucide-react";
import { color, tw } from "../../../shared/utils/utils";
import { navigateBackOrFallback } from "../../../shared/utils/navigation";
import { useLanguage } from "../../../contexts/LanguageContext";

export default function KPIsHubPage() {
  const navigate = useNavigate();
  const { t } = useLanguage();

  const cards = [
    {
      title: "All KPIs",
      description: "View all KPIs across all categories",
      icon: ListChecks,
      onClick: () => navigate("/dashboard/kpis/all"),
    },
    {
      title: "Revenue Metrics",
      description: "Manage and track revenue performance indicators",
      icon: DollarSign,
      onClick: () => navigate("/dashboard/kpis/revenue-metrics"),
    },
    {
      title: "Usage Metrics",
      description: "Monitor customer usage and consumption patterns",
      icon: Activity,
      onClick: () => navigate("/dashboard/kpis/usage-metrics"),
    },
    {
      title: "System Events",
      description: "View platform system events and interactions",
      icon: Zap,
      onClick: () => navigate("/dashboard/kpis/system-events"),
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
              KPIs
            </h1>
            <p className={`${tw.textSecondary} mt-2 text-sm`}>
              Manage and monitor key performance indicators
            </p>
          </div>
        </div>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.title}
              onClick={card.onClick}
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
                    {card.title}
                  </h3>
                  <p className={`text-sm ${tw.textSecondary}`}>
                    {card.description}
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
