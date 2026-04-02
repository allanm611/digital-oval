import { createPortal } from "react-dom";
import { X, Clock } from "lucide-react";
import { color, tw } from "../../../shared/utils/utils";

interface ExecutionTimeModalProps {
  isOpen: boolean;
  onClose: () => void;
  campaignName: string;
  totalExecutionTimeMs: number;
}


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
          {totalExecutionTimeMs === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No executions yet</p>
            </div>
          ) : (
            <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
              <label className="text-sm font-medium text-gray-600 block mb-3">
                Total Execution Time
              </label>
              <p className="text-4xl font-bold" style={{ color: color.primary.accent }}>
                {formatDuration(totalExecutionTimeMs)}
              </p>
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
