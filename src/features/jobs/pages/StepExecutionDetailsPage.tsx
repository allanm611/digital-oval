import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw,
  Ban,
  RotateCcw,
  PlayCircle,
  AlertTriangle,
} from "lucide-react";
import { useAuth } from "../../../contexts/AuthContext";
import { extractBackendError } from "../../../shared/utils/errorHandler";;;
import { useLanguage } from "../../../contexts/LanguageContext";
import { stepExecutionService } from "../services/stepExecutionService";
import { StepExecution } from "../types/stepExecution";
import { ExecutionProgress, ResourceUsage } from "../types/jobExecution";
import { useToast } from "../../../contexts/ToastContext";
import LoadingSpinner from "../../../shared/components/ui/LoadingSpinner";
import BackButton from "../../../shared/components/ui/BackButton";
import DateFormatter from "../../../shared/components/DateFormatter";
import { color, tw } from "../../../shared/utils/utils";
import { ENABLE_JOB_EXECUTION_WRITES_FOR_ALL } from "../../../shared/utils/featureFlags";

const formatDuration = (seconds: number | null) => {
  if (!seconds) return "—";
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return `${hours}h ${minutes}m`;
};

const getStatusColor = (status: string) => {
  switch (status.toLowerCase()) {
    case "success":
      return "text-green-600 bg-green-50";
    case "failure":
      return "text-red-600 bg-red-50";
    case "running":
      return "text-blue-600 bg-blue-50";
    case "pending":
      return "text-gray-600 bg-gray-50";
    case "timeout":
      return "text-orange-600 bg-orange-50";
    case "skipped":
      return "text-yellow-600 bg-yellow-50";
    case "cancelled":
      return "text-purple-600 bg-purple-50";
    default:
      return "text-gray-600 bg-gray-50";
  }
};

export default function StepExecutionDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { error: showError, success: showToast } = useToast();
  const { t } = useLanguage();
  const { user } = useAuth();
  const canWrite =
    ENABLE_JOB_EXECUTION_WRITES_FOR_ALL || user?.role === "admin";
  const [execution, setExecution] = useState<StepExecution | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [progress, setProgress] = useState<ExecutionProgress | null>(null);
  const [resourceUsage, setResourceUsage] = useState<ResourceUsage | null>(
    null
  );
  const [runningDuration, setRunningDuration] = useState<number | null>(null);
  const [isTimedOut, setIsTimedOut] = useState<boolean>(false);

  useEffect(() => {
    if (!id) return;

    const fetchExecution = async () => {
      setIsLoading(true);
      try {
        const exec = await stepExecutionService.getStepExecutionById(id, true);
        setExecution(exec);

        // Fetch additional data if running
        if (exec.execution_status === "running") {
          try {
            const [progressData, resourceData, durationData, timeoutData] =
              await Promise.all([
                stepExecutionService
                  .getStepExecutionProgress(id)
                  .catch(() => null),
                stepExecutionService.getResourceUsage(id).catch(() => null),
                stepExecutionService.getRunningDuration(id).catch(() => null),
                stepExecutionService
                  .isStepExecutionTimedOut(id)
                  .catch(() => null),
              ]);
            setProgress(progressData);
            setResourceUsage(resourceData);
            if (durationData) {
              setRunningDuration(durationData.duration_seconds);
            }
            if (timeoutData) {
              setIsTimedOut(timeoutData.is_timed_out);
            }
          } catch (err) {
            console.error("Failed to fetch execution details:", err);
          }
        }
      } catch (err) {
        showError(
          t("stepExecution.title", "Step Execution"),
          err instanceof Error ? err.message : t("stepExecution.loadFailed", "Failed to load execution")
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchExecution();

    // Poll for updates if running
    const interval =
      execution?.execution_status === "running"
        ? setInterval(() => {
            fetchExecution();
          }, 5000)
        : null;

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [id, execution?.execution_status, showError, t]);

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <LoadingSpinner />
      </div>
    );
  }

  if (!execution) {
    return (
      <div className="py-16 text-center">
        <AlertCircle className="mx-auto mb-4 h-12 w-12 text-gray-300" />
        <p className={`text-lg font-semibold ${tw.textPrimary}`}>
          Step Execution not found
        </p>
      </div>
    );
  }

  return (
    <div className="">
      <div className="flex items-center justify-between">
        <BackButton showBreadcrumb={true} currentLabel="Step Execution Details" />
        <div className="flex gap-2">
          {canWrite && execution.execution_status === "running" && (
            <button
              onClick={async () => {
                if (
                  !id ||
                  !window.confirm(
                    "Are you sure you want to abort this step execution?"
                  )
                )
                  return;
                try {
                  await stepExecutionService.markStepExecutionAborted(id);
                  showToast(
                    t("stepExecution.aborted", "Step Execution Aborted"),
                    t("stepExecution.abortedSuccess", "The step execution has been aborted")
                  );
                  navigate("/dashboard/step-executions");
                } catch (err) {
                  showError(
                    t("stepExecution.abortFailed", "Abort Failed"),
                    err instanceof Error ? err.message : t.common.error || "Unknown error"
                  );
                }
              }}
              className={`inline-flex items-center gap-2 ${tw.rounded} px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700`}
            >
              <Ban className="h-4 w-4" />
              Abort
            </button>
          )}
          {canWrite && execution.execution_status === "failure" && (
            <button
              onClick={async () => {
                if (!window.confirm(t("stepExecution.retryConfirm", "Retry this failed step execution?")))
                  return;
                try {
                  await stepExecutionService.retryFailedSteps({
                    job_execution_id: execution.job_execution_id,
                    step_ids: [execution.step_id],
                    userId: user?.user_id,
                  });
                  showToast(
                    t("stepExecution.retryInitiated", "Retry Initiated"),
                    t("stepExecution.retrySuccess", "Failed step execution is being retried")
                  );
                  navigate("/dashboard/step-executions");
                } catch (err) {
                  showError(
                    t("stepExecution.retryFailed", "Retry Failed"),
                    err instanceof Error ? err.message : t.common.error || "Unknown error"
                  );
                }
              }}
              className={`inline-flex items-center gap-2 ${tw.rounded} px-4 py-2 text-sm font-medium text-white`}
              style={{ backgroundColor: color.primary.action }}
            >
              <RotateCcw className="h-4 w-4" />
              Retry
            </button>
          )}
        </div>
      </div>

      {/* Status Card */}
      <div
        className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span
              className={`inline-flex items-center rounded-full px-4 py-2 text-sm font-medium ${getStatusColor(
                execution.execution_status
              )}`}
            >
              {execution.execution_status}
            </span>
            {execution.execution_status === "running" && (
              <div className="flex items-center gap-2 text-blue-600">
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span className="text-sm">Running...</span>
              </div>
            )}
          </div>
          {isTimedOut && (
            <div className="flex items-center gap-2 text-purple-600">
              <Clock className="h-5 w-5" />
              <span className="text-sm font-medium">Timed Out</span>
            </div>
          )}
        </div>
      </div>

      {/* Main Info Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        <div
          className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm`}
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Execution Information
          </h3>
          <dl className="space-y-3">
            <div>
              <dt className="text-sm font-medium text-gray-500">
                Step Execution ID
              </dt>
              <dd className={`mt-1 text-sm font-mono ${tw.textPrimary}`}>
                {execution.id}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">
                Job Execution ID
              </dt>
              <dd className={`mt-1 text-sm font-mono ${tw.textPrimary}`}>
                <button
                  onClick={() =>
                    navigate(
                      `/dashboard/job-executions/${execution.job_execution_id}`
                    )
                  }
                  className="text-blue-600 hover:text-blue-800 hover:underline"
                >
                  {execution.job_execution_id}
                </button>
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Step ID</dt>
              <dd className={`mt-1 text-sm ${tw.textPrimary}`}>
                {execution.step_id}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Status</dt>
              <dd className="mt-1">
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusColor(
                    execution.execution_status
                  )}`}
                >
                  {execution.execution_status}
                </span>
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Started At</dt>
              <dd className={`mt-1 text-sm ${tw.textPrimary}`}>
                <DateFormatter date={execution.started_at} useUserTimezone includeTime />
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">
                Completed At
              </dt>
              <dd className={`mt-1 text-sm ${tw.textPrimary}`}>
                <DateFormatter date={execution.completed_at} />
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Duration</dt>
              <dd className={`mt-1 text-sm ${tw.textPrimary}`}>
                {execution.execution_status === "running" && runningDuration
                  ? formatDuration(runningDuration)
                  : formatDuration(execution.duration_seconds)}
              </dd>
            </div>
          </dl>
        </div>

        <div
          className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm`}
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Error Information
          </h3>
          <dl className="space-y-3">
            {execution.error_message && (
              <div>
                <dt className="text-sm font-medium text-gray-500">
                  Error Message
                </dt>
                <dd className={`mt-1 text-sm ${tw.textPrimary}`}>
                  {execution.error_message}
                </dd>
              </div>
            )}
            {execution.error_code && (
              <div>
                <dt className="text-sm font-medium text-gray-500">
                  Error Code
                </dt>
                <dd className={`mt-1 text-sm ${tw.textPrimary}`}>
                  {execution.error_code}
                </dd>
              </div>
            )}
            <div>
              <dt className="text-sm font-medium text-gray-500">Created At</dt>
              <dd className={`mt-1 text-sm ${tw.textPrimary}`}>
                <DateFormatter date={execution.created_at} />
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Updated At</dt>
              <dd className={`mt-1 text-sm ${tw.textPrimary}`}>
                <DateFormatter date={execution.updated_at} />
              </dd>
            </div>
          </dl>
        </div>
      </div>

      {/* Progress (if running) */}
      {execution.execution_status === "running" && progress && (
        <div
          className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm`}
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Execution Progress
          </h3>
          <div className="space-y-4">
            {progress.percentage_complete !== undefined && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">
                    Progress
                  </span>
                  <span className="text-sm text-gray-600">
                    {progress.percentage_complete}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div
                    className="bg-blue-600 h-2.5 rounded-full transition-all"
                    style={{
                      width: `${progress.percentage_complete}%`,
                    }}
                  ></div>
                </div>
              </div>
            )}
            {progress.estimated_completion && (
              <div>
                <dt className="text-sm font-medium text-gray-500">
                  Estimated Completion
                </dt>
                <dd className={`mt-1 text-sm ${tw.textPrimary}`}>
                  <DateFormatter date={progress.estimated_completion} />
                </dd>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Resource Usage (if running) */}
      {execution.execution_status === "running" && resourceUsage && (
        <div
          className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm`}
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Resource Usage
          </h3>
          <div className="grid gap-4 md:grid-cols-2">
            {resourceUsage.peak_memory_mb !== undefined && (
              <div>
                <dt className="text-sm font-medium text-gray-500">
                  Peak Memory
                </dt>
                <dd className={`mt-1 text-sm ${tw.textPrimary}`}>
                  {resourceUsage.peak_memory_mb} MB
                </dd>
              </div>
            )}
            {resourceUsage.peak_cpu_percent !== undefined && (
              <div>
                <dt className="text-sm font-medium text-gray-500">
                  Peak CPU Usage
                </dt>
                <dd className={`mt-1 text-sm ${tw.textPrimary}`}>
                  {resourceUsage.peak_cpu_percent}%
                </dd>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Manual Actions (if canWrite) */}
      {canWrite && (
        <div
          className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm`}
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Manual Actions
          </h3>
          <div className="flex flex-wrap gap-2">
            {execution.execution_status === "pending" && (
              <button
                onClick={async () => {
                  if (!id) return;
                  try {
                    await stepExecutionService.markStepExecutionStarted(id);
                    showToast(
                      t("stepExecution.started", "Step Execution Started"),
                      t("stepExecution.startedSuccess", "The step execution has been marked as started")
                    );
                    window.location.reload();
                  } catch (err) {
                    showError(
                      t("stepExecution.actionFailed", "Action Failed"),
                      err instanceof Error ? err.message : t.common.error || "Unknown error"
                    );
                  }
                }}
                className={`inline-flex items-center gap-2 ${tw.rounded} px-4 py-2 text-sm font-medium text-white`}
                style={{ backgroundColor: color.primary.action }}
              >
                <PlayCircle className="h-4 w-4" />
                Mark Started
              </button>
            )}
            {execution.execution_status === "running" && (
              <>
                <button
                  onClick={async () => {
                    if (!id) return;
                    try {
                      await stepExecutionService.markStepExecutionCompleted(id);
                      showToast(
                        t("stepExecution.completed", "Step Execution Completed"),
                        t("stepExecution.completedSuccess", "The step execution has been marked as completed")
                      );
                      window.location.reload();
                    } catch (err) {
                      showError(
                        t("stepExecution.actionFailed", "Action Failed"),
                        err instanceof Error ? err.message : t.common.error || "Unknown error"
                      );
                    }
                  }}
                  className={`inline-flex items-center gap-2 ${tw.rounded} px-4 py-2 text-sm font-medium text-white`}
                  style={{ backgroundColor: color.primary.action }}
                >
                  <CheckCircle className="h-4 w-4" />
                  Mark Completed
                </button>
                <button
                  onClick={async () => {
                    if (!id) return;
                    try {
                      await stepExecutionService.markStepExecutionFailed(id, {
                        error_message: t("stepExecution.manuallyMarked", "Manually marked as failed"),
                      });
                      showToast(
                        t("stepExecution.failed", "Step Execution Failed"),
                        t("stepExecution.failedSuccess", "The step execution has been marked as failed")
                      );
                      window.location.reload();
                    } catch (err) {
                      showError(
                        t("stepExecution.actionFailed", "Action Failed"),
                        err instanceof Error ? err.message : t.common.error || "Unknown error"
                      );
                    }
                  }}
                  className={`inline-flex items-center gap-2 ${tw.rounded} px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700`}
                >
                  <XCircle className="h-4 w-4" />
                  Mark Failed
                </button>
                <button
                  onClick={async () => {
                    if (!id) return;
                    try {
                      await stepExecutionService.markStepExecutionTimeout(id);
                      showToast(
                        t("stepExecution.timedOut", "Step Execution Timed Out"),
                        t("stepExecution.timedOutSuccess", "The step execution has been marked as timed out")
                      );
                      window.location.reload();
                    } catch (err) {
                      showError(
                        t("stepExecution.actionFailed", "Action Failed"),
                        err instanceof Error ? err.message : t.common.error || "Unknown error"
                      );
                    }
                  }}
                  className={`inline-flex items-center gap-2 ${tw.rounded} px-4 py-2 text-sm font-medium text-white bg-orange-600 hover:bg-orange-700`}
                >
                  <AlertTriangle className="h-4 w-4" />
                  Mark Timeout
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
