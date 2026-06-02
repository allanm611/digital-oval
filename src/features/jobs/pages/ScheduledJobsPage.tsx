import { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import {
  AlertTriangle,
  Briefcase,
  CheckCircle,
  Clock,
  Eye,
  Edit,
  Trash2,
  Play,
  Pause,
  Archive,
  X,
  CheckSquare,
  Square,
  Filter,
  BarChart3,
} from "lucide-react";
import SearchInput from "../../../shared/components/ui/SearchInput";
import BackButton from "../../../shared/components/ui/BackButton";
import { useNavigate, useLocation } from "react-router-dom";
import LoadingSpinner from "../../../shared/components/ui/LoadingSpinner";
import DeleteConfirmModal from "../../../shared/components/ui/DeleteConfirmModal";
import HeadlessSelect from "../../../shared/components/ui/HeadlessSelect";
import Pagination from "../../../shared/components/ui/Pagination";
import CreateButton from "../../../shared/components/ui/CreateButton";
import Input from "../../../shared/components/ui/Input";
import SelectJobTypeModal from "../components/SelectJobTypeModal";
import { color, tw, zIndexTokens } from "../../../shared/utils/utils";
import { useToast } from "../../../contexts/ToastContext";
import { extractBackendError } from "../../../shared/utils/errorHandler";;;
import { useLanguage } from "../../../contexts/LanguageContext";
import { scheduledJobService } from "../services/scheduledJobService";
import { jobTypeService } from "../services/jobTypeService";
import type {
  ScheduledJob,
  ScheduledJobSearchParams,
} from "../types/scheduledJob";
import { useAuth } from "../../../contexts/AuthContext";
import { PermissionGate } from "../../auth/components/PermissionGate";
import Checkbox from "../../../shared/components/ui/Checkbox";

const STATUS_OPTIONS = [
  { label: "All statuses", value: "" },
  { label: "Active", value: "active" },
  { label: "Paused", value: "paused" },
  { label: "Draft", value: "draft" },
  { label: "Archived", value: "archived" },
];

export default function ScheduledJobsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { error: showError, success: showToast } = useToast();
  const { user } = useAuth();
  const { t } = useLanguage();

  const [jobs, setJobs] = useState<ScheduledJob[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [stats, setStats] = useState({
    totalJobs: 0,
    activeJobs: 0,
    draftJobs: 0,
    jobsByType: 0,
    jobsByOwner: 0,
    slaBreached: 0,
    staleJobs: 0,
    dueForExecution: 0,
  });
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingJob, setDeletingJob] = useState<ScheduledJob | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [jobTypeMap, setJobTypeMap] = useState<Record<number, string>>({});
  const [isSelectTypeModalOpen, setIsSelectTypeModalOpen] = useState(false);
  // Bulk selection and batch operations
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedJobs, setSelectedJobs] = useState<Set<number>>(new Set());
  const [isBatchProcessing, setIsBatchProcessing] = useState(false);
  // Advanced filters
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [jobTypeFilter, setJobTypeFilter] = useState<number | "">("");
  const [ownerFilter, setOwnerFilter] = useState<number | "">("");
  const [tagFilter, setTagFilter] = useState<string>("");
  const [scheduleTypeFilter, setScheduleTypeFilter] = useState<string>("");
  const [connectionProfileFilter, setConnectionProfileFilter] = useState<
    number | ""
  >("");
  const [tenantFilter, setTenantFilter] = useState<number | "">("");
  const [jobCodeFilter, setJobCodeFilter] = useState<string>("");
  const [activeJobsFilter, setActiveJobsFilter] = useState<boolean>(false);
  const [jobTypes, setJobTypes] = useState<Array<{ id: number; name: string }>>(
    [],
  );
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(20);


  const fetchJobs = useCallback(
    async (overrideParams?: Partial<ScheduledJobSearchParams>) => {
      setErrorMessage(null);
      const trimmedSearchTerm = searchTerm.trim();
      const hasSearchTerm = !!trimmedSearchTerm;

      setIsLoading(true);

      try {
        let response;

        // Check for advanced filters first (lookup endpoints)
        if (activeJobsFilter) {
          response = await scheduledJobService.getActiveJobs(true);
        } else if (jobCodeFilter.trim()) {
          // getScheduledJobByCode returns a single job, convert to array format
          try {
            const job = await scheduledJobService.getScheduledJobByCode(
              jobCodeFilter.trim(),
            );
            response = { data: [job], pagination: { total: 1 } };
          } catch {
            // If job not found, return empty
            response = { data: [], pagination: { total: 0 } };
          }
        } else if (jobTypeFilter) {
          response = await scheduledJobService.getScheduledJobsByJobType(
            Number(jobTypeFilter),
          );
        } else if (ownerFilter) {
          response = await scheduledJobService.getScheduledJobsByOwner(
            Number(ownerFilter),
            true,
          );
        } else if (tagFilter.trim()) {
          response = await scheduledJobService.getScheduledJobsByTag(
            tagFilter.trim(),
            true,
          );
        } else if (scheduleTypeFilter) {
          response = await scheduledJobService.getScheduledJobsByScheduleType(
            scheduleTypeFilter,
            true,
          );
        } else if (connectionProfileFilter) {
          response =
            await scheduledJobService.getScheduledJobsByConnectionProfile(
              Number(connectionProfileFilter),
              true,
            );
        } else if (tenantFilter) {
          response = await scheduledJobService.getScheduledJobsByTenant(
            Number(tenantFilter),
            true,
          );
        } else if (hasSearchTerm) {
          // Use search endpoint when there's a search term
          const params: ScheduledJobSearchParams = {
            limit: 50,
            offset: 0,
            searchTerm: trimmedSearchTerm,
            ...overrideParams,
          };
          response = await scheduledJobService.searchScheduledJobs({
            ...params,
            skipCache: true,
          });
        } else {
          // Use list endpoint when there's no search term
          const params = {
            limit: 50,
            offset: 0,
            ...overrideParams,
          };
          response = await scheduledJobService.listScheduledJobs({
            ...params,
            skipCache: true,
          });
        }
        const jobList = response.data || [];
        const sortedJobs = [...jobList].sort((a, b) => {
          const createdB = b.created_at ? new Date(b.created_at).getTime() : 0;
          const createdA = a.created_at ? new Date(a.created_at).getTime() : 0;
          if (createdB === createdA) {
            return (b.id || 0) - (a.id || 0);
          }
          return createdB - createdA;
        });
        setJobs(sortedJobs);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to load scheduled jobs";
        setErrorMessage(message);
        showError("Scheduled Jobs", extractBackendError(error, "Scheduled Jobs. Please try again."));
      } finally {
        setIsLoading(false);
      }
    },
    [
      searchTerm,
      statusFilter,
      jobTypeFilter,
      ownerFilter,
      tagFilter,
      scheduleTypeFilter,
      connectionProfileFilter,
      tenantFilter,
      jobCodeFilter,
      activeJobsFilter,
      showError,
    ],
  );

  const fetchStats = useCallback(async () => {
    setIsLoadingStats(true);
    try {
      const [
        statusCounts,
        typeCounts,
        ownerCounts,
        slaBreachResponse,
        staleResponse,
        dueResponse,
      ] = await Promise.all([
        scheduledJobService.getCountByStatus(true),
        scheduledJobService.getCountByType(true).catch(() => []),
        scheduledJobService.getCountByOwner(true).catch(() => []),
        scheduledJobService.getSlaBreachJobs(true).catch(() => ({ data: [] })),
        scheduledJobService.getStaleJobs(true).catch(() => ({ data: [] })),
        scheduledJobService
          .getDueForExecutionJobs(true)
          .catch(() => ({ data: [] })),
      ]);

      const totalJobs = statusCounts.reduce((sum, item) => {
        const count =
          typeof item.count === "string"
            ? parseInt(item.count, 10) || 0
            : item.count || 0;
        return sum + count;
      }, 0);

      const getCountByStatus = (status: string) => {
        const item = statusCounts.find((item) => {
          const itemStatus =
            "status" in item ? item.status : "label" in item ? item.label : "";
          return itemStatus.toLowerCase() === status.toLowerCase();
        });
        if (!item) return 0;
        return typeof item.count === "string"
          ? parseInt(item.count, 10) || 0
          : item.count || 0;
      };

      const activeJobs = getCountByStatus("active");
      const draftJobs = getCountByStatus("draft");

      // Sum up jobs by type
      const jobsByType = Array.isArray(typeCounts)
        ? typeCounts.reduce((sum, item) => {
            const count =
              typeof item.count === "string"
                ? parseInt(item.count, 10) || 0
                : item.count || 0;
            return sum + count;
          }, 0)
        : 0;

      // Sum up jobs by owner
      const jobsByOwner = Array.isArray(ownerCounts)
        ? ownerCounts.reduce((sum, item) => {
            const count =
              typeof item.count === "string"
                ? parseInt(item.count, 10) || 0
                : item.count || 0;
            return sum + count;
          }, 0)
        : 0;

      // Get counts from list responses
      const slaBreached =
        slaBreachResponse && "data" in slaBreachResponse
          ? slaBreachResponse.data.length
          : 0;
      const staleJobs =
        staleResponse && "data" in staleResponse
          ? staleResponse.data.length
          : 0;
      const dueForExecution =
        dueResponse && "data" in dueResponse ? dueResponse.data.length : 0;

      setStats({
        totalJobs,
        activeJobs,
        draftJobs,
        jobsByType,
        jobsByOwner,
        slaBreached,
        staleJobs,
        dueForExecution,
      });
    } catch (err) {
      console.error("Failed to load stats:", err);
    } finally {
      setIsLoadingStats(false);
    }
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchJobs();
    }, 300);
    return () => clearTimeout(timeout);
  }, [fetchJobs, location.key]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats, location.key]);

  useEffect(() => {
    const loadJobTypes = async () => {
      try {
        const response = await jobTypeService.listJobTypes({
          limit: 100,
          skipCache: true,
        });
        // Create a map of job_type_id -> job_type_name
        const map: Record<number, string> = {};
        const types = (response.data || []).map((jobType) => ({
          id: jobType.id,
          name: jobType.name,
        }));
        (response.data || []).forEach((jobType) => {
          map[jobType.id] = jobType.name;
        });
        setJobTypeMap(map);
        setJobTypes(types);
      } catch (err) {
        console.error("Failed to load job types:", err);
      }
    };
    loadJobTypes();
  }, []);

  const filteredJobs = useMemo(() => {
    if (!statusFilter) return jobs;
    const filterLower = statusFilter.toLowerCase();
    return jobs.filter(
      (job) => job.status?.toLowerCase() === filterLower
    );
  }, [jobs, statusFilter]);

  // Reset pagination when filters/search change
  useEffect(() => {
    setCurrentPage(1);
  }, [
    searchTerm,
    statusFilter,
    jobTypeFilter,
    ownerFilter,
    tagFilter,
    scheduleTypeFilter,
    connectionProfileFilter,
    tenantFilter,
    jobCodeFilter,
    activeJobsFilter,
  ]);

  // Paginate filtered jobs
  const paginatedJobs = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return filteredJobs.slice(startIndex, endIndex);
  }, [filteredJobs, currentPage, pageSize]);

  // Bulk selection and batch operations
  const handleSelectJob = (jobId: number) => {
    setSelectedJobs((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(jobId)) {
        newSet.delete(jobId);
      } else {
        newSet.add(jobId);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    if (selectedJobs.size === filteredJobs.length) {
      setSelectedJobs(new Set());
    } else {
      setSelectedJobs(new Set(filteredJobs.map((job) => job.id)));
    }
  };

  const handleBatchAction = async (
    action: "activate" | "deactivate" | "pause" | "archive" | "delete",
  ) => {
    if (selectedJobs.size === 0) return;

    const jobIds = Array.from(selectedJobs);
    setIsBatchProcessing(true);

    try {
      let result;
      switch (action) {
        case "activate":
          result = await scheduledJobService.batchActivate(
            jobIds,
            user?.user_id,
          );
          break;
        case "deactivate":
          result = await scheduledJobService.batchDeactivate(
            jobIds,
            user?.user_id,
          );
          break;
        case "pause":
          result = await scheduledJobService.batchPause(jobIds, user?.user_id);
          break;
        case "archive":
          result = await scheduledJobService.batchArchive(
            jobIds,
            user?.user_id,
          );
          break;
        case "delete":
          if (
            !window.confirm(
              `Are you sure you want to delete ${jobIds.length} job(s)? This action cannot be undone.`,
            )
          ) {
            setIsBatchProcessing(false);
            return;
          }
          result = await scheduledJobService.batchDelete(jobIds, user?.user_id);
          break;
      }

      showToast(
        `Batch ${action} completed`,
        `${result.success} job(s) ${action}d successfully${
          result.failed > 0 ? `, ${result.failed} failed` : ""
        }`,
      );

      setSelectedJobs(new Set());
      fetchJobs(); // Refresh the list
    } catch (err) {
      showError(
        `Batch ${action} failed`,
        err instanceof Error ? err.message : "Unknown error",
      );
    } finally {
      setIsBatchProcessing(false);
    }
  };

  return (
    <>
      <div className="overflow-x-auto">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
          <BackButton
            showBreadcrumb={true}
            currentLabel="Scheduled Jobs"
          />
          <div className="flex gap-3">
          <button
            onClick={() => navigate("/dashboard/scheduled-jobs/analytics")}
            className={`inline-flex items-center gap-2 ${tw.rounded} px-4 py-2 text-sm font-medium focus:outline-none transition-colors`}
            style={{
              backgroundColor: "transparent",
              color: color.primary.action,
              border: `1px solid ${color.primary.action}`,
            }}
          >
            <BarChart3 className="h-4 w-4" />
            {t.jobs.analytics}
          </button>
          <PermissionGate permission="jobs.select">
            <button
              onClick={() => {
                if (!isSelectionMode) {
                  // Entering selection mode - select all visible jobs
                  setIsSelectionMode(true);
                  setSelectedJobs(new Set(filteredJobs.map((job) => job.id)));
                } else {
                  // Exiting selection mode - clear selection
                  setIsSelectionMode(false);
                  setSelectedJobs(new Set());
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
              {isSelectionMode ? "Exit Selection" : "Select Jobs"}
            </button>
          </PermissionGate>
          <PermissionGate permission="jobs.create">
            <CreateButton onClick={() => setIsSelectTypeModalOpen(true)} />
          </PermissionGate>
          </div>
        </div>
        <p className={`${tw.textSecondary} text-sm mt-1`}>
          {t.jobs.scheduledJobsDescription}
        </p>

        <div className="mt-6">
          <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
        <div
          className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm`}
        >
          <div className="flex items-center gap-2">
            <Briefcase
              className="h-5 w-5"
              style={{ color: color.primary.accent }}
            />
            <p className="text-sm font-medium text-gray-600">
              {t.jobs.totalScheduledJobs}
            </p>
          </div>
          <p className="mt-2 text-3xl font-bold text-gray-900">
            {isLoadingStats ? "..." : stats.totalJobs}
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
            <p className="text-sm font-medium text-gray-600">Active Jobs</p>
          </div>
          <p className="mt-2 text-3xl font-bold text-gray-900">
            {isLoadingStats ? "..." : stats.activeJobs}
          </p>
        </div>
        <div
          className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm`}
        >
          <div className="flex items-center gap-2">
            <Briefcase
              className="h-5 w-5"
              style={{ color: color.primary.accent }}
            />
            <p className="text-sm font-medium text-gray-600">Draft Jobs</p>
          </div>
          <p className="mt-2 text-3xl font-bold text-gray-900">
            {isLoadingStats ? "..." : stats.draftJobs}
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
            <p className="text-sm font-medium text-gray-600">SLA Breached</p>
          </div>
          <p className="mt-2 text-3xl font-bold text-gray-900">
            {isLoadingStats ? "..." : stats.slaBreached}
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
            <p className="text-sm font-medium text-gray-600">Stale Jobs</p>
          </div>
          <p className="mt-2 text-3xl font-bold text-gray-900">
            {isLoadingStats ? "..." : stats.staleJobs}
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
            <p className="text-sm font-medium text-gray-600">
              Due for Execution
            </p>
          </div>
          <p className="mt-2 text-3xl font-bold text-gray-900">
            {isLoadingStats ? "..." : stats.dueForExecution}
          </p>
        </div>
      </div>
      </div>

      <div className="space-y-4 mt-6">
        <div className="flex gap-4">
          <SearchInput
          placeholder="Search by name or code"
          value={searchTerm}
          onChange={setSearchTerm}
        />
        <HeadlessSelect
          value={statusFilter}
          onChange={(value) => setStatusFilter(value as string)}
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
          {(jobTypeFilter ||
            ownerFilter ||
            tagFilter ||
            scheduleTypeFilter ||
            connectionProfileFilter ||
            jobCodeFilter ||
            activeJobsFilter) && (
            <span className="ml-1 inline-flex items-center rounded-full bg-white/20 px-2 py-0.5 text-xs font-medium">
              Active
            </span>
          )}
        </button>
        </div>
      </div>

      {/* Batch Actions Toolbar */}
      {isSelectionMode && selectedJobs.size > 0 && (
        <div
          className={`flex items-center justify-between ${tw.rounded} border border-gray-200 bg-white px-4 py-3`}
        >
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">
              {selectedJobs.size} job(s) selected
            </span>
            <button
              onClick={() => setSelectedJobs(new Set())}
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
              onClick={() => handleBatchAction("pause")}
              disabled={isBatchProcessing}
              className={`inline-flex items-center gap-2 ${tw.rounded} px-3 py-1.5 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none`}
              style={{
                backgroundColor: "transparent",
                color: color.primary.action,
                border: `1px solid ${color.primary.action}`,
              }}
            >
              <Pause className="h-4 w-4" />
              Pause
            </button>
            <button
              onClick={() => handleBatchAction("archive")}
              disabled={isBatchProcessing}
              className={`inline-flex items-center gap-2 ${tw.rounded} border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50`}
            >
              <Archive className="h-4 w-4" />
              Archive
            </button>
            <button
              onClick={() => handleBatchAction("delete")}
              disabled={isBatchProcessing}
              className={`inline-flex items-center gap-2 ${tw.rounded} border border-red-200 px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-50`}
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
        ) : filteredJobs.length === 0 ? (
          <div className="py-16 text-center">
            <Briefcase className="mx-auto mb-4 h-12 w-12 text-gray-300" />
            <p className={`text-lg font-semibold ${tw.textPrimary}`}>
              {t.jobs.noScheduledJobsFound}
            </p>
            <p className="mt-2 text-sm text-gray-500">
              Try updating your search filters or create a new job
              configuration.
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
                      <div className="flex items-center gap-2 cursor-pointer" onClick={handleSelectAll}>
                        <Checkbox
                          id="select-all-jobs"
                          checked={
                            filteredJobs.length > 0 &&
                            selectedJobs.size === filteredJobs.length
                          }
                          onChange={handleSelectAll}
                        />
                      </div>
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
                    Job Name
                  </th>
                  <th
                    className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider"
                    style={{
                      color: color.surface.tableHeaderText,
                      backgroundColor: color.surface.tableHeader,
                    }}
                  >
                    Code
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
                    Schedule
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
                {paginatedJobs.map((job) => (
                  <tr key={job.id} className="transition-colors">
                    {isSelectionMode && (
                      <td
                        className="px-6 py-4"
                        style={{
                          backgroundColor: color.surface.tablebodybg,
                          borderTopLeftRadius: "0.375rem",
                          borderBottomLeftRadius: "0.375rem",
                        }}
                      >
                        <div
                          className="flex items-center gap-2 cursor-pointer"
                          onClick={() => handleSelectJob(job.id)}
                        >
                          <Checkbox
                            id={`job-${job.id}`}
                            checked={selectedJobs.has(job.id)}
                            onChange={() => handleSelectJob(job.id)}
                          />
                        </div>
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
                      <div
                        className={`${tw.tableFirstColumn} ${tw.textPrimary}`}
                      >
                        {job.name}
                      </div>
                    </td>
                    <td
                      className="px-6 py-4"
                      style={{ backgroundColor: color.surface.tablebodybg }}
                    >
                      <div className="text-sm text-gray-600">{job.code}</div>
                    </td>
                    <td
                      className="px-6 py-4"
                      style={{ backgroundColor: color.surface.tablebodybg }}
                    >
                      <div className={`text-sm ${tw.textSecondary}`}>
                        {job.job_type_id && jobTypeMap[job.job_type_id]
                          ? jobTypeMap[job.job_type_id]
                          : job.job_type_id
                            ? `Type #${job.job_type_id}`
                            : "—"}
                      </div>
                    </td>
                    <td
                      className="px-6 py-4"
                      style={{ backgroundColor: color.surface.tablebodybg }}
                    >
                      <div className={`text-sm ${tw.textSecondary} capitalize`}>
                        {job.schedule_type.replace("_", " ")}
                      </div>
                    </td>
                    <td
                      className="px-6 py-4"
                      style={{ backgroundColor: color.surface.tablebodybg }}
                    >
                      <span className="text-sm text-gray-900 font-medium">
                        {job.status}
                      </span>
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
                            navigate(`/dashboard/scheduled-jobs/${job.id}`, { state: { parentLabel: "Scheduled Jobs" } })
                          }
                          className={`p-2 ${tw.rounded} text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors`}
                          aria-label="View details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <PermissionGate permission="jobs.update">
                          <button
                            onClick={() =>
                              navigate(
                                `/dashboard/scheduled-jobs/${job.id}/edit`,
                              )
                            }
                            className={`p-2 ${tw.rounded} text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors`}
                            aria-label="Edit job"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                        </PermissionGate>
                        <PermissionGate permission="jobs.delete">
                          <button
                            onClick={() => {
                              setDeletingJob(job);
                              setShowDeleteModal(true);
                            }}
                            className={`p-2 text-red-600 hover:text-red-700 hover:bg-red-50 ${tw.rounded} transition-colors`}
                            aria-label="Delete job"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </PermissionGate>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {paginatedJobs.length > 0 && filteredJobs.length > 0 && (
              <Pagination
                currentPage={currentPage}
                pageSize={pageSize}
                totalItems={filteredJobs.length}
                onPageChange={setCurrentPage}
              />
            )}
          </div>
        )}
      </div>

      {deletingJob && (
        <DeleteConfirmModal
          isOpen={showDeleteModal}
          onClose={() => {
            setShowDeleteModal(false);
            setDeletingJob(null);
          }}
          onConfirm={async () => {
            if (!deletingJob) return;
            try {
              setIsDeleting(true);
              await scheduledJobService.deleteScheduledJob(deletingJob.id);
              showToast(
                "Scheduled job deleted",
                `"${deletingJob.name}" has been deleted successfully.`,
              );
              setShowDeleteModal(false);
              setDeletingJob(null);
              await fetchJobs();
            } catch (err) {
              const message =
                err instanceof Error
                  ? err.message
                  : "Failed to delete scheduled job";
              showError("Unable to delete scheduled job", extractBackendError(error, "Unable to delete scheduled job. Please try again."));
            } finally {
              setIsDeleting(false);
            }
          }}
          title="Delete Scheduled Job"
          description={`Are you sure you want to delete the scheduled job "${deletingJob.name}"? This action cannot be undone.`}
          itemName={deletingJob.name}
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
              zIndex: zIndexTokens.overlay,
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
              className="absolute right-0 top-0 h-full w-full sm:w-[28rem] lg:w-96 bg-white shadow-xl transform transition-transform duration-300 ease-out translate-x-0"
              style={{ zIndex: zIndexTokens.modal }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex flex-col h-full">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-200">
                  <h2 className="text-sm font-semibold text-gray-900">
                    Filter Jobs
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
                    {/* Job Type Filter */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Job Type
                      </label>
                      <HeadlessSelect
                        options={[
                          { value: "", label: t.jobs.allJobTypes },
                          ...jobTypes.map((type) => ({
                            value: type.id.toString(),
                            label: type.name,
                          })),
                        ]}
                        value={jobTypeFilter ? jobTypeFilter.toString() : ""}
                        onChange={(value) =>
                          setJobTypeFilter(value ? Number(value) : "")
                        }
                        placeholder={t.jobs.allJobTypes}
                        className="w-full"
                      />
                    </div>

                    {/* Owner Filter */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Owner ID
                      </label>
                      <Input
                        type="number"
                        value={ownerFilter || ""}
                        onChange={(value) =>
                          setOwnerFilter(
                            value ? Number(value) : "",
                          )
                        }
                        placeholder="All Owners"
                        variant="medium"
                      />
                    </div>

                    {/* Tag Filter */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Tag
                      </label>
                      <Input
                        type="text"
                        value={tagFilter}
                        onChange={(value) => setTagFilter(String(value))}
                        placeholder="All Tags"
                        variant="medium"
                      />
                    </div>

                    {/* Schedule Type Filter */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Schedule Type
                      </label>
                      <HeadlessSelect
                        options={[
                          { value: "", label: "All Schedule Types" },
                          { value: "cron", label: "Custom Schedule" },
                          { value: "interval", label: "Repeat Regularly" },
                          { value: "event_driven", label: "Event Driven" },
                          { value: "manual", label: "Manual" },
                          { value: "dependency_based", label: "Dependency Based" },
                        ]}
                        value={scheduleTypeFilter}
                        onChange={(value) =>
                          setScheduleTypeFilter(value as string)
                        }
                        placeholder="All Schedule Types"
                        className="w-full"
                      />
                    </div>

                    {/* Connection Profile Filter */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Connection Profile ID
                      </label>
                      <Input
                        type="number"
                        value={connectionProfileFilter || ""}
                        onChange={(value) =>
                          setConnectionProfileFilter(
                            value ? Number(value) : "",
                          )
                        }
                        placeholder="All Profiles"
                        variant="medium"
                      />
                    </div>

                    {/* Tenant Filter */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Tenant ID
                      </label>
                      <Input
                        type="number"
                        value={tenantFilter || ""}
                        onChange={(value) =>
                          setTenantFilter(
                            value ? Number(value) : "",
                          )
                        }
                        placeholder="All Tenants"
                        variant="medium"
                      />
                    </div>

                    {/* Job Code Filter */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Job Code
                      </label>
                      <Input
                        type="text"
                        value={jobCodeFilter}
                        onChange={(value) => setJobCodeFilter(String(value))}
                        placeholder="Enter job code"
                        variant="medium"
                      />
                    </div>

                    {/* Active Jobs Filter */}
                    <div>
                      <div
                        className="flex items-center gap-2 text-sm font-medium text-gray-700 cursor-pointer"
                        onClick={() => setActiveJobsFilter(!activeJobsFilter)}
                      >
                        <Checkbox
                          id="active-jobs-filter"
                          checked={activeJobsFilter}
                          onChange={() => setActiveJobsFilter(!activeJobsFilter)}
                        />
                        <span>Show Only Active Jobs</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-gray-200 bg-gray-50">
                  <div className="flex space-x-3">
                    <button
                      onClick={() => {
                        setJobTypeFilter("");
                        setOwnerFilter("");
                        setTagFilter("");
                        setScheduleTypeFilter("");
                        setConnectionProfileFilter("");
                        setTenantFilter("");
                        setJobCodeFilter("");
                        setActiveJobsFilter(false);
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

      <SelectJobTypeModal
        isOpen={isSelectTypeModalOpen}
        onClose={() => setIsSelectTypeModalOpen(false)}
        onContinue={(type) => {
          setIsSelectTypeModalOpen(false);
          navigate(
            type === "campaign"
              ? "/dashboard/scheduled-jobs/create?type=campaign"
              : "/dashboard/scheduled-jobs/create",
          );
        }}
      />
    </div>
    </>
  );
}
