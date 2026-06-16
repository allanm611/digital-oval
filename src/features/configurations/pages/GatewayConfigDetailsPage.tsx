import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Edit, Trash2, Mail, MessageSquare, MessageCircle, Bell } from "lucide-react";
import BackButton from "../../../shared/components/ui/BackButton";
import { useToast } from "../../../contexts/ToastContext";
import { extractBackendError } from "../../../shared/utils/errorHandler";;;
import { color, tw, button, getButtonStyles } from "../../../shared/utils/utils";
import { emailGatewayConfigService } from "../services/emailGatewayConfigService";
import { smsGatewayConfigService } from "../services/smsGatewayConfigService";
import { whatsappGatewayConfigService } from "../services/whatsappGatewayConfigService";
import { pushGatewayConfigService } from "../services/pushGatewayConfigService";
import { ussdGatewayConfigService } from "../services/ussdGatewayConfigService";
import LoadingSpinner from "../../../shared/components/ui/LoadingSpinner";
import DateFormatter from "../../../shared/components/DateFormatter";
import ActivateDeactivateButton from "../../../shared/components/ui/ActivateDeactivateButton";

type ChannelType = "EMAIL" | "SMS" | "WHATSAPP" | "PUSH" | "USSD";

const CHANNEL_LABEL: Record<ChannelType, string> = {
  EMAIL: "Email",
  SMS: "SMS",
  WHATSAPP: "WhatsApp",
  PUSH: "Push Notifications",
};

const getChannelIcon = (channel: ChannelType) => {
  switch (channel) {
    case "EMAIL":
      return <Mail className="w-7 h-7 text-white" />;
    case "SMS":
      return <MessageSquare className="w-7 h-7 text-white" />;
    case "WHATSAPP":
      return <MessageCircle className="w-7 h-7 text-white" />;
    case "PUSH":
      return <Bell className="w-7 h-7 text-white" />;
  }
};

interface GatewayConfigDetailsPageProps {
  channel: ChannelType;
}

export default function GatewayConfigDetailsPage({ channel }: GatewayConfigDetailsPageProps) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { success: showSuccess, error: showError } = useToast();

  const [loading, setLoading] = useState(true);
  const [config, setConfig] = useState<any>(null);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    loadConfig();
  }, [id, channel]);

  const loadConfig = async () => {
    try {
      setLoading(true);
      if (!id) return;

      let foundConfig: any = null;

      if (channel === "EMAIL") {
        const configs = await emailGatewayConfigService.getAllConfigs();
        foundConfig = configs.find((c) => c.id === Number(id));
      } else if (channel === "SMS") {
        const configs = await smsGatewayConfigService.getAllConfigs();
        foundConfig = configs.find((c) => c.id === Number(id));
      } else if (channel === "WHATSAPP") {
        const configs = await whatsappGatewayConfigService.getAllConfigs();
        foundConfig = configs.find((c) => c.id === Number(id));
      } else if (channel === "PUSH") {
        const configs = await pushGatewayConfigService.getAllConfigs();
        foundConfig = configs.find((c) => c.id === Number(id));
      } else if (channel === "USSD") {
        const configs = await ussdGatewayConfigService.getAllConfigs();
        foundConfig = configs.find((c) => c.id === Number(id));
      }

      if (!foundConfig) {
        showError("Configuration not found");
        navigate("/dashboard/gateway-configurations");
        return;
      }

      setConfig(foundConfig);
    } catch (err) {
      showError(extractBackendError(error, "Failed to load configuration. Please try again."));
      navigate("/dashboard/gateway-configurations");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = () => {
    const newActive = !config.is_active;
    setConfig((prev: any) => ({ ...prev, is_active: newActive }));
    showSuccess(
      newActive ? "Activated" : "Deactivated",
      newActive
        ? `${config.name} has been activated`
        : `${config.name} has been deactivated`
    );
  };

  const handleDelete = () => {
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!config) return;
    try {
      setDeleting(true);
      if (channel === "EMAIL") {
        await emailGatewayConfigService.deleteConfig(Number(id));
      } else if (channel === "SMS") {
        await smsGatewayConfigService.deleteConfig(Number(id));
      } else if (channel === "WHATSAPP") {
        await whatsappGatewayConfigService.deleteConfig(Number(id));
      } else if (channel === "PUSH") {
        await pushGatewayConfigService.deleteConfig(Number(id));
      } else if (channel === "USSD") {
        await ussdGatewayConfigService.deleteConfig(Number(id));
      }

      showSuccess(`"${config.name}" has been deleted successfully.`);
      navigate("/dashboard/gateway-configurations");
    } catch (err) {
      showError(extractBackendError(error, "Failed to delete gateway configuration. Please try again."));
    } finally {
      setDeleting(false);
      setShowDeleteModal(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <LoadingSpinner variant="modern" size="xl" color="primary" />
        <p className={`${tw.textMuted} font-medium mt-4`}>Loading configuration...</p>
      </div>
    );
  }

  if (!config) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div className="flex items-center space-x-2 sm:space-x-4">
          <BackButton showBreadcrumb={true} currentLabel="Gateway Configuration Details" />
          <div></div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <ActivateDeactivateButton
            isActive={config.is_active}
            onToggle={handleToggleActive}
          >
            {config.is_active ? "Deactivate" : "Activate"}
          </ActivateDeactivateButton>
          <button
            onClick={() =>
              navigate(`/dashboard/gateway-configurations/${config.id}/edit`)
            }
            className={`px-4 py-2 text-white text-xs ${tw.rounded} font-semibold transition-all duration-200 flex items-center gap-2 w-fit`}
            style={{ backgroundColor: color.primary.action }}
            onMouseEnter={(e) => {
              e.currentTarget.style.opacity = "0.9";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = "1";
            }}
          >
            <Edit className="w-4 h-4" />
            Edit
          </button>
          <button
            onClick={handleDelete}
            className={`${tw.rounded} font-semibold transition-all duration-200 flex items-center gap-2 text-xs w-fit`}
            style={{
              backgroundColor: button.delete.background,
              color: button.delete.color,
              border: button.delete.border,
              padding: `${button.delete.paddingY} ${button.delete.paddingX}`,
              borderRadius: button.delete.borderRadius,
              fontSize: button.delete.fontSize,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.opacity = "0.9";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = "1";
            }}
          >
            <Trash2 className="w-4 h-4" />
            Delete
          </button>
        </div>
      </div>

      {/* Configuration Information */}
      <div className="space-y-6">
        {/* Configuration Overview */}
        <div className={`bg-white ${tw.rounded} border border-gray-200 p-6`}>
          <div className="flex items-start space-x-4 mb-6">
            <div
              className={`h-14 w-14 ${tw.rounded} flex items-center justify-center flex-shrink-0`}
              style={{ backgroundColor: color.primary.accent }}
            >
              {getChannelIcon(channel)}
            </div>
            <div className="flex-1">
              <h2 className={`text-sm font-semibold ${tw.textPrimary} mb-2`}>
                {config.name}
              </h2>
              <p className={`text-sm ${tw.textSecondary} leading-relaxed`}>
                {config.description || "No description available"}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1">
              <label
                className={`text-xs font-medium ${tw.textMuted} uppercase tracking-wide`}
              >
                Configuration Name
              </label>
              <p className={`text-sm ${tw.textPrimary}`}>
                {config.name}
              </p>
            </div>
            <div className="space-y-1">
              <label
                className={`text-xs font-medium ${tw.textMuted} uppercase tracking-wide`}
              >
                Communication Channel
              </label>
              <p className={`text-sm ${tw.textPrimary}`}>
                {CHANNEL_LABEL[channel]}
              </p>
            </div>
            <div className="space-y-1">
              <label
                className={`text-xs font-medium ${tw.textMuted} uppercase tracking-wide`}
              >
                Provider
              </label>
              <p className={`text-sm ${tw.textPrimary}`}>
                {config.provider_type}
              </p>
            </div>
            <div className="space-y-1">
              <label
                className={`text-xs font-medium ${tw.textMuted} uppercase tracking-wide`}
              >
                Status
              </label>
              <p className={`text-sm font-medium ${config.is_active ? tw.success : tw.textMuted}`}>
                {config.is_active ? "Active" : "Inactive"}
              </p>
            </div>
            <div className="space-y-1">
              <label
                className={`text-xs font-medium ${tw.textMuted} uppercase tracking-wide`}
              >
                Created
              </label>
              <p className={`text-sm ${tw.textPrimary}`}>
                <DateFormatter date={config.created_at} useUserTimezone includeTime />
              </p>
            </div>
            <div className="space-y-1">
              <label
                className={`text-xs font-medium ${tw.textMuted} uppercase tracking-wide`}
              >
                Last Updated
              </label>
              <p className={`text-sm ${tw.textPrimary}`}>
                <DateFormatter date={config.updated_at} useUserTimezone includeTime />
              </p>
            </div>
          </div>
        </div>

        {/* Credentials */}
        {config.credentials && (
          <div className={`bg-white ${tw.rounded} border border-gray-200 p-6`}>
            <h2 className={`text-sm font-semibold ${tw.textPrimary} mb-6`}>Credentials</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {Object.entries(config.credentials).map(([key, value]) => {
                const displayValue = (() => {
                  if (typeof value === "boolean") {
                    return value ? "Yes" : "No";
                  }
                  if (typeof value === "number") {
                    return String(value);
                  }
                  const strValue = String(value);
                  return strValue.length > 40 ? strValue.substring(0, 37) + "..." : strValue;
                })();

                return (
                  <div key={key} className="space-y-1">
                    <label
                      className={`text-xs font-medium ${tw.textMuted} uppercase tracking-wide`}
                    >
                      {key.replace(/_/g, " ")}
                    </label>
                    <p className={`text-sm ${tw.textPrimary} break-words`}>
                      {displayValue}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-md p-6 max-w-md w-full mx-4">
            <h3 className={`text-sm font-semibold ${tw.textPrimary} mb-2`}>
              Delete Gateway Configuration
            </h3>
            <p className={`text-sm ${tw.textSecondary} mb-6`}>
              Are you sure you want to delete "{config.name}"? This action
              cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                disabled={deleting}
                className="px-4 py-2 text-xs font-medium border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={deleting}
                className="px-4 py-2 text-xs font-medium text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors disabled:opacity-60"
              >
                {deleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
