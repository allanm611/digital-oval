import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { color, tw } from "../../../shared/utils/utils";
import { navigateBackOrFallback } from "../../../shared/utils/navigation";
import { COMMUNICATION_CHANNELS } from "../types/communicationPolicyConfig";

export default function DNDManagementPage() {
  const navigate = useNavigate();

  const handleChannelClick = (channel: string) => {
    navigate(`/dashboard/dnd-management/${channel.toLowerCase()}`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center space-x-2 sm:space-x-4">
          <button
            onClick={() =>
              navigateBackOrFallback(navigate, "/dashboard/configuration")
            }
            className="p-2 text-gray-600 hover:text-gray-800 rounded-md transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className={`text-xl sm:text-2xl font-bold ${tw.textPrimary}`}>
              DND Management
            </h1>
            <p className={`${tw.textSecondary} mt-2 text-sm`}>
              Select a communication channel to manage Do Not Disturb
              subscriptions
            </p>
          </div>
        </div>
      </div>

      {/* Channel Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {COMMUNICATION_CHANNELS.map((channel) => (
          <div
            key={channel.value}
            onClick={() => handleChannelClick(channel.value)}
            className="cursor-pointer rounded-lg border p-6 hover:shadow-lg transition-all duration-200"
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
