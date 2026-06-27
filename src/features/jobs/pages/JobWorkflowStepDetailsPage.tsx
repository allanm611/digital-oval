import { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useLanguage } from "../../../contexts/LanguageContext";
import {
  Edit,
  Trash2,
  AlertCircle,
  CheckCircle,
  Layers,
  Copy,
  Play,
  Pause,
} from "lucide-react";
import { jobWorkflowStepService } from "../services/jobWorkflowStepService";
import { scheduledJobService } from "../services/scheduledJobService";
import {
  JobWorkflowStep,
  ExecutionOrderResponse,
} from "../types/jobWorkflowStep";
import { ScheduledJob } from "../types/scheduledJob";
import { useToast } from "../../../contexts/ToastContext";
import { extractBackendError } from "../../../shared/utils/errorHandler";;;
import { useAuth } from "../../../contexts/AuthContext";
import { PermissionGate } from "../../auth/components/PermissionGate";
import LoadingSpinner from "../../../shared/components/ui/LoadingSpinner";
import BackButton from "../../../shared/components/ui/BackButton";
import DeleteConfirmModal from "../../../shared/components/ui/DeleteConfirmModal";
import DateFormatter from "../../../shared/components/DateFormatter";
import { color, tw } from "../../../shared/utils/utils";
import { useDeleteConfirm } from "../../../shared/hooks/useDeleteConfirm";

export default function JobWorkflowStepDetailsPage() {
  const { t } = useLanguage();
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const jobIdParam = searchParams.get("job_id");
  const navigate = useNavigate();
  const { error: showError, success: showToast } = useToast();
  const { user } = useAuth();

  const { deleteConfirm, isDeleting, openDeleteConfirm, closeDeleteConfirm } = useDeleteConfirm({ onDelete: async (id) => await handleDelete() });

  const [step, setStep] = useState<JobWorkflowStep | null>(null);
  const [job, setJob] = useState<ScheduledJob | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isToggling, setIsToggling] = useState(false);
  const [isDuplicating, setIsDuplicating] = useState(false);

  // Related data
  const [executionOrder, setExecutionOrder] = useState<
    ExecutionOrderResponse["data"]
  >([]);
  const [canExecute, setCanExecute] = useState<{
    can_execute: boolean;
    reason?: string;
  } | null>(null);
  const [nextStep, setNextStep] = useState<JobWorkflowStep | null>(null);
  const [parallelSteps, setParallelSteps] = useState<JobWorkflowStep[]>([]);

  useEffect(() => {
    const loadStep = async () => {
      if (!id) return;
      setIsLoading(true);
      try {
        const stepData = await jobWorkflowStepService.getJobWorkflowStepById(
          Number(id),
          true,
        );
        setStep(stepData);

        // Load job if job_id is available
        if (stepData.job_id) {
          try {
            const jobData = await scheduledJobService.getScheduledJobById(
              stepData.job_id,
            );
            setJob(jobData);
          } catch (err) {
            console.error("Failed to load job:", err);
          }
        }

        // Load related data
        try {
          const [order, canExec, parallelSteps] = await Promise.all([
            jobWorkflowStepService
              .getExecutionOrder(stepData.job_id, true)
              .catch(() => ({ success: true, data: [] })),
            jobWorkflowStepService
              .canStepExecute(stepData.job_id, stepData.step_order, true)
              .catch(() => null),
            stepData.is_parallel && stepData.parallel_group_id
              ? jobWorkflowStepService
                  .getParallelSteps(stepData.job_id, true)
                  .catch(() => ({ data: [] }))
              : Promise.resolve({ data: [] }),
          ]);

          setExecutionOrder(order.data || []);
          setCanExecute(canExec);
          const parallelStepsData =
            parallelSteps &&
            typeof parallelSteps === "object" &&
            "data" in parallelSteps
              ? (parallelSteps.data as JobWorkflowStep[])
              : [];
          setParallelSteps(parallelStepsData);

          // Try to get next step
          try {
            const next = await jobWorkflowStepService.getNextStep(
              stepData.job_id,
              stepData.step_order,
              true,
            );
            setNextStep(next);
          } catch {
            // Next step might not exist
          }
        } catch (err) {
          console.error("Failed to load related data:", err);
        }
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to load workflow step";
        showError("Error", extractBackendError(error, "Error. Please try again."));
      } finally {
        setIsLoading(false);
      }
    };

    loadStep();
  }, [id, showError]);

  const handleDelete = async () => {
    if (!step) return;
    try {
      await jobWorkflowStepService.deleteJobWorkflowStep(step.id);
      showToast(
        "Step deleted",
        `"${step.step_name}" has been deleted successfully.`,
      );
      navigate(
        `/dashboard/job-workflow-steps${
          jobIdParam ? `?job_id=${jobIdParam}` : ""
        }`,
      );
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to delete step";
      showError("Error", extractBackendError(error, "Error. Please try again."));
    } finally {
      closeDeleteConfirm();
    }
  };

  const handleDuplicate = async () => {
    if (!step) return;
    try {
      setIsDuplicating(true);
      await jobWorkflowStepService.duplicateStep(step.id, {});
      showToast(
        "Step duplicated",
        `"${step.step_name}" has been duplicated successfully.`,
      );
      navigate(
        `/dashboard/job-workflow-steps${
          jobIdParam ? `?job_id=${jobIdParam}` : ""
        }`,
      );
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to duplicate step";
      showError("Error", extractBackendError(error, "Error. Please try again."));
    } finally {
      setIsDuplicating(false);
    }
  };

  const handleActivate = async () => {
    if (!step) return;
    try {
      setIsToggling(true);
      await jobWorkflowStepService.activateStep(step.id, user?.user_id ?? null);
      showToast("Step activated", `"${step.step_name}" has been activated.`);
      // Reload step
      const updated = await jobWorkflowStepService.getJobWorkflowStepById(
        step.id,
        true,
      );
      setStep(updated);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to activate step";
      showError("Error", extractBackendError(error, "Error. Please try again."));
    } finally {
      setIsToggling(false);
    }
  };

  const handleDeactivate = async () => {
    if (!step) return;
    try {
      setIsToggling(true);
      await jobWorkflowStepService.deactivateStep(step.id, user?.user_id ?? null);
      showToast(
        "Step deactivated",
        `"${step.step_name}" has been deactivated.`,
      );
      // Reload step
      const updated = await jobWorkflowStepService.getJobWorkflowStepById(
        step.id,
        true,
      );
      setStep(updated);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to deactivate step";
      showError("Error", extractBackendError(error, "Error. Please try again."));
    } finally {
      setIsToggling(false);
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
    <div className="">
      {/* Header */}
      <BackButton
       
        showBreadcrumb={true}
        currentLabel="Workflow Step Details"
      />
      <div className="flex items-center justify-between">
        <div>
          <h1 className={`${tw.tableFirstColumn} ${tw.textPrimary}`}>
            {step.step_name}
          </h1>
            {canExecute && (
              <div className="flex items-center gap-2 mt-1">
                {canExecute.can_execute ? (
                  <CheckCircle
                    className="h-4 w-4"
                    style={{ color: color.status.info }}
                  />
                ) : (
                  <AlertCircle
                    className="h-4 w-4"
                    style={{ color: color.status.danger }}
                  />
                )}
                <p
                  className="text-sm font-semibold"
                  style={{
                    color: canExecute.can_execute
                      ? color.status.info
                      : color.status.danger,
                  }}
                >
                  {canExecute.can_execute
                    ? "Step can execute"
                    : `Step cannot execute: ${
                        canExecute.reason || "Dependencies not satisfied"
                      }`}
                </p>
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {step.is_active ? (
            <button
              onClick={handleDeactivate}
              disabled={isToggling}
              className={`inline-flex items-center gap-2 ${tw.rounded} px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 disabled:opacity-50`}
            >
              {isToggling ? <LoadingSpinner /> : <Pause className="h-4 w-4" />}
              Deactivate
            </button>
          ) : (
            <button
              onClick={handleActivate}
              disabled={isToggling}
              className={`inline-flex items-center gap-2 ${tw.rounded} px-4 py-2 text-sm font-semibold text-white disabled:opacity-50`}
              style={{ backgroundColor: color.primary.action }}
            >
              {isToggling ? <LoadingSpinner /> : <Play className="h-4 w-4" />}
              Activate
            </button>
          )}
          <button
            onClick={() =>
              navigate(
                `/dashboard/job-workflow-steps/${step.id}/edit?job_id=${step.job_id}`,
              )
            }
            className={`inline-flex items-center gap-2 ${tw.rounded} px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50`}
          >
            <Edit className="h-4 w-4" />
            Edit
          </button>
          <PermissionGate permission="job-workflow-steps.create">
            <button
              onClick={handleDuplicate}
              disabled={isDuplicating}
              className={`inline-flex items-center gap-2 ${tw.rounded} px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 disabled:opacity-50`}
            >
              {isDuplicating ? (
                <LoadingSpinner />
              ) : (
                <Copy className="h-4 w-4" />
              )}
              Duplicate
            </button>
          </PermissionGate>
          <PermissionGate permission="job-workflow-steps.delete">
            <button
              onClick={() => openDeleteConfirm(step?.id || 0, step?.step_name || "")}
              className={`inline-flex items-center gap-2 ${tw.rounded} px-4 py-2 text-sm font-medium text-red-700 bg-white border border-red-300 hover:bg-red-50`}
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </button>
          </PermissionGate>
        </div>

      {/* Main Content Grid */}
      <div className="">
        {/* Top Row: Basic Information and Execution Configuration side by side */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Basic Information */}
          <div
            className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm`}
          >
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
                      className="hover:underline"
                      style={{ color: color.primary.accent }}
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
              <div>
                <dt className="text-sm font-medium text-gray-500">
                  Created At
                </dt>
                <dd className={`mt-1 text-sm ${tw.textPrimary}`}>
                  <DateFormatter date={step.created_at} useUserTimezone includeTime />
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">
                  Updated At
                </dt>
                <dd className={`mt-1 text-sm ${tw.textPrimary}`}>
                  <DateFormatter date={step.updated_at} useUserTimezone includeTime />
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Status</dt>
                <dd className="mt-1 flex items-center gap-2">
                  <span className="text-sm font-medium text-black">
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
                </dd>
              </div>
            </dl>
          </div>

          {/* Execution Configuration */}
          <div
            className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm`}
          >
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
              {step.execution_condition && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">
                    Execution Condition
                  </dt>
                  <dd className={`mt-1 text-sm ${tw.textPrimary}`}>
                    {step.execution_condition}
                  </dd>
                </div>
              )}
              {step.skip_on_condition && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">
                    Skip On Condition
                  </dt>
                  <dd className={`mt-1 text-sm ${tw.textPrimary}`}>
                    {step.skip_on_condition}
                  </dd>
                </div>
              )}
            </dl>
          </div>
        </div>

        {/* Bottom Section: Two columns */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Left Column */}
          <div className="">
            {/* Parallel Group */}
            {step.is_parallel && step.parallel_group_id && (
              <div
                className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm`}
              >
                <h2 className="mb-4 text-lg font-semibold text-gray-900">
                  Parallel Group
                </h2>
                <p className="text-sm text-gray-700 mb-3">
                  Group ID:{" "}
                  <span className="font-semibold">
                    {step.parallel_group_id}
                  </span>
                </p>
                {parallelSteps.length > 0 && (
                  <div className="mt-3">
                    <p className="text-sm font-medium text-gray-500 mb-2">
                      Parallel Steps in Group:
                    </p>
                    <div className="space-y-1">
                      {parallelSteps
                        .filter(
                          (s) => s.parallel_group_id === step.parallel_group_id,
                        )
                        .map((s) => (
                          <div
                            key={s.id}
                            className={`${tw.rounded} p-2 text-sm ${
                              s.id === step.id ? "font-semibold" : ""
                            }`}
                            style={
                              s.id === step.id
                                ? {
                                    color: color.primary.accent,
                                  }
                                : undefined
                            }
                          >
                            {s.step_name} (Order: {s.step_order})
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Validation Queries */}
            {(step.pre_validation_query || step.post_validation_query) && (
              <div
                className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm`}
              >
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
          </div>

          {/* Right Column */}
          <div className="">
            {/* Next Step */}
            {nextStep && (
              <div
                className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm`}
              >
                <h2 className="mb-4 text-lg font-semibold text-gray-900">
                  Next Step
                </h2>
                <button
                  onClick={() =>
                    navigate(
                      `/dashboard/job-workflow-steps/${nextStep.id}?job_id=${nextStep.job_id}`,
                    )
                  }
                  className="hover:underline text-left w-full text-sm font-medium transition-colors"
                  style={{ color: color.primary.accent }}
                >
                  {nextStep.step_name} (Order: {nextStep.step_order})
                </button>
              </div>
            )}

            {/* Dependencies */}
            {step.depends_on_step_codes &&
              step.depends_on_step_codes.length > 0 && (
                <div
                  className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm`}
                >
                  <h2 className="mb-4 text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <Layers className="h-5 w-5" />
                    Dependencies
                  </h2>
                  <div className="space-y-2">
                    {step.depends_on_step_codes.map((code, idx) => (
                      <div
                        key={idx}
                        className={`${tw.rounded} bg-gray-50 p-3 text-sm font-medium text-gray-900`}
                      >
                        {code}
                      </div>
                    ))}
                  </div>
                </div>
              )}
          </div>
        </div>
      </div>

      {/* Execution Order (table view) */}
      {executionOrder.length > 0 && (
        <div className="mt-2">
          <h2 className="mb-3 text-lg font-semibold text-gray-900">
            Execution Order
          </h2>
          <div className="overflow-x-auto">
            <table
              className="w-full"
              style={{ borderCollapse: "separate", borderSpacing: "0 8px" }}
            >
              <thead>
                <tr>
                  <th
                    className="px-4 py-3 text-left text-sm font-medium uppercase tracking-wider"
                    style={{
                      color: color.surface.tableHeaderText,
                      backgroundColor: color.surface.tableHeader,
                      borderTopLeftRadius: "0.375rem",
                    }}
                  >
                    Order
                  </th>
                  <th
                    className="px-4 py-3 text-left text-sm font-medium uppercase tracking-wider"
                    style={{
                      color: color.surface.tableHeaderText,
                      backgroundColor: color.surface.tableHeader,
                    }}
                  >
                    Job ID
                  </th>
                  <th
                    className="px-4 py-3 text-left text-sm font-medium uppercase tracking-wider"
                    style={{
                      color: color.surface.tableHeaderText,
                      backgroundColor: color.surface.tableHeader,
                    }}
                  >
                    Step Name
                  </th>
                  <th
                    className="px-4 py-3 text-left text-sm font-medium uppercase tracking-wider"
                    style={{
                      color: color.surface.tableHeaderText,
                      backgroundColor: color.surface.tableHeader,
                      borderTopRightRadius: "0.375rem",
                    }}
                  >
                    Step Code
                  </th>
                </tr>
              </thead>
              <tbody>
                {executionOrder.map((item, idx) => (
                  <tr key={item.step_id || idx}>
                    <td
                      className="px-4 py-3 text-sm font-semibold text-gray-900"
                      style={{
                        backgroundColor: color.surface.tablebodybg,
                        borderTopLeftRadius: "0.375rem",
                        borderBottomLeftRadius: "0.375rem",
                      }}
                    >
                      {item.step_order}
                    </td>
                    <td
                      className="px-4 py-3 text-sm"
                      style={{ backgroundColor: color.surface.tablebodybg }}
                    >
                      {step ? (
                        <button
                          onClick={() =>
                            navigate(`/dashboard/scheduled-jobs/${step.job_id}`)
                          }
                          className="text-sm hover:underline"
                          style={{ color: color.primary.accent }}
                        >
                          {step.job_id}
                        </button>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td
                      className="px-4 py-3 text-sm text-gray-900"
                      style={{ backgroundColor: color.surface.tablebodybg }}
                    >
                      {item.step_name}
                    </td>
                    <td
                      className="px-4 py-3 text-sm text-gray-700"
                      style={{
                        backgroundColor: color.surface.tablebodybg,
                        borderTopRightRadius: "0.375rem",
                        borderBottomRightRadius: "0.375rem",
                      }}
                    >
                      {item.step_code}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {step && (
        <DeleteConfirmModal
          isOpen={deleteConfirm.id !== null}
          onClose={() => {
            closeDeleteConfirm();
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
