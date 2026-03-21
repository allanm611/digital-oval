import { createPortal } from "react-dom";
import { X, AlertCircle } from "lucide-react";
import { color, tw } from "../../../shared/utils/utils";

interface FailedItem {
  id: number;
  broadcastName: string;
  failureTime: string;
  failureReason: string;
  failedCount: number;
  totalAttempted: number;
}

interface FailedModalProps {
  isOpen: boolean;
  onClose: () => void;
  campaignName: string;
}

const DUMMY_FAILURES: FailedItem[] = [
  {
    id: 1,
    broadcastName: "Email Broadcast",
    failureTime: "2026-03-20 02:45 PM",
    failureReason: "SMTP server timeout - Connection refused",
    failedCount: 342,
    totalAttempted: 5000,
  },
  {
    id: 2,
    broadcastName: "SMS Broadcast",
    failureTime: "2026-03-20 11:30 AM",
    failureReason: "Rate limit exceeded - Too many requests sent",
    failedCount: 15,
    totalAttempted: 3500,
  },
  {
    id: 3,
    broadcastName: "Push Notification",
    failureTime: "2026-03-20 11:25 AM",
    failureReason: "API service unavailable - Temporary outage",
    failedCount: 123,
    totalAttempted: 4200,
  },
];

export default function FailedModal({
  isOpen,
  onClose,
  campaignName,
}: FailedModalProps) {
  if (!isOpen) return null;

  const totalFailed = DUMMY_FAILURES.reduce((sum, item) => sum + item.failedCount, 0);

  return createPortal(
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4"
      style={{ zIndex: 9999 }}
      onClick={onClose}
    >
      <div
        className={`bg-white ${tw.rounded} shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-lg font-semibold text-black">Failed Messages</h2>
            <p className="text-sm text-gray-600 mt-1">{campaignName}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {DUMMY_FAILURES.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No failures recorded</p>
            </div>
          ) : (
            <div className="space-y-3">
              {DUMMY_FAILURES.map((failure) => (
                <div
                  key={failure.id}
                  className="rounded-lg p-4 bg-white"
                  style={{ border: `1px solid ${color.status.danger}` }}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="text-sm font-medium text-black">
                        {failure.broadcastName}
                      </h3>
                      <p className="text-xs text-gray-600 mt-1">
                        Failed: {failure.failureTime}
                      </p>
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="text-xs font-medium text-gray-600 block mb-1">
                      Failure Reason
                    </label>
                    <p className="text-sm text-gray-800">{failure.failureReason}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-medium text-gray-600 block mb-1">
                        Failed Count
                      </label>
                      <p className="text-sm font-semibold text-red-600">
                        {failure.failedCount.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-600 block mb-1">
                        Total Attempted
                      </label>
                      <p className="text-sm font-semibold text-black">
                        {failure.totalAttempted.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-gray-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded hover:bg-gray-50 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
