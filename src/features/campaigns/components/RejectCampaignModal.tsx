import { useState } from "react";
import { X } from "lucide-react";
import Textarea from "../../../shared/components/ui/Textarea";
import { campaignService } from "../services/campaignService";
import { useToast } from "../../../contexts/ToastContext";
import { useAuth } from "../../../contexts/AuthContext";
import { color, tw, button, getButtonStyles } from "../../../shared/utils/utils";

interface RejectCampaignModalProps {
  isOpen: boolean;
  onClose: () => void;
  campaignId: number;
  campaignName: string;
  onSuccess?: () => void;
}

export default function RejectCampaignModal({
  isOpen,
  onClose,
  campaignId,
  campaignName,
  onSuccess,
}: RejectCampaignModalProps) {
  const { showToast } = useToast();
  const { user } = useAuth();
  const [isRejecting, setIsRejecting] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      showToast("warning", "Please provide a reason for rejection");
      return;
    }

    setIsRejecting(true);
    try {
      const userId = user?.user_id;
      if (!userId) {
        throw new Error("User ID not available");
      }

      await campaignService.rejectCampaign(campaignId, userId, rejectionReason);

      showToast("success", `Campaign "${campaignName}" rejected successfully!`);
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error("Error rejecting campaign:", error);

      // Extract error message from backend response
      let errorMessage = "Failed to reject campaign. Please try again.";

      if (error instanceof Error) {
        // Try to parse JSON error message from the error string
        const match = error.message.match(/details: ({.*})/);
        if (match) {
          try {
            const errorData = JSON.parse(match[1]);
            errorMessage = errorData.error || errorData.message || errorMessage;
          } catch {
            // If parsing fails, use the full error message
            errorMessage = error.message;
          }
        } else {
          errorMessage = error.message;
        }
      }

      showToast("error", errorMessage);
    } finally {
      setIsRejecting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
          onClick={onClose}
        />

        {/* Modal */}
        <div className={`relative bg-white ${tw.rounded} shadow-2xl w-full max-w-md`}>
          {/* Header */}
          <div
            className="flex items-center justify-between p-6 border-b"
            style={{ borderColor: color.border.default }}
          >
            <h2 className={`text-base font-semibold ${tw.textPrimary}`}>
              Reject Campaign
            </h2>
            <button
              onClick={onClose}
              className={`p-2 hover:bg-gray-100 ${tw.rounded} transition-colors`}
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            <p className={`text-sm ${tw.textSecondary} mb-6 flex items-center gap-1`}>
              You are about to reject the campaign:
              <span className={`font-semibold ${tw.textPrimary} truncate`}>
                "{campaignName}"
              </span>
            </p>

            <div>
              <Textarea
                label="Rejection Reason"
                value={rejectionReason}
                onChange={(value) => setRejectionReason(value)}
                placeholder="Explain why this campaign is being rejected..."
                rows={4}
                disabled={isRejecting}
                required
              />
              <p className={`text-xs ${tw.textSecondary} mt-3`}>
                This reason will be visible to the campaign owner
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 pt-2 pb-6 px-6">
            <button
              onClick={onClose}
              disabled={isRejecting}
              className="disabled:opacity-50 transition-colors"
              style={{
                ...getButtonStyles(button.bordered),
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleReject}
              disabled={isRejecting || !rejectionReason.trim()}
              className={`px-4 py-2 ${tw.rounded} text-sm font-medium text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2`}
              style={{ backgroundColor: "#EF4444" }}
            >
              {isRejecting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Rejecting...
                </>
              ) : (
                "Reject Campaign"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
