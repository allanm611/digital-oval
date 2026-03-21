import { createPortal } from "react-dom";
import { X, Clock } from "lucide-react";
import { color, tw } from "../../../shared/utils/utils";

interface ExecutionHistory {
  id: number;
  startTime: string;
  endTime: string;
  durationMs: number;
  status: "completed" | "running" | "failed";
}

interface ExecutionTimeModalProps {
  isOpen: boolean;
  onClose: () => void;
  campaignName: string;
  totalExecutionTimeMs: number;
}

const DUMMY_EXECUTION_HISTORY: ExecutionHistory[] = [
  {
    id: 1,
    startTime: "2024-03-20 10:30:00 AM",
    endTime: "2024-03-20 02:45:30 PM",
    durationMs: 15330000,
    status: "completed",
  },
  {
    id: 2,
    startTime: "2024-03-19 09:15:00 AM",
    endTime: "2024-03-19 01:22:45 PM",
    durationMs: 14565000,
    status: "completed",
  },
  {
    id: 3,
    startTime: "2024-03-18 11:00:00 AM",
    endTime: "2024-03-18 03:55:20 PM",
    durationMs: 17720000,
    status: "completed",
  },
  {
    id: 4,
    startTime: "2024-03-17 08:45:00 AM",
    endTime: "2024-03-17 02:30:15 PM",
    durationMs: 20415000,
    status: "completed",
  },
  {
    id: 5,
    startTime: "2024-03-16 02:00:00 PM",
    endTime: "2024-03-16 06:18:45 PM",
    durationMs: 15325000,
    status: "completed",
  },
];

const formatDuration = (ms: number) => {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m ${seconds}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  } else {
    return `${seconds}s`;
  }
};

const getStatusColor = (status: string, colorToken: any) => {
  switch (status) {
    case "completed":
      return colorToken.status.success;
    case "running":
      return colorToken.status.info;
    case "failed":
      return colorToken.status.danger;
    default:
      return colorToken.text.muted;
  }
};

export default function ExecutionTimeModal({
  isOpen,
  onClose,
  campaignName,
  totalExecutionTimeMs,
}: ExecutionTimeModalProps) {
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
            <h2 className="text-lg font-semibold text-black">Execution Time</h2>
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
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-black mb-4">Execution History</h3>
            <div className="space-y-3">
              {DUMMY_EXECUTION_HISTORY.map((execution, index) => (
                <div
                  key={execution.id}
                  className="border border-gray-200 rounded-lg p-4"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-sm font-medium text-gray-600">
                          Run {DUMMY_EXECUTION_HISTORY.length - index}
                        </span>
                        <span
                          className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium text-white"
                          style={{ backgroundColor: color.primary.accent }}
                        >
                          {execution.status.charAt(0).toUpperCase() +
                            execution.status.slice(1)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-gray-50 rounded p-3">
                    <div>
                      <label className="text-xs font-medium text-gray-600 block mb-1">
                        Start Time
                      </label>
                      <p className="text-sm text-black">
                        {execution.startTime}
                      </p>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-600 block mb-1">
                        End Time
                      </label>
                      <p className="text-sm text-black">
                        {execution.endTime}
                      </p>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-600 block mb-1">
                        Duration
                      </label>
                      <p className="text-sm font-semibold text-black">
                        {formatDuration(execution.durationMs)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
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
