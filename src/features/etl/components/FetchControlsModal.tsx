import { useState, useCallback } from "react";
import { X, Play, Calendar } from "lucide-react";
import { etlService } from "../services/etlService";
import {
  FetchFilesRequest,
  FetchByTimeRequest,
  FetchByRangeRequest,
} from "../types/etl";
import { useToast } from "../../../contexts/ToastContext";
import { useAuth } from "../../../contexts/AuthContext";
import { color, tw, zIndex } from "../../../shared/utils/utils";
import HeadlessSelect from "../../../shared/components/ui/HeadlessSelect";

type FetchMode = "immediate" | "by-time" | "by-range";

interface FetchControlsModalProps {
  mode: FetchMode | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (executionId: string, timeFilter?: { category: string; month: string; day: string; hour: string }) => void;
}

export default function FetchControlsModal({
  mode,
  isOpen,
  onClose,
  onSuccess,
}: FetchControlsModalProps) {
  const { success, error: showError } = useToast();
  const { user } = useAuth();

  const [isLoading, setIsLoading] = useState(false);

  // Immediate fetch
  const [jobId, setJobId] = useState("");
  const [forceReprocess, setForceReprocess] = useState(false);

  // By-time fetch
  const [byTimeCategory, setByTimeCategory] = useState("CDR");
  const [byTimeMonth, setByTimeMonth] = useState("1");
  const [byTimeDay, setByTimeDay] = useState("1");
  const [byTimeHour, setByTimeHour] = useState("0");

  // By-range fetch
  const [byRangeJobId, setByRangeJobId] = useState("");
  const [byRangeStartMonth, setByRangeStartMonth] = useState("1");
  const [byRangeStartDay, setByRangeStartDay] = useState("1");
  const [byRangeStartHour, setByRangeStartHour] = useState("0");
  const [byRangeEndMonth, setByRangeEndMonth] = useState("1");
  const [byRangeEndDay, setByRangeEndDay] = useState("3");
  const [byRangeEndHour, setByRangeEndHour] = useState("23");

  const handleFetchImmediate = useCallback(async () => {
    if (!jobId) {
      showError("Validation error", "Job ID is required");
      return;
    }

    setIsLoading(true);
    try {
      const payload: FetchFilesRequest = {
        job_id: parseInt(jobId, 10),
        user_id: user?.user_id,
        force_reprocess: forceReprocess,
      };

      const response = await etlService.fetchFiles(payload);

      if (response.success) {
        success(
          "Fetch triggered",
          `Job ${jobId} executed. ${response.data?.files_processed ?? 0} files processed.`,
        );
        setJobId("");
        setForceReprocess(false);
        onSuccess(response.data?.execution_id || "");
        onClose();
      } else {
        showError("Fetch failed", response.message);
      }
    } catch (err) {
      showError(
        "Failed to trigger fetch",
        (err as Error).message || "Please try again.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [
    jobId,
    forceReprocess,
    user?.user_id,
    success,
    showError,
    onSuccess,
    onClose,
  ]);

  const handleFetchByTime = useCallback(async () => {
    setIsLoading(true);
    try {
      const payload: FetchByTimeRequest = {
        file_category: byTimeCategory,
        month: byTimeMonth,
        day: byTimeDay,
        hour: byTimeHour,
        user_id: user?.user_id || 0,
      };

      const response = await etlService.fetchByTime(payload);

      if (response.success) {
        success(
          "Historical fetch triggered",
          `Execution ID: ${response.data?.execution_id}`,
        );
        onSuccess(response.data?.execution_id || "", {
          category: byTimeCategory,
          month: byTimeMonth,
          day: byTimeDay,
          hour: byTimeHour,
        });
        onClose();
      } else {
        showError("Fetch failed", response.message);
      }
    } catch (err) {
      showError(
        "Failed to trigger historical fetch",
        (err as Error).message || "Please try again.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [
    byTimeCategory,
    byTimeMonth,
    byTimeDay,
    byTimeHour,
    user?.user_id,
    success,
    showError,
    onSuccess,
    onClose,
  ]);

  const handleFetchByRange = useCallback(async () => {
    if (!byRangeJobId) {
      showError("Validation error", "Job ID is required");
      return;
    }

    setIsLoading(true);
    try {
      const payload: FetchByRangeRequest = {
        job_id: parseInt(byRangeJobId, 10),
        user_id: user?.user_id || 0,
        start_time: {
          month: byRangeStartMonth,
          day: byRangeStartDay,
          hour: byRangeStartHour,
        },
        end_time: {
          month: byRangeEndMonth,
          day: byRangeEndDay,
          hour: byRangeEndHour,
        },
      };

      const response = await etlService.fetchByRange(payload);

      if (response.success) {
        success(
          "Range fetch triggered",
          `${response.data?.triggered_executions.length ?? 0} hourly jobs scheduled`,
        );
        setByRangeJobId("");
        onSuccess(response.data?.triggered_executions?.[0] || "");
        onClose();
      } else {
        showError("Fetch failed", response.message);
      }
    } catch (err) {
      showError(
        "Failed to trigger range fetch",
        (err as Error).message || "Please try again.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [
    byRangeJobId,
    byRangeStartMonth,
    byRangeStartDay,
    byRangeStartHour,
    byRangeEndMonth,
    byRangeEndDay,
    byRangeEndHour,
    user?.user_id,
    success,
    showError,
    onSuccess,
    onClose,
  ]);

  const categoryOptions = [
    { value: "CDR", label: "CDR" },
    { value: "TDR", label: "TDR" },
  ];

  const monthOptions = Array.from({ length: 12 }, (_, i) => ({
    value: String(i + 1),
    label: String(i + 1),
  }));

  const dayOptions = Array.from({ length: 31 }, (_, i) => ({
    value: String(i + 1),
    label: String(i + 1),
  }));

  const hourOptions = Array.from({ length: 24 }, (_, i) => ({
    value: String(i),
    label: String(i).padStart(2, "0"),
  }));

  if (!isOpen || !mode) return null;

  const getModalTitle = () => {
    switch (mode) {
      case "immediate":
        return "Fetch Files Now";
      case "by-time":
        return "Fetch by Time";
      case "by-range":
        return "Fetch by Date Range";
      default:
        return "Fetch Controls";
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
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
          <h2 className={`${tw.textPrimary} text-lg font-semibold`}>
            {getModalTitle()}
          </h2>
          <button
            onClick={onClose}
            className={`${tw.textSecondary} hover:opacity-70 transition-opacity`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {mode === "immediate" && (
            <>
              <div>
                <label
                  className={`block text-sm font-medium ${tw.textPrimary} mb-2`}
                >
                  Job ID <span style={{ color: color.status.danger }}>*</span>
                </label>
                <input
                  type="number"
                  value={jobId}
                  onChange={(e) => setJobId(e.target.value)}
                  placeholder="Enter job ID"
                  className={`w-full px-4 py-2 border ${tw.rounded} text-sm`}
                  style={{ borderColor: color.border.default }}
                  disabled={isLoading}
                />
              </div>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={forceReprocess}
                  onChange={(e) => setForceReprocess(e.target.checked)}
                  className="w-4 h-4 cursor-pointer"
                  disabled={isLoading}
                />
                <span className={`text-sm ${tw.textPrimary}`}>
                  Force Reprocess
                </span>
              </label>
            </>
          )}

          {mode === "by-time" && (
            <>
              <div>
                <label
                  className={`block text-sm font-medium ${tw.textPrimary} mb-2`}
                >
                  Category
                </label>
                <HeadlessSelect
                  options={categoryOptions}
                  value={byTimeCategory}
                  onChange={(v) => setByTimeCategory(v || "CDR")}
                  placeholder="Select category"
                  className="w-full"
                  zIndex={zIndex.modal}
                />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label
                    className={`block text-xs font-medium ${tw.textPrimary} mb-2`}
                  >
                    Month
                  </label>
                  <HeadlessSelect
                    options={monthOptions}
                    value={byTimeMonth}
                    onChange={(v) => setByTimeMonth(v || "1")}
                    placeholder="Month"
                    className="w-full"
                    zIndex={zIndex.modal}
                  />
                </div>
                <div>
                  <label
                    className={`block text-xs font-medium ${tw.textPrimary} mb-2`}
                  >
                    Day
                  </label>
                  <HeadlessSelect
                    options={dayOptions}
                    value={byTimeDay}
                    onChange={(v) => setByTimeDay(v || "1")}
                    placeholder="Day"
                    className="w-full"
                    zIndex={zIndex.modal}
                  />
                </div>
                <div>
                  <label
                    className={`block text-xs font-medium ${tw.textPrimary} mb-2`}
                  >
                    Hour
                  </label>
                  <HeadlessSelect
                    options={hourOptions}
                    value={byTimeHour}
                    onChange={(v) => setByTimeHour(v || "0")}
                    placeholder="Hour"
                    className="w-full"
                    zIndex={zIndex.modal}
                  />
                </div>
              </div>
            </>
          )}

          {mode === "by-range" && (
            <>
              <div>
                <label
                  className={`block text-sm font-medium ${tw.textPrimary} mb-2`}
                >
                  Job ID <span style={{ color: color.status.danger }}>*</span>
                </label>
                <input
                  type="number"
                  value={byRangeJobId}
                  onChange={(e) => setByRangeJobId(e.target.value)}
                  placeholder="Enter job ID"
                  className={`w-full px-4 py-2 border ${tw.rounded} text-sm`}
                  style={{ borderColor: color.border.default }}
                  disabled={isLoading}
                />
              </div>

              <div className="pt-4">
                <p className={`${tw.textSecondary} text-xs mb-3`}>Start Time</p>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label
                      className={`block text-xs font-medium ${tw.textPrimary} mb-2`}
                    >
                      Month
                    </label>
                    <HeadlessSelect
                      options={monthOptions}
                      value={byRangeStartMonth}
                      onChange={(v) => setByRangeStartMonth(v || "1")}
                      placeholder="Month"
                      className="w-full"
                      zIndex={zIndex.modal}
                    />
                  </div>
                  <div>
                    <label
                      className={`block text-xs font-medium ${tw.textPrimary} mb-2`}
                    >
                      Day
                    </label>
                    <HeadlessSelect
                      options={dayOptions}
                      value={byRangeStartDay}
                      onChange={(v) => setByRangeStartDay(v || "1")}
                      placeholder="Day"
                      className="w-full"
                      zIndex={zIndex.modal}
                    />
                  </div>
                  <div>
                    <label
                      className={`block text-xs font-medium ${tw.textPrimary} mb-2`}
                    >
                      Hour
                    </label>
                    <HeadlessSelect
                      options={hourOptions}
                      value={byRangeStartHour}
                      onChange={(v) => setByRangeStartHour(v || "0")}
                      placeholder="Hour"
                      className="w-full"
                      zIndex={zIndex.modal}
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4">
                <p className={`${tw.textSecondary} text-xs mb-3`}>End Time</p>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label
                      className={`block text-xs font-medium ${tw.textPrimary} mb-2`}
                    >
                      Month
                    </label>
                    <HeadlessSelect
                      options={monthOptions}
                      value={byRangeEndMonth}
                      onChange={(v) => setByRangeEndMonth(v || "1")}
                      placeholder="Month"
                      className="w-full"
                      zIndex={zIndex.modal}
                    />
                  </div>
                  <div>
                    <label
                      className={`block text-xs font-medium ${tw.textPrimary} mb-2`}
                    >
                      Day
                    </label>
                    <HeadlessSelect
                      options={dayOptions}
                      value={byRangeEndDay}
                      onChange={(v) => setByRangeEndDay(v || "3")}
                      placeholder="Day"
                      className="w-full"
                      zIndex={zIndex.modal}
                    />
                  </div>
                  <div>
                    <label
                      className={`block text-xs font-medium ${tw.textPrimary} mb-2`}
                    >
                      Hour
                    </label>
                    <HeadlessSelect
                      options={hourOptions}
                      value={byRangeEndHour}
                      onChange={(v) => setByRangeEndHour(v || "23")}
                      placeholder="Hour"
                      className="w-full"
                      zIndex={zIndex.modal}
                    />
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6">
          <button
            onClick={onClose}
            className={`px-4 py-2 ${tw.rounded} text-sm font-medium transition-colors`}
            style={{
              borderWidth: "1px",
              borderColor: color.border.default,
              color: color.text.secondary,
              backgroundColor: "transparent",
            }}
            disabled={isLoading}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = color.surface.cards;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "transparent";
            }}
          >
            Cancel
          </button>
          <button
            onClick={() => {
              if (mode === "immediate") handleFetchImmediate();
              else if (mode === "by-time") handleFetchByTime();
              else if (mode === "by-range") handleFetchByRange();
            }}
            disabled={isLoading}
            className={`px-4 py-2 ${tw.rounded} text-sm font-medium text-white transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed`}
            style={{ backgroundColor: color.primary.action }}
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Fetching...
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                Fetch
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
