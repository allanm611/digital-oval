import { useState } from "react";
import { X, XCircle } from "lucide-react";
import { campaignService } from "../services/campaignService";
import { useToast } from "../../../contexts/ToastContext";
import { color, tw } from "../../../shared/utils/utils";

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
  const [isRejecting, setIsRejecting] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      showToast("warning", "Please provide a reason for rejection");
      return;
    }

    setIsRejecting(true);
    try {
      // TODO: Get actual user ID from auth context
      const userId = 1;

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
            <div className="flex items-center gap-3">
              <XCircle className="w-5 h-5 text-red-600" />
              <h2 className={`text-xl font-semibold ${tw.textPrimary}`}>
                Reject Campaign
              </h2>
            </div>
            <button
              onClick={onClose}
              className={`p-2 hover:bg-gray-100 ${tw.rounded} transition-colors`}
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            <p className={`text-sm ${tw.textSecondary} mb-2`}>
              You are about to reject the campaign:
            </p>
            <p className={`text-lg font-semibold ${tw.textPrimary} mb-4`}>
              "{campaignName}"
            </p>

            <div className="mb-4">
              <label
                className={`block text-sm font-medium ${tw.textPrimary} mb-2`}
              >
                Rejection Reason *
              </label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Explain why this campaign is being rejected..."
                className={`w-full px-3 py-2 border ${tw.rounded} focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors resize-none text-sm ${tw.textPrimary}`}
                style={{ borderColor: color.border.default }}
                rows={4}
                disabled={isRejecting}
              />
              <p className={`text-xs ${tw.textSecondary} mt-1`}>
                This reason will be visible to the campaign owner
              </p>
            </div>
          </div>

          {/* Footer */}
          <div
            className="flex items-center justify-end gap-3 p-6 border-t"
            style={{ borderColor: color.border.default }}
          >
            <button
              onClick={onClose}
              disabled={isRejecting}
              className={`px-4 py-2 border ${tw.rounded} text-sm font-medium hover:bg-gray-50 transition-colors disabled:opacity-50`}
              style={{ borderColor: color.border.default }}
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
                <>
                  <XCircle className="w-4 h-4" />
                  Reject Campaign
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
