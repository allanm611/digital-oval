import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { color, tw } from "../../../shared/utils/utils";
import { useLanguage } from "../../../contexts/LanguageContext";
import BackButton from "../../../shared/components/ui/BackButton";
import LoadingSpinner from "../../../shared/components/ui/LoadingSpinner";
import { communicationChannelService, CommunicationChannel } from "../../../shared/services/communicationChannelService";
import { useToast } from "../../../contexts/ToastContext";

export default function DNDManagementPage() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { error: showError } = useToast();
  const [channels, setChannels] = useState<CommunicationChannel[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadChannels();
  }, []);

  const loadChannels = async () => {
    try {
      setLoading(true);
      const data = await communicationChannelService.getAll();
      const activeChannels = data.filter((ch) => ch.is_active);
      setChannels(activeChannels);
    } catch (err) {
      showError("Error", "Failed to load communication channels");
    } finally {
      setLoading(false);
    }
  };

  const handleChannelClick = (channelId: number) => {
    navigate(`/dashboard/dnd-management/${channelId}`);
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
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner variant="modern" size="md" color="primary" />
        </div>
      ) : channels.length === 0 ? (
        <div className="text-center py-12">
          <p className={`${tw.textSecondary} text-sm`}>
            No communication channels available
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Bulk Management Card */}
          <div
            onClick={() => navigate("/dashboard/dnd-management/bulk")}
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
                <h3 className={`text-sm font-semibold ${tw.textPrimary}`}>
                  Bulk Management
                </h3>
              </div>
            </div>
          </div>

          {/* Channel Cards */}
          {channels.map((channel) => (
            <div
              key={channel.id}
              onClick={() => handleChannelClick(channel.id)}
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
                  <h3 className={`text-sm font-semibold ${tw.textPrimary}`}>
                    {channel.name}
                  </h3>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
