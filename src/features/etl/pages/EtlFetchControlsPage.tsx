import { useState, useCallback } from "react";
import { Play, Calendar } from "lucide-react";
import { etlService } from "../services/etlService";
import {
  FetchFilesRequest,
  FetchByTimeRequest,
  FetchByRangeRequest,
} from "../types/etl";
import { useToast } from "../../../contexts/ToastContext";
import { useAuth } from "../../../contexts/AuthContext";
import { color, tw } from "../../../shared/utils/utils";
import HeadlessSelect from "../../../shared/components/ui/HeadlessSelect";

type FetchMode = "immediate" | "by-time" | "by-range";

export default function EtlFetchControlsPage() {
  const { success, error: showError } = useToast();
  const { user } = useAuth();

  const [fetchMode, setFetchMode] = useState<FetchMode>("immediate");
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
  }, [jobId, forceReprocess, user?.user_id, success, showError]);

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className={`${tw.mainHeading} ${tw.textPrimary}`}>
          ETL Fetch Controls
        </h1>
        <p className={`${tw.textSecondary} mt-2 text-sm`}>
          Trigger ETL file fetching with various options and schedules.
        </p>
      </div>

      {/* Mode selector */}
      <div className="flex gap-3">
        {[
          { id: "immediate", label: "Fetch Now" },
          { id: "by-time", label: "Fetch by Time" },
          { id: "by-range", label: "Fetch by Range" },
        ].map((mode) => (
          <button
            key={mode.id}
            onClick={() => setFetchMode(mode.id as FetchMode)}
            className={`${tw.rounded} px-4 py-2 text-sm font-medium transition-colors`}
            style={{
              backgroundColor:
                fetchMode === mode.id
                  ? color.primary.action
                  : color.surface.cards,
              color: fetchMode === mode.id ? "white" : color.text.primary,
              border: `1px solid ${color.border.default}`,
            }}
          >
            {mode.label}
          </button>
        ))}
      </div>

      {/* Immediate Fetch */}
      {fetchMode === "immediate" && (
        <div
          className={`${tw.rounded} border p-6 space-y-4`}
          style={{
            borderColor: color.border.default,
            backgroundColor: color.surface.cards,
          }}
        >
          <h2 className={`${tw.textPrimary} font-semibold`}>
            Fetch Files Immediately
          </h2>
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
            />
          </div>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={forceReprocess}
              onChange={(e) => setForceReprocess(e.target.checked)}
              className="w-4 h-4"
            />
            <span className={`text-sm ${tw.textPrimary}`}>
              Force reprocessing
            </span>
          </label>
          <button
            onClick={handleFetchImmediate}
            disabled={isLoading || !jobId}
            className={`w-full inline-flex items-center justify-center gap-2 ${tw.rounded} px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50 disabled:cursor-not-allowed`}
            style={{ backgroundColor: color.primary.action }}
          >
            <Play size={16} />
            {isLoading ? "Processing..." : "Fetch Now"}
          </button>
        </div>
      )}

      {/* By-Time Fetch */}
      {fetchMode === "by-time" && (
        <div
          className={`${tw.rounded} border p-6 space-y-4`}
          style={{
            borderColor: color.border.default,
            backgroundColor: color.surface.cards,
          }}
        >
          <h2 className={`${tw.textPrimary} font-semibold`}>
            Fetch Files for Specific Time
          </h2>
          <div>
            <label
              className={`block text-sm font-medium ${tw.textPrimary} mb-2`}
            >
              Category
            </label>
            <HeadlessSelect
              options={categoryOptions}
              value={byTimeCategory}
              onChange={(v) => setByTimeCategory(String(v))}
              placeholder="Select category"
            />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label
                className={`block text-sm font-medium ${tw.textPrimary} mb-2`}
              >
                Month
              </label>
              <HeadlessSelect
                options={monthOptions}
                value={byTimeMonth}
                onChange={(v) => setByTimeMonth(String(v))}
                placeholder="Month"
              />
            </div>
            <div>
              <label
                className={`block text-sm font-medium ${tw.textPrimary} mb-2`}
              >
                Day
              </label>
              <HeadlessSelect
                options={dayOptions}
                value={byTimeDay}
                onChange={(v) => setByTimeDay(String(v))}
                placeholder="Day"
              />
            </div>
            <div>
              <label
                className={`block text-sm font-medium ${tw.textPrimary} mb-2`}
              >
                Hour
              </label>
              <HeadlessSelect
                options={hourOptions}
                value={byTimeHour}
                onChange={(v) => setByTimeHour(String(v))}
                placeholder="Hour"
              />
            </div>
          </div>
          <div className="flex justify-center">
            <button
              onClick={handleFetchByTime}
              disabled={isLoading}
              className={`inline-flex items-center justify-center gap-2 ${tw.rounded} px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50 disabled:cursor-not-allowed`}
              style={{
                backgroundColor: color.primary.action,
                minWidth: "220px",
              }}
            >
              <Calendar size={16} />
              {isLoading ? "Processing..." : "Fetch by Time"}
            </button>
          </div>
        </div>
      )}

      {/* By-Range Fetch */}
      {fetchMode === "by-range" && (
        <div
          className={`${tw.rounded} border p-6 space-y-4`}
          style={{
            borderColor: color.border.default,
            backgroundColor: color.surface.cards,
          }}
        >
          <h2 className={`${tw.textPrimary} font-semibold`}>
            Fetch Files for Date/Time Range
          </h2>
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
            />
          </div>

          <div>
            <h3 className={`${tw.textPrimary} font-medium text-sm mb-3`}>
              Start Time
            </h3>
            <div className="grid grid-cols-3 gap-4">
              <HeadlessSelect
                options={monthOptions}
                value={byRangeStartMonth}
                onChange={(v) => setByRangeStartMonth(String(v))}
                placeholder="Month"
              />
              <HeadlessSelect
                options={dayOptions}
                value={byRangeStartDay}
                onChange={(v) => setByRangeStartDay(String(v))}
                placeholder="Day"
              />
              <HeadlessSelect
                options={hourOptions}
                value={byRangeStartHour}
                onChange={(v) => setByRangeStartHour(String(v))}
                placeholder="Hour"
              />
            </div>
          </div>

          <div>
            <h3 className={`${tw.textPrimary} font-medium text-sm mb-3`}>
              End Time
            </h3>
            <div className="grid grid-cols-3 gap-4">
              <HeadlessSelect
                options={monthOptions}
                value={byRangeEndMonth}
                onChange={(v) => setByRangeEndMonth(String(v))}
                placeholder="Month"
              />
              <HeadlessSelect
                options={dayOptions}
                value={byRangeEndDay}
                onChange={(v) => setByRangeEndDay(String(v))}
                placeholder="Day"
              />
              <HeadlessSelect
                options={hourOptions}
                value={byRangeEndHour}
                onChange={(v) => setByRangeEndHour(String(v))}
                placeholder="Hour"
              />
            </div>
          </div>

          <p className={`${tw.textSecondary} text-xs italic`}>
            Note: Maximum range is 72 hours (3 days)
          </p>

          <div className="flex justify-center">
            <button
              onClick={handleFetchByRange}
              disabled={isLoading || !byRangeJobId}
              className={`inline-flex items-center justify-center gap-2 ${tw.rounded} px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50 disabled:cursor-not-allowed`}
              style={{
                backgroundColor: color.primary.action,
                minWidth: "220px",
              }}
            >
              <Calendar size={16} />
              {isLoading ? "Processing..." : "Fetch by Range"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
