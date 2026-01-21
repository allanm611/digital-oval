import { Fragment, useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Save, X, XCircle } from "lucide-react";
import BackButton from "../../../shared/components/ui/BackButton";
import { navigateBackOrFallback } from "../../../shared/utils/navigation";
import { CheckIcon, ChevronUpDownIcon } from "@heroicons/react/20/solid";
import { Listbox, Transition } from "@headlessui/react";
import { scheduledJobService } from "../services/scheduledJobService";
import { jobTypeService } from "../services/jobTypeService";
import {
  CreateScheduledJobPayload,
  UpdateScheduledJobPayload,
  ScheduleType,
  JobStatus,
} from "../types/scheduledJob";
import { JobType } from "../types/job";
import { useToast } from "../../../contexts/ToastContext";
import { useAuth } from "../../../contexts/AuthContext";
import LoadingSpinner from "../../../shared/components/ui/LoadingSpinner";
import { color, tw } from "../../../shared/utils/utils";

const SCHEDULE_TYPES: { value: ScheduleType; label: string }[] = [
  { value: "manual", label: "Manual" },
  { value: "cron", label: "Cron" },
  { value: "interval", label: "Interval" },
  { value: "event_driven", label: "Event Driven" },
  { value: "dependency_based", label: "Dependency Based" },
];

const STATUS_OPTIONS: { value: JobStatus; label: string }[] = [
  { value: "draft", label: "Draft" },
  { value: "active", label: "Active" },
  { value: "paused", label: "Paused" },
  { value: "archived", label: "Archived" },
];

const PROCESSING_MODE_OPTIONS = [
  { value: "batch", label: "Batch" },
  { value: "streaming", label: "Streaming" },
  { value: "real-time", label: "Real-time" },
];

const sanitizeWindowValue = (value?: string | null) => {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

const classNames = (...classes: (string | false | null | undefined)[]) =>
  classes.filter(Boolean).join(" ");

export default function CreateScheduledJobPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { error: showError, success: showToast } = useToast();
  const { user } = useAuth();
  const isEditMode = !!id;

  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [jobTypes, setJobTypes] = useState<JobType[]>([]);
  const [formData, setFormData] = useState<CreateScheduledJobPayload>({
    name: "",
    code: "",
    description: "",
    job_type_id: undefined,
    status: "draft",
    schedule_type: "cron",
    cron_expression: "",
    interval_seconds: undefined,
    technical_owner_id: undefined,
    tenant_id: undefined,
    client_id: undefined,
    connection_profile_id: undefined,
    priority: 50,
    max_concurrent_executions: 1,
    execution_timeout_minutes: 60,
    execution_window_start: null,
    execution_window_end: null,
    tags: [],
    notification_recipients: [],
    is_active: true,
    created_by: user?.user_id || 1,
    processing_mode: "batch",
    metadata: {},
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [newTag, setNewTag] = useState("");

  // Load job types
  useEffect(() => {
    const loadJobTypes = async () => {
      try {
        const response = await jobTypeService.listJobTypes({
          limit: 100,
          skipCache: true,
        });
        setJobTypes(response.data);
      } catch (err) {
        console.error("Failed to load job types:", err);
      }
    };
    loadJobTypes();
  }, []);

  // Load existing job for edit mode
  useEffect(() => {
    if (isEditMode && id) {
      const loadJob = async () => {
        setIsLoading(true);
        try {
          const job = await scheduledJobService.getScheduledJobById(Number(id));
          setFormData({
            name: job.name,
            code: job.code,
            description: job.description || "",
            job_type_id: job.job_type_id || undefined,
            status: job.status,
            schedule_type: job.schedule_type,
            cron_expression: job.cron_expression || "",
            interval_seconds: job.interval_seconds || undefined,
            technical_owner_id: job.technical_owner_id || undefined,
            tenant_id: job.tenant_id || undefined,
            client_id: job.client_id || undefined,
            connection_profile_id: job.connection_profile_id || undefined,
            priority: job.priority,
            max_concurrent_executions: job.max_concurrent_executions,
            execution_timeout_minutes: job.execution_timeout_minutes,
            execution_window_start: job.execution_window_start,
            execution_window_end: job.execution_window_end,
            tags: job.tags || [],
            notification_recipients: job.notification_recipients || [],
            is_active: job.is_active,
            created_by: job.created_by,
            processing_mode: job.processing_mode,
            metadata: job.metadata || {},
          });
        } catch (err) {
          showError(
            "Failed to load job",
            err instanceof Error ? err.message : "Unknown error",
          );
          navigate("/dashboard/scheduled-jobs");
        } finally {
          setIsLoading(false);
        }
      };
      loadJob();
    }
  }, [id, isEditMode, navigate, showError]);

  const validateForm = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    }

    if (!formData.code.trim()) {
      newErrors.code = "Code is required";
    } else if (!/^[A-Z0-9_-]+$/.test(formData.code)) {
      newErrors.code =
        "Code must be uppercase letters, numbers, hyphens, or underscores";
    }

    if (!formData.description?.trim()) {
      newErrors.description = "Description is required";
    }

    if (
      formData.schedule_type === "cron" &&
      !formData.cron_expression?.trim()
    ) {
      newErrors.cron_expression =
        "Cron expression is required for cron schedule type";
    }

    if (formData.schedule_type === "interval" && !formData.interval_seconds) {
      newErrors.interval_seconds =
        "Interval is required for interval schedule type";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSaving(true);
    try {
      const normalizedPayload: CreateScheduledJobPayload = {
        ...formData,
        name: formData.name.trim(),
        code: formData.code.trim(),
        description: formData.description.trim(),
        cron_expression: formData.cron_expression
          ? formData.cron_expression.trim()
          : undefined,
        execution_window_start: sanitizeWindowValue(
          formData.execution_window_start,
        ),
        execution_window_end: sanitizeWindowValue(
          formData.execution_window_end,
        ),
      };

      // processing_mode & metadata are not supported by the backend yet
      const {
        processing_mode,
        metadata,
        created_by,
        ...payloadWithoutUnsupportedFields
      } = normalizedPayload as CreateScheduledJobPayload & {
        processing_mode?: string;
        metadata?: Record<string, unknown>;
        created_by?: number;
      };
      // Explicitly mark as unused to avoid lint errors
      void processing_mode;
      void metadata;

      const jobDisplayName =
        (formData.name && formData.name.trim()) || "Scheduled job";

      if (isEditMode && id) {
        const updatePayload: UpdateScheduledJobPayload = {
          ...payloadWithoutUnsupportedFields,
          updated_by: user?.user_id || 1,
        };
        await scheduledJobService.updateScheduledJob(Number(id), updatePayload);
        showToast(
          "Job updated",
          `${jobDisplayName} has been updated successfully`,
        );
      } else {
        await scheduledJobService.createScheduledJob({
          ...payloadWithoutUnsupportedFields,
          created_by: created_by ?? (user?.user_id || 1),
        });
        showToast(
          "Job created",
          `${jobDisplayName} has been created successfully`,
        );
      }
      navigate("/dashboard/scheduled-jobs");
    } catch (err) {
      showError(
        isEditMode ? "Failed to update job" : "Failed to create job",
        err instanceof Error ? err.message : "Unknown error",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddTag = () => {
    const trimmed = newTag.trim();
    if (!trimmed) return;
    if (formData.tags?.includes(trimmed)) {
      showError("Duplicate tag", "This tag has already been added");
      return;
    }
    setFormData({
      ...formData,
      tags: [...(formData.tags || []), trimmed],
    });
    setNewTag("");
  };

  const handleRemoveTag = (tag: string) => {
    setFormData({
      ...formData,
      tags: (formData.tags || []).filter((t) => t !== tag),
    });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2 sm:space-x-4">
          <BackButton fallbackTo="/dashboard/scheduled-jobs" />
          <div>
            <h1 className={`text-2xl font-bold ${tw.textPrimary}`}>
              {isEditMode ? "Edit Scheduled Job" : "Create Scheduled Job"}
            </h1>
            <p className={`${tw.textSecondary} mt-1 text-sm`}>
              {isEditMode
                ? "Update scheduled job configuration"
                : "Configure a new scheduled job"}
            </p>
          </div>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <div className={`bg-white ${tw.rounded} border border-gray-200 p-6`}>
          <h2 className={`text-lg font-semibold ${tw.textPrimary} mb-4`}>
            Basic Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className={`w-full ${tw.rounded} border px-3 py-2 text-sm ${
                  errors.name
                    ? "border-red-300 focus:border-red-500 focus:ring-red-500"
                    : "border-gray-300 focus:border-[#3b8169] focus:ring-[#3b8169]"
                } focus:outline-none focus:ring-1`}
                placeholder="Enter job name"
              />
              {errors.name && (
                <p className="mt-1 text-xs text-red-600">{errors.name}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Code <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.code}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    code: e.target.value.toUpperCase(),
                  })
                }
                className={`w-full ${
                  tw.rounded
                } border px-3 py-2 text-sm font-mono ${
                  errors.code
                    ? "border-red-300 focus:border-red-500 focus:ring-red-500"
                    : "border-gray-300 focus:border-[#3b8169] focus:ring-[#3b8169]"
                } focus:outline-none focus:ring-1`}
                placeholder="JOB_CODE"
              />
              {errors.code && (
                <p className="mt-1 text-xs text-red-600">{errors.code}</p>
              )}
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description <span className="text-red-500">*</span>
              </label>
              <textarea
                value={formData.description || ""}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                rows={3}
                className={`w-full ${tw.rounded} border px-3 py-2 text-sm ${
                  errors.description
                    ? "border-red-300 focus:border-red-500 focus:ring-red-500"
                    : "border-gray-300 focus:border-[#3b8169] focus:ring-[#3b8169]"
                } focus:outline-none focus:ring-1`}
                placeholder="Enter job description"
              />
              {errors.description && (
                <p className="mt-1 text-xs text-red-600">
                  {errors.description}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Job Type
              </label>
              <Listbox<number | null>
                value={formData.job_type_id ?? null}
                onChange={(value) =>
                  setFormData({
                    ...formData,
                    job_type_id: value ?? undefined,
                  })
                }
              >
                <div className="relative mt-1">
                  <Listbox.Button
                    className={`relative w-full cursor-default ${tw.rounded} border border-gray-300 bg-white py-2 pl-3 pr-10 text-left text-sm focus:border-[#3b8169] focus:outline-none focus:ring-1 focus:ring-[#3b8169]`}
                  >
                    <span className="block truncate">
                      {formData.job_type_id
                        ? jobTypes.find((jt) => jt.id === formData.job_type_id)
                            ?.name || `Type #${formData.job_type_id}`
                        : "Select job type"}
                    </span>
                    <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                      <ChevronUpDownIcon className="h-4 w-4 text-gray-400" />
                    </span>
                  </Listbox.Button>
                  <Transition
                    as={Fragment}
                    leave="transition ease-in duration-100"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                  >
                    <Listbox.Options
                      className={`absolute z-10 mt-1 max-h-60 w-full overflow-auto ${tw.rounded} bg-white py-1 text-sm shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none`}
                    >
                      <Listbox.Option
                        value={null}
                        className={({ active }) =>
                          classNames(
                            active
                              ? "bg-gray-100 text-gray-900"
                              : "text-gray-900",
                            "relative cursor-default select-none py-2 pl-10 pr-4",
                          )
                        }
                      >
                        {({ selected }) => (
                          <>
                            <span
                              className={classNames(
                                selected ? "font-semibold" : "font-normal",
                                "block truncate",
                              )}
                            >
                              Select job type
                            </span>
                            {selected ? (
                              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-[#3b8169]">
                                <CheckIcon className="h-4 w-4" />
                              </span>
                            ) : null}
                          </>
                        )}
                      </Listbox.Option>
                      {jobTypes.map((jt) => (
                        <Listbox.Option
                          key={jt.id}
                          value={jt.id}
                          className={({ active }) =>
                            classNames(
                              active
                                ? "bg-gray-100 text-gray-900"
                                : "text-gray-900",
                              "relative cursor-default select-none py-2 pl-10 pr-4",
                            )
                          }
                        >
                          {({ selected }) => (
                            <>
                              <span
                                className={classNames(
                                  selected ? "font-semibold" : "font-normal",
                                  "block truncate",
                                )}
                              >
                                {jt.name}
                              </span>
                              {selected ? (
                                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-[#3b8169]">
                                  <CheckIcon className="h-4 w-4" />
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
                Status
              </label>
              <Listbox<JobStatus>
                value={formData.status}
                onChange={(value) =>
                  setFormData({
                    ...formData,
                    status: value,
                  })
                }
              >
                <div className="relative mt-1">
                  <Listbox.Button
                    className={`relative w-full cursor-default ${tw.rounded} border border-gray-300 bg-white py-2 pl-3 pr-10 text-left text-sm focus:border-[#3b8169] focus:outline-none focus:ring-1 focus:ring-[#3b8169]`}
                  >
                    <span className="block truncate">
                      {
                        STATUS_OPTIONS.find(
                          (option) => option.value === formData.status,
                        )?.label
                      }
                    </span>
                    <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                      <ChevronUpDownIcon className="h-4 w-4 text-gray-400" />
                    </span>
                  </Listbox.Button>
                  <Transition
                    as={Fragment}
                    leave="transition ease-in duration-100"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                  >
                    <Listbox.Options
                      className={`absolute z-10 mt-1 max-h-60 w-full overflow-auto ${tw.rounded} bg-white py-1 text-sm shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none`}
                    >
                      {STATUS_OPTIONS.map((option) => (
                        <Listbox.Option
                          key={option.value}
                          value={option.value}
                          className={({ active }) =>
                            classNames(
                              active
                                ? "bg-gray-100 text-gray-900"
                                : "text-gray-900",
                              "relative cursor-default select-none py-2 pl-10 pr-4",
                            )
                          }
                        >
                          {({ selected }) => (
                            <>
                              <span
                                className={classNames(
                                  selected ? "font-semibold" : "font-normal",
                                  "block truncate",
                                )}
                              >
                                {option.label}
                              </span>
                              {selected ? (
                                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-[#3b8169]">
                                  <CheckIcon className="h-4 w-4" />
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
        </div>

        {/* Schedule Configuration */}
        <div className={`bg-white ${tw.rounded} border border-gray-200 p-6`}>
          <h2 className={`text-lg font-semibold ${tw.textPrimary} mb-4`}>
            Schedule Configuration
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Schedule Type <span className="text-red-500">*</span>
              </label>
              <Listbox<ScheduleType>
                value={formData.schedule_type}
                onChange={(value) =>
                  setFormData({
                    ...formData,
                    schedule_type: value,
                  })
                }
              >
                <div className="relative mt-1">
                  <Listbox.Button
                    className={`relative w-full cursor-default ${tw.rounded} border border-gray-300 bg-white py-2 pl-3 pr-10 text-left text-sm focus:border-[#3b8169] focus:outline-none focus:ring-1 focus:ring-[#3b8169]`}
                  >
                    <span className="block truncate">
                      {
                        SCHEDULE_TYPES.find(
                          (option) => option.value === formData.schedule_type,
                        )?.label
                      }
                    </span>
                    <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                      <ChevronUpDownIcon className="h-4 w-4 text-gray-400" />
                    </span>
                  </Listbox.Button>
                  <Transition
                    as={Fragment}
                    leave="transition ease-in duration-100"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                  >
                    <Listbox.Options
                      className={`absolute z-10 mt-1 max-h-60 w-full overflow-auto ${tw.rounded} bg-white py-1 text-sm shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none`}
                    >
                      {SCHEDULE_TYPES.map((option) => (
                        <Listbox.Option
                          key={option.value}
                          value={option.value}
                          className={({ active }) =>
                            classNames(
                              active
                                ? "bg-gray-100 text-gray-900"
                                : "text-gray-900",
                              "relative cursor-default select-none py-2 pl-10 pr-4",
                            )
                          }
                        >
                          {({ selected }) => (
                            <>
                              <span
                                className={classNames(
                                  selected ? "font-semibold" : "font-normal",
                                  "block truncate",
                                )}
                              >
                                {option.label}
                              </span>
                              {selected ? (
                                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-[#3b8169]">
                                  <CheckIcon className="h-4 w-4" />
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

            {formData.schedule_type === "cron" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cron Expression <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.cron_expression || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      cron_expression: e.target.value,
                    })
                  }
                  className={`w-full ${
                    tw.rounded
                  } border px-3 py-2 text-sm font-mono ${
                    errors.cron_expression
                      ? "border-red-300 focus:border-red-500 focus:ring-red-500"
                      : "border-gray-300 focus:border-[#3b8169] focus:ring-[#3b8169]"
                  } focus:outline-none focus:ring-1`}
                  placeholder="0 */3 * * * *"
                />
                {errors.cron_expression && (
                  <p className="mt-1 text-xs text-red-600">
                    {errors.cron_expression}
                  </p>
                )}
                <p className="mt-1 text-xs text-gray-500">
                  A cron expression defines the exact minute, hour, day, and
                  month schedule for the job, e.g.{" "}
                  <span className="font-mono">0 */3 * * * *</span> runs every 3
                  hours.
                </p>
              </div>
            )}

            {formData.schedule_type === "interval" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Interval (seconds) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.interval_seconds || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      interval_seconds: e.target.value
                        ? Number(e.target.value)
                        : undefined,
                    })
                  }
                  className={`w-full ${tw.rounded} border px-3 py-2 text-sm ${
                    errors.interval_seconds
                      ? "border-red-300 focus:border-red-500 focus:ring-red-500"
                      : "border-gray-300 focus:border-[#3b8169] focus:ring-[#3b8169]"
                  } focus:outline-none focus:ring-1`}
                  placeholder="60"
                />
                {errors.interval_seconds && (
                  <p className="mt-1 text-xs text-red-600">
                    {errors.interval_seconds}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Execution Settings */}
        <div className={`bg-white ${tw.rounded} border border-gray-200 p-6`}>
          <h2 className={`text-lg font-semibold ${tw.textPrimary} mb-4`}>
            Execution Settings
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Processing Mode
              </label>
              <Listbox<string>
                value={formData.processing_mode || "batch"}
                onChange={(value) =>
                  setFormData({ ...formData, processing_mode: value })
                }
              >
                <div className="relative mt-1">
                  <Listbox.Button
                    className={`relative w-full cursor-default ${tw.rounded} border border-gray-300 bg-white py-2 pl-3 pr-10 text-left text-sm focus:border-[#3b8169] focus:outline-none focus:ring-1 focus:ring-[#3b8169]`}
                  >
                    <span className="block truncate">
                      {
                        PROCESSING_MODE_OPTIONS.find(
                          (option) =>
                            option.value ===
                            (formData.processing_mode || "batch"),
                        )?.label
                      }
                    </span>
                    <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                      <ChevronUpDownIcon className="h-4 w-4 text-gray-400" />
                    </span>
                  </Listbox.Button>
                  <Transition
                    as={Fragment}
                    leave="transition ease-in duration-100"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                  >
                    <Listbox.Options
                      className={`absolute z-10 mt-1 max-h-60 w-full overflow-auto ${tw.rounded} bg-white py-1 text-sm shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none`}
                    >
                      {PROCESSING_MODE_OPTIONS.map((option) => (
                        <Listbox.Option
                          key={option.value}
                          value={option.value}
                          className={({ active }) =>
                            classNames(
                              active
                                ? "bg-gray-100 text-gray-900"
                                : "text-gray-900",
                              "relative cursor-default select-none py-2 pl-10 pr-4",
                            )
                          }
                        >
                          {({ selected }) => (
                            <>
                              <span
                                className={classNames(
                                  selected ? "font-semibold" : "font-normal",
                                  "block truncate",
                                )}
                              >
                                {option.label}
                              </span>
                              {selected ? (
                                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-[#3b8169]">
                                  <CheckIcon className="h-4 w-4" />
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
                Priority
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={formData.priority || 50}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    priority: Number(e.target.value),
                  })
                }
                className={`w-full ${tw.rounded} border border-gray-300 px-3 py-2 text-sm focus:border-[#3b8169] focus:outline-none focus:ring-1 focus:ring-[#3b8169]`}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Max Concurrent Executions
              </label>
              <input
                type="number"
                min="1"
                value={formData.max_concurrent_executions || 1}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    max_concurrent_executions: Number(e.target.value),
                  })
                }
                className={`w-full ${tw.rounded} border border-gray-300 px-3 py-2 text-sm focus:border-[#3b8169] focus:outline-none focus:ring-1 focus:ring-[#3b8169]`}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Execution Timeout (minutes)
              </label>
              <input
                type="number"
                min="1"
                value={formData.execution_timeout_minutes || 60}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    execution_timeout_minutes: Number(e.target.value),
                  })
                }
                className={`w-full ${tw.rounded} border border-gray-300 px-3 py-2 text-sm focus:border-[#3b8169] focus:outline-none focus:ring-1 focus:ring-[#3b8169]`}
              />
            </div>
          </div>
        </div>

        {/* Tags */}
        <div className={`bg-white ${tw.rounded} border border-gray-200 p-6`}>
          <h2 className={`text-lg font-semibold ${tw.textPrimary} mb-4`}>
            Tags
          </h2>
          {formData.tags && formData.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {formData.tags.map((tag, idx) => (
                <span
                  key={`${tag}-${idx}`}
                  className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className="ml-1 hover:text-gray-900"
                    aria-label={`Remove ${tag}`}
                  >
                    <XCircle className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
          <div className="flex gap-2">
            <input
              type="text"
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAddTag();
                }
              }}
              placeholder="Enter tag name"
              className={`flex-1 ${tw.rounded} border border-gray-300 px-3 py-2 text-sm focus:border-[#3b8169] focus:outline-none focus:ring-1 focus:ring-[#3b8169]`}
            />
            <button
              type="button"
              onClick={handleAddTag}
              disabled={!newTag.trim()}
              className={`${tw.rounded} border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50`}
            >
              Add
            </button>
          </div>
        </div>

        {/* Active Status */}
        <div className={`bg-white ${tw.rounded} border border-gray-200 p-6`}>
          <div className="flex items-center">
            <input
              type="checkbox"
              id="is_active"
              checked={formData.is_active ?? true}
              onChange={(e) =>
                setFormData({ ...formData, is_active: e.target.checked })
              }
              className="h-4 w-4 rounded border-gray-300 text-[#3b8169] focus:ring-[#3b8169]"
            />
            <label
              htmlFor="is_active"
              className="ml-2 text-sm font-medium text-gray-700"
            >
              Active
            </label>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={() =>
              navigateBackOrFallback(navigate, "/dashboard/scheduled-jobs")
            }
            className={`inline-flex items-center gap-2 text-sm font-medium ${tw.rounded} focus:outline-none`}
            style={{
              backgroundColor: "transparent",
              color: color.primary.action,
              border: `1px solid ${color.primary.action}`,
              padding: "0.5rem 1rem",
              borderRadius: "0.5rem",
            }}
          >
            <X className="h-4 w-4" />
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSaving}
            className={`inline-flex items-center gap-2 ${tw.rounded} px-4 py-2 text-sm font-semibold text-white disabled:opacity-50 disabled:cursor-not-allowed`}
            style={{ backgroundColor: color.primary.action }}
          >
            <Save className="h-4 w-4" />
            {isSaving
              ? isEditMode
                ? "Updating..."
                : "Creating..."
              : isEditMode
                ? "Update Job"
                : "Create Job"}
          </button>
        </div>
      </form>
    </div>
  );
}
