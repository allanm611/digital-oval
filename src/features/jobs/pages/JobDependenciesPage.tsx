import { useCallback, useEffect, useMemo, useState, useRef } from "react";
import { createPortal } from "react-dom";
import {
  AlertTriangle,
  Link2,
  Edit,
  Eye,
  Plus,
  Search,
  Trash2,
  CheckCircle,
  XCircle,
  Filter,
  CheckSquare,
  Square,
  X,
  BarChart3,
  MoreHorizontal,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import LoadingSpinner from "../../../shared/components/ui/LoadingSpinner";
import DeleteConfirmModal from "../../../shared/components/ui/DeleteConfirmModal";
import HeadlessSelect from "../../../shared/components/ui/HeadlessSelect";
import DateFormatter from "../../../shared/components/DateFormatter";
import { color, tw } from "../../../shared/utils/utils";
import { useToast } from "../../../contexts/ToastContext";
import { useLanguage } from "../../../contexts/LanguageContext";
import { useAuth } from "../../../contexts/AuthContext";
import { useClickOutside } from "../../../shared/hooks/useClickOutside";
import { jobDependencyService } from "../services/jobDependencyService";
import { scheduledJobService } from "../services/scheduledJobService";
import {
  JobDependency,
  CreateJobDependencyPayload,
  UpdateJobDependencyPayload,
  DependencyType,
  WaitForStatus,
  UnsatisfiedDependency,
  JobDependencySearchParams,
} from "../types/jobDependency";
import { ScheduledJob } from "../types/scheduledJob";

interface JobDependencyModalProps {
  isOpen: boolean;
  isSaving: boolean;
  onClose: () => void;
  onSubmit: (values: CreateJobDependencyPayload) => Promise<void>;
  initialData?: JobDependency | null;
}

function JobDependencyModal({
  isOpen,
  isSaving,
  onClose,
  onSubmit,
  initialData,
}: JobDependencyModalProps) {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [jobId, setJobId] = useState<number | "">("");
  const [dependsOnJobId, setDependsOnJobId] = useState<number | "">("");
  const [dependencyType, setDependencyType] =
    useState<DependencyType>("blocking");
  const [waitForStatus, setWaitForStatus] = useState<WaitForStatus>("success");
  const [maxWaitMinutes, setMaxWaitMinutes] = useState<string>("");
  const [lookbackDays, setLookbackDays] = useState<string>("0");
  const [isActive, setIsActive] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [jobs, setJobs] = useState<ScheduledJob[]>([]);
  const [isLoadingJobs, setIsLoadingJobs] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    if (initialData) {
      setJobId(initialData.job_id);
      setDependsOnJobId(initialData.depends_on_job_id);
      setDependencyType(initialData.dependency_type);
      setWaitForStatus(initialData.wait_for_status);
      setMaxWaitMinutes(initialData.max_wait_minutes?.toString() || "");
      setLookbackDays(initialData.lookback_days.toString());
      setIsActive(initialData.is_active);
    } else {
      setJobId("");
      setDependsOnJobId("");
      setDependencyType("blocking");
      setWaitForStatus("success");
      setMaxWaitMinutes("");
      setLookbackDays("0");
      setIsActive(true);
    }
    setError(null);
  }, [initialData, isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const loadJobs = async () => {
      setIsLoadingJobs(true);
      try {
        const response = await scheduledJobService.listScheduledJobs({
          limit: 100,
          skipCache: true,
        });
        setJobs(response.data || []);
      } catch (err) {
        console.error("Failed to load jobs:", err);
      } finally {
        setIsLoadingJobs(false);
      }
    };

    loadJobs();
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (jobId === "" || jobId === null || jobId === undefined) {
      setError("Job ID is required");
      return;
    }

    if (
      dependsOnJobId === "" ||
      dependsOnJobId === null ||
      dependsOnJobId === undefined
    ) {
      setError("Depends on Job ID is required");
      return;
    }

    if (jobId === dependsOnJobId) {
      setError("A job cannot depend on itself");
      return;
    }

    if (
      maxWaitMinutes &&
      (isNaN(Number(maxWaitMinutes)) ||
        Number(maxWaitMinutes) < 0 ||
        Number(maxWaitMinutes) > 1440)
    ) {
      setError("Max wait minutes must be between 0 and 1440");
      return;
    }

    if (
      isNaN(Number(lookbackDays)) ||
      Number(lookbackDays) < 0 ||
      Number(lookbackDays) > 30
    ) {
      setError("Lookback days must be between 0 and 30");
      return;
    }

    if (!user?.user_id) {
      setError("User ID is required");
      return;
    }

    setError(null);

    console.log("🔵 JOB DEPENDENCY MODAL - Submitting payload:");
    console.log("User object:", user);
    console.log("user.user_id:", user.user_id);

    try {
      const payload = {
        job_id: Number(jobId),
        depends_on_job_id: Number(dependsOnJobId),
        dependency_type: dependencyType,
        wait_for_status: waitForStatus,
        max_wait_minutes: maxWaitMinutes ? Number(maxWaitMinutes) : null,
        lookback_days: Number(lookbackDays),
        is_active: isActive,
        userId: user.user_id, // Fixed: use user_id instead of id
      };

      console.log("Payload being sent:", JSON.stringify(payload, null, 2));

      await onSubmit(payload);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to save job dependency";
      setError(message);
    }
  };

  const jobOptions = jobs.map((job) => ({
    value: job.id.toString(),
    label: `${job.name} (ID: ${job.id})`,
  }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-2 sm:p-4">
      <div className="w-full max-w-lg rounded-xl bg-white p-4 sm:p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              {initialData ? "Edit Job Dependency" : "Create Job Dependency"}
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              {initialData
                ? "Update the job dependency relationship"
                : "Define a relationship between two scheduled jobs"}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Job ID (Dependent Job)
            </label>
            {isLoadingJobs ? (
              <div className="mt-1 flex items-center gap-2 text-sm text-gray-500">
                <LoadingSpinner size="sm" />
                Loading jobs...
              </div>
            ) : (
              <HeadlessSelect
                options={jobOptions}
                value={jobId ? jobId.toString() : ""}
                onChange={(value) => setJobId(value ? Number(value) : "")}
                placeholder="Select a job"
                className="mt-1"
              />
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Depends On Job ID
            </label>
            {isLoadingJobs ? (
              <div className="mt-1 flex items-center gap-2 text-sm text-gray-500">
                <LoadingSpinner size="sm" />
                Loading jobs...
              </div>
            ) : (
              <HeadlessSelect
                options={jobOptions}
                value={dependsOnJobId ? dependsOnJobId.toString() : ""}
                onChange={(value) =>
                  setDependsOnJobId(value ? Number(value) : "")
                }
                placeholder="Select a job this depends on"
                className="mt-1"
              />
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Dependency Type
            </label>
            <HeadlessSelect
              options={[
                { value: "blocking", label: "Blocking" },
                { value: "optional", label: "Optional" },
                { value: "cross_day", label: "Cross Day" },
                { value: "conditional", label: "Conditional" },
              ]}
              value={dependencyType}
              onChange={(value) => setDependencyType(value as DependencyType)}
              className="mt-1"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Wait For Status
            </label>
            <HeadlessSelect
              options={[
                { value: "success", label: "Success" },
                { value: "failure", label: "Failure" },
                { value: "partial_success", label: "Partial Success" },
                { value: "pending", label: "Pending" },
                { value: "queued", label: "Queued" },
                { value: "running", label: "Running" },
                { value: "aborted", label: "Aborted" },
                { value: "timeout", label: "Timeout" },
                { value: "skipped", label: "Skipped" },
                { value: "cancelled", label: "Cancelled" },
              ]}
              value={waitForStatus}
              onChange={(value) => setWaitForStatus(value as WaitForStatus)}
              className="mt-1"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Max Wait Minutes (0-1440, optional)
            </label>
            <input
              type="number"
              value={maxWaitMinutes}
              onChange={(e) => setMaxWaitMinutes(e.target.value)}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-[#3b8169] focus:outline-none focus:ring-1 focus:ring-[#3b8169]"
              placeholder="e.g. 60 (leave empty for no limit)"
              min="0"
              max="1440"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Lookback Days (0-30)
            </label>
            <input
              type="number"
              value={lookbackDays}
              onChange={(e) => setLookbackDays(e.target.value)}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-[#3b8169] focus:outline-none focus:ring-1 focus:ring-[#3b8169]"
              placeholder="0"
              min="0"
              max="30"
              required
            />
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="isActive"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-[#3b8169] focus:ring-[#3b8169]"
            />
            <label htmlFor="isActive" className="ml-2 text-sm text-gray-700">
              Active
            </label>
          </div>

          {error && (
            <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              <div className="font-semibold mb-2">Error</div>
              <div className="whitespace-pre-line">{error}</div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              {t.genericConfig.cancel}
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="rounded-md px-4 py-2 text-sm font-semibold text-white transition-colors disabled:cursor-not-allowed disabled:opacity-60"
              style={{ backgroundColor: color.primary.action }}
            >
              {isSaving
                ? t.profile.saving
                : initialData
                ? "Update Dependency"
                : "Create Dependency"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface JobDependencyViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  dependency: JobDependency | null;
  isLoading: boolean;
}

function JobDependencyViewModal({
  isOpen,
  onClose,
  dependency,
  isLoading,
}: JobDependencyViewModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-2 sm:p-4">
      <div className="w-full max-w-lg rounded-xl bg-white p-4 sm:p-6 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Job Dependency Details
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-8">
            <LoadingSpinner />
          </div>
        ) : dependency ? (
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-1">
                Dependency {dependency.id}
              </h3>
              <div className="flex items-center gap-2 mt-2">
                {dependency.is_active ? (
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    <CheckCircle className="w-3 h-3" />
                    Active
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                    <XCircle className="w-3 h-3" />
                    Inactive
                  </span>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Job ID
                  </label>
                  <p className="text-sm text-gray-900">{dependency.job_id}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Depends On Job ID
                  </label>
                  <p className="text-sm text-gray-900">
                    {dependency.depends_on_job_id}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Dependency Type
                  </label>
                  <p className="text-sm text-gray-900 capitalize">
                    {dependency.dependency_type}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Wait For Status
                  </label>
                  <p className="text-sm text-gray-900 capitalize">
                    {dependency.wait_for_status}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Max Wait Minutes
                  </label>
                  <p className="text-sm text-gray-900">
                    {dependency.max_wait_minutes ?? "No limit"}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Lookback Days
                  </label>
                  <p className="text-sm text-gray-900">
                    {dependency.lookback_days}
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-200">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Created At
                </label>
                <p className="text-sm text-gray-900">
                  <DateFormatter
                    date={dependency.created_at}
                    includeTime
                    useLocale
                    year="numeric"
                    month="short"
                    day="numeric"
                  />
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="py-8 text-center text-sm text-gray-500">
            No dependency data available
          </div>
        )}
      </div>
    </div>
  );
}

export default function JobDependenciesPage() {
  const navigate = useNavigate();
  const { success: showToast, error: showError } = useToast();
  // User is used in JobDependencyModal component
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { user } = useAuth();

  const [dependencies, setDependencies] = useState<JobDependency[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDependency, setEditingDependency] =
    useState<JobDependency | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingDependency, setDeletingDependency] =
    useState<JobDependency | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteAllModal, setShowDeleteAllModal] = useState(false);
  const [deletingAllJobId, setDeletingAllJobId] = useState<number | null>(null);
  const [isDeletingAll, setIsDeletingAll] = useState(false);
  const [stats, setStats] = useState({
    totalDependencies: 0,
    activeDependencies: 0,
    inactiveDependencies: 0,
    blockingDependencies: 0,
    optionalDependencies: 0,
  });
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  // Bulk selection and batch operations
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedDependencyIds, setSelectedDependencyIds] = useState<
    Set<number>
  >(new Set());
  const [isSearching, setIsSearching] = useState(false);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [jobsMap, setJobsMap] = useState<Map<number, string>>(new Map());
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [viewingDependency, setViewingDependency] =
    useState<JobDependency | null>(null);
  const [isLoadingView, setIsLoadingView] = useState(false);
  const [dependencyTypeFilter, setDependencyTypeFilter] =
    useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  // Advanced filters
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [filterId, setFilterId] = useState<number | "">("");
  const [filterJobId, setFilterJobId] = useState<number | "">("");
  const [filterDependsOnJobId, setFilterDependsOnJobId] = useState<number | "">(
    ""
  );
  const [filterDependencyType, setFilterDependencyType] = useState<string>("");
  const [filterWaitForStatus, setFilterWaitForStatus] = useState<string>("");
  const [filterIsActive, setFilterIsActive] = useState<boolean | "">("");
  const [filterLookbackDaysMin, setFilterLookbackDaysMin] = useState<
    number | ""
  >("");
  const [filterLookbackDaysMax, setFilterLookbackDaysMax] = useState<
    number | ""
  >("");
  const [filterMaxWaitMinutesMin, setFilterMaxWaitMinutesMin] = useState<
    number | ""
  >("");
  const [filterMaxWaitMinutesMax, setFilterMaxWaitMinutesMax] = useState<
    number | ""
  >("");
  const filterRef = useRef<HTMLDivElement>(null);
  const [showActionMenu, setShowActionMenu] = useState<number | null>(null);
  const actionMenuRefs = useRef<{ [key: number]: HTMLDivElement | null }>({});
  const dropdownMenuRefs = useRef<{ [key: number]: HTMLDivElement | null }>({});
  const [dropdownPosition, setDropdownPosition] = useState<{
    top: number;
    left: number;
    maxHeight: number;
    width?: number;
  } | null>(null);

  // Use click outside hook for filter modal
  useClickOutside(filterRef, () => setShowAdvancedFilters(false), {
    enabled: showAdvancedFilters,
  });

  // Use click outside hook for action menu dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showActionMenu !== null) {
        const menuRef = dropdownMenuRefs.current[showActionMenu];
        const buttonRef = actionMenuRefs.current[showActionMenu];
        if (
          menuRef &&
          !menuRef.contains(event.target as Node) &&
          buttonRef &&
          !buttonRef.contains(event.target as Node)
        ) {
          setShowActionMenu(null);
          setDropdownPosition(null);
        }
      }
    };

    if (showActionMenu !== null) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }
  }, [showActionMenu]);

  const handleActionMenuToggle = (
    dependencyId: number,
    event?: React.MouseEvent<HTMLButtonElement>
  ) => {
    if (showActionMenu === dependencyId) {
      setShowActionMenu(null);
      setDropdownPosition(null);
    } else {
      setShowActionMenu(dependencyId);

      // Calculate position from the clicked button
      if (event && event.currentTarget) {
        const button = event.currentTarget;
        const buttonRect = button.getBoundingClientRect();

        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        const isMobile = viewportWidth < 640;
        const dropdownWidth = isMobile
          ? Math.min(256, viewportWidth - 32)
          : 256;
        const spacing = 4;
        const padding = 8;

        const spaceBelow = viewportHeight - buttonRect.bottom - padding;
        const spaceAbove = buttonRect.top - padding;
        const shouldPositionAbove = spaceBelow < 200 && spaceAbove > spaceBelow;

        const top = shouldPositionAbove
          ? buttonRect.top - 200 - spacing
          : buttonRect.bottom + spacing;

        let left = buttonRect.right - dropdownWidth;
        if (left + dropdownWidth > viewportWidth - padding) {
          left = viewportWidth - dropdownWidth - padding;
        }
        if (left < padding) {
          left = padding;
        }

        // Calculate available space and set maxHeight accordingly
        const availableSpace = shouldPositionAbove ? spaceAbove : spaceBelow;
        const calculatedMaxHeight = Math.min(availableSpace - 20, 600); // Max 600px, but respect available space

        setDropdownPosition({
          top,
          left,
          maxHeight: Math.max(calculatedMaxHeight, 300), // Minimum 300px
          width: dropdownWidth,
        });
      }
    }
  };

  // Additional state for advanced features (kept for individual row actions)
  const [showChainModal, setShowChainModal] = useState(false);
  const [chainData, setChainData] = useState<
    (JobDependency & {
      depends_on_job_name?: string;
      depends_on_job_code?: string;
      depth?: number;
      path?: number[];
    })[]
  >([]);
  const [isLoadingChain, setIsLoadingChain] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [statusData, setStatusData] = useState<{
    total_dependencies?: string | number;
    blocking_dependencies?: string | number;
    optional_dependencies?: string | number;
    satisfied_dependencies?: string | number;
    unsatisfied_blocking?: string | number;
    source?: string;
  } | null>(null);
  const [isLoadingStatus, setIsLoadingStatus] = useState(false);
  // Analytics endpoints state (kept for potential future use)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [showGraphModal, setShowGraphModal] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [graphData, setGraphData] = useState<JobDependency[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [isLoadingGraph, setIsLoadingGraph] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [orphanedJobs, setOrphanedJobs] = useState<JobDependency[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [mostDependedJobs, setMostDependedJobs] = useState<JobDependency[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [complexDependencies, setComplexDependencies] = useState<
    JobDependency[]
  >([]);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [selectedJobId, setSelectedJobId] = useState<number | "">("");

  // Modals for the 7 new endpoints
  const [showDependenciesForJobModal, setShowDependenciesForJobModal] =
    useState(false);
  const [dependenciesForJobData, setDependenciesForJobData] = useState<
    JobDependency[]
  >([]);
  const [isLoadingDependenciesForJob, setIsLoadingDependenciesForJob] =
    useState(false);
  const [dependenciesForJobTitle, setDependenciesForJobTitle] = useState("");

  const [showJobsDependingOnModal, setShowJobsDependingOnModal] =
    useState(false);
  const [jobsDependingOnData, setJobsDependingOnData] = useState<
    JobDependency[]
  >([]);
  const [isLoadingJobsDependingOn, setIsLoadingJobsDependingOn] =
    useState(false);
  const [jobsDependingOnTitle, setJobsDependingOnTitle] = useState("");

  const [showBlockingDependenciesModal, setShowBlockingDependenciesModal] =
    useState(false);
  const [blockingDependenciesData, setBlockingDependenciesData] = useState<
    JobDependency[]
  >([]);
  const [isLoadingBlockingDependencies, setIsLoadingBlockingDependencies] =
    useState(false);
  const [blockingDependenciesTitle, setBlockingDependenciesTitle] =
    useState("");

  const [showImmediateDependenciesModal, setShowImmediateDependenciesModal] =
    useState(false);
  const [immediateDependenciesData, setImmediateDependenciesData] = useState<
    number[]
  >([]);
  const [isLoadingImmediateDependencies, setIsLoadingImmediateDependencies] =
    useState(false);
  const [immediateDependenciesTitle, setImmediateDependenciesTitle] =
    useState("");

  const [showAllDependentsModal, setShowAllDependentsModal] = useState(false);
  const [allDependentsData, setAllDependentsData] = useState<number[]>([]);
  const [isLoadingAllDependents, setIsLoadingAllDependents] = useState(false);
  const [allDependentsTitle, setAllDependentsTitle] = useState("");

  const [
    showUnsatisfiedDependenciesModal,
    setShowUnsatisfiedDependenciesModal,
  ] = useState(false);
  const [unsatisfiedDependenciesData, setUnsatisfiedDependenciesData] =
    useState<UnsatisfiedDependency[]>([]);
  const [
    isLoadingUnsatisfiedDependencies,
    setIsLoadingUnsatisfiedDependencies,
  ] = useState(false);
  const [unsatisfiedDependenciesTitle, setUnsatisfiedDependenciesTitle] =
    useState("");

  const [showComplexDependenciesModal, setShowComplexDependenciesModal] =
    useState(false);
  const [complexDependenciesModalData, setComplexDependenciesModalData] =
    useState<JobDependency[]>([]);
  const [isLoadingComplexDependencies, setIsLoadingComplexDependencies] =
    useState(false);

  const fetchDependencies = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      // If Type or Status filters are active, use search endpoint
      const hasQuickFilters =
        dependencyTypeFilter !== "all" || statusFilter !== "all";
      const hasAdvancedFilters =
        filterId ||
        filterJobId ||
        filterDependsOnJobId ||
        filterDependencyType ||
        filterWaitForStatus ||
        filterIsActive !== "" ||
        filterLookbackDaysMin ||
        filterLookbackDaysMax ||
        filterMaxWaitMinutesMin ||
        filterMaxWaitMinutesMax;

      if (hasQuickFilters || hasAdvancedFilters) {
        // Use search endpoint with filters
        const searchParams: JobDependencySearchParams = {
          limit: 100,
          skipCache: true,
        };

        // Add quick filter parameters
        if (dependencyTypeFilter !== "all") {
          searchParams.dependency_type = dependencyTypeFilter as DependencyType;
        }
        if (statusFilter === "active") {
          searchParams.is_active = true;
        } else if (statusFilter === "inactive") {
          searchParams.is_active = false;
        }

        // Add advanced filter parameters
        if (filterId) searchParams.id = Number(filterId);
        if (filterJobId) searchParams.job_id = Number(filterJobId);
        if (filterDependsOnJobId)
          searchParams.depends_on_job_id = Number(filterDependsOnJobId);
        if (filterDependencyType)
          searchParams.dependency_type = filterDependencyType as DependencyType;
        if (filterWaitForStatus)
          searchParams.wait_for_status = filterWaitForStatus as WaitForStatus;
        if (filterIsActive !== "")
          searchParams.is_active = filterIsActive === true;
        if (filterLookbackDaysMin)
          searchParams.lookback_days_min = Number(filterLookbackDaysMin);
        if (filterLookbackDaysMax)
          searchParams.lookback_days_max = Number(filterLookbackDaysMax);
        if (filterMaxWaitMinutesMin)
          searchParams.max_wait_minutes_min = Number(filterMaxWaitMinutesMin);
        if (filterMaxWaitMinutesMax)
          searchParams.max_wait_minutes_max = Number(filterMaxWaitMinutesMax);

        const response = await jobDependencyService.searchJobDependencies(
          searchParams
        );
        setDependencies(response.data || []);
      } else {
        // No filters, use basic list endpoint
        const response = await jobDependencyService.listJobDependencies({
          limit: 100,
          skipCache: true,
          activeOnly: false,
        });
        setDependencies(response.data || []);
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to load job dependencies";
      setLoadError(message);
      showError("Unable to load job dependencies", message);
    } finally {
      setIsLoading(false);
    }
  }, [
    showError,
    dependencyTypeFilter,
    statusFilter,
    filterId,
    filterJobId,
    filterDependsOnJobId,
    filterDependencyType,
    filterWaitForStatus,
    filterIsActive,
    filterLookbackDaysMin,
    filterLookbackDaysMax,
    filterMaxWaitMinutesMin,
    filterMaxWaitMinutesMax,
  ]);

  const searchDependencies = useCallback(
    async (term: string) => {
      setIsSearching(true);
      setLoadError(null);
      try {
        // Build search params with all filters
        const searchParams: JobDependencySearchParams = {
          limit: 100,
          skipCache: true,
        };

        // Add quick filter parameters (Type and Status)
        if (dependencyTypeFilter !== "all") {
          searchParams.dependency_type = dependencyTypeFilter as DependencyType;
        }
        if (statusFilter === "active") {
          searchParams.is_active = true;
        } else if (statusFilter === "inactive") {
          searchParams.is_active = false;
        }

        // Add advanced filter parameters
        if (filterId) searchParams.id = Number(filterId);
        if (filterJobId) searchParams.job_id = Number(filterJobId);
        if (filterDependsOnJobId)
          searchParams.depends_on_job_id = Number(filterDependsOnJobId);
        if (filterDependencyType)
          searchParams.dependency_type = filterDependencyType as DependencyType;
        if (filterWaitForStatus)
          searchParams.wait_for_status = filterWaitForStatus as WaitForStatus;
        if (filterIsActive !== "")
          searchParams.is_active = filterIsActive === true;
        if (filterLookbackDaysMin)
          searchParams.lookback_days_min = Number(filterLookbackDaysMin);
        if (filterLookbackDaysMax)
          searchParams.lookback_days_max = Number(filterLookbackDaysMax);
        if (filterMaxWaitMinutesMin)
          searchParams.max_wait_minutes_min = Number(filterMaxWaitMinutesMin);
        if (filterMaxWaitMinutesMax)
          searchParams.max_wait_minutes_max = Number(filterMaxWaitMinutesMax);

        const response = await jobDependencyService.searchJobDependencies(
          searchParams
        );

        // If there's a search term, filter client-side (text search)
        if (term.trim()) {
          const filtered = (response.data || []).filter(
            (dep) =>
              dep.job_id.toString().includes(term) ||
              dep.depends_on_job_id.toString().includes(term) ||
              dep.dependency_type.toLowerCase().includes(term.toLowerCase()) ||
              dep.wait_for_status.toLowerCase().includes(term.toLowerCase())
          );
          setDependencies(filtered);
        } else {
          setDependencies(response.data || []);
        }
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : "Failed to search job dependencies";
        setLoadError(message);
        showError("Unable to search job dependencies", message);
      } finally {
        setIsSearching(false);
      }
    },
    [
      dependencyTypeFilter,
      statusFilter,
      filterId,
      filterJobId,
      filterDependsOnJobId,
      filterDependencyType,
      filterWaitForStatus,
      filterIsActive,
      filterLookbackDaysMin,
      filterLookbackDaysMax,
      filterMaxWaitMinutesMin,
      filterMaxWaitMinutesMax,
      showError,
    ]
  );

  const fetchStats = useCallback(async () => {
    setIsLoadingStats(true);
    try {
      // Fetch stats from multiple endpoints like ScheduledJobsPage
      const [allDeps, activeDeps, inactiveDeps, blockingDeps, optionalDeps] =
        await Promise.all([
          jobDependencyService
            .listJobDependencies({
              limit: 100,
              skipCache: true,
              activeOnly: false,
            })
            .catch(() => ({ data: [] })),
          jobDependencyService
            .listJobDependencies({
              limit: 100,
              skipCache: true,
              activeOnly: true,
            })
            .catch(() => ({ data: [] })),
          jobDependencyService
            .searchJobDependencies({
              is_active: false,
              limit: 100,
              skipCache: true,
            })
            .catch(() => ({ data: [] })),
          jobDependencyService
            .searchJobDependencies({
              dependency_type: "blocking",
              limit: 100,
              skipCache: true,
            })
            .catch(() => ({ data: [] })),
          jobDependencyService
            .searchJobDependencies({
              dependency_type: "optional",
              limit: 100,
              skipCache: true,
            })
            .catch(() => ({ data: [] })),
        ]);

      const totalDependencies = allDeps.data?.length || 0;
      const activeDependencies = activeDeps.data?.length || 0;
      // Fetch inactive dependencies directly instead of calculating
      const inactiveDependencies = Math.max(0, inactiveDeps.data?.length || 0);
      const blockingDependencies = blockingDeps.data?.length || 0;
      const optionalDependencies = optionalDeps.data?.length || 0;

      setStats({
        totalDependencies,
        activeDependencies,
        inactiveDependencies,
        blockingDependencies,
        optionalDependencies,
      });
    } catch (err) {
      console.error("Failed to load stats:", err);
    } finally {
      setIsLoadingStats(false);
    }
  }, []);

  // Fetch jobs to create a map of job_id -> job_name
  const fetchJobsMap = useCallback(async () => {
    try {
      const response = await scheduledJobService.listScheduledJobs({
        limit: 1000,
        skipCache: true,
      });
      const jobs = response.data || [];
      const map = new Map<number, string>();
      jobs.forEach((job) => {
        map.set(job.id, job.name);
      });
      setJobsMap(map);
    } catch (err) {
      console.error("Failed to load jobs for mapping:", err);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchDependencies();
      fetchJobsMap();
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchDependencies, fetchJobsMap]);

  useEffect(() => {
    if (dependencies.length > 0) {
      fetchStats();
    }
  }, [dependencies.length, fetchStats]);

  // Debounced search - triggers when search term or filters change
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // If there's a search term, use searchDependencies
    // Otherwise, fetchDependencies will handle it (with filters)
    if (searchTerm.trim()) {
      searchTimeoutRef.current = setTimeout(() => {
        searchDependencies(searchTerm);
      }, 500);
    } else {
      // No search term, but filters might have changed - refetch
      const timer = setTimeout(() => {
        fetchDependencies();
      }, 500);
      return () => clearTimeout(timer);
    }

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [
    searchTerm,
    dependencyTypeFilter,
    statusFilter,
    filterId,
    filterJobId,
    filterDependsOnJobId,
    filterDependencyType,
    filterWaitForStatus,
    filterIsActive,
    filterLookbackDaysMin,
    filterLookbackDaysMax,
    filterMaxWaitMinutesMin,
    filterMaxWaitMinutesMax,
    searchDependencies,
    fetchDependencies,
  ]);

  const filteredDependencies = useMemo(() => {
    // Filtering is now done server-side via searchJobDependencies
    // Just sort the results
    return [...dependencies].sort((a, b) => {
      if (a.created_at && b.created_at) {
        return (
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
      }
      return b.id - a.id;
    });
  }, [dependencies]);

  const handleCreate = () => {
    setEditingDependency(null);
    setIsModalOpen(true);
  };

  const handleEdit = async (dependency: JobDependency) => {
    setEditingDependency(dependency);
    setIsModalOpen(true);

    try {
      const freshDependency = await jobDependencyService.getJobDependencyById(
        dependency.id,
        true
      );
      setEditingDependency(freshDependency);
    } catch (err) {
      console.error("Failed to fetch dependency details:", err);
    }
  };

  const handleView = async (dependency: JobDependency) => {
    setViewingDependency(dependency);
    setIsViewModalOpen(true);
    setIsLoadingView(true);

    try {
      const freshDependency = await jobDependencyService.getJobDependencyById(
        dependency.id,
        true
      );
      setViewingDependency(freshDependency);
    } catch (err) {
      console.error("Failed to fetch dependency details:", err);
    } finally {
      setIsLoadingView(false);
    }
  };

  const handleDeleteClick = (dependency: JobDependency) => {
    setDeletingDependency(dependency);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingDependency) return;

    try {
      setIsDeleting(true);
      await jobDependencyService.deleteJobDependency(deletingDependency.id);
      showToast(
        "Job dependency deleted",
        `Dependency ${deletingDependency.id} has been deleted`
      );
      setShowDeleteModal(false);
      setDeletingDependency(null);
      await fetchDependencies();
      await fetchStats();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to delete job dependency";
      showError("Unable to delete job dependency", message);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleModalSubmit = async (values: CreateJobDependencyPayload) => {
    try {
      setIsSaving(true);
      if (editingDependency) {
        const updatePayload: UpdateJobDependencyPayload = {
          dependency_type: values.dependency_type,
          wait_for_status: values.wait_for_status,
          max_wait_minutes: values.max_wait_minutes,
          lookback_days: values.lookback_days,
          is_active: values.is_active,
          userId: values.userId,
        };
        await jobDependencyService.updateJobDependency(
          editingDependency.id,
          updatePayload
        );
        showToast(
          "Job dependency updated",
          `Dependency ${editingDependency.id} has been updated successfully`
        );
      } else {
        await jobDependencyService.createJobDependency(values);
        showToast(
          "Job dependency created",
          "Job dependency has been created successfully"
        );
      }
      setIsModalOpen(false);
      setEditingDependency(null);
      await fetchDependencies();
      await fetchStats();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to save job dependency";
      showError("Unable to save job dependency", message);
      throw err;
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleActive = async (dependency: JobDependency) => {
    try {
      if (dependency.is_active) {
        await jobDependencyService.deactivateDependency(dependency.id);
        showToast(
          "Dependency deactivated",
          `Dependency ${dependency.id} has been deactivated`
        );
      } else {
        await jobDependencyService.activateDependency(dependency.id);
        showToast(
          "Dependency activated",
          `Dependency ${dependency.id} has been activated`
        );
      }
      await fetchDependencies();
      await fetchStats();
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Failed to toggle dependency status";
      showError("Unable to toggle dependency", message);
    }
  };

  // Handler for getDependenciesForJob
  const handleGetDependenciesForJob = async (jobId: number) => {
    setIsLoadingDependenciesForJob(true);
    setShowDependenciesForJobModal(true);
    setDependenciesForJobTitle(`Dependencies for Job ${jobId}`);
    try {
      const response = await jobDependencyService.getDependenciesForJob(jobId, {
        limit: 100,
        skipCache: true,
        activeOnly: false,
      });
      setDependenciesForJobData(response.data || []);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to load dependencies";
      showError("Unable to load dependencies", message);
      setShowDependenciesForJobModal(false);
    } finally {
      setIsLoadingDependenciesForJob(false);
    }
  };

  // Handler for getJobsDependingOn
  const handleGetJobsDependingOn = async (dependsOnJobId: number) => {
    setIsLoadingJobsDependingOn(true);
    setShowJobsDependingOnModal(true);
    setJobsDependingOnTitle(`Jobs Depending On Job ${dependsOnJobId}`);
    try {
      const response = await jobDependencyService.getJobsDependingOn(
        dependsOnJobId,
        {
          limit: 100,
          skipCache: true,
          activeOnly: false,
        }
      );
      setJobsDependingOnData(response.data || []);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to load dependencies";
      showError("Unable to load dependencies", message);
      setShowJobsDependingOnModal(false);
    } finally {
      setIsLoadingJobsDependingOn(false);
    }
  };

  // Handler for getSpecificDependency
  const handleGetSpecificDependency = async (
    jobId: number,
    dependsOnJobId: number
  ) => {
    try {
      const dependency = await jobDependencyService.getSpecificDependency(
        jobId,
        dependsOnJobId,
        true
      );
      setViewingDependency(dependency);
      setIsViewModalOpen(true);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to load dependency";
      showError("Unable to load dependency", message);
    }
  };

  // Handler for getBlockingDependencies
  const handleGetBlockingDependencies = async (jobId: number) => {
    setIsLoadingBlockingDependencies(true);
    setShowBlockingDependenciesModal(true);
    setBlockingDependenciesTitle(`Blocking Dependencies for Job ${jobId}`);
    try {
      const response = await jobDependencyService.getBlockingDependencies(
        jobId,
        {
          limit: 100,
          skipCache: true,
        }
      );
      setBlockingDependenciesData(response.data || []);
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Failed to load blocking dependencies";
      showError("Unable to load blocking dependencies", message);
      setShowBlockingDependenciesModal(false);
    } finally {
      setIsLoadingBlockingDependencies(false);
    }
  };

  // Handler for getDependencyChain
  const handleGetDependencyChain = async (jobId: number) => {
    setIsLoadingChain(true);
    setShowChainModal(true);
    try {
      const response = await jobDependencyService.getDependencyChain(
        jobId,
        true
      );
      // Chain data returns JobDependency[] with additional fields
      setChainData(
        (response.data || []) as unknown as (JobDependency & {
          depends_on_job_name?: string;
          depends_on_job_code?: string;
          depth?: number;
          path?: number[];
        })[]
      );
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to load dependency chain";
      showError("Unable to load dependency chain", message);
      setShowChainModal(false);
    } finally {
      setIsLoadingChain(false);
    }
  };

  // Handler for getCriticalPath
  const handleGetCriticalPath = async (jobId: number) => {
    setIsLoadingChain(true);
    setShowChainModal(true);
    try {
      const response = await jobDependencyService.getCriticalPath(jobId, true);
      // CriticalPathItem has different structure, convert if needed
      setChainData(
        (response.data || []) as unknown as (JobDependency & {
          depends_on_job_name?: string;
          depends_on_job_code?: string;
          depth?: number;
          path?: number[];
        })[]
      );
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to load critical path";
      showError("Unable to load critical path", message);
      setShowChainModal(false);
    } finally {
      setIsLoadingChain(false);
    }
  };

  // Handler for getImmediateDependencies
  const handleGetImmediateDependencies = async (jobId: number) => {
    setIsLoadingImmediateDependencies(true);
    setShowImmediateDependenciesModal(true);
    setImmediateDependenciesTitle(`Immediate Dependencies for Job ${jobId}`);
    try {
      const response = await jobDependencyService.getImmediateDependencies(
        jobId,
        true
      );
      // Response structure: {success: true, data: {jobIds: [20]}, ...}
      const responseData = response.data as unknown as { jobIds?: number[] };
      const jobIds = responseData?.jobIds || [];
      setImmediateDependenciesData(Array.isArray(jobIds) ? jobIds : []);
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Failed to load immediate dependencies";
      showError("Unable to load immediate dependencies", message);
      setShowImmediateDependenciesModal(false);
    } finally {
      setIsLoadingImmediateDependencies(false);
    }
  };

  // Handler for getAllDependents
  const handleGetAllDependents = async (jobId: number) => {
    setIsLoadingAllDependents(true);
    setShowAllDependentsModal(true);
    setAllDependentsTitle(`All Dependents for Job ${jobId}`);
    try {
      const response = await jobDependencyService.getAllDependents(jobId, true);
      setAllDependentsData(response.data?.jobIds || []);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to load dependents";
      showError("Unable to load dependents", message);
      setShowAllDependentsModal(false);
    } finally {
      setIsLoadingAllDependents(false);
    }
  };

  // Handler for checkDependenciesSatisfied
  const handleCheckDependenciesSatisfied = async (jobId: number) => {
    try {
      const response = await jobDependencyService.checkDependenciesSatisfied(
        jobId,
        true
      );
      const isSatisfied = response.data?.satisfied;

      if (isSatisfied) {
        showToast(
          "All Dependencies Satisfied",
          "This job can proceed with execution as all its dependencies have been completed successfully."
        );
      } else {
        showError(
          "Dependencies Not Satisfied",
          "This job cannot proceed yet. One or more dependencies have not been satisfied (not completed successfully)."
        );
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to check dependencies";
      showError("Unable to check dependencies", message);
    }
  };

  // Handler for getUnsatisfiedDependencies
  const handleGetUnsatisfiedDependencies = async (jobId: number) => {
    setIsLoadingUnsatisfiedDependencies(true);
    setShowUnsatisfiedDependenciesModal(true);
    setUnsatisfiedDependenciesTitle(
      `Unsatisfied Dependencies for Job ${jobId}`
    );
    try {
      const response = await jobDependencyService.getUnsatisfiedDependencies(
        jobId,
        true
      );
      setUnsatisfiedDependenciesData(response.data || []);
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Failed to load unsatisfied dependencies";
      showError("Unable to load unsatisfied dependencies", message);
      setShowUnsatisfiedDependenciesModal(false);
    } finally {
      setIsLoadingUnsatisfiedDependencies(false);
    }
  };

  // Handler for getDependencyStatus
  const handleGetDependencyStatus = async (jobId: number) => {
    setIsLoadingStatus(true);
    setShowStatusModal(true);
    try {
      const response = await jobDependencyService.getDependencyStatus(
        jobId,
        true
      );
      console.log("🔵 DEPENDENCY STATUS - Response:", response);
      console.log("Response.data:", response.data);

      // Response.data is an object with summary statistics, not an array
      setStatusData(
        (response.data as {
          total_dependencies?: string | number;
          blocking_dependencies?: string | number;
          optional_dependencies?: string | number;
          satisfied_dependencies?: string | number;
          unsatisfied_blocking?: string | number;
          source?: string;
        }) || null
      );
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to load dependency status";
      showError("Unable to load dependency status", message);
      setShowStatusModal(false);
    } finally {
      setIsLoadingStatus(false);
    }
  };

  // Bulk selection handlers
  const handleSelectAll = () => {
    if (selectedDependencyIds.size === filteredDependencies.length) {
      setSelectedDependencyIds(new Set());
    } else {
      setSelectedDependencyIds(
        new Set(filteredDependencies.map((dep) => dep.id))
      );
    }
  };

  const handleToggleSelection = (dependencyId: number) => {
    const newSelection = new Set(selectedDependencyIds);
    if (newSelection.has(dependencyId)) {
      newSelection.delete(dependencyId);
    } else {
      newSelection.add(dependencyId);
    }
    setSelectedDependencyIds(newSelection);
  };

  // Handler for batchActivateDependencies
  const handleBatchActivate = async () => {
    if (selectedDependencyIds.size === 0) return;
    try {
      const response = await jobDependencyService.batchActivateDependencies({
        dependency_ids: Array.from(selectedDependencyIds),
      });
      showToast(
        "Dependencies activated",
        `${response.data?.activated || 0} dependencies activated`
      );
      setSelectedDependencyIds(new Set());
      setIsSelectionMode(false);
      await fetchDependencies();
      await fetchStats();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to activate dependencies";
      showError("Unable to activate dependencies", message);
    }
  };

  // Handler for batchDeactivateDependencies
  const handleBatchDeactivate = async () => {
    if (selectedDependencyIds.size === 0) return;
    try {
      const response = await jobDependencyService.batchDeactivateDependencies({
        dependency_ids: Array.from(selectedDependencyIds),
      });
      showToast(
        "Dependencies deactivated",
        `${response.data?.deactivated || 0} dependencies deactivated`
      );
      setSelectedDependencyIds(new Set());
      setIsSelectionMode(false);
      await fetchDependencies();
      await fetchStats();
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Failed to deactivate dependencies";
      showError("Unable to deactivate dependencies", message);
    }
  };

  // Handler for getDependencyGraph (Analytics)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleGetDependencyGraph = async () => {
    setIsLoadingGraph(true);
    setShowGraphModal(true);
    try {
      const response = await jobDependencyService.getDependencyGraph(true);
      // Graph data returns DependencyGraphNode[], not JobDependency[]
      setGraphData((response.data || []) as unknown as JobDependency[]);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to load dependency graph";
      showError("Unable to load dependency graph", message);
      setShowGraphModal(false);
    } finally {
      setIsLoadingGraph(false);
    }
  };

  // Handler for getOrphanedJobs (Analytics)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleGetOrphanedJobs = async () => {
    try {
      const response = await jobDependencyService.getOrphanedJobs(true);
      // Orphaned jobs returns OrphanedJob[], not JobDependency[]
      setOrphanedJobs((response.data || []) as unknown as JobDependency[]);
      showToast(
        "Orphaned jobs loaded",
        `Found ${response.data?.length || 0} orphaned jobs`
      );
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to load orphaned jobs";
      showError("Unable to load orphaned jobs", message);
    }
  };

  // Handler for getMostDependedOnJobs (Analytics)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleGetMostDependedOnJobs = async () => {
    try {
      const response = await jobDependencyService.getMostDependedOnJobs(
        10,
        true
      );
      // Most depended jobs returns MostDependedJob[], not JobDependency[]
      setMostDependedJobs((response.data || []) as unknown as JobDependency[]);
      showToast(
        "Most depended jobs loaded",
        "Loaded top 10 most depended-on jobs"
      );
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Failed to load most depended jobs";
      showError("Unable to load most depended jobs", message);
    }
  };

  // Handler for getComplexDependencies (Analytics)
  const handleGetComplexDependencies = async () => {
    setIsLoadingComplexDependencies(true);
    setShowComplexDependenciesModal(true);
    try {
      const response = await jobDependencyService.getComplexDependencies(true);
      setComplexDependenciesModalData(response.data || []);
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Failed to load complex dependencies";
      showError("Unable to load complex dependencies", message);
      setShowComplexDependenciesModal(false);
    } finally {
      setIsLoadingComplexDependencies(false);
    }
  };

  // Handler for deleteAllDependenciesForJob
  const handleDeleteAllForJobClick = (jobId: number) => {
    setDeletingAllJobId(jobId);
    setShowDeleteAllModal(true);
  };

  const handleDeleteAllConfirm = async () => {
    if (!deletingAllJobId) return;

    try {
      setIsDeletingAll(true);
      const response = await jobDependencyService.deleteAllDependenciesForJob(
        deletingAllJobId
      );
      showToast(
        "Dependencies deleted",
        `${
          response.data?.removed || 0
        } dependencies removed for Job ${deletingAllJobId}`
      );
      setShowDeleteAllModal(false);
      setDeletingAllJobId(null);
      await fetchDependencies();
      await fetchStats();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to delete dependencies";
      showError("Unable to delete dependencies", message);
    } finally {
      setIsDeletingAll(false);
    }
  };

  const IconComponent = Link2;

  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
        <div>
          <h1 className={`text-xl sm:text-2xl font-bold ${tw.textPrimary}`}>
            Job Dependencies
          </h1>
          <p className={`${tw.textSecondary} mt-2 text-sm`}>
            Manage relationships between scheduled jobs to control execution
            order.
          </p>
        </div>
        <div className="flex flex-wrap justify-end gap-2">
          <button
            onClick={() => {
              if (!isSelectionMode) {
                setIsSelectionMode(true);
                setSelectedDependencyIds(
                  new Set(filteredDependencies.map((dep) => dep.id))
                );
              } else {
                setIsSelectionMode(false);
                setSelectedDependencyIds(new Set());
              }
            }}
            className="px-4 py-2 rounded-md font-semibold flex items-center gap-2 text-sm transition-colors"
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
            <span className="hidden sm:inline">
              {isSelectionMode ? "Exit Selection" : "Select Dependencies"}
            </span>
            <span className="sm:hidden">
              {isSelectionMode ? "Exit" : "Select"}
            </span>
          </button>
          <button
            onClick={() => navigate("/dashboard/job-dependencies/analytics")}
            className="inline-flex items-center gap-2 rounded-md px-3 sm:px-4 py-2 text-sm font-medium focus:outline-none transition-colors"
            style={{
              backgroundColor: "transparent",
              color: color.primary.action,
              border: `1px solid ${color.primary.action}`,
            }}
          >
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">Analytics</span>
          </button>
          <button
            onClick={handleCreate}
            className="px-3 sm:px-4 py-2 rounded-md font-semibold flex items-center gap-2 text-sm text-white"
            style={{ backgroundColor: color.primary.action }}
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Create Dependency</span>
            <span className="sm:hidden">Create</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <div className="rounded-md border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2">
            <Link2
              className="h-5 w-5"
              style={{ color: color.primary.accent }}
            />
            <p className="text-sm font-medium text-gray-600">
              Total Dependencies
            </p>
          </div>
          <p className="mt-2 text-3xl font-bold text-gray-900">
            {isLoadingStats ? "..." : stats.totalDependencies}
          </p>
        </div>
        <div className="rounded-md border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2">
            <CheckCircle
              className="h-5 w-5"
              style={{ color: color.primary.accent }}
            />
            <p className="text-sm font-medium text-gray-600">
              Active Dependencies
            </p>
          </div>
          <p className="mt-2 text-3xl font-bold text-gray-900">
            {isLoadingStats ? "..." : stats.activeDependencies}
          </p>
        </div>
        <div className="rounded-md border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2">
            <XCircle
              className="h-5 w-5"
              style={{ color: color.primary.accent }}
            />
            <p className="text-sm font-medium text-gray-600">
              Inactive Dependencies
            </p>
          </div>
          <p className="mt-2 text-3xl font-bold text-gray-900">
            {isLoadingStats ? "..." : stats.inactiveDependencies}
          </p>
        </div>
        <div className="rounded-md border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2">
            <Link2
              className="h-5 w-5"
              style={{ color: color.primary.accent }}
            />
            <p className="text-sm font-medium text-gray-600">
              Blocking Dependencies
            </p>
          </div>
          <p className="mt-2 text-3xl font-bold text-gray-900">
            {isLoadingStats ? "..." : stats.blockingDependencies}
          </p>
        </div>
        <div className="rounded-md border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2">
            <Link2
              className="h-5 w-5"
              style={{ color: color.primary.accent }}
            />
            <p className="text-sm font-medium text-gray-600">
              Optional Dependencies
            </p>
          </div>
          <p className="mt-2 text-3xl font-bold text-gray-900">
            {isLoadingStats ? "..." : stats.optionalDependencies}
          </p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col gap-3 md:flex-row md:gap-4">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by job ID, dependency type, or status..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-md border border-gray-200 py-3 pl-10 pr-4 text-sm shadow-sm focus:border-[#3b8169] focus:outline-none focus:ring-1 focus:ring-[#3b8169]"
          />
          {isSearching && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-[#3b8169]"></div>
            </div>
          )}
        </div>
        <div className="flex flex-col gap-3 md:flex-row md:gap-4">
          <HeadlessSelect
            options={[
              { value: "all", label: "All Types" },
              { value: "blocking", label: "Blocking" },
              { value: "optional", label: "Optional" },
              { value: "cross_day", label: "Cross Day" },
              { value: "conditional", label: "Conditional" },
            ]}
            value={dependencyTypeFilter}
            onChange={(value) => setDependencyTypeFilter(value as string)}
            placeholder="Filter by type"
            className="w-full md:w-auto md:min-w-[180px]"
          />
          <HeadlessSelect
            options={[
              { value: "all", label: "All Status" },
              { value: "active", label: "Active" },
              { value: "inactive", label: "Inactive" },
            ]}
            value={statusFilter}
            onChange={(value) => setStatusFilter(value as string)}
            placeholder="Filter by status"
            className="w-full md:w-auto md:min-w-[180px]"
          />
          <button
            onClick={() => setShowAdvancedFilters(true)}
            className="inline-flex items-center justify-center gap-2 rounded-md bg-white border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 whitespace-nowrap"
          >
            <Filter className="h-4 w-4" />
            <span>Filters</span>
            {(filterId ||
              filterJobId ||
              filterDependsOnJobId ||
              filterDependencyType ||
              filterWaitForStatus ||
              filterIsActive !== "" ||
              filterLookbackDaysMin ||
              filterLookbackDaysMax ||
              filterMaxWaitMinutesMin ||
              filterMaxWaitMinutesMax) && (
              <span className="ml-1 inline-flex items-center rounded-full bg-white/20 px-2 py-0.5 text-xs font-medium">
                Active
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Batch Actions Toolbar */}
      {isSelectionMode && selectedDependencyIds.size > 0 && (
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 rounded-md border border-gray-200 bg-white px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">
              {selectedDependencyIds.size} dependency(ies) selected
            </span>
            <button
              onClick={() => setSelectedDependencyIds(new Set())}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleBatchActivate}
              className="inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-semibold text-white"
              style={{ backgroundColor: color.primary.action }}
            >
              <CheckCircle className="h-4 w-4" />
              Activate
            </button>
            <button
              onClick={handleBatchDeactivate}
              className="inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium"
              style={{
                backgroundColor: "transparent",
                color: color.primary.action,
                border: `1px solid ${color.primary.action}`,
              }}
            >
              <XCircle className="h-4 w-4" />
              Deactivate
            </button>
          </div>
        </div>
      )}

      <div className="rounded-md">
        {loadError && (
          <div className="border-b border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            {loadError}
          </div>
        )}

        {isLoading ? (
          <div className="flex justify-center py-16">
            <LoadingSpinner />
          </div>
        ) : filteredDependencies.length === 0 ? (
          <div className="text-center py-12">
            <IconComponent className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className={`text-lg font-medium ${tw.textPrimary} mb-2`}>
              {searchTerm ? "No Dependencies Found" : "No Job Dependencies"}
            </h3>
            <p className={`${tw.textSecondary} mb-6`}>
              {searchTerm
                ? "Try adjusting your search terms."
                : "Create your first job dependency to get started."}
            </p>
            {!searchTerm && (
              <button
                onClick={handleCreate}
                className="px-4 py-2 rounded-md font-semibold flex items-center gap-2 mx-auto text-sm text-white"
                style={{ backgroundColor: color.primary.action }}
              >
                <Plus className="w-4 h-4" />
                Create Dependency
              </button>
            )}
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
                      className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-medium uppercase tracking-wider whitespace-nowrap"
                      style={{
                        color: color.surface.tableHeaderText,
                        backgroundColor: color.surface.tableHeader,
                        borderTopLeftRadius: "0.375rem",
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={
                          filteredDependencies.length > 0 &&
                          selectedDependencyIds.size ===
                            filteredDependencies.length
                        }
                        onChange={handleSelectAll}
                        className="rounded border-gray-300 text-[#3b8169] focus:ring-[#3b8169]"
                      />
                    </th>
                  )}
                  {/* <th
                    className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider"
                    style={{
                      color: color.surface.tableHeaderText,
                      backgroundColor: color.surface.tableHeader,
                      ...(!isSelectionMode && {
                        borderTopLeftRadius: "0.375rem",
                      }),
                    }}
                  >
                    Job ID
                  </th> */}
                  <th
                    className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider whitespace-nowrap"
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
                  {/* <th
                    className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider"
                    style={{
                      color: color.surface.tableHeaderText,
                      backgroundColor: color.surface.tableHeader,
                    }}
                  >
                    Depends On Job ID
                  </th> */}
                  <th
                    className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider whitespace-nowrap"
                    style={{
                      color: color.surface.tableHeaderText,
                      backgroundColor: color.surface.tableHeader,
                    }}
                  >
                    Depends On Job Name
                  </th>
                  <th
                    className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider whitespace-nowrap"
                    style={{
                      color: color.surface.tableHeaderText,
                      backgroundColor: color.surface.tableHeader,
                    }}
                  >
                    Type
                  </th>
                  <th
                    className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider whitespace-nowrap"
                    style={{
                      color: color.surface.tableHeaderText,
                      backgroundColor: color.surface.tableHeader,
                    }}
                  >
                    Wait For
                  </th>
                  <th
                    className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider whitespace-nowrap"
                    style={{
                      color: color.surface.tableHeaderText,
                      backgroundColor: color.surface.tableHeader,
                    }}
                  >
                    Status
                  </th>
                  <th
                    className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider whitespace-nowrap"
                    style={{
                      color: color.surface.tableHeaderText,
                      backgroundColor: color.surface.tableHeader,
                    }}
                  >
                    Created
                  </th>
                  <th
                    className="px-6 py-4 text-right text-xs font-medium uppercase tracking-wider whitespace-nowrap"
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
                {filteredDependencies.map((dependency) => (
                  <tr key={dependency.id} className="transition-colors">
                    {isSelectionMode && (
                      <td
                        className="px-3 sm:px-6 py-3 sm:py-4"
                        style={{
                          backgroundColor: color.surface.tablebodybg,
                          borderTopLeftRadius: "0.375rem",
                          borderBottomLeftRadius: "0.375rem",
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={selectedDependencyIds.has(dependency.id)}
                          onChange={() => handleToggleSelection(dependency.id)}
                          className="rounded border-gray-300 text-[#3b8169] focus:ring-[#3b8169]"
                        />
                      </td>
                    )}
                    {/* <td
                      className="px-6 py-4 whitespace-nowrap"
                      style={{
                        backgroundColor: color.surface.tablebodybg,
                        ...(!isSelectionMode && {
                          borderTopLeftRadius: "0.375rem",
                          borderBottomLeftRadius: "0.375rem",
                        }),
                      }}
                    >
                      <span className="text-sm text-gray-900 font-medium">
                        {dependency.job_id}
                      </span>
                    </td> */}
                    <td
                      className="px-6 py-4 whitespace-nowrap"
                      style={{
                        backgroundColor: color.surface.tablebodybg,
                        ...(!isSelectionMode && {
                          borderTopLeftRadius: "0.375rem",
                          borderBottomLeftRadius: "0.375rem",
                        }),
                      }}
                    >
                      <span className="text-sm text-gray-900">
                        {jobsMap.get(dependency.job_id) || "Unknown Job"}
                      </span>
                    </td>
                    {/* <td
                      className="px-6 py-4 whitespace-nowrap"
                      style={{ backgroundColor: color.surface.tablebodybg }}
                    >
                      <span className="text-sm text-gray-900 font-medium">
                        {dependency.depends_on_job_id}
                      </span>
                    </td> */}
                    <td
                      className="px-6 py-4 whitespace-nowrap"
                      style={{ backgroundColor: color.surface.tablebodybg }}
                    >
                      <span className="text-sm text-gray-900">
                        {jobsMap.get(dependency.depends_on_job_id) ||
                          "Unknown Job"}
                      </span>
                    </td>
                    <td
                      className="px-6 py-4 whitespace-nowrap"
                      style={{ backgroundColor: color.surface.tablebodybg }}
                    >
                      <span className="text-sm text-gray-900 capitalize">
                        {dependency.dependency_type}
                      </span>
                    </td>
                    <td
                      className="px-6 py-4 whitespace-nowrap"
                      style={{ backgroundColor: color.surface.tablebodybg }}
                    >
                      <span className="text-sm text-gray-900 capitalize">
                        {dependency.wait_for_status}
                      </span>
                    </td>
                    <td
                      className="px-6 py-4 whitespace-nowrap"
                      style={{ backgroundColor: color.surface.tablebodybg }}
                    >
                      <span className="text-sm text-black capitalize">
                        {dependency.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td
                      className="px-6 py-4 whitespace-nowrap"
                      style={{ backgroundColor: color.surface.tablebodybg }}
                    >
                      <span className="text-sm text-gray-600">
                        <DateFormatter date={dependency.created_at} />
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
                          onClick={() => handleView(dependency)}
                          className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                          aria-label="View dependency"
                          title="View"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleEdit(dependency)}
                          className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                          aria-label="Edit dependency"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(dependency)}
                          className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors"
                          aria-label="Delete dependency"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <div
                          className="relative"
                          ref={(el) => {
                            actionMenuRefs.current[dependency.id] = el;
                          }}
                        >
                          <button
                            onClick={(e) =>
                              handleActionMenuToggle(dependency.id, e)
                            }
                            className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                            aria-label="More actions"
                            title="More"
                          >
                            <MoreHorizontal className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}

                {/* Render dropdown menus via portal outside the table */}
                {filteredDependencies.map((dependency) => {
                  if (showActionMenu === dependency.id && dropdownPosition) {
                    return createPortal(
                      <div
                        ref={(el) => {
                          dropdownMenuRefs.current[dependency.id] = el;
                        }}
                        className="fixed bg-white border border-gray-200 rounded-md shadow-xl py-3"
                        style={{
                          zIndex: 99999,
                          top: `${dropdownPosition.top}px`,
                          left: `${dropdownPosition.left}px`,
                          width: `${dropdownPosition.width || 256}px`,
                          maxHeight: `${dropdownPosition.maxHeight}px`,
                          overflowY: "auto",
                          overflowX: "hidden",
                          overscrollBehavior: "contain",
                        }}
                        onClick={(e) => e.stopPropagation()}
                        onMouseDown={(e) => e.stopPropagation()}
                      >
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleActive(dependency);
                            setShowActionMenu(null);
                          }}
                          className="w-full flex items-center px-4 py-3 text-sm text-black"
                        >
                          {dependency.is_active ? (
                            <XCircle className="w-4 h-4 mr-4 flex-shrink-0" />
                          ) : (
                            <CheckCircle className="w-4 h-4 mr-4 flex-shrink-0" />
                          )}
                          <span className="truncate">
                            {dependency.is_active
                              ? "Deactivate Dependency"
                              : "Activate Dependency"}
                          </span>
                        </button>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleGetDependencyChain(dependency.job_id);
                            setShowActionMenu(null);
                          }}
                          className="w-full flex items-center px-4 py-3 text-sm text-black"
                        >
                          <Link2 className="w-4 h-4 mr-4 flex-shrink-0" />
                          <span className="truncate">
                            View Dependency Chain
                          </span>
                        </button>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCheckDependenciesSatisfied(dependency.job_id);
                            setShowActionMenu(null);
                          }}
                          className="w-full flex items-center px-4 py-3 text-sm text-black"
                        >
                          <CheckCircle className="w-4 h-4 mr-4 flex-shrink-0" />
                          <span className="truncate">
                            Check Dependencies Satisfied
                          </span>
                        </button>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleGetDependencyStatus(dependency.job_id);
                            setShowActionMenu(null);
                          }}
                          className="w-full flex items-center px-4 py-3 text-sm text-black"
                        >
                          <Filter className="w-4 h-4 mr-4 flex-shrink-0" />
                          <span className="truncate">
                            View Dependency Status
                          </span>
                        </button>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleGetDependenciesForJob(dependency.job_id);
                            setShowActionMenu(null);
                          }}
                          className="w-full flex items-center px-4 py-3 text-sm text-black"
                        >
                          <Link2 className="w-4 h-4 mr-4 flex-shrink-0" />
                          <span className="truncate">
                            Get Dependencies For Job
                          </span>
                        </button>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleGetJobsDependingOn(
                              dependency.depends_on_job_id
                            );
                            setShowActionMenu(null);
                          }}
                          className="w-full flex items-center px-4 py-3 text-sm text-black"
                        >
                          <Link2 className="w-4 h-4 mr-4 flex-shrink-0" />
                          <span className="truncate">
                            Get Jobs Depending On
                          </span>
                        </button>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleGetSpecificDependency(
                              dependency.job_id,
                              dependency.depends_on_job_id
                            );
                            setShowActionMenu(null);
                          }}
                          className="w-full flex items-center px-4 py-3 text-sm text-black"
                        >
                          <Eye className="w-4 h-4 mr-4 flex-shrink-0" />
                          <span className="truncate">
                            Get Specific Dependency
                          </span>
                        </button>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleGetBlockingDependencies(dependency.job_id);
                            setShowActionMenu(null);
                          }}
                          className="w-full flex items-center px-4 py-3 text-sm text-black"
                        >
                          <AlertTriangle className="w-4 h-4 mr-4 flex-shrink-0" />
                          <span className="truncate">
                            Get Blocking Dependencies
                          </span>
                        </button>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleGetCriticalPath(dependency.job_id);
                            setShowActionMenu(null);
                          }}
                          className="w-full flex items-center px-4 py-3 text-sm text-black"
                        >
                          <Link2 className="w-4 h-4 mr-4 flex-shrink-0" />
                          <span className="truncate">Get Critical Path</span>
                        </button>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleGetImmediateDependencies(dependency.job_id);
                            setShowActionMenu(null);
                          }}
                          className="w-full flex items-center px-4 py-3 text-sm text-black"
                        >
                          <Link2 className="w-4 h-4 mr-4 flex-shrink-0" />
                          <span className="truncate">
                            Get Immediate Dependencies
                          </span>
                        </button>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleGetAllDependents(dependency.job_id);
                            setShowActionMenu(null);
                          }}
                          className="w-full flex items-center px-4 py-3 text-sm text-black"
                        >
                          <Link2 className="w-4 h-4 mr-4 flex-shrink-0" />
                          <span className="truncate">Get All Dependents</span>
                        </button>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleGetUnsatisfiedDependencies(dependency.job_id);
                            setShowActionMenu(null);
                          }}
                          className="w-full flex items-center px-4 py-3 text-sm text-black"
                        >
                          <XCircle className="w-4 h-4 mr-4 flex-shrink-0" />
                          <span className="truncate">
                            Get Unsatisfied Dependencies
                          </span>
                        </button>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleGetComplexDependencies();
                            setShowActionMenu(null);
                          }}
                          className="w-full flex items-center px-4 py-3 text-sm text-black"
                        >
                          <Link2 className="w-4 h-4 mr-4 flex-shrink-0" />
                          <span className="truncate">
                            Get Complex Dependencies
                          </span>
                        </button>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteAllForJobClick(dependency.job_id);
                            setShowActionMenu(null);
                          }}
                          className="w-full flex items-center px-4 py-3 text-sm text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4 mr-4 flex-shrink-0" />
                          <span className="truncate">
                            Delete All Dependencies
                          </span>
                        </button>
                      </div>,
                      document.body
                    );
                  }
                  return null;
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Chain/Path Modal */}
      {showChainModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-2 sm:p-4">
          <div className="w-full max-w-6xl rounded-xl bg-white p-4 sm:p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  Dependency Chain
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  Shows all dependencies for this job. Click on job names to
                  view their details.
                </p>
              </div>
              <button
                onClick={() => setShowChainModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            {isLoadingChain ? (
              <div className="flex justify-center py-8">
                <LoadingSpinner />
              </div>
            ) : chainData.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">
                  No dependencies found for this job
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
                <table
                  className="w-full min-w-[800px]"
                  style={{ borderCollapse: "separate", borderSpacing: "0 8px" }}
                >
                  <thead>
                    <tr>
                      <th
                        className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider whitespace-nowrap"
                        style={{
                          color: color.surface.tableHeaderText,
                          backgroundColor: color.surface.tableHeader,
                          borderTopLeftRadius: "0.375rem",
                        }}
                      >
                        Dependent Job
                      </th>
                      <th
                        className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider whitespace-nowrap"
                        style={{
                          color: color.surface.tableHeaderText,
                          backgroundColor: color.surface.tableHeader,
                        }}
                      >
                        Depends On Job
                      </th>
                      <th
                        className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider whitespace-nowrap"
                        style={{
                          color: color.surface.tableHeaderText,
                          backgroundColor: color.surface.tableHeader,
                        }}
                      >
                        Dependency Type
                      </th>
                      <th
                        className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider whitespace-nowrap"
                        style={{
                          color: color.surface.tableHeaderText,
                          backgroundColor: color.surface.tableHeader,
                        }}
                      >
                        Wait For Status
                      </th>
                      <th
                        className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider whitespace-nowrap"
                        style={{
                          color: color.surface.tableHeaderText,
                          backgroundColor: color.surface.tableHeader,
                        }}
                      >
                        Depth
                      </th>
                      <th
                        className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider whitespace-nowrap"
                        style={{
                          color: color.surface.tableHeaderText,
                          backgroundColor: color.surface.tableHeader,
                          borderTopRightRadius: "0.375rem",
                        }}
                      >
                        Lookback Days
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {chainData.map((item, idx) => (
                      <tr key={item.id || idx} className="transition-colors">
                        <td
                          className="px-6 py-4 whitespace-nowrap"
                          style={{
                            backgroundColor: color.surface.tablebodybg,
                            borderTopLeftRadius: "0.375rem",
                            borderBottomLeftRadius: "0.375rem",
                          }}
                        >
                          <button
                            onClick={() => {
                              navigate(
                                `/dashboard/scheduled-jobs/${item.job_id}`
                              );
                              setShowChainModal(false);
                            }}
                            className="text-sm font-semibold text-gray-900 hover:underline transition-colors"
                            style={{
                              color: "inherit",
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.color =
                                color.primary.accent;
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.color = "";
                            }}
                          >
                            {jobsMap.get(item.job_id) || `Job ${item.job_id}`}
                          </button>
                          <div className="text-xs text-gray-500 mt-1">
                            ID: {item.job_id}
                          </div>
                        </td>
                        <td
                          className="px-6 py-4 whitespace-nowrap"
                          style={{ backgroundColor: color.surface.tablebodybg }}
                        >
                          <button
                            onClick={() => {
                              navigate(
                                `/dashboard/scheduled-jobs/${item.depends_on_job_id}`
                              );
                              setShowChainModal(false);
                            }}
                            className="text-sm font-semibold text-gray-900 hover:underline transition-colors"
                            style={{
                              color: "inherit",
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.color =
                                color.primary.accent;
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.color = "";
                            }}
                          >
                            {item.depends_on_job_name ||
                              `Job ${item.depends_on_job_id}`}
                          </button>
                          <div className="text-xs text-gray-500 mt-1">
                            {item.depends_on_job_code &&
                              `Code: ${item.depends_on_job_code} • `}
                            ID: {item.depends_on_job_id}
                          </div>
                        </td>
                        <td
                          className="px-6 py-4 whitespace-nowrap"
                          style={{ backgroundColor: color.surface.tablebodybg }}
                        >
                          <span className="text-sm text-gray-900 capitalize">
                            {item.dependency_type}
                          </span>
                        </td>
                        <td
                          className="px-6 py-4 whitespace-nowrap"
                          style={{ backgroundColor: color.surface.tablebodybg }}
                        >
                          <span className="text-sm text-gray-900 capitalize">
                            {item.wait_for_status}
                          </span>
                        </td>
                        <td
                          className="px-6 py-4 whitespace-nowrap"
                          style={{ backgroundColor: color.surface.tablebodybg }}
                        >
                          <span className="text-sm text-gray-900">
                            {(item as { depth?: number }).depth ?? 0}
                          </span>
                        </td>
                        <td
                          className="px-6 py-4 whitespace-nowrap"
                          style={{
                            backgroundColor: color.surface.tablebodybg,
                            borderTopRightRadius: "0.375rem",
                            borderBottomRightRadius: "0.375rem",
                          }}
                        >
                          <span className="text-sm text-gray-900">
                            {item.lookback_days || 0}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Status Modal */}
      {showStatusModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-2 sm:p-4">
          <div className="w-full max-w-4xl rounded-xl bg-white p-4 sm:p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  Dependency Status
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  Summary statistics of all dependencies for this job
                </p>
              </div>
              <button
                onClick={() => setShowStatusModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            {isLoadingStatus ? (
              <div className="flex justify-center py-8">
                <LoadingSpinner />
              </div>
            ) : (
              <div className="space-y-6">
                {statusData ? (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                      <div className="rounded-md border border-gray-200 bg-white p-6 shadow-sm">
                        <div className="text-sm font-medium text-gray-600 mb-1">
                          Total Dependencies
                        </div>
                        <div className="text-3xl font-bold text-gray-900">
                          {statusData.total_dependencies || "0"}
                        </div>
                      </div>
                      <div className="rounded-md border border-gray-200 bg-white p-6 shadow-sm">
                        <div className="text-sm font-medium text-gray-600 mb-1">
                          Blocking Dependencies
                        </div>
                        <div className="text-3xl font-bold text-gray-900">
                          {statusData.blocking_dependencies || "0"}
                        </div>
                      </div>
                      <div className="rounded-md border border-gray-200 bg-white p-6 shadow-sm">
                        <div className="text-sm font-medium text-gray-600 mb-1">
                          Optional Dependencies
                        </div>
                        <div className="text-3xl font-bold text-gray-900">
                          {statusData.optional_dependencies || "0"}
                        </div>
                      </div>
                      <div className="rounded-md border border-gray-200 bg-white p-6 shadow-sm">
                        <div className="text-sm font-medium text-gray-600 mb-1">
                          Satisfied Dependencies
                        </div>
                        <div className="text-3xl font-bold text-gray-900">
                          {statusData.satisfied_dependencies || "0"}
                        </div>
                      </div>
                      <div className="rounded-md border border-gray-200 bg-white p-6 shadow-sm">
                        <div className="text-sm font-medium text-gray-600 mb-1">
                          Unsatisfied Blocking
                        </div>
                        <div className="text-3xl font-bold text-gray-900">
                          {statusData.unsatisfied_blocking || "0"}
                        </div>
                      </div>
                    </div>
                    {statusData.source && (
                      <div className="text-xs text-gray-500 text-center pt-4 border-t border-gray-200">
                        Source: {statusData.source}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-500">
                      No dependency status data available
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Dependencies For Job Modal */}
      {showDependenciesForJobModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-2 sm:p-4">
          <div className="w-full max-w-6xl rounded-xl bg-white p-4 sm:p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  {dependenciesForJobTitle}
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  All dependencies configured for this job
                </p>
              </div>
              <button
                onClick={() => setShowDependenciesForJobModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            {isLoadingDependenciesForJob ? (
              <div className="flex justify-center py-8">
                <LoadingSpinner />
              </div>
            ) : dependenciesForJobData.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">
                  No dependencies found for this job
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
                <table
                  className="w-full min-w-[800px]"
                  style={{ borderCollapse: "separate", borderSpacing: "0 8px" }}
                >
                  <thead>
                    <tr>
                      <th
                        className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider whitespace-nowrap"
                        style={{
                          color: color.surface.tableHeaderText,
                          backgroundColor: color.surface.tableHeader,
                          borderTopLeftRadius: "0.375rem",
                        }}
                      >
                        ID
                      </th>
                      <th
                        className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider whitespace-nowrap"
                        style={{
                          color: color.surface.tableHeaderText,
                          backgroundColor: color.surface.tableHeader,
                        }}
                      >
                        Job Name
                      </th>
                      <th
                        className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider whitespace-nowrap"
                        style={{
                          color: color.surface.tableHeaderText,
                          backgroundColor: color.surface.tableHeader,
                        }}
                      >
                        Depends On Job
                      </th>
                      <th
                        className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider whitespace-nowrap"
                        style={{
                          color: color.surface.tableHeaderText,
                          backgroundColor: color.surface.tableHeader,
                        }}
                      >
                        Type
                      </th>
                      <th
                        className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider whitespace-nowrap"
                        style={{
                          color: color.surface.tableHeaderText,
                          backgroundColor: color.surface.tableHeader,
                        }}
                      >
                        Wait For Status
                      </th>
                      <th
                        className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider whitespace-nowrap"
                        style={{
                          color: color.surface.tableHeaderText,
                          backgroundColor: color.surface.tableHeader,
                        }}
                      >
                        Active
                      </th>
                      <th
                        className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider whitespace-nowrap"
                        style={{
                          color: color.surface.tableHeaderText,
                          backgroundColor: color.surface.tableHeader,
                        }}
                      >
                        Max Wait (min)
                      </th>
                      <th
                        className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider whitespace-nowrap"
                        style={{
                          color: color.surface.tableHeaderText,
                          backgroundColor: color.surface.tableHeader,
                        }}
                      >
                        Lookback Days
                      </th>
                      <th
                        className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider whitespace-nowrap"
                        style={{
                          color: color.surface.tableHeaderText,
                          backgroundColor: color.surface.tableHeader,
                          borderTopRightRadius: "0.375rem",
                        }}
                      >
                        Created At
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {dependenciesForJobData.map((item, idx) => (
                      <tr key={item.id || idx} className="transition-colors">
                        <td
                          className="px-6 py-4 whitespace-nowrap"
                          style={{
                            backgroundColor: color.surface.tablebodybg,
                            borderTopLeftRadius: "0.375rem",
                            borderBottomLeftRadius: "0.375rem",
                          }}
                        >
                          <span className="text-sm text-gray-900">
                            {item.id}
                          </span>
                        </td>
                        <td
                          className="px-6 py-4 whitespace-nowrap"
                          style={{ backgroundColor: color.surface.tablebodybg }}
                        >
                          <button
                            onClick={() => {
                              navigate(
                                `/dashboard/scheduled-jobs/${item.job_id}`
                              );
                              setShowDependenciesForJobModal(false);
                            }}
                            className="text-sm font-semibold text-gray-900 hover:underline transition-colors"
                            onMouseEnter={(e) => {
                              e.currentTarget.style.color =
                                color.primary.accent;
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.color = "";
                            }}
                          >
                            {jobsMap.get(item.job_id) || `Job ${item.job_id}`}
                          </button>
                        </td>
                        <td
                          className="px-6 py-4 whitespace-nowrap"
                          style={{ backgroundColor: color.surface.tablebodybg }}
                        >
                          <button
                            onClick={() => {
                              navigate(
                                `/dashboard/scheduled-jobs/${item.depends_on_job_id}`
                              );
                              setShowDependenciesForJobModal(false);
                            }}
                            className="text-sm font-semibold text-gray-900 hover:underline transition-colors"
                            onMouseEnter={(e) => {
                              e.currentTarget.style.color =
                                color.primary.accent;
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.color = "";
                            }}
                          >
                            {jobsMap.get(item.depends_on_job_id) ||
                              `Job ${item.depends_on_job_id}`}
                          </button>
                        </td>
                        <td
                          className="px-6 py-4 whitespace-nowrap"
                          style={{ backgroundColor: color.surface.tablebodybg }}
                        >
                          <span className="text-sm text-gray-900 capitalize">
                            {item.dependency_type}
                          </span>
                        </td>
                        <td
                          className="px-6 py-4 whitespace-nowrap"
                          style={{ backgroundColor: color.surface.tablebodybg }}
                        >
                          <span className="text-sm text-gray-900 capitalize">
                            {item.wait_for_status}
                          </span>
                        </td>
                        <td
                          className="px-6 py-4 whitespace-nowrap"
                          style={{ backgroundColor: color.surface.tablebodybg }}
                        >
                          <span className="text-sm text-gray-900">
                            {item.is_active ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td
                          className="px-6 py-4 whitespace-nowrap"
                          style={{ backgroundColor: color.surface.tablebodybg }}
                        >
                          <span className="text-sm text-gray-900">
                            {item.max_wait_minutes || "-"}
                          </span>
                        </td>
                        <td
                          className="px-6 py-4 whitespace-nowrap"
                          style={{ backgroundColor: color.surface.tablebodybg }}
                        >
                          <span className="text-sm text-gray-900">
                            {item.lookback_days ?? "-"}
                          </span>
                        </td>
                        <td
                          className="px-6 py-4 whitespace-nowrap"
                          style={{
                            backgroundColor: color.surface.tablebodybg,
                            borderTopRightRadius: "0.375rem",
                            borderBottomRightRadius: "0.375rem",
                          }}
                        >
                          <span className="text-sm text-gray-900">
                            {item.created_at
                              ? new Date(item.created_at).toLocaleString()
                              : "-"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Jobs Depending On Modal */}
      {showJobsDependingOnModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-2 sm:p-4">
          <div className="w-full max-w-6xl rounded-xl bg-white p-4 sm:p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  {jobsDependingOnTitle}
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  All jobs that depend on this job
                </p>
              </div>
              <button
                onClick={() => setShowJobsDependingOnModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            {isLoadingJobsDependingOn ? (
              <div className="flex justify-center py-8">
                <LoadingSpinner />
              </div>
            ) : jobsDependingOnData.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">No jobs depend on this job</p>
              </div>
            ) : (
              <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
                <table
                  className="w-full min-w-[800px]"
                  style={{ borderCollapse: "separate", borderSpacing: "0 8px" }}
                >
                  <thead>
                    <tr>
                      <th
                        className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider whitespace-nowrap"
                        style={{
                          color: color.surface.tableHeaderText,
                          backgroundColor: color.surface.tableHeader,
                          borderTopLeftRadius: "0.375rem",
                        }}
                      >
                        ID
                      </th>
                      <th
                        className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider whitespace-nowrap"
                        style={{
                          color: color.surface.tableHeaderText,
                          backgroundColor: color.surface.tableHeader,
                        }}
                      >
                        Dependent Job
                      </th>
                      <th
                        className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider whitespace-nowrap"
                        style={{
                          color: color.surface.tableHeaderText,
                          backgroundColor: color.surface.tableHeader,
                        }}
                      >
                        Depends On Job
                      </th>
                      <th
                        className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider whitespace-nowrap"
                        style={{
                          color: color.surface.tableHeaderText,
                          backgroundColor: color.surface.tableHeader,
                        }}
                      >
                        Type
                      </th>
                      <th
                        className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider whitespace-nowrap"
                        style={{
                          color: color.surface.tableHeaderText,
                          backgroundColor: color.surface.tableHeader,
                        }}
                      >
                        Wait For Status
                      </th>
                      <th
                        className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider whitespace-nowrap"
                        style={{
                          color: color.surface.tableHeaderText,
                          backgroundColor: color.surface.tableHeader,
                        }}
                      >
                        Active
                      </th>
                      <th
                        className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider whitespace-nowrap"
                        style={{
                          color: color.surface.tableHeaderText,
                          backgroundColor: color.surface.tableHeader,
                        }}
                      >
                        Max Wait (min)
                      </th>
                      <th
                        className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider whitespace-nowrap"
                        style={{
                          color: color.surface.tableHeaderText,
                          backgroundColor: color.surface.tableHeader,
                        }}
                      >
                        Lookback Days
                      </th>
                      <th
                        className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider whitespace-nowrap"
                        style={{
                          color: color.surface.tableHeaderText,
                          backgroundColor: color.surface.tableHeader,
                          borderTopRightRadius: "0.375rem",
                        }}
                      >
                        Created At
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {jobsDependingOnData.map((item, idx) => (
                      <tr key={item.id || idx} className="transition-colors">
                        <td
                          className="px-6 py-4 whitespace-nowrap"
                          style={{
                            backgroundColor: color.surface.tablebodybg,
                            borderTopLeftRadius: "0.375rem",
                            borderBottomLeftRadius: "0.375rem",
                          }}
                        >
                          <span className="text-sm text-gray-900">
                            {item.id}
                          </span>
                        </td>
                        <td
                          className="px-6 py-4 whitespace-nowrap"
                          style={{ backgroundColor: color.surface.tablebodybg }}
                        >
                          <button
                            onClick={() => {
                              navigate(
                                `/dashboard/scheduled-jobs/${item.job_id}`
                              );
                              setShowJobsDependingOnModal(false);
                            }}
                            className="text-sm font-semibold text-gray-900 hover:underline transition-colors"
                            onMouseEnter={(e) => {
                              e.currentTarget.style.color =
                                color.primary.accent;
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.color = "";
                            }}
                          >
                            {jobsMap.get(item.job_id) || `Job ${item.job_id}`}
                          </button>
                        </td>
                        <td
                          className="px-6 py-4 whitespace-nowrap"
                          style={{ backgroundColor: color.surface.tablebodybg }}
                        >
                          <button
                            onClick={() => {
                              navigate(
                                `/dashboard/scheduled-jobs/${item.depends_on_job_id}`
                              );
                              setShowJobsDependingOnModal(false);
                            }}
                            className="text-sm font-semibold text-gray-900 hover:underline transition-colors"
                            onMouseEnter={(e) => {
                              e.currentTarget.style.color =
                                color.primary.accent;
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.color = "";
                            }}
                          >
                            {jobsMap.get(item.depends_on_job_id) ||
                              `Job ${item.depends_on_job_id}`}
                          </button>
                        </td>
                        <td
                          className="px-6 py-4 whitespace-nowrap"
                          style={{ backgroundColor: color.surface.tablebodybg }}
                        >
                          <span className="text-sm text-gray-900 capitalize">
                            {item.dependency_type}
                          </span>
                        </td>
                        <td
                          className="px-6 py-4 whitespace-nowrap"
                          style={{ backgroundColor: color.surface.tablebodybg }}
                        >
                          <span className="text-sm text-gray-900 capitalize">
                            {item.wait_for_status}
                          </span>
                        </td>
                        <td
                          className="px-6 py-4 whitespace-nowrap"
                          style={{ backgroundColor: color.surface.tablebodybg }}
                        >
                          <span className="text-sm text-gray-900">
                            {item.is_active ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td
                          className="px-6 py-4 whitespace-nowrap"
                          style={{ backgroundColor: color.surface.tablebodybg }}
                        >
                          <span className="text-sm text-gray-900">
                            {item.max_wait_minutes || "-"}
                          </span>
                        </td>
                        <td
                          className="px-6 py-4 whitespace-nowrap"
                          style={{ backgroundColor: color.surface.tablebodybg }}
                        >
                          <span className="text-sm text-gray-900">
                            {item.lookback_days ?? "-"}
                          </span>
                        </td>
                        <td
                          className="px-6 py-4 whitespace-nowrap"
                          style={{
                            backgroundColor: color.surface.tablebodybg,
                            borderTopRightRadius: "0.375rem",
                            borderBottomRightRadius: "0.375rem",
                          }}
                        >
                          <span className="text-sm text-gray-900">
                            {item.created_at
                              ? new Date(item.created_at).toLocaleString()
                              : "-"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Blocking Dependencies Modal */}
      {showBlockingDependenciesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-2 sm:p-4">
          <div className="w-full max-w-6xl rounded-xl bg-white p-4 sm:p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  {blockingDependenciesTitle}
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  Blocking dependencies that must be satisfied before this job
                  can run
                </p>
              </div>
              <button
                onClick={() => setShowBlockingDependenciesModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            {isLoadingBlockingDependencies ? (
              <div className="flex justify-center py-8">
                <LoadingSpinner />
              </div>
            ) : blockingDependenciesData.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">No blocking dependencies found</p>
              </div>
            ) : (
              <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
                <table
                  className="w-full min-w-[800px]"
                  style={{ borderCollapse: "separate", borderSpacing: "0 8px" }}
                >
                  <thead>
                    <tr>
                      <th
                        className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider whitespace-nowrap"
                        style={{
                          color: color.surface.tableHeaderText,
                          backgroundColor: color.surface.tableHeader,
                          borderTopLeftRadius: "0.375rem",
                        }}
                      >
                        ID
                      </th>
                      <th
                        className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider whitespace-nowrap"
                        style={{
                          color: color.surface.tableHeaderText,
                          backgroundColor: color.surface.tableHeader,
                        }}
                      >
                        Job Name
                      </th>
                      <th
                        className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider whitespace-nowrap"
                        style={{
                          color: color.surface.tableHeaderText,
                          backgroundColor: color.surface.tableHeader,
                        }}
                      >
                        Depends On Job
                      </th>
                      <th
                        className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider whitespace-nowrap"
                        style={{
                          color: color.surface.tableHeaderText,
                          backgroundColor: color.surface.tableHeader,
                        }}
                      >
                        Wait For Status
                      </th>
                      <th
                        className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider whitespace-nowrap"
                        style={{
                          color: color.surface.tableHeaderText,
                          backgroundColor: color.surface.tableHeader,
                        }}
                      >
                        Active
                      </th>
                      <th
                        className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider whitespace-nowrap"
                        style={{
                          color: color.surface.tableHeaderText,
                          backgroundColor: color.surface.tableHeader,
                        }}
                      >
                        Max Wait (min)
                      </th>
                      <th
                        className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider whitespace-nowrap"
                        style={{
                          color: color.surface.tableHeaderText,
                          backgroundColor: color.surface.tableHeader,
                        }}
                      >
                        Lookback Days
                      </th>
                      <th
                        className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider whitespace-nowrap"
                        style={{
                          color: color.surface.tableHeaderText,
                          backgroundColor: color.surface.tableHeader,
                          borderTopRightRadius: "0.375rem",
                        }}
                      >
                        Created At
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {blockingDependenciesData.map((item, idx) => (
                      <tr key={item.id || idx} className="transition-colors">
                        <td
                          className="px-6 py-4 whitespace-nowrap"
                          style={{
                            backgroundColor: color.surface.tablebodybg,
                            borderTopLeftRadius: "0.375rem",
                            borderBottomLeftRadius: "0.375rem",
                          }}
                        >
                          <span className="text-sm text-gray-900">
                            {item.id}
                          </span>
                        </td>
                        <td
                          className="px-6 py-4 whitespace-nowrap"
                          style={{ backgroundColor: color.surface.tablebodybg }}
                        >
                          <button
                            onClick={() => {
                              navigate(
                                `/dashboard/scheduled-jobs/${item.job_id}`
                              );
                              setShowBlockingDependenciesModal(false);
                            }}
                            className="text-sm font-semibold text-gray-900 hover:underline transition-colors"
                            onMouseEnter={(e) => {
                              e.currentTarget.style.color =
                                color.primary.accent;
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.color = "";
                            }}
                          >
                            {jobsMap.get(item.job_id) || `Job ${item.job_id}`}
                          </button>
                        </td>
                        <td
                          className="px-6 py-4 whitespace-nowrap"
                          style={{ backgroundColor: color.surface.tablebodybg }}
                        >
                          <button
                            onClick={() => {
                              navigate(
                                `/dashboard/scheduled-jobs/${item.depends_on_job_id}`
                              );
                              setShowBlockingDependenciesModal(false);
                            }}
                            className="text-sm font-semibold text-gray-900 hover:underline transition-colors"
                            onMouseEnter={(e) => {
                              e.currentTarget.style.color =
                                color.primary.accent;
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.color = "";
                            }}
                          >
                            {jobsMap.get(item.depends_on_job_id) ||
                              `Job ${item.depends_on_job_id}`}
                          </button>
                        </td>
                        <td
                          className="px-6 py-4 whitespace-nowrap"
                          style={{ backgroundColor: color.surface.tablebodybg }}
                        >
                          <span className="text-sm text-gray-900 capitalize">
                            {item.wait_for_status}
                          </span>
                        </td>
                        <td
                          className="px-6 py-4 whitespace-nowrap"
                          style={{ backgroundColor: color.surface.tablebodybg }}
                        >
                          <span className="text-sm text-gray-900">
                            {item.is_active ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td
                          className="px-6 py-4 whitespace-nowrap"
                          style={{ backgroundColor: color.surface.tablebodybg }}
                        >
                          <span className="text-sm text-gray-900">
                            {item.max_wait_minutes || "-"}
                          </span>
                        </td>
                        <td
                          className="px-6 py-4 whitespace-nowrap"
                          style={{ backgroundColor: color.surface.tablebodybg }}
                        >
                          <span className="text-sm text-gray-900">
                            {item.lookback_days ?? "-"}
                          </span>
                        </td>
                        <td
                          className="px-6 py-4 whitespace-nowrap"
                          style={{
                            backgroundColor: color.surface.tablebodybg,
                            borderTopRightRadius: "0.375rem",
                            borderBottomRightRadius: "0.375rem",
                          }}
                        >
                          <span className="text-sm text-gray-900">
                            {item.created_at
                              ? new Date(item.created_at).toLocaleString()
                              : "-"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Immediate Dependencies Modal */}
      {showImmediateDependenciesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-2 sm:p-4">
          <div className="w-full max-w-4xl rounded-xl bg-white p-4 sm:p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  {immediateDependenciesTitle}
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  Direct dependencies (first level only) for this job
                </p>
              </div>
              <button
                onClick={() => setShowImmediateDependenciesModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            {isLoadingImmediateDependencies ? (
              <div className="flex justify-center py-8">
                <LoadingSpinner />
              </div>
            ) : immediateDependenciesData.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">No immediate dependencies found</p>
              </div>
            ) : (
              <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
                <table
                  className="w-full min-w-[800px]"
                  style={{ borderCollapse: "separate", borderSpacing: "0 8px" }}
                >
                  <thead>
                    <tr>
                      <th
                        className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider whitespace-nowrap"
                        style={{
                          color: color.surface.tableHeaderText,
                          backgroundColor: color.surface.tableHeader,
                          borderTopLeftRadius: "0.375rem",
                        }}
                      >
                        Job ID
                      </th>
                      <th
                        className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider whitespace-nowrap"
                        style={{
                          color: color.surface.tableHeaderText,
                          backgroundColor: color.surface.tableHeader,
                          borderTopRightRadius: "0.375rem",
                        }}
                      >
                        Job Name
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {immediateDependenciesData.map((jobId, idx) => (
                      <tr key={jobId || idx} className="transition-colors">
                        <td
                          className="px-6 py-4 whitespace-nowrap"
                          style={{
                            backgroundColor: color.surface.tablebodybg,
                            borderTopLeftRadius: "0.375rem",
                            borderBottomLeftRadius: "0.375rem",
                          }}
                        >
                          <span className="text-sm text-gray-900">{jobId}</span>
                        </td>
                        <td
                          className="px-6 py-4 whitespace-nowrap"
                          style={{
                            backgroundColor: color.surface.tablebodybg,
                            borderTopRightRadius: "0.375rem",
                            borderBottomRightRadius: "0.375rem",
                          }}
                        >
                          <button
                            onClick={() => {
                              navigate(`/dashboard/scheduled-jobs/${jobId}`);
                              setShowImmediateDependenciesModal(false);
                            }}
                            className="text-sm font-semibold text-gray-900 hover:underline transition-colors"
                            onMouseEnter={(e) => {
                              e.currentTarget.style.color =
                                color.primary.accent;
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.color = "";
                            }}
                          >
                            {jobsMap.get(jobId) || `Job ${jobId}`}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* All Dependents Modal */}
      {showAllDependentsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-2 sm:p-4">
          <div className="w-full max-w-4xl rounded-xl bg-white p-4 sm:p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  {allDependentsTitle}
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  All jobs that depend on this job (directly or indirectly)
                </p>
              </div>
              <button
                onClick={() => setShowAllDependentsModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            {isLoadingAllDependents ? (
              <div className="flex justify-center py-8">
                <LoadingSpinner />
              </div>
            ) : allDependentsData.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">No dependent jobs found</p>
              </div>
            ) : (
              <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
                <table
                  className="w-full min-w-[800px]"
                  style={{ borderCollapse: "separate", borderSpacing: "0 8px" }}
                >
                  <thead>
                    <tr>
                      <th
                        className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider whitespace-nowrap"
                        style={{
                          color: color.surface.tableHeaderText,
                          backgroundColor: color.surface.tableHeader,
                          borderTopLeftRadius: "0.375rem",
                          borderTopRightRadius: "0.375rem",
                        }}
                      >
                        Job ID
                      </th>
                      <th
                        className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider whitespace-nowrap"
                        style={{
                          color: color.surface.tableHeaderText,
                          backgroundColor: color.surface.tableHeader,
                          borderTopRightRadius: "0.375rem",
                        }}
                      >
                        Job Name
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {allDependentsData.map((jobId, idx) => (
                      <tr key={jobId || idx} className="transition-colors">
                        <td
                          className="px-6 py-4 whitespace-nowrap"
                          style={{
                            backgroundColor: color.surface.tablebodybg,
                            borderTopLeftRadius: "0.375rem",
                            borderBottomLeftRadius: "0.375rem",
                          }}
                        >
                          <span className="text-sm text-gray-900">{jobId}</span>
                        </td>
                        <td
                          className="px-6 py-4 whitespace-nowrap"
                          style={{
                            backgroundColor: color.surface.tablebodybg,
                            borderTopRightRadius: "0.375rem",
                            borderBottomRightRadius: "0.375rem",
                          }}
                        >
                          <button
                            onClick={() => {
                              navigate(`/dashboard/scheduled-jobs/${jobId}`);
                              setShowAllDependentsModal(false);
                            }}
                            className="text-sm font-semibold text-gray-900 hover:underline transition-colors"
                            onMouseEnter={(e) => {
                              e.currentTarget.style.color =
                                color.primary.accent;
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.color = "";
                            }}
                          >
                            {jobsMap.get(jobId) || `Job ${jobId}`}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Unsatisfied Dependencies Modal */}
      {showUnsatisfiedDependenciesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-2 sm:p-4">
          <div className="w-full max-w-6xl rounded-xl bg-white p-4 sm:p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  {unsatisfiedDependenciesTitle}
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  Dependencies that have not been satisfied yet (blocking job
                  execution)
                </p>
              </div>
              <button
                onClick={() => setShowUnsatisfiedDependenciesModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            {isLoadingUnsatisfiedDependencies ? (
              <div className="flex justify-center py-8">
                <LoadingSpinner />
              </div>
            ) : unsatisfiedDependenciesData.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">All dependencies are satisfied</p>
              </div>
            ) : (
              <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
                <table
                  className="w-full min-w-[800px]"
                  style={{ borderCollapse: "separate", borderSpacing: "0 8px" }}
                >
                  <thead>
                    <tr>
                      <th
                        className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider whitespace-nowrap"
                        style={{
                          color: color.surface.tableHeaderText,
                          backgroundColor: color.surface.tableHeader,
                          borderTopLeftRadius: "0.375rem",
                        }}
                      >
                        Job Name
                      </th>
                      <th
                        className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider whitespace-nowrap"
                        style={{
                          color: color.surface.tableHeaderText,
                          backgroundColor: color.surface.tableHeader,
                        }}
                      >
                        Depends On Job
                      </th>
                      <th
                        className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider whitespace-nowrap"
                        style={{
                          color: color.surface.tableHeaderText,
                          backgroundColor: color.surface.tableHeader,
                        }}
                      >
                        Type
                      </th>
                      <th
                        className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider whitespace-nowrap"
                        style={{
                          color: color.surface.tableHeaderText,
                          backgroundColor: color.surface.tableHeader,
                        }}
                      >
                        Wait For Status
                      </th>
                      <th
                        className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider whitespace-nowrap"
                        style={{
                          color: color.surface.tableHeaderText,
                          backgroundColor: color.surface.tableHeader,
                          borderTopRightRadius: "0.375rem",
                        }}
                      >
                        Max Wait (min)
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {unsatisfiedDependenciesData.map((item, idx) => (
                      <tr
                        key={item.dependency_id || idx}
                        className="transition-colors"
                      >
                        <td
                          className="px-6 py-4 whitespace-nowrap"
                          style={{
                            backgroundColor: color.surface.tablebodybg,
                            borderTopLeftRadius: "0.375rem",
                            borderBottomLeftRadius: "0.375rem",
                          }}
                        >
                          <span className="text-sm text-gray-900">
                            {item.depends_on_job_name ||
                              `Job ${item.depends_on_job_id}`}
                          </span>
                        </td>
                        <td
                          className="px-6 py-4 whitespace-nowrap"
                          style={{ backgroundColor: color.surface.tablebodybg }}
                        >
                          <button
                            onClick={() => {
                              navigate(
                                `/dashboard/scheduled-jobs/${item.depends_on_job_id}`
                              );
                              setShowUnsatisfiedDependenciesModal(false);
                            }}
                            className="text-sm font-semibold text-gray-900 hover:underline transition-colors"
                            onMouseEnter={(e) => {
                              e.currentTarget.style.color =
                                color.primary.accent;
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.color = "";
                            }}
                          >
                            {item.depends_on_job_name ||
                              `Job ${item.depends_on_job_id}`}
                          </button>
                        </td>
                        <td
                          className="px-6 py-4 whitespace-nowrap"
                          style={{ backgroundColor: color.surface.tablebodybg }}
                        >
                          <span className="text-sm text-gray-900">
                            Dependency {item.dependency_id}
                          </span>
                        </td>
                        <td
                          className="px-6 py-4 whitespace-nowrap"
                          style={{ backgroundColor: color.surface.tablebodybg }}
                        >
                          <span className="text-sm text-gray-900 capitalize">
                            {item.required_status}
                          </span>
                        </td>
                        <td
                          className="px-6 py-4 whitespace-nowrap"
                          style={{
                            backgroundColor: color.surface.tablebodybg,
                            borderTopRightRadius: "0.375rem",
                            borderBottomRightRadius: "0.375rem",
                          }}
                        >
                          <span className="text-sm text-gray-900">
                            {item.current_status || "-"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Complex Dependencies Modal */}
      {showComplexDependenciesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-2 sm:p-4">
          <div className="w-full max-w-6xl rounded-xl bg-white p-4 sm:p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  Complex Dependencies
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  Dependencies with complex structures (conditional, cross-day,
                  etc.)
                </p>
              </div>
              <button
                onClick={() => setShowComplexDependenciesModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            {isLoadingComplexDependencies ? (
              <div className="flex justify-center py-8">
                <LoadingSpinner />
              </div>
            ) : complexDependenciesModalData.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">No complex dependencies found</p>
              </div>
            ) : (
              <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
                <table
                  className="w-full min-w-[800px]"
                  style={{ borderCollapse: "separate", borderSpacing: "0 8px" }}
                >
                  <thead>
                    <tr>
                      <th
                        className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider whitespace-nowrap"
                        style={{
                          color: color.surface.tableHeaderText,
                          backgroundColor: color.surface.tableHeader,
                          borderTopLeftRadius: "0.375rem",
                        }}
                      >
                        Job Name
                      </th>
                      <th
                        className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider whitespace-nowrap"
                        style={{
                          color: color.surface.tableHeaderText,
                          backgroundColor: color.surface.tableHeader,
                        }}
                      >
                        Depends On Job
                      </th>
                      <th
                        className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider whitespace-nowrap"
                        style={{
                          color: color.surface.tableHeaderText,
                          backgroundColor: color.surface.tableHeader,
                        }}
                      >
                        Type
                      </th>
                      <th
                        className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider whitespace-nowrap"
                        style={{
                          color: color.surface.tableHeaderText,
                          backgroundColor: color.surface.tableHeader,
                        }}
                      >
                        Wait For Status
                      </th>
                      <th
                        className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider whitespace-nowrap"
                        style={{
                          color: color.surface.tableHeaderText,
                          backgroundColor: color.surface.tableHeader,
                        }}
                      >
                        Lookback Days
                      </th>
                      <th
                        className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider whitespace-nowrap"
                        style={{
                          color: color.surface.tableHeaderText,
                          backgroundColor: color.surface.tableHeader,
                          borderTopRightRadius: "0.375rem",
                        }}
                      >
                        Max Wait (min)
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {complexDependenciesModalData.map((item, idx) => (
                      <tr key={item.id || idx} className="transition-colors">
                        <td
                          className="px-6 py-4 whitespace-nowrap"
                          style={{
                            backgroundColor: color.surface.tablebodybg,
                            borderTopLeftRadius: "0.375rem",
                            borderBottomLeftRadius: "0.375rem",
                          }}
                        >
                          <button
                            onClick={() => {
                              navigate(
                                `/dashboard/scheduled-jobs/${item.job_id}`
                              );
                              setShowComplexDependenciesModal(false);
                            }}
                            className="text-sm font-semibold text-gray-900 hover:underline transition-colors"
                            onMouseEnter={(e) => {
                              e.currentTarget.style.color =
                                color.primary.accent;
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.color = "";
                            }}
                          >
                            {jobsMap.get(item.job_id) || `Job ${item.job_id}`}
                          </button>
                        </td>
                        <td
                          className="px-6 py-4 whitespace-nowrap"
                          style={{ backgroundColor: color.surface.tablebodybg }}
                        >
                          <button
                            onClick={() => {
                              navigate(
                                `/dashboard/scheduled-jobs/${item.depends_on_job_id}`
                              );
                              setShowComplexDependenciesModal(false);
                            }}
                            className="text-sm font-semibold text-gray-900 hover:underline transition-colors"
                            onMouseEnter={(e) => {
                              e.currentTarget.style.color =
                                color.primary.accent;
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.color = "";
                            }}
                          >
                            {jobsMap.get(item.depends_on_job_id) ||
                              `Job ${item.depends_on_job_id}`}
                          </button>
                        </td>
                        <td
                          className="px-6 py-4 whitespace-nowrap"
                          style={{ backgroundColor: color.surface.tablebodybg }}
                        >
                          <span className="text-sm text-gray-900 capitalize">
                            {item.dependency_type}
                          </span>
                        </td>
                        <td
                          className="px-6 py-4 whitespace-nowrap"
                          style={{ backgroundColor: color.surface.tablebodybg }}
                        >
                          <span className="text-sm text-gray-900 capitalize">
                            {item.wait_for_status}
                          </span>
                        </td>
                        <td
                          className="px-6 py-4 whitespace-nowrap"
                          style={{ backgroundColor: color.surface.tablebodybg }}
                        >
                          <span className="text-sm text-gray-900">
                            {item.lookback_days || 0}
                          </span>
                        </td>
                        <td
                          className="px-6 py-4 whitespace-nowrap"
                          style={{
                            backgroundColor: color.surface.tablebodybg,
                            borderTopRightRadius: "0.375rem",
                            borderBottomRightRadius: "0.375rem",
                          }}
                        >
                          <span className="text-sm text-gray-900">
                            {item.max_wait_minutes || "-"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
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
            />
            <div
              ref={filterRef}
              className="absolute right-0 top-0 h-full w-full sm:w-[28rem] lg:w-96 bg-white shadow-xl transform transition-transform duration-300 ease-out translate-x-0"
              style={{ zIndex: 1000000 }}
            >
              <div className="flex flex-col h-full">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-200">
                  <h2 className="text-sm font-semibold text-gray-900">
                    Filter Dependencies
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
                    {/* ID Filter */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Dependency ID
                      </label>
                      <input
                        type="number"
                        value={filterId || ""}
                        onChange={(e) =>
                          setFilterId(
                            e.target.value ? Number(e.target.value) : ""
                          )
                        }
                        placeholder="All IDs"
                        className="w-full text-sm px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#3b8169] focus:border-transparent"
                      />
                    </div>

                    {/* Job ID Filter */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Job ID
                      </label>
                      <input
                        type="number"
                        value={filterJobId || ""}
                        onChange={(e) =>
                          setFilterJobId(
                            e.target.value ? Number(e.target.value) : ""
                          )
                        }
                        placeholder="All Job IDs"
                        className="w-full text-sm px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#3b8169] focus:border-transparent"
                      />
                    </div>

                    {/* Depends On Job ID Filter */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Depends On Job ID
                      </label>
                      <input
                        type="number"
                        value={filterDependsOnJobId || ""}
                        onChange={(e) =>
                          setFilterDependsOnJobId(
                            e.target.value ? Number(e.target.value) : ""
                          )
                        }
                        placeholder="All Depends On Job IDs"
                        className="w-full text-sm px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#3b8169] focus:border-transparent"
                      />
                    </div>

                    {/* Dependency Type Filter */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Dependency Type
                      </label>
                      <HeadlessSelect
                        options={[
                          { value: "", label: "All Types" },
                          { value: "blocking", label: "Blocking" },
                          { value: "optional", label: "Optional" },
                          { value: "cross_day", label: "Cross Day" },
                          { value: "conditional", label: "Conditional" },
                        ]}
                        value={filterDependencyType}
                        onChange={(value) =>
                          setFilterDependencyType(value as string)
                        }
                        placeholder="All Types"
                        className="w-full"
                      />
                    </div>

                    {/* Wait For Status Filter */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Wait For Status
                      </label>
                      <HeadlessSelect
                        options={[
                          { value: "", label: "All Statuses" },
                          { value: "success", label: "Success" },
                          { value: "failure", label: "Failure" },
                          { value: "completed", label: "Completed" },
                          { value: "any", label: "Any" },
                          // {
                          //   value: "partial_success",
                          //   label: "Partial Success",
                          // },
                          // { value: "pending", label: "Pending" },
                          // { value: "queued", label: "Queued" },
                          // { value: "running", label: "Running" },
                          // { value: "aborted", label: "Aborted" },
                          // { value: "timeout", label: "Timeout" },
                          // { value: "skipped", label: "Skipped" },
                          // { value: "cancelled", label: "Cancelled" },
                        ]}
                        value={filterWaitForStatus}
                        onChange={(value) =>
                          setFilterWaitForStatus(value as string)
                        }
                        placeholder="All Statuses"
                        className="w-full"
                      />
                    </div>

                    {/* Is Active Filter */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Active Status
                      </label>
                      <HeadlessSelect
                        options={[
                          { value: "", label: "All" },
                          { value: "true", label: "Active" },
                          { value: "false", label: "Inactive" },
                        ]}
                        value={
                          filterIsActive === ""
                            ? ""
                            : filterIsActive === true
                            ? "true"
                            : "false"
                        }
                        onChange={(value) =>
                          setFilterIsActive(
                            value === "" ? "" : value === "true" ? true : false
                          )
                        }
                        placeholder="All"
                        className="w-full"
                      />
                    </div>

                    {/* Lookback Days Min Filter */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Lookback Days (Min)
                      </label>
                      <input
                        type="number"
                        value={filterLookbackDaysMin || ""}
                        onChange={(e) =>
                          setFilterLookbackDaysMin(
                            e.target.value ? Number(e.target.value) : ""
                          )
                        }
                        placeholder="Min"
                        min="0"
                        max="30"
                        className="w-full text-sm px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#3b8169] focus:border-transparent"
                      />
                    </div>

                    {/* Lookback Days Max Filter */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Lookback Days (Max)
                      </label>
                      <input
                        type="number"
                        value={filterLookbackDaysMax || ""}
                        onChange={(e) =>
                          setFilterLookbackDaysMax(
                            e.target.value ? Number(e.target.value) : ""
                          )
                        }
                        placeholder="Max"
                        min="0"
                        max="30"
                        className="w-full text-sm px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#3b8169] focus:border-transparent"
                      />
                    </div>

                    {/* Max Wait Minutes Min Filter */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Max Wait Minutes (Min)
                      </label>
                      <input
                        type="number"
                        value={filterMaxWaitMinutesMin || ""}
                        onChange={(e) =>
                          setFilterMaxWaitMinutesMin(
                            e.target.value ? Number(e.target.value) : ""
                          )
                        }
                        placeholder="Min"
                        min="0"
                        max="1440"
                        className="w-full text-sm px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#3b8169] focus:border-transparent"
                      />
                    </div>

                    {/* Max Wait Minutes Max Filter */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Max Wait Minutes (Max)
                      </label>
                      <input
                        type="number"
                        value={filterMaxWaitMinutesMax || ""}
                        onChange={(e) =>
                          setFilterMaxWaitMinutesMax(
                            e.target.value ? Number(e.target.value) : ""
                          )
                        }
                        placeholder="Max"
                        min="0"
                        max="1440"
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
                        setFilterId("");
                        setFilterJobId("");
                        setFilterDependsOnJobId("");
                        setFilterDependencyType("");
                        setFilterWaitForStatus("");
                        setFilterIsActive("");
                        setFilterLookbackDaysMin("");
                        setFilterLookbackDaysMax("");
                        setFilterMaxWaitMinutesMin("");
                        setFilterMaxWaitMinutesMax("");
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

      <JobDependencyModal
        isOpen={isModalOpen}
        isSaving={isSaving}
        onClose={() => {
          setIsModalOpen(false);
          setEditingDependency(null);
        }}
        onSubmit={async (values) => {
          await handleModalSubmit(values);
        }}
        initialData={editingDependency}
      />

      <JobDependencyViewModal
        isOpen={isViewModalOpen}
        onClose={() => {
          setIsViewModalOpen(false);
          setViewingDependency(null);
        }}
        dependency={viewingDependency}
        isLoading={isLoadingView}
      />

      <DeleteConfirmModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setDeletingDependency(null);
        }}
        onConfirm={handleDeleteConfirm}
        title="Delete Job Dependency"
        description="Are you sure you want to delete this job dependency? This action cannot be undone."
        itemName={`Dependency ${deletingDependency?.id || ""}`}
        isLoading={isDeleting}
        confirmText="Delete"
        cancelText="Cancel"
      />

      <DeleteConfirmModal
        isOpen={showDeleteAllModal}
        onClose={() => {
          setShowDeleteAllModal(false);
          setDeletingAllJobId(null);
        }}
        onConfirm={handleDeleteAllConfirm}
        title="Delete All Dependencies"
        description="Are you sure you want to delete all dependencies for this job? This action cannot be undone."
        itemName={`Job ${deletingAllJobId || ""}`}
        isLoading={isDeletingAll}
        confirmText="Delete All"
        cancelText="Cancel"
      />
    </div>
  );
}
