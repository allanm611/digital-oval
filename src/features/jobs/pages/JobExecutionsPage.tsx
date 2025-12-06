import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  PlayCircle,
  CheckCircle,
  Clock,
  Eye,
  Search,
  Filter,
  BarChart3,
  XCircle,
  Pause,
  Activity,
  X,
  Calendar,
  Link2,
  Archive,
  RotateCcw,
  Ban,
  Zap,
  TrendingUp,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import LoadingSpinner from "../../../shared/components/ui/LoadingSpinner";
import HeadlessSelect from "../../../shared/components/ui/HeadlessSelect";
import { color, tw } from "../../../shared/utils/utils";
import { useToast } from "../../../contexts/ToastContext";
import { useLanguage } from "../../../contexts/LanguageContext";
import { jobExecutionService } from "../services/jobExecutionService";
import type {
  JobExecution,
  JobExecutionSearchParams,
  ExecutionStatus,
} from "../types/jobExecution";
import { useAuth } from "../../../contexts/AuthContext";

const STATUS_OPTIONS = [
  { label: "All statuses", value: "" },
  { label: "Pending", value: "pending" },
  { label: "Queued", value: "queued" },
  { label: "Running", value: "running" },
  { label: "Success", value: "success" },
  { label: "Failure", value: "failure" },
  { label: "Aborted", value: "aborted" },
  { label: "Timeout", value: "timeout" },
  { label: "Cancelled", value: "cancelled" },
];

const getStatusColor = (status: ExecutionStatus) => {
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

const formatDuration = (seconds: number | null) => {
  if (!seconds) return "—";
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return `${hours}h ${minutes}m`;
};

const formatDateTime = (value?: string | null) => {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleString();
  } catch {
    return value;
  }
};

export default function JobExecutionsPage() {
  const navigate = useNavigate();
  const { error: showError, success: showToast } = useToast();
  const { user } = useAuth();
  const { t } = useLanguage();

  const [executions, setExecutions] = useState<JobExecution[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [stats, setStats] = useState({
    totalExecutions: 0,
    runningExecutions: 0,
    successfulExecutions: 0,
    failedExecutions: 0,
    queuedExecutions: 0,
    activeExecutions: 0,
  });
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [jobIdFilter, setJobIdFilter] = useState<number | "">("");
  const [daysBackFilter, setDaysBackFilter] = useState<number>(7);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [startDateFilter, setStartDateFilter] = useState<string>("");
  const [endDateFilter, setEndDateFilter] = useState<string>("");
  const [correlationIdFilter, setCorrelationIdFilter] = useState<string>("");
  const [traceIdFilter, setTraceIdFilter] = useState<string>("");
  const [quickFilter, setQuickFilter] = useState<string>("");
  const [longRunningThreshold, setLongRunningThreshold] = useState<number>(60);
  const [selectedExecution, setSelectedExecution] =
    useState<JobExecution | null>(null);
  const [showActionModal, setShowActionModal] = useState(false);
  const [actionType, setActionType] = useState<
    "abort" | "archive" | "retry" | null
  >(null);
  const [isProcessingAction, setIsProcessingAction] = useState(false);

  const fetchExecutions = useCallback(
    async (overrideParams?: Partial<JobExecutionSearchParams>) => {
      setErrorMessage(null);
      setIsLoading(true);

      try {
        let response;

        // Quick filters
        if (quickFilter === "sla-breached") {
          response = await jobExecutionService.getSLABreachedExecutions({
            jobId: jobIdFilter || undefined,
            daysBack: daysBackFilter,
            limit: 50,
            offset: 0,
          });
        } else if (quickFilter === "long-running") {
          response = await jobExecutionService.getLongRunningExecutions({
            thresholdMinutes: longRunningThreshold,
          });
        } else if (quickFilter === "currently-running") {
          response = await jobExecutionService.getCurrentlyRunningExecutions();
        } else if (traceIdFilter.trim()) {
          // Search by trace ID
          try {
            const exec = await jobExecutionService.getJobExecutionByTraceId(
              traceIdFilter.trim()
            );
            response = {
              data: [exec],
              pagination: { total: 1, limit: 50, offset: 0, hasMore: false },
            };
          } catch {
            response = {
              data: [],
              pagination: { total: 0, limit: 50, offset: 0, hasMore: false },
            };
          }
        } else if (correlationIdFilter.trim()) {
          response = await jobExecutionService.getExecutionsByCorrelationId(
            correlationIdFilter.trim()
          );
        } else if (startDateFilter && endDateFilter) {
          response = await jobExecutionService.getExecutionsByDateRange({
            startDate: startDateFilter,
            endDate: endDateFilter,
            jobId: jobIdFilter || undefined,
            limit: 50,
            offset: 0,
          });
        } else if (statusFilter === "running") {
          response = await jobExecutionService.getActiveExecutions({
            limit: 50,
            offset: 0,
          });
        } else if (statusFilter === "queued") {
          response = await jobExecutionService.getQueuedExecutions({
            limit: 50,
            offset: 0,
          });
        } else if (statusFilter === "failure") {
          response = await jobExecutionService.getFailedExecutions({
            jobId: jobIdFilter || undefined,
            daysBack: daysBackFilter,
            limit: 50,
            offset: 0,
          });
        } else if (statusFilter) {
          response = await jobExecutionService.getExecutionsByStatus(
            statusFilter,
            {
              limit: 50,
              offset: 0,
            }
          );
        } else if (jobIdFilter) {
          response = await jobExecutionService.getExecutionsByJobId(
            Number(jobIdFilter),
            {
              limit: 50,
              offset: 0,
            }
          );
        } else {
          // Use search endpoint for general queries
          const params: JobExecutionSearchParams = {
            filters: {},
            limit: 50,
            offset: 0,
            ...overrideParams,
          };
          if (statusFilter) {
            params.filters.execution_status = statusFilter as ExecutionStatus;
          }
          if (jobIdFilter) {
            params.filters.job_id = Number(jobIdFilter);
          }
          if (startDateFilter) {
            params.filters.started_at_min = startDateFilter;
          }
          if (endDateFilter) {
            params.filters.started_at_max = endDateFilter;
          }
          response = await jobExecutionService.searchJobExecutions(params);
        }

        const executionList = response.data || [];
        const sortedExecutions = [...executionList].sort((a, b) => {
          const startedB = b.started_at ? new Date(b.started_at).getTime() : 0;
          const startedA = a.started_at ? new Date(a.started_at).getTime() : 0;
          return startedB - startedA;
        });
        setExecutions(sortedExecutions);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to load job executions";
        setErrorMessage(message);
        showError("Job Executions", message);
      } finally {
        setIsLoading(false);
      }
    },
    [
      statusFilter,
      jobIdFilter,
      daysBackFilter,
      quickFilter,
      traceIdFilter,
      correlationIdFilter,
      startDateFilter,
      endDateFilter,
      longRunningThreshold,
      showError,
    ]
  );

  const fetchStats = useCallback(async () => {
    setIsLoadingStats(true);
    try {
      const [activeResponse, queuedResponse, failedResponse, statsResponse] =
        await Promise.all([
          jobExecutionService.getActiveExecutions().catch(() => ({ data: [] })),
          jobExecutionService.getQueuedExecutions().catch(() => ({ data: [] })),
          jobExecutionService
            .getFailedExecutions({ daysBack: 7 })
            .catch(() => ({
              data: [],
            })),
          jobExecutionService.getExecutionStatistics().catch(() => ({
            total_executions: 0,
            successful_executions: 0,
            failed_executions: 0,
            running_executions: 0,
            queued_executions: 0,
            average_duration_seconds: 0,
            total_duration_seconds: 0,
          })),
        ]);

      const activeExecutions =
        activeResponse && "data" in activeResponse
          ? activeResponse.data.length
          : 0;
      const queuedExecutions =
        queuedResponse && "data" in queuedResponse
          ? queuedResponse.data.length
          : 0;
      const failedExecutions =
        failedResponse && "data" in failedResponse
          ? failedResponse.data.length
          : 0;

      setStats({
        totalExecutions: statsResponse.total_executions || 0,
        runningExecutions: statsResponse.running_executions || activeExecutions,
        successfulExecutions: statsResponse.successful_executions || 0,
        failedExecutions: statsResponse.failed_executions || failedExecutions,
        queuedExecutions: statsResponse.queued_executions || queuedExecutions,
        activeExecutions: activeExecutions,
      });
    } catch (err) {
      console.error("Failed to load stats:", err);
    } finally {
      setIsLoadingStats(false);
    }
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchExecutions();
    }, 300);
    return () => clearTimeout(timeout);
  }, [fetchExecutions]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const filteredExecutions = useMemo(() => {
    if (!searchTerm.trim()) return executions;

    const term = searchTerm.toLowerCase();
    return executions.filter(
      (exec) =>
        exec.id.toLowerCase().includes(term) ||
        exec.job_id.toString().includes(term) ||
        exec.execution_status.toLowerCase().includes(term) ||
        (exec.error_message &&
          exec.error_message.toLowerCase().includes(term)) ||
        (exec.trace_id && exec.trace_id.toLowerCase().includes(term)) ||
        (exec.correlation_id &&
          exec.correlation_id.toLowerCase().includes(term))
    );
  }, [executions, searchTerm]);

  const handleAction = async (
    execution: JobExecution,
    action: "abort" | "archive" | "retry"
  ) => {
    setSelectedExecution(execution);
    setActionType(action);
    setShowActionModal(true);
  };

  const confirmAction = async () => {
    if (!selectedExecution || !actionType || !user?.user_id) return;

    setIsProcessingAction(true);
    try {
      switch (actionType) {
        case "abort":
          await jobExecutionService.markJobExecutionAborted(
            selectedExecution.id,
            {
              reason: "User requested abort",
            }
          );
          showToast(
            "Execution Aborted",
            "The execution has been aborted successfully"
          );
          break;
        case "archive":
          await jobExecutionService.archiveJobExecution(selectedExecution.id);
          showToast(
            "Execution Archived",
            "The execution has been archived successfully"
          );
          break;
        case "retry":
          await jobExecutionService.retryFailedJobExecutions({
            jobId: selectedExecution.job_id,
            daysBack: 7,
            userId: user.user_id,
          });
          showToast("Retry Initiated", "Failed executions are being retried");
          break;
      }
      setShowActionModal(false);
      setSelectedExecution(null);
      setActionType(null);
      fetchExecutions();
    } catch (err) {
      showError(
        "Action Failed",
        err instanceof Error ? err.message : "Unknown error"
      );
    } finally {
      setIsProcessingAction(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className={`text-2xl font-bold ${tw.textPrimary}`}>
            Job Executions
          </h1>
          <p className={`${tw.textSecondary} mt-2 text-sm`}>
            Monitor and track all job execution records
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => navigate("/dashboard/job-executions/analytics")}
            className="inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium focus:outline-none transition-colors"
            style={{
              backgroundColor: "transparent",
              color: color.primary.action,
              border: `1px solid ${color.primary.action}`,
            }}
          >
            <BarChart3 className="h-4 w-4" />
            Analytics
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
        <div className="rounded-md border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2">
            <PlayCircle
              className="h-5 w-5"
              style={{ color: color.primary.accent }}
            />
            <p className="text-sm font-medium text-gray-600">
              Total Executions
            </p>
          </div>
          <p className="mt-2 text-3xl font-bold text-gray-900">
            {isLoadingStats ? "..." : stats.totalExecutions}
          </p>
        </div>
        <div className="rounded-md border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2">
            <Activity
              className="h-5 w-5"
              style={{ color: color.primary.accent }}
            />
            <p className="text-sm font-medium text-gray-600">Running</p>
          </div>
          <p className="mt-2 text-3xl font-bold text-gray-900">
            {isLoadingStats ? "..." : stats.runningExecutions}
          </p>
        </div>
        <div className="rounded-md border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2">
            <CheckCircle
              className="h-5 w-5"
              style={{ color: color.primary.accent }}
            />
            <p className="text-sm font-medium text-gray-600">Successful</p>
          </div>
          <p className="mt-2 text-3xl font-bold text-gray-900">
            {isLoadingStats ? "..." : stats.successfulExecutions}
          </p>
        </div>
        <div className="rounded-md border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2">
            <XCircle
              className="h-5 w-5"
              style={{ color: color.primary.accent }}
            />
            <p className="text-sm font-medium text-gray-600">Failed</p>
          </div>
          <p className="mt-2 text-3xl font-bold text-gray-900">
            {isLoadingStats ? "..." : stats.failedExecutions}
          </p>
        </div>
        <div className="rounded-md border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2">
            <Clock
              className="h-5 w-5"
              style={{ color: color.primary.accent }}
            />
            <p className="text-sm font-medium text-gray-600">Queued</p>
          </div>
          <p className="mt-2 text-3xl font-bold text-gray-900">
            {isLoadingStats ? "..." : stats.queuedExecutions}
          </p>
        </div>
        <div className="rounded-md border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2">
            <Pause
              className="h-5 w-5"
              style={{ color: color.primary.accent }}
            />
            <p className="text-sm font-medium text-gray-600">Active</p>
          </div>
          <p className="mt-2 text-3xl font-bold text-gray-900">
            {isLoadingStats ? "..." : stats.activeExecutions}
          </p>
        </div>
      </div>

      {/* Quick Filter Buttons */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => {
            setQuickFilter(
              quickFilter === "sla-breached" ? "" : "sla-breached"
            );
            setStatusFilter("");
          }}
          className={`inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
            quickFilter === "sla-breached"
              ? "bg-red-100 text-red-700 border border-red-300"
              : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50"
          }`}
        >
          <AlertTriangle className="h-4 w-4" />
          SLA Breached
        </button>
        <button
          onClick={() => {
            setQuickFilter(
              quickFilter === "long-running" ? "" : "long-running"
            );
            setStatusFilter("");
          }}
          className={`inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
            quickFilter === "long-running"
              ? "bg-orange-100 text-orange-700 border border-orange-300"
              : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50"
          }`}
        >
          <Clock className="h-4 w-4" />
          Long Running
        </button>
        <button
          onClick={() => {
            setQuickFilter(
              quickFilter === "currently-running" ? "" : "currently-running"
            );
            setStatusFilter("");
          }}
          className={`inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
            quickFilter === "currently-running"
              ? "bg-blue-100 text-blue-700 border border-blue-300"
              : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50"
          }`}
        >
          <Activity className="h-4 w-4" />
          Currently Running
        </button>
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            className="w-full rounded-md border border-gray-200 py-3 pl-10 pr-4 text-sm shadow-sm focus:border-[#3b8169] focus:outline-none focus:ring-1 focus:ring-[#3b8169]"
            placeholder="Search by execution ID, job ID, status, trace ID, or correlation ID"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <HeadlessSelect
          value={statusFilter}
          onChange={(value) => {
            setStatusFilter(value as string);
            setQuickFilter("");
          }}
          options={STATUS_OPTIONS}
          placeholder="All statuses"
          className="w-auto min-w-[180px]"
        />
        <button
          onClick={() => setShowAdvancedFilters(true)}
          className="inline-flex items-center justify-center gap-2 rounded-md bg-white border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
        >
          <Filter className="h-4 w-4" />
          <span>Filters</span>
          {(jobIdFilter ||
            daysBackFilter !== 7 ||
            startDateFilter ||
            endDateFilter ||
            correlationIdFilter ||
            traceIdFilter) && (
            <span className="ml-1 inline-flex items-center rounded-full bg-white/20 px-2 py-0.5 text-xs font-medium">
              Active
            </span>
          )}
        </button>
      </div>

      {/* Advanced Filters Modal */}
      {showAdvancedFilters && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div
            className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
              <button
                onClick={() => setShowAdvancedFilters(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Job ID
                </label>
                <input
                  type="number"
                  className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                  placeholder="Filter by job ID"
                  value={jobIdFilter}
                  onChange={(e) =>
                    setJobIdFilter(e.target.value ? Number(e.target.value) : "")
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Days Back
                </label>
                <input
                  type="number"
                  className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                  placeholder="7"
                  value={daysBackFilter}
                  onChange={(e) =>
                    setDaysBackFilter(Number(e.target.value) || 7)
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                  value={startDateFilter}
                  onChange={(e) => setStartDateFilter(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  End Date
                </label>
                <input
                  type="date"
                  className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                  value={endDateFilter}
                  onChange={(e) => setEndDateFilter(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Correlation ID
                </label>
                <input
                  type="text"
                  className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                  placeholder="Filter by correlation ID"
                  value={correlationIdFilter}
                  onChange={(e) => setCorrelationIdFilter(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Trace ID
                </label>
                <input
                  type="text"
                  className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                  placeholder="Filter by trace ID"
                  value={traceIdFilter}
                  onChange={(e) => setTraceIdFilter(e.target.value)}
                />
              </div>
              {quickFilter === "long-running" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Threshold (minutes)
                  </label>
                  <input
                    type="number"
                    className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                    placeholder="60"
                    value={longRunningThreshold}
                    onChange={(e) =>
                      setLongRunningThreshold(Number(e.target.value) || 60)
                    }
                  />
                </div>
              )}
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setJobIdFilter("");
                  setDaysBackFilter(7);
                  setStartDateFilter("");
                  setEndDateFilter("");
                  setCorrelationIdFilter("");
                  setTraceIdFilter("");
                  setLongRunningThreshold(60);
                }}
                className="flex-1 rounded-md border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Clear
              </button>
              <button
                onClick={() => setShowAdvancedFilters(false)}
                className="flex-1 rounded-md px-4 py-2 text-sm font-medium text-white"
                style={{ backgroundColor: color.primary.action }}
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}

      <div>
        {errorMessage && (
          <div className="flex items-center gap-2 border-b border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 mb-4">
            <AlertTriangle className="h-4 w-4" />
            {errorMessage}
          </div>
        )}

        {isLoading ? (
          <div className="flex justify-center py-16">
            <LoadingSpinner />
          </div>
        ) : filteredExecutions.length === 0 ? (
          <div className="py-16 text-center">
            <PlayCircle className="mx-auto mb-4 h-12 w-12 text-gray-300" />
            <p className={`text-lg font-semibold ${tw.textPrimary}`}>
              No job executions found
            </p>
            <p className="mt-2 text-sm text-gray-500">
              Try updating your search filters or check back later.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table
              className="w-full"
              style={{ borderCollapse: "separate", borderSpacing: "0 8px" }}
            >
              <thead>
                <tr>
                  <th
                    className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider"
                    style={{
                      color: color.surface.tableHeaderText,
                      backgroundColor: color.surface.tableHeader,
                      borderTopLeftRadius: "0.375rem",
                    }}
                  >
                    Execution ID
                  </th>
                  <th
                    className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider"
                    style={{
                      color: color.surface.tableHeaderText,
                      backgroundColor: color.surface.tableHeader,
                    }}
                  >
                    Job ID
                  </th>
                  <th
                    className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider"
                    style={{
                      color: color.surface.tableHeaderText,
                      backgroundColor: color.surface.tableHeader,
                    }}
                  >
                    Status
                  </th>
                  <th
                    className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider"
                    style={{
                      color: color.surface.tableHeaderText,
                      backgroundColor: color.surface.tableHeader,
                    }}
                  >
                    Started At
                  </th>
                  <th
                    className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider"
                    style={{
                      color: color.surface.tableHeaderText,
                      backgroundColor: color.surface.tableHeader,
                    }}
                  >
                    Duration
                  </th>
                  <th
                    className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider"
                    style={{
                      color: color.surface.tableHeaderText,
                      backgroundColor: color.surface.tableHeader,
                    }}
                  >
                    Triggered By
                  </th>
                  <th
                    className="px-6 py-4 text-right text-xs font-medium uppercase tracking-wider"
                    style={{
                      color: color.surface.tableHeaderText,
                      backgroundColor: color.surface.tableHeader,
                      borderTopRightRadius: "0.375rem",
                    }}
                  >
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody>
                {filteredExecutions.map((execution) => (
                  <tr key={execution.id} className="transition-colors">
                    <td
                      className="px-6 py-4"
                      style={{
                        backgroundColor: color.surface.tablebodybg,
                        borderTopLeftRadius: "0.375rem",
                        borderBottomLeftRadius: "0.375rem",
                      }}
                    >
                      <div className="flex items-center">
                        <div>
                          <div
                            className={`text-sm font-mono ${tw.textPrimary}`}
                          >
                            {execution.id.substring(0, 8)}...
                          </div>
                          {execution.trace_id && (
                            <div className="mt-1 text-xs text-gray-500">
                              Trace: {execution.trace_id.substring(0, 8)}...
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td
                      className="px-6 py-4"
                      style={{ backgroundColor: color.surface.tablebodybg }}
                    >
                      <div
                        className={`text-sm font-medium ${tw.textSecondary}`}
                      >
                        {execution.job_id}
                      </div>
                    </td>
                    <td
                      className="px-6 py-4"
                      style={{ backgroundColor: color.surface.tablebodybg }}
                    >
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusColor(
                          execution.execution_status
                        )}`}
                      >
                        {execution.execution_status}
                      </span>
                    </td>
                    <td
                      className="px-6 py-4"
                      style={{ backgroundColor: color.surface.tablebodybg }}
                    >
                      <div className={`text-sm ${tw.textSecondary}`}>
                        {formatDateTime(execution.started_at)}
                      </div>
                    </td>
                    <td
                      className="px-6 py-4"
                      style={{ backgroundColor: color.surface.tablebodybg }}
                    >
                      <div className={`text-sm ${tw.textSecondary}`}>
                        {formatDuration(execution.duration_seconds)}
                      </div>
                    </td>
                    <td
                      className="px-6 py-4"
                      style={{ backgroundColor: color.surface.tablebodybg }}
                    >
                      <div className={`text-sm capitalize ${tw.textSecondary}`}>
                        {execution.triggered_by || "—"}
                      </div>
                    </td>
                    <td
                      className="px-6 py-4 text-right"
                      style={{
                        backgroundColor: color.surface.tablebodybg,
                        borderTopRightRadius: "0.375rem",
                        borderBottomRightRadius: "0.375rem",
                      }}
                    >
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() =>
                            navigate(
                              `/dashboard/job-executions/${execution.id}`
                            )
                          }
                          className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                          aria-label="View details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {execution.execution_status === "running" && (
                          <button
                            onClick={() => handleAction(execution, "abort")}
                            className="p-2 rounded-md text-red-600 hover:text-red-900 hover:bg-red-50 transition-colors"
                            aria-label="Abort execution"
                          >
                            <Ban className="w-4 h-4" />
                          </button>
                        )}
                        {execution.execution_status === "failure" && (
                          <button
                            onClick={() => handleAction(execution, "retry")}
                            className="p-2 rounded-md text-blue-600 hover:text-blue-900 hover:bg-blue-50 transition-colors"
                            aria-label="Retry execution"
                          >
                            <RotateCcw className="w-4 h-4" />
                          </button>
                        )}
                        {!execution.archived && (
                          <button
                            onClick={() => handleAction(execution, "archive")}
                            className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                            aria-label="Archive execution"
                          >
                            <Archive className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Action Confirmation Modal */}
      {showActionModal && selectedExecution && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div
            className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {actionType === "abort" && "Abort Execution"}
                {actionType === "archive" && "Archive Execution"}
                {actionType === "retry" && "Retry Execution"}
              </h3>
              <button
                onClick={() => {
                  setShowActionModal(false);
                  setSelectedExecution(null);
                  setActionType(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              {actionType === "abort" &&
                "Are you sure you want to abort this execution?"}
              {actionType === "archive" &&
                "Are you sure you want to archive this execution?"}
              {actionType === "retry" &&
                "This will retry all failed executions for this job. Continue?"}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowActionModal(false);
                  setSelectedExecution(null);
                  setActionType(null);
                }}
                className="flex-1 rounded-md border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                disabled={isProcessingAction}
              >
                Cancel
              </button>
              <button
                onClick={confirmAction}
                disabled={isProcessingAction}
                className="flex-1 rounded-md px-4 py-2 text-sm font-medium text-white"
                style={{
                  backgroundColor: isProcessingAction
                    ? "#9ca3af"
                    : color.primary.action,
                }}
              >
                {isProcessingAction ? "Processing..." : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
