import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Edit,
  Trash2,
  MessageSquare,
  Power,
  PowerOff,
} from "lucide-react";
import { communicationChannelService, CommunicationChannel } from "../../../shared/services/communicationChannelService";
import { color, tw, button } from "../../../shared/utils/utils";
import { useToast } from "../../../contexts/ToastContext";
import { extractBackendError } from "../../../shared/utils/errorHandler";;;
import { useLanguage } from "../../../contexts/LanguageContext";
import BackButton from "../../../shared/components/ui/BackButton";
import LoadingSpinner from "../../../shared/components/ui/LoadingSpinner";
import DeleteConfirmModal from "../../../shared/components/ui/DeleteConfirmModal";
import ActivateDeactivateButton from "../../../shared/components/ui/ActivateDeactivateButton";
import DateFormatter from "../../../shared/components/DateFormatter";
import CreateEditCommunicationChannelModal from "../components/CreateEditCommunicationChannelModal";
import { useDeleteConfirm } from "../../../shared/hooks/useDeleteConfirm";

export default function CommunicationChannelDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { success, error: showError } = useToast();
  const { t } = useLanguage();

  const navigateBack = () => {
    navigate("/dashboard/communication-channels", { replace: true });
  };

  const { deleteConfirm, isDeleting, openDeleteConfirm, closeDeleteConfirm } = useDeleteConfirm({ onDelete: async () => await handleConfirmDelete() });

  const [channel, setChannel] = useState<CommunicationChannel | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [isTogglingStatus, setIsTogglingStatus] = useState(false);

  const loadChannel = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      if (!id) {
        throw new Error("Channel ID not found");
      }

      const channelData = await communicationChannelService.getById(Number(id));

      if (!channelData) {
        throw new Error("Channel not found");
      }

      setChannel(channelData);
    } catch (err) {
      console.error("Failed to load channel:", err);
      setError(err instanceof Error ? err.message : "Failed to load channel");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadChannel();
  }, [loadChannel]);

  const handleToggleStatus = async () => {
    if (!channel) return;

    setIsTogglingStatus(true);
    try {
      const newStatus = !channel.is_active;
      setChannel((prev) =>
        prev ? { ...prev, is_active: newStatus } : null
      );

      await communicationChannelService.update(channel.id, {
        is_active: newStatus,
      });

      success(
        newStatus ? "Channel Activated" : "Channel Deactivated",
        `"${channel.name}" has been ${newStatus ? "activated" : "deactivated"} successfully.`,
      );
    } catch (err) {
      console.error("Failed to toggle channel status:", err);
      showError("Failed to update channel status", extractBackendError(error, "Failed to update channel status. Please try again."));
      setChannel((prev) =>
        prev ? { ...prev, is_active: !prev.is_active } : null
      );
    } finally {
      setIsTogglingStatus(false);
    }
  };

  const handleEdit = () => {
    if (!channel) return;
    setShowEditModal(true);
  };

  const handleConfirmEdit = async (data: {
    name: string;
    description: string;
    is_active: boolean;
  }) => {
    if (!channel) return;

    try {
      await communicationChannelService.update(channel.id, data);
      setChannel((prev) =>
        prev
          ? {
              ...prev,
              name: data.name,
              description: data.description,
              is_active: data.is_active,
            }
          : null
      );
    } catch (err) {
      console.error("Failed to update channel:", err);
      throw err;
    }
  };

  const handleDelete = () => {
    if (!channel) return;
    openDeleteConfirm(channel?.id || 0, channel?.name || "");
  };

  const handleConfirmDelete = async () => {
    if (!channel) return;

    try {
      await communicationChannelService.delete(channel.id);
      success(
        "Channel Deleted",
        `"${channel.name}" has been deleted successfully.`,
      );
      closeDeleteConfirm();
      navigate("/dashboard/communication-channels");
    } catch (err) {
      console.error("Failed to delete channel:", err);
      const errorMessage =
        err instanceof Error ? err.message : "Failed to delete channel. Please try again.";
      showError("Cannot Delete Channel", extractBackendError(error, "Cannot Delete Channel. Please try again."));
    } finally {
      closeDeleteConfirm();
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <LoadingSpinner
          variant="modern"
          size="xl"
          color="primary"
          className="mb-4"
        />
        <p className={`${tw.textMuted} font-medium text-sm`}>
          Loading channel details...
        </p>
      </div>
    );
  }

  if (error || !channel) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <MessageSquare
            className={`w-16 h-16 text-[${color.primary.accent}] mx-auto mb-4`}
          />
          <h3 className={`text-lg font-medium ${tw.textPrimary} mb-2`}>
            {error ? "Error Loading Channel" : "Channel Not Found"}
          </h3>
          <p className={`${tw.textMuted} mb-6`}>
            {error
              ? "Please try again later."
              : "The channel you are looking for does not exist."}
          </p>
          <button
            onClick={navigateBack}
            className={`px-4 py-2 text-white ${tw.rounded} font-semibold transition-all duration-200 flex items-center gap-2 mx-auto text-sm`}
            style={{ backgroundColor: button.action.background }}
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Channels
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <BackButton
          showBreadcrumb={true}
          currentLabel="Channel Details"
        />
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleEdit}
            className={`px-4 py-2 ${tw.rounded} font-semibold transition-all duration-200 flex items-center gap-2 text-sm w-fit text-white`}
            style={{
              backgroundColor: button.action.background,
            }}
          >
            <Edit className="w-4 h-4" />
            Edit
          </button>
          <ActivateDeactivateButton
            isActive={channel.is_active}
            onToggle={handleToggleStatus}
            disabled={isTogglingStatus}
            isLoading={isTogglingStatus}
          >
            {channel.is_active ? "Deactivate" : "Activate"}
          </ActivateDeactivateButton>
          <button
            onClick={handleDelete}
            className={`${tw.rounded} font-semibold transition-all duration-200 flex items-center gap-2 text-sm w-fit`}
            style={{
              backgroundColor: button.delete.background,
              color: button.delete.color,
              border: button.delete.border,
              padding: `${button.delete.paddingY} ${button.delete.paddingX}`,
              borderRadius: button.delete.borderRadius,
              fontSize: button.delete.fontSize,
            }}
          >
            <Trash2 className="w-4 h-4" />
            Delete
          </button>
        </div>
      </div>

      {/* Channel Information */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Overview */}
          <div className={`bg-white ${tw.rounded} border border-[${tw.borderDefault}] p-6`}>
            <div className="flex items-start space-x-4 mb-6">
              <div
                className={`h-14 w-14 ${tw.rounded} flex items-center justify-center flex-shrink-0`}
                style={{ backgroundColor: color.primary.accent }}
              >
                <MessageSquare className="w-7 h-7 text-white" />
              </div>
              <div className="flex-1">
                <h1 className={`text-lg font-bold ${tw.textPrimary} mb-1`}>
                  {channel.name}
                </h1>
                <p className={`${tw.textMuted} text-sm`}>
                  Code: <span className="font-mono font-semibold">{channel.code}</span>
                </p>
              </div>
              <div className="text-right">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    channel.is_active
                      ? "bg-green-100 text-green-800"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {channel.is_active ? "Active" : "Inactive"}
                </span>
              </div>
            </div>

            {channel.description && (
              <div className="mb-6">
                <h3 className={`text-sm font-semibold ${tw.textPrimary} mb-2`}>
                  Description
                </h3>
                <p className={`${tw.textMuted} text-sm`}>{channel.description}</p>
              </div>
            )}
          </div>

          {/* Capabilities */}
          <div className={`bg-white ${tw.rounded} border border-[${tw.borderDefault}] p-6`}>
            <h2 className={`text-sm font-bold ${tw.textPrimary} mb-4 uppercase`}>
              Capabilities
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div className={`p-4 rounded-lg ${tw.bgMuted}`}>
                <p className={`text-xs font-semibold ${tw.textMuted} uppercase mb-1`}>
                  Media Support
                </p>
                <p className={`text-sm ${tw.textPrimary}`}>
                  {channel.supports_media ? "✓ Yes" : "✗ No"}
                </p>
              </div>
              <div className={`p-4 rounded-lg ${tw.bgMuted}`}>
                <p className={`text-xs font-semibold ${tw.textMuted} uppercase mb-1`}>
                  Personalization
                </p>
                <p className={`text-sm ${tw.textPrimary}`}>
                  {channel.supports_personalization ? "✓ Yes" : "✗ No"}
                </p>
              </div>
              <div className={`p-4 rounded-lg ${tw.bgMuted}`}>
                <p className={`text-xs font-semibold ${tw.textMuted} uppercase mb-1`}>
                  Delivery Confirmation
                </p>
                <p className={`text-sm ${tw.textPrimary}`}>
                  {channel.delivery_confirmation_available ? "✓ Yes" : "✗ No"}
                </p>
              </div>
              {channel.max_message_length && (
                <div className={`p-4 rounded-lg ${tw.bgMuted}`}>
                  <p className={`text-xs font-semibold ${tw.textMuted} uppercase mb-1`}>
                    Max Message Length
                  </p>
                  <p className={`text-sm ${tw.textPrimary}`}>
                    {channel.max_message_length} chars
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Rate Limiting & Pricing */}
          <div className={`bg-white ${tw.rounded} border border-[${tw.borderDefault}] p-6`}>
            <h2 className={`text-sm font-bold ${tw.textPrimary} mb-4 uppercase`}>
              Rate & Pricing
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className={`text-xs font-semibold ${tw.textMuted} uppercase mb-2`}>
                  Rate Limit (per second)
                </p>
                <p className={`text-sm ${tw.textPrimary}`}>
                  {channel.default_rate_limit_per_second ?? "N/A"}
                </p>
              </div>
              <div>
                <p className={`text-xs font-semibold ${tw.textMuted} uppercase mb-2`}>
                  Rate Limit (per minute)
                </p>
                <p className={`text-sm ${tw.textPrimary}`}>
                  {channel.default_rate_limit_per_minute ?? "N/A"}
                </p>
              </div>
              <div>
                <p className={`text-xs font-semibold ${tw.textMuted} uppercase mb-2`}>
                  Cost Per Message
                </p>
                <p className={`text-sm ${tw.textPrimary}`}>
                  {channel.estimated_cost_per_message ?? "N/A"} {channel.estimated_cost_per_message ? channel.currency : ""}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Metadata Sidebar */}
        <div className="space-y-6">
          <div className={`bg-white ${tw.rounded} border border-[${tw.borderDefault}] p-6`}>
            <h3 className={`text-xs font-semibold ${tw.textPrimary} mb-4 uppercase tracking-wide`}>
              Information
            </h3>
            <div className="space-y-4">
              <div>
                <p className={`text-xs font-semibold ${tw.textMuted} uppercase mb-1`}>
                  Channel ID
                </p>
                <p className={`text-sm font-mono ${tw.textPrimary}`}>{channel.id}</p>
              </div>
              <div>
                <p className={`text-xs font-semibold ${tw.textMuted} uppercase mb-1`}>
                  Created
                </p>
                <p className={`text-sm ${tw.textPrimary}`}>
                  <DateFormatter date={channel.created_at} useUserTimezone includeTime />
                </p>
              </div>
              <div>
                <p className={`text-xs font-semibold ${tw.textMuted} uppercase mb-1`}>
                  Last Updated
                </p>
                <p className={`text-sm ${tw.textPrimary}`}>
                  <DateFormatter date={channel.updated_at} useUserTimezone includeTime />
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {channel && (
        <>
          <DeleteConfirmModal
            isOpen={deleteConfirm.id !== null}
            title="Delete Communication Channel"
            description={`Are you sure you want to delete "${channel.name}"? This action cannot be undone.`}
            itemName={channel.name}
            onConfirm={confirmDeleteItem}
            onClose={() => closeDeleteConfirm()}
            isLoading={isDeleting}
          />

          <CreateEditCommunicationChannelModal
            isOpen={showEditModal}
            mode="edit"
            initialData={channel}
            onClose={() => setShowEditModal(false)}
            onSave={handleConfirmEdit}
          />
        </>
      )}
    </div>
  );
}
