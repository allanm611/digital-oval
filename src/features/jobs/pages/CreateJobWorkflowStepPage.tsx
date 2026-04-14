import { Fragment, useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Save, X, Plus } from "lucide-react";
import { CheckIcon, ChevronUpDownIcon } from "@heroicons/react/20/solid";
import { Listbox, Transition } from "@headlessui/react";
import { jobWorkflowStepService } from "../services/jobWorkflowStepService";
import { scheduledJobService } from "../services/scheduledJobService";
import HeadlessSelect from "../../../shared/components/ui/HeadlessSelect";
import {
  CreateJobWorkflowStepPayload,
  UpdateJobWorkflowStepPayload,
  StepType,
  FailureAction,
} from "../types/jobWorkflowStep";
import { ScheduledJob } from "../types/scheduledJob";
import { useToast } from "../../../contexts/ToastContext";
import { useAuth } from "../../../contexts/AuthContext";
import { useLanguage } from "../../../contexts/LanguageContext";
import LoadingSpinner from "../../../shared/components/ui/LoadingSpinner";
import { color, tw, noteStyles, zIndex } from "../../../shared/utils/utils";
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
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const jobIdParam = searchParams.get("job_id");
  const batchMode = searchParams.get("batch") === "true";
  const navigate = useNavigate();
  const { error: showError, success: showToast } = useToast();
  const { user } = useAuth();
  const { t } = useLanguage();
  const isEditMode = !!id;

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
        showError(
          "Error",
          err instanceof Error ? err.message : "Failed to load jobs"
        );
      }
    };

    loadJobs();
  }, [showError]);

  // Load step data when editing
  useEffect(() => {
    if (!isEditMode || !id) return;

    const loadStep = async () => {
      setIsLoading(true);
      try {
        const step = await jobWorkflowStepService.getJobWorkflowStepById(
          Number(id),
          true
        );
        setOriginalStepOrder(step.step_order);
        setFormData({
          job_id: step.job_id,
          step_order: step.step_order,
          step_name: step.step_name,
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
        showError(
          "Error",
          err instanceof Error ? err.message : "Failed to load step"
        );
      } finally {
        setIsLoading(false);
      }
    };

    loadStep();
  }, [id, isEditMode, user?.user_id, showError]);

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
      if (isEditMode && id) {
        // Backend does not allow changing job_id on update; omit it from payload
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
      showError(
        "Error",
        err instanceof Error ? err.message : "Failed to save workflow step"
      );
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
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate(-1)}
          className={`p-2 ${tw.rounded} text-gray-600 transition-colors`}
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className={`text-2xl font-bold ${tw.textPrimary}`}>
          {isEditMode ? t.jobs.jobWorkflow.editWorkflowStep : t.jobs.jobWorkflow.createWorkflowStep}
        </h1>
      </div>

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
                    <input
                      type="text"
                      value={step.step_name || ""}
                      onChange={(e) =>
                        updateBatchStep(idx, "step_name", e.target.value)
                      }
                      className={`w-full ${tw.rounded} border ${
                        errors[`batch_step_${idx}_name`]
                          ? "border-red-300"
                          : "border-gray-300"
                      } px-2 py-1.5 text-sm`}
                      placeholder={t.jobs.jobWorkflow.enterStepName}
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
                    <input
                      type="text"
                      value={step.step_code || ""}
                      onChange={(e) =>
                        updateBatchStep(idx, "step_code", e.target.value)
                      }
                      className={`w-full ${tw.rounded} border ${
                        errors[`batch_step_${idx}_code`]
                          ? "border-red-300"
                          : "border-gray-300"
                      } px-2 py-1.5 text-sm`}
                      placeholder={t.jobs.jobWorkflow.enterStepCode}
                    />
                    {errors[`batch_step_${idx}_code`] && (
                      <p className="mt-1 text-xs text-red-600">
                        {errors[`batch_step_${idx}_code`]}
                      </p>
                    )}
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      {t.jobs.jobWorkflow.stepDescription} *
                    </label>
                    <textarea
                      value={step.step_description || ""}
                      onChange={(e) =>
                        updateBatchStep(idx, "step_description", e.target.value)
                      }
                      className={`w-full ${tw.rounded} border ${
                        errors[`batch_step_${idx}_description`]
                          ? "border-red-300"
                          : "border-gray-300"
                      } px-2 py-1.5 text-sm`}
                      rows={2}
                      placeholder={t.jobs.jobWorkflow.enterStepDescription}
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
                    <input
                      type="number"
                      min="1"
                      value={step.step_order || idx + 1}
                      onChange={(e) =>
                        updateBatchStep(
                          idx,
                          "step_order",
                          Number(e.target.value) || idx + 1
                        )
                      }
                      className={`w-full ${tw.rounded} border border-gray-300 px-2 py-1.5 text-sm`}
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
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      {t.jobs.jobWorkflow.stepAction} *
                    </label>
                    <textarea
                      value={step.step_action || ""}
                      onChange={(e) =>
                        updateBatchStep(idx, "step_action", e.target.value)
                      }
                      rows={2}
                      className={`w-full ${tw.rounded} border ${
                        errors[`batch_step_${idx}_action`]
                          ? "border-red-300"
                          : "border-gray-300"
                      } px-2 py-1.5 text-sm font-mono`}
                      placeholder={t.jobs.jobWorkflow.enterStepAction}
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

      <form onSubmit={handleSubmit} className="space-y-6">
        {!batchMode ? (
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Left Column */}
            <div className="space-y-6">
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t.jobs.jobWorkflow.stepName} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.step_name}
                      onChange={(e) =>
                        setFormData({ ...formData, step_name: e.target.value })
                      }
                      className={`w-full ${tw.rounded} border ${
                        errors.step_name ? "border-red-300" : "border-gray-300"
                      } px-3 py-2 text-sm focus:border-[#3b8169] focus:outline-none focus:ring-1 focus:ring-[#3b8169]`}
                      placeholder={t.jobs.jobWorkflow.enterStepName}
                    />
                    {errors.step_name && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.step_name}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t.jobs.jobWorkflow.stepCode} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.step_code}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          step_code: e.target.value,
                        })
                      }
                      className={`w-full ${tw.rounded} border ${
                        errors.step_code ? "border-red-300" : "border-gray-300"
                      } px-3 py-2 text-sm focus:border-[#3b8169] focus:outline-none focus:ring-1 focus:ring-[#3b8169]`}
                      placeholder={t.jobs.jobWorkflow.enterStepCode}
                    />
                    {errors.step_code && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.step_code}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t.jobs.jobWorkflow.stepOrder} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={formData.step_order}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          step_order: Number(e.target.value) || 1,
                        })
                      }
                      className={`w-full ${tw.rounded} border ${
                        errors.step_order ? "border-red-300" : "border-gray-300"
                      } px-3 py-2 text-sm focus:border-[#3b8169] focus:outline-none focus:ring-1 focus:ring-[#3b8169]`}
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
                    <Listbox
                      value={formData.step_type}
                      onChange={(value) =>
                        setFormData({ ...formData, step_type: value })
                      }
                    >
                      <div className="relative">
                        <Listbox.Button
                          className={`relative w-full cursor-default ${tw.rounded} border border-gray-300 bg-white py-2 pl-3 pr-10 text-left text-sm focus:border-[#3b8169] focus:outline-none focus:ring-1 focus:ring-[#3b8169]`}
                        >
                          <span className="block truncate">
                            {getStepTypes(t).find(
                              (type) => type.value === formData.step_type
                            )?.label || t.jobs.jobWorkflow.selectType}
                          </span>
                          <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                            <ChevronUpDownIcon
                              className="h-5 w-5 text-gray-400"
                              aria-hidden="true"
                            />
                          </span>
                        </Listbox.Button>
                        <Transition
                          as={Fragment}
                          leave="transition ease-in duration-100"
                          leaveFrom="opacity-100"
                          leaveTo="opacity-0"
                        >
                          <Listbox.Options
                            className={`absolute mt-1 max-h-60 w-full overflow-auto ${tw.rounded} bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm`}
                            style={{ zIndex: zIndex.dropdown }}
                          >
                            {getStepTypes(t).map((type) => (
                              <Listbox.Option
                                key={type.value}
                                className={({ active }) =>
                                  `relative cursor-default select-none py-2 pl-10 pr-4 ${
                                    active
                                      ? "bg-[#3b8169] text-white"
                                      : "text-gray-900"
                                  }`
                                }
                                value={type.value}
                              >
                                {({ selected }) => (
                                  <>
                                    <span
                                      className={`block truncate ${
                                        selected ? "font-medium" : "font-normal"
                                      }`}
                                    >
                                      {type.label}
                                    </span>
                                    {selected ? (
                                      <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-[#3b8169]">
                                        <CheckIcon
                                          className="h-5 w-5"
                                          aria-hidden="true"
                                        />
                                      </span>
                                    ) : null}
                                  </>
                                )}
                              </Listbox.Option>
                            ))}
                          </Listbox.Options>
                        </Transition>
                      </div>
                    </Listbox>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t.jobs.jobWorkflow.stepDescription} <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={formData.step_description ?? ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          step_description: e.target.value,
                        })
                      }
                      rows={3}
                      className={`w-full ${tw.rounded} border ${
                        errors.step_description
                          ? "border-red-300"
                          : "border-gray-300"
                      } px-3 py-2 text-sm focus:border-[#3b8169] focus:outline-none focus:ring-1 focus:ring-[#3b8169]`}
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t.jobs.jobWorkflow.stepAction} <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={formData.step_action}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          step_action: e.target.value,
                        })
                      }
                      rows={4}
                      className={`w-full ${tw.rounded} border ${
                        errors.step_action
                          ? "border-red-300"
                          : "border-gray-300"
                      } px-3 py-2 text-sm font-mono focus:border-[#3b8169] focus:outline-none focus:ring-1 focus:ring-[#3b8169]`}
                      placeholder={t.jobs.jobWorkflow.enterStepAction}
                    />
                    {errors.step_action && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.step_action}
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {t.jobs.jobWorkflow.timeoutSeconds}{" "}
                        <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="86400"
                        value={formData.timeout_seconds}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            timeout_seconds: Number(e.target.value) || 300,
                          })
                        }
                        className={`w-full ${tw.rounded} border ${
                          errors.timeout_seconds
                            ? "border-red-300"
                            : "border-gray-300"
                        } px-3 py-2 text-sm focus:border-[#3b8169] focus:outline-none focus:ring-1 focus:ring-[#3b8169]`}
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
                      <Listbox
                        value={formData.on_failure_action}
                        onChange={(value) =>
                          setFormData({ ...formData, on_failure_action: value })
                        }
                      >
                        <div className="relative">
                          <Listbox.Button
                            className={`relative w-full cursor-default ${tw.rounded} border border-gray-300 bg-white py-2 pl-3 pr-10 text-left text-sm focus:border-[#3b8169] focus:outline-none focus:ring-1 focus:ring-[#3b8169]`}
                          >
                            <span className="block truncate">
                              {getFailureActions(t).find(
                                (a) => a.value === formData.on_failure_action
                              )?.label || t.jobs.jobWorkflow.selectAction}
                            </span>
                            <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                              <ChevronUpDownIcon
                                className="h-5 w-5 text-gray-400"
                                aria-hidden="true"
                              />
                            </span>
                          </Listbox.Button>
                          <Transition
                            as={Fragment}
                            leave="transition ease-in duration-100"
                            leaveFrom="opacity-100"
                            leaveTo="opacity-0"
                          >
                            <Listbox.Options
                              className={`absolute mt-1 max-h-60 w-full overflow-auto ${tw.rounded} bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm`}
                              style={{ zIndex: zIndex.dropdown }}
                            >
                              {getFailureActions(t).map((action) => (
                                <Listbox.Option
                                  key={action.value}
                                  className={({ active }) =>
                                    `relative cursor-default select-none py-2 pl-10 pr-4 ${
                                      active
                                        ? "bg-[#3b8169] text-white"
                                        : "text-gray-900"
                                    }`
                                  }
                                  value={action.value}
                                >
                                  {({ selected }) => (
                                    <>
                                      <span
                                        className={`block truncate ${
                                          selected
                                            ? "font-medium"
                                            : "font-normal"
                                        }`}
                                      >
                                        {action.label}
                                      </span>
                                      {selected ? (
                                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-[#3b8169]">
                                          <CheckIcon
                                            className="h-5 w-5"
                                            aria-hidden="true"
                                          />
                                        </span>
                                      ) : null}
                                    </>
                                  )}
                                </Listbox.Option>
                              ))}
                            </Listbox.Options>
                          </Transition>
                        </div>
                      </Listbox>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {t.jobs.jobWorkflow.retryCount}
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="10"
                        value={formData.retry_count}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            retry_count: Number(e.target.value) || 0,
                          })
                        }
                        className={`w-full ${tw.rounded} border ${
                          errors.retry_count
                            ? "border-red-300"
                            : "border-gray-300"
                        } px-3 py-2 text-sm focus:border-[#3b8169] focus:outline-none focus:ring-1 focus:ring-[#3b8169]`}
                      />
                      {errors.retry_count && (
                        <p className="mt-1 text-sm text-red-600">
                          {errors.retry_count}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {t.jobs.jobWorkflow.retryDelaySeconds}
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={formData.retry_delay_seconds}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            retry_delay_seconds: Number(e.target.value) || 0,
                          })
                        }
                        className={`w-full ${tw.rounded} border border-gray-300 px-3 py-2 text-sm focus:border-[#3b8169] focus:outline-none focus:ring-1 focus:ring-[#3b8169]`}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-6">
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
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {t.jobs.jobWorkflow.parallelGroupId}
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={formData.parallel_group_id || ""}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            parallel_group_id: e.target.value
                              ? Number(e.target.value)
                              : null,
                          })
                        }
                        className={`w-full ${tw.rounded} border border-gray-300 px-3 py-2 text-sm focus:border-[#3b8169] focus:outline-none focus:ring-1 focus:ring-[#3b8169]`}
                        placeholder={t.jobs.jobWorkflow.enterParallelGroupId}
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t.jobs.jobWorkflow.dependencies}
                    </label>
                    <div className="flex gap-2 mb-2">
                      <input
                        type="text"
                        value={newDependency}
                        onChange={(e) => setNewDependency(e.target.value)}
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
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t.jobs.jobWorkflow.preValidationQuery}
                    </label>
                    <textarea
                      value={formData.pre_validation_query || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          pre_validation_query: e.target.value || null,
                        })
                      }
                      rows={3}
                      className={`w-full ${tw.rounded} border border-gray-300 px-3 py-2 text-sm font-mono focus:border-[#3b8169] focus:outline-none focus:ring-1 focus:ring-[#3b8169]`}
                      placeholder={t.jobs.jobWorkflow.sqlBeforeExecution}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t.jobs.jobWorkflow.postValidationQuery}
                    </label>
                    <textarea
                      value={formData.post_validation_query || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          post_validation_query: e.target.value || null,
                        })
                      }
                      rows={3}
                      className={`w-full ${tw.rounded} border border-gray-300 px-3 py-2 text-sm font-mono focus:border-[#3b8169] focus:outline-none focus:ring-1 focus:ring-[#3b8169]`}
                      placeholder={t.jobs.jobWorkflow.sqlAfterExecution}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {t.jobs.jobWorkflow.minExpectedRows}
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={formData.expected_row_count_min || ""}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            expected_row_count_min: e.target.value
                              ? Number(e.target.value)
                              : null,
                          })
                        }
                        className={`w-full ${tw.rounded} border border-gray-300 px-3 py-2 text-sm focus:border-[#3b8169] focus:outline-none focus:ring-1 focus:ring-[#3b8169]`}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {t.jobs.jobWorkflow.maxExpectedRows}
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={formData.expected_row_count_max || ""}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            expected_row_count_max: e.target.value
                              ? Number(e.target.value)
                              : null,
                          })
                        }
                        className={`w-full ${tw.rounded} border border-gray-300 px-3 py-2 text-sm focus:border-[#3b8169] focus:outline-none focus:ring-1 focus:ring-[#3b8169]`}
                      />
                    </div>
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
                      onChange={(e) =>
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
            className={`${tw.rounded} border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50`}
          >
            {t.common.cancel}
          </button>
          <button
            type="submit"
            disabled={isSaving || (batchMode && batchSteps.length === 0)}
            className={`inline-flex items-center gap-2 ${tw.rounded} px-4 py-2 text-sm font-semibold text-white disabled:opacity-50`}
            style={{ backgroundColor: color.primary.action }}
          >
            {isSaving ? (
              <>
                <LoadingSpinner />
                {batchMode ? t.jobs.jobWorkflow.creating : t.jobs.jobWorkflow.saving}
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                {isEditMode
                  ? t.jobs.jobWorkflow.updateStep
                  : batchMode
                  ? `${t.jobs.jobWorkflow.createStep} ${batchSteps.length}`
                  : t.jobs.jobWorkflow.createStep}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
