import { Fragment, useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Save, X, Plus } from "lucide-react";
import { CheckIcon, ChevronUpDownIcon } from "@heroicons/react/20/solid";
import { Listbox, Transition } from "@headlessui/react";
import { jobWorkflowStepService } from "../services/jobWorkflowStepService";
import { scheduledJobService } from "../services/scheduledJobService";
import {
  CreateJobWorkflowStepPayload,
  UpdateJobWorkflowStepPayload,
  StepType,
  FailureAction,
} from "../types/jobWorkflowStep";
import { ScheduledJob } from "../types/scheduledJob";
import { useToast } from "../../../contexts/ToastContext";
import { useAuth } from "../../../contexts/AuthContext";
import LoadingSpinner from "../../../shared/components/ui/LoadingSpinner";
import { color, tw } from "../../../shared/utils/utils";

const STEP_TYPES: { value: StepType; label: string }[] = [
  { value: "sql", label: "SQL" },
  { value: "stored_proc", label: "Stored Procedure" },
  { value: "api_call", label: "API Call" },
  { value: "python_script", label: "Python Script" },
  { value: "node_js_script", label: "Node.js Script" },
  { value: "shell_script", label: "Shell Script" },
  { value: "file_transfer", label: "File Transfer" },
  { value: "data_validation", label: "Data Validation" },
  { value: "notification", label: "Notification" },
  { value: "wait", label: "Wait" },
];

const FAILURE_ACTIONS: { value: FailureAction; label: string }[] = [
  { value: "abort", label: "Abort" },
  { value: "continue", label: "Continue" },
  { value: "retry", label: "Retry" },
  { value: "skip_remaining", label: "Skip Remaining" },
];

const classNames = (...classes: (string | false | null | undefined)[]) =>
  classes.filter(Boolean).join(" ");

export default function CreateJobWorkflowStepPage() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const jobIdParam = searchParams.get("job_id");
  const batchMode = searchParams.get("batch") === "true";
  const navigate = useNavigate();
  const { error: showError, success: showToast } = useToast();
  const { user } = useAuth();
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
    userId: user?.user_id || 0,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [newDependency, setNewDependency] = useState("");
  // Batch create state
  const [batchSteps, setBatchSteps] = useState<
    Array<Partial<CreateJobWorkflowStepPayload>>
  >([]);
  const [isBatchCreating, setIsBatchCreating] = useState(false);

  // Load jobs and step codes
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const [jobsResponse, stepsResponse] = await Promise.all([
          scheduledJobService.listScheduledJobs({
            limit: 1000,
            skipCache: true,
          }),
          formData.job_id
            ? jobWorkflowStepService.getStepsByJobId(formData.job_id, true)
            : Promise.resolve({ data: [] }),
        ]);

        setJobs(jobsResponse.data || []);
        const stepCodes = (stepsResponse.data || []).map((s) => s.step_code);
        setAvailableStepCodes(stepCodes);

        // If editing, load the step
        if (isEditMode && id) {
          const step = await jobWorkflowStepService.getJobWorkflowStepById(
            Number(id),
            true
          );
          setFormData({
            job_id: step.job_id,
            step_order: step.step_order,
            step_name: step.step_name,
            step_code: step.step_code,
            step_description: step.step_description || "",
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
            userId: user?.user_id || 0,
          });
        }
      } catch (err) {
        showError(
          "Error",
          err instanceof Error ? err.message : "Failed to load data"
        );
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [id, isEditMode, user?.user_id, showError]);

  // Reload step codes when job changes
  useEffect(() => {
    if (formData.job_id) {
      jobWorkflowStepService
        .getStepsByJobId(formData.job_id, true)
        .then((response) => {
          const stepCodes = (response.data || []).map((s) => s.step_code);
          setAvailableStepCodes(stepCodes);
        })
        .catch(() => {
          setAvailableStepCodes([]);
        });
    }
  }, [formData.job_id]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.job_id) {
      newErrors.job_id = "Job ID is required";
    }
    if (!formData.step_name?.trim()) {
      newErrors.step_name = "Step name is required";
    }
    if (!formData.step_code?.trim()) {
      newErrors.step_code = "Step code is required";
    }
    if (!formData.step_action?.trim()) {
      newErrors.step_action = "Step action is required";
    }
    if (formData.step_order < 1) {
      newErrors.step_order = "Step order must be at least 1";
    }
    if (formData.timeout_seconds < 1 || formData.timeout_seconds > 86400) {
      newErrors.timeout_seconds = "Timeout must be between 1 and 86400 seconds";
    }
    if (formData.retry_count < 0 || formData.retry_count > 10) {
      newErrors.retry_count = "Retry count must be between 0 and 10";
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
        const updatePayload: UpdateJobWorkflowStepPayload = {
          ...formData,
          userId: user?.user_id || 0,
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
          userId: user?.user_id || 0,
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
      navigate(
        `/dashboard/job-workflow-steps${
          formData.job_id ? `?job_id=${formData.job_id}` : ""
        }`
      );
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
    setBatchSteps([
      ...batchSteps,
      {
        step_order: batchSteps.length + 1,
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
          onClick={() =>
            navigate(
              `/dashboard/job-workflow-steps${
                formData.job_id ? `?job_id=${formData.job_id}` : ""
              }`
            )
          }
          className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className={`text-2xl font-bold ${tw.textPrimary}`}>
          {isEditMode ? "Edit Workflow Step" : "Create Workflow Step"}
        </h1>
      </div>

      {batchMode && batchSteps.length === 0 && (
        <div className="rounded-md border border-blue-200 bg-blue-50 p-4 mb-6">
          <div className="flex items-center justify-between">
            <p className="text-sm text-blue-800">
              Batch mode: Create multiple steps at once
            </p>
            <button
              type="button"
              onClick={addBatchStep}
              className="inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-semibold text-white"
              style={{ backgroundColor: color.primary.action }}
            >
              <Plus className="h-4 w-4" />
              Add Step
            </button>
          </div>
        </div>
      )}

      {batchMode && batchSteps.length > 0 && (
        <div className="rounded-md border border-gray-200 bg-white p-6 shadow-sm mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Batch Steps ({batchSteps.length})
            </h2>
            <button
              type="button"
              onClick={addBatchStep}
              className="inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50"
            >
              <Plus className="h-4 w-4" />
              Add Another
            </button>
          </div>
          <div className="space-y-4">
            {batchSteps.map((step, idx) => (
              <div
                key={idx}
                className="rounded-md border border-gray-200 bg-gray-50 p-4"
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
                      Step Name *
                    </label>
                    <input
                      type="text"
                      value={step.step_name || ""}
                      onChange={(e) =>
                        updateBatchStep(idx, "step_name", e.target.value)
                      }
                      className="w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm"
                      placeholder="Enter step name"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Step Code *
                    </label>
                    <input
                      type="text"
                      value={step.step_code || ""}
                      onChange={(e) =>
                        updateBatchStep(
                          idx,
                          "step_code",
                          e.target.value.toUpperCase().replace(/\s/g, "_")
                        )
                      }
                      className="w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm"
                      placeholder="STEP_CODE"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Step Order *
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
                      className="w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Step Type *
                    </label>
                    <select
                      value={step.step_type || "sql"}
                      onChange={(e) =>
                        updateBatchStep(idx, "step_type", e.target.value)
                      }
                      className="w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm"
                    >
                      {STEP_TYPES.map((type) => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Step Action *
                    </label>
                    <textarea
                      value={step.step_action || ""}
                      onChange={(e) =>
                        updateBatchStep(idx, "step_action", e.target.value)
                      }
                      rows={2}
                      className="w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm font-mono"
                      placeholder="Enter step action"
                    />
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
              <div className="rounded-md border border-gray-200 bg-white p-6 shadow-sm">
                <h2 className="mb-4 text-lg font-semibold text-gray-900">
                  Basic Information
                </h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Job <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.job_id || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          job_id: Number(e.target.value),
                        })
                      }
                      disabled={!!jobIdParam || isEditMode}
                      className={`w-full rounded-md border ${
                        errors.job_id ? "border-red-300" : "border-gray-300"
                      } px-3 py-2 text-sm focus:border-[#3b8169] focus:outline-none focus:ring-1 focus:ring-[#3b8169] disabled:bg-gray-100`}
                    >
                      <option value="">Select a job</option>
                      {jobs.map((job) => (
                        <option key={job.id} value={job.id}>
                          {job.name} ({job.code})
                        </option>
                      ))}
                    </select>
                    {errors.job_id && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.job_id}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Step Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.step_name}
                      onChange={(e) =>
                        setFormData({ ...formData, step_name: e.target.value })
                      }
                      className={`w-full rounded-md border ${
                        errors.step_name ? "border-red-300" : "border-gray-300"
                      } px-3 py-2 text-sm focus:border-[#3b8169] focus:outline-none focus:ring-1 focus:ring-[#3b8169]`}
                      placeholder="Enter step name"
                    />
                    {errors.step_name && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.step_name}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Step Code <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.step_code}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          step_code: e.target.value
                            .toUpperCase()
                            .replace(/\s/g, "_"),
                        })
                      }
                      className={`w-full rounded-md border ${
                        errors.step_code ? "border-red-300" : "border-gray-300"
                      } px-3 py-2 text-sm focus:border-[#3b8169] focus:outline-none focus:ring-1 focus:ring-[#3b8169]`}
                      placeholder="STEP_CODE"
                    />
                    {errors.step_code && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.step_code}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Step Order <span className="text-red-500">*</span>
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
                      className={`w-full rounded-md border ${
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
                      Step Type <span className="text-red-500">*</span>
                    </label>
                    <Listbox
                      value={formData.step_type}
                      onChange={(value) =>
                        setFormData({ ...formData, step_type: value })
                      }
                    >
                      <div className="relative">
                        <Listbox.Button className="relative w-full cursor-default rounded-md border border-gray-300 bg-white py-2 pl-3 pr-10 text-left text-sm focus:border-[#3b8169] focus:outline-none focus:ring-1 focus:ring-[#3b8169]">
                          <span className="block truncate">
                            {STEP_TYPES.find(
                              (t) => t.value === formData.step_type
                            )?.label || "Select type"}
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
                          <Listbox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                            {STEP_TYPES.map((type) => (
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
                      Step Description
                    </label>
                    <textarea
                      value={formData.step_description || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          step_description: e.target.value,
                        })
                      }
                      rows={3}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-[#3b8169] focus:outline-none focus:ring-1 focus:ring-[#3b8169]"
                      placeholder="Enter step description"
                    />
                  </div>
                </div>
              </div>

              {/* Execution Configuration */}
              <div className="rounded-md border border-gray-200 bg-white p-6 shadow-sm">
                <h2 className="mb-4 text-lg font-semibold text-gray-900">
                  Execution Configuration
                </h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Step Action <span className="text-red-500">*</span>
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
                      className={`w-full rounded-md border ${
                        errors.step_action
                          ? "border-red-300"
                          : "border-gray-300"
                      } px-3 py-2 text-sm font-mono focus:border-[#3b8169] focus:outline-none focus:ring-1 focus:ring-[#3b8169]`}
                      placeholder="Enter step action (SQL query, script path, API endpoint, etc.)"
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
                        Timeout (seconds){" "}
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
                        className={`w-full rounded-md border ${
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
                        On Failure Action
                      </label>
                      <Listbox
                        value={formData.on_failure_action}
                        onChange={(value) =>
                          setFormData({ ...formData, on_failure_action: value })
                        }
                      >
                        <div className="relative">
                          <Listbox.Button className="relative w-full cursor-default rounded-md border border-gray-300 bg-white py-2 pl-3 pr-10 text-left text-sm focus:border-[#3b8169] focus:outline-none focus:ring-1 focus:ring-[#3b8169]">
                            <span className="block truncate">
                              {FAILURE_ACTIONS.find(
                                (a) => a.value === formData.on_failure_action
                              )?.label || "Select action"}
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
                            <Listbox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                              {FAILURE_ACTIONS.map((action) => (
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
                        Retry Count
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
                        className={`w-full rounded-md border ${
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
                        Retry Delay (seconds)
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
                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-[#3b8169] focus:outline-none focus:ring-1 focus:ring-[#3b8169]"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              {/* Dependencies & Parallel Execution */}
              <div className="rounded-md border border-gray-200 bg-white p-6 shadow-sm">
                <h2 className="mb-4 text-lg font-semibold text-gray-900">
                  Dependencies & Parallel Execution
                </h2>
                <div className="space-y-4">
                  <div>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formData.is_parallel}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            is_parallel: e.target.checked,
                          })
                        }
                        className="rounded border-gray-300 text-[#3b8169] focus:ring-[#3b8169]"
                      />
                      <span className="text-sm font-medium text-gray-700">
                        Enable Parallel Execution
                      </span>
                    </label>
                  </div>

                  {formData.is_parallel && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Parallel Group ID
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
                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-[#3b8169] focus:outline-none focus:ring-1 focus:ring-[#3b8169]"
                        placeholder="Enter parallel group ID"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Dependencies (Step Codes)
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
                        className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-[#3b8169] focus:outline-none focus:ring-1 focus:ring-[#3b8169]"
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
                        className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                      >
                        Add
                      </button>
                    </div>
                    <div className="space-y-2">
                      {formData.depends_on_step_codes?.map((code) => (
                        <div
                          key={code}
                          className="flex items-center justify-between rounded-md bg-gray-50 px-3 py-2"
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
              <div className="rounded-md border border-gray-200 bg-white p-6 shadow-sm">
                <h2 className="mb-4 text-lg font-semibold text-gray-900">
                  Validation
                </h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Pre-Validation Query
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
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm font-mono focus:border-[#3b8169] focus:outline-none focus:ring-1 focus:ring-[#3b8169]"
                      placeholder="SQL query to run before execution"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Post-Validation Query
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
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm font-mono focus:border-[#3b8169] focus:outline-none focus:ring-1 focus:ring-[#3b8169]"
                      placeholder="SQL query to run after execution"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Min Expected Rows
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
                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-[#3b8169] focus:outline-none focus:ring-1 focus:ring-[#3b8169]"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Max Expected Rows
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
                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-[#3b8169] focus:outline-none focus:ring-1 focus:ring-[#3b8169]"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Status */}
              <div className="rounded-md border border-gray-200 bg-white p-6 shadow-sm">
                <h2 className="mb-4 text-lg font-semibold text-gray-900">
                  Status
                </h2>
                <div className="space-y-3">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.is_active}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          is_active: e.target.checked,
                        })
                      }
                      className="rounded border-gray-300 text-[#3b8169] focus:ring-[#3b8169]"
                    />
                    <span className="text-sm font-medium text-gray-700">
                      Active
                    </span>
                  </label>

                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.is_critical}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          is_critical: e.target.checked,
                        })
                      }
                      className="rounded border-gray-300 text-[#3b8169] focus:ring-[#3b8169]"
                    />
                    <span className="text-sm font-medium text-gray-700">
                      Critical
                    </span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        ) : null}

        {batchMode ? (
          <div className="rounded-md border border-amber-200 bg-amber-50 p-4">
            <p className="text-sm text-amber-800">
              <strong>Note:</strong> In batch mode, only the job selection and
              batch steps above will be used. Individual step configuration
              fields are ignored.
            </p>
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
            className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSaving || (batchMode && batchSteps.length === 0)}
            className="inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
            style={{ backgroundColor: color.primary.action }}
          >
            {isSaving ? (
              <>
                <LoadingSpinner />
                {batchMode ? "Creating..." : "Saving..."}
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                {isEditMode
                  ? "Update Step"
                  : batchMode
                  ? `Create ${batchSteps.length} Steps`
                  : "Create Step"}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
