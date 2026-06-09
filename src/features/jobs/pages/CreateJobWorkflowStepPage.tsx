import { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { Save, X, Plus } from "lucide-react";
import BackButton from "../../../shared/components/ui/BackButton";
import { jobWorkflowStepService } from "../services/jobWorkflowStepService";
import { scheduledJobService } from "../services/scheduledJobService";
import HeadlessSelect from "../../../shared/components/ui/HeadlessSelect";
import Input from "../../../shared/components/ui/Input";
import Textarea from "../../../shared/components/ui/Textarea";
import {
  CreateJobWorkflowStepPayload,
  UpdateJobWorkflowStepPayload,
  StepType,
  FailureAction,
} from "../types/jobWorkflowStep";
import { ScheduledJob } from "../types/scheduledJob";
import { useToast } from "../../../contexts/ToastContext";
import { extractBackendError } from "../../../shared/utils/errorHandler";;;
import { useAuth } from "../../../contexts/AuthContext";
import { useLanguage } from "../../../contexts/LanguageContext";
import LoadingSpinner from "../../../shared/components/ui/LoadingSpinner";
import { color, tw, noteStyles, button, getButtonStyles } from "../../../shared/utils/utils";
import Checkbox from "../../../shared/components/ui/Checkbox";

const getStepTypes = (t: any): { value: StepType; label: string }[] => [
  { value: "sql", label: t.jobs.jobWorkflow.sql },
  { value: "stored_proc", label: t.jobs.jobWorkflow.storedProcedure },
  { value: "api_call", label: t.jobs.jobWorkflow.apiCall },
  { value: "python_script", label: t.jobs.jobWorkflow.pythonScript },
  { value: "node_js_script", label: t.jobs.jobWorkflow.nodeScript },
  { value: "shell_script", label: t.jobs.jobWorkflow.shellScript },
  { value: "file_transfer", label: t.jobs.jobWorkflow.fileTransfer },
  { value: "data_validation", label: t.jobs.jobWorkflow.dataValidation },
  { value: "notification", label: t.jobs.jobWorkflow.notification },
  { value: "wait", label: t.jobs.jobWorkflow.wait },
];

const getFailureActions = (t: any): { value: FailureAction; label: string }[] => [
  { value: "abort", label: t.jobs.jobWorkflow.abort },
  { value: "continue", label: t.jobs.jobWorkflow.continue },
  { value: "retry", label: t.jobs.jobWorkflow.retry },
  { value: "skip_remaining", label: t.jobs.jobWorkflow.skipRemaining },
];

export default function CreateJobWorkflowStepPage() {
  const { id: paramId } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const jobIdParam = searchParams.get("job_id");
  const batchMode = searchParams.get("batch") === "true";
  const operationType = searchParams.get("operation") as "create" | "edit" | "duplicate" | null;
  const queryParamId = searchParams.get("id");
  const id = paramId || queryParamId;
  const navigate = useNavigate();
  const { error: showError, success: showToast } = useToast();
  const { user } = useAuth();
  const { t } = useLanguage();
  const isEditMode = operationType === "edit" && !!id;
  const isDuplicateMode = operationType === "duplicate" && !!id;

  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [jobs, setJobs] = useState<ScheduledJob[]>([]);
  const [availableStepCodes, setAvailableStepCodes] = useState<string[]>([]);
  const [formData, setFormData] = useState<CreateJobWorkflowStepPayload>({
    job_id: jobIdParam ? Number(jobIdParam) : 0,
    step_order: 1,
    step_name: "",
    step_code: "",
    step_description: "",
    step_type: "sql",
    step_action: "",
    is_parallel: false,
    parallel_group_id: null,
    depends_on_step_codes: [],
    execution_condition: null,
    skip_on_condition: null,
    retry_count: 0,
    retry_delay_seconds: 0,
    timeout_seconds: 300,
    on_failure_action: "abort",
    pre_validation_query: null,
    post_validation_query: null,
    expected_row_count_min: null,
    expected_row_count_max: null,
    parameters: null,
    is_active: true,
    is_critical: false,
    userId: user?.user_id ?? null,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [existingStepOrders, setExistingStepOrders] = useState<number[]>([]);
  const [originalStepOrder, setOriginalStepOrder] = useState<number | null>(
    null
  );
  const [newDependency, setNewDependency] = useState("");
  // Batch create state
  const [batchSteps, setBatchSteps] = useState<
    Array<Partial<CreateJobWorkflowStepPayload>>
  >([]);

  // Load jobs on mount
  useEffect(() => {
    const loadJobs = async () => {
      try {
        const jobsResponse = await scheduledJobService.listScheduledJobs({
          limit: 1000,
          skipCache: true,
        });
        setJobs(jobsResponse.data || []);
      } catch (err) {
        showError("Error", extractBackendError(err, "Error. Please try again."));
      }
    };

    loadJobs();
  }, [showError]);

  // Load step data when editing or duplicating
  useEffect(() => {
    if (!id || (!isEditMode && !isDuplicateMode)) return;

    const loadStep = async () => {
      setIsLoading(true);
      try {
        const step = await jobWorkflowStepService.getJobWorkflowStepById(
          Number(id),
          true
        );
        setOriginalStepOrder(isDuplicateMode ? null : step.step_order);

        // In duplicate mode, calculate the next available step order
        let nextStepOrder = isDuplicateMode ? 1 : step.step_order;
        if (isDuplicateMode) {
          try {
            const stepsResponse = await jobWorkflowStepService.getStepsByJobId(
              step.job_id,
              true
            );
            const existingOrders = (stepsResponse.data || [])
              .map((s) => s.step_order)
              .filter((o) => typeof o === "number");
            const usedOrders = new Set(existingOrders);
            let candidate = 1;
            while (usedOrders.has(candidate)) {
              candidate += 1;
            }
            nextStepOrder = candidate;
          } catch {
            // If we can't fetch existing orders, use next after current
            nextStepOrder = step.step_order + 1;
          }
        }

        setFormData({
          job_id: step.job_id,
          step_order: nextStepOrder,
          step_name: isDuplicateMode ? `Copy of ${step.step_name}` : step.step_name,
          step_code: step.step_code,
          step_description: step.step_description ?? "",
          step_type: step.step_type,
          step_action: step.step_action,
          is_parallel: step.is_parallel,
          parallel_group_id: step.parallel_group_id,
          depends_on_step_codes: step.depends_on_step_codes || [],
          execution_condition: step.execution_condition,
          skip_on_condition: step.skip_on_condition,
          retry_count: step.retry_count,
          retry_delay_seconds: step.retry_delay_seconds,
          timeout_seconds: step.timeout_seconds,
          on_failure_action: step.on_failure_action,
          pre_validation_query: step.pre_validation_query,
          post_validation_query: step.post_validation_query,
          expected_row_count_min: step.expected_row_count_min,
          expected_row_count_max: step.expected_row_count_max,
          parameters: step.parameters,
          is_active: step.is_active,
          is_critical: step.is_critical,
          userId: user?.user_id ?? null,
        });
      } catch (err) {
        showError("Error", extractBackendError(err, "Error. Please try again."));
      } finally {
        setIsLoading(false);
      }
    };

    loadStep();
  }, [id, isEditMode, isDuplicateMode, operationType, user?.user_id, showError]);

  // Reload step codes and existing orders when job changes
  useEffect(() => {
    if (formData.job_id) {
      jobWorkflowStepService
        .getStepsByJobId(formData.job_id, true)
        .then((response) => {
          const stepCodes = (response.data || []).map((s) => s.step_code);
          setAvailableStepCodes(stepCodes);
          const orders = (response.data || [])
            .map((s) => s.step_order)
            .filter((o) => typeof o === "number");
          setExistingStepOrders(orders);
        })
        .catch(() => {
          setAvailableStepCodes([]);
          setExistingStepOrders([]);
        });
    } else {
      setAvailableStepCodes([]);
      setExistingStepOrders([]);
    }
  }, [formData.job_id]);

  const getNextAvailableOrder = (usedOrders: Set<number>) => {
    let candidate = 1;
    while (usedOrders.has(candidate)) {
      candidate += 1;
    }
    return candidate;
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Job ID is always required
    if (!formData.job_id) {
      newErrors.job_id = "Job ID is required";
    }

    // In batch mode, validate batch steps instead of individual form fields
    if (batchMode) {
      if (batchSteps.length === 0) {
        newErrors.batchSteps = "At least one batch step is required";
      } else {
        // Validate each batch step
        const existingSet = new Set(existingStepOrders);
        const seenOrders = new Set<number>();
        batchSteps.forEach((step, idx) => {
          if (!step.step_name?.trim()) {
            newErrors[`batch_step_${idx}_name`] = `Step ${
              idx + 1
            }: Name is required`;
          }
          if (!step.step_code?.trim()) {
            newErrors[`batch_step_${idx}_code`] = `Step ${
              idx + 1
            }: Code is required`;
          }
          if (!step.step_action?.trim()) {
            newErrors[`batch_step_${idx}_action`] = `Step ${
              idx + 1
            }: Action is required`;
          }
          if (!step.step_description?.trim()) {
            newErrors[`batch_step_${idx}_description`] = `Step ${
              idx + 1
            }: Description is required`;
          }
          if (step.step_order === undefined || step.step_order < 1) {
            newErrors[`batch_step_${idx}_order`] = `Step ${
              idx + 1
            }: Order must be at least 1`;
          } else if (existingSet.has(step.step_order)) {
            newErrors[
              `batch_step_${idx}_order`
            ] = `Step order ${step.step_order} is already used in this job`;
          } else if (seenOrders.has(step.step_order)) {
            newErrors[
              `batch_step_${idx}_order`
            ] = `Step order ${step.step_order} is duplicated in this batch`;
          } else {
            seenOrders.add(step.step_order);
          }
        });
      }
    } else {
      const timeout = formData.timeout_seconds ?? 0;
      const retries = formData.retry_count ?? 0;
      // Regular mode: validate individual form fields
      if (!formData.step_name?.trim()) {
        newErrors.step_name = "Step name is required";
      }
      if (!formData.step_code?.trim()) {
        newErrors.step_code = "Step code is required";
      }
      if (!formData.step_description?.trim()) {
        newErrors.step_description = "Step description is required";
      }
      if (!formData.step_action?.trim()) {
        newErrors.step_action = "Step action is required";
      }
      if (formData.step_order < 1) {
        newErrors.step_order = "Step order must be at least 1";
      } else if (formData.job_id && existingStepOrders.length > 0) {
        // Check if step order already exists for this job
        // In edit mode, exclude the current step's original order
        const ordersToCheck =
          isEditMode && originalStepOrder !== null
            ? existingStepOrders.filter((order) => order !== originalStepOrder)
            : existingStepOrders;

        if (ordersToCheck.includes(formData.step_order)) {
          newErrors.step_order = `Step order ${formData.step_order} already exists for this job`;
        }
      }
      if (timeout < 1 || timeout > 86400) {
        newErrors.timeout_seconds =
          "Timeout must be between 1 and 86400 seconds";
      }
      if (retries < 0 || retries > 10) {
        newErrors.retry_count = "Retry count must be between 0 and 10";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSaving(true);
    try {
      if (isDuplicateMode && id) {
        // Call duplicate endpoint - send empty object to duplicate to same job
        await jobWorkflowStepService.duplicateStep(Number(id), {});
        showToast(
          "Step duplicated",
          `"${formData.step_name}" has been duplicated successfully.`
        );
      } else if (isEditMode && id) {
        // Call edit endpoint
        const { ...rest } = formData;
        const updatePayload: UpdateJobWorkflowStepPayload = {
          ...rest,
          depends_on_step_codes: formData.depends_on_step_codes || [],
          userId: user?.user_id ?? null,
        };
        await jobWorkflowStepService.updateJobWorkflowStep(
          Number(id),
          updatePayload
        );
        showToast(
          "Step updated",
          "Workflow step has been updated successfully."
        );
      } else if (batchMode && batchSteps.length > 0) {
        // Batch create
        const steps = batchSteps.map((step) => ({
          step_order: step.step_order || 1,
          step_name: step.step_name || "",
          step_code: step.step_code || "",
          step_type: step.step_type || "sql",
          step_action: step.step_action || "",
          is_active: step.is_active ?? true,
          is_critical: step.is_critical ?? false,
          step_description: step.step_description,
          is_parallel: step.is_parallel,
          parallel_group_id: step.parallel_group_id,
          depends_on_step_codes: step.depends_on_step_codes,
          retry_count: step.retry_count,
          retry_delay_seconds: step.retry_delay_seconds,
          timeout_seconds: step.timeout_seconds || 300,
          on_failure_action: step.on_failure_action || "abort",
        })) as Omit<CreateJobWorkflowStepPayload, "job_id" | "userId">[];

        await jobWorkflowStepService.batchCreateSteps({
          job_id: formData.job_id,
          steps,
          userId: user?.user_id ?? null,
        });
        showToast(
          "Steps created",
          `${batchSteps.length} workflow step(s) have been created successfully.`
        );
      } else {
        await jobWorkflowStepService.createJobWorkflowStep(formData);
        showToast(
          "Step created",
          "Workflow step has been created successfully."
        );
      }
      // Navigate back to list page without filtering - let user decide if they want to filter
      navigate("/dashboard/job-workflow-steps");
    } catch (err) {
      showError("Error", extractBackendError(err, "Error. Please try again."));
    } finally {
      setIsSaving(false);
    }
  };

  const addBatchStep = () => {
    const used = new Set<number>([
      ...existingStepOrders,
      ...batchSteps.map((s) => s.step_order).filter((n): n is number => !!n),
    ]);
    const nextOrder = getNextAvailableOrder(used);
    setBatchSteps([
      ...batchSteps,
      {
        step_order: nextOrder,
        step_name: "",
        step_code: "",
        step_type: "sql",
        step_action: "",
        is_active: true,
        is_critical: false,
      },
    ]);
  };

  const removeBatchStep = (index: number) => {
    setBatchSteps(batchSteps.filter((_, i) => i !== index));
  };

  const updateBatchStep = (index: number, field: string, value: unknown) => {
    const newSteps = [...batchSteps];
    newSteps[index] = { ...newSteps[index], [field]: value };
    setBatchSteps(newSteps);
  };

  const addDependency = () => {
    if (
      newDependency.trim() &&
      !formData.depends_on_step_codes?.includes(newDependency.trim())
    ) {
      setFormData({
        ...formData,
        depends_on_step_codes: [
          ...(formData.depends_on_step_codes || []),
          newDependency.trim(),
        ],
      });
      setNewDependency("");
    }
  };

  const removeDependency = (code: string) => {
    setFormData({
      ...formData,
      depends_on_step_codes:
        formData.depends_on_step_codes?.filter((c) => c !== code) || [],
    });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="">
      <BackButton
       
        showBreadcrumb={true}
        currentLabel={
          isDuplicateMode
            ? "Duplicate Step"
            : isEditMode
            ? "Edit Step"
            : "Create"
        }
      />

      {batchMode && batchSteps.length === 0 && (
        <div
          className={`${tw.rounded} border p-4 mb-6`}
          style={{
            backgroundColor: noteStyles.warning.backgroundColor,
            borderColor: noteStyles.warning.borderColor,
          }}
        >
          <div className="flex items-center justify-between">
            <p
              className="text-sm font-medium"
              style={{ color: noteStyles.warning.textColor }}
            >
              Batch mode: Create multiple steps at once. Only job selection and
              the batch steps list are used; the individual step form is
              ignored.
            </p>
            <button
              type="button"
              onClick={addBatchStep}
              className={`inline-flex items-center gap-2 ${tw.rounded} px-4 py-2 text-sm font-semibold text-white`}
              style={{ backgroundColor: color.primary.action }}
            >
              <Plus className="h-4 w-4" />
              {t.jobs.jobWorkflow.addStep}
            </button>
          </div>
        </div>
      )}

      {batchMode && batchSteps.length > 0 && (
        <div
          className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm mb-6`}
        >
          {errors.batchSteps && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded">
              <p className="text-sm text-red-600">{errors.batchSteps}</p>
            </div>
          )}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              {t.jobs.jobWorkflow.batchSteps} ({batchSteps.length})
            </h2>
            <button
              type="button"
              onClick={addBatchStep}
              className={`inline-flex items-center gap-2 ${tw.rounded} px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50`}
            >
              <Plus className="h-4 w-4" />
              {t.jobs.jobWorkflow.addAnother}
            </button>
          </div>
          <div className="space-y-4">
            {batchSteps.map((step, idx) => (
              <div
                key={idx}
                className={`${tw.rounded} border border-gray-200 bg-gray-50 p-4`}
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-gray-900">
                    Step {idx + 1}
                  </h3>
                  <button
                    type="button"
                    onClick={() => removeBatchStep(idx)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      {t.jobs.jobWorkflow.stepName} *
                    </label>
                    <Input
                      type="text"
                      value={step.step_name || ""}
                      onChange={(value) =>
                        updateBatchStep(idx, "step_name", String(value))
                      }
                      placeholder={t.jobs.jobWorkflow.enterStepName}
                      hasError={!!errors[`batch_step_${idx}_name`]}
                      variant="compact"
                    />
                    {errors[`batch_step_${idx}_name`] && (
                      <p className="mt-1 text-xs text-red-600">
                        {errors[`batch_step_${idx}_name`]}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      {t.jobs.jobWorkflow.stepCode} *
                    </label>
                    <Input
                      type="text"
                      value={step.step_code || ""}
                      onChange={(value) =>
                        updateBatchStep(idx, "step_code", String(value))
                      }
                      placeholder={t.jobs.jobWorkflow.enterStepCode}
                      hasError={!!errors[`batch_step_${idx}_code`]}
                      variant="compact"
                    />
                    {errors[`batch_step_${idx}_code`] && (
                      <p className="mt-1 text-xs text-red-600">
                        {errors[`batch_step_${idx}_code`]}
                      </p>
                    )}
                  </div>
                  <div className="col-span-2">
                    <Textarea
                      label={`${t.jobs.jobWorkflow.stepDescription} *`}
                      value={step.step_description || ""}
                      onChange={(value) =>
                        updateBatchStep(idx, "step_description", value)
                      }
                      rows={2}
                      placeholder={t.jobs.jobWorkflow.enterStepDescription}
                      hasError={!!errors[`batch_step_${idx}_description`]}
                    />
                    {errors[`batch_step_${idx}_description`] && (
                      <p className="mt-1 text-xs text-red-600">
                        {errors[`batch_step_${idx}_description`]}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      {t.jobs.jobWorkflow.stepOrder} *
                    </label>
                    <Input
                      type="number"
                      value={String(step.step_order || idx + 1)}
                      onChange={(value) =>
                        updateBatchStep(
                          idx,
                          "step_order",
                          parseInt(String(value)) || idx + 1
                        )
                      }
                      placeholder={String(idx + 1)}
                      variant="compact"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      {t.jobs.jobWorkflow.stepType} *
                    </label>
                    <HeadlessSelect
                      options={getStepTypes(t).map((type) => ({
                        value: type.value,
                        label: type.label,
                      }))}
                      value={step.step_type || "sql"}
                      onChange={(value) =>
                        updateBatchStep(idx, "step_type", value)
                      }
                      placeholder={t.jobs.jobWorkflow.selectStepType}
                      className="w-full"
                    />
                  </div>
                  <div className="col-span-2">
                    <Textarea
                      label={`${t.jobs.jobWorkflow.stepAction} *`}
                      value={step.step_action || ""}
                      onChange={(value) =>
                        updateBatchStep(idx, "step_action", value)
                      }
                      rows={2}
                      className="font-mono"
                      placeholder={t.jobs.jobWorkflow.enterStepAction}
                      hasError={!!errors[`batch_step_${idx}_action`]}
                    />
                    {errors[`batch_step_${idx}_action`] && (
                      <p className="mt-1 text-xs text-red-600">
                        {errors[`batch_step_${idx}_action`]}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="">
        {!batchMode ? (
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Left Column */}
            <div className="">
              {/* Basic Information */}
              <div
                className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm`}
              >
                <h2 className="mb-4 text-lg font-semibold text-gray-900">
                  {t.jobs.jobWorkflow.basicInformation}
                </h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t.jobs.jobWorkflow.job} <span className="text-red-500">*</span>
                    </label>
                    <HeadlessSelect
                      options={[
                        { value: "", label: t.jobs.jobWorkflow.selectJob },
                        ...jobs.map((job) => ({
                          value: job.id,
                          label: `${job.name} (${job.code})`,
                        })),
                      ]}
                      value={formData.job_id || ""}
                      onChange={(value) =>
                        setFormData({
                          ...formData,
                          job_id: Number(value),
                        })
                      }
                      disabled={!!jobIdParam || isEditMode}
                      placeholder={t.jobs.jobWorkflow.selectJob}
                      error={!!errors.job_id}
                      className="w-full"
                    />
                    {errors.job_id && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.job_id}
                      </p>
                    )}
                  </div>

                  <div>
                    <Input
                      label={`${t.jobs.jobWorkflow.stepName}*`}
                      type="text"
                      value={formData.step_name}
                      onChange={(value) =>
                        setFormData({ ...formData, step_name: String(value) })
                      }
                      placeholder={t.jobs.jobWorkflow.enterStepName}
                      hasError={!!errors.step_name}
                    />
                    {errors.step_name && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.step_name}
                      </p>
                    )}
                  </div>

                  <div>
                    <Input
                      label={`${t.jobs.jobWorkflow.stepCode}*`}
                      type="text"
                      value={formData.step_code}
                      onChange={(value) =>
                        setFormData({
                          ...formData,
                          step_code: String(value),
                        })
                      }
                      placeholder={t.jobs.jobWorkflow.enterStepCode}
                      hasError={!!errors.step_code}
                    />
                    {errors.step_code && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.step_code}
                      </p>
                    )}
                  </div>

                  <div>
                    <Input
                      label={`${t.jobs.jobWorkflow.stepOrder}*`}
                      type="number"
                      value={String(formData.step_order)}
                      onChange={(value) =>
                        setFormData({
                          ...formData,
                          step_order: parseInt(String(value)) || 1,
                        })
                      }
                      placeholder="1"
                      hasError={!!errors.step_order}
                    />
                    {errors.step_order && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.step_order}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t.jobs.jobWorkflow.stepType} <span className="text-red-500">*</span>
                    </label>
                    <HeadlessSelect
                      options={getStepTypes(t).map((type) => ({
                        value: type.value,
                        label: type.label,
                      }))}
                      value={formData.step_type}
                      onChange={(value) =>
                        setFormData({ ...formData, step_type: value as StepType })
                      }
                      placeholder={t.jobs.jobWorkflow.selectType}
                      className="w-full"
                    />
                  </div>

                  <div>
                    <Textarea
                      label={`${t.jobs.jobWorkflow.stepDescription} *`}
                      value={formData.step_description ?? ""}
                      onChange={(value) =>
                        setFormData({
                          ...formData,
                          step_description: value,
                        })
                      }
                      rows={3}
                      hasError={!!errors.step_description}
                      placeholder={t.jobs.jobWorkflow.enterStepDescription}
                    />
                    {errors.step_description && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.step_description}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Execution Configuration */}
              <div
                className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm`}
              >
                <h2 className="mb-4 text-lg font-semibold text-gray-900">
                  {t.jobs.jobWorkflow.executionConfiguration}
                </h2>
                <div className="space-y-4">
                  <div>
                    <Textarea
                      label={`${t.jobs.jobWorkflow.stepAction} *`}
                      value={formData.step_action}
                      onChange={(value) =>
                        setFormData({
                          ...formData,
                          step_action: value,
                        })
                      }
                      rows={4}
                      className="font-mono"
                      placeholder={t.jobs.jobWorkflow.enterStepAction}
                      hasError={!!errors.step_action}
                    />
                    {errors.step_action && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.step_action}
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Input
                        label={`${t.jobs.jobWorkflow.timeoutSeconds}*`}
                        type="number"
                        min="1"
                        max="86400"
                        value={formData.timeout_seconds}
                        onChange={(value) =>
                          setFormData({
                            ...formData,
                            timeout_seconds: Number(String(value)) || 300,
                          })
                        }
                        hasError={!!errors.timeout_seconds}
                      />
                      {errors.timeout_seconds && (
                        <p className="mt-1 text-sm text-red-600">
                          {errors.timeout_seconds}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {t.jobs.jobWorkflow.onFailureAction}
                      </label>
                      <HeadlessSelect
                        options={getFailureActions(t).map((action) => ({
                          value: action.value,
                          label: action.label,
                        }))}
                        value={formData.on_failure_action}
                        onChange={(value) =>
                          setFormData({
                            ...formData,
                            on_failure_action: value as FailureAction,
                          })
                        }
                        placeholder={t.jobs.jobWorkflow.selectAction}
                        className="w-full"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Input
                        label={t.jobs.jobWorkflow.retryCount}
                        type="number"
                        min="0"
                        max="10"
                        value={formData.retry_count}
                        onChange={(value) =>
                          setFormData({
                            ...formData,
                            retry_count: Number(String(value)) || 0,
                          })
                        }
                        hasError={!!errors.retry_count}
                      />
                      {errors.retry_count && (
                        <p className="mt-1 text-sm text-red-600">
                          {errors.retry_count}
                        </p>
                      )}
                    </div>

                    <div>
                      <Input
                        label={t.jobs.jobWorkflow.retryDelaySeconds}
                        type="number"
                        min="0"
                        value={formData.retry_delay_seconds}
                        onChange={(value) =>
                          setFormData({
                            ...formData,
                            retry_delay_seconds: Number(String(value)) || 0,
                          })
                        }
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="">
              {/* Dependencies & Parallel Execution */}
              <div
                className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm`}
              >
                <h2 className="mb-4 text-lg font-semibold text-gray-900">
                  {t.jobs.jobWorkflow.dependenciesParallel}
                </h2>
                <div className="space-y-4">
                  <div>
                    <div
                      className="flex items-center gap-2 cursor-pointer"
                      onClick={() =>
                        setFormData({
                          ...formData,
                          is_parallel: !formData.is_parallel,
                        })
                      }
                    >
                      <Checkbox
                        id="is-parallel"
                        checked={formData.is_parallel}
                        onChange={() =>
                          setFormData({
                            ...formData,
                            is_parallel: !formData.is_parallel,
                          })
                        }
                      />
                      <span className="text-sm font-medium text-gray-700">
                        {t.jobs.jobWorkflow.enableParallel}
                      </span>
                    </div>
                  </div>

                  {formData.is_parallel && (
                    <div>
                      <Input
                        label={t.jobs.jobWorkflow.parallelGroupId}
                        type="number"
                        min="1"
                        value={formData.parallel_group_id || ""}
                        onChange={(value) =>
                          setFormData({
                            ...formData,
                            parallel_group_id: String(value)
                              ? Number(String(value))
                              : null,
                          })
                        }
                        placeholder={t.jobs.jobWorkflow.enterParallelGroupId}
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t.jobs.jobWorkflow.dependencies}
                    </label>
                    <div className="flex gap-2 mb-2">
                      <Input
                        type="text"
                        value={newDependency}
                        onChange={(value) => setNewDependency(String(value))}
                        onKeyPress={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            addDependency();
                          }
                        }}
                        list="step-codes"
                        className={`flex-1 ${tw.rounded} border border-gray-300 px-3 py-2 text-sm focus:border-[#3b8169] focus:outline-none focus:ring-1 focus:ring-[#3b8169]`}
                        placeholder="Enter step code"
                      />
                      <datalist id="step-codes">
                        {availableStepCodes.map((code) => (
                          <option key={code} value={code} />
                        ))}
                      </datalist>
                      <button
                        type="button"
                        onClick={addDependency}
                        className={`${tw.rounded} border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50`}
                      >
                        {t.jobs.jobWorkflow.add}
                      </button>
                    </div>
                    <div className="space-y-2">
                      {formData.depends_on_step_codes?.map((code) => (
                        <div
                          key={code}
                          className={`flex items-center justify-between ${tw.rounded} bg-gray-50 px-3 py-2`}
                        >
                          <span className="text-sm text-gray-900">{code}</span>
                          <button
                            type="button"
                            onClick={() => removeDependency(code)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                      {(!formData.depends_on_step_codes ||
                        formData.depends_on_step_codes.length === 0) && (
                        <p className="text-sm text-gray-500">
                          No dependencies added
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Validation */}
              <div
                className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm`}
              >
                <h2 className="mb-4 text-lg font-semibold text-gray-900">
                  {t.jobs.jobWorkflow.validation}
                </h2>
                <div className="space-y-4">
                  <Textarea
                    label={t.jobs.jobWorkflow.preValidationQuery}
                    value={formData.pre_validation_query || ""}
                    onChange={(value) =>
                      setFormData({
                        ...formData,
                        pre_validation_query: value || null,
                      })
                    }
                    rows={3}
                    className="font-mono"
                    placeholder={t.jobs.jobWorkflow.sqlBeforeExecution}
                  />

                  <Textarea
                    label={t.jobs.jobWorkflow.postValidationQuery}
                    value={formData.post_validation_query || ""}
                    onChange={(value) =>
                      setFormData({
                        ...formData,
                        post_validation_query: value || null,
                      })
                    }
                    rows={3}
                    className="font-mono"
                    placeholder={t.jobs.jobWorkflow.sqlAfterExecution}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      label={t.jobs.jobWorkflow.minExpectedRows}
                      type="number"
                      min="0"
                      value={formData.expected_row_count_min || ""}
                      onChange={(value) =>
                        setFormData({
                          ...formData,
                          expected_row_count_min: String(value)
                            ? Number(String(value))
                            : null,
                        })
                      }
                      className={`w-full ${tw.rounded} border border-gray-300 px-3 py-2 text-sm focus:border-[#3b8169] focus:outline-none focus:ring-1 focus:ring-[#3b8169]`}
                    />

                    <Input
                      label={t.jobs.jobWorkflow.maxExpectedRows}
                      type="number"
                      min="0"
                      value={formData.expected_row_count_max || ""}
                      onChange={(value) =>
                        setFormData({
                          ...formData,
                          expected_row_count_max: String(value)
                            ? Number(String(value))
                            : null,
                        })
                      }
                      className={`w-full ${tw.rounded} border border-gray-300 px-3 py-2 text-sm focus:border-[#3b8169] focus:outline-none focus:ring-1 focus:ring-[#3b8169]`}
                    />
                  </div>
                </div>
              </div>

              {/* Status */}
              <div
                className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm`}
              >
                <h2 className="mb-4 text-lg font-semibold text-gray-900">
                  {t.jobs.jobWorkflow.status}
                </h2>
                <div className="space-y-3">
                  <div
                    className="flex items-center gap-2 cursor-pointer"
                    onClick={() =>
                      setFormData({
                        ...formData,
                        is_active: !formData.is_active,
                      })
                    }
                  >
                    <Checkbox
                      id="is-active"
                      checked={formData.is_active}
                      onChange={() =>
                        setFormData({
                          ...formData,
                          is_active: !formData.is_active,
                        })
                      }
                    />
                    <span className="text-sm font-medium text-gray-700">
                      {t.jobs.jobWorkflow.active}
                    </span>
                  </div>

                  <label className="flex items-center gap-2">
                    <Checkbox checked={formData.is_critical}
                      onChange={(value) =>
                        setFormData({
                          ...formData,
                          is_critical: e.target.checked,
                        })
                      }
                      className="rounded border-gray-300 text-[#3b8169] focus:ring-[#3b8169]" />
                    <span className="text-sm font-medium text-gray-700">
                      {t.jobs.jobWorkflow.critical}
                    </span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        ) : null}

        {/* Form Actions */}
        <div className="flex items-center justify-end gap-3 border-t border-gray-200 pt-6">
          <button
            type="button"
            onClick={() =>
              navigate(
                `/dashboard/job-workflow-steps${
                  formData.job_id ? `?job_id=${formData.job_id}` : ""
                }`
              )
            }
            className="transition-colors disabled:opacity-60"
            style={getButtonStyles(button.bordered)}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSaving || (batchMode && batchSteps.length === 0)}
            className={`${tw.rounded} px-4 py-2 text-sm font-semibold text-white disabled:opacity-50`}
            style={{ backgroundColor: color.primary.action }}
          >
            {isSaving ? (
              <>
                <LoadingSpinner />
                {isEditMode ? "Updating..." : "Creating..."}
              </>
            ) : (
              isEditMode ? "Update" : "Create"
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
