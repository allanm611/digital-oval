import { useCallback, useEffect, useMemo, useState, useRef } from "react";
import { createPortal } from "react-dom";
import {
  AlertTriangle,
  PlayCircle,
  CheckCircle,
  Clock,
  Eye,
  Filter,
  BarChart3,
  XCircle,
  Pause,
  Activity,
  X,
  Archive,
  RotateCcw,
  Ban,
  CheckSquare,
  Square,
  MoreVertical,
} from "lucide-react";
import SearchInput from "../../../shared/components/ui/SearchInput";
import Textarea from "../../../shared/components/ui/Textarea";
import BackButton from "../../../shared/components/ui/BackButton";
import { useNavigate } from "react-router-dom";
import LoadingSpinner from "../../../shared/components/ui/LoadingSpinner";
import HeadlessSelect from "../../../shared/components/ui/HeadlessSelect";
import Pagination, { DEFAULT_PAGE_SIZE, getInitialPageSize } from "../../../shared/components/ui/Pagination";
import Input from "../../../shared/components/ui/Input";
import DateFormatter from "../../../shared/components/DateFormatter";
import { color, tw } from "../../../shared/utils/utils";
import { useToast } from "../../../contexts/ToastContext";
import { extractBackendError } from "../../../shared/utils/errorHandler";;;
import { useLanguage } from "../../../contexts/LanguageContext";
import { jobExecutionService } from "../services/jobExecutionService";
import { ENABLE_JOB_EXECUTION_WRITES_FOR_ALL } from "../../../shared/utils/featureFlags";
import type {
  JobExecution,
  JobExecutionSearchParams,
  ExecutionStatus,
} from "../types/jobExecution";
import { useAuth } from "../../../contexts/AuthContext";
import { useClickOutside } from "../../../shared/hooks/useClickOutside";
import { PermissionGate } from "../../auth/components/PermissionGate";
import Checkbox from "../../../shared/components/ui/Checkbox";
import { Table, useTable, type TableColumn } from "../../../shared/components/Table";

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

const formatDuration = (seconds: number | null) => {
  if (!seconds) return "—";
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return `${hours}h ${minutes}m`;
};

export default function JobExecutionsPage() {
  const navigate = useNavigate();
  const { error: showError, success: showToast } = useToast();
  const { t } = useLanguage();
  const { user } = useAuth();
  const canWrite =
    ENABLE_JOB_EXECUTION_WRITES_FOR_ALL || user?.role === "admin";

  const [executions, setExecutions] = useState<JobExecution[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [stats, setStats] = useState({
    totalExecutions: 0,
    successfulExecutions: 0,
    failedExecutions: 0,
    timedOut: 0,
    aborted: 0,
    slaBreaches: 0,
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
    "abort" | "archive" | "unarchive" | "retry" | null
  >(null);
  const [isProcessingAction, setIsProcessingAction] = useState(false);
  const [daysBackInput, setDaysBackInput] = useState<number>(7);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const menuRefs = useRef<{ [key: string]: HTMLButtonElement | null }>({});
  const [menuPosition, setMenuPosition] = useState<{
    top: number;
    left: number;
  } | null>(null);
  // Batch selection and batch operations
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedExecutions, setSelectedExecutions] = useState<Set<string>>(
    new Set(),
  );
  const [isBatchProcessing, setIsBatchProcessing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(getInitialPageSize());
  const [totalExecutions, setTotalExecutions] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [showArchiveManagementModal, setShowArchiveManagementModal] = useState(false);
  const [archiveOldDays, setArchiveOldDays] = useState<number>(30);
  const [isArchiveManagementProcessing, setIsArchiveManagementProcessing] = useState(false);
  const filtersModalRef = useRef<HTMLDivElement>(null);

  useClickOutside(filtersModalRef, () => {
    if (showAdvancedFilters) {
      setShowAdvancedFilters(false);
    }
  });

  const handleMenuToggle = (executionId: string, event: React.MouseEvent<HTMLButtonElement>) => {
    if (openMenuId === executionId) {
      setOpenMenuId(null);
      setMenuPosition(null);
    } else {
      setOpenMenuId(executionId);

      // Calculate menu position based on button
      const button = event.currentTarget;
      const rect = button.getBoundingClientRect();
      const menuHeight = 100; // Approximate menu height
      const padding = 8;

      // Position below the button if enough space, otherwise above
      let top = rect.bottom + padding;
      if (top + menuHeight > window.innerHeight) {
        top = rect.top - menuHeight - padding;
      }

      // Position to the right, but adjust if it goes off-screen
      let left = rect.right - 140; // Center-ish alignment
      if (left + 140 > window.innerWidth) {
        left = window.innerWidth - 140 - padding;
      }
      if (left < padding) {
        left = padding;
      }

      setMenuPosition({ top, left });
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;

      // Check if clicked on a menu button
      const isMenuButton = target.closest('[data-execution-menu-button]');
      if (isMenuButton) return;

      // Check if clicked inside the open menu
      if (openMenuId && menuRefs.current[openMenuId]) {
        const menuEl = menuRefs.current[openMenuId];
        // Note: since we're using createPortal, we need to check differently
        // Just close the menu on any outside click
        if (!isMenuButton) {
          setOpenMenuId(null);
          setMenuPosition(null);
        }
      }
    };

    if (openMenuId) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [openMenuId]);

  const fetchExecutions = useCallback(
    async (overrideParams?: Partial<JobExecutionSearchParams>) => {
      setErrorMessage(null);
      setIsLoading(true);

      try {
        let response;
        const offset = (currentPage - 1) * pageSize;

        // Quick filters
        if (quickFilter === "sla-breached") {
          response = await jobExecutionService.getSLABreachedExecutions({
            jobId: jobIdFilter || undefined,
            daysBack: daysBackFilter,
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
              traceIdFilter.trim(),
            );
            response = {
              data: [exec],
              pagination: {
                total: 1,
                limit: pageSize,
                offset: 0,
                hasMore: false,
              },
            };
          } catch {
            response = {
              data: [],
              pagination: {
                total: 0,
                limit: pageSize,
                offset: 0,
                hasMore: false,
              },
            };
          }
        } else if (correlationIdFilter.trim()) {
          response = await jobExecutionService.getExecutionsByCorrelationId(
            correlationIdFilter.trim(),
          );
        } else if (startDateFilter && endDateFilter) {
          response = await jobExecutionService.getExecutionsByDateRange({
            startDate: startDateFilter,
            endDate: endDateFilter,
            jobId: jobIdFilter || undefined,
            limit: pageSize,
            offset,
          });
        } else if (statusFilter === "running") {
          response = await jobExecutionService.getActiveExecutions();
        } else if (statusFilter === "queued") {
          response = await jobExecutionService.getQueuedExecutions();
        } else if (statusFilter === "failure") {
          response = await jobExecutionService.getFailedExecutions({
            jobId: jobIdFilter || undefined,
            daysBack: daysBackFilter,
          });
        } else if (statusFilter) {
          response = await jobExecutionService.getExecutionsByStatus(
            statusFilter,
            {
              limit: pageSize,
              offset,
            },
          );
        } else if (jobIdFilter) {
          response = await jobExecutionService.getExecutionsByJobId(
            Number(jobIdFilter),
            {
              limit: pageSize,
              offset,
            },
          );
        } else {
          // Use search endpoint for general queries
          const params: JobExecutionSearchParams = {
            filters: {},
            limit: pageSize,
            offset,
            skipCache: true,
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

        // Ensure we always have an array
        let executionList: JobExecution[] = [];
        const responseData = response as unknown as Record<string, unknown>;
        if (responseData && responseData.data) {
          if (Array.isArray(responseData.data)) {
            executionList = responseData.data as JobExecution[];
          } else {
            const nestedData = responseData.data as Record<string, unknown>;
            if (
              nestedData &&
              "data" in nestedData &&
              Array.isArray(nestedData.data)
            ) {
              executionList = nestedData.data as JobExecution[];
            }
          }
        }

        // Extract pagination metadata
        if (response && "pagination" in response && response.pagination) {
          setTotalExecutions(response.pagination.total || 0);
          setHasMore(response.pagination.hasMore || false);
        }

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
        showError("Job Executions", extractBackendError(error, "Job Executions. Please try again."));
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
      currentPage,
      pageSize,
    ],
  );

  const fetchStats = useCallback(async () => {
    setIsLoadingStats(true);
    try {
      const response = await jobExecutionService
        .getExecutionStatistics({ skipCache: true })
        .catch((err) => {
          console.error("Failed to fetch execution statistics:", err);
          return null;
        });

      if (response) {
        // Handle both wrapped response { success, data, source } and direct data
        const responseObj = response as unknown as Record<string, unknown>;
        const statsData =
          (responseObj.data as unknown as Record<string, unknown>) ||
          responseObj;

        // Parse string values to numbers
        const totalExecutions =
          parseInt(String(statsData.total_executions), 10) || 0;
        const successfulExecutions =
          parseInt(String(statsData.successful), 10) || 0;
        const failedExecutions = parseInt(String(statsData.failed), 10) || 0;
        const timedOut = parseInt(String(statsData.timed_out), 10) || 0;
        const aborted = parseInt(String(statsData.aborted), 10) || 0;
        const slaBreaches = parseInt(String(statsData.sla_breaches), 10) || 0;

        setStats({
          totalExecutions,
          successfulExecutions,
          failedExecutions,
          timedOut,
          aborted,
          slaBreaches,
        });
      }
    } catch (err) {
      console.error("Failed to load stats:", err);
      showError("Failed to load execution statistics", extractBackendError(error, "Failed to load execution statistics. Please try again."));
    } finally {
      setIsLoadingStats(false);
    }
  }, [showError]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [
    statusFilter,
    jobIdFilter,
    daysBackFilter,
    quickFilter,
    traceIdFilter,
    correlationIdFilter,
    startDateFilter,
    endDateFilter,
    longRunningThreshold,
    searchTerm,
  ]);

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
          exec.correlation_id.toLowerCase().includes(term)),
    );
  }, [executions, searchTerm]);

  // Batch selection handlers
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

  const handleBatchAction = async (action: "abort" | "archive" | "retry") => {
    if (selectedExecutions.size === 0) return;

    const executionIds = Array.from(selectedExecutions);
    setIsBatchProcessing(true);

    try {
      switch (action) {
        case "abort":
          await Promise.all(
            executionIds.map((id) =>
              jobExecutionService.markJobExecutionAborted(id, {
                userId: user.user_id,
                reason: "Batch abort",
              }),
            ),
          );
          showToast(
            "Executions Aborted",
            `${executionIds.length} execution(s) aborted successfully`,
          );
          break;
        case "archive":
          if (!user?.user_id) return;
          setExecutions((prev) =>
            prev.map((exec) =>
              selectedExecutions.has(exec.id) ? { ...exec, is_archived: true } : exec,
            ),
          );
          try {
            await jobExecutionService.bulkArchiveJobExecutions({
              executionIds,
              userId: user.user_id,
            });
            showToast(
              "Executions Archived",
              `${executionIds.length} execution(s) archived successfully`,
            );
          } catch (err) {
            await fetchExecutions();
            throw err;
          }
          break;
        case "retry": {
          if (!user?.user_id) return;
          // Get unique job IDs from selected executions
          const jobIds = Array.from(
            new Set(
              filteredExecutions
                .filter((exec) => selectedExecutions.has(exec.id))
                .map((exec) => exec.job_id),
            ),
          );
          setExecutions((prev) =>
            prev.map((exec) =>
              selectedExecutions.has(exec.id)
                ? { ...exec, status: "pending" }
                : exec,
            ),
          );
          try {
            await Promise.all(
              jobIds.map((jobId) =>
                jobExecutionService.retryFailedJobExecutions({
                  jobId,
                  daysBack: daysBackInput,
                  userId: user.user_id,
                }),
              ),
            );
            showToast(
              "Retry Initiated",
              `Retrying failed executions for ${jobIds.length} job(s) from the last ${daysBackInput} day(s)`,
            );
          } catch (err) {
            await fetchExecutions();
            throw err;
          }
          break;
        }
      }
      setSelectedExecutions(new Set());
      setIsSelectionMode(false);
      fetchExecutions();
    } catch (err) {
      showError(        `Batch ${action} failed`,        err instanceof Error ? err.message : "Unknown error",      );
    } finally {
      setIsBatchProcessing(false);
    }
  };

  const handleAction = async (
    execution: JobExecution,
    action: "abort" | "archive" | "unarchive" | "retry",
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
          // Optimistic update
          setExecutions((prev) =>
            prev.map((exec) =>
              exec.id === selectedExecution.id
                ? { ...exec, execution_status: "aborted" as ExecutionStatus }
                : exec,
            ),
          );
          await jobExecutionService.markJobExecutionAborted(
            selectedExecution.id,
            {
              userId: user.user_id,
              reason: "User requested abort",
            },
          );
          showToast(
            "Execution Aborted",
            "The execution has been aborted successfully",
          );
          break;
        case "archive":
          // Optimistic update
          setExecutions((prev) =>
            prev.map((exec) =>
              exec.id === selectedExecution.id
                ? { ...exec, archived: true }
                : exec,
            ),
          );
          await jobExecutionService.archiveJobExecution(selectedExecution.id, user?.user_id);
          showToast(
            "Execution Archived",
            "The execution has been archived successfully",
          );
          break;
        case "unarchive":
          // Optimistic update
          setExecutions((prev) =>
            prev.map((exec) =>
              exec.id === selectedExecution.id
                ? { ...exec, archived: false }
                : exec,
            ),
          );
          await jobExecutionService.unarchiveJobExecution(selectedExecution.id, user?.user_id);
          showToast(
            "Execution Unarchived",
            "The execution has been unarchived successfully",
          );
          break;
        case "retry":
          // Optimistic update
          setExecutions((prev) =>
            prev.map((exec) =>
              exec.id === selectedExecution.id
                ? { ...exec, execution_status: "pending" as ExecutionStatus }
                : exec,
            ),
          );
          await jobExecutionService.retryFailedJobExecutions({
            jobId: selectedExecution.job_id,
            daysBack: daysBackInput,
            userId: user.user_id,
          });
          showToast("Retry Initiated", "Failed executions are being retried");
          break;
      }
      setShowActionModal(false);
      setSelectedExecution(null);
      setActionType(null);
      setDaysBackInput(7);
    } catch (err) {
      // Rollback optimistic update on error
      fetchExecutions();
      showError("Action Failed", extractBackendError(error, "Action Failed. Please try again."));
    } finally {
      setIsProcessingAction(false);
    }
  };

  const handleArchiveOld = async () => {
    if (!user?.user_id) return;
    setIsArchiveManagementProcessing(true);
    try {
      await jobExecutionService.archiveOldJobExecutions({
        olderThanDays: archiveOldDays,
        userId: user.user_id,
      });
      showToast(
        "Archive Old Executions",
        `Executions older than ${archiveOldDays} days have been archived`,
      );
      setShowArchiveManagementModal(false);
      setArchiveOldDays(30);
      fetchExecutions();
    } catch (err) {
      showError(
        "Archive Old Failed",
        extractBackendError(error, "Failed to archive old executions. Please try again."),
      );
    } finally {
      setIsArchiveManagementProcessing(false);
    }
  };

  const handleCleanupArchived = async () => {
    if (!user?.user_id) return;
    setIsArchiveManagementProcessing(true);
    try {
      await jobExecutionService.cleanupArchivedJobExecutions({
        userId: user.user_id,
        olderThanDays: archiveOldDays,
      });
      showToast(
        "Cleanup Archived",
        `Archived executions older than ${archiveOldDays} days have been permanently deleted`,
      );
      setShowArchiveManagementModal(false);
      setArchiveOldDays(30);
      fetchExecutions();
    } catch (err) {
      showError(
        "Cleanup Failed",
        extractBackendError(error, "Failed to cleanup archived executions. Please try again."),
      );
    } finally {
      setIsArchiveManagementProcessing(false);
    }
  };

  // Table columns definition
  const defaultColumns = useMemo(
    () =>
      [
        {
          id: "id",
          label: "Execution ID",
          visible: true,
          render: (value) => (
            <div className={`text-sm font-mono ${tw.textPrimary}`}>
              {(value as string).substring(0, 8)}...
            </div>
          ),
        },
        {
          id: "job_id",
          label: "Job ID",
          visible: true,
          render: (value) => (
            <div className={`text-sm font-medium ${tw.textSecondary}`}>
              {value}
            </div>
          ),
        },
        {
          id: "execution_status",
          label: "Status",
          visible: true,
          render: (value) => (
            <span className="text-sm text-black font-medium">
              {value}
            </span>
          ),
        },
        {
          id: "started_at",
          label: "Started At",
          visible: true,
          render: (value) => (
            <div className={`text-sm ${tw.textSecondary}`}>
              {value ? new Date(value as string).toLocaleString() : "—"}
            </div>
          ),
        },
        {
          id: "duration_seconds",
          label: "Duration",
          visible: true,
          render: (value) => (
            <div className={`text-sm ${tw.textSecondary}`}>
              {formatDuration(value as number | null)}
            </div>
          ),
        },
        {
          id: "triggered_by",
          label: "Triggered By",
          visible: true,
          render: (value) => (
            <div className={`text-sm capitalize ${tw.textSecondary}`}>
              {value || "—"}
            </div>
          ),
        },
        {
          id: "actions",
          label: "Actions",
          visible: true,
          sortable: false,
          render: (value, execution) => (
            <div className="flex items-center justify-end space-x-2">
              <button
                onClick={() =>
                  navigate(
                    `/dashboard/job-executions/${execution.id}`,
                  )
                }
                className={`p-2 icon-edit ${tw.rounded} text-gray-600 hover:text-gray-900`}
                title="View details"
              >
                <Eye className="w-4 h-4" />
              </button>
              {canWrite && !execution.archived && (
                <button
                  onClick={() => handleAction(execution, "archive")}
                  className={`p-2 ${tw.rounded} text-gray-600 hover:text-gray-900`}
                  title="Archive execution"
                >
                  <Archive className="w-4 h-4" />
                </button>
              )}
              {canWrite && execution.archived && (
                <button
                  onClick={() => handleAction(execution, "unarchive")}
                  className={`p-2 ${tw.rounded} text-gray-600 hover:text-gray-900`}
                  title="Unarchive execution"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              )}
              {canWrite && (execution.execution_status === "running" || execution.execution_status === "failure") && (
                <>
                  <button
                    ref={(el) => {
                      if (el) menuRefs.current[execution.id] = el;
                    }}
                    data-execution-menu-button
                    onClick={(e) => handleMenuToggle(execution.id, e)}
                    className={`p-2 ${tw.rounded} text-gray-600 hover:text-gray-900`}
                    title="More actions"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </button>
                  {openMenuId === execution.id &&
                    menuPosition &&
                    createPortal(
                      <div
                        className={`fixed bg-white border border-gray-200 ${tw.rounded} shadow-lg z-50`}
                        style={{
                          top: `${menuPosition.top}px`,
                          left: `${menuPosition.left}px`,
                          width: "140px",
                        }}
                        onClick={(e) => e.stopPropagation()}
                        onMouseDown={(e) => e.stopPropagation()}
                      >
                        {execution.execution_status === "running" && (
                          <button
                            onClick={() => {
                              handleAction(execution, "abort");
                              setOpenMenuId(null);
                              setMenuPosition(null);
                            }}
                            className="block w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-red-50"
                          >
                            Abort
                          </button>
                        )}
                        {execution.execution_status === "failure" && (
                          <button
                            onClick={() => {
                              handleAction(execution, "retry");
                              setOpenMenuId(null);
                              setMenuPosition(null);
                            }}
                            className="block w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-50"
                          >
                            Retry
                          </button>
                        )}
                      </div>,
                      document.body,
                    )}
                </>
              )}
            </div>
          ),
        },
      ] as TableColumn<JobExecution>[],
    [canWrite, navigate],
  );

  const {
    columns,
    currentPage: tableCurrentPage,
    pageSize: tablePageSize,
    handlePageChange: tableHandlePageChange,
    handlePageSizeChange: tableHandlePageSizeChange,
    sortConfigs,
    handleSort,
  } = useTable({
    tableId: "job-executions-table",
    defaultColumns,
    defaultPageSize: DEFAULT_PAGE_SIZE,
    persistToLocalStorage: true,
  });

  return (
    <>
      <div className="overflow-x-auto">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
          <BackButton
            showBreadcrumb={true}
            currentLabel="Job Executions"
          />
          <div className="flex gap-3">
            <button
              onClick={() => navigate("/dashboard/job-executions/analytics")}
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
            <PermissionGate permission="job-executions.select">
              <button
                onClick={() => {
                  if (!isSelectionMode) {
                    setIsSelectionMode(true);
                    setSelectedExecutions(
                      new Set(filteredExecutions.map((exec) => exec.id)),
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
                {isSelectionMode ? "Exit Selection" : "Select Executions"}
              </button>
            </PermissionGate>
            <PermissionGate permission="job-executions.write">
              <button
                onClick={() => setShowArchiveManagementModal(true)}
                className={`inline-flex items-center gap-2 ${tw.rounded} px-4 py-2 text-sm font-medium focus:outline-none transition-colors`}
                style={{
                  backgroundColor: "transparent",
                  color: color.primary.action,
                  border: `1px solid ${color.primary.action}`,
                }}
              >
                <Archive className="h-4 w-4" />
                Manage Archive
              </button>
            </PermissionGate>
          </div>
        </div>
        <p className={`${tw.textSecondary} text-sm mt-1`}>
          Monitor and track all job execution records
        </p>

      <div className="mt-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
        <div
          className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm`}
        >
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
        <div
          className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm`}
        >
          <div className="flex items-center gap-2">
            <CheckCircle
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
            <XCircle
              className="h-5 w-5"
              style={{ color: color.primary.accent }}
            />
            <p className="text-sm font-medium text-gray-600">Timed Out</p>
          </div>
          <p className="mt-2 text-3xl font-bold text-gray-900">
            {isLoadingStats ? "..." : stats.timedOut}
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
            <p className="text-sm font-medium text-gray-600">Aborted</p>
          </div>
          <p className="mt-2 text-3xl font-bold text-gray-900">
            {isLoadingStats ? "..." : stats.aborted}
          </p>
        </div>
        <div
          className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm`}
        >
          <div className="flex items-center gap-2">
            <Pause
              className="h-5 w-5"
              style={{ color: color.primary.accent }}
            />
            <p className="text-sm font-medium text-gray-600">SLA Breaches</p>
          </div>
          <p className="mt-2 text-3xl font-bold text-gray-900">
            {isLoadingStats ? "..." : stats.slaBreaches}
          </p>
        </div>
      </div>
      </div>

      <div className="space-y-4 mt-6">
        <div className="flex gap-4">
          <SearchInput
          placeholder="Search by execution ID, job ID, status, trace ID, or correlation ID"
          value={searchTerm}
          onChange={setSearchTerm}
        />
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
      </div>

      {/* Batch Actions Toolbar */}
      {isSelectionMode && selectedExecutions.size > 0 && (
        <div
          className={`flex items-center justify-between ${tw.rounded} border border-gray-200 bg-white px-4 py-3`}
        >
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">
              {selectedExecutions.size} execution(s) selected
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
              onClick={() => handleBatchAction("abort")}
              disabled={isBatchProcessing}
              className={`inline-flex items-center gap-2 ${tw.rounded} px-3 py-1.5 text-sm font-medium text-red-700 border border-red-200 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <Ban className="h-4 w-4" />
              Abort Running
            </button>
            <button
              onClick={() => handleBatchAction("archive")}
              disabled={isBatchProcessing}
              className={`inline-flex items-center gap-2 ${tw.rounded} border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <Archive className="h-4 w-4" />
              Archive
            </button>
            <button
              onClick={() => handleBatchAction("retry")}
              disabled={isBatchProcessing}
              className={`inline-flex items-center gap-2 ${tw.rounded} px-3 py-1.5 text-sm font-semibold text-white disabled:opacity-50 disabled:cursor-not-allowed`}
              style={{ backgroundColor: color.primary.action }}
            >
              <RotateCcw className="h-4 w-4" />
              Retry Failed
            </button>
          </div>
        </div>
      )}

      {/* Advanced Filters Modal */}
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
              ref={filtersModalRef}
              className="absolute right-0 top-0 h-full w-full sm:w-[28rem] lg:w-96 bg-white shadow-xl transform transition-transform duration-300 ease-out translate-x-0"
              style={{ zIndex: 1000000 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex flex-col h-full">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-200">
                  <h2 className="text-sm font-semibold text-gray-900">
                    Filter Executions
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
                              quickFilter === "sla-breached"
                                ? ""
                                : "sla-breached",
                            );
                            setStatusFilter("");
                          }}
                          className={`inline-flex items-center gap-2 ${
                            tw.rounded
                          } px-3 py-1.5 text-sm font-medium transition-colors ${
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
                              quickFilter === "long-running"
                                ? ""
                                : "long-running",
                            );
                            setStatusFilter("");
                          }}
                          className={`inline-flex items-center gap-2 ${
                            tw.rounded
                          } px-3 py-1.5 text-sm font-medium transition-colors ${
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
                              quickFilter === "currently-running"
                                ? ""
                                : "currently-running",
                            );
                            setStatusFilter("");
                          }}
                          className={`inline-flex items-center gap-2 ${
                            tw.rounded
                          } px-3 py-1.5 text-sm font-medium transition-colors ${
                            quickFilter === "currently-running"
                              ? "bg-blue-100 text-blue-700 border border-blue-300"
                              : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50"
                          }`}
                        >
                          <Activity className="h-4 w-4" />
                          Currently Running
                        </button>
                      </div>
                    </div>
                    <div>
                      <Input
                        label="Job ID"
                        type="number"
                        className={`w-full ${tw.rounded} border border-gray-200 px-3 py-2 text-sm`}
                        placeholder="Filter by job ID"
                        value={jobIdFilter}
                        onChange={(value) =>
                          setJobIdFilter(
                            String(value) ? Number(String(value)) : "",
                          )
                        }
                      />
                    </div>
                    <div>
                      <Input
                        label="Days Back"
                        type="number"
                        className={`w-full ${tw.rounded} border border-gray-200 px-3 py-2 text-sm`}
                        placeholder="7"
                        value={daysBackFilter}
                        onChange={(value) =>
                          setDaysBackFilter(Number(String(value)) || 7)
                        }
                      />
                    </div>
                    <div>
                      <Input
                        label="Start Date"
                        type="date"
                        className={`w-full ${tw.rounded} border border-gray-200 px-3 py-2 text-sm`}
                        value={startDateFilter}
                        onChange={(value) => setStartDateFilter(String(value))}
                      />
                    </div>
                    <div>
                      <Input
                        label="End Date"
                        type="date"
                        className={`w-full ${tw.rounded} border border-gray-200 px-3 py-2 text-sm`}
                        value={endDateFilter}
                        onChange={(value) => setEndDateFilter(String(value))}
                      />
                    </div>
                    <div>
                      <Input
                        label="Correlation ID"
                        type="text"
                        className={`w-full ${tw.rounded} border border-gray-200 px-3 py-2 text-sm`}
                        placeholder="Filter by correlation ID"
                        value={correlationIdFilter}
                        onChange={(value) => setCorrelationIdFilter(String(value))}
                      />
                    </div>
                    <div>
                      <Input
                        label="Trace ID"
                        type="text"
                        className={`w-full ${tw.rounded} border border-gray-200 px-3 py-2 text-sm`}
                        placeholder="Filter by trace ID"
                        value={traceIdFilter}
                        onChange={(value) => setTraceIdFilter(String(value))}
                      />
                    </div>
                    {quickFilter === "long-running" && (
                      <div>
                        <Input
                          label="Threshold (minutes)"
                          type="number"
                          className={`w-full ${tw.rounded} border border-gray-200 px-3 py-2 text-sm`}
                          placeholder="60"
                          value={longRunningThreshold}
                          onChange={(value) =>
                            setLongRunningThreshold(
                              Number(String(value)) || 60,
                            )
                          }
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer */}
                <div className="border-t border-gray-200 p-4">
                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        setJobIdFilter("");
                        setDaysBackFilter(7);
                        setStartDateFilter("");
                        setEndDateFilter("");
                        setCorrelationIdFilter("");
                        setTraceIdFilter("");
                        setLongRunningThreshold(60);
                        setQuickFilter("");
                      }}
                      className={`flex-1 ${tw.rounded} border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50`}
                    >
                      Clear
                    </button>
                    <button
                      onClick={() => setShowAdvancedFilters(false)}
                      className={`flex-1 ${tw.rounded} px-4 py-2 text-sm font-medium text-white`}
                      style={{ backgroundColor: color.primary.action }}
                    >
                      Apply
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>,
          document.body,
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
              No Job Executions Found
            </p>
            <p className="mt-2 text-sm text-gray-500">
              Try updating your search filters or check back later.
            </p>
          </div>
        ) : (
          <>
            <Table<JobExecution>
              columns={columns}
              data={filteredExecutions}
              totalItems={searchTerm.trim() ? filteredExecutions.length : totalExecutions}
              currentPage={currentPage}
              pageSize={pageSize}
              isLoading={isLoading}
              onPageChange={setCurrentPage}
              onSort={handleSort}
              sortConfigs={sortConfigs}
              style={{
                headerBackground: color.surface.tableHeader,
                headerTextColor: color.surface.tableHeaderText,
                rowBackground: color.surface.tablebodybg,
                rowSpacing: "0 8px",
              }}
            />

            {/* Pagination Controls */}
            {filteredExecutions.length > 0 && (
              <div className="mt-4">
                <Pagination
                  currentPage={currentPage}
                  pageSize={pageSize}
                  totalItems={searchTerm.trim() ? filteredExecutions.length : totalExecutions}
                  onPageChange={setCurrentPage}
                  onPageSizeChange={setPageSize}
                />
              </div>
            )}
          </>
        )}
      </div>

      {/* Action Confirmation Modal */}
      {showActionModal && selectedExecution && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div
            className={`bg-white ${tw.rounded} shadow-xl p-6 w-full max-w-md`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {actionType === "abort" && "Abort Execution"}
                {actionType === "archive" && "Archive Execution"}
                {actionType === "unarchive" && "Unarchive Execution"}
                {actionType === "retry" && "Retry Execution"}
              </h3>
              <button
                onClick={() => {
                  setShowActionModal(false);
                  setSelectedExecution(null);
                  setActionType(null);
                  setDaysBackInput(7);
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
              {actionType === "unarchive" &&
                "Are you sure you want to unarchive this execution?"}
              {actionType === "retry" &&
                "This will retry all failed executions for this job. Continue?"}
            </p>
            {actionType === "retry" && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Days Back
                </label>
                <input
                  type="number"
                  min="1"
                  max="365"
                  value={daysBackInput}
                  onChange={(e) => setDaysBackInput(Number(e.target.value))}
                  className={`w-full px-3 py-2 text-sm border border-gray-300 ${tw.rounded} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  placeholder="Enter days back"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Retry failed executions from the last {daysBackInput} day(s)
                </p>
              </div>
            )}
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowActionModal(false);
                  setSelectedExecution(null);
                  setActionType(null);
                  setDaysBackInput(7);
                }}
                className={`flex-1 ${tw.rounded} border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50`}
                disabled={isProcessingAction}
              >
                Cancel
              </button>
              <button
                onClick={confirmAction}
                disabled={isProcessingAction}
                className={`flex-1 ${tw.rounded} px-4 py-2 text-sm font-medium text-white`}
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

      {/* Archive Management Modal */}
      {showArchiveManagementModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div
            className={`bg-white ${tw.rounded} shadow-xl p-6 w-full max-w-md`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Manage Archive
              </h3>
              <button
                onClick={() => {
                  setShowArchiveManagementModal(false);
                  setArchiveOldDays(30);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Archive Executions Older Than (Days)
                </label>
                <input
                  type="number"
                  min="1"
                  max="365"
                  value={archiveOldDays}
                  onChange={(e) => setArchiveOldDays(Number(e.target.value))}
                  className={`w-full px-3 py-2 text-sm border border-gray-300 ${tw.rounded} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  placeholder="30"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Archive all executions older than {archiveOldDays} day(s)
                </p>
              </div>

              <div className="flex flex-col gap-2">
                <button
                  onClick={handleArchiveOld}
                  disabled={isArchiveManagementProcessing}
                  className={`w-full ${tw.rounded} px-4 py-2 text-sm font-medium text-white transition-colors`}
                  style={{
                    backgroundColor: isArchiveManagementProcessing ? "#9ca3af" : color.primary.action,
                  }}
                >
                  {isArchiveManagementProcessing ? "Processing..." : "Archive Old Executions"}
                </button>
                <button
                  onClick={handleCleanupArchived}
                  disabled={isArchiveManagementProcessing}
                  className={`w-full ${tw.rounded} px-4 py-2 text-sm font-medium border border-red-200 text-red-700 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {isArchiveManagementProcessing ? "Processing..." : "Delete Archived Executions"}
                </button>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowArchiveManagementModal(false);
                  setArchiveOldDays(30);
                }}
                disabled={isArchiveManagementProcessing}
                className={`flex-1 ${tw.rounded} border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50`}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    </>
  );
}
