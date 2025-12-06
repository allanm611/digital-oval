import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock,
  Activity,
  PlayCircle,
  RefreshCw,
  Ban,
  Archive,
  RotateCcw,
} from "lucide-react";
import { useAuth } from "../../../contexts/AuthContext";
import { jobExecutionService } from "../services/jobExecutionService";
import { JobExecution } from "../types/jobExecution";
import { useToast } from "../../../contexts/ToastContext";
import LoadingSpinner from "../../../shared/components/ui/LoadingSpinner";
import { color, tw } from "../../../shared/utils/utils";

const formatDateTime = (value?: string | null) => {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleString();
  } catch {
    return value;
  }
};

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
    case "queued":
      return "text-yellow-600 bg-yellow-50";
    case "pending":
      return "text-gray-600 bg-gray-50";
    case "aborted":
    case "cancelled":
      return "text-orange-600 bg-orange-50";
    case "timeout":
      return "text-purple-600 bg-purple-50";
    default:
      return "text-gray-600 bg-gray-50";
  }
};

export default function JobExecutionDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { error: showError, success: showToast } = useToast();
  const { user } = useAuth();
  const [execution, setExecution] = useState<JobExecution | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [progress, setProgress] = useState<any>(null);
  const [resourceUsage, setResourceUsage] = useState<any>(null);
  const [runningDuration, setRunningDuration] = useState<number | null>(null);
  const [isTimedOut, setIsTimedOut] = useState<boolean>(false);

  useEffect(() => {
    if (!id) return;

    const fetchExecution = async () => {
      setIsLoading(true);
      try {
        const exec = await jobExecutionService.getJobExecutionById(id);
        setExecution(exec);

        // Fetch additional data if running
        if (exec.execution_status === "running") {
          try {
            const [progressData, resourceData, durationData, timeoutData] =
              await Promise.all([
                jobExecutionService.getExecutionProgress(id).catch(() => null),
                jobExecutionService.getResourceUsage(id).catch(() => null),
                jobExecutionService.getRunningDuration(id).catch(() => null),
                jobExecutionService.isExecutionTimedOut(id).catch(() => null),
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
          "Job Execution",
          err instanceof Error ? err.message : "Failed to load execution"
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchExecution();

    // Poll for updates if running
    if (execution?.execution_status === "running") {
      const interval = setInterval(() => {
        fetchExecution();
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [id, execution?.execution_status, showError]);

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
          Execution not found
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate("/dashboard/job-executions")}
            className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className={`text-2xl font-bold ${tw.textPrimary}`}>
              Job Execution Details
            </h1>
            <p className={`${tw.textSecondary} mt-1 text-sm`}>
              Execution ID: {execution.id.substring(0, 8)}...
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {execution.execution_status === "running" && (
            <button
              onClick={async () => {
                if (
                  !id ||
                  !window.confirm(
                    "Are you sure you want to abort this execution?"
                  )
                )
                  return;
                try {
                  await jobExecutionService.markJobExecutionAborted(id, {
                    reason: "User requested abort",
                  });
                  showToast(
                    "Execution Aborted",
                    "The execution has been aborted"
                  );
                  navigate("/dashboard/job-executions");
                } catch (err) {
                  showError(
                    "Abort Failed",
                    err instanceof Error ? err.message : "Unknown error"
                  );
                }
              }}
              className="inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700"
            >
              <Ban className="h-4 w-4" />
              Abort
            </button>
          )}
          {execution.execution_status === "failure" && user?.user_id && (
            <button
              onClick={async () => {
                if (!window.confirm("Retry this failed execution?")) return;
                try {
                  await jobExecutionService.retryFailedJobExecutions({
                    jobId: execution.job_id,
                    daysBack: 7,
                    userId: user.user_id,
                  });
                  showToast(
                    "Retry Initiated",
                    "Failed executions are being retried"
                  );
                } catch (err) {
                  showError(
                    "Retry Failed",
                    err instanceof Error ? err.message : "Unknown error"
                  );
                }
              }}
              className="inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium text-white"
              style={{ backgroundColor: color.primary.action }}
            >
              <RotateCcw className="h-4 w-4" />
              Retry
            </button>
          )}
          {!execution.archived && (
            <button
              onClick={async () => {
                if (!id || !window.confirm("Archive this execution?")) return;
                try {
                  await jobExecutionService.archiveJobExecution(id);
                  showToast(
                    "Execution Archived",
                    "The execution has been archived"
                  );
                  navigate("/dashboard/job-executions");
                } catch (err) {
                  showError(
                    "Archive Failed",
                    err instanceof Error ? err.message : "Unknown error"
                  );
                }
              }}
              className="inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 hover:bg-gray-50"
            >
              <Archive className="h-4 w-4" />
              Archive
            </button>
          )}
        </div>
      </div>

      {/* Status Card */}
      <div className="rounded-md border border-gray-200 bg-white p-6 shadow-sm">
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
          {execution.sla_breached && (
            <div className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              <span className="text-sm font-medium">SLA Breached</span>
            </div>
          )}
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
        <div className="rounded-md border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Execution Information
          </h3>
          <dl className="space-y-3">
            <div>
              <dt className="text-sm font-medium text-gray-500">
                Execution ID
              </dt>
              <dd className={`mt-1 text-sm font-mono ${tw.textPrimary}`}>
                {execution.id}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Job ID</dt>
              <dd className={`mt-1 text-sm ${tw.textPrimary}`}>
                {execution.job_id}
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
              <dt className="text-sm font-medium text-gray-500">
                Triggered By
              </dt>
              <dd className={`mt-1 text-sm capitalize ${tw.textPrimary}`}>
                {execution.triggered_by || "—"}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Started At</dt>
              <dd className={`mt-1 text-sm ${tw.textPrimary}`}>
                {formatDateTime(execution.started_at)}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">
                Completed At
              </dt>
              <dd className={`mt-1 text-sm ${tw.textPrimary}`}>
                {formatDateTime(execution.completed_at)}
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

        <div className="rounded-md border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            System Information
          </h3>
          <dl className="space-y-3">
            {execution.server_instance && (
              <div>
                <dt className="text-sm font-medium text-gray-500">
                  Server Instance
                </dt>
                <dd className={`mt-1 text-sm ${tw.textPrimary}`}>
                  {execution.server_instance}
                </dd>
              </div>
            )}
            {execution.worker_node_id && (
              <div>
                <dt className="text-sm font-medium text-gray-500">
                  Worker Node ID
                </dt>
                <dd className={`mt-1 text-sm ${tw.textPrimary}`}>
                  {execution.worker_node_id}
                </dd>
              </div>
            )}
            {execution.trace_id && (
              <div>
                <dt className="text-sm font-medium text-gray-500">Trace ID</dt>
                <dd className={`mt-1 text-sm font-mono ${tw.textPrimary}`}>
                  {execution.trace_id}
                </dd>
              </div>
            )}
            {execution.correlation_id && (
              <div>
                <dt className="text-sm font-medium text-gray-500">
                  Correlation ID
                </dt>
                <dd className={`mt-1 text-sm font-mono ${tw.textPrimary}`}>
                  {execution.correlation_id}
                </dd>
              </div>
            )}
            <div>
              <dt className="text-sm font-medium text-gray-500">
                Execution Date
              </dt>
              <dd className={`mt-1 text-sm ${tw.textPrimary}`}>
                {execution.execution_date}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Archived</dt>
              <dd className={`mt-1 text-sm ${tw.textPrimary}`}>
                {execution.archived ? "Yes" : "No"}
              </dd>
            </div>
          </dl>
        </div>
      </div>

      {/* Progress (if running) */}
      {execution.execution_status === "running" && progress && (
        <div className="rounded-md border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Execution Progress
          </h3>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">
                  Steps Completed
                </span>
                <span className="text-sm text-gray-600">
                  {progress.steps_completed || 0} / {progress.steps_total || 0}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div
                  className="bg-blue-600 h-2.5 rounded-full transition-all"
                  style={{
                    width: `${
                      progress.steps_total
                        ? (progress.steps_completed / progress.steps_total) *
                          100
                        : 0
                    }%`,
                  }}
                />
              </div>
            </div>
            {progress.estimated_completion && (
              <div>
                <span className="text-sm font-medium text-gray-700">
                  Estimated Completion:{" "}
                </span>
                <span className="text-sm text-gray-600">
                  {formatDateTime(progress.estimated_completion)}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Resource Usage */}
      {resourceUsage && (
        <div className="rounded-md border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Resource Usage
          </h3>
          <div className="grid gap-4 md:grid-cols-2">
            {resourceUsage.peak_memory_mb !== null && (
              <div>
                <dt className="text-sm font-medium text-gray-500">
                  Peak Memory
                </dt>
                <dd className={`mt-1 text-sm ${tw.textPrimary}`}>
                  {resourceUsage.peak_memory_mb} MB
                </dd>
              </div>
            )}
            {resourceUsage.peak_cpu_percent !== null && (
              <div>
                <dt className="text-sm font-medium text-gray-500">Peak CPU</dt>
                <dd className={`mt-1 text-sm ${tw.textPrimary}`}>
                  {resourceUsage.peak_cpu_percent}%
                </dd>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Error Information */}
      {execution.error_message && (
        <div className="rounded-md border border-red-200 bg-red-50 p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-red-900 mb-4 flex items-center gap-2">
            <XCircle className="h-5 w-5" />
            Error Information
          </h3>
          <dl className="space-y-3">
            <div>
              <dt className="text-sm font-medium text-red-700">
                Error Message
              </dt>
              <dd className={`mt-1 text-sm ${tw.textPrimary}`}>
                {execution.error_message}
              </dd>
            </div>
            {execution.error_code && (
              <div>
                <dt className="text-sm font-medium text-red-700">Error Code</dt>
                <dd className={`mt-1 text-sm ${tw.textPrimary}`}>
                  {execution.error_code}
                </dd>
              </div>
            )}
            {execution.error_step_id && (
              <div>
                <dt className="text-sm font-medium text-red-700">
                  Failed Step ID
                </dt>
                <dd className={`mt-1 text-sm ${tw.textPrimary}`}>
                  {execution.error_step_id}
                </dd>
              </div>
            )}
          </dl>
        </div>
      )}

      {/* Metrics */}
      {(execution.rows_processed !== null ||
        execution.rows_read !== null ||
        execution.steps_total !== null) && (
        <div className="rounded-md border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Processing Metrics
          </h3>
          <div className="grid gap-4 md:grid-cols-3">
            {execution.rows_read !== null && (
              <div>
                <dt className="text-sm font-medium text-gray-500">Rows Read</dt>
                <dd className={`mt-1 text-sm ${tw.textPrimary}`}>
                  {execution.rows_read.toLocaleString()}
                </dd>
              </div>
            )}
            {execution.rows_processed !== null && (
              <div>
                <dt className="text-sm font-medium text-gray-500">
                  Rows Processed
                </dt>
                <dd className={`mt-1 text-sm ${tw.textPrimary}`}>
                  {execution.rows_processed.toLocaleString()}
                </dd>
              </div>
            )}
            {execution.steps_total !== null && (
              <div>
                <dt className="text-sm font-medium text-gray-500">
                  Total Steps
                </dt>
                <dd className={`mt-1 text-sm ${tw.textPrimary}`}>
                  {execution.steps_total}
                </dd>
              </div>
            )}
            {execution.steps_completed !== null && (
              <div>
                <dt className="text-sm font-medium text-gray-500">
                  Steps Completed
                </dt>
                <dd className={`mt-1 text-sm ${tw.textPrimary}`}>
                  {execution.steps_completed}
                </dd>
              </div>
            )}
            {execution.data_quality_score !== null && (
              <div>
                <dt className="text-sm font-medium text-gray-500">
                  Data Quality Score
                </dt>
                <dd className={`mt-1 text-sm ${tw.textPrimary}`}>
                  {execution.data_quality_score}%
                </dd>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
