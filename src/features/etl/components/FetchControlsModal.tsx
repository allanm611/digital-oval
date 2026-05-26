import { useState, useCallback, useEffect } from "react";
import { X, Play, Calendar } from "lucide-react";
import { etlService } from "../services/etlService";
import {
  FetchFilesRequest,
  FetchByTimeRequest,
  FetchByRangeRequest,
} from "../types/etl";
import { useToast } from "../../../contexts/ToastContext";
import { useAuth } from "../../../contexts/AuthContext";
import { extractBackendError } from "../../../shared/utils/errorHandler";;;
import { color, tw, zIndex, button, getButtonStyles } from "../../../shared/utils/utils";
import HeadlessSelect from "../../../shared/components/ui/HeadlessSelect";
import { scheduledJobService } from "../../jobs/services/scheduledJobService";
import { ScheduledJob } from "../../jobs/types/scheduledJob";
import FetchSummaryModal from "./FetchSummaryModal";
import Checkbox from "../../../shared/components/ui/Checkbox";

type FetchMode = "immediate" | "by-time" | "by-range";

interface FetchControlsModalProps {
  mode: FetchMode | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (
    executionId: string,
    timeFilter?: { category: string; month: string; day: string; hour: string },
  ) => void;
}

export default function FetchControlsModal({
  mode,
  isOpen,
  onClose,
  onSuccess,
}: FetchControlsModalProps) {
  const { success, error: toastError } = useToast();

  // Wrapper to bypass silent mode for ETL errors
  const showError = useCallback((title: string, message: string) => {
    toastError(title, message, true); // true = bypassSilentMode
  }, [toastError]);
  const { user } = useAuth();

  const [isLoading, setIsLoading] = useState(false);
  const [scheduledJobs, setScheduledJobs] = useState<ScheduledJob[]>([]);
  const [isLoadingJobs, setIsLoadingJobs] = useState(false);

  // Summary modal state
  const [showSummary, setShowSummary] = useState(false);
  const [summaryData, setSummaryData] = useState<{
    executionId?: string;
    jobId?: number;
    filesProcessed?: number;
    triggeredCount?: number;
    failedSlots?: number;
    timeRange?: string;
  }>({});

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
        setSummaryData({
          executionId: response.data?.execution_id,
          jobId: response.data?.job_id,
          filesProcessed: response.data?.files_processed,
        });
        setShowSummary(true);
        setJobId("");
        setForceReprocess(false);
      } else {
        showError("Fetch failed", response.message);
      }
    } catch (err) {
      // Extract error message from backend response
      let errorMessage = "Failed to trigger fetch. Please try again.";

      if (err instanceof Error) {
        errorMessage = err.message;
      }

      showError("Fetch failed", extractBackendError(error, "Fetch failed. Please try again."));
    } finally {
      setIsLoading(false);
    }
  }, [
    jobId,
    forceReprocess,
    user?.user_id,
    showError,
  ]);

  const handleFetchByTime = useCallback(async () => {
    setIsLoading(true);
    try {
      const payload: FetchByTimeRequest = {
        file_category: byTimeCategory,
        month: byTimeMonth,
        day: byTimeDay,
        hour: byTimeHour,
        user_id: user?.user_id ?? null,
      };

      const response = await etlService.fetchByTime(payload);

      if (response.success) {
        setSummaryData({
          executionId: response.data?.execution_id,
          timeRange: `${byTimeMonth}/${byTimeDay} ${String(byTimeHour).padStart(2, "0")}:00 (${byTimeCategory})`,
        });
        setShowSummary(true);
      } else {
        showError("Fetch failed", response.message);
      }
    } catch (err) {
      // Extract error message from backend response
      let errorMessage = "Failed to trigger historical fetch. Please try again.";

      if (err instanceof Error) {
        errorMessage = err.message;
      }

      showError("Fetch failed", extractBackendError(error, "Fetch failed. Please try again."));
    } finally {
      setIsLoading(false);
    }
  }, [
    byTimeCategory,
    byTimeMonth,
    byTimeDay,
    byTimeHour,
    user?.user_id,
    showError,
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
        user_id: user?.user_id ?? null,
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
        setSummaryData({
          triggeredCount: response.data?.triggered_executions?.length ?? 0,
          failedSlots: response.data?.failed_slots?.length ?? 0,
        });
        setShowSummary(true);
        setByRangeJobId("");
      } else {
        showError("Fetch failed", response.message);
      }
    } catch (err) {
      // Extract error message from backend response
      let errorMessage = "Failed to trigger range fetch. Please try again.";

      if (err instanceof Error) {
        errorMessage = err.message;
      }

      showError("Fetch failed", extractBackendError(error, "Fetch failed. Please try again."));
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
    showError,
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

  // Load active scheduled jobs when modal opens
  useEffect(() => {
    if (isOpen && (mode === "immediate" || mode === "by-range")) {
      const loadJobs = async () => {
        setIsLoadingJobs(true);
        try {
          const response = await scheduledJobService.getActiveJobs(true);
          setScheduledJobs(response.data || []);
        } catch (err) {
          showError("Failed to load scheduled jobs", extractBackendError(err, "Failed to load scheduled jobs. Please try again."));
        } finally {
          setIsLoadingJobs(false);
        }
      };
      loadJobs();
    }
  }, [isOpen, mode, showError]);

  const handleSummaryClose = () => {
    setShowSummary(false);
    onClose();
  };

  const handleViewExecutions = () => {
    onSuccess(summaryData.executionId || "");
    setShowSummary(false);
    onClose();
  };

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

  if (showSummary) {
    return (
      <FetchSummaryModal
        isOpen={showSummary}
        onClose={handleSummaryClose}
        onViewExecutions={handleViewExecutions}
        mode={mode}
        data={summaryData}
      />
    );
  }

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
                  Scheduled Job <span style={{ color: color.status.danger }}>*</span>
                </label>
                {isLoadingJobs ? (
                  <div className="text-sm text-gray-500">Loading jobs...</div>
                ) : (
                  <HeadlessSelect
                    options={scheduledJobs.map((job) => ({
                      value: String(job.id),
                      label: `${job.name} (ID: ${job.id})`,
                    }))}
                    value={jobId}
                    onChange={(v) => setJobId(v || "")}
                    placeholder="Select a scheduled job"
                    className="w-full"
                    zIndex={zIndex.modal}
                  />
                )}
              </div>
              <div
                className="flex items-center gap-2 cursor-pointer"
                onClick={() => !isLoading && setForceReprocess(!forceReprocess)}
              >
                <Checkbox
                  id="force-reprocess"
                  checked={forceReprocess}
                  onChange={() => !isLoading && setForceReprocess(!forceReprocess)}
                  disabled={isLoading}
                />
                <span className={`text-sm ${tw.textPrimary}`}>Force Reprocess</span>
              </div>
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
                  onChange={(v) => setByTimeCategory(String(v || "CDR"))}
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
                    onChange={(v) => setByTimeMonth(String(v || "1"))}
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
                    onChange={(v) => setByTimeDay(String(v || "1"))}
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
                    onChange={(v) => setByTimeHour(String(v || "0"))}
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
                  Scheduled Job <span style={{ color: color.status.danger }}>*</span>
                </label>
                {isLoadingJobs ? (
                  <div className="text-sm text-gray-500">Loading jobs...</div>
                ) : (
                  <HeadlessSelect
                    options={scheduledJobs.map((job) => ({
                      value: String(job.id),
                      label: `${job.name} (ID: ${job.id})`,
                    }))}
                    value={byRangeJobId}
                    onChange={(v) => setByRangeJobId(v || "")}
                    placeholder="Select a scheduled job"
                    className="w-full"
                    zIndex={zIndex.modal}
                  />
                )}
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
                      onChange={(v) => setByRangeStartMonth(String(v || "1"))}
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
                      onChange={(v) => setByRangeStartDay(String(v || "1"))}
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
                      onChange={(v) => setByRangeStartHour(String(v || "0"))}
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
                      onChange={(v) => setByRangeEndMonth(String(v || "1"))}
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
                      onChange={(v) => setByRangeEndDay(String(v || "3"))}
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
                      onChange={(v) => setByRangeEndHour(String(v || "23"))}
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
            className="inline-flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            style={getButtonStyles(button.action)}
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
