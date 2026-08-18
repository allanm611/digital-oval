import { useEffect, useState } from "react";
import { AlertTriangle, X } from "lucide-react";
import Checkbox from "../../../shared/components/ui/Checkbox";
import {
  color,
  tw,
  button,
  getButtonStyles,
} from "../../../shared/utils/utils";
import { Broadcast } from "../types/broadcast";

interface RescheduleBroadcastsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (abortPendingBroadcasts: boolean) => void;
  campaignName: string;
  scheduledBroadcasts: Broadcast[];
  isSubmitting?: boolean;
}

export default function RescheduleBroadcastsModal({
  isOpen,
  onClose,
  onConfirm,
  campaignName,
  scheduledBroadcasts,
  isSubmitting = false,
}: RescheduleBroadcastsModalProps) {
  const [abortAndReschedule, setAbortAndReschedule] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setAbortAndReschedule(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const scheduledCount = scheduledBroadcasts.length;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div
          className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
          onClick={isSubmitting ? undefined : onClose}
        />

        <div
          className={`relative bg-white ${tw.rounded} shadow-2xl w-full max-w-lg`}
        >
          <div
            className="flex items-center justify-between p-6 border-b"
            style={{ borderColor: color.border.default }}
          >
            <h2 className={`text-base font-semibold ${tw.textPrimary}`}>
              Update Campaign
            </h2>
            <button
              onClick={onClose}
              disabled={isSubmitting}
              className={`p-2 hover:bg-gray-100 ${tw.rounded} transition-colors disabled:opacity-50`}
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          <div className="p-6 space-y-5">
            <p className={`text-sm ${tw.textSecondary}`}>
              You are about to update{" "}
              <span className={`font-semibold ${tw.textPrimary}`}>
                "{campaignName}"
              </span>
              . Changing a campaign can affect broadcasts already scheduled for
              it.
            </p>

            <p className={`text-sm font-medium ${tw.textPrimary}`}>
              Do you want to cancel the previous broadcast that were scheduled
              for this campaign and reschedule again
            </p>

            {scheduledCount > 0 ? (
              <p className={`text-sm ${tw.textSecondary}`}>
                {scheduledCount} scheduled broadcast
                {scheduledCount === 1 ? "" : "s"} will be cancelled if you
                confirm below. Broadcasts that are already running or completed
                are not cancelled.
              </p>
            ) : (
              <p className={`text-sm ${tw.textSecondary}`}>
                No scheduled broadcasts were found for this campaign. You can
                still opt in to reschedule from the current settings.
              </p>
            )}

            <label
              htmlFor="abort-pending-broadcasts"
              className={`flex items-start gap-3 p-3 border ${tw.rounded} cursor-pointer`}
              style={{ borderColor: color.border.default }}
            >
              <Checkbox
                id="abort-pending-broadcasts"
                checked={abortAndReschedule}
                disabled={isSubmitting}
                onChange={(e) => setAbortAndReschedule(e.target.checked)}
              />
              <span className="text-sm">
                <span className={`font-medium ${tw.textPrimary} block`}>
                  Cancel previous scheduled broadcasts and reschedule
                </span>
                <span className={`${tw.textSecondary} block mt-1`}>
                  Scheduled broadcasts are aborted (not hard-deleted) so the
                  history is kept, then new broadcasts are created from the
                  updated campaign.
                </span>
              </span>
            </label>

            {abortAndReschedule && (
              <div
                className={`flex items-start gap-2 p-3 ${tw.rounded}`}
                style={{
                  backgroundColor: "#FEF3C7",
                  border: "1px solid #FDE68A",
                }}
              >
                <AlertTriangle className="w-4 h-4 text-amber-700 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-amber-800">
                  Recipients will not receive the cancelled scheduled sends.
                  New broadcasts will follow the campaign schedule you just
                  configured.
                </p>
              </div>
            )}
          </div>

          <div
            className="flex items-center justify-end gap-3 p-6 border-t"
            style={{ borderColor: color.border.default }}
          >
            <button
              onClick={onClose}
              disabled={isSubmitting}
              className={`px-4 py-2 border ${tw.rounded} text-sm font-medium hover:bg-gray-50 transition-colors disabled:opacity-50`}
              style={{ borderColor: color.border.default }}
            >
              Go Back
            </button>
            <button
              onClick={() => onConfirm(abortAndReschedule)}
              disabled={isSubmitting}
              className={`px-4 py-2 ${tw.rounded} text-sm font-medium text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2`}
              style={getButtonStyles(button.action)}
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                  Updating...
                </>
              ) : (
                "Update Campaign"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
