import { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  Edit,
  Trash2,
  AlertCircle,
  CheckCircle,
  Clock,
  GitBranch,
  Layers,
  Activity,
  Zap,
  RefreshCw,
  Copy,
  Workflow,
  Play,
  Pause,
  AlertTriangle,
} from "lucide-react";
import { jobWorkflowStepService } from "../services/jobWorkflowStepService";
import { scheduledJobService } from "../services/scheduledJobService";
import { JobWorkflowStep } from "../types/jobWorkflowStep";
import { ScheduledJob } from "../types/scheduledJob";
import { useToast } from "../../../contexts/ToastContext";
import { useAuth } from "../../../contexts/AuthContext";
import LoadingSpinner from "../../../shared/components/ui/LoadingSpinner";
import DeleteConfirmModal from "../../../shared/components/ui/DeleteConfirmModal";
import { color, tw } from "../../../shared/utils/utils";

const formatDateTime = (value?: string | null) => {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleString();
  } catch {
    return value;
  }
};

export default function JobWorkflowStepDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const jobIdParam = searchParams.get("job_id");
  const navigate = useNavigate();
  const { error: showError, success: showToast } = useToast();
  const { user } = useAuth();

  const [step, setStep] = useState<JobWorkflowStep | null>(null);
  const [job, setJob] = useState<ScheduledJob | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Related data
  const [executionOrder, setExecutionOrder] = useState<any[]>([]);
  const [parallelGroups, setParallelGroups] = useState<any[]>([]);
  const [dependencies, setDependencies] = useState<any[]>([]);
  const [healthSummary, setHealthSummary] = useState<any>(null);
  const [canExecute, setCanExecute] = useState<{
    can_execute: boolean;
    reason?: string;
  } | null>(null);
  const [nextStep, setNextStep] = useState<JobWorkflowStep | null>(null);
  const [isLoadingRelated, setIsLoadingRelated] = useState(false);

  useEffect(() => {
    const loadStep = async () => {
      if (!id) return;
      setIsLoading(true);
      try {
        const stepData = await jobWorkflowStepService.getJobWorkflowStepById(
          Number(id),
          true
        );
        setStep(stepData);

        // Load job if job_id is available
        if (stepData.job_id) {
          try {
            const jobData = await scheduledJobService.getScheduledJobById(
              stepData.job_id
            );
            setJob(jobData);
          } catch (err) {
            console.error("Failed to load job:", err);
          }
        }

        // Load related data
        setIsLoadingRelated(true);
        try {
          const [order, groups, deps, health, canExec] = await Promise.all([
            jobWorkflowStepService
              .getExecutionOrder(stepData.job_id, true)
              .catch(() => ({ success: true, data: [] })),
            jobWorkflowStepService
              .getParallelGroups(stepData.job_id, true)
              .catch(() => ({ success: true, data: [] })),
            jobWorkflowStepService
              .getDependencies(stepData.job_id, true)
              .catch(() => ({ success: true, data: [] })),
            jobWorkflowStepService
              .getHealthSummary(stepData.job_id, true)
              .catch(() => null),
            jobWorkflowStepService
              .canStepExecute(stepData.job_id, stepData.step_order, true)
              .catch(() => null),
          ]);

          setExecutionOrder(order.data || []);
          setParallelGroups(groups.data || []);
          setDependencies(deps.data || []);
          setHealthSummary(health?.data || null);
          setCanExecute(canExec);

          // Try to get next step
          try {
            const next = await jobWorkflowStepService.getNextStep(
              stepData.job_id,
              stepData.step_order,
              true
            );
            setNextStep(next);
          } catch {
            // Next step might not exist
          }
        } catch (err) {
          console.error("Failed to load related data:", err);
        } finally {
          setIsLoadingRelated(false);
        }
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to load workflow step";
        showError("Error", message);
      } finally {
        setIsLoading(false);
      }
    };

    loadStep();
  }, [id, showError]);

  const handleDelete = async () => {
    if (!step) return;
    try {
      setIsDeleting(true);
      await jobWorkflowStepService.deleteJobWorkflowStep(step.id);
      showToast(
        "Step deleted",
        `"${step.step_name}" has been deleted successfully.`
      );
      navigate(
        `/dashboard/job-workflow-steps${
          jobIdParam ? `?job_id=${jobIdParam}` : ""
        }`
      );
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to delete step";
      showError("Error", message);
    } finally {
      setIsDeleting(false);
      setShowDeleteModal(false);
    }
  };

  const handleDuplicate = async () => {
    if (!step) return;
    try {
      await jobWorkflowStepService.duplicateStep(step.id, {
        userId: user?.user_id || 0,
      });
      showToast(
        "Step duplicated",
        `"${step.step_name}" has been duplicated successfully.`
      );
      navigate(
        `/dashboard/job-workflow-steps${
          jobIdParam ? `?job_id=${jobIdParam}` : ""
        }`
      );
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to duplicate step";
      showError("Error", message);
    }
  };

  const handleActivate = async () => {
    if (!step) return;
    try {
      await jobWorkflowStepService.activateStep(step.id, user?.user_id || 0);
      showToast("Step activated", `"${step.step_name}" has been activated.`);
      // Reload step
      const updated = await jobWorkflowStepService.getJobWorkflowStepById(
        step.id,
        true
      );
      setStep(updated);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to activate step";
      showError("Error", message);
    }
  };

  const handleDeactivate = async () => {
    if (!step) return;
    try {
      await jobWorkflowStepService.deactivateStep(step.id, user?.user_id || 0);
      showToast(
        "Step deactivated",
        `"${step.step_name}" has been deactivated.`
      );
      // Reload step
      const updated = await jobWorkflowStepService.getJobWorkflowStepById(
        step.id,
        true
      );
      setStep(updated);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to deactivate step";
      showError("Error", message);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <LoadingSpinner />
      </div>
    );
  }

  if (!step) {
    return (
      <div className="py-16 text-center">
        <AlertCircle className="mx-auto mb-4 h-12 w-12 text-gray-300" />
        <p className={`text-lg font-semibold ${tw.textPrimary}`}>
          Step not found
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() =>
              navigate(
                `/dashboard/job-workflow-steps${
                  jobIdParam ? `?job_id=${jobIdParam}` : ""
                }`
              )
            }
            className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className={`text-2xl font-bold ${tw.textPrimary}`}>
              {step.step_name}
            </h1>
            <p className={`${tw.textSecondary} mt-1 text-sm`}>
              Code: {step.step_code} | Order: {step.step_order}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {step.is_active ? (
            <button
              onClick={handleDeactivate}
              className="inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50"
            >
              <Pause className="h-4 w-4" />
              Deactivate
            </button>
          ) : (
            <button
              onClick={handleActivate}
              className="inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-semibold text-white"
              style={{ backgroundColor: color.primary.action }}
            >
              <Play className="h-4 w-4" />
              Activate
            </button>
          )}
          <button
            onClick={() =>
              navigate(
                `/dashboard/job-workflow-steps/${step.id}/edit?job_id=${step.job_id}`
              )
            }
            className="inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50"
          >
            <Edit className="h-4 w-4" />
            Edit
          </button>
          <button
            onClick={handleDuplicate}
            className="inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50"
          >
            <Copy className="h-4 w-4" />
            Duplicate
          </button>
          <button
            onClick={() => setShowDeleteModal(true)}
            className="inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium text-red-700 bg-white border border-red-300 hover:bg-red-50"
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </button>
        </div>
      </div>

      {/* Status Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-md border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2">
            <Activity
              className="h-5 w-5"
              style={{ color: color.primary.accent }}
            />
            <p className="text-sm font-medium text-gray-600">Status</p>
          </div>
          <p className="mt-2 text-xl font-bold text-gray-900">
            {step.is_active ? (
              <span className="text-green-700">Active</span>
            ) : (
              <span className="text-gray-500">Inactive</span>
            )}
          </p>
        </div>
        <div className="rounded-md border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2">
            <AlertTriangle
              className="h-5 w-5"
              style={{ color: color.primary.accent }}
            />
            <p className="text-sm font-medium text-gray-600">Critical</p>
          </div>
          <p className="mt-2 text-xl font-bold text-gray-900">
            {step.is_critical ? (
              <span className="text-red-700">Yes</span>
            ) : (
              <span className="text-gray-500">No</span>
            )}
          </p>
        </div>
        <div className="rounded-md border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2">
            <GitBranch
              className="h-5 w-5"
              style={{ color: color.primary.accent }}
            />
            <p className="text-sm font-medium text-gray-600">Parallel</p>
          </div>
          <p className="mt-2 text-xl font-bold text-gray-900">
            {step.is_parallel ? (
              <span className="text-blue-700">Yes</span>
            ) : (
              <span className="text-gray-500">No</span>
            )}
          </p>
        </div>
        <div className="rounded-md border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5" style={{ color: color.primary.accent }} />
            <p className="text-sm font-medium text-gray-600">Retries</p>
          </div>
          <p className="mt-2 text-xl font-bold text-gray-900">
            {step.retry_count}
          </p>
        </div>
      </div>

      {/* Execution Status */}
      {canExecute && (
        <div
          className={`rounded-md border p-4 ${
            canExecute.can_execute
              ? "border-green-200 bg-green-50"
              : "border-amber-200 bg-amber-50"
          }`}
        >
          <div className="flex items-center gap-2">
            {canExecute.can_execute ? (
              <CheckCircle className="h-5 w-5 text-green-700" />
            ) : (
              <AlertCircle className="h-5 w-5 text-amber-700" />
            )}
            <p
              className={`font-semibold ${
                canExecute.can_execute ? "text-green-700" : "text-amber-700"
              }`}
            >
              {canExecute.can_execute
                ? "Step can execute"
                : `Step cannot execute: ${
                    canExecute.reason || "Dependencies not satisfied"
                  }`}
            </p>
          </div>
        </div>
      )}

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left Column */}
        <div className="space-y-6">
          {/* Basic Information */}
          <div className="rounded-md border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">
              Basic Information
            </h2>
            <dl className="space-y-3">
              <div>
                <dt className="text-sm font-medium text-gray-500">Step Name</dt>
                <dd className={`mt-1 text-sm ${tw.textPrimary}`}>
                  {step.step_name}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Step Code</dt>
                <dd className={`mt-1 text-sm ${tw.textPrimary}`}>
                  {step.step_code}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Step Type</dt>
                <dd className={`mt-1 text-sm ${tw.textPrimary}`}>
                  {step.step_type}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">
                  Step Order
                </dt>
                <dd className={`mt-1 text-sm ${tw.textPrimary}`}>
                  {step.step_order}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Job</dt>
                <dd className={`mt-1 text-sm ${tw.textPrimary}`}>
                  {job ? (
                    <button
                      onClick={() =>
                        navigate(`/dashboard/scheduled-jobs/${job.id}`)
                      }
                      className="text-blue-600 hover:text-blue-800 hover:underline"
                    >
                      {job.name}
                    </button>
                  ) : (
                    `Job #${step.job_id}`
                  )}
                </dd>
              </div>
              {step.step_description && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">
                    Description
                  </dt>
                  <dd className={`mt-1 text-sm ${tw.textPrimary}`}>
                    {step.step_description}
                  </dd>
                </div>
              )}
            </dl>
          </div>

          {/* Execution Configuration */}
          <div className="rounded-md border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">
              Execution Configuration
            </h2>
            <dl className="space-y-3">
              <div>
                <dt className="text-sm font-medium text-gray-500">
                  Step Action
                </dt>
                <dd
                  className={`mt-1 text-sm ${tw.textPrimary} font-mono bg-gray-50 p-2 rounded`}
                >
                  {step.step_action}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">
                  Timeout (seconds)
                </dt>
                <dd className={`mt-1 text-sm ${tw.textPrimary}`}>
                  {step.timeout_seconds}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">
                  Retry Count
                </dt>
                <dd className={`mt-1 text-sm ${tw.textPrimary}`}>
                  {step.retry_count}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">
                  Retry Delay (seconds)
                </dt>
                <dd className={`mt-1 text-sm ${tw.textPrimary}`}>
                  {step.retry_delay_seconds}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">
                  On Failure Action
                </dt>
                <dd className={`mt-1 text-sm ${tw.textPrimary}`}>
                  {step.on_failure_action}
                </dd>
              </div>
            </dl>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Dependencies & Parallel Groups */}
          {step.depends_on_step_codes &&
            step.depends_on_step_codes.length > 0 && (
              <div className="rounded-md border border-gray-200 bg-white p-6 shadow-sm">
                <h2 className="mb-4 text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Layers className="h-5 w-5" />
                  Dependencies
                </h2>
                <div className="space-y-2">
                  {step.depends_on_step_codes.map((code, idx) => (
                    <div
                      key={idx}
                      className="rounded-md bg-gray-50 p-3 text-sm font-medium text-gray-900"
                    >
                      {code}
                    </div>
                  ))}
                </div>
              </div>
            )}

          {step.is_parallel && step.parallel_group_id && (
            <div className="rounded-md border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-lg font-semibold text-gray-900 flex items-center gap-2">
                <GitBranch className="h-5 w-5" />
                Parallel Group
              </h2>
              <p className="text-sm text-gray-700">
                Group ID:{" "}
                <span className="font-semibold">{step.parallel_group_id}</span>
              </p>
            </div>
          )}

          {/* Next Step */}
          {nextStep && (
            <div className="rounded-md border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-lg font-semibold text-gray-900">
                Next Step
              </h2>
              <button
                onClick={() =>
                  navigate(
                    `/dashboard/job-workflow-steps/${nextStep.id}?job_id=${nextStep.job_id}`
                  )
                }
                className="text-left w-full rounded-md bg-gray-50 p-3 text-sm font-medium text-gray-900 hover:bg-gray-100 transition-colors"
              >
                {nextStep.step_name} (Order: {nextStep.step_order})
              </button>
            </div>
          )}

          {/* Validation Queries */}
          {(step.pre_validation_query || step.post_validation_query) && (
            <div className="rounded-md border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-lg font-semibold text-gray-900">
                Validation Queries
              </h2>
              {step.pre_validation_query && (
                <div className="mb-4">
                  <dt className="text-sm font-medium text-gray-500 mb-2">
                    Pre-Validation
                  </dt>
                  <dd className="text-sm font-mono bg-gray-50 p-2 rounded">
                    {step.pre_validation_query}
                  </dd>
                </div>
              )}
              {step.post_validation_query && (
                <div>
                  <dt className="text-sm font-medium text-gray-500 mb-2">
                    Post-Validation
                  </dt>
                  <dd className="text-sm font-mono bg-gray-50 p-2 rounded">
                    {step.post_validation_query}
                  </dd>
                </div>
              )}
            </div>
          )}

          {/* Metadata */}
          <div className="rounded-md border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">
              Metadata
            </h2>
            <dl className="space-y-3">
              <div>
                <dt className="text-sm font-medium text-gray-500">
                  Created At
                </dt>
                <dd className={`mt-1 text-sm ${tw.textPrimary}`}>
                  {formatDateTime(step.created_at)}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">
                  Updated At
                </dt>
                <dd className={`mt-1 text-sm ${tw.textPrimary}`}>
                  {formatDateTime(step.updated_at)}
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </div>

      {/* Execution Order & Workflow Structure */}
      {executionOrder.length > 0 && (
        <div className="rounded-md border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Workflow className="h-5 w-5" />
            Execution Order
          </h2>
          <div className="space-y-2">
            {executionOrder.map((item, idx) => (
              <div
                key={idx}
                className={`flex items-center justify-between rounded-md p-3 ${
                  item.step_id === step.id
                    ? "bg-blue-50 border-2 border-blue-300"
                    : "bg-gray-50 border border-gray-200"
                }`}
              >
                <div>
                  <span className="text-sm font-semibold text-gray-900">
                    {item.step_name}
                  </span>
                  <span className="ml-2 text-xs text-gray-500">
                    ({item.step_code})
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {item.can_execute ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-amber-600" />
                  )}
                  <span className="text-xs text-gray-500">
                    Order: {item.step_order}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {step && (
        <DeleteConfirmModal
          isOpen={showDeleteModal}
          onClose={() => {
            setShowDeleteModal(false);
          }}
          onConfirm={handleDelete}
          title="Delete Workflow Step"
          description={`Are you sure you want to delete the workflow step "${step.step_name}"? This action cannot be undone.`}
          itemName={step.step_name}
          isLoading={isDeleting}
          confirmText="Delete"
          cancelText="Cancel"
          variant="delete"
        />
      )}
    </div>
  );
}
