import { useEffect, useState, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import {
  Search,
  Filter,
  Eye,
  RotateCcw,
  XCircle,
  Clock,
  Activity,
  Ban,
  X,
  BarChart3,
  CheckSquare,
  Square,
} from "lucide-react";
import { stepExecutionService } from "../services/stepExecutionService";
import type { StepExecution } from "../types/stepExecution";
import LoadingSpinner from "../../../shared/components/ui/LoadingSpinner";
import HeadlessSelect from "../../../shared/components/ui/HeadlessSelect";
import { useToast } from "../../../contexts/ToastContext";
import { useAuth } from "../../../contexts/AuthContext";
import { ENABLE_JOB_EXECUTION_WRITES_FOR_ALL } from "../../../shared/utils/featureFlags";
import { useClickOutside } from "../../../shared/hooks/useClickOutside";
import { color, tw } from "../../../shared/utils/utils";

const STATUS_OPTIONS = [
  { label: "All statuses", value: "" },
  { label: "Pending", value: "pending" },
  { label: "Running", value: "running" },
  { label: "Success", value: "success" },
  { label: "Failure", value: "failure" },
  { label: "Timeout", value: "timeout" },
  { label: "Skipped", value: "skipped" },
  { label: "Cancelled", value: "cancelled" },
];

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

export default function StepExecutionsPage() {
  const navigate = useNavigate();
  const { error: showError, success: showToast } = useToast();
  const { user } = useAuth();
  const canWrite =
    ENABLE_JOB_EXECUTION_WRITES_FOR_ALL || user?.role === "admin";

  const [executions, setExecutions] = useState<StepExecution[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [stats, setStats] = useState({
    totalExecutions: 0,
    activeExecutions: 0,
    failedExecutions: 0,
    successfulExecutions: 0,
    queuedExecutions: 0,
    pendingExecutions: 0,
  });
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [jobExecutionIdFilter, setJobExecutionIdFilter] = useState<string>("");
  const [stepIdFilter, setStepIdFilter] = useState<number | "">("");
  const [quickFilter, setQuickFilter] = useState<string>("");
  // Bulk selection and batch operations
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedExecutions, setSelectedExecutions] = useState<Set<string>>(
    new Set()
  );
  const [isBatchProcessing, setIsBatchProcessing] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);

  useClickOutside(filterRef, () => setShowAdvancedFilters(false), {
    enabled: showAdvancedFilters,
  });

  const fetchExecutions = useCallback(async () => {
    setErrorMessage(null);
    setIsLoading(true);
    try {
      let response;

      // Parse search term to determine what to search for
      const trimmedSearch = searchTerm.trim();
      const isGuid =
        /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(
          trimmedSearch
        );
      const isNumeric = /^\d+$/.test(trimmedSearch);
      const isStatus = STATUS_OPTIONS.some(
        (opt) =>
          opt.value && opt.value.toLowerCase() === trimmedSearch.toLowerCase()
      );

      // Determine which filters to use
      let effectiveJobExecutionId = jobExecutionIdFilter || undefined;
      let effectiveStepId = stepIdFilter ? Number(stepIdFilter) : undefined;
      let effectiveStatus = statusFilter || undefined;

      // If search term is provided, try to map it to filters
      if (trimmedSearch) {
        if (isGuid) {
          effectiveJobExecutionId = trimmedSearch;
        } else if (isNumeric) {
          effectiveStepId = Number(trimmedSearch);
        } else if (isStatus) {
          effectiveStatus = trimmedSearch.toLowerCase();
        }
      }

      // Use search endpoint when we have filters or search term
      if (
        trimmedSearch ||
        effectiveJobExecutionId ||
        effectiveStepId ||
        effectiveStatus ||
        quickFilter
      ) {
        if (quickFilter === "failed") {
          // Failed endpoint - only accepts jobExecutionId and stepId (no limit/offset)
          response = await stepExecutionService.getFailedStepExecutions({
            jobExecutionId: effectiveJobExecutionId,
            stepId: effectiveStepId,
          });
        } else if (quickFilter === "active") {
          // Active endpoint - no parameters accepted
          response = await stepExecutionService.getActiveStepExecutions();
        } else if (
          effectiveStatus &&
          !effectiveJobExecutionId &&
          !effectiveStepId
        ) {
          // If only status filter, use status endpoint
          response = await stepExecutionService.getStepExecutionsByStatus(
            effectiveStatus,
            { limit: 50, offset: 0 }
          );
        } else if (
          effectiveStepId &&
          !effectiveJobExecutionId &&
          !effectiveStatus
        ) {
          // If only step ID, use step ID endpoint
          response = await stepExecutionService.getStepExecutionsByStepId(
            effectiveStepId,
            { limit: 50, offset: 0 }
          );
        } else if (
          effectiveJobExecutionId &&
          !effectiveStepId &&
          !effectiveStatus
        ) {
          // If only job execution ID, use job execution endpoint
          response = await stepExecutionService.getStepExecutionsByJobExecution(
            effectiveJobExecutionId,
            { limit: 50, offset: 0 }
          );
        } else {
          // Search endpoint doesn't exist (404), use individual endpoints based on available filters
          if (effectiveJobExecutionId) {
            response =
              await stepExecutionService.getStepExecutionsByJobExecution(
                effectiveJobExecutionId,
                { limit: 50, offset: 0 }
              );
          } else if (effectiveStepId) {
            response = await stepExecutionService.getStepExecutionsByStepId(
              effectiveStepId,
              { limit: 50, offset: 0 }
            );
          } else if (effectiveStatus) {
            response = await stepExecutionService.getStepExecutionsByStatus(
              effectiveStatus,
              { limit: 50, offset: 0 }
            );
          } else {
            // No specific filters - default to success status
            response = await stepExecutionService.getStepExecutionsByStatus(
              "success",
              { limit: 50, offset: 0 }
            );
          }
        }
      } else {
        // No filters - search endpoint doesn't exist (404), default to showing success status
        // User can apply filters to see other statuses
        response = await stepExecutionService.getStepExecutionsByStatus(
          "success",
          { limit: 50, offset: 0 }
        );
      }

      setExecutions(response.data || []);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to load step executions";
      setErrorMessage(message);
      showError("Step Executions", message);
    } finally {
      setIsLoading(false);
    }
  }, [
    searchTerm,
    quickFilter,
    statusFilter,
    jobExecutionIdFilter,
    stepIdFilter,
    showError,
  ]);

  const fetchStats = useCallback(async () => {
    setIsLoadingStats(true);
    try {
      const [activeResponse, failedResponse, queuedResponse, pendingResponse] =
        await Promise.all([
          stepExecutionService.getActiveStepExecutions().catch(() => ({
            data: [],
          })),
          stepExecutionService.getFailedStepExecutions({}).catch(() => ({
            data: [],
          })),
          stepExecutionService.getQueuedStepExecutions().catch(() => ({
            data: [],
          })),
          stepExecutionService.getPendingStepExecutions().catch(() => ({
            data: [],
          })),
        ]);

      const activeCount =
        activeResponse && "data" in activeResponse
          ? activeResponse.data.length
          : 0;
      const failedCount =
        failedResponse && "data" in failedResponse
          ? failedResponse.data.length
          : 0;
      const queuedCount =
        queuedResponse && "data" in queuedResponse
          ? queuedResponse.data.length
          : 0;
      const pendingCount =
        pendingResponse && "data" in pendingResponse
          ? pendingResponse.data.length
          : 0;

      // Get successful count from status filter
      const successResponse = await stepExecutionService
        .getStepExecutionsByStatus("success", {
          limit: 1,
        })
        .catch(() => ({ data: [] }));
      const successCount =
        successResponse && "data" in successResponse
          ? successResponse.data.length
          : 0;

      setStats({
        totalExecutions: activeCount + failedCount + queuedCount + pendingCount,
        activeExecutions: activeCount,
        failedExecutions: failedCount,
        successfulExecutions: successCount,
        queuedExecutions: queuedCount,
        pendingExecutions: pendingCount,
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

  const filteredExecutions = executions.filter((exec) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      exec.id.toLowerCase().includes(term) ||
      exec.job_execution_id.toLowerCase().includes(term) ||
      exec.step_id.toString().includes(term) ||
      exec.execution_status.toLowerCase().includes(term) ||
      (exec.error_message && exec.error_message.toLowerCase().includes(term))
    );
  });

  const handleAction = async (
    execution: StepExecution,
    action: "retry" | "abort"
  ) => {
    if (!canWrite) return;

    try {
      switch (action) {
        case "retry":
          await stepExecutionService.retryFailedSteps({
            job_execution_id: execution.job_execution_id,
            step_ids: [execution.step_id],
            userId: user?.user_id,
          });
          showToast("Retry Initiated", "Step execution retry initiated");
          break;
        case "abort":
          await stepExecutionService.markStepExecutionAborted(execution.id);
          showToast("Step Aborted", "Step execution aborted");
          break;
      }
      fetchExecutions();
      fetchStats();
    } catch (err) {
      showError(
        "Action Failed",
        err instanceof Error ? err.message : "Unknown error"
      );
    }
  };

  const handleSelectExecution = (executionId: string) => {
    setSelectedExecutions((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(executionId)) {
        newSet.delete(executionId);
      } else {
        newSet.add(executionId);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    if (selectedExecutions.size === filteredExecutions.length) {
      setSelectedExecutions(new Set());
    } else {
      setSelectedExecutions(new Set(filteredExecutions.map((exec) => exec.id)));
    }
  };

  const handleBatchAction = async (action: "retry" | "abort") => {
    if (selectedExecutions.size === 0) return;

    const selected = filteredExecutions.filter((exec) =>
      selectedExecutions.has(exec.id)
    );
    setIsBatchProcessing(true);

    try {
      let successCount = 0;
      let failedCount = 0;

      for (const exec of selected) {
        try {
          switch (action) {
            case "retry":
              if (exec.execution_status === "failure") {
                await stepExecutionService.retryFailedSteps({
                  job_execution_id: exec.job_execution_id,
                  step_ids: [exec.step_id],
                  userId: user?.user_id,
                });
                successCount++;
              }
              break;
            case "abort":
              if (exec.execution_status === "running") {
                await stepExecutionService.markStepExecutionAborted(exec.id);
                successCount++;
              }
              break;
          }
        } catch (err) {
          failedCount++;
          console.error(`Failed to ${action} execution ${exec.id}:`, err);
        }
      }

      showToast(
        `Batch ${action} completed`,
        `${successCount} step execution(s) ${action}ed successfully${
          failedCount > 0 ? `, ${failedCount} failed` : ""
        }`
      );

      setSelectedExecutions(new Set());
      fetchExecutions();
      fetchStats();
    } catch (err) {
      showError(
        `Batch ${action} failed`,
        err instanceof Error ? err.message : "Unknown error"
      );
    } finally {
      setIsBatchProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className={`text-2xl font-bold ${tw.textPrimary}`}>
            Step Executions
          </h1>
          <p className={`${tw.textSecondary} mt-2 text-sm`}>
            Monitor and manage step execution records
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => navigate("/dashboard/step-executions/analytics")}
            className={`inline-flex items-center gap-2 ${tw.rounded} px-4 py-2 text-sm font-medium focus:outline-none transition-colors`}
            style={{
              backgroundColor: "transparent",
              color: color.primary.action,
              border: `1px solid ${color.primary.action}`,
            }}
          >
            <BarChart3 className="h-4 w-4" />
            Analytics
          </button>
          {canWrite && (
            <button
              onClick={() => {
                if (!isSelectionMode) {
                  setIsSelectionMode(true);
                  setSelectedExecutions(
                    new Set(filteredExecutions.map((exec) => exec.id))
                  );
                } else {
                  setIsSelectionMode(false);
                  setSelectedExecutions(new Set());
                }
              }}
              className={`inline-flex items-center gap-2 ${tw.rounded} px-4 py-2 text-sm font-medium focus:outline-none transition-colors`}
              style={{
                backgroundColor: isSelectionMode
                  ? color.primary.action
                  : "transparent",
                color: isSelectionMode ? "white" : color.primary.action,
                border: `1px solid ${color.primary.action}`,
              }}
            >
              {isSelectionMode ? (
                <CheckSquare className="h-4 w-4" />
              ) : (
                <Square className="h-4 w-4" />
              )}
              {isSelectionMode ? "Exit Selection" : "Select Step Executions"}
            </button>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
        <div
          className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm`}
        >
          <div className="flex items-center gap-2">
            <Activity
              className="h-5 w-5"
              style={{ color: color.primary.accent }}
            />
            <p className="text-sm font-medium text-gray-600">Total</p>
          </div>
          <p className="mt-2 text-3xl font-bold text-gray-900">
            {isLoadingStats ? "..." : stats.totalExecutions}
          </p>
        </div>
        <div
          className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm`}
        >
          <div className="flex items-center gap-2">
            <Activity
              className="h-5 w-5"
              style={{ color: color.primary.accent }}
            />
            <p className="text-sm font-medium text-gray-600">Active</p>
          </div>
          <p className="mt-2 text-3xl font-bold text-gray-900">
            {isLoadingStats ? "..." : stats.activeExecutions}
          </p>
        </div>
        <div
          className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm`}
        >
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
        <div
          className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm`}
        >
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
        <div
          className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm`}
        >
          <div className="flex items-center gap-2">
            <Activity
              className="h-5 w-5"
              style={{ color: color.primary.accent }}
            />
            <p className="text-sm font-medium text-gray-600">Pending</p>
          </div>
          <p className="mt-2 text-3xl font-bold text-gray-900">
            {isLoadingStats ? "..." : stats.pendingExecutions}
          </p>
        </div>
        <div
          className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm`}
        >
          <div className="flex items-center gap-2">
            <Activity
              className="h-5 w-5"
              style={{ color: color.primary.accent }}
            />
            <p className="text-sm font-medium text-gray-600">Successful</p>
          </div>
          <p className="mt-2 text-3xl font-bold text-gray-900">
            {isLoadingStats ? "..." : stats.successfulExecutions}
          </p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            className={`w-full ${tw.rounded} border border-gray-200 py-3 pl-10 pr-4 text-sm shadow-sm focus:border-[#3b8169] focus:outline-none focus:ring-1 focus:ring-[#3b8169]`}
            placeholder="Search step executions..."
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
          className={`inline-flex items-center justify-center gap-2 ${tw.rounded} bg-white border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50`}
        >
          <Filter className="h-4 w-4" />
          <span>Filters</span>
          {(jobExecutionIdFilter || stepIdFilter || quickFilter) && (
            <span className="ml-1 inline-flex items-center rounded-full bg-white/20 px-2 py-0.5 text-xs font-medium">
              Active
            </span>
          )}
        </button>
      </div>

      {/* Batch Actions Toolbar */}
      {isSelectionMode && selectedExecutions.size > 0 && (
        <div
          className={`flex items-center justify-between ${tw.rounded} border border-gray-200 bg-white px-4 py-3`}
        >
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">
              {selectedExecutions.size} step execution(s) selected
            </span>
            <button
              onClick={() => setSelectedExecutions(new Set())}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleBatchAction("retry")}
              disabled={isBatchProcessing}
              className={`inline-flex items-center gap-2 ${tw.rounded} px-3 py-1.5 text-sm font-semibold text-white disabled:opacity-50 disabled:cursor-not-allowed`}
              style={{ backgroundColor: color.primary.action }}
            >
              <RotateCcw className="h-4 w-4" />
              Retry Failed
            </button>
            <button
              onClick={() => handleBatchAction("abort")}
              disabled={isBatchProcessing}
              className={`inline-flex items-center gap-2 ${tw.rounded} border border-red-200 px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-50`}
            >
              <Ban className="h-4 w-4" />
              Abort Running
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div>
        {errorMessage && (
          <div className="flex items-center gap-2 border-b border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 mb-4">
            <XCircle className="h-4 w-4" />
            {errorMessage}
          </div>
        )}

        {isLoading ? (
          <div className="flex justify-center py-16">
            <LoadingSpinner />
          </div>
        ) : filteredExecutions.length === 0 ? (
          <div className="py-16 text-center">
            <Activity className="mx-auto mb-4 h-12 w-12 text-gray-300" />
            <p className={`text-lg font-semibold ${tw.textPrimary}`}>
              No step executions found
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
                  {isSelectionMode && (
                    <th
                      className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider"
                      style={{
                        color: color.surface.tableHeaderText,
                        backgroundColor: color.surface.tableHeader,
                        borderTopLeftRadius: "0.375rem",
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={
                          filteredExecutions.length > 0 &&
                          selectedExecutions.size === filteredExecutions.length
                        }
                        onChange={handleSelectAll}
                        className="rounded border-gray-300 text-[#3b8169] focus:ring-[#3b8169]"
                      />
                    </th>
                  )}
                  <th
                    className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider"
                    style={{
                      color: color.surface.tableHeaderText,
                      backgroundColor: color.surface.tableHeader,
                      ...(!isSelectionMode && {
                        borderTopLeftRadius: "0.375rem",
                      }),
                    }}
                  >
                    Step Exec ID
                  </th>
                  <th
                    className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider"
                    style={{
                      color: color.surface.tableHeaderText,
                      backgroundColor: color.surface.tableHeader,
                    }}
                  >
                    Job Exec ID
                  </th>
                  <th
                    className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider"
                    style={{
                      color: color.surface.tableHeaderText,
                      backgroundColor: color.surface.tableHeader,
                    }}
                  >
                    Step ID
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
                    {isSelectionMode && (
                      <td
                        className="px-6 py-4"
                        style={{
                          backgroundColor: color.surface.tablebodybg,
                          borderTopLeftRadius: "0.375rem",
                          borderBottomLeftRadius: "0.375rem",
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={selectedExecutions.has(execution.id)}
                          onChange={() => handleSelectExecution(execution.id)}
                          className="rounded border-gray-300 text-[#3b8169] focus:ring-[#3b8169]"
                        />
                      </td>
                    )}
                    <td
                      className="px-6 py-4"
                      style={{
                        backgroundColor: color.surface.tablebodybg,
                        ...(!isSelectionMode && {
                          borderTopLeftRadius: "0.375rem",
                          borderBottomLeftRadius: "0.375rem",
                        }),
                      }}
                    >
                      <div className="text-sm font-mono">
                        {execution.id.substring(0, 8)}...
                      </div>
                    </td>
                    <td
                      className="px-6 py-4"
                      style={{ backgroundColor: color.surface.tablebodybg }}
                    >
                      <div className="text-sm font-mono">
                        {execution.job_execution_id.substring(0, 8)}...
                      </div>
                    </td>
                    <td
                      className="px-6 py-4"
                      style={{ backgroundColor: color.surface.tablebodybg }}
                    >
                      <div className="text-sm font-medium">
                        {execution.step_id}
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
                      <div className="text-sm">
                        {formatDateTime(execution.started_at)}
                      </div>
                    </td>
                    <td
                      className="px-6 py-4"
                      style={{ backgroundColor: color.surface.tablebodybg }}
                    >
                      <div className="text-sm">
                        {formatDuration(execution.duration_seconds)}
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
                              `/dashboard/step-executions/${execution.id}`
                            )
                          }
                          className={`p-2 ${tw.rounded} text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors`}
                          aria-label="View step execution details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() =>
                            navigate(
                              `/dashboard/job-executions/${execution.job_execution_id}`
                            )
                          }
                          className={`p-2 ${tw.rounded} text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors`}
                          aria-label="View job execution"
                          title="View parent job execution"
                        >
                          <Activity className="w-4 h-4" />
                        </button>
                        {canWrite &&
                          execution.execution_status === "failure" && (
                            <button
                              onClick={() => handleAction(execution, "retry")}
                              className={`p-2 ${tw.rounded} text-blue-600 hover:text-blue-900 hover:bg-blue-50 transition-colors`}
                              aria-label="Retry step"
                            >
                              <RotateCcw className="w-4 h-4" />
                            </button>
                          )}
                        {canWrite &&
                          execution.execution_status === "running" && (
                            <button
                              onClick={() => handleAction(execution, "abort")}
                              className={`p-2 ${tw.rounded} text-red-600 hover:text-red-900 hover:bg-red-50 transition-colors`}
                              aria-label="Abort step"
                            >
                              <Ban className="w-4 h-4" />
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

      {/* Advanced Filters Side Modal */}
      {showAdvancedFilters &&
        createPortal(
          <div
            className="fixed inset-0 overflow-hidden"
            style={{ zIndex: 999999, top: 0, left: 0, right: 0, bottom: 0 }}
          >
            <div
              className="absolute inset-0 bg-black bg-opacity-50 transition-opacity duration-300 ease-in-out"
              onClick={() => setShowAdvancedFilters(false)}
            ></div>
            <div
              ref={filterRef}
              className="absolute right-0 top-0 h-full w-full sm:w-[28rem] lg:w-96 bg-white shadow-xl transform transition-transform duration-300 ease-out translate-x-0"
              style={{ zIndex: 1000000 }}
            >
              <div className="flex flex-col h-full">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-200">
                  <h2 className="text-sm font-semibold text-gray-900">
                    Filter Step Executions
                  </h2>
                  <button
                    onClick={() => setShowAdvancedFilters(false)}
                    className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4">
                  <div className="space-y-4">
                    {/* Quick Filters */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Quick Filters
                      </label>
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => {
                            setQuickFilter(
                              quickFilter === "failed" ? "" : "failed"
                            );
                            setStatusFilter("");
                          }}
                          className={`inline-flex items-center gap-2 ${
                            tw.rounded
                          } px-3 py-1.5 text-sm font-medium transition-colors ${
                            quickFilter === "failed"
                              ? "bg-red-100 text-red-700 border border-red-300"
                              : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50"
                          }`}
                        >
                          <XCircle className="h-4 w-4" />
                          Failed
                        </button>
                        <button
                          onClick={() => {
                            setQuickFilter(
                              quickFilter === "active" ? "" : "active"
                            );
                            setStatusFilter("");
                          }}
                          className={`inline-flex items-center gap-2 ${
                            tw.rounded
                          } px-3 py-1.5 text-sm font-medium transition-colors ${
                            quickFilter === "active"
                              ? "bg-blue-100 text-blue-700 border border-blue-300"
                              : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50"
                          }`}
                        >
                          <Activity className="h-4 w-4" />
                          Active
                        </button>
                      </div>
                    </div>

                    {/* Job Execution ID Filter */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Job Execution ID
                      </label>
                      <input
                        type="text"
                        className={`w-full text-sm px-3 py-2 border border-gray-300 ${tw.rounded} focus:outline-none focus:ring-2 focus:ring-[#3b8169] focus:border-transparent`}
                        placeholder="Job execution UUID (GUID)"
                        value={jobExecutionIdFilter}
                        onChange={(e) =>
                          setJobExecutionIdFilter(e.target.value.trim())
                        }
                        pattern="[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}"
                      />
                      {jobExecutionIdFilter &&
                        !/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(
                          jobExecutionIdFilter
                        ) && (
                          <p className="mt-1 text-xs text-red-600">
                            Please enter a valid GUID format
                          </p>
                        )}
                    </div>

                    {/* Step ID Filter */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Step ID
                      </label>
                      <input
                        type="number"
                        className={`w-full text-sm px-3 py-2 border border-gray-300 ${tw.rounded} focus:outline-none focus:ring-2 focus:ring-[#3b8169] focus:border-transparent`}
                        placeholder="Step ID (numeric)"
                        value={stepIdFilter}
                        onChange={(e) =>
                          setStepIdFilter(
                            e.target.value ? Number(e.target.value) : ""
                          )
                        }
                        min="1"
                      />
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-gray-200 bg-gray-50">
                  <div className="flex space-x-3">
                    <button
                      onClick={() => {
                        setJobExecutionIdFilter("");
                        setStepIdFilter("");
                        setStatusFilter("");
                        setQuickFilter("");
                        setSearchTerm("");
                      }}
                      className={`flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 ${tw.rounded} hover:bg-gray-50 transition-colors`}
                    >
                      Clear All
                    </button>
                    <button
                      onClick={() => setShowAdvancedFilters(false)}
                      className={`flex-1 px-4 py-2 text-sm font-semibold text-white ${tw.rounded} transition-colors`}
                      style={{ backgroundColor: color.primary.action }}
                    >
                      Apply Filters
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
