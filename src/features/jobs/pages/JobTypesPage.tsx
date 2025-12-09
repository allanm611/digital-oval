import { useCallback, useEffect, useMemo, useState, useRef } from "react";
import {
  AlertTriangle,
  Briefcase,
  Edit,
  Eye,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import LoadingSpinner from "../../../shared/components/ui/LoadingSpinner";
import DeleteConfirmModal from "../../../shared/components/ui/DeleteConfirmModal";
import DateFormatter from "../../../shared/components/DateFormatter";
import { color, tw } from "../../../shared/utils/utils";
import { useToast } from "../../../contexts/ToastContext";
import { useLanguage } from "../../../contexts/LanguageContext";
import { jobTypeService } from "../services/jobTypeService";
import { CreateJobTypePayload, JobType } from "../types/job";

const codeRegex = /^[a-z][a-z0-9_]*$/;

interface JobTypeModalProps {
  isOpen: boolean;
  isSaving: boolean;
  onClose: () => void;
  onSubmit: (values: CreateJobTypePayload) => Promise<void>;
  initialData?: JobType | null;
}

function JobTypeModal({
  isOpen,
  isSaving,
  onClose,
  onSubmit,
  initialData,
}: JobTypeModalProps) {
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [codeValidationError, setCodeValidationError] = useState<string | null>(
    null
  );
  const [isValidatingCode, setIsValidatingCode] = useState(false);
  const validationTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );

  useEffect(() => {
    if (!isOpen) return;
    setName(initialData?.name ?? "");
    setCode(initialData?.code ?? "");
    setDescription(initialData?.description ?? "");
    setError(null);
    setCodeValidationError(null);
  }, [initialData, isOpen]);

  // Validate code uniqueness with debouncing
  useEffect(() => {
    if (!isOpen) return;

    // Clear previous timeout
    if (validationTimeoutRef.current) {
      clearTimeout(validationTimeoutRef.current);
    }

    const trimmedCode = code.trim();

    // Reset validation error if code is empty or matches initial code (when editing)
    if (!trimmedCode || (initialData && trimmedCode === initialData.code)) {
      setCodeValidationError(null);
      setIsValidatingCode(false);
      return;
    }

    // Only validate if code matches the regex pattern
    if (!codeRegex.test(trimmedCode)) {
      setCodeValidationError(null);
      setIsValidatingCode(false);
      return;
    }

    // Debounce validation
    setIsValidatingCode(true);
    validationTimeoutRef.current = setTimeout(async () => {
      try {
        const response = await jobTypeService.checkCodeExists(trimmedCode);
        if (response.exists) {
          // If editing and the code belongs to the current job type, it's valid
          if (initialData && initialData.code === trimmedCode) {
            setCodeValidationError(null);
          } else {
            setCodeValidationError(
              "This code already exists. Please choose a different code."
            );
          }
        } else {
          setCodeValidationError(null);
        }
      } catch (err) {
        // Silently fail validation check - don't block user
        console.error("Failed to validate code:", err);
        setCodeValidationError(null);
      } finally {
        setIsValidatingCode(false);
      }
    }, 500);

    return () => {
      if (validationTimeoutRef.current) {
        clearTimeout(validationTimeoutRef.current);
      }
    };
  }, [code, initialData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!name.trim()) {
      setError("Name is required");
      return;
    }

    if (name.length > 255) {
      setError("Name must be 255 characters or fewer");
      return;
    }

    if (!code.trim()) {
      setError("Code is required");
      return;
    }

    if (code.length > 100) {
      setError("Code must be 100 characters or fewer");
      return;
    }

    if (!codeRegex.test(code)) {
      setError(
        "Code must be lowercase snake_case, start with a letter, and contain only letters, numbers, or underscores"
      );
      return;
    }

    // Check if code validation error exists
    if (codeValidationError) {
      setError(codeValidationError);
      return;
    }

    // Final check: if code changed during edit, validate it exists
    if (initialData && code.trim() !== initialData.code) {
      try {
        const response = await jobTypeService.checkCodeExists(code.trim());
        if (response.exists) {
          setError("This code already exists. Please choose a different code.");
          return;
        }
      } catch (err) {
        // If validation fails, still allow submission (backend will catch it)
        console.error("Code validation error:", err);
      }
    }

    if (description && description.length > 500) {
      setError("Description must be 500 characters or fewer");
      return;
    }

    setError(null);

    try {
      await onSubmit({
        name: name.trim(),
        code: code.trim(),
        description: description.trim() ? description.trim() : null,
      });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to save job type";
      setError(message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-lg rounded-md bg-white p-6 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              {initialData ? t.jobs.editJobType : t.jobs.createJobType}
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              {initialData
                ? t.jobs.updateJobTypeDesc
                : t.jobs.createJobTypeDesc}
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
              Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-[#3b8169] focus:outline-none focus:ring-1 focus:ring-[#3b8169]"
              placeholder="e.g. ETL Pipeline"
              maxLength={255}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Code
            </label>
            <div className="relative">
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className={`mt-1 w-full rounded-md border px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 ${
                  codeValidationError
                    ? "border-red-300 focus:border-red-500 focus:ring-red-500"
                    : "border-gray-300 focus:border-[#3b8169] focus:ring-[#3b8169]"
                }`}
                placeholder="e.g. etl_pipeline"
                maxLength={100}
                required
              />
              {isValidatingCode && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-[#3b8169]"></div>
                </div>
              )}
            </div>
            <p className="mt-1 text-xs text-gray-500">
              Lowercase snake_case, unique identifier used by job scheduler.
            </p>
            {codeValidationError && (
              <p className="mt-1 text-xs text-red-600">{codeValidationError}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-[#3b8169] focus:outline-none focus:ring-1 focus:ring-[#3b8169]"
              rows={4}
              placeholder="Optional context for this job type"
              maxLength={500}
            />
          </div>

          {error && (
            <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {error}
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
                ? t.jobs.updateJobType
                : t.jobs.createJobType}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface JobTypeViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  jobType: JobType | null;
  isLoading: boolean;
}

function JobTypeViewModal({
  isOpen,
  onClose,
  jobType,
  isLoading,
}: JobTypeViewModalProps) {
  const { t } = useLanguage();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-lg rounded-md bg-white p-6 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              {t.jobs.jobTypeDetails}
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
        ) : jobType ? (
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-1">
                {jobType.name}
              </h3>
              <p className="text-sm font-mono text-gray-600">{jobType.code}</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <p className="text-sm text-gray-900 leading-relaxed">
                  {jobType.description || (
                    <span className="text-gray-400 italic">
                      No description provided
                    </span>
                  )}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ID
                  </label>
                  <p className="text-sm text-gray-900">{jobType.id}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Created At
                  </label>
                  <p className="text-sm text-gray-900">
                    <DateFormatter
                      date={jobType.created_at}
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
          </div>
        ) : (
          <div className="py-8 text-center text-sm text-gray-500">
            No job type data available
          </div>
        )}
      </div>
    </div>
  );
}

export default function JobTypesPage() {
  const navigate = useNavigate();
  const { success: showToast, error: showError } = useToast();
  const { t } = useLanguage();

  const [jobTypes, setJobTypes] = useState<JobType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingJobType, setEditingJobType] = useState<JobType | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingJobType, setDeletingJobType] = useState<JobType | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [stats, setStats] = useState({
    totalJobTypes: 0,
    totalJobs: 0,
    unusedCount: 0,
  });
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [viewingJobType, setViewingJobType] = useState<JobType | null>(null);
  const [isLoadingView, setIsLoadingView] = useState(false);

  const fetchJobTypes = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const response = await jobTypeService.listJobTypes({
        limit: 100,
        skipCache: true,
      });
      setJobTypes(response.data || []);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to load job types";
      setLoadError(message);
      showError("Unable to load job types", message);
    } finally {
      setIsLoading(false);
    }
  }, [showError]);

  const searchJobTypes = useCallback(
    async (term: string) => {
      if (!term.trim()) {
        // If search is empty, fetch all job types
        await fetchJobTypes();
        return;
      }

      setIsSearching(true);
      setLoadError(null);
      try {
        const response = await jobTypeService.searchJobTypes({
          name: term,
          limit: 100,
          skipCache: true,
        });
        const results = response.data || [];
        setJobTypes(results);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to search job types";
        setLoadError(message);
        showError("Unable to search job types", message);
      } finally {
        setIsSearching(false);
      }
    },
    [fetchJobTypes, showError]
  );

  const fetchStats = useCallback(async () => {
    setIsLoadingStats(true);
    try {
      const [usageStats, countByType, unused] = await Promise.all([
        jobTypeService.getUsageStatistics(true),
        jobTypeService.getCountByType(true),
        jobTypeService.getUnusedJobTypes(true),
      ]);

      // Count job types that are actually being used (have job_count > 0)
      const activeJobTypes = countByType.data.filter((item) => {
        const count =
          typeof item.job_count === "string"
            ? parseInt(item.job_count, 10) || 0
            : item.job_count || 0;
        return count > 0;
      }).length;

      setStats({
        totalJobTypes: usageStats.data.length,
        totalJobs: activeJobTypes,
        unusedCount: unused.length,
      });
    } catch (err) {
      console.error("Failed to load stats:", err);
    } finally {
      setIsLoadingStats(false);
    }
  }, []);

  useEffect(() => {
    fetchJobTypes();
  }, [fetchJobTypes]);

  useEffect(() => {
    if (jobTypes.length > 0) {
      fetchStats();
    }
  }, [jobTypes.length, fetchStats]);

  // Debounced search using searchJobTypes endpoint
  useEffect(() => {
    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // If search term is empty, fetch all job types
    if (!searchTerm.trim()) {
      fetchJobTypes();
      return;
    }

    // Debounce search API call
    searchTimeoutRef.current = setTimeout(() => {
      searchJobTypes(searchTerm);
    }, 500);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchTerm, fetchJobTypes, searchJobTypes]);

  const filteredJobTypes = useMemo(() => {
    // Since we're using server-side search, we can directly use jobTypes
    // Sort by created_at descending (newest first), then by ID descending as fallback
    return [...jobTypes].sort((a, b) => {
      if (a.created_at && b.created_at) {
        return (
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
      }
      return b.id - a.id;
    });
  }, [jobTypes]);

  const handleCreate = () => {
    setEditingJobType(null);
    setIsModalOpen(true);
  };

  const handleEdit = async (jobType: JobType) => {
    // Set the job type immediately so modal can show data
    setEditingJobType(jobType);
    setIsModalOpen(true);

    // Then fetch fresh data in the background
    try {
      const freshJobType = await jobTypeService.getJobTypeById(jobType.id);
      setEditingJobType(freshJobType);
    } catch (err) {
      // If fetching fails, keep using the existing data
      console.error("Failed to fetch job type details:", err);
    }
  };

  const handleView = async (jobType: JobType) => {
    // Set the job type immediately so modal can show data
    setViewingJobType(jobType);
    setIsViewModalOpen(true);
    setIsLoadingView(true);

    // Then fetch fresh data in the background
    try {
      const freshJobType = await jobTypeService.getJobTypeById(jobType.id);
      setViewingJobType(freshJobType);
    } catch (err) {
      // If fetching fails, keep using the existing data
      console.error("Failed to fetch job type details:", err);
    } finally {
      setIsLoadingView(false);
    }
  };

  const handleDeleteClick = (jobType: JobType) => {
    setDeletingJobType(jobType);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingJobType) return;

    try {
      setIsDeleting(true);
      await jobTypeService.deleteJobType(deletingJobType.id);
      const deletedName =
        deletingJobType.name?.trim() || `Job Type #${deletingJobType.id}`;
      showToast("Job type deleted", `${deletedName} has been deleted`);
      setShowDeleteModal(false);
      setDeletingJobType(null);
      await fetchJobTypes();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to delete job type";
      showError("Unable to delete job type", message);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleModalSubmit = async (values: CreateJobTypePayload) => {
    try {
      setIsSaving(true);
      const jobTypeName =
        values.name?.trim() || editingJobType?.name || "Job type";
      if (editingJobType) {
        await jobTypeService.updateJobType(editingJobType.id, values);
        showToast(
          "Job type updated",
          `${jobTypeName} has been updated successfully`
        );
      } else {
        await jobTypeService.createJobType(values);
        showToast(
          "Job type created",
          `${jobTypeName} has been created successfully`
        );
      }
      setIsModalOpen(false);
      setEditingJobType(null);
      await fetchJobTypes();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to save job type";
      showError("Unable to save job type", message);
      throw err;
    } finally {
      setIsSaving(false);
    }
  };

  const IconComponent = Briefcase;

  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
        <div>
          <h1 className={`text-2xl font-bold ${tw.textPrimary}`}>
            {t.jobs.jobTypes}
          </h1>
          <p className={`${tw.textSecondary} mt-2 text-sm`}>
            Manage the classification codes used when creating scheduled jobs.
          </p>
        </div>
        <div className="flex justify-end">
          <button
            onClick={handleCreate}
            className="px-4 py-2 rounded-md font-semibold flex items-center gap-2 text-sm text-white"
            style={{ backgroundColor: color.primary.action }}
          >
            <Plus className="w-4 h-4" />
            Create Job Type
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-md border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2">
            <Briefcase
              className="h-5 w-5"
              style={{ color: color.primary.accent }}
            />
            <p className="text-sm font-medium text-gray-600">Total Job Types</p>
          </div>
          <p className="mt-2 text-3xl font-bold text-gray-900">
            {isLoadingStats ? "..." : stats.totalJobTypes}
          </p>
        </div>
        <div className="rounded-md border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2">
            <Briefcase
              className="h-5 w-5"
              style={{ color: color.primary.accent }}
            />
            <p className="text-sm font-medium text-gray-600">
              Active Job Types
            </p>
          </div>
          <p className="mt-2 text-3xl font-bold text-gray-900">
            {isLoadingStats ? "..." : stats.totalJobs}
          </p>
        </div>
        <div className="rounded-md border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2">
            <AlertTriangle
              className="h-5 w-5"
              style={{ color: color.primary.accent }}
            />
            <p className="text-sm font-medium text-gray-600">
              Unused Job Types
            </p>
          </div>
          <p className="mt-2 text-3xl font-bold text-gray-900">
            {isLoadingStats ? "..." : stats.unusedCount}
          </p>
        </div>
      </div>

      <div className="my-5">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search job types by name, code, or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-[#3b8169] focus:border-transparent"
          />
          {isSearching && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-[#3b8169]"></div>
            </div>
          )}
        </div>
      </div>

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
        ) : filteredJobTypes.length === 0 ? (
          <div className="text-center py-12">
            <IconComponent className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className={`text-lg font-medium ${tw.textPrimary} mb-2`}>
              {searchTerm ? "No Job Types Found" : "No Job Types"}
            </h3>
            <p className={`${tw.textSecondary} mb-6`}>
              {searchTerm
                ? "Try adjusting your search terms."
                : "Create your first job type to get started."}
            </p>
            {!searchTerm && (
              <button
                onClick={handleCreate}
                className="px-4 py-2 rounded-md font-semibold flex items-center gap-2 mx-auto text-sm text-white"
                style={{ backgroundColor: color.primary.action }}
              >
                <Plus className="w-4 h-4" />
                Create Job Type
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
                  <th
                    className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider"
                    style={{
                      color: color.surface.tableHeaderText,
                      backgroundColor: color.surface.tableHeader,
                      borderTopLeftRadius: "0.375rem",
                    }}
                  >
                    Job Type
                  </th>
                  <th
                    className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider"
                    style={{
                      color: color.surface.tableHeaderText,
                      backgroundColor: color.surface.tableHeader,
                    }}
                  >
                    Description
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
                    Created
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
                {filteredJobTypes.map((jobType) => (
                  <tr key={jobType.id} className="transition-colors">
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
                            className={`text-base font-semibold ${tw.textPrimary}`}
                          >
                            {jobType.name}
                          </div>
                          <div className="mt-1 text-xs text-gray-500">
                            ID: {jobType.id}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td
                      className="px-6 py-4"
                      style={{ backgroundColor: color.surface.tablebodybg }}
                    >
                      <div className={`text-sm ${tw.textSecondary} max-w-lg`}>
                        {jobType.description || "No description"}
                      </div>
                    </td>
                    <td
                      className="px-6 py-4"
                      style={{ backgroundColor: color.surface.tablebodybg }}
                    >
                      <span className="text-sm text-gray-900 font-medium">
                        {jobType.code}
                      </span>
                    </td>
                    <td
                      className="px-6 py-4"
                      style={{ backgroundColor: color.surface.tablebodybg }}
                    >
                      <span className="text-sm text-gray-600">
                        <DateFormatter date={jobType.created_at} />
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
                          onClick={() => handleView(jobType)}
                          className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                          aria-label="View job type"
                          title="View"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleEdit(jobType)}
                          className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                          aria-label="Edit job type"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(jobType)}
                          className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors"
                          aria-label="Delete job type"
                          title="Delete"
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

      <JobTypeModal
        isOpen={isModalOpen}
        isSaving={isSaving}
        onClose={() => {
          setIsModalOpen(false);
          setEditingJobType(null);
        }}
        onSubmit={async (values) => {
          await handleModalSubmit(values);
        }}
        initialData={editingJobType}
      />

      <JobTypeViewModal
        isOpen={isViewModalOpen}
        onClose={() => {
          setIsViewModalOpen(false);
          setViewingJobType(null);
        }}
        jobType={viewingJobType}
        isLoading={isLoadingView}
      />

      <DeleteConfirmModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setDeletingJobType(null);
        }}
        onConfirm={handleDeleteConfirm}
        title="Delete Job Type"
        description="Are you sure you want to delete this job type? This will fail if any scheduled jobs still reference this job type."
        itemName={deletingJobType?.name || ""}
        isLoading={isDeleting}
        confirmText="Delete"
        cancelText="Cancel"
      />
    </div>
  );
}
