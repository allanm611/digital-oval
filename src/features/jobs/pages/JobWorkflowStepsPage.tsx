import { useCallback, useEffect, useMemo, useState, useRef } from "react";
import { createPortal } from "react-dom";
import {
  AlertTriangle,
  Briefcase,
  CheckCircle,
  Clock,
  Eye,
  Edit,
  Plus,
  Search,
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
  RefreshCw,
  AlertCircle,
  TrendingUp,
  Workflow,
} from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import LoadingSpinner from "../../../shared/components/ui/LoadingSpinner";
import DeleteConfirmModal from "../../../shared/components/ui/DeleteConfirmModal";
import HeadlessSelect from "../../../shared/components/ui/HeadlessSelect";
import { color, tw } from "../../../shared/utils/utils";
import { useToast } from "../../../contexts/ToastContext";
import { useLanguage } from "../../../contexts/LanguageContext";
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

const STEP_TYPE_OPTIONS: Array<{ label: string; value: StepType }> = [
  { label: "All Types", value: "sql" },
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

const FAILURE_ACTION_OPTIONS: Array<{ label: string; value: FailureAction }> = [
  { label: "All Actions", value: "abort" },
  { label: "Abort", value: "abort" },
  { label: "Continue", value: "continue" },
  { label: "Retry", value: "retry" },
  { label: "Skip Remaining", value: "skip_remaining" },
];

export default function JobWorkflowStepsPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const jobIdParam = searchParams.get("job_id");
  const { error: showError, success: showToast } = useToast();
  const { user } = useAuth();
  const { t } = useLanguage();

  const [steps, setSteps] = useState<JobWorkflowStep[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [stepTypeFilter, setStepTypeFilter] = useState<StepType | "">("");
  const [jobIdFilter, setJobIdFilter] = useState<number | "">(
    jobIdParam ? Number(jobIdParam) : ""
  );
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
    null
  );
  const [isDeleting, setIsDeleting] = useState(false);
  const [jobMap, setJobMap] = useState<Record<number, ScheduledJob>>({});
  const [jobs, setJobs] = useState<ScheduledJob[]>([]);
  // Bulk selection and batch operations
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedSteps, setSelectedSteps] = useState<Set<number>>(new Set());
  const [isBatchProcessing, setIsBatchProcessing] = useState(false);
  // Advanced filters
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [stepCodeFilter, setStepCodeFilter] = useState<string>("");
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
  // Analytics data
  const [analyticsData, setAnalyticsData] = useState<{
    mostFailed: Array<{
      step_id: number;
      step_name: string;
      step_code: string;
      job_id: number;
      failure_count: number;
      last_failure_at: string | null;
    }>;
    longestRunning: Array<{
      step_id: number;
      step_name: string;
      step_code: string;
      job_id: number;
      average_duration_seconds: number;
      max_duration_seconds: number;
    }>;
    typeDistribution: Array<{
      step_type: StepType;
      count: number;
      percentage: number;
    }>;
  } | null>(null);
  const [isLoadingAnalytics, setIsLoadingAnalytics] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);

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

        if (jobIdFilter) {
          // Get steps for specific job
          response = await jobWorkflowStepService.getStepsByJobId(
            Number(jobIdFilter),
            true
          );
        } else if (stepTypeFilter) {
          // Get steps by type
          response = await jobWorkflowStepService.getStepsByType(
            stepTypeFilter,
            true
          );
        } else if (isCriticalFilter === true) {
          // Get critical steps
          response = await jobWorkflowStepService.getCriticalSteps({
            skipCache: true,
          });
        } else if (showValidationSteps) {
          // Get validation steps
          response = await jobWorkflowStepService.getValidationSteps({
            job_id: jobIdFilter ? Number(jobIdFilter) : undefined,
            skipCache: true,
          });
        } else if (showRetrySteps) {
          // Get retry steps
          response = await jobWorkflowStepService.getRetrySteps({
            job_id: jobIdFilter ? Number(jobIdFilter) : undefined,
            skipCache: true,
          });
        } else if (showOrphanedSteps) {
          // Get orphaned steps
          response = await jobWorkflowStepService.getOrphanedSteps(true);
        } else if (
          hasSearchTerm ||
          stepCodeFilter ||
          isCriticalFilter !== "" ||
          isParallelFilter !== "" ||
          isActiveFilter !== "" ||
          failureActionFilter ||
          parallelGroupIdFilter
        ) {
          // Use search endpoint with filters
          const params: JobWorkflowStepSearchParams = {
            limit: 50,
            offset: 0,
            ...overrideParams,
            skipCache: true,
          };
          if (hasSearchTerm) {
            params.step_name = trimmedSearchTerm;
          }
          if (stepCodeFilter) {
            params.step_code = stepCodeFilter;
          }
          if (stepTypeFilter) {
            params.step_type = stepTypeFilter;
          }
          if (jobIdFilter) {
            params.job_id = Number(jobIdFilter);
          }
          if (isCriticalFilter !== "") {
            params.is_critical = isCriticalFilter === true;
          }
          if (isParallelFilter !== "") {
            params.is_parallel = isParallelFilter === true;
          }
          if (isActiveFilter !== "") {
            params.is_active = isActiveFilter === true;
          }
          if (failureActionFilter) {
            params.on_failure_action = failureActionFilter;
          }
          if (parallelGroupIdFilter) {
            params.parallel_group_id = Number(parallelGroupIdFilter);
          }
          response = await jobWorkflowStepService.searchJobWorkflowSteps(
            params
          );
        } else {
          // Use list endpoint
          const params = {
            limit: 50,
            offset: 0,
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
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : "Failed to load job workflow steps";
        setErrorMessage(message);
        showError("Job Workflow Steps", message);
      } finally {
        setIsLoading(false);
      }
    },
    [
      searchTerm,
      stepTypeFilter,
      jobIdFilter,
      stepCodeFilter,
      isCriticalFilter,
      isParallelFilter,
      isActiveFilter,
      failureActionFilter,
      parallelGroupIdFilter,
      showValidationSteps,
      showRetrySteps,
      showOrphanedSteps,
      showError,
    ]
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
          typeof statsData.total_steps === "number"
            ? statsData.total_steps
            : steps.length,
        activeSteps:
          typeof healthData.active_steps === "number"
            ? healthData.active_steps
            : steps.filter((s) => s.is_active).length,
        criticalSteps:
          typeof healthData.critical_steps === "number"
            ? healthData.critical_steps
            : steps.filter((s) => s.is_critical).length,
        stepsWithRetry:
          typeof healthData.steps_with_retry === "number"
            ? healthData.steps_with_retry
            : steps.filter((s) => s.retry_count > 0).length,
        stepsWithValidation:
          typeof healthData.steps_with_validation === "number"
            ? healthData.steps_with_validation
            : steps.filter(
                (s) => s.pre_validation_query || s.post_validation_query
              ).length,
        parallelGroups:
          typeof healthData.parallel_groups === "number"
            ? healthData.parallel_groups
            : new Set(
                steps
                  .filter((s) => s.parallel_group_id)
                  .map((s) => s.parallel_group_id)
              ).size,
      });
    } catch (err) {
      console.error("Failed to load stats:", err);
    } finally {
      setIsLoadingStats(false);
    }
  }, [jobIdFilter, steps]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchSteps();
    }, 300);
    return () => clearTimeout(timeout);
  }, [fetchSteps]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const fetchAnalytics = useCallback(async () => {
    if (!showAnalytics) return;
    setIsLoadingAnalytics(true);
    try {
      const [mostFailed, longestRunning, typeDistribution] = await Promise.all([
        jobWorkflowStepService
          .getMostFailedSteps({ limit: 10, days_back: 30, skipCache: true })
          .catch(() => ({ success: true, data: [] })),
        jobWorkflowStepService
          .getLongestRunningSteps({ limit: 10, days_back: 30, skipCache: true })
          .catch(() => ({ success: true, data: [] })),
        jobWorkflowStepService
          .getTypeDistribution({ skipCache: true })
          .catch(() => ({ success: true, data: [] })),
      ]);

      setAnalyticsData({
        mostFailed: mostFailed.data || [],
        longestRunning: longestRunning.data || [],
        typeDistribution: typeDistribution.data || [],
      });
    } catch (err) {
      console.error("Failed to load analytics:", err);
    } finally {
      setIsLoadingAnalytics(false);
    }
  }, [showAnalytics]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  useEffect(() => {
    const loadJobs = async () => {
      try {
        const response = await scheduledJobService.listScheduledJobs({
          limit: 1000,
          skipCache: true,
        });
        const jobList = response.data || [];
        setJobs(jobList);
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
    action: "activate" | "deactivate" | "delete"
  ) => {
    if (selectedSteps.size === 0) return;

    const stepIds = Array.from(selectedSteps);
    setIsBatchProcessing(true);

    try {
      let result;
      if (action === "activate") {
        result = await jobWorkflowStepService.batchActivateSteps({
          stepIds,
          userId: user?.user_id || 0,
        });
      } else if (action === "deactivate") {
        result = await jobWorkflowStepService.batchDeactivateSteps({
          stepIds,
          userId: user?.user_id || 0,
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
      }

      showToast(
        `Batch ${action} completed`,
        `${result.success} step(s) ${action}d successfully${
          result.failed > 0 ? `, ${result.failed} failed` : ""
        }`
      );

      setSelectedSteps(new Set());
      fetchSteps(); // Refresh the list
    } catch (err) {
      showError(
        `Batch ${action} failed`,
        err instanceof Error ? err.message : "Unknown error"
      );
    } finally {
      setIsBatchProcessing(false);
    }
  };

  const handleOpenReorderModal = () => {
    if (!jobIdFilter) {
      showError(
        "Job ID required",
        "Please filter by a specific job to reorder steps."
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

      await jobWorkflowStepService.reorderSteps(Number(jobIdFilter), {
        stepOrderMapping,
        userId: user?.user_id || 0,
      });

      showToast("Steps reordered", "Step order has been updated successfully.");
      setShowReorderModal(false);
      fetchSteps();
    } catch (err) {
      showError(
        "Reorder failed",
        err instanceof Error ? err.message : "Unknown error"
      );
    } finally {
      setIsReordering(false);
    }
  };

  const handleDeleteAllSteps = async () => {
    if (!deleteAllJobId) return;

    setIsDeletingAll(true);
    try {
      const result = await jobWorkflowStepService.deleteAllStepsForJob(
        deleteAllJobId
      );
      showToast(
        "All steps deleted",
        `${result.deleted_count} step(s) deleted successfully.`
      );
      setShowDeleteAllModal(false);
      setDeleteAllJobId(null);
      fetchSteps();
    } catch (err) {
      showError(
        "Delete failed",
        err instanceof Error ? err.message : "Unknown error"
      );
    } finally {
      setIsDeletingAll(false);
    }
  };

  const handleDuplicateStep = async (step: JobWorkflowStep) => {
    try {
      await jobWorkflowStepService.duplicateStep(step.id, {
        userId: user?.user_id || 0,
      });
      showToast(
        "Step duplicated",
        `"${step.step_name}" has been duplicated successfully.`
      );
      fetchSteps();
    } catch (err) {
      showError(
        "Failed to duplicate step",
        err instanceof Error ? err.message : "Unknown error"
      );
    }
  };

  const handleValidateIntegrity = async (jobId: number) => {
    try {
      const result = await jobWorkflowStepService.validateWorkflowIntegrity(
        jobId
      );
      if (result.valid) {
        showToast(
          "Workflow Valid",
          result.warnings.length > 0
            ? `Workflow is valid. Warnings: ${result.warnings.join(", ")}`
            : "Workflow is valid with no issues."
        );
      } else {
        showError(
          "Workflow Validation Failed",
          `Errors: ${result.errors.join(", ")}`
        );
      }
    } catch (err) {
      showError(
        "Validation failed",
        err instanceof Error ? err.message : "Unknown error"
      );
    }
  };

  const getStepTypeLabel = (type: StepType): string => {
    const option = STEP_TYPE_OPTIONS.find((opt) => opt.value === type);
    return option?.label || type;
  };

  const getFailureActionLabel = (action: FailureAction): string => {
    const option = FAILURE_ACTION_OPTIONS.find((opt) => opt.value === action);
    return option?.label || action;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className={`text-2xl font-bold ${tw.textPrimary}`}>
            Job Workflow Steps
          </h1>
          <p className={`${tw.textSecondary} mt-2 text-sm`}>
            Manage and monitor workflow steps for scheduled jobs
          </p>
        </div>
        <div className="flex gap-3">
          {jobIdFilter && (
            <>
              <button
                onClick={handleOpenReorderModal}
                className="inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium focus:outline-none transition-colors"
                style={{
                  backgroundColor: "transparent",
                  color: color.primary.action,
                  border: `1px solid ${color.primary.action}`,
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
                className="inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium text-red-700 bg-white border border-red-300 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4" />
                Delete All
              </button>
            </>
          )}
          <button
            onClick={() => setShowAnalytics(!showAnalytics)}
            className="inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium focus:outline-none transition-colors"
            style={{
              backgroundColor: showAnalytics
                ? color.primary.action
                : "transparent",
              color: showAnalytics ? "white" : color.primary.action,
              border: `1px solid ${color.primary.action}`,
            }}
          >
            <BarChart3 className="h-4 w-4" />
            {showAnalytics ? "Hide Analytics" : "Show Analytics"}
          </button>
          <button
            onClick={() => {
              if (!isSelectionMode) {
                setIsSelectionMode(true);
                setSelectedSteps(new Set(filteredSteps.map((step) => step.id)));
              } else {
                setIsSelectionMode(false);
                setSelectedSteps(new Set());
              }
            }}
            className="inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium focus:outline-none transition-colors"
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
            {isSelectionMode ? "Exit Selection" : "Select Steps"}
          </button>
          <button
            onClick={() => navigate("/dashboard/job-workflow-steps/create")}
            className="inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-semibold text-white"
            style={{ backgroundColor: color.primary.action }}
          >
            <Plus className="h-4 w-4" />
            Create Step
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
        <div className="rounded-md border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2">
            <Layers
              className="h-5 w-5"
              style={{ color: color.primary.accent }}
            />
            <p className="text-sm font-medium text-gray-600">Total Steps</p>
          </div>
          <p className="mt-2 text-3xl font-bold text-gray-900">
            {isLoadingStats ? "..." : stats.totalSteps}
          </p>
        </div>
        <div className="rounded-md border border-gray-200 bg-white p-6 shadow-sm">
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
        <div className="rounded-md border border-gray-200 bg-white p-6 shadow-sm">
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
        <div className="rounded-md border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5" style={{ color: color.primary.accent }} />
            <p className="text-sm font-medium text-gray-600">With Retry</p>
          </div>
          <p className="mt-2 text-3xl font-bold text-gray-900">
            {isLoadingStats ? "..." : stats.stepsWithRetry}
          </p>
        </div>
        <div className="rounded-md border border-gray-200 bg-white p-6 shadow-sm">
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
        <div className="rounded-md border border-gray-200 bg-white p-6 shadow-sm">
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

      {/* Analytics Section */}
      {showAnalytics && (
        <div className="rounded-md border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">
              Analytics & Insights
            </h2>
            <button
              onClick={() => fetchAnalytics()}
              disabled={isLoadingAnalytics}
              className="inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50"
            >
              <RefreshCw
                className={`h-4 w-4 ${
                  isLoadingAnalytics ? "animate-spin" : ""
                }`}
              />
              Refresh
            </button>
          </div>

          {isLoadingAnalytics ? (
            <div className="flex justify-center py-8">
              <LoadingSpinner />
            </div>
          ) : analyticsData ? (
            <div className="grid gap-6 md:grid-cols-3">
              {/* Most Failed Steps */}
              <div>
                <h3 className="mb-3 text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-red-500" />
                  Most Failed Steps
                </h3>
                <div className="space-y-2">
                  {analyticsData.mostFailed.length > 0 ? (
                    analyticsData.mostFailed.slice(0, 5).map((item) => (
                      <div
                        key={item.step_id}
                        className="rounded-md border border-gray-200 bg-gray-50 p-3"
                      >
                        <div className="text-sm font-medium text-gray-900">
                          {item.step_name}
                        </div>
                        <div className="mt-1 text-xs text-gray-500">
                          Failures: {item.failure_count} | Job:{" "}
                          {jobMap[item.job_id]?.name || `#${item.job_id}`}
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500">
                      No failed steps found
                    </p>
                  )}
                </div>
              </div>

              {/* Longest Running Steps */}
              <div>
                <h3 className="mb-3 text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <Clock className="h-4 w-4 text-blue-500" />
                  Longest Running Steps
                </h3>
                <div className="space-y-2">
                  {analyticsData.longestRunning.length > 0 ? (
                    analyticsData.longestRunning.slice(0, 5).map((item) => (
                      <div
                        key={item.step_id}
                        className="rounded-md border border-gray-200 bg-gray-50 p-3"
                      >
                        <div className="text-sm font-medium text-gray-900">
                          {item.step_name}
                        </div>
                        <div className="mt-1 text-xs text-gray-500">
                          Avg: {Math.round(item.average_duration_seconds)}s |
                          Max: {Math.round(item.max_duration_seconds)}s
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500">No data available</p>
                  )}
                </div>
              </div>

              {/* Type Distribution */}
              <div>
                <h3 className="mb-3 text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-green-500" />
                  Step Type Distribution
                </h3>
                <div className="space-y-2">
                  {analyticsData.typeDistribution.length > 0 ? (
                    analyticsData.typeDistribution.map((item) => (
                      <div
                        key={item.step_type}
                        className="flex items-center justify-between rounded-md border border-gray-200 bg-gray-50 p-3"
                      >
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {getStepTypeLabel(item.step_type)}
                          </div>
                          <div className="text-xs text-gray-500">
                            {item.count} steps
                          </div>
                        </div>
                        <div className="text-sm font-semibold text-gray-700">
                          {item.percentage.toFixed(1)}%
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500">No data available</p>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-500">No analytics data available</p>
          )}
        </div>
      )}

      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            className="w-full rounded-md border border-gray-200 py-3 pl-10 pr-4 text-sm shadow-sm focus:border-[#3b8169] focus:outline-none focus:ring-1 focus:ring-[#3b8169]"
            placeholder="Search by step name or code"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
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
        <input
          type="number"
          className="w-auto min-w-[120px] rounded-md border border-gray-200 py-3 px-4 text-sm shadow-sm focus:border-[#3b8169] focus:outline-none focus:ring-1 focus:ring-[#3b8169]"
          placeholder="Job ID"
          value={jobIdFilter || ""}
          onChange={(e) =>
            setJobIdFilter(e.target.value ? Number(e.target.value) : "")
          }
        />
        <div className="flex gap-2">
          <button
            onClick={() => {
              setShowValidationSteps(!showValidationSteps);
              setShowRetrySteps(false);
              setShowOrphanedSteps(false);
            }}
            className={`inline-flex items-center justify-center gap-2 rounded-md px-4 py-2.5 text-sm font-medium shadow-sm transition-colors ${
              showValidationSteps
                ? "bg-blue-100 text-blue-700 border border-blue-300"
                : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50"
            }`}
          >
            <Activity className="h-4 w-4" />
            Validation Steps
          </button>
          <button
            onClick={() => {
              setShowRetrySteps(!showRetrySteps);
              setShowValidationSteps(false);
              setShowOrphanedSteps(false);
            }}
            className={`inline-flex items-center justify-center gap-2 rounded-md px-4 py-2.5 text-sm font-medium shadow-sm transition-colors ${
              showRetrySteps
                ? "bg-blue-100 text-blue-700 border border-blue-300"
                : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50"
            }`}
          >
            <Zap className="h-4 w-4" />
            Retry Steps
          </button>
          <button
            onClick={() => {
              setShowOrphanedSteps(!showOrphanedSteps);
              setShowValidationSteps(false);
              setShowRetrySteps(false);
            }}
            className={`inline-flex items-center justify-center gap-2 rounded-md px-4 py-2.5 text-sm font-medium shadow-sm transition-colors ${
              showOrphanedSteps
                ? "bg-amber-100 text-amber-700 border border-amber-300"
                : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50"
            }`}
          >
            <AlertTriangle className="h-4 w-4" />
            Orphaned Steps
          </button>
          <button
            onClick={() => setShowAdvancedFilters(true)}
            className="inline-flex items-center justify-center gap-2 rounded-md bg-white border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
          >
            <Filter className="h-4 w-4" />
            <span>Filters</span>
            {(stepCodeFilter ||
              isCriticalFilter !== "" ||
              isParallelFilter !== "" ||
              isActiveFilter !== "" ||
              failureActionFilter ||
              parallelGroupIdFilter) && (
              <span className="ml-1 inline-flex items-center rounded-full bg-white/20 px-2 py-0.5 text-xs font-medium">
                Active
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Batch Actions Toolbar */}
      {isSelectionMode && selectedSteps.size > 0 && (
        <div className="flex items-center justify-between rounded-md border border-gray-200 bg-white px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">
              {selectedSteps.size} step(s) selected
            </span>
            <button
              onClick={() => setSelectedSteps(new Set())}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleBatchAction("activate")}
              disabled={isBatchProcessing}
              className="inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-semibold text-white disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: color.primary.action }}
            >
              <Play className="h-4 w-4" />
              Activate
            </button>
            <button
              onClick={() => handleBatchAction("deactivate")}
              disabled={isBatchProcessing}
              className="inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none"
              style={{
                backgroundColor: "transparent",
                color: color.primary.action,
                border: `1px solid ${color.primary.action}`,
              }}
            >
              <Pause className="h-4 w-4" />
              Deactivate
            </button>
            <button
              onClick={() => {
                if (
                  window.confirm(
                    `Are you sure you want to delete ${selectedSteps.size} step(s)? This action cannot be undone.`
                  )
                ) {
                  handleBatchAction("delete");
                }
              }}
              disabled={isBatchProcessing}
              className="inline-flex items-center gap-2 rounded-md border border-red-200 px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </button>
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
                          filteredSteps.length > 0 &&
                          selectedSteps.size === filteredSteps.length
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
                    Step Name
                  </th>
                  <th
                    className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider"
                    style={{
                      color: color.surface.tableHeaderText,
                      backgroundColor: color.surface.tableHeader,
                    }}
                  >
                    Job
                  </th>
                  <th
                    className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider"
                    style={{
                      color: color.surface.tableHeaderText,
                      backgroundColor: color.surface.tableHeader,
                    }}
                  >
                    Order
                  </th>
                  <th
                    className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider"
                    style={{
                      color: color.surface.tableHeaderText,
                      backgroundColor: color.surface.tableHeader,
                    }}
                  >
                    Type
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
                {filteredSteps.map((step) => (
                  <tr key={step.id} className="transition-colors">
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
                          checked={selectedSteps.has(step.id)}
                          onChange={() => handleSelectStep(step.id)}
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
                      <div className="flex items-center">
                        <div>
                          <div
                            className={`text-base font-semibold ${tw.textPrimary}`}
                          >
                            {step.step_name}
                          </div>
                          <div className="mt-1 text-xs text-gray-500">
                            Code: {step.step_code}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td
                      className="px-6 py-4"
                      style={{ backgroundColor: color.surface.tablebodybg }}
                    >
                      <div className={`text-sm ${tw.textSecondary}`}>
                        {jobMap[step.job_id]?.name || `Job #${step.job_id}`}
                      </div>
                    </td>
                    <td
                      className="px-6 py-4"
                      style={{ backgroundColor: color.surface.tablebodybg }}
                    >
                      <div className={`text-sm ${tw.textSecondary}`}>
                        {step.step_order}
                      </div>
                    </td>
                    <td
                      className="px-6 py-4"
                      style={{ backgroundColor: color.surface.tablebodybg }}
                    >
                      <div className={`text-sm ${tw.textSecondary}`}>
                        {getStepTypeLabel(step.step_type)}
                      </div>
                    </td>
                    <td
                      className="px-6 py-4"
                      style={{ backgroundColor: color.surface.tablebodybg }}
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-sm font-medium ${
                            step.is_active ? "text-green-700" : "text-gray-500"
                          }`}
                        >
                          {step.is_active ? "Active" : "Inactive"}
                        </span>
                        {step.is_critical && (
                          <span className="inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-800">
                            Critical
                          </span>
                        )}
                        {step.is_parallel && (
                          <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800">
                            Parallel
                          </span>
                        )}
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
                              `/dashboard/job-workflow-steps/${step.id}?job_id=${step.job_id}`
                            )
                          }
                          className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                          aria-label="View details"
                          title="View details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() =>
                            navigate(
                              `/dashboard/job-workflow-steps/${step.id}/edit?job_id=${step.job_id}`
                            )
                          }
                          className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                          aria-label="Edit step"
                          title="Edit step"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDuplicateStep(step)}
                          className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                          aria-label="Duplicate step"
                          title="Duplicate step"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                        {jobIdFilter && (
                          <button
                            onClick={() =>
                              handleValidateIntegrity(Number(jobIdFilter))
                            }
                            className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                            aria-label="Validate workflow integrity"
                            title="Validate workflow integrity"
                          >
                            <Workflow className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => {
                            setDeletingStep(step);
                            setShowDeleteModal(true);
                          }}
                          className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors"
                          aria-label="Delete step"
                          title="Delete step"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {deletingStep && (
        <DeleteConfirmModal
          isOpen={showDeleteModal}
          onClose={() => {
            setShowDeleteModal(false);
            setDeletingStep(null);
          }}
          onConfirm={async () => {
            if (!deletingStep) return;
            try {
              setIsDeleting(true);
              await jobWorkflowStepService.deleteJobWorkflowStep(
                deletingStep.id
              );
              showToast(
                "Workflow step deleted",
                `"${deletingStep.step_name}" has been deleted successfully.`
              );
              setShowDeleteModal(false);
              setDeletingStep(null);
              await fetchSteps();
            } catch (err) {
              const message =
                err instanceof Error
                  ? err.message
                  : "Failed to delete workflow step";
              showError("Unable to delete workflow step", message);
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
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Step Code
                      </label>
                      <input
                        type="text"
                        value={stepCodeFilter}
                        onChange={(e) => setStepCodeFilter(e.target.value)}
                        placeholder="Enter step code"
                        className="w-full text-sm px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#3b8169] focus:border-transparent"
                      />
                    </div>

                    {/* Critical Filter */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Critical
                      </label>
                      <HeadlessSelect
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
                            value === "" ? "" : value === "true" ? true : false
                          )
                        }
                        placeholder="All"
                        className="w-full"
                      />
                    </div>

                    {/* Parallel Filter */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Parallel
                      </label>
                      <HeadlessSelect
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
                            value === "" ? "" : value === "true" ? true : false
                          )
                        }
                        placeholder="All"
                        className="w-full"
                      />
                    </div>

                    {/* Active Filter */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Active Status
                      </label>
                      <HeadlessSelect
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
                            value === "" ? "" : value === "true" ? true : false
                          )
                        }
                        placeholder="All"
                        className="w-full"
                      />
                    </div>

                    {/* Failure Action Filter */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Failure Action
                      </label>
                      <HeadlessSelect
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
                    </div>

                    {/* Parallel Group ID Filter */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Parallel Group ID
                      </label>
                      <input
                        type="number"
                        value={parallelGroupIdFilter || ""}
                        onChange={(e) =>
                          setParallelGroupIdFilter(
                            e.target.value ? Number(e.target.value) : ""
                          )
                        }
                        placeholder="All Groups"
                        className="w-full text-sm px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#3b8169] focus:border-transparent"
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
                        setIsCriticalFilter("");
                        setIsParallelFilter("");
                        setIsActiveFilter("");
                        setFailureActionFilter("");
                        setParallelGroupIdFilter("");
                      }}
                      className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                    >
                      Clear All
                    </button>
                    <button
                      onClick={() => setShowAdvancedFilters(false)}
                      className="flex-1 px-4 py-2 text-sm font-semibold text-white rounded-md transition-colors"
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

      {/* Reorder Steps Modal */}
      {showReorderModal &&
        createPortal(
          <div
            className="fixed inset-0 overflow-hidden"
            style={{ zIndex: 999999, top: 0, left: 0, right: 0, bottom: 0 }}
          >
            <div
              className="absolute inset-0 bg-black bg-opacity-50 transition-opacity duration-300 ease-in-out"
              onClick={() => setShowReorderModal(false)}
            ></div>
            <div
              className="absolute left-1/2 top-1/2 w-full max-w-2xl -translate-x-1/2 -translate-y-1/2 transform bg-white shadow-xl"
              style={{ zIndex: 1000000 }}
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
                        className={`flex items-center justify-between rounded-md border p-3 transition-all cursor-move ${
                          draggedItem === idx
                            ? "opacity-50 border-blue-400 bg-blue-50"
                            : dragOverIndex === idx
                            ? "border-blue-400 bg-blue-50 border-dashed"
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
                          <input
                            type="number"
                            min="1"
                            value={item.newOrder}
                            onChange={(e) => {
                              const newOrder = Number(e.target.value) || 1;
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
                            className="w-20 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-[#3b8169] focus:outline-none focus:ring-1 focus:ring-[#3b8169]"
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
                    (item) => item.currentOrder !== item.newOrder
                  ) && (
                    <div className="mt-4 rounded-md bg-blue-50 border border-blue-200 p-3">
                      <p className="text-sm text-blue-800">
                        <strong>Note:</strong> Step order will be updated when
                        you save. Make sure the order numbers are correct.
                      </p>
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-gray-200 bg-gray-50">
                  <div className="flex space-x-3">
                    <button
                      onClick={() => setShowReorderModal(false)}
                      className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleReorderSteps}
                      disabled={isReordering}
                      className="flex-1 px-4 py-2 text-sm font-semibold text-white rounded-md transition-colors disabled:opacity-50"
                      style={{ backgroundColor: color.primary.action }}
                    >
                      {isReordering ? "Reordering..." : "Save Order"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>,
          document.body
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
    </div>
  );
}
