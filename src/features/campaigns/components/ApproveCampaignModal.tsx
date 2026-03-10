import { useState } from "react";
import { X, CheckCircle } from "lucide-react";
import { campaignService } from "../services/campaignService";
import { useToast } from "../../../contexts/ToastContext";
import { useAuth } from "../../../contexts/AuthContext";
import { color, tw } from "../../../shared/utils/utils";

interface ApproveCampaignModalProps {
  isOpen: boolean;
  onClose: () => void;
  campaignId: number;
  campaignName: string;
  onSuccess?: () => void;
}

export default function ApproveCampaignModal({
  isOpen,
  onClose,
  campaignId,
  campaignName,
  onSuccess,
}: ApproveCampaignModalProps) {
  const { showToast } = useToast();
  const { user } = useAuth();
  const [isApproving, setIsApproving] = useState(false);

  const handleApprove = async () => {
    setIsApproving(true);
    try {
      const userId = user?.user_id;
      if (!userId) {
        throw new Error("User ID not available");
      }

      await campaignService.approveCampaign(campaignId, userId);

      showToast("success", `Campaign "${campaignName}" approved successfully!`);
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error("Error approving campaign:", error);

      // Extract error message from backend response
      let errorMessage = "Failed to approve campaign. Please try again.";

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
      setIsApproving(false);
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
              <div
                className={`w-10 h-10 ${tw.rounded} flex items-center justify-center`}
                style={{ backgroundColor: "#10B98120" }}
              >
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <h2 className={`text-xl font-semibold ${tw.textPrimary}`}>
                Approve Campaign
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
            <p className={`text-sm ${tw.textSecondary} mb-4`}>
              Are you sure you want to approve the campaign:
            </p>
            <p className={`text-lg font-semibold ${tw.textPrimary} mb-6`}>
              "{campaignName}"
            </p>
            <p className={`text-sm ${tw.textSecondary}`}>
              This will mark the campaign as approved and allow it to proceed to
              activation.
            </p>
          </div>

          {/* Footer */}
          <div
            className="flex items-center justify-end gap-3 p-6 border-t"
            style={{ borderColor: color.border.default }}
          >
            <button
              onClick={onClose}
              disabled={isApproving}
              className={`px-4 py-2 border ${tw.rounded} text-sm font-medium hover:bg-gray-50 transition-colors disabled:opacity-50`}
              style={{ borderColor: color.border.default }}
            >
              Cancel
            </button>
            <button
              onClick={handleApprove}
              disabled={isApproving}
              className={`px-4 py-2 ${tw.rounded} text-sm font-medium text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2`}
              style={{ backgroundColor: "#10B981" }}
            >
              {isApproving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Approving...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  Approve Campaign
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
