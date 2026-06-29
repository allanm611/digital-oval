import { useCallback, useEffect, useMemo, useState, useRef } from "react";
import { createPortal } from "react-dom";
import {
  AlertTriangle,
  CheckCircle,
  Eye,
  Edit,
  Plus,
  Trash2,
  Play,
  Pause,
  X,
  CheckSquare,
  Square,
  Filter,
  BarChart3,
  GitBranch,
  Layers,
  Activity,
  Zap,
  Copy,
  Workflow,
  MoreHorizontal,
} from "lucide-react";
import SearchInput from "../../../shared/components/ui/SearchInput";
import Textarea from "../../../shared/components/ui/Textarea";
import BackButton from "../../../shared/components/ui/BackButton";
import { useNavigate } from "react-router-dom";
import LoadingSpinner from "../../../shared/components/ui/LoadingSpinner";
import DeleteConfirmModal from "../../../shared/components/ui/DeleteConfirmModal";
import HeadlessSelect from "../../../shared/components/ui/HeadlessSelect";
import Pagination, { DEFAULT_PAGE_SIZE, getInitialPageSize } from "../../../shared/components/ui/Pagination";
import Input from "../../../shared/components/ui/Input";
import { color, tw, zIndex, noteStyles, button, getButtonStyles } from "../../../shared/utils/utils";
import { useToast } from "../../../contexts/ToastContext";
import { extractBackendError } from "../../../shared/utils/errorHandler";;;
import { useLanguage } from "../../../contexts/LanguageContext";
import FeatureActionButton from "../../../shared/components/FeatureActionButton";
import { PermissionGate } from "../../auth/components/PermissionGate";
import { jobWorkflowStepService } from "../services/jobWorkflowStepService";
import { scheduledJobService } from "../services/scheduledJobService";
import { useClickOutside } from "../../../shared/hooks/useClickOutside";
import type {
  JobWorkflowStep,
  JobWorkflowStepSearchParams,
  StepType,
  FailureAction,
} from "../types/jobWorkflowStep";
import { useAuth } from "../../../contexts/AuthContext";
import type { ScheduledJob } from "../types/scheduledJob";
import Checkbox from "../../../shared/components/ui/Checkbox";
import { useDeleteConfirm } from "../../../shared/hooks/useDeleteConfirm";
import { Table, useTable, type TableColumn } from "../../../shared/components/Table";

const STEP_TYPE_OPTIONS: Array<{ label: string; value: StepType | "" }> = [
  { label: "All Types", value: "" },
  { label: "SQL", value: "sql" },
  { label: "Stored Procedure", value: "stored_proc" },
  { label: "API Call", value: "api_call" },
  { label: "Python Script", value: "python_script" },
  { label: "Node.js Script", value: "node_js_script" },
  { label: "Shell Script", value: "shell_script" },
  { label: "File Transfer", value: "file_transfer" },
  { label: "Data Validation", value: "data_validation" },
  { label: "Notification", value: "notification" },
  { label: "Wait", value: "wait" },
];

const FAILURE_ACTION_OPTIONS: Array<{ label: string; value: FailureAction | "" }> = [
  { label: "All Actions", value: "" },
  { label: "Abort", value: "abort" },
  { label: "Continue", value: "continue" },
  { label: "Retry", value: "retry" },
  { label: "Skip Remaining", value: "skip_remaining" },
];

export default function JobWorkflowStepsPage() {
  const navigate = useNavigate();
  const { error: showError, success: showToast } = useToast();
  const { t } = useLanguage();
  const { user } = useAuth();

  const [steps, setSteps] = useState<JobWorkflowStep[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [stepTypeFilter, setStepTypeFilter] = useState<StepType | "">("");
  const [jobIdFilter, setJobIdFilter] = useState<number | "">("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [stats, setStats] = useState({
    totalSteps: 0,
    activeSteps: 0,
    criticalSteps: 0,
    stepsWithRetry: 0,
    stepsWithValidation: 0,
    parallelGroups: 0,
  });
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingStep, setDeletingStep] = useState<JobWorkflowStep | null>(
    null,
  );
  const [isDeleting, setIsDeleting] = useState(false);
  const [validateLoadingId, setValidateLoadingId] = useState<number | null>(
    null,
  );
  const [showActionMenu, setShowActionMenu] = useState<number | null>(null);
  const [actionMenuPosition, setActionMenuPosition] = useState<{
    top: number;
    left: number;
    width?: number;
    maxHeight?: number;
  } | null>(null);
  const actionMenuRefs = useRef<Record<number, HTMLDivElement | null>>({});
  const [jobMap, setJobMap] = useState<Record<number, ScheduledJob>>({});
  // Bulk selection and batch operations
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedSteps, setSelectedSteps] = useState<Set<number>>(new Set());
  const [isBatchProcessing, setIsBatchProcessing] = useState(false);
  // Advanced filters
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [stepCodeFilter, setStepCodeFilter] = useState<string>("");
  const [stepOrderFilter, setStepOrderFilter] = useState<number | "">("");
  const [isCriticalFilter, setIsCriticalFilter] = useState<boolean | "">("");
  const [isParallelFilter, setIsParallelFilter] = useState<boolean | "">("");
  const [isActiveFilter, setIsActiveFilter] = useState<boolean | "">("");
  const [failureActionFilter, setFailureActionFilter] = useState<
    FailureAction | ""
  >("");
  const [parallelGroupIdFilter, setParallelGroupIdFilter] = useState<
    number | ""
  >("");
  const filterRef = useRef<HTMLDivElement>(null);
  // Special filter views
  const [showValidationSteps, setShowValidationSteps] = useState(false);
  const [showRetrySteps, setShowRetrySteps] = useState(false);
  const [showOrphanedSteps, setShowOrphanedSteps] = useState(false);
  // Reorder modal
  const [showReorderModal, setShowReorderModal] = useState(false);
  const [reorderData, setReorderData] = useState<
    Array<{
      stepId: number;
      stepName: string;
      currentOrder: number;
      newOrder: number;
    }>
  >([]);
  const [isReordering, setIsReordering] = useState(false);
  // Drag and drop state
  const [draggedItem, setDraggedItem] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  // Delete all modal
  const [showDeleteAllModal, setShowDeleteAllModal] = useState(false);
  const [deleteAllJobId, setDeleteAllJobId] = useState<number | null>(null);
  const [isDeletingAll, setIsDeletingAll] = useState(false);
  // Batch update modal
  const [showBatchUpdateModal, setShowBatchUpdateModal] = useState(false);
  const [batchUpdateFields, setBatchUpdateFields] = useState<{
    is_active?: boolean;
    is_critical?: boolean;
    timeout_seconds?: number;
    retry_count?: number;
    on_failure_action?: FailureAction;
  }>({});
  const [isBatchUpdating, setIsBatchUpdating] = useState(false);
  // Pagination
  const [totalCount, setTotalCount] = useState(0);

  // Table with pagination
  const {
    currentPage: tableCurrentPage,
    pageSize: tablePageSize,
    handlePageChange: tableHandlePageChange,
    handlePageSizeChange: tableHandlePageSizeChange,
  } = useTable({
    tableId: "job-workflow-steps-table",
    defaultPageSize: getInitialPageSize(),
    persistToLocalStorage: true,
  });

  // Use click outside hook for filter modal
  useClickOutside(filterRef, () => setShowAdvancedFilters(false), {
    enabled: showAdvancedFilters,
  });

  const fetchSteps = useCallback(
    async (overrideParams?: Partial<JobWorkflowStepSearchParams>) => {
      setErrorMessage(null);
      const trimmedSearchTerm = searchTerm.trim();
      const hasSearchTerm = !!trimmedSearchTerm;

      setIsLoading(true);

      try {
        let response;

        // Use specific lookup endpoints when we have both job_id and step_code or step_order
        if (jobIdFilter && stepCodeFilter.trim()) {
          // Use getStepByJobAndCode for precise lookup
          try {
            const step = await jobWorkflowStepService.getStepByJobAndCode(
              Number(jobIdFilter),
              stepCodeFilter.trim(),
              true,
            );
            response = { data: [step], count: 1 };
          } catch (err) {
            // If specific lookup fails, fall back to search
            console.warn("getStepByJobAndCode failed, using search:", err);
            response = await jobWorkflowStepService.searchJobWorkflowSteps({
              job_id: Number(jobIdFilter),
              step_code: stepCodeFilter.trim(),
              limit: tablePageSize,
              offset: (tableCurrentPage - 1) * tablePageSize,
              skipCache: true,
            });
          }
        } else if (jobIdFilter && stepOrderFilter !== "") {
          // Use getStepByJobAndOrder for precise lookup
          try {
            const step = await jobWorkflowStepService.getStepByJobAndOrder(
              Number(jobIdFilter),
              Number(stepOrderFilter),
              true,
            );
            response = { data: [step], count: 1 };
          } catch (err) {
            // If specific lookup fails, fall back to search
            console.warn("getStepByJobAndOrder failed, using search:", err);
            response = await jobWorkflowStepService.searchJobWorkflowSteps({
              job_id: Number(jobIdFilter),
              step_order: Number(stepOrderFilter),
              limit: tablePageSize,
              offset: (tableCurrentPage - 1) * tablePageSize,
              skipCache: true,
            });
          }
        } else if (jobIdFilter) {
          // Get steps for specific job - use search with pagination
          response = await jobWorkflowStepService.searchJobWorkflowSteps({
            job_id: Number(jobIdFilter),
            limit: pageSize,
            offset: (currentPage - 1) * pageSize,
            skipCache: true,
          });
        } else if (stepTypeFilter) {
          // Get steps by type - use search with pagination
          response = await jobWorkflowStepService.searchJobWorkflowSteps({
            step_type: stepTypeFilter,
            limit: pageSize,
            offset: (currentPage - 1) * pageSize,
            skipCache: true,
          });
        } else if (isCriticalFilter === true) {
          // Get critical steps - use search with pagination
          response = await jobWorkflowStepService.searchJobWorkflowSteps({
            is_critical: true,
            limit: pageSize,
            offset: (currentPage - 1) * pageSize,
            skipCache: true,
          });
        } else if (showValidationSteps) {
          // Get validation steps - these endpoints don't support pagination, so we'll get all and paginate client-side
          const allResponse = await jobWorkflowStepService.getValidationSteps({
            job_id: jobIdFilter ? Number(jobIdFilter) : undefined,
            skipCache: true,
          });
          const allSteps = allResponse.data || [];
          const startIndex = (currentPage - 1) * pageSize;
          const endIndex = startIndex + pageSize;
          response = {
            data: allSteps.slice(startIndex, endIndex),
            pagination: {
              total: allSteps.length,
              limit: pageSize,
              offset: startIndex,
              hasMore: endIndex < allSteps.length,
            },
          };
        } else if (showRetrySteps) {
          // Get retry steps - these endpoints don't support pagination, so we'll get all and paginate client-side
          const allResponse = await jobWorkflowStepService.getRetrySteps({
            job_id: jobIdFilter ? Number(jobIdFilter) : undefined,
            skipCache: true,
          });
          const allSteps = allResponse.data || [];
          const startIndex = (currentPage - 1) * pageSize;
          const endIndex = startIndex + pageSize;
          response = {
            data: allSteps.slice(startIndex, endIndex),
            pagination: {
              total: allSteps.length,
              limit: pageSize,
              offset: startIndex,
              hasMore: endIndex < allSteps.length,
            },
          };
        } else if (showOrphanedSteps) {
          // Get orphaned steps - these endpoints don't support pagination, so we'll get all and paginate client-side
          const allResponse =
            await jobWorkflowStepService.getOrphanedSteps(true);
          const allSteps = allResponse.data || [];
          const startIndex = (currentPage - 1) * pageSize;
          const endIndex = startIndex + pageSize;
          response = {
            data: allSteps.slice(startIndex, endIndex),
            pagination: {
              total: allSteps.length,
              limit: pageSize,
              offset: startIndex,
              hasMore: endIndex < allSteps.length,
            },
          };
        } else if (
          hasSearchTerm ||
          stepCodeFilter ||
          stepOrderFilter !== "" ||
          isCriticalFilter !== "" ||
          isParallelFilter !== "" ||
          isActiveFilter !== "" ||
          failureActionFilter ||
          parallelGroupIdFilter
        ) {
          // Use search endpoint with filters
          const params: JobWorkflowStepSearchParams = {
            limit: pageSize,
            offset: (currentPage - 1) * pageSize,
            ...overrideParams,
            skipCache: true,
          };
          if (hasSearchTerm) {
            params.step_name = trimmedSearchTerm;
          }
          if (stepCodeFilter) {
            params.step_code = stepCodeFilter;
          }
          if (stepOrderFilter !== "") {
            params.step_order = Number(stepOrderFilter);
          }
          if (stepTypeFilter) {
            params.step_type = stepTypeFilter;
          }
          if (jobIdFilter) {
            params.job_id = Number(jobIdFilter);
          }
          if (isCriticalFilter !== "") {
            params.is_critical = isCriticalFilter as boolean;
          }
          if (isParallelFilter !== "") {
            params.is_parallel = isParallelFilter as boolean;
          }
          if (isActiveFilter !== "") {
            params.is_active = isActiveFilter as boolean;
          }
          if (failureActionFilter) {
            params.on_failure_action = failureActionFilter;
            // Also use dedicated endpoint for better results
            try {
              const failureActionResponse =
                await jobWorkflowStepService.getStepsByFailureAction(
                  failureActionFilter,
                  true,
                );
              if (
                failureActionResponse.data &&
                failureActionResponse.data.length > 0
              ) {
                response = failureActionResponse;
              }
            } catch {
              // Fall back to search
            }
          }
          if (parallelGroupIdFilter) {
            params.parallel_group_id = Number(parallelGroupIdFilter);
          }
          response =
            await jobWorkflowStepService.searchJobWorkflowSteps(params);
        } else {
          // Use list endpoint
          const params = {
            limit: pageSize,
            offset: (currentPage - 1) * pageSize,
            ...overrideParams,
            skipCache: true,
          };
          response = await jobWorkflowStepService.listJobWorkflowSteps(params);
        }

        const stepList = response.data || [];
        const sortedSteps = [...stepList].sort((a, b) => {
          // Sort by job_id first, then by step_order
          if (a.job_id !== b.job_id) {
            return a.job_id - b.job_id;
          }
          return a.step_order - b.step_order;
        });
        setSteps(sortedSteps);

        // Update total count from pagination response
        if (response.pagination?.total !== undefined) {
          setTotalCount(response.pagination.total);
        } else if (response.count !== undefined) {
          setTotalCount(response.count);
        } else if (response.data) {
          // If no pagination info, use the data length (for single-item responses)
          setTotalCount(response.data.length);
        }
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : t(
                "jobWorkflowSteps.loadFailed",
                "Failed to load job workflow steps",
              );
        setErrorMessage(message);
        showError(t("common.jobWorkflowSteps", "Job Workflow Steps"), message);
      } finally {
        setIsLoading(false);
      }
    },
    [
      searchTerm,
      stepTypeFilter,
      jobIdFilter,
      stepCodeFilter,
      stepOrderFilter,
      isCriticalFilter,
      isParallelFilter,
      isActiveFilter,
      failureActionFilter,
      parallelGroupIdFilter,
      showValidationSteps,
      showRetrySteps,
      showOrphanedSteps,
      showError,
      tableCurrentPage,
      tablePageSize,
      t,
    ],
  );

  const fetchStats = useCallback(async () => {
    setIsLoadingStats(true);
    try {
      const [statistics, healthSummary] = await Promise.all([
        jobWorkflowStepService.getStatistics({ skipCache: true }).catch(() => ({
          success: true,
          data: {
            total_steps: 0,
            steps_by_type: {},
            steps_by_failure_action: {},
            average_timeout: 0,
            average_retry_count: 0,
            critical_steps_percentage: 0,
          },
        })),
        jobIdFilter
          ? jobWorkflowStepService
              .getHealthSummary(Number(jobIdFilter), true)
              .catch(() => ({
                success: true,
                data: {
                  total_steps: 0,
                  active_steps: 0,
                  critical_steps: 0,
                  steps_with_retry: 0,
                  steps_with_validation: 0,
                  parallel_groups: 0,
                  steps_with_dependencies: 0,
                },
              }))
          : Promise.resolve({
              success: true,
              data: {
                total_steps: 0,
                active_steps: 0,
                critical_steps: 0,
                steps_with_retry: 0,
                steps_with_validation: 0,
                parallel_groups: 0,
                steps_with_dependencies: 0,
              },
            }),
      ]);

      const statsData = statistics.data || statistics;
      const healthData = healthSummary.data || healthSummary;

      setStats({
        totalSteps:
          statsData.total_steps !== undefined && statsData.total_steps !== null
            ? Number(statsData.total_steps)
            : steps.length,
        activeSteps:
          healthData.active_steps !== undefined && healthData.active_steps !== null
            ? Number(healthData.active_steps)
            : steps.filter((s) => s.is_active).length,
        criticalSteps:
          healthData.critical_steps !== undefined && healthData.critical_steps !== null
            ? Number(healthData.critical_steps)
            : steps.filter((s) => s.is_critical).length,
        stepsWithRetry:
          healthData.steps_with_retry !== undefined && healthData.steps_with_retry !== null
            ? Number(healthData.steps_with_retry)
            : steps.filter((s) => s.retry_count > 0).length,
        stepsWithValidation:
          healthData.steps_with_validation !== undefined && healthData.steps_with_validation !== null
            ? Number(healthData.steps_with_validation)
            : steps.filter(
                (s) => s.pre_validation_query || s.post_validation_query,
              ).length,
        parallelGroups:
          healthData.parallel_groups !== undefined && healthData.parallel_groups !== null
            ? Number(healthData.parallel_groups)
            : new Set(
                steps
                  .filter((s) => s.parallel_group_id)
                  .map((s) => s.parallel_group_id),
              ).size,
      });
    } catch (err) {
      console.error("Failed to load stats:", err);
    } finally {
      setIsLoadingStats(false);
    }
  }, [jobIdFilter]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchSteps();
    }, 300);
    return () => clearTimeout(timeout);
  }, [fetchSteps]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // Reset selection mode when filters change
  useEffect(() => {
    setIsSelectionMode(false);
    setSelectedSteps(new Set());
  }, [jobIdFilter]);

  // Reset pagination when filters/search change
  useEffect(() => {
    tableHandlePageChange(1);
  }, [
    searchTerm,
    jobIdFilter,
    stepTypeFilter,
    isCriticalFilter,
    isParallelFilter,
    isActiveFilter,
    failureActionFilter,
    parallelGroupIdFilter,
    stepCodeFilter,
    stepOrderFilter,
    tableHandlePageChange,
    showValidationSteps,
    showRetrySteps,
    showOrphanedSteps,
  ]);

  useEffect(() => {
    const loadJobs = async () => {
      try {
        const response = await scheduledJobService.listScheduledJobs({
          limit: 1000,
          skipCache: true,
        });
        const jobList = response.data || [];
        const map: Record<number, ScheduledJob> = {};
        jobList.forEach((job) => {
          map[job.id] = job;
        });
        setJobMap(map);
      } catch (err) {
        console.error("Failed to load jobs:", err);
      }
    };
    loadJobs();
  }, []);

  const filteredSteps = useMemo(() => steps, [steps]);

  // Bulk selection and batch operations
  const handleSelectStep = (stepId: number) => {
    setSelectedSteps((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(stepId)) {
        newSet.delete(stepId);
      } else {
        newSet.add(stepId);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    if (selectedSteps.size === filteredSteps.length) {
      setSelectedSteps(new Set());
    } else {
      setSelectedSteps(new Set(filteredSteps.map((step) => step.id)));
    }
  };

  const handleBatchAction = async (
    action: "activate" | "deactivate" | "delete" | "update",
  ) => {
    if (selectedSteps.size === 0) return;

    const stepIds = Array.from(selectedSteps);
    setIsBatchProcessing(true);

    try {
      let result;
      if (action === "activate") {
        result = await jobWorkflowStepService.batchActivateSteps({
          stepIds,
          userId: user?.user_id ?? null,
        });
      } else if (action === "deactivate") {
        result = await jobWorkflowStepService.batchDeactivateSteps({
          stepIds,
          userId: user?.user_id ?? null,
        });
      } else if (action === "delete") {
        // Delete each step individually (batch delete not available in API)
        let successCount = 0;
        let failedCount = 0;
        for (const stepId of stepIds) {
          try {
            await jobWorkflowStepService.deleteJobWorkflowStep(stepId);
            successCount++;
          } catch {
            failedCount++;
          }
        }
        result = { success: successCount, failed: failedCount };
      } else if (action === "update") {
        // Open batch update modal
        setShowBatchUpdateModal(true);
        setIsBatchProcessing(false);
        return;
      }

      if (result) {
        showToast(
          t("jobWorkflowSteps.batchCompleted", `Batch ${action} completed`),
          t(
            "jobWorkflowSteps.batchSuccess",
            `${result.success} step(s) ${action}d successfully${
              result.failed > 0 ? `, ${result.failed} failed` : ""
            }`,
          ),
        );
      }

      setSelectedSteps(new Set());
      setIsSelectionMode(false);
      // Optimistically update: filter out disabled steps, add enabled ones
      // Note: fetchSteps was called here to refresh the list after batch action
    } catch (err) {
      showError(        t("jobWorkflowSteps.batchFailed", `Batch ${action} failed`),        err instanceof Error ? err.message : t.common.error || "Unknown error",      );
    } finally {
      setIsBatchProcessing(false);
    }
  };

  const handleOpenReorderModal = () => {
    if (!jobIdFilter) {
      showError(
        t("jobWorkflowSteps.jobIdRequired", "Job ID required"),
        t(
          "jobWorkflowSteps.filterByJobToReorder",
          "Please filter by a specific job to reorder steps.",
        ),
      );
      return;
    }

    // Get current steps for the job, sorted by current order
    const jobSteps = filteredSteps
      .filter((s) => s.job_id === Number(jobIdFilter))
      .sort((a, b) => a.step_order - b.step_order);
    const reorderItems = jobSteps.map((step) => ({
      stepId: step.id,
      stepName: step.step_name,
      currentOrder: step.step_order,
      newOrder: step.step_order,
    }));
    setReorderData(reorderItems);
    setShowReorderModal(true);
  };

  const handleDragStart = (index: number) => {
    setDraggedItem(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedItem === null || draggedItem === index) return;
    setDragOverIndex(index);
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedItem === null || draggedItem === dropIndex) return;

    const newData = [...reorderData];
    const draggedItemData = newData[draggedItem];

    // Remove dragged item
    newData.splice(draggedItem, 1);

    // Insert at new position
    newData.splice(dropIndex, 0, draggedItemData);

    // Update order numbers sequentially
    const updatedData = newData.map((item, idx) => ({
      ...item,
      newOrder: idx + 1,
    }));

    setReorderData(updatedData);
    setDraggedItem(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
    setDragOverIndex(null);
  };

  const handleReorderSteps = async () => {
    if (!jobIdFilter) return;

    setIsReordering(true);
    try {
      const stepOrderMapping = reorderData.map((item) => ({
        stepId: item.stepId,
        newOrder: item.newOrder,
      }));

      const result = await jobWorkflowStepService.reorderSteps(
        Number(jobIdFilter),
        {
          stepOrderMapping,
        },
      );

      if (result.data?.updated && result.data.updated > 0) {
        showToast(
          t("jobWorkflowSteps.reordered", "Steps reordered"),
          t(
            "jobWorkflowSteps.reorderedSuccess",
            `${result.data.updated} step(s) reordered successfully.`,
          ),
        );
      } else {
        showToast(
          t("jobWorkflowSteps.reordered", "Steps reordered"),
          t(
            "jobWorkflowSteps.orderUpdated",
            "Step order has been updated successfully.",
          ),
        );
      }

      setShowReorderModal(false);
      // Optimistically update: reorder steps in the array
      setSteps((prev) => {
        const jobId = Number(jobIdFilter);
        return prev.map((step) => {
          const reorderItem = reorderData.find((r) => r.stepId === step.id);
          return reorderItem ? { ...step, step_order: reorderItem.newOrder } : step;
        });
      });
    } catch (err) {
      showError(        t("jobWorkflowSteps.reorderFailed", "Reorder failed"),        err instanceof Error ? err.message : t.common.error || "Unknown error",      );
    } finally {
      setIsReordering(false);
    }
  };

  const handleDeleteAllSteps = async () => {
    if (!deleteAllJobId) return;

    setIsDeletingAll(true);
    try {
      const result =
        await jobWorkflowStepService.deleteAllStepsForJob(deleteAllJobId);
      showToast(
        t("jobWorkflowSteps.allDeleted", "All steps deleted"),
        t(
          "jobWorkflowSteps.deleteSuccess",
          `${result.deleted_count} step(s) deleted successfully.`,
        ),
      );
      setShowDeleteAllModal(false);
      setDeleteAllJobId(null);
      // Optimistically remove all steps for this job
      setSteps((prev) => prev.filter((step) => step.job_id !== deleteAllJobId));
    } catch (err) {
      showError(        t("jobWorkflowSteps.deleteFailed", "Delete failed"),        err instanceof Error ? err.message : t.common.error || "Unknown error",      );
    } finally {
      setIsDeletingAll(false);
    }
  };

  const handleBatchUpdate = async () => {
    if (selectedSteps.size === 0) return;

    const stepIds = Array.from(selectedSteps);
    setIsBatchUpdating(true);

    try {
      const updates = stepIds.map((stepId) => ({
        id: stepId,
        ...batchUpdateFields,
      }));

      const result = await jobWorkflowStepService.batchUpdateSteps({
        updates,
        userId: user?.user_id ?? null,
      });

      showToast(
        t("jobWorkflowSteps.updateCompleted", "Batch update completed"),
        t(
          "jobWorkflowSteps.updateSuccess",
          `${result.success} step(s) updated successfully${
            result.failed > 0 ? `, ${result.failed} failed` : ""
          }`,
        ),
      );

      setShowBatchUpdateModal(false);
      setBatchUpdateFields({});
      setSelectedSteps(new Set());
      setIsSelectionMode(false);
      // Optimistically update selected steps with batch fields
      setSteps((prev) =>
        prev.map((step) =>
          selectedSteps.has(step.id) ? { ...step, ...batchUpdateFields } : step,
        ),
      );
    } catch (err) {
      showError(        t("jobWorkflowSteps.updateFailed", "Batch update failed"),        err instanceof Error ? err.message : t.common.error || "Unknown error",      );
    } finally {
      setIsBatchUpdating(false);
    }
  };

  const handleValidateIntegrity = async (jobId: number) => {
    try {
      const result =
        await jobWorkflowStepService.validateWorkflowIntegrity(jobId);
      type IntegrityResult = {
        isValid?: boolean;
        valid?: boolean;
        errors?: string[];
        warnings?: string[];
      };
      const res: IntegrityResult & { data?: IntegrityResult } =
        result as IntegrityResult & {
          data?: IntegrityResult;
        };
      const data = res.data ?? res;
      const isValid = data.isValid ?? data.valid ?? false;
      const errors = Array.isArray(data.errors) ? data.errors : [];
      const warnings = Array.isArray(data.warnings) ? data.warnings : [];

      if (isValid) {
        showToast(
          "Workflow Valid",
          warnings.length > 0
            ? `Workflow is valid. Warnings: ${warnings.join(", ")}`
            : "Workflow is valid with no issues.",
        );
      } else {
        showError(
          "Workflow Validation Failed",
          errors.length > 0
            ? `Errors: ${errors.join(", ")}`
            : "Validation failed.",
        );
      }
    } catch (err) {
      showError("Validation failed", extractBackendError(error, "Validation failed. Please try again."));
    }
  };

  const handleActionMenuToggle = (stepId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const el = actionMenuRefs.current[stepId];
    if (el) {
      const rect = el.getBoundingClientRect();
      setActionMenuPosition({
        top: rect.bottom + 8,
        left: rect.left,
        width: 200,
        maxHeight: 300,
      });
      setShowActionMenu(showActionMenu === stepId ? null : stepId);
    }
  };

  const getStepTypeLabel = (type: StepType): string => {
    const option = STEP_TYPE_OPTIONS.find((opt) => opt.value === type);
    return option?.label || type;
  };

  return (
    <>
      <div className="overflow-x-auto">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          <div>
            <div className="flex flex-col lg:flex-row lg:items-center gap-4">
              <BackButton
                showBreadcrumb={true}
                currentLabel="Job Workflow Steps"
              />
            </div>
            <p className={`${tw.textSecondary} text-sm mt-1`}>
              Manage and monitor workflow steps for scheduled jobs
            </p>
          </div>
          <div className="flex gap-3">
            {jobIdFilter && (
              <>
                <button
                  onClick={handleOpenReorderModal}
                  className={`inline-flex items-center gap-2 ${tw.rounded} px-4 py-2 text-sm font-medium focus:outline-none transition-colors`}
                  style={{
                    backgroundColor: "transparent",
                    color: "var(--c-bordered-button-color)",
                    borderColor: "var(--c-bordered-button-color)",
                  borderWidth: "1px",
                  borderStyle: "solid",
                  }}
                >
                  <Workflow className="h-4 w-4" />
                  Reorder Steps
                </button>
                <button
                  onClick={() => {
                    setDeleteAllJobId(Number(jobIdFilter));
                    setShowDeleteAllModal(true);
                  }}
                  className={`inline-flex items-center gap-2 ${tw.rounded} px-4 py-2 text-sm font-medium text-red-700 bg-white border border-red-300 hover:bg-red-50`}
                >
                  <Trash2 className="h-4 w-4" />
                  Delete All
                </button>
              </>
            )}
            <button
              onClick={() => navigate("/dashboard/job-workflow-steps/analytics")}
              className={`inline-flex items-center gap-2 ${tw.rounded} px-4 py-2 text-sm font-medium focus:outline-none transition-colors`}
              style={{
                backgroundColor: "transparent",
                color: "var(--c-bordered-button-color)",
                borderColor: "var(--c-bordered-button-color)",
                  borderWidth: "1px",
                  borderStyle: "solid",
              }}
            >
              <BarChart3 className="h-4 w-4" />
              Analytics
            </button>
            <PermissionGate permission="job-workflow-steps.select">
              <button
                onClick={() => {
                  if (!isSelectionMode) {
                    setIsSelectionMode(true);
                    setSelectedSteps(
                      new Set(filteredSteps.map((step) => step.id)),
                    );
                  } else {
                    setIsSelectionMode(false);
                    setSelectedSteps(new Set());
                  }
                }}
                className={`inline-flex items-center gap-2 ${tw.rounded} px-4 py-2 text-sm font-medium focus:outline-none transition-colors`}
                style={{
                  backgroundColor: isSelectionMode
                    ? color.primary.action
                    : "transparent",
                  color: isSelectionMode ? "white" : "var(--c-bordered-button-color)",
                  borderColor: "var(--c-bordered-button-color)",
                  borderWidth: "1px",
                  borderStyle: "solid",
                }}
              >
                {isSelectionMode ? (
                  <CheckSquare className="h-4 w-4" />
                ) : (
                  <Square className="h-4 w-4" />
                )}
                {isSelectionMode ? "Exit Selection" : "Select Steps"}
              </button>
            </PermissionGate>
            <PermissionGate permission="job-workflow-steps.create">
              <FeatureActionButton
                featureId="job-workflow-steps"
                action="create"
                onClick={() => {
                  const route = jobIdFilter
                    ? `/dashboard/job-workflow-steps/create?job_id=${jobIdFilter}`
                    : "/dashboard/job-workflow-steps/create";
                  navigate(route);
                }}
              />
            </PermissionGate>
            {jobIdFilter && (
              <button
                onClick={() => {
                  navigate(
                    `/dashboard/job-workflow-steps/create?job_id=${jobIdFilter}&batch=true`,
                  );
                }}
                className={`inline-flex items-center gap-2 ${tw.rounded} px-4 py-2 text-sm font-medium focus:outline-none transition-colors`}
                style={{
                  backgroundColor: "transparent",
                  color: "var(--c-bordered-button-color)",
                  borderColor: "var(--c-bordered-button-color)",
                  borderWidth: "1px",
                  borderStyle: "solid",
                }}
              >
                <Plus className="h-4 w-4" />
                Batch Create
              </button>
            )}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="mt-6">
          <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
        <div
          className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm`}
        >
          <div className="flex items-center gap-2">
            <Layers
              className="h-5 w-5"
              style={{ color: color.primary.accent }}
            />
            <p className={`p-0 icon-edit ${tw.rounded} text-sm font-medium `}>Total Steps</p>
          </div>
          <p className="mt-2 text-3xl font-bold text-gray-900">
            {isLoadingStats ? "..." : stats.totalSteps}
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
            <p className="text-sm font-medium text-gray-600">Active Steps</p>
          </div>
          <p className="mt-2 text-3xl font-bold text-gray-900">
            {isLoadingStats ? "..." : stats.activeSteps}
          </p>
        </div>
        <div
          className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm`}
        >
          <div className="flex items-center gap-2">
            <AlertTriangle
              className="h-5 w-5"
              style={{ color: color.primary.accent }}
            />
            <p className="text-sm font-medium text-gray-600">Critical Steps</p>
          </div>
          <p className="mt-2 text-3xl font-bold text-gray-900">
            {isLoadingStats ? "..." : stats.criticalSteps}
          </p>
        </div>
        <div
          className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm`}
        >
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5" style={{ color: color.primary.accent }} />
            <p className="text-sm font-medium text-gray-600">With Retry</p>
          </div>
          <p className="mt-2 text-3xl font-bold text-gray-900">
            {isLoadingStats ? "..." : stats.stepsWithRetry}
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
            <p className="text-sm font-medium text-gray-600">With Validation</p>
          </div>
          <p className="mt-2 text-3xl font-bold text-gray-900">
            {isLoadingStats ? "..." : stats.stepsWithValidation}
          </p>
        </div>
        <div
          className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm`}
        >
          <div className="flex items-center gap-2">
            <GitBranch
              className="h-5 w-5"
              style={{ color: color.primary.accent }}
            />
            <p className="text-sm font-medium text-gray-600">Parallel Groups</p>
          </div>
          <p className="mt-2 text-3xl font-bold text-gray-900">
            {isLoadingStats ? "..." : stats.parallelGroups}
          </p>
        </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="space-y-4 mt-6">
          <div className="flex gap-4">
        <SearchInput
          placeholder="Search by step name or code"
          value={searchTerm}
          onChange={setSearchTerm}
          className="flex-1"
        />
        <HeadlessSelect
          value={stepTypeFilter}
          onChange={(value) => setStepTypeFilter(value as StepType | "")}
          options={STEP_TYPE_OPTIONS.map((opt) => ({
            value: opt.value,
            label: opt.label,
          }))}
          placeholder="All Types"
          className="w-auto min-w-[180px]"
        />
        <div className="flex gap-2">
          <button
            onClick={() => setShowAdvancedFilters(true)}
            className={`inline-flex items-center justify-center gap-2 ${tw.rounded} bg-white border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50`}
          >
            <Filter className="h-4 w-4" />
            <span>Filters</span>
            {(stepCodeFilter ||
              stepOrderFilter !== "" ||
              isCriticalFilter !== "" ||
              isParallelFilter !== "" ||
              isActiveFilter !== "" ||
              failureActionFilter ||
              parallelGroupIdFilter ||
              showValidationSteps ||
              showRetrySteps ||
              showOrphanedSteps) && (
              <span className="ml-1 inline-flex items-center rounded-full bg-white/20 px-2 py-0.5 text-xs font-medium">
                Active
              </span>
            )}
          </button>
        </div>
          </div>
        </div>

        {/* Batch Actions Toolbar */}
      {isSelectionMode && selectedSteps.size > 0 && (
        <PermissionGate permission="job-workflow-steps.update">
          <div
            className={`flex items-center justify-between ${tw.rounded} border border-gray-200 bg-white px-4 py-3`}
          >
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700">
                {selectedSteps.size} step(s) selected
              </span>
              <button
                onClick={() => {
                  setSelectedSteps(new Set());
                  setIsSelectionMode(false);
                }}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleBatchAction("activate")}
                disabled={isBatchProcessing}
                className={`inline-flex items-center gap-2 ${tw.rounded} px-3 py-1.5 text-sm font-semibold text-white disabled:opacity-50 disabled:cursor-not-allowed`}
                style={{ backgroundColor: color.primary.action }}
              >
                <Play className="h-4 w-4" />
                Activate
              </button>
              <button
                onClick={() => handleBatchAction("deactivate")}
                disabled={isBatchProcessing}
                className={`inline-flex items-center gap-2 ${tw.rounded} px-3 py-1.5 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none`}
                style={{
                  backgroundColor: "transparent",
                  color: "var(--c-bordered-button-color)",
                  borderColor: "var(--c-bordered-button-color)",
                  borderWidth: "1px",
                  borderStyle: "solid",
                }}
              >
                <Pause className="h-4 w-4" />
                Deactivate
              </button>
              <PermissionGate permission="job-workflow-steps.delete">
                <button
                  onClick={() => {
                    if (
                      window.confirm(
                        `Are you sure you want to delete ${selectedSteps.size} step(s)? This action cannot be undone.`,
                      )
                    ) {
                      handleBatchAction("delete");
                    }
                  }}
                  disabled={isBatchProcessing}
                  className={`inline-flex items-center gap-2 ${tw.rounded} border border-red-200 px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-50`}
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </button>
              </PermissionGate>
              <button
                onClick={() => handleBatchAction("update")}
                disabled={isBatchProcessing}
                className={`inline-flex items-center gap-2 ${tw.rounded} px-3 py-1.5 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none`}
                style={{
                  backgroundColor: "transparent",
                  color: "var(--c-bordered-button-color)",
                  borderColor: "var(--c-bordered-button-color)",
                  borderWidth: "1px",
                  borderStyle: "solid",
                }}
              >
                <Edit className="h-4 w-4" />
                Batch Update
              </button>
            </div>
          </div>
        </PermissionGate>
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
        ) : filteredSteps.length === 0 ? (
          <div className="py-16 text-center">
            <Layers className="mx-auto mb-4 h-12 w-12 text-gray-300" />
            <p className={`text-lg font-semibold ${tw.textPrimary}`}>
              No workflow steps found
            </p>
            <p className="mt-2 text-sm text-gray-500">
              Try updating your search filters or create a new workflow step.
            </p>
          </div>
        ) : (
          <div className={`${tw.rounded} overflow-hidden`}>
            <Table<JobWorkflowStep>
              columns={[
                ...(isSelectionMode
                  ? [
                      {
                        id: "select",
                        label: (
                          <div
                            className="flex items-center gap-2 cursor-pointer"
                            onClick={handleSelectAll}
                          >
                            <Checkbox
                              id="select-all-steps"
                              checked={
                                steps.length > 0 &&
                                selectedSteps.size === steps.length
                              }
                              onChange={handleSelectAll}
                            />
                          </div>
                        ),
                        visible: true,
                        sortable: false,
                        render: (_, step) => (
                          <div
                            className="flex items-center gap-2 cursor-pointer"
                            onClick={() => handleSelectStep(step.id)}
                          >
                            <Checkbox
                              id={`step-${step.id}`}
                              checked={selectedSteps.has(step.id)}
                              onChange={() => handleSelectStep(step.id)}
                            />
                          </div>
                        ),
                      } as TableColumn<JobWorkflowStep>,
                    ]
                  : []),
                {
                  id: "step_name",
                  label: "Step Name",
                  visible: true,
                  render: (value) => value,
                },
                {
                  id: "job_id",
                  label: "Job",
                  visible: true,
                  render: (value) => jobMap[value as number]?.name || `Job #${value}`,
                },
                {
                  id: "step_order",
                  label: "Step Order",
                  visible: true,
                  render: (value) => value,
                },
                {
                  id: "step_type",
                  label: "Type",
                  visible: true,
                  render: (value) => getStepTypeLabel(value as StepType),
                },
                {
                  id: "is_active",
                  label: "Status",
                  visible: true,
                  render: (value) => value ? "Active" : "Inactive",
                },
                {
                  id: "actions",
                  label: "Actions",
                  visible: true,
                  sortable: false,
      isActionColumn: true,
                  render: (_, step) => (
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={() =>
                          navigate(
                            `/dashboard/job-workflow-steps/${step.id}${
                              jobIdFilter ? `?job_id=${jobIdFilter}` : ""
                            }`,
                          )
                        }
                        className={`p-0 icon-delete ${tw.rounded} transition-colors hover:bg-gray-100 dark:hover:bg-gray-700`}
                        aria-label="View details"
                        title="View details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <PermissionGate permission="job-workflow-steps.update">
                        <button
                          onClick={() =>
                            navigate(
                              `/dashboard/job-workflow-steps/create?operation=edit&id=${step.id}${
                                jobIdFilter ? `&job_id=${jobIdFilter}` : ""
                              }`,
                            )
                          }
                          className={`p-0 icon-delete ${tw.rounded} transition-colors hover:bg-gray-100 dark:hover:bg-gray-700`}
                          aria-label="Edit step"
                          title="Edit step"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                      </PermissionGate>
                      <div
                        className="relative"
                        ref={(el) => {
                          if (el) actionMenuRefs.current[step.id] = el;
                        }}
                      >
                        <button
                          onClick={(e) => handleActionMenuToggle(step.id, e)}
                          className={`p-0 icon-delete ${tw.rounded} transition-colors hover:bg-gray-100 dark:hover:bg-gray-700`}
                          aria-label="More actions"
                          title="More actions"
                        >
                          <MoreHorizontal className="w-4 h-4" />
                        </button>
                      </div>
                      {jobIdFilter && (
                        <button
                          onClick={async () => {
                            setValidateLoadingId(Number(jobIdFilter));
                            await handleValidateIntegrity(
                              Number(jobIdFilter),
                            );
                            setValidateLoadingId((prev) =>
                              prev === Number(jobIdFilter) ? null : prev,
                            );
                          }}
                          disabled={validateLoadingId === Number(jobIdFilter)}
                          className={`p-0 icon-delete ${tw.rounded} text-gray-600 transition-colors disabled:opacity-50 hover:bg-gray-100`}
                          aria-label="Validate workflow integrity"
                          title="Validate workflow integrity"
                        >
                          {validateLoadingId === Number(jobIdFilter) ? (
                            <LoadingSpinner />
                          ) : (
                            <Workflow className="w-4 h-4" />
                          )}
                        </button>
                      )}
                    </div>
                  ),
                },
              ]}
              data={steps}
              totalItems={totalCount}
              currentPage={tableCurrentPage}
              pageSize={tablePageSize}
              style={{
                headerBackground: color.surface.tableHeader,
                headerTextColor: color.surface.tableHeaderText,
                rowBackground: color.surface.tablebodybg,
                rowSpacing: "0 8px",
              }}
            />
          </div>
        )}

        {/* Pagination */}
        {!isLoading && steps.length > 0 && (
          <Pagination
            currentPage={tableCurrentPage}
            pageSize={tablePageSize}
            totalItems={totalCount}
            onPageChange={tableHandlePageChange}
            onPageSizeChange={tableHandlePageSizeChange}
          />
        )}
        </div>
      </div>

      {/* Action Menu Dropdown */}
      {steps.map((step) => {
        if (showActionMenu === step.id && actionMenuPosition) {
          return createPortal(
            <div
              key={`menu-${step.id}`}
              className={`fixed bg-white border border-gray-200 ${tw.rounded} shadow-xl py-1`}
              style={{
                zIndex: zIndex.popover,
                top: `${actionMenuPosition.top}px`,
                left: `${actionMenuPosition.left}px`,
                width: `${actionMenuPosition.width || 180}px`,
                maxHeight: `${actionMenuPosition.maxHeight}px`,
                overflowY: "auto",
              }}
            >
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(
                    `/dashboard/job-workflow-steps/create?operation=duplicate&id=${step.id}${
                      jobIdFilter ? `&job_id=${jobIdFilter}` : ""
                    }`,
                  );
                  setShowActionMenu(null);
                }}
                className="w-full flex items-center px-4 py-3 text-sm text-black hover:bg-gray-50 transition-colors"
              >
                <Copy className="w-4 h-4 mr-3" style={{ color: color.primary.action }} />
                Duplicate Step
              </button>

              <PermissionGate permission="job-workflow-steps.delete">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setDeletingStep(step);
                    openDeleteConfirm(item?.id || 0, item?.name || "");
                    setShowActionMenu(null);
                  }}
                  className="w-full flex items-center px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors"
                >
                  <Trash2 className="w-4 h-4 mr-3" />
                  Delete Step
                </button>
              </PermissionGate>
            </div>,
            document.body,
          );
        }
        return null;
      })}

      {deletingStep && (
        <DeleteConfirmModal
          isOpen={deleteConfirm.id !== null}
          onClose={() => {
            closeDeleteConfirm();
            setDeletingStep(null);
          }}
          onConfirm={async () => {
            if (!deletingStep) return;
            try {
              setIsDeleting(true);
              await jobWorkflowStepService.deleteJobWorkflowStep(
                deletingStep.id,
              );
              showToast(
                "Workflow step deleted",
                `"${deletingStep.step_name}" has been deleted successfully.`,
              );
              closeDeleteConfirm();
              setDeletingStep(null);
              // Optimistically remove deleted step
              setSteps((prev) => prev.filter((s) => s.id !== deletingStep.id));
            } catch (err) {
              const message =
                err instanceof Error ? err.message : "Failed to delete workflow step";
              showError("Unable to delete workflow step", extractBackendError(error, "Unable to delete workflow step. Please try again."));
            } finally {
              setIsDeleting(false);
            }
          }}
          title="Delete Workflow Step"
          description={`Are you sure you want to delete the workflow step "${deletingStep.step_name}"? This action cannot be undone.`}
          itemName={deletingStep.step_name}
          isLoading={isDeleting}
          confirmText="Delete"
          cancelText="Cancel"
          variant="delete"
        />
      )}

      {/* Filters Side Modal */}
      {showAdvancedFilters &&
        createPortal(
          <div
            className="fixed inset-0 overflow-hidden"
            style={{
              zIndex: zIndex.modal,
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
            }}
          >
            <div
              className="absolute inset-0 bg-black bg-opacity-50 transition-opacity duration-300 ease-in-out"
              onClick={() => setShowAdvancedFilters(false)}
            ></div>
            <div
              ref={filterRef}
              className="absolute right-0 top-0 h-full w-full sm:w-[28rem] lg:w-96 bg-white shadow-xl transform transition-transform duration-300 ease-out translate-x-0"
              style={{ zIndex: zIndex.modal + 1 }}
            >
              <div className="flex flex-col h-full">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-200">
                  <h2 className="text-sm font-semibold text-gray-900">
                    Filter Steps
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
                    {/* Step Code Filter */}
                    <div>
                      <Input
                        label="Step Code"
                        type="text"
                        value={stepCodeFilter}
                        onChange={(value) => setStepCodeFilter(String(value))}
                        placeholder="Enter step code"

                      />
                    </div>

                    {/* Step Order Filter */}
                    <div>
                      <Input
                        label="Step Order"
                        type="number"
                        value={stepOrderFilter || ""}
                        onChange={(value) =>
                          setStepOrderFilter(
                            value ? Number(value) : "",
                          )
                        }
                        placeholder="Enter step order"

                      />
                      <p className="mt-1 text-xs text-gray-500">
                        Use with Job ID for precise lookup
                      </p>
                    </div>

                    {/* Job ID Filter */}
                    <div>
                      <Input
                        label="Job ID"
                        type="number"
                        value={jobIdFilter || ""}
                        onChange={(value) =>
                          setJobIdFilter(value ? Number(value) : "")
                        }
                        placeholder="Enter job ID"

                      />
                    </div>

                    {/* Critical Filter */}
                    <div>
                      <HeadlessSelect
                        label="Critical"
                        options={[
                          { value: "", label: "All" },
                          { value: "true", label: "Critical Only" },
                          { value: "false", label: "Non-Critical Only" },
                        ]}
                        value={
                          isCriticalFilter === ""
                            ? ""
                            : isCriticalFilter.toString()
                        }
                        onChange={(value) =>
                          setIsCriticalFilter(
                            value === "" ? "" : value === "true" ? true : false,
                          )
                        }
                        placeholder="All"
                        className="w-full"
                      />
                    </div>

                    {/* Parallel Filter */}
                    <div>
                      <HeadlessSelect
                        label="Parallel"
                        options={[
                          { value: "", label: "All" },
                          { value: "true", label: "Parallel Only" },
                          { value: "false", label: "Sequential Only" },
                        ]}
                        value={
                          isParallelFilter === ""
                            ? ""
                            : isParallelFilter.toString()
                        }
                        onChange={(value) =>
                          setIsParallelFilter(
                            value === "" ? "" : value === "true" ? true : false,
                          )
                        }
                        placeholder="All"
                        className="w-full"
                      />
                    </div>

                    {/* Active Filter */}
                    <div>
                      <HeadlessSelect
                        label="Active Status"
                        options={[
                          { value: "", label: "All" },
                          { value: "true", label: "Active Only" },
                          { value: "false", label: "Inactive Only" },
                        ]}
                        value={
                          isActiveFilter === "" ? "" : isActiveFilter.toString()
                        }
                        onChange={(value) =>
                          setIsActiveFilter(
                            value === "" ? "" : value === "true" ? true : false,
                          )
                        }
                        placeholder="All"
                        className="w-full"
                      />
                    </div>

                    {/* Special Filters */}
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-gray-700">
                        Special Filters
                      </p>
                      <div
                        className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer"
                        onClick={() => {
                          const newValue = !showValidationSteps;
                          setShowValidationSteps(newValue);
                          if (newValue) {
                            setShowRetrySteps(false);
                            setShowOrphanedSteps(false);
                          }
                        }}
                      >
                        <Checkbox
                          id="validation-steps-filter"
                          checked={showValidationSteps}
                          onChange={() => {
                            const newValue = !showValidationSteps;
                            setShowValidationSteps(newValue);
                            if (newValue) {
                              setShowRetrySteps(false);
                              setShowOrphanedSteps(false);
                            }
                          }}
                        />
                        <span>Validation Steps</span>
                      </div>
                      <div
                        className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer"
                        onClick={() => {
                          const newValue = !showRetrySteps;
                          setShowRetrySteps(newValue);
                          if (newValue) {
                            setShowValidationSteps(false);
                            setShowOrphanedSteps(false);
                          }
                        }}
                      >
                        <Checkbox
                          id="retry-steps-filter"
                          checked={showRetrySteps}
                          onChange={() => {
                            const newValue = !showRetrySteps;
                            setShowRetrySteps(newValue);
                            if (newValue) {
                              setShowValidationSteps(false);
                              setShowOrphanedSteps(false);
                            }
                          }}
                        />
                        <span>Retry Steps</span>
                      </div>
                      <div
                        className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer"
                        onClick={() => {
                          const newValue = !showOrphanedSteps;
                          setShowOrphanedSteps(newValue);
                          if (newValue) {
                            setShowValidationSteps(false);
                            setShowRetrySteps(false);
                          }
                        }}
                      >
                        <Checkbox
                          id="orphaned-steps-filter"
                          checked={showOrphanedSteps}
                          onChange={() => {
                            const newValue = !showOrphanedSteps;
                            setShowOrphanedSteps(newValue);
                            if (newValue) {
                              setShowValidationSteps(false);
                              setShowRetrySteps(false);
                            }
                          }}
                        />
                        <span>Orphaned Steps</span>
                      </div>
                    </div>

                    {/* Failure Action Filter */}
                    <HeadlessSelect
                      label="Failure Action"
                      options={FAILURE_ACTION_OPTIONS.map((opt) => ({
                        value: opt.value,
                        label: opt.label,
                      }))}
                      value={failureActionFilter}
                      onChange={(value) =>
                        setFailureActionFilter(value as FailureAction | "")
                      }
                      placeholder="All Actions"
                      className="w-full"
                    />

                    {/* Parallel Group ID Filter */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Parallel Group ID
                      </label>
                      <Input
                        type="number"
                        value={parallelGroupIdFilter || ""}
                        onChange={(value) =>
                          setParallelGroupIdFilter(
                            value ? Number(value) : "",
                          )
                        }
                        placeholder="All Groups"
                       
                      />
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-gray-200 bg-gray-50">
                  <div className="flex space-x-3">
                    <button
                      onClick={() => {
                        setStepCodeFilter("");
                        setStepOrderFilter("");
                        setIsCriticalFilter("");
                        setIsParallelFilter("");
                        setIsActiveFilter("");
                        setFailureActionFilter("");
                        setParallelGroupIdFilter("");
                        setShowValidationSteps(false);
                        setShowRetrySteps(false);
                        setShowOrphanedSteps(false);
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
          document.body,
        )}

      {/* Reorder Steps Modal */}
      {showReorderModal &&
        createPortal(
          <div
            className="fixed inset-0 overflow-hidden"
            style={{
              zIndex: zIndex.modal,
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
            }}
          >
            <div
              className="absolute inset-0 bg-black bg-opacity-50 transition-opacity duration-300 ease-in-out"
              onClick={() => setShowReorderModal(false)}
            ></div>
            <div
              className="absolute left-1/2 top-1/2 w-full max-w-2xl -translate-x-1/2 -translate-y-1/2 transform bg-white shadow-xl"
              style={{ zIndex: zIndex.modal + 1 }}
            >
              <div className="flex flex-col max-h-[80vh]">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-900">
                    Reorder Steps
                  </h2>
                  <button
                    onClick={() => setShowReorderModal(false)}
                    className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4">
                  <p className="mb-4 text-sm text-gray-600">
                    Drag and drop steps to reorder them. Lower numbers execute
                    first. You can also manually edit the order numbers.
                  </p>
                  <div className="space-y-2">
                    {reorderData.map((item, idx) => (
                      <div
                        key={item.stepId}
                        draggable
                        onDragStart={() => handleDragStart(idx)}
                        onDragOver={(e) => handleDragOver(e, idx)}
                        onDragLeave={handleDragLeave}
                        onDrop={(e) => handleDrop(e, idx)}
                        onDragEnd={handleDragEnd}
                        className={`flex items-center justify-between ${
                          tw.rounded
                        } border p-3 transition-all cursor-move ${
                          draggedItem === idx
                            ? "opacity-50 border border-gray-400 bg-gray-100"
                            : dragOverIndex === idx
                              ? "border border-gray-400 bg-gray-100 border-dashed"
                              : "border-gray-200 bg-gray-50 hover:bg-gray-100"
                        }`}
                      >
                        <div className="flex items-center gap-3 flex-1">
                          <div className="flex-shrink-0">
                            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-white border-2 border-gray-300 text-xs font-semibold text-gray-600">
                              {idx + 1}
                            </div>
                          </div>
                          <div className="flex-1">
                            <div className="text-sm font-medium text-gray-900">
                              {item.stepName}
                            </div>
                            <div className="text-xs text-gray-500">
                              {item.currentOrder !== item.newOrder ? (
                                <span>
                                  Order:{" "}
                                  <span className="line-through text-gray-400">
                                    {item.currentOrder}
                                  </span>{" "}
                                  →{" "}
                                  <span className="font-semibold text-blue-600">
                                    {item.newOrder}
                                  </span>
                                </span>
                              ) : (
                                `Order: ${item.currentOrder}`
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            value={item.newOrder}
                            onChange={(value) => {
                              const newOrder = Number(value) || 1;
                              const newData = [...reorderData];
                              newData[idx].newOrder = newOrder;
                              // Sort by newOrder and reassign sequential orders
                              newData.sort((a, b) => a.newOrder - b.newOrder);
                              const updatedData = newData.map((itm, index) => ({
                                ...itm,
                                newOrder: index + 1,
                              }));
                              setReorderData(updatedData);
                            }}
                            onClick={(e) => e.stopPropagation()}
                            className="w-20"
                           
                          />
                          <div className="text-gray-400">
                            <svg
                              className="w-5 h-5"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M4 8h16M4 16h16"
                              />
                            </svg>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  {reorderData.some(
                    (item) => item.currentOrder !== item.newOrder,
                  ) && (
                    <div
                      className={`mt-4 ${tw.rounded} border p-3`}
                      style={{
                        backgroundColor: noteStyles.warning.backgroundColor,
                        borderColor: noteStyles.warning.borderColor,
                      }}
                    >
                      <p
                        className="text-sm font-medium"
                        style={{ color: noteStyles.warning.textColor }}
                      >
                        <strong>Note:</strong> Step order will be updated when
                        you save. Make sure the order numbers are correct.
                      </p>
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-gray-200 bg-gray-50">
                  <div className="flex items-center justify-end gap-3">
                    <button
                      onClick={() => setShowReorderModal(false)}
                      className="transition-colors disabled:opacity-60"
                      style={getButtonStyles(button.bordered)}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleReorderSteps}
                      disabled={isReordering}
                      className={`px-4 py-2 text-sm font-semibold text-white ${tw.rounded} transition-colors disabled:opacity-50`}
                      style={{ backgroundColor: color.primary.action }}
                    >
                      {isReordering ? "Reordering..." : "Update"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>,
          document.body,
        )}

      {/* Delete All Steps Modal */}
      {showDeleteAllModal && (
        <DeleteConfirmModal
          isOpen={showDeleteAllModal}
          onClose={() => {
            setShowDeleteAllModal(false);
            setDeleteAllJobId(null);
          }}
          onConfirm={handleDeleteAllSteps}
          title="Delete All Steps for Job"
          description={`Are you sure you want to delete ALL workflow steps for Job #${deleteAllJobId}? This action cannot be undone and will remove all steps associated with this job.`}
          itemName={`All steps for Job #${deleteAllJobId}`}
          isLoading={isDeletingAll}
          confirmText="Delete All"
          cancelText="Cancel"
          variant="delete"
        />
      )}

      {/* Batch Update Modal */}
      {showBatchUpdateModal &&
        createPortal(
          <div
            className="fixed inset-0 overflow-hidden"
            style={{
              zIndex: zIndex.modal,
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
            }}
          >
            <div
              className="absolute inset-0 bg-black bg-opacity-50 transition-opacity duration-300 ease-in-out"
              onClick={() => setShowBatchUpdateModal(false)}
            ></div>
            <div
              className="absolute left-1/2 top-1/2 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 transform bg-white shadow-xl"
              style={{ zIndex: zIndex.modal + 1 }}
            >
              <div className="flex flex-col max-h-[80vh]">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-900">
                    Batch Update Steps
                  </h2>
                  <button
                    onClick={() => setShowBatchUpdateModal(false)}
                    className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4">
                  <p className="mb-4 text-sm text-gray-600">
                    Update {selectedSteps.size} selected step(s). Leave fields
                    empty to keep current values.
                  </p>
                  <div className="space-y-4">
                    <div>
                      <label className="flex items-center gap-2">
                        <Checkbox checked={batchUpdateFields.is_active !== undefined}
                          onChange={(e) =>
                            setBatchUpdateFields({
                              ...batchUpdateFields,
                              is_active: e.target.checked ? true : undefined,
                            })
                          }
                          className="rounded border-gray-300 text-[#3b8169] focus:ring-[#3b8169]" />
                        <span className="text-sm font-medium text-gray-700">
                          Set Active Status
                        </span>
                      </label>
                      {batchUpdateFields.is_active !== undefined && (
                        <div className="mt-2 ml-6">
                          <label className="flex items-center gap-2">
                            <Checkbox checked={batchUpdateFields.is_active}
                              onChange={(e) =>
                                setBatchUpdateFields({
                                  ...batchUpdateFields,
                                  is_active: e.target.checked,
                                })
                              }
                              className="rounded border-gray-300 text-[#3b8169] focus:ring-[#3b8169]" />
                            <span className="text-sm text-gray-600">
                              Active
                            </span>
                          </label>
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="flex items-center gap-2">
                        <Checkbox checked={batchUpdateFields.is_critical !== undefined}
                          onChange={(e) =>
                            setBatchUpdateFields({
                              ...batchUpdateFields,
                              is_critical: e.target.checked ? true : undefined,
                            })
                          }
                          className="rounded border-gray-300 text-[#3b8169] focus:ring-[#3b8169]" />
                        <span className="text-sm font-medium text-gray-700">
                          Set Critical Status
                        </span>
                      </label>
                      {batchUpdateFields.is_critical !== undefined && (
                        <div className="mt-2 ml-6">
                          <label className="flex items-center gap-2">
                            <Checkbox checked={batchUpdateFields.is_critical}
                              onChange={(e) =>
                                setBatchUpdateFields({
                                  ...batchUpdateFields,
                                  is_critical: e.target.checked,
                                })
                              }
                              className="rounded border-gray-300 text-[#3b8169] focus:ring-[#3b8169]" />
                            <span className="text-sm text-gray-600">
                              Critical
                            </span>
                          </label>
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="flex items-center gap-2">
                        <Checkbox checked={
                            batchUpdateFields.timeout_seconds !== undefined
                          }
                          onChange={(e) =>
                            setBatchUpdateFields({
                              ...batchUpdateFields,
                              timeout_seconds: e.target.checked
                                ? 300
                                : undefined,
                            })
                          }
                          className="rounded border-gray-300 text-[#3b8169] focus:ring-[#3b8169]" />
                        <span className="text-sm font-medium text-gray-700">
                          Set Timeout
                        </span>
                      </label>
                      {batchUpdateFields.timeout_seconds !== undefined && (
                        <div className="mt-2 ml-6">
                          <Input
                            type="number"
                            value={batchUpdateFields.timeout_seconds || 300}
                            onChange={(value) =>
                              setBatchUpdateFields({
                                ...batchUpdateFields,
                                timeout_seconds: Number(value) || 300,
                              })
                            }
                           
                          />
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="flex items-center gap-2">
                        <Checkbox checked={batchUpdateFields.retry_count !== undefined}
                          onChange={(e) =>
                            setBatchUpdateFields({
                              ...batchUpdateFields,
                              retry_count: e.target.checked ? 0 : undefined,
                            })
                          }
                          className="rounded border-gray-300 text-[#3b8169] focus:ring-[#3b8169]" />
                        <span className="text-sm font-medium text-gray-700">
                          Set Retry Count
                        </span>
                      </label>
                      {batchUpdateFields.retry_count !== undefined && (
                        <div className="mt-2 ml-6">
                          <Input
                            type="number"
                            value={batchUpdateFields.retry_count || 0}
                            onChange={(value) =>
                              setBatchUpdateFields({
                                ...batchUpdateFields,
                                retry_count: Number(value) || 0,
                              })
                            }
                           
                          />
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="flex items-center gap-2">
                        <Checkbox checked={
                            batchUpdateFields.on_failure_action !== undefined
                          }
                          onChange={(e) =>
                            setBatchUpdateFields({
                              ...batchUpdateFields,
                              on_failure_action: e.target.checked
                                ? "abort"
                                : undefined,
                            })
                          }
                          className="rounded border-gray-300 text-[#3b8169] focus:ring-[#3b8169]" />
                        <span className="text-sm font-medium text-gray-700">
                          Set Failure Action
                        </span>
                      </label>
                      {batchUpdateFields.on_failure_action !== undefined && (
                        <div className="mt-2 ml-6">
                          <HeadlessSelect
                            value={batchUpdateFields.on_failure_action}
                            onChange={(value) =>
                              setBatchUpdateFields({
                                ...batchUpdateFields,
                                on_failure_action: value as FailureAction,
                              })
                            }
                            options={FAILURE_ACTION_OPTIONS.map((opt) => ({
                              value: opt.value,
                              label: opt.label,
                            }))}
                            placeholder="Select failure action"
                            className="w-full"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-gray-200 bg-gray-50">
                  <div className="flex items-center justify-end gap-3">
                    <button
                      onClick={() => {
                        setShowBatchUpdateModal(false);
                        setBatchUpdateFields({});
                      }}
                      className="transition-colors disabled:opacity-60"
                      style={getButtonStyles(button.bordered)}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleBatchUpdate}
                      disabled={isBatchUpdating}
                      className={`px-4 py-2 text-sm font-semibold text-white ${tw.rounded} transition-colors disabled:opacity-50`}
                      style={{ backgroundColor: color.primary.action }}
                    >
                      {isBatchUpdating ? "Updating..." : "Update"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
