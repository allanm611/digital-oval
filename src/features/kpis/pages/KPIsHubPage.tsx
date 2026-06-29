import { useNavigate } from "react-router-dom";
import { ListChecks, DollarSign, Activity, Zap, Users, Tag } from "lucide-react";
import { color, tw } from "../../../shared/utils/utils";
import { useLanguage } from "../../../contexts/LanguageContext";
import BackButton from "../../../shared/components/ui/BackButton";

export default function KPIsHubPage() {
  const navigate = useNavigate();
  const { t } = useLanguage();

  const cards = [
    {
      title: t.kpis.allKPIs,
      description: t.kpis.descriptions.allKPIs,
      icon: ListChecks,
      onClick: () => navigate("/dashboard/kpis/all"),
    },
    {
      title: t.kpis.categories.title,
      description: t.kpis.descriptions.categories,
      icon: Tag,
      onClick: () => navigate("/dashboard/kpis/kpi-categories"),
    },
    {
      title: t.kpis.revenueMetrics,
      description: t.kpis.descriptions.revenueMetrics,
      icon: DollarSign,
      onClick: () => navigate("/dashboard/kpis/revenue-metrics"),
    },
    {
      title: t.kpis.usageMetrics,
      description: t.kpis.descriptions.usageMetrics,
      icon: Activity,
      onClick: () => navigate("/dashboard/kpis/usage-metrics"),
    },
    {
      title: t.kpis.systemEvents,
      description: t.kpis.descriptions.systemEvents,
      icon: Zap,
      onClick: () => navigate("/dashboard/kpis/system-events"),
    },
    {
      title: t.kpis.categories.subscriberProfile,
      description: t.kpis.descriptions.subscriberProfiles,
      icon: Users,
      onClick: () => navigate("/dashboard/kpis/subscriber-profiles"),
    },
  ];

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4">
          <BackButton

            showBreadcrumb={true}

            currentLabel={t.kpis.title}
          />
          <p className={`${tw.textSecondary} text-sm`}>
            {t.kpis.descriptions.allKPIs}
          </p>
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
                  style={{ color: 'var(--c-icon-color)' }}
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
    </>
  );
}
