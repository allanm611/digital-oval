import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { color, tw } from "../../../shared/utils/utils";

interface Broadcast {
  id: number;
  name: string;
  status: "pending" | "running" | "completed" | "failed";
  scheduledTime: string;
  completionPercentage: number;
  totalRecipients: number;
}

interface BroadcastsModalProps {
  isOpen: boolean;
  onClose: () => void;
  campaignName: string;
}

const DUMMY_BROADCASTS: Broadcast[] = [
  {
    id: 1,
    name: "Email Broadcast",
    status: "completed",
    scheduledTime: "2024-03-20 10:30 AM",
    completionPercentage: 100,
    totalRecipients: 5000,
  },
  {
    id: 2,
    name: "SMS Broadcast",
    status: "completed",
    scheduledTime: "2024-03-20 11:00 AM",
    completionPercentage: 100,
    totalRecipients: 3500,
  },
  {
    id: 3,
    name: "Push Notification",
    status: "running",
    scheduledTime: "2024-03-20 11:30 AM",
    completionPercentage: 65,
    totalRecipients: 4200,
  },
  {
    id: 4,
    name: "Email Broadcast 2",
    status: "pending",
    scheduledTime: "2024-03-21 10:00 AM",
    completionPercentage: 0,
    totalRecipients: 5000,
  },
];

const getStatusColor = (status: string, colorToken: any) => {
  switch (status) {
    case "completed":
      return colorToken.status.success;
    case "running":
      return colorToken.status.info;
    case "pending":
      return colorToken.status.warning;
    case "failed":
      return colorToken.status.danger;
    default:
      return colorToken.text.muted;
  }
};

const getStatusLabel = (status: string) => {
  return status.charAt(0).toUpperCase() + status.slice(1);
};

export default function BroadcastsModal({
  isOpen,
  onClose,
  campaignName,
}: BroadcastsModalProps) {
  if (!isOpen) return null;

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
            <h2 className="text-lg font-semibold text-black">Broadcasts</h2>
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
          {DUMMY_BROADCASTS.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No broadcasts for this campaign</p>
            </div>
          ) : (
            <div className="space-y-3">
              {DUMMY_BROADCASTS.map((broadcast) => (
                <div
                  key={broadcast.id}
                  className="border border-gray-200 rounded-lg p-4"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="text-sm font-medium text-black">
                        {broadcast.name}
                      </h3>
                      <p className="text-xs text-gray-600 mt-1">
                        Scheduled: {broadcast.scheduledTime}
                      </p>
                    </div>
                    <span
                      className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium text-white"
                      style={{ backgroundColor: getStatusColor(broadcast.status, color) }}
                    >
                      {getStatusLabel(broadcast.status)}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-medium text-gray-600 block mb-1">
                        Progress
                      </label>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="h-2 rounded-full transition-all"
                          style={{
                            width: `${broadcast.completionPercentage}%`,
                            backgroundColor: getStatusColor(broadcast.status, color),
                          }}
                        />
                      </div>
                      <p className="text-xs text-gray-600 mt-1">
                        {broadcast.completionPercentage}% Complete
                      </p>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-600 block mb-1">
                        Recipients
                      </label>
                      <p className="text-sm font-semibold text-black">
                        {broadcast.totalRecipients.toLocaleString()}
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
