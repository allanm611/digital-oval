import { useState, useCallback } from "react";
import Input from '../../../shared/components/ui/Input';
import { Play, Calendar } from "lucide-react";
import { etlService } from "../services/etlService";
import {
  FetchFilesRequest,
  FetchByTimeRequest,
  FetchByRangeRequest,
} from "../types/etl";
import { useToast } from "../../../contexts/ToastContext";
import { extractBackendError } from "../../../shared/utils/errorHandler";;;
import { useAuth } from "../../../contexts/AuthContext";
import { useLanguage } from "../../../contexts/LanguageContext";
import { color, tw } from "../../../shared/utils/utils";
import HeadlessSelect from "../../../shared/components/ui/HeadlessSelect";
import Checkbox from "../../../shared/components/ui/Checkbox";

type FetchMode = "immediate" | "by-time" | "by-range";

export default function EtlFetchControlsPage() {
  const { success, error: showError } = useToast();
  const { user } = useAuth();
  const { t } = useLanguage();

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
      showError(t.etl.validationError, t.etl.jobIdRequired);
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
          t.etl.fetchTriggered,
          `Job ${jobId} executed. ${response.data?.files_processed ?? 0} files processed.`,
        );
        setJobId("");
      } else {
        showError(t.etl.fetchFailed, response.message);
      }
    } catch (err) {
      showError(
        t.etl.failedToTriggerFetch,
        (err as Error).message || t.etl.pleaseRetry,
      );
    } finally {
      setIsLoading(false);
    }
  }, [jobId, forceReprocess, user?.user_id, success, showError, t.etl]);

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
        success(
          t.etl.historicalFetchTriggered,
          `${t.etl.executionIdColon} ${response.data?.execution_id}`,
        );
      } else {
        showError(t.etl.fetchFailed, response.message);
      }
    } catch (err) {
      showError(
        t.etl.failedToTriggerHistoricalFetch,
        (err as Error).message || t.etl.pleaseRetry,
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
    t.etl,
  ]);

  const handleFetchByRange = useCallback(async () => {
    if (!byRangeJobId) {
      showError(t.etl.validationError, t.etl.jobIdRequired);
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
        success(
          t.etl.rangeFetchTriggered,
          `${response.data?.triggered_executions.length ?? 0} hourly jobs scheduled`,
        );
        setByRangeJobId("");
      } else {
        showError(t.etl.fetchFailed, response.message);
      }
    } catch (err) {
      showError(
        t.etl.failedToTriggerRangeFetch,
        (err as Error).message || t.etl.pleaseRetry,
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
    t.etl,
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
    <div className="">
      {/* Header */}
      <div>
        <h1 className={`${tw.mainHeading} ${tw.textPrimary}`}>
          {t.etl.fetchControls}
        </h1>
        <p className={`${tw.textSecondary} -mt-4 text-sm`}>
          {t.etl.fetchControlsDescription}
        </p>
      </div>

      {/* Mode selector */}
      <div className="flex gap-3">
        {[
          { id: "immediate", label: t.etl.fetchNow },
          { id: "by-time", label: t.etl.fetchByTime },
          { id: "by-range", label: t.etl.fetchByRange },
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
            {t.etl.fetchFilesImmediately}
          </h2>
          <div>
            <label
              className={`block text-sm font-medium ${tw.textPrimary} mb-2`}
            >
              {t.etl.jobIdLabel} <span style={{ color: color.status.danger }}>*</span>
            </label>
            <Input
              type="number"
              value={jobId}
              onChange={(value) => setJobId(String(value))}
              placeholder={t.etl.enterJobId}
              className={`w-full px-4 py-2 border ${tw.rounded} text-sm`}
              style={{ borderColor: color.border.default }}
            />
          </div>
          <div
            className="flex items-center gap-2 cursor-pointer"
            onClick={() => setForceReprocess(!forceReprocess)}
          >
            <Checkbox
              id="force-reprocess"
              checked={forceReprocess}
              onChange={() => setForceReprocess(!forceReprocess)}
            />
            <span className={`text-sm ${tw.textPrimary}`}>
              {t.etl.forceReprocessing}
            </span>
          </div>
          <button
            onClick={handleFetchImmediate}
            disabled={isLoading || !jobId}
            className={`w-full inline-flex items-center justify-center gap-2 ${tw.rounded} px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50 disabled:cursor-not-allowed`}
            style={{ backgroundColor: color.primary.action }}
          >
            <Play size={16} />
            {isLoading ? t.etl.processingStatus : t.etl.fetchNow}
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
            {t.etl.fetchFilesForSpecificTime}
          </h2>
          <HeadlessSelect
            label={t.etl.categoryLabel}
            options={categoryOptions}
            value={byTimeCategory}
            onChange={(v) => setByTimeCategory(String(v))}
            placeholder={t.etl.selectCategory}
            className="w-full"
          />
          <div className="grid grid-cols-3 gap-4">
            <HeadlessSelect
              label={t.etl.monthLabel}
              options={monthOptions}
              value={byTimeMonth}
              onChange={(v) => setByTimeMonth(String(v))}
              placeholder={t.etl.monthLabel}
              className="w-full"
            />
            <HeadlessSelect
              label={t.etl.dayLabel}
              options={dayOptions}
              value={byTimeDay}
              onChange={(v) => setByTimeDay(String(v))}
              placeholder={t.etl.dayLabel}
              className="w-full"
            />
            <HeadlessSelect
              label={t.etl.hourLabel}
              options={hourOptions}
              value={byTimeHour}
              onChange={(v) => setByTimeHour(String(v))}
              placeholder={t.etl.hourLabel}
              className="w-full"
            />
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
              {isLoading ? t.etl.processingStatus : t.etl.fetchByTime}
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
            {t.etl.fetchFilesForDateTimeRange}
          </h2>
          <div>
            <label
              className={`block text-sm font-medium ${tw.textPrimary} mb-2`}
            >
              {t.etl.jobIdLabel} <span style={{ color: color.status.danger }}>*</span>
            </label>
            <Input
              type="number"
              value={byRangeJobId}
              onChange={(value) => setByRangeJobId(String(value))}
              placeholder={t.etl.enterJobId}
              className={`w-full px-4 py-2 border ${tw.rounded} text-sm`}
              style={{ borderColor: color.border.default }}
            />
          </div>

          <div>
            <h3 className={`${tw.textPrimary} font-medium text-sm mb-3`}>
              {t.etl.startTime}
            </h3>
            <div className="grid grid-cols-3 gap-4">
              <HeadlessSelect
                label={t.etl.monthLabel}
                options={monthOptions}
                value={byRangeStartMonth}
                onChange={(v) => setByRangeStartMonth(String(v))}
                placeholder={t.etl.monthLabel}
                className="w-full"
              />
              <HeadlessSelect
                label={t.etl.dayLabel}
                options={dayOptions}
                value={byRangeStartDay}
                onChange={(v) => setByRangeStartDay(String(v))}
                placeholder={t.etl.dayLabel}
                className="w-full"
              />
              <HeadlessSelect
                label={t.etl.hourLabel}
                options={hourOptions}
                value={byRangeStartHour}
                onChange={(v) => setByRangeStartHour(String(v))}
                placeholder={t.etl.hourLabel}
                className="w-full"
              />
            </div>
          </div>

          <div>
            <h3 className={`${tw.textPrimary} font-medium text-sm mb-3`}>
              {t.etl.endTime}
            </h3>
            <div className="grid grid-cols-3 gap-4">
              <HeadlessSelect
                label={t.etl.monthLabel}
                options={monthOptions}
                value={byRangeEndMonth}
                onChange={(v) => setByRangeEndMonth(String(v))}
                placeholder={t.etl.monthLabel}
                className="w-full"
              />
              <HeadlessSelect
                label={t.etl.dayLabel}
                options={dayOptions}
                value={byRangeEndDay}
                onChange={(v) => setByRangeEndDay(String(v))}
                placeholder={t.etl.dayLabel}
                className="w-full"
              />
              <HeadlessSelect
                label={t.etl.hourLabel}
                options={hourOptions}
                value={byRangeEndHour}
                onChange={(v) => setByRangeEndHour(String(v))}
                placeholder={t.etl.hourLabel}
                className="w-full"
              />
            </div>
          </div>

          <p className={`${tw.textSecondary} text-xs italic`}>
            {t.etl.maxRangeNote}
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
              {isLoading ? t.etl.processingStatus : t.etl.fetchByRange}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
