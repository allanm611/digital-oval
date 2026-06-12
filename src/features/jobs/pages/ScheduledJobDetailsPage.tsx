import { useState, useEffect } from "react";
import Input from '../../../shared/components/ui/Input';
import Textarea from "../../../shared/components/ui/Textarea";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Edit,
  Trash2,
  AlertCircle,
  CheckCircle,
  XCircle,
  History,
  RotateCcw,
  RefreshCw,
  Heart,
  MoreVertical,
  Play,
  Pause,
  Power,
  Archive,
  Activity,
  AlertTriangle,
  TrendingUp,
} from "lucide-react";
import { scheduledJobService } from "../services/scheduledJobService";
import { ScheduledJob } from "../types/scheduledJob";
import { useToast } from "../../../contexts/ToastContext";
import { extractBackendError } from "../../../shared/utils/errorHandler";;;
import { useLanguage } from "../../../contexts/LanguageContext";
import { useAuth } from "../../../contexts/AuthContext";
import LoadingSpinner from "../../../shared/components/ui/LoadingSpinner";
import DeleteConfirmModal from "../../../shared/components/ui/DeleteConfirmModal";
import BackButton from "../../../shared/components/ui/BackButton";
import DateFormatter from "../../../shared/components/DateFormatter";
import { color, tw } from "../../../shared/utils/utils";
import { userService } from "../../users/services/userService";
import { segmentService } from "../../segments/services/segmentService";
import { formatDateWithTimezone } from "../../../shared/services/dateService";
import { getSettingsTimezoneOffset } from "../../../shared/utils/settingsHelper";
import { useDeleteConfirm } from "../../../shared/hooks/useDeleteConfirm";

const formatMetadataKey = (key: string) =>
  key.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());

function renderMetadataValue(value: unknown): JSX.Element {
  if (value === null || value === undefined) {
    return <p className={`text-sm ${tw.textSecondary}`}>—</p>;
  }

  if (Array.isArray(value)) {
    if (value.length === 0) {
      return <p className={`text-sm ${tw.textSecondary}`}>—</p>;
    }

    const isPrimitiveArray = value.every(
      (item) => typeof item !== "object" || item === null
    );

    if (isPrimitiveArray) {
      return (
        <p className={`text-sm ${tw.textSecondary}`}>
          {value.map((item) => String(item)).join(", ")}
        </p>
      );
    }

    return (
      <div className="space-y-2">
        {value.map((item, idx) => (
          <div key={idx}>
            <p className="text-xs font-semibold text-gray-600 mb-1">
              Item {idx + 1}
            </p>
            <div className="text-sm text-gray-800">
              {renderMetadataValue(item)}
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>);

    if (entries.length === 0) {
      return <p className={`text-sm ${tw.textSecondary}`}>—</p>;
    }

    return (
      <div className="space-y-2">
        {entries.map(([childKey, childValue]) => (
          <div key={childKey}>
            <p className="text-xs font-semibold text-gray-600">
              {formatMetadataKey(childKey)}
            </p>
            <div className="mt-1">{renderMetadataValue(childValue)}</div>
          </div>
        ))}
      </div>
    );
  }

  if (typeof value === "boolean") {
    return (
      <p className={`text-sm ${tw.textSecondary}`}>{value ? "Yes" : "No"}</p>
    );
  }

  return <p className={`text-sm ${tw.textSecondary}`}>{String(value)}</p>;
}

export default function ScheduledJobDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { error: showError, success: showToast } = useToast();
  const { t } = useLanguage();
  const { user } = useAuth();

  const [job, setJob] = useState<ScheduledJob | null>(null);
  const { deleteConfirm, isDeleting, openDeleteConfirm, closeDeleteConfirm, handleDelete } = useDeleteConfirm({ onDelete: async (id) => {}, itemLabel: "Item", });
  const [isLoading, setIsLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [newTag, setNewTag] = useState("");
  const [newRecipient, setNewRecipient] = useState("");
  const [isAddingTag, setIsAddingTag] = useState(false);
  const [isAddingRecipient, setIsAddingRecipient] = useState(false);
  const [versions, setVersions] = useState<ScheduledJob[]>([]);
  const [isLoadingVersions, setIsLoadingVersions] = useState(false);
  const [health, setHealth] = useState<{
    health_status?: string;
    success_streak?: number;
    sla_risk?: string;
    dependency_readiness?: boolean;
    last_run_status?: string | null;
    next_run_at?: string | null;
    [key: string]: unknown; // Allow additional fields from API
  } | null>(null);
  const [isLoadingHealth, setIsLoadingHealth] = useState(false);
  const [userNames, setUserNames] = useState<Record<number, string>>({});
  const [systemUserNames, setSystemUserNames] = useState<
    Record<number, string>
  >({});
  const [segmentNames, setSegmentNames] = useState<Record<number, string>>({});
  const [isLoadingSegments, setIsLoadingSegments] = useState(false);

  const showHealthCard =
    isLoadingHealth ||
    (health &&
      (health.health_status ||
        typeof health.success_streak === "number" ||
        health.sla_risk ||
        typeof health.dependency_readiness === "boolean"));

  useEffect(() => {
    if (id) {
      loadJob();
      loadVersions();
      loadHealth();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest(".relative")) {
        setShowMoreMenu(false);
      }
    };
    if (showMoreMenu) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showMoreMenu]);

  const loadJob = async () => {
    if (!id) return;
    setIsLoading(true);
    try {
      const data = await scheduledJobService.getScheduledJobById(Number(id));
      setJob(data);

      // Fetch user names for created_by and updated_by
      const userIds = new Set<number>();
      if (data.created_by) userIds.add(data.created_by);
      if (data.updated_by) userIds.add(data.updated_by);

      if (userIds.size > 0) {
        const nameMap: Record<number, string> = {};
        await Promise.all(
          Array.from(userIds).map(async (userId) => {
            try {
              const userResponse = await userService.getUserById(userId, true);
              if (userResponse.data) {
                nameMap[userId] =
                  userResponse.data.username || `User #${userId}`;
              }
            } catch (err) {
              console.error(`Failed to load user ${userId}:`, err);
              nameMap[userId] = `User #${userId}`;
            }
          })
        );
        setSystemUserNames((prev) => ({ ...prev, ...nameMap }));
      }

      // Fetch segment names for campaign metadata
      if (data.metadata && typeof data.metadata === "object") {
        const metadata = data.metadata as Record<string, unknown>;
        if (Array.isArray(metadata.segments)) {
          const segmentIds = metadata.segments
            .map((seg: any) => seg.segment_id)
            .filter((id: unknown) => typeof id === "number");

          if (segmentIds.length > 0) {
            setIsLoadingSegments(true);
            const nameMap: Record<number, string> = {};
            await Promise.all(
              segmentIds.map(async (segmentId: number) => {
                try {
                  const segment = await segmentService.getSegmentById(segmentId, true);
                  nameMap[segmentId] = segment.name || `Segment #${segmentId}`;
                } catch (err) {
                  console.error(`Failed to load segment ${segmentId}:`, err);
                  nameMap[segmentId] = `Segment #${segmentId}`;
                }
              })
            );
            setSegmentNames(nameMap);
            setIsLoadingSegments(false);
          }
        }
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : t("scheduledJob.loadFailed", "Failed to load scheduled job");
      showError(t("scheduledJob.unableToLoad", "Unable to load scheduled job"), message, true);
      console.error("Error loading job:", err); // Debug log
    } finally {
      setIsLoading(false);
    }
  };

  const loadVersions = async () => {
    if (!id) return;
    setIsLoadingVersions(true);
    try {
      const response = await scheduledJobService.getVersions(Number(id), true);
      const versionsList = response.data || [];
      setVersions(versionsList);

      // Fetch user names for created_by fields
      const userIds = new Set<number>();
      versionsList.forEach((version) => {
        if (version.created_by) userIds.add(version.created_by);
      });

      // Fetch user names
      const nameMap: Record<number, string> = {};
      await Promise.all(
        Array.from(userIds).map(async (userId) => {
          try {
            const userResponse = await userService.getUserById(userId, true);
            if (userResponse.data) {
              nameMap[userId] = userResponse.data.username || `User #${userId}`;
            }
          } catch (err) {
            console.error(`Failed to load user ${userId}:`, err);
            nameMap[userId] = `User #${userId}`;
          }
        })
      );
      setUserNames((prev) => ({ ...prev, ...nameMap }));
    } catch (err) {
      console.error("Failed to load versions:", err);
    } finally {
      setIsLoadingVersions(false);
    }
  };

  const loadHealth = async () => {
    if (!id) return;
    setIsLoadingHealth(true);
    try {
      const healthData = await scheduledJobService.getJobHealth(
        Number(id),
        true
      );
      setHealth(healthData);
    } catch (err) {
      console.error("Failed to load health:", err);
    } finally {
      setIsLoadingHealth(false);
    }
  };

  const handleDelete = async () => {
    if (!job) return;
    try {
      setIsDeleting(true);
      await scheduledJobService.deleteScheduledJob(job.id);
      showToast(
        t("scheduledJob.deleted", "Scheduled job deleted"),
        t("scheduledJob.deleteSuccess", `"${job.name}" has been deleted successfully.`)
      );
      navigate("/dashboard/scheduled-jobs");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : t("scheduledJob.deleteFailed", "Failed to delete scheduled job");
      showError(t("scheduledJob.unableToDelete", "Unable to delete scheduled job"), message, true);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleStatusAction = async (
    action: "activate" | "deactivate" | "pause" | "archive"
  ) => {
    if (!job) return;
    setIsActionLoading(true);
    try {
      let updatedJob: ScheduledJob;
      switch (action) {
        case "activate":
          updatedJob = await scheduledJobService.activateScheduledJob(job.id);
          showToast(
            t.scheduledJob?.["activated"] || "Job activated",
            t.scheduledJob?.["activatedSuccess"] || `"${job.name}" has been activated`
          );
          break;
        case "deactivate":
          updatedJob = await scheduledJobService.deactivateScheduledJob(job.id);
          showToast(
            t.scheduledJob?.["deactivated"] || "Job deactivated",
            t.scheduledJob?.["deactivatedSuccess"] || `"${job.name}" has been deactivated`
          );
          break;
        case "pause":
          updatedJob = await scheduledJobService.pauseScheduledJob(job.id);
          showToast(
            t.scheduledJob?.["paused"] || "Job paused",
            t.scheduledJob?.["pausedSuccess"] || `"${job.name}" has been paused`
          );
          break;
        case "archive":
          updatedJob = await scheduledJobService.archiveScheduledJob(job.id);
          showToast(
            t.scheduledJob?.["archived"] || "Job archived",
            t.scheduledJob?.["archivedSuccess"] || `"${job.name}" has been archived`
          );
          break;
      }
      setJob(updatedJob);
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : t.scheduledJob?.["actionFailed"] || `Failed to ${action} scheduled job`;
      showError(
        t.scheduledJob?.["unableToAction"] || `Unable to ${action} scheduled job`,
        message,
        true
      );
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleAddTag = async () => {
    if (!job || !newTag.trim()) return;
    setIsAddingTag(true);
    try {
      const updatedJob = await scheduledJobService.addTag(
        job.id,
        newTag.trim()
      );
      setJob(updatedJob);
      setNewTag("");
      showToast(t("scheduledJob.tagAdded", "Tag added"), t("scheduledJob.tagAddSuccess", "Tag has been added successfully"));
    } catch (err) {
      showError(
        t("scheduledJob.tagAddFailed", "Failed to add tag"),
        err instanceof Error ? err.message : t("common.error", "Unknown error"),
        true
      );
    } finally {
      setIsAddingTag(false);
    }
  };

  const handleRemoveTag = async (tag: string) => {
    if (!job) return;
    try {
      const updatedJob = await scheduledJobService.removeTag(job.id, tag);
      setJob(updatedJob);
      showToast(t("scheduledJob.tagRemoved", "Tag removed"), t("scheduledJob.tagRemoveSuccess", "Tag has been removed successfully"));
    } catch (err) {
      showError(
        t("scheduledJob.tagRemoveFailed", "Failed to remove tag"),
        err instanceof Error ? err.message : t("common.error", "Unknown error"),
        true
      );
    }
  };

  const handleAddRecipient = async () => {
    if (!job || !newRecipient.trim()) return;
    setIsAddingRecipient(true);
    try {
      // API expects "recipient" (singular), not "recipients" (plural)
      const updatedJob = await scheduledJobService.addNotificationRecipients(
        job.id,
        {
          recipient: newRecipient.trim(),
        }
      );
      setJob(updatedJob);
      setNewRecipient("");
      showToast(
        t("scheduledJob.recipientAdded", "Recipient added"),
        t("scheduledJob.recipientAddSuccess", "Notification recipient has been added successfully")
      );
    } catch (err) {
      showError(
        t("scheduledJob.recipientAddFailed", "Failed to add recipient"),
        err instanceof Error ? err.message : t("common.error", "Unknown error"),
        true
      );
    } finally {
      setIsAddingRecipient(false);
    }
  };

  const handleRemoveRecipient = async (recipient: string) => {
    if (!job) return;
    try {
      const updatedJob = await scheduledJobService.removeNotificationRecipient(
        job.id,
        recipient
      );
      setJob(updatedJob);
      showToast(
        t("scheduledJob.recipientRemoved", "Recipient removed"),
        t("scheduledJob.recipientRemoveSuccess", "Notification recipient has been removed successfully")
      );
    } catch (err) {
      showError(
        t("scheduledJob.recipientRemoveFailed", "Failed to remove recipient"),
        err instanceof Error ? err.message : t("common.error", "Unknown error"),
        true
      );
    }
  };

  const handleResetFailureCount = async () => {
    if (!job) return;
    setIsActionLoading(true);
    try {
      const updatedJob = await scheduledJobService.resetFailureCount(job.id);
      setJob(updatedJob);
      showToast(t("scheduledJob.failureCountReset", "Failure count reset"), t("scheduledJob.failureCountResetSuccess", "Failure counters have been reset"));
    } catch (err) {
      showError(
        t("scheduledJob.resetFailureFailed", "Failed to reset failure count"),
        err instanceof Error ? err.message : t("common.error", "Unknown error"),
        true
      );
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleCreateVersion = async () => {
    if (!job || !user) return;
    setIsActionLoading(true);
    try {
      await scheduledJobService.createVersion(job.id, {
        created_by: user?.user_id ?? null,
      });
      showToast(t("scheduledJob.versionCreated", "Version created"), t("scheduledJob.versionSnapshot", "Job version snapshot has been created"));
      loadVersions();
      loadJob(); // Reload to get updated version number
    } catch (err) {
      showError(
        t("scheduledJob.versionCreateFailed", "Failed to create version"),
        err instanceof Error ? err.message : t("common.error", "Unknown error"),
        true
      );
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleRollbackVersion = async (versionId: number) => {
    if (!job || !user) return;
    if (
      !window.confirm(
        t("scheduledJob.rollbackConfirm", "Are you sure you want to rollback to this version? This will restore the job configuration to this snapshot.")
      )
    ) {
      return;
    }
    setIsActionLoading(true);
    try {
      const updatedJob = await scheduledJobService.rollbackVersion(
        job.id,
        versionId,
        {
          created_by: user?.user_id ?? null,
          reason: t("scheduledJob.rollbackReason", `Rollback to version ${versionId} at ${formatDateWithTimezone(new Date(), getSettingsTimezoneOffset(), "default", true)}`),
        }
      );
      setJob(updatedJob);
      showToast(
        t("scheduledJob.versionRolledBack", "Version rolled back"),
        t("scheduledJob.rollbackSuccess", "Job has been restored to the selected version")
      );
      loadVersions();
    } catch (err) {
      showError(
        t("scheduledJob.rollbackFailed", "Failed to rollback version"),
        err instanceof Error ? err.message : t("common.error", "Unknown error"),
        true
      );
    } finally {
      setIsActionLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  if (!job) {
    return (
      <div className=" p-6">
        <div className="text-center py-12">
          <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className={`text-lg font-medium ${tw.textPrimary} mb-2`}>
            Scheduled Job Not Found
          </h3>
          <p className={tw.textSecondary}>
            The scheduled job you're looking for doesn't exist or has been
            deleted.
          </p>
          <button
            onClick={() => navigate(-1)}
            className={`mt-4 px-4 py-2 ${tw.rounded} font-semibold text-white`}
            style={{ backgroundColor: color.primary.action }}
          >
            Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="">
      {/* Header */}
      <BackButton
       
        showBreadcrumb={true}
        currentLabel="Scheduled Job Details"
      />
      <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
        <div>
          <h1 className={`text-2xl font-bold ${tw.textPrimary}`}>
            {job.name || "Loading..."}
          </h1>
        </div>
        <div className="flex items-center gap-3 flex-wrap relative">
          <button
            onClick={() => navigate(`/dashboard/scheduled-jobs/${job.id}/edit`)}
            className={`inline-flex items-center gap-2 ${tw.rounded} px-4 py-2 text-sm font-medium ${tw.primaryAction}`}
            style={{ backgroundColor: color.primary.action }}
          >
            <Edit className="h-4 w-4" />
            Edit
          </button>

          {/* More Actions Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowMoreMenu(!showMoreMenu)}
              disabled={isActionLoading}
              className={`inline-flex items-center gap-2 ${tw.rounded} border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <MoreVertical className="h-4 w-4" />
              More
            </button>
            {showMoreMenu && (
              <div className={`absolute right-0 mt-2 w-48 ${tw.rounded} bg-white shadow-lg ring-1 ring-black ring-opacity-5 z-10`}>
                <div className="py-1">
                  {job?.status !== "active" && (
                    <button
                      onClick={() => {
                        handleStatusAction("activate");
                        setShowMoreMenu(false);
                      }}
                      disabled={isActionLoading}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2 disabled:opacity-50"
                    >
                      <Play className="h-4 w-4" />
                      Activate
                    </button>
                  )}
                  {job?.status === "active" && (
                    <button
                      onClick={() => {
                        handleStatusAction("pause");
                        setShowMoreMenu(false);
                      }}
                      disabled={isActionLoading}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2 disabled:opacity-50"
                    >
                      <Pause className="h-4 w-4" />
                      Pause
                    </button>
                  )}
                  <button
                    onClick={() => {
                      handleStatusAction("deactivate");
                      setShowMoreMenu(false);
                    }}
                    disabled={isActionLoading}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2 disabled:opacity-50"
                  >
                    <Power className="h-4 w-4" />
                    Deactivate
                  </button>
                  <button
                    onClick={() => {
                      handleStatusAction("archive");
                      setShowMoreMenu(false);
                    }}
                    disabled={isActionLoading}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2 disabled:opacity-50"
                  >
                    <Archive className="h-4 w-4" />
                    Archive
                  </button>
                </div>
              </div>
            )}
          </div>

          <button
            onClick={() => openDeleteConfirm(item?.id || 0, item?.name || "")}
            className={`inline-flex items-center gap-2 ${tw.rounded} px-4 py-2 text-sm font-semibold text-white bg-red-600`}
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="">
        {/* Performance Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <div
            className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm`}
          >
            <div className="flex items-center gap-2">
              <Activity
                className="h-5 w-5"
                style={{ color: color.primary.accent }}
              />
              <p className="text-sm font-medium text-gray-600">Total Runs</p>
            </div>
            <p className="mt-2 text-3xl font-bold text-gray-900">
              {job.total_executions}
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
              <p className="text-sm font-medium text-gray-600">Failed</p>
            </div>
            <p className="mt-2 text-3xl font-bold text-red-600">
              {job.total_failures}
            </p>
          </div>
          <div
            className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm`}
          >
            <div className="flex items-center gap-2">
              <AlertCircle
                className="h-5 w-5"
                style={{ color: color.primary.accent }}
              />
              <p className="text-sm font-medium text-gray-600">
                Consecutive Failures
              </p>
            </div>
            <p
              className={`mt-2 text-3xl font-bold ${
                job.consecutive_failures > 0 ? "text-red-600" : "text-green-600"
              }`}
            >
              {job.consecutive_failures}
            </p>
          </div>
          {job.success_rate_percent !== null && (
            <div
              className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm`}
            >
              <div className="flex items-center gap-2">
                <TrendingUp
                  className="h-5 w-5"
                  style={{ color: color.primary.accent }}
                />
                <p className="text-sm font-medium text-gray-600">Success Rate</p>
              </div>
              <p
                className={`mt-2 text-3xl font-bold ${
                  job.success_rate_percent >= 90
                    ? "text-green-600"
                    : job.success_rate_percent >= 70
                      ? "text-yellow-600"
                      : "text-red-600"
                }`}
              >
                {job.success_rate_percent}%
              </p>
            </div>
          )}
        </div>

        {/* Basic Information */}
        <div className={`bg-white ${tw.rounded} border border-gray-200 p-6`}>
          <h2 className={`text-lg font-semibold ${tw.textPrimary} mb-4`}>
            Basic Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Name
              </label>
              <p className={`text-sm ${tw.textSecondary}`}>{job.name}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Code
              </label>
              <p className={`text-sm ${tw.textSecondary}`}>{job.code}</p>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <p className={`text-sm ${tw.textSecondary}`}>
                {job.description || "—"}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Job Type ID
              </label>
              <p className={`text-sm ${tw.textSecondary}`}>
                {job.job_type_id || "—"}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Job Category
              </label>
              <p className={`text-sm ${tw.textSecondary}`}>
                {job.job_category || "—"}
              </p>
            </div>
          </div>
        </div>

        {/* Schedule Configuration */}
        <div className={`bg-white ${tw.rounded} border border-gray-200 p-6`}>
          <h2 className={`text-lg font-semibold ${tw.textPrimary} mb-4`}>
            Schedule Configuration
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Schedule Type
              </label>
              <p className={`text-sm ${tw.textSecondary} capitalize`}>
                {job.schedule_type ? job.schedule_type.replace("_", " ") : "—"}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Timezone
              </label>
              <p className={`text-sm ${tw.textSecondary}`}>{job.timezone}</p>
            </div>
            {job.cron_expression && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cron Expression
                </label>
                <p className={`text-sm ${tw.textSecondary} font-mono`}>
                  {job.cron_expression}
                </p>
              </div>
            )}
            {job.interval_seconds && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Interval (seconds)
                </label>
                <p className={`text-sm ${tw.textSecondary}`}>
                  {job.interval_seconds}
                </p>
              </div>
            )}
            {job.starts_at && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Starts At
                </label>
                <p className={`text-sm ${tw.textSecondary}`}>
                  <DateFormatter date={job.starts_at} useUserTimezone includeTime />
                </p>
              </div>
            )}
            {job.ends_at && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ends At
                </label>
                <p className={`text-sm ${tw.textSecondary}`}>
                  <DateFormatter date={job.ends_at} />
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Execution Details */}
        <div className={`bg-white ${tw.rounded} border border-gray-200 p-6`}>
          <h2 className={`text-lg font-semibold ${tw.textPrimary} mb-4`}>
            How the Job Runs
          </h2>
          <div className="">
            {/* Behavior Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className={`${tw.rounded} border border-gray-200 bg-white p-4`}>
                <label className="block text-xs font-semibold text-gray-600 uppercase mb-2">
                  Processing Mode
                </label>
                <p className={`text-sm font-medium ${tw.textPrimary}`}>
                  {job.processing_mode || "—"}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  How data is processed: batch, streaming, or real-time
                </p>
              </div>
              <div className={`${tw.rounded} border border-gray-200 bg-white p-4`}>
                <label className="block text-xs font-semibold text-gray-600 uppercase mb-2">
                  Priority
                </label>
                <div className="flex items-center gap-2">
                  <p className={`text-sm font-medium ${tw.textPrimary}`}>{job.priority}/100</p>
                  <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500"
                      style={{ width: `${job.priority}%` }}
                    />
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  How important this job is relative to others
                </p>
              </div>
            </div>

            {/* Resource & Timeout Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className={`${tw.rounded} border border-gray-200 bg-white p-4`}>
                <label className="block text-xs font-semibold text-gray-600 uppercase mb-2">
                  Max Concurrent Runs
                </label>
                <p className={`text-sm font-medium ${tw.textPrimary}`}>
                  {job.max_concurrent_executions} execution{job.max_concurrent_executions !== 1 ? 's' : ''}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  How many times the job can run at the same time
                </p>
              </div>
              <div className={`${tw.rounded} border border-gray-200 bg-white p-4`}>
                <label className="block text-xs font-semibold text-gray-600 uppercase mb-2">
                  Time Limit per Run
                </label>
                <p className={`text-sm font-medium ${tw.textPrimary}`}>
                  {job.execution_timeout_minutes} minute{job.execution_timeout_minutes !== 1 ? 's' : ''}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Job will stop if it runs longer than this
                </p>
              </div>
            </div>

            {/* Resource Allocation Section */}
            {(job.resource_pool || job.max_memory_mb || job.max_cpu_cores) && (
              <div className="pt-4 border-t border-gray-200">
                <p className="text-xs font-semibold text-gray-600 uppercase mb-3">
                  Resource Allocation
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {job.resource_pool && (
                    <div className={`${tw.rounded} border border-gray-200 bg-white p-4`}>
                      <p className="text-xs text-gray-600 mb-1">Resource Pool</p>
                      <p className={`text-sm font-medium ${tw.textPrimary}`}>
                        {job.resource_pool}
                      </p>
                    </div>
                  )}
                  {job.max_memory_mb && (
                    <div className={`${tw.rounded} border border-gray-200 bg-white p-4`}>
                      <p className="text-xs text-gray-600 mb-1">Max Memory</p>
                      <p className={`text-sm font-medium ${tw.textPrimary}`}>
                        {job.max_memory_mb} MB
                      </p>
                    </div>
                  )}
                  {job.max_cpu_cores && (
                    <div className={`${tw.rounded} border border-gray-200 bg-white p-4`}>
                      <p className="text-xs text-gray-600 mb-1">Max CPU Cores</p>
                      <p className={`text-sm font-medium ${tw.textPrimary}`}>
                        {job.max_cpu_cores} core{job.max_cpu_cores !== 1 ? 's' : ''}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Execution History */}
        <div className={`bg-white ${tw.rounded} border border-gray-200 p-6`}>
          <h2 className={`text-lg font-semibold ${tw.textPrimary} mb-4`}>
            Execution History
          </h2>
          <div className="">
            {/* Timeline Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className={`${tw.rounded} border border-gray-200 bg-white p-4`}>
                <label className="block text-xs font-semibold text-gray-600 uppercase mb-2">
                  Last Run
                </label>
                <p className={`text-sm font-medium ${tw.textPrimary}`}>
                  <DateFormatter date={job.last_run_at} />
                </p>
                {job.last_run_status && (
                  <span className="inline-block mt-2 px-2 py-1 text-xs font-medium rounded bg-white text-gray-700">
                    {job.last_run_status}
                  </span>
                )}
              </div>
              <div className={`${tw.rounded} border border-gray-200 bg-white p-4`}>
                <label className="block text-xs font-semibold text-gray-600 uppercase mb-2">
                  Next Run
                </label>
                <p className={`text-sm font-medium ${tw.textPrimary}`}>
                  <DateFormatter date={job.next_run_at} />
                </p>
              </div>
            </div>

            {/* Success/Failure Timeline */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className={`${tw.rounded} border border-gray-200 bg-white p-4`}>
                <label className="block text-xs font-semibold text-gray-600 uppercase mb-2">
                  Last Success
                </label>
                <p className={`text-sm font-medium ${tw.textPrimary}`}>
                  <DateFormatter date={job.last_success_at} />
                </p>
              </div>
              <div className={`${tw.rounded} border border-gray-200 bg-white p-4`}>
                <label className="block text-xs font-semibold text-gray-600 uppercase mb-2">
                  Last Failure
                </label>
                <p className={`text-sm font-medium ${tw.textPrimary}`}>
                  <DateFormatter date={job.last_failure_at} />
                </p>
              </div>
            </div>


            {/* Action */}
            {job.consecutive_failures > 0 && (
              <div className="pt-4 border-t border-gray-200">
                <button
                  onClick={handleResetFailureCount}
                  disabled={isActionLoading}
                  className={`inline-flex items-center gap-2 ${tw.rounded} border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50`}
                >
                  <RefreshCw className="h-4 w-4" />
                  Reset Failure Count
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Ownership */}
        <div className={`bg-white ${tw.rounded} border border-gray-200 p-6`}>
          <h2 className={`text-lg font-semibold ${tw.textPrimary} mb-4`}>
            Ownership
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Business Owner
              </label>
              <p className={`text-sm ${tw.textSecondary}`}>
                {job.business_owner || "—"}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Technical Owner ID
              </label>
              <p className={`text-sm ${tw.textSecondary}`}>
                {job.technical_owner_id || "—"}
              </p>
            </div>
          </div>
        </div>

        {/* Dependencies */}
        {(job.depends_on_jobs && job.depends_on_jobs.length > 0) ||
        (job.triggers_on_success && job.triggers_on_success.length > 0) ||
        (job.triggers_on_failure && job.triggers_on_failure.length > 0) ? (
          <div className={`bg-white ${tw.rounded} border border-gray-200 p-6`}>
            <h2 className={`text-lg font-semibold ${tw.textPrimary} mb-4`}>
              Dependencies
            </h2>
            <div className="space-y-4">
              {job.depends_on_jobs && job.depends_on_jobs.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Depends On Jobs
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {job.depends_on_jobs.map((jobId) => (
                      <span
                        key={jobId}
                        className="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800"
                      >
                        Job #{jobId}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {job.triggers_on_success &&
                job.triggers_on_success.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Triggers On Success
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {job.triggers_on_success.map((jobId) => (
                        <span
                          key={jobId}
                          className="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium bg-green-100 text-green-800"
                        >
                          Job #{jobId}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              {job.triggers_on_failure &&
                job.triggers_on_failure.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Triggers On Failure
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {job.triggers_on_failure.map((jobId) => (
                        <span
                          key={jobId}
                          className="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium bg-red-100 text-red-800"
                        >
                          Job #{jobId}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Dependency Mode
                </label>
                <p className={`text-sm ${tw.textSecondary}`}>
                  {job.dependency_mode
                    ? job.dependency_mode.replace("_", " ")
                    : "—"}
                </p>
              </div>
            </div>
          </div>
        ) : null}

        {/* Notifications */}
        <div className={`bg-white ${tw.rounded} border border-gray-200 p-6`}>
          <h2 className={`text-lg font-semibold ${tw.textPrimary} mb-4`}>
            Notifications
          </h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-700">Notify on Success</span>
              {job.notify_on_success ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <XCircle className="h-5 w-5 text-gray-400" />
              )}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-700">Notify on Failure</span>
              {job.notify_on_failure ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <XCircle className="h-5 w-5 text-gray-400" />
              )}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-700">
                Notify on SLA Breach
              </span>
              {job.notify_on_sla_breach ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <XCircle className="h-5 w-5 text-gray-400" />
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Recipients
              </label>
              {job.notification_recipients &&
                job.notification_recipients.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {job.notification_recipients.map((recipient, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800"
                      >
                        {recipient}
                        <button
                          onClick={() => handleRemoveRecipient(recipient)}
                          className="ml-1 hover:text-blue-900"
                          aria-label={`Remove ${recipient}`}
                        >
                          <XCircle className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              <div className="flex gap-2">
                <Input
                  type="text"
                  value={newRecipient}
                  onChange={(value) => setNewRecipient(String(value))}
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddRecipient();
                    }
                  }}
                  placeholder="Enter email address"
                  className={`flex-1 ${tw.rounded} border border-gray-300 px-3 py-1.5 text-sm focus:border-[#3b8169] focus:outline-none focus:ring-1 focus:ring-[#3b8169]`}
                />
                <button
                  type="button"
                  onClick={handleAddRecipient}
                  disabled={isAddingRecipient || !newRecipient.trim()}
                  className={`${tw.rounded} border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50`}
                >
                  Add
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Tags */}
        <div className={`bg-white ${tw.rounded} border border-gray-200 p-6`}>
          <h2 className={`text-lg font-semibold ${tw.textPrimary} mb-4`}>
            Tags
          </h2>
          {job.tags && job.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {job.tags.map((tag, idx) => {
                const tagName = typeof tag === "object" && tag !== null ? (tag as any).name || String(tag) : String(tag);
                return (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800"
                  >
                    {tagName}
                    <button
                      onClick={() => handleRemoveTag(tag)}
                      className="ml-1 hover:text-gray-900"
                      aria-label={`Remove ${tagName}`}
                    >
                      <XCircle className="h-3 w-3" />
                    </button>
                  </span>
                );
              })}
            </div>
          )}
          <div className="flex gap-2">
            <Input
              type="text"
              value={newTag}
              onChange={(value) => setNewTag(String(value))}
              onKeyPress={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAddTag();
                }
              }}
              placeholder="Enter tag name"
              className={`flex-1 ${tw.rounded} border border-gray-300 px-3 py-1.5 text-sm focus:border-[#3b8169] focus:outline-none focus:ring-1 focus:ring-[#3b8169]`}
            />
            <button
              type="button"
              onClick={handleAddTag}
              disabled={isAddingTag || !newTag.trim()}
              className={`${tw.rounded} border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50`}
            >
              Add
            </button>
          </div>
        </div>

        {/* Metadata */}
        <div className={`bg-white ${tw.rounded} border border-gray-200 p-6`}>
          <h2 className={`text-lg font-semibold ${tw.textPrimary} mb-4`}>
            Metadata
          </h2>
          {job.metadata && Object.keys(job.metadata || {}).length > 0 ? (
            <div className="">
              {/* Non-segment metadata fields on one line */}
              {(() => {
                const otherFields: Record<string, unknown> = {};
                Object.entries(job.metadata as Record<string, unknown>).forEach(([key, value]) => {
                  if (key !== "segments") {
                    otherFields[key] = value;
                  }
                });

                if (Object.keys(otherFields).length > 0) {
                  return (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      {Object.entries(otherFields).map(([key, value]) => (
                        <div key={key}>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            {formatMetadataKey(key)}
                          </label>
                          {renderMetadataValue(value)}
                        </div>
                      ))}
                    </div>
                  );
                }
              })()}

              {/* Segments - Compact list format */}
              {(() => {
                const segments = (job.metadata as Record<string, unknown>).segments;
                if (segments && Array.isArray(segments) && segments.length > 0) {
                  const isSegmentArray = segments.every(
                    (item) => item && typeof item === "object" && ("segment_id" in item || "channel_codes" in item)
                  );

                  if (isSegmentArray) {
                    return (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-3">
                          Segments
                        </label>
                        <div className="space-y-2">
                          {segments.map((segment: any, idx: number) => {
                            const segmentName = segmentNames[segment.segment_id] || `Segment #${segment.segment_id}`;
                            return (
                              <div key={idx} className="flex items-center gap-3">
                                <button
                                  onClick={() => navigate(`/dashboard/segments/${segment.segment_id}`)}
                                  className="text-sm font-medium hover:underline transition-colors"
                                  style={{ color: color.primary.accent }}
                                  type="button"
                                >
                                  {segmentName}
                                </button>
                                <span className="text-gray-400">→</span>
                                <div className="flex gap-2 flex-wrap">
                                  {Array.isArray(segment.channel_codes) && segment.channel_codes.length > 0 ? (
                                    segment.channel_codes.map((channel: string) => (
                                      <span
                                        key={channel}
                                        className="text-sm text-gray-900"
                                      >
                                        {channel}
                                      </span>
                                    ))
                                  ) : (
                                    <span className="text-sm text-gray-500">—</span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  }
                }
              })()}
            </div>
          ) : (
            <p className="text-sm text-gray-500">No metadata available.</p>
          )}
        </div>

        {showHealthCard && (
          <div className={`bg-white ${tw.rounded} border border-gray-200 p-6`}>
            <h2
              className={`text-lg font-semibold ${tw.textPrimary} mb-4 flex items-center gap-2`}
            >
              <Heart className="h-5 w-5" />
              Health Status
            </h2>
            {isLoadingHealth ? (
              <div className="text-center py-4">
                <LoadingSpinner />
              </div>
            ) : health ? (
              <div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Health Status
                    </label>
                    <p
                      className={`text-sm font-medium ${
                        health.health_status === "healthy"
                          ? "text-green-600"
                          : health.health_status === "warning"
                          ? "text-amber-600"
                          : health.health_status
                          ? "text-red-600"
                          : tw.textSecondary
                      }`}
                    >
                      {health.health_status || "—"}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Success Streak
                    </label>
                    <p className={`text-sm ${tw.textSecondary}`}>
                      {health.success_streak ?? "—"} runs
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      SLA Risk
                    </label>
                    <p
                      className={`text-sm font-medium ${
                        health.sla_risk === "low"
                          ? "text-green-600"
                          : health.sla_risk === "medium"
                          ? "text-amber-600"
                          : health.sla_risk === "high"
                          ? "text-red-600"
                          : tw.textSecondary
                      }`}
                    >
                      {health.sla_risk || "—"}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Dependencies Ready
                    </label>
                    <p className={`text-sm ${tw.textSecondary}`}>
                      {health.dependency_readiness !== undefined
                        ? health.dependency_readiness
                          ? "Yes"
                          : "No"
                        : "—"}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-500 text-center py-4">
                Health data not available
              </p>
            )}
          </div>
        )}

        {/* Versions */}
        <div className={`bg-white ${tw.rounded} border border-gray-200 p-6`}>
          <div className="flex items-center justify-between mb-4">
            <h2
              className={`text-lg font-semibold ${tw.textPrimary} flex items-center gap-2`}
            >
              <History className="h-5 w-5" />
              Version History
            </h2>
            <button
              onClick={handleCreateVersion}
              disabled={isActionLoading}
              className={`inline-flex items-center gap-2 ${tw.rounded} border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50`}
            >
              <History className="h-4 w-4" />
              Create Snapshot
            </button>
          </div>
          {isLoadingVersions ? (
            <div className="text-center py-4">
              <LoadingSpinner />
            </div>
          ) : versions.length > 0 ? (
            <div className="space-y-2">
              {versions.map((version) => (
                <div
                  key={version.id}
                  className={`flex items-center justify-between p-3 border border-gray-200 ${tw.rounded}`}
                >
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      Version {version.version}
                    </p>
                    <p className="text-xs text-gray-500">
                      <DateFormatter date={version.created_at} useUserTimezone includeTime />
                      {version.created_by && (
                        <span className="ml-2">
                          • Created by{" "}
                          {userNames[version.created_by] ||
                            `User #${version.created_by}`}
                        </span>
                      )}
                    </p>
                  </div>
                  {version.id !== job?.id && (
                    <button
                      onClick={() => handleRollbackVersion(version.id)}
                      disabled={isActionLoading}
                      className={`inline-flex items-center gap-1 ${tw.rounded} border border-gray-200 px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50`}
                    >
                      <RotateCcw className="h-3 w-3" />
                      Rollback
                    </button>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 text-center py-4">
              No version history available
            </p>
          )}
        </div>

        {/* System Info */}
        <div className={`bg-white ${tw.rounded} border border-gray-200 p-6`}>
          <h2 className={`text-lg font-semibold ${tw.textPrimary} mb-4`}>
            System Information
          </h2>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-700">Version</span>
              <span className={tw.textSecondary}>{job.version}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-700">Job UUID</span>
              <span className={`${tw.textSecondary} font-mono text-xs`}>
                {job.job_uuid}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-700">Created At</span>
              <span className={tw.textSecondary}>
                <DateFormatter date={job.created_at} useUserTimezone includeTime />
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-700">Updated At</span>
              <span className={tw.textSecondary}>
                <DateFormatter date={job.updated_at} useUserTimezone includeTime />
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-700">Created By</span>
              <span className={tw.textSecondary}>
                {job.created_by
                  ? systemUserNames[job.created_by] || `User #${job.created_by}`
                  : "—"}
              </span>
            </div>
            {job.updated_by && (
              <div className="flex justify-between">
                <span className="text-gray-700">Updated By</span>
                <span className={tw.textSecondary}>
                  {systemUserNames[job.updated_by] || `User #${job.updated_by}`}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Delete Modal */}
      {job && (
        <DeleteConfirmModal
          isOpen={deleteConfirm.id !== null}
          onClose={() => closeDeleteConfirm()}
          onConfirm={handleDelete}
          title="Delete Scheduled Job"
          description={`Are you sure you want to delete the scheduled job "${job.name}"? This action cannot be undone.`}
          itemName={job.name}
          isLoading={isDeleting}
          confirmText="Delete"
          cancelText="Cancel"
          variant="delete"
        />
      )}
    </div>
  );
}
