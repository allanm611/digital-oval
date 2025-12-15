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
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";
import { useAuth } from "../../../contexts/AuthContext";
import { jobExecutionService } from "../services/jobExecutionService";
import { JobExecution } from "../types/jobExecution";
import { useToast } from "../../../contexts/ToastContext";
import LoadingSpinner from "../../../shared/components/ui/LoadingSpinner";
import { color, tw } from "../../../shared/utils/utils";
import { ENABLE_JOB_EXECUTION_WRITES_FOR_ALL } from "../../../shared/utils/featureFlags";

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

const COLORS = ["#3b8169", "#ef4444", "#f59e0b", "#3b82f6", "#8b5cf6"];

type ChartTooltipEntry = {
  color?: string;
  name?: string;
  value?: number | string;
};

type ChartTooltipProps = {
  active?: boolean;
  label?: string;
  payload?: ChartTooltipEntry[];
};

const CustomTooltip = ({ active, payload, label }: ChartTooltipProps) => {
  if (!active || !payload?.length) {
    return null;
  }

  return (
    <div
      className={`${tw.rounded} border border-gray-200 bg-white p-3 shadow-lg`}
    >
      <p className="mb-2 text-sm font-semibold text-gray-900">{label}</p>
      {payload.map((entry, idx) => (
        <div
          key={idx}
          className="flex items-center justify-between gap-4 text-sm text-gray-600"
        >
          <span className="flex items-center gap-2">
            <span
              className="h-3 w-3 rounded-full"
              style={{
                backgroundColor: entry.color || color.primary.accent,
              }}
            />
            {entry.name || "Count"}
          </span>
          <span className="font-semibold text-gray-900">
            {typeof entry.value === "number"
              ? entry.value.toLocaleString()
              : entry.value}
          </span>
        </div>
      ))}
    </div>
  );
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
  const canWrite =
    ENABLE_JOB_EXECUTION_WRITES_FOR_ALL || user?.role === "admin";
  const [execution, setExecution] = useState<JobExecution | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [progress, setProgress] = useState<any>(null);
  const [resourceUsage, setResourceUsage] = useState<any>(null);
  const [runningDuration, setRunningDuration] = useState<number | null>(null);
  const [isTimedOut, setIsTimedOut] = useState<boolean>(false);

  // Job Analytics state
  const [executionDistribution, setExecutionDistribution] = useState<any[]>([]);
  const [executionComparison, setExecutionComparison] = useState<any>(null);
  const [completionForecast, setCompletionForecast] = useState<any[]>([]);
  const [executionHeatmap, setExecutionHeatmap] = useState<any>(null);
  const [slaPrediction, setSlaPrediction] = useState<any>(null);
  const [executionTimeline, setExecutionTimeline] = useState<any[]>([]);
  const [dailySummary, setDailySummary] = useState<any[]>([]);
  const [isLoadingAnalytics, setIsLoadingAnalytics] = useState(false);

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

  // Fetch job analytics when execution is loaded
  useEffect(() => {
    if (!execution?.job_id) return;

    const fetchJobAnalytics = async () => {
      setIsLoadingAnalytics(true);
      try {
        const jobIdNum = Number(execution.job_id);
        if (isNaN(jobIdNum)) {
          console.error("Invalid job_id:", execution.job_id);
          return;
        }

        // Calculate startDate (30 days ago)
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 30);
        const startDateStr = startDate.toISOString().split("T")[0]; // YYYY-MM-DD format

        const [
          distributionData,
          comparisonData,
          forecastData,
          heatmapData,
          predictionData,
          timelineData,
          summaryData,
        ] = await Promise.all([
          jobExecutionService
            .getExecutionDistribution({ startDate: startDateStr })
            .catch(() => []),
          jobExecutionService
            .getExecutionComparison(jobIdNum, { currentPeriodDays: 7 })
            .catch(() => null),
          jobExecutionService.getCompletionForecast(jobIdNum).catch(() => []),
          jobExecutionService.getExecutionHeatmap(jobIdNum).catch(() => null),
          jobExecutionService.getSLAPrediction(jobIdNum).catch(() => null),
          jobExecutionService
            .getExecutionTimeline(jobIdNum, { limit: 20 })
            .catch(() => []),
          jobExecutionService
            .getDailySummary(jobIdNum, { daysBack: 30 })
            .catch(() => []),
        ]);

        setExecutionDistribution(distributionData || []);
        setExecutionComparison(comparisonData);
        setCompletionForecast(forecastData || []);
        setExecutionHeatmap(heatmapData);
        setSlaPrediction(predictionData);
        setExecutionTimeline(timelineData || []);
        setDailySummary(summaryData || []);
      } catch (err) {
        console.error("Failed to fetch job analytics:", err);
      } finally {
        setIsLoadingAnalytics(false);
      }
    };

    fetchJobAnalytics();
  }, [execution?.job_id]);

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
            className={`p-2 ${tw.rounded} text-gray-600 hover:text-gray-900 transition-colors`}
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
          {canWrite && execution.execution_status === "running" && (
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
              className={`inline-flex items-center gap-2 ${tw.rounded} px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700`}
            >
              <Ban className="h-4 w-4" />
              Abort
            </button>
          )}
          {canWrite &&
            execution.execution_status === "failure" &&
            user?.user_id && (
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
                className={`inline-flex items-center gap-2 ${tw.rounded} px-4 py-2 text-sm font-medium text-white`}
                style={{ backgroundColor: color.primary.action }}
              >
                <RotateCcw className="h-4 w-4" />
                Retry
              </button>
            )}
          {canWrite && !execution.archived && (
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
              className={`inline-flex items-center gap-2 ${tw.rounded} px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 hover:bg-gray-50`}
            >
              <Archive className="h-4 w-4" />
              Archive
            </button>
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
              <dd className="mt-1 flex items-center gap-3">
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusColor(
                    execution.execution_status
                  )}`}
                >
                  {execution.execution_status}
                </span>
                {execution.execution_status === "running" && (
                  <div className="flex items-center gap-2 text-blue-600">
                    <RefreshCw className="h-3 w-3 animate-spin" />
                    <span className="text-xs">Running...</span>
                  </div>
                )}
                {execution.sla_breached && (
                  <div className="flex items-center gap-1 text-red-600">
                    <AlertCircle className="h-3 w-3" />
                    <span className="text-xs font-medium">SLA Breached</span>
                  </div>
                )}
                {isTimedOut && (
                  <div className="flex items-center gap-1 text-purple-600">
                    <Clock className="h-3 w-3" />
                    <span className="text-xs font-medium">Timed Out</span>
                  </div>
                )}
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

        <div
          className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm`}
        >
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
        <div
          className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm`}
        >
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
        <div
          className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm`}
        >
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
        <div
          className={`${tw.rounded} border border-red-200 bg-red-50 p-6 shadow-sm`}
        >
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
        <div
          className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm`}
        >
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

      {/* Job Analytics & Insights */}
      {execution.job_id && (
        <div
          className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm`}
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Job Analytics & Insights
          </h3>

          {isLoadingAnalytics ? (
            <div className="flex justify-center py-8">
              <LoadingSpinner />
            </div>
          ) : (
            <div className="space-y-6">
              {/* SLA Prediction */}
              {slaPrediction && (
                <div className="border-b border-gray-200 pb-4">
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">
                    SLA Prediction
                  </h4>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <dt className="text-xs text-gray-500">
                        Predicted Compliance Rate
                      </dt>
                      <dd className="text-lg font-semibold text-gray-900">
                        {(slaPrediction.predicted_compliance_rate || 0).toFixed(
                          1
                        )}
                        %
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs text-gray-500">Confidence</dt>
                      <dd className="text-lg font-semibold text-gray-900">
                        {(slaPrediction.confidence || 0).toFixed(1)}%
                      </dd>
                    </div>
                  </div>
                  {slaPrediction.factors &&
                    slaPrediction.factors.length > 0 && (
                      <div className="mt-3">
                        <dt className="text-xs text-gray-500 mb-1">
                          Key Factors
                        </dt>
                        <ul className="text-xs text-gray-600 space-y-1">
                          {slaPrediction.factors
                            .slice(0, 3)
                            .map((factor: any, idx: number) => (
                              <li key={idx}>
                                • {factor.factor}: {factor.impact}% impact
                              </li>
                            ))}
                        </ul>
                      </div>
                    )}
                </div>
              )}

              {/* Execution Comparison */}
              {executionComparison && (
                <div className="border-b border-gray-200 pb-4">
                  <h4 className="text-sm font-semibold text-gray-700 mb-4">
                    Period Comparison (Current vs Previous)
                  </h4>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart
                      data={[
                        {
                          period: "Current",
                          total:
                            executionComparison.current_period
                              ?.total_executions || 0,
                          successful:
                            executionComparison.current_period
                              ?.successful_executions || 0,
                          failed:
                            executionComparison.current_period
                              ?.failed_executions || 0,
                        },
                        {
                          period: "Previous",
                          total:
                            executionComparison.previous_period
                              ?.total_executions || 0,
                          successful:
                            executionComparison.previous_period
                              ?.successful_executions || 0,
                          failed:
                            executionComparison.previous_period
                              ?.failed_executions || 0,
                        },
                      ]}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="period" />
                      <YAxis />
                      <Tooltip
                        content={<CustomTooltip />}
                        cursor={{ fill: "transparent" }}
                      />
                      <Legend />
                      <Bar
                        dataKey="successful"
                        fill="#3b8169"
                        name="Successful"
                      />
                      <Bar dataKey="failed" fill="#ef4444" name="Failed" />
                      <Bar dataKey="total" fill="#3b82f6" name="Total" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Completion Forecast */}
              {completionForecast && completionForecast.length > 0 && (
                <div className="border-b border-gray-200 pb-4">
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">
                    Completion Forecast
                  </h4>
                  <div className="space-y-2">
                    {completionForecast
                      .slice(0, 3)
                      .map((forecast: any, idx: number) => (
                        <div key={idx} className="text-sm">
                          <span className="font-medium text-gray-900">
                            {forecast.execution_id?.substring(0, 8)}...
                          </span>
                          <span className="text-gray-600 ml-2">
                            Est: {formatDateTime(forecast.estimated_completion)}
                            ({forecast.confidence?.toFixed(0) || 0}% confidence)
                          </span>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* Execution Timeline */}
              {executionTimeline && executionTimeline.length > 0 && (
                <div className="border-b border-gray-200 pb-4">
                  <h4 className="text-sm font-semibold text-gray-700 mb-4">
                    Recent Execution Timeline (Duration Trend)
                  </h4>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart
                      data={executionTimeline.slice(0, 10).map((item: any) => ({
                        execution: item.execution_id?.substring(0, 8) || "N/A",
                        duration: item.duration_seconds || 0,
                        status: item.status,
                      }))}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="execution" />
                      <YAxis />
                      <Tooltip
                        content={<CustomTooltip />}
                        cursor={{ fill: "transparent" }}
                      />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="duration"
                        stroke="#3b82f6"
                        name="Duration (seconds)"
                        strokeWidth={2}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Daily Summary */}
              {dailySummary && dailySummary.length > 0 && (
                <div className="border-b border-gray-200 pb-4">
                  <h4 className="text-sm font-semibold text-gray-700 mb-4">
                    Daily Summary (Last 30 Days)
                  </h4>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart
                      data={dailySummary.slice(0, 14).map((summary: any) => ({
                        date: summary.date,
                        successful: summary.successful_executions || 0,
                        failed: summary.failed_executions || 0,
                        total: summary.total_executions || 0,
                      }))}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey="date"
                        angle={-45}
                        textAnchor="end"
                        height={80}
                      />
                      <YAxis />
                      <Tooltip
                        content={<CustomTooltip />}
                        cursor={{ fill: "transparent" }}
                      />
                      <Legend />
                      <Bar
                        dataKey="successful"
                        fill="#3b8169"
                        name="Successful"
                      />
                      <Bar dataKey="failed" fill="#ef4444" name="Failed" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Execution Distribution */}
              {executionDistribution && executionDistribution.length > 0 && (
                <div className="border-b border-gray-200 pb-4">
                  <h4 className="text-sm font-semibold text-gray-700 mb-4">
                    Execution Distribution
                  </h4>
                  <div className="grid gap-6 md:grid-cols-2">
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={[
                            {
                              name: "Successful",
                              value: executionDistribution.reduce(
                                (sum: number, d: any) =>
                                  sum + (d.successful || 0),
                                0
                              ),
                            },
                            {
                              name: "Failed",
                              value: executionDistribution.reduce(
                                (sum: number, d: any) => sum + (d.failed || 0),
                                0
                              ),
                            },
                          ]}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) =>
                            `${name}: ${(percent * 100).toFixed(0)}%`
                          }
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {[
                            { name: "Successful", value: 0 },
                            { name: "Failed", value: 0 },
                          ].map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={index === 0 ? "#3b8169" : "#ef4444"}
                            />
                          ))}
                        </Pie>
                        <Tooltip
                          content={<CustomTooltip />}
                          cursor={{ fill: "transparent" }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart
                        data={executionDistribution
                          .slice(0, 10)
                          .map((dist: any) => ({
                            period: dist.period,
                            successful: dist.successful || 0,
                            failed: dist.failed || 0,
                          }))}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="period" />
                        <YAxis />
                        <Tooltip
                          content={<CustomTooltip />}
                          cursor={{ fill: "transparent" }}
                        />
                        <Legend />
                        <Bar
                          dataKey="successful"
                          fill="#3b8169"
                          name="Successful"
                        />
                        <Bar dataKey="failed" fill="#ef4444" name="Failed" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {/* Execution Heatmap Info */}
              {executionHeatmap &&
                executionHeatmap.data &&
                executionHeatmap.data.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 mb-2">
                      Execution Heatmap
                    </h4>
                    <p className="text-xs text-gray-600">
                      {executionHeatmap.data.length} data points showing
                      execution patterns by date and hour
                    </p>
                  </div>
                )}

              {/* No data message */}
              {!slaPrediction &&
                !executionComparison &&
                completionForecast.length === 0 &&
                executionTimeline.length === 0 &&
                dailySummary.length === 0 &&
                executionDistribution.length === 0 &&
                (!executionHeatmap ||
                  !executionHeatmap.data ||
                  executionHeatmap.data.length === 0) && (
                  <p className="text-sm text-gray-500 text-center py-4">
                    No analytics data available for this job
                  </p>
                )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
