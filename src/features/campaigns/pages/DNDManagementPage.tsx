import { useNavigate } from "react-router-dom";
import { color, tw } from "../../../shared/utils/utils";
import { useLanguage } from "../../../contexts/LanguageContext";
import BackButton from "../../../shared/components/ui/BackButton";
import { COMMUNICATION_CHANNELS } from "../types/communicationPolicyConfig";

export default function DNDManagementPage() {
  const navigate = useNavigate();
  const { t } = useLanguage();

  const handleChannelClick = (channel: string) => {
    navigate(`/dashboard/dnd-management/${channel.toLowerCase()}`);
  };

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <BackButton
        fallbackTo="/dashboard/configuration"
        showBreadcrumb={true}
        currentLabel="DND Management"
      />

      {/* Description */}
      <p className={`text-sm ${tw.textSecondary}`}>
        {t.dndManagement.subtitle}
      </p>

      {/* Channel Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {COMMUNICATION_CHANNELS.map((channel) => (
          <div
            key={channel.value}
            onClick={() => handleChannelClick(channel.value)}
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
              <div className="flex-1">
                <h3 className={`text-lg font-semibold ${tw.textPrimary} mb-1`}>
                  {channel.label}
                </h3>
                <p className={`text-sm ${tw.textSecondary}`}>
                  {channel.description}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
