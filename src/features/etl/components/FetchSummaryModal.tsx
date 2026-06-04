import { X, Check, AlertCircle } from "lucide-react";
import { color, tw, button, getButtonStyles } from "../../../shared/utils/utils";

interface FetchSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onViewExecutions: () => void;
  mode: "immediate" | "by-time" | "by-range";
  data: {
    executionId?: string;
    jobId?: number;
    filesProcessed?: number;
    triggeredCount?: number;
    failedSlots?: number;
    timeRange?: string;
  };
}

export default function FetchSummaryModal({
  isOpen,
  onClose,
  onViewExecutions,
  mode,
  data,
}: FetchSummaryModalProps) {
  if (!isOpen) return null;

  const getTitle = () => {
    switch (mode) {
      case "immediate":
        return "Fetch Now - Job Started";
      case "by-time":
        return "Historical Fetch Triggered";
      case "by-range":
        return "Range Fetch Triggered";
      default:
        return "Fetch Summary";
    }
  };

  const getDescription = () => {
    switch (mode) {
      case "immediate":
        return `Job execution started in the background. The system is processing files asynchronously. Track progress in Job Executions.`;
      case "by-time":
        return `Historical data fetch has been triggered for the specified date and time.`;
      case "by-range":
        return `Multiple hourly fetch jobs have been created to process your date range.`;
      default:
        return "";
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div
        className={`${tw.rounded} border w-full max-w-md shadow-lg`}
        style={{
          backgroundColor: color.surface.background,
          borderColor: color.border.default,
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between border-b p-6"
          style={{ borderColor: color.border.default }}
        >
          <div className="flex items-center gap-3">
            <div
              className="rounded-full p-2"
              style={{ backgroundColor: "rgba(16,185,129,0.1)" }}
            >
              <Check size={20} style={{ color: "#10b981" }} />
            </div>
            <h2 className={`${tw.textPrimary} text-lg font-semibold`}>
              {getTitle()}
            </h2>
          </div>
          <button
            onClick={onClose}
            className={`${tw.textSecondary} hover:opacity-70 transition-opacity`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Description */}
          <p className={`${tw.textSecondary} text-sm leading-relaxed`}>
            {getDescription()}
          </p>

          {/* Details */}
          <div className="space-y-3">
            {/* Immediate Mode */}
            {mode === "immediate" && (
              <>
                <div className="flex justify-between items-start text-sm">
                  <span className={tw.textSecondary}>Job ID:</span>
                  <span className="font-semibold text-black">{data.jobId}</span>
                </div>
                <div className="flex justify-between items-start text-sm">
                  <span className={tw.textSecondary}>Execution ID:</span>
                  <span className="font-mono text-xs font-medium text-black break-all">
                    {data.executionId}
                  </span>
                </div>
                <div
                  className="mt-3 p-3 rounded"
                  style={{
                    backgroundColor: "rgba(251,191,36,0.1)",
                    borderLeft: "3px solid #fbbf24",
                  }}
                >
                  <div className="flex items-start gap-2">
                    <AlertCircle size={16} className="text-amber-600 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-amber-800">
                      Status shows as "-1" while processing. Check job executions page for real-time updates.
                    </p>
                  </div>
                </div>
              </>
            )}

            {/* By-Time Mode */}
            {mode === "by-time" && (
              <>
                <div className="flex justify-between items-start text-sm">
                  <span className={tw.textSecondary}>Execution ID:</span>
                  <span className="font-mono text-xs font-medium text-black break-all">
                    {data.executionId}
                  </span>
                </div>
                <div className="flex justify-between items-start text-sm">
                  <span className={tw.textSecondary}>Time Period:</span>
                  <span className="font-semibold text-black">{data.timeRange}</span>
                </div>
              </>
            )}

            {/* By-Range Mode */}
            {mode === "by-range" && (
              <>
                <div className="flex justify-between items-start text-sm">
                  <span className={tw.textSecondary}>Hourly Jobs Triggered:</span>
                  <span className="font-bold text-lg" style={{ color: color.primary.action }}>
                    {data.triggeredCount}
                  </span>
                </div>
                {data.failedSlots ? (
                  <div className="flex justify-between items-start text-sm">
                    <span className={tw.textSecondary}>Failed Slots:</span>
                    <span className="font-semibold text-red-600">{data.failedSlots}</span>
                  </div>
                ) : (
                  <div className="flex justify-between items-start text-sm">
                    <span className={tw.textSecondary}>Status:</span>
                    <span className="font-semibold text-green-600">All slots queued successfully</span>
                  </div>
                )}
                <p className={`${tw.textSecondary} text-xs mt-3`}>
                  The system is creating one hourly fetch job for each hour in your date range.
                </p>
              </>
            )}
          </div>
        </div>

        {/* Footer */}
        <div
          className="flex justify-end gap-3 p-6 border-t"
          style={{ borderColor: color.border.default }}
        >
          <button
            onClick={onClose}
            className="transition-colors disabled:opacity-60"
            style={getButtonStyles(button.bordered)}
          >
            Close
          </button>
          <button
            onClick={onViewExecutions}
            className={`px-4 py-2 ${tw.rounded} text-sm font-medium text-white transition-colors`}
            style={{ backgroundColor: color.primary.action }}
          >
            View Executions
          </button>
        </div>
      </div>
    </div>
  );
}
