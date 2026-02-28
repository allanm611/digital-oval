import { Fragment, useState, useEffect, useCallback, useRef } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { Save, X, XCircle } from "lucide-react";
import BackButton from "../../../shared/components/ui/BackButton";
import { navigateBackOrFallback } from "../../../shared/utils/navigation";
import { CheckIcon, ChevronUpDownIcon } from "@heroicons/react/20/solid";
import { Listbox, Transition } from "@headlessui/react";
import { scheduledJobService } from "../services/scheduledJobService";
import { jobTypeService } from "../services/jobTypeService";
import { campaignService } from "../../campaigns/services/campaignService";
import { campaignFlowService } from "../../campaigns/services/campaignFlowService";
import {
  CreateScheduledJobPayload,
  UpdateScheduledJobPayload,
  ScheduleType,
  JobStatus,
} from "../types/scheduledJob";
import { JobType } from "../types/job";
import type {
  BackendCampaignType,
  GetCampaignsResponse,
} from "../../campaigns/types/campaign";
import type { GetCampaignFlowsResponse } from "../../campaigns/types/campaignFlow";
import { useToast } from "../../../contexts/ToastContext";
import { useLanguage } from "../../../contexts/LanguageContext";
import { useAuth } from "../../../contexts/AuthContext";
import LoadingSpinner from "../../../shared/components/ui/LoadingSpinner";
import { color, tw } from "../../../shared/utils/utils";

const SCHEDULE_TYPES: {
  value: ScheduleType;
  label: string;
  description?: string;
}[] = [
  { value: "manual", label: "Manual", description: "Trigger the job manually" },
  {
    value: "cron",
    label: "Custom Schedule",
    description: "Define specific times (e.g., daily, weekly)",
  },
  {
    value: "interval",
    label: "Repeat Regularly",
    description: "Run every N seconds",
  },
  {
    value: "event_driven",
    label: "Event Driven",
    description: "Trigger when an event occurs",
  },
  {
    value: "dependency_based",
    label: "Dependency Based",
    description: "Trigger based on other jobs",
  },
];

const STATUS_OPTIONS: { value: JobStatus; label: string }[] = [
  { value: "active", label: "Active" },
  { value: "draft", label: "Draft" },
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
  const [searchParams] = useSearchParams();
  const { showToast, error: showError, success: showSuccess } = useToast();
  const { t } = useLanguage();
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
    status: "active",
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

  // Campaign-specific state
  const [campaignMeta, setCampaignMeta] = useState({
    campaign_id: 0,
    mode: "immediate" as const,
    batch_size: 1000,
    max_parallel_broadcasts: 3,
  });
  const [selectedSegmentIds, setSelectedSegmentIds] = useState<number[]>([]);
  const [segmentChannelCodes, setSegmentChannelCodes] = useState<
    Record<number, string[]>
  >({});
  const [campaigns, setCampaigns] = useState<BackendCampaignType[]>([]);
  const [availableSegments, setAvailableSegments] = useState<
    Array<{ segment_id: number; name: string }>
  >([]);
  const [isLoadingSegments, setIsLoadingSegments] = useState(false);

  // Detect if this is a campaign job
  const isCampaignJob =
    searchParams.get("type") === "campaign" ||
    (formData.metadata?.job_type as string | undefined) === "campaign";

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [newTag, setNewTag] = useState("");

  // Refs for scrolling to errors
  const basicInfoRef = useRef<HTMLDivElement>(null);
  const scheduleConfigRef = useRef<HTMLDivElement>(null);
  const campaignRef = useRef<HTMLDivElement>(null);

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
        // Failed to load job types - handled silently
      }
    };
    loadJobTypes();
  }, []);

  // Load campaigns when isCampaignJob
  useEffect(() => {
    if (isCampaignJob) {
      const loadCampaigns = async () => {
        try {
          const response: GetCampaignsResponse =
            await campaignService.getCampaigns({
              limit: 100,
              skipCache: true,
            });
          setCampaigns(response.data || []);
        } catch (err) {
          showError("Failed to load campaigns", "");
        }
      };
      loadCampaigns();
    }
  }, [isCampaignJob, showError]);

  // Load existing job for edit mode
  useEffect(() => {
    if (isEditMode && id) {
      const loadJob = async () => {
        setIsLoading(true);
        try {
          const job = await scheduledJobService.getScheduledJobById(Number(id), true);
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

          // Handle campaign job metadata in edit mode
          if (job.metadata?.job_type === "campaign") {
            const meta = job.metadata;
            setCampaignMeta({
              campaign_id: (meta.campaign_id as number) || 0,
              mode: (meta.mode as string) || "immediate",
              batch_size: (meta.batch_size as number) || 1000,
              max_parallel_broadcasts: (meta.max_parallel_broadcasts as number) || 3,
            });
            const segmentIds = ((meta.segments as Array<{ segment_id: number; channel_codes?: string[] }>) || []).map(
              (s) => s.segment_id,
            );
            setSelectedSegmentIds(segmentIds);

            // Build per-segment channel codes mapping
            const channelMap: Record<number, string[]> = {};
            (meta.segments || []).forEach((s: any) => {
              channelMap[s.segment_id] = s.channel_codes || ["EMAIL"];
            });
            setSegmentChannelCodes(channelMap);

            // Load segments for the campaign, preserving existing channel codes and segment IDs
            if (meta.campaign_id) {
              await handleCampaignChange(meta.campaign_id, channelMap);
              // Restore selected segment IDs after campaign change
              setSelectedSegmentIds(segmentIds);
            }
          }
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
  }, [id, isEditMode, navigate, showError, t]);

  const handleCampaignChange = useCallback(
    async (campaignId: number, existingChannelCodes?: Record<number, string[]>) => {
      setCampaignMeta((prev) => ({
        ...prev,
        campaign_id: campaignId,
      }));
      setSelectedSegmentIds([]);
      setSegmentChannelCodes({});

      if (!campaignId) return;

      setIsLoadingSegments(true);
      try {
        const response: GetCampaignFlowsResponse =
          await campaignFlowService.getCampaignSegments(campaignId, true);
        const segments = response.data || [];
        const uniqueSegments = Array.from(
          new Map(segments.map((s) => [s.segment_id, s])).values(),
        );
        setAvailableSegments(
          uniqueSegments.map((s: any) => ({
            segment_id: s.segment_id,
            name: s.segment_name || `Segment ${s.segment_id}`,
          })),
        );
        // Initialize each segment with existing channels or default EMAIL
        const defaultChannels: Record<number, string[]> = {};
        uniqueSegments.forEach((s) => {
          defaultChannels[s.segment_id] = existingChannelCodes?.[s.segment_id] || ["EMAIL"];
        });
        setSegmentChannelCodes(defaultChannels);
      } catch (err) {
        showError("Failed to load segments", "");
      } finally {
        setIsLoadingSegments(false);
      }
    },
    [showError],
  );

  const validateForm = useCallback((): { isValid: boolean; firstErrorField?: string } => {
    const newErrors: Record<string, string> = {};
    let firstErrorField: string | undefined;

    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
      if (!firstErrorField) firstErrorField = "basic";
    }

    if (!formData.code.trim()) {
      newErrors.code = "Code is required";
      if (!firstErrorField) firstErrorField = "basic";
    }

    if (!formData.description?.trim()) {
      newErrors.description = "Description is required";
      if (!firstErrorField) firstErrorField = "basic";
    }

    if (!formData.job_type_id) {
      newErrors.job_type_id = "Job Type is required";
      if (!firstErrorField) firstErrorField = "basic";
    }

    if (
      formData.schedule_type === "cron" &&
      !formData.cron_expression?.trim()
    ) {
      newErrors.cron_expression =
        "Cron expression is required for cron schedule type";
      if (!firstErrorField) firstErrorField = "schedule";
    }

    if (formData.schedule_type === "interval" && !formData.interval_seconds) {
      newErrors.interval_seconds =
        "Interval is required for interval schedule type";
      if (!firstErrorField) firstErrorField = "schedule";
    } else if (
      formData.schedule_type === "interval" &&
      formData.interval_seconds
    ) {
      const intervalValue = Number(formData.interval_seconds);
      if (intervalValue < 60) {
        newErrors.interval_seconds = "Interval must be at least 60 seconds";
        if (!firstErrorField) firstErrorField = "schedule";
      }
    }

    // Campaign-specific validation
    if (isCampaignJob) {
      if (!campaignMeta.campaign_id) {
        newErrors.campaign_id = "Campaign is required";
        if (!firstErrorField) firstErrorField = "campaign";
      }
      if (selectedSegmentIds.length === 0) {
        newErrors.segments = "Select at least one segment";
        if (!firstErrorField) firstErrorField = "campaign";
      }
      // Check that each selected segment has at least one channel
      const segmentsWithoutChannels = selectedSegmentIds.filter(
        (id) => !segmentChannelCodes[id] || segmentChannelCodes[id].length === 0,
      );
      if (segmentsWithoutChannels.length > 0) {
        newErrors.channel_codes = "Each segment must have at least one channel";
        if (!firstErrorField) firstErrorField = "campaign";
      }
    }

    setErrors(newErrors);
    return { isValid: Object.keys(newErrors).length === 0, firstErrorField };
  }, [formData, isCampaignJob, campaignMeta, selectedSegmentIds, segmentChannelCodes]);

  const scrollToError = useCallback((errorField?: string) => {
    const refMap: Record<string, React.RefObject<HTMLDivElement>> = {
      basic: basicInfoRef,
      schedule: scheduleConfigRef,
      campaign: campaignRef,
    };

    const targetRef = errorField ? refMap[errorField] : basicInfoRef;
    if (targetRef?.current) {
      targetRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validation = validateForm();
    if (!validation.isValid) {
      scrollToError(validation.firstErrorField);
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

      // Build metadata for campaign jobs
      const campaignMetadata = isCampaignJob
        ? {
            mode: campaignMeta.mode,
            job_type: "campaign",
            campaign_id: campaignMeta.campaign_id,
            segments: selectedSegmentIds.map((id) => ({
              segment_id: id,
              channel_codes: segmentChannelCodes[id] || [],
            })),
            batch_size: campaignMeta.batch_size,
            max_parallel_broadcasts: campaignMeta.max_parallel_broadcasts,
          }
        : undefined;

      // Only strip processing_mode; include metadata if campaign job
      const {
        processing_mode,
        metadata: _metadata,
        created_by,
        ...payloadWithoutUnsupportedFields
      } = normalizedPayload as CreateScheduledJobPayload & {
        processing_mode?: string;
        metadata?: Record<string, unknown>;
        created_by?: number;
      };
      // Explicitly mark as unused to avoid lint errors
      void processing_mode;
      void _metadata;

      const jobDisplayName =
        (formData.name && formData.name.trim()) || "Scheduled job";

      const finalPayload = {
        ...payloadWithoutUnsupportedFields,
        ...(campaignMetadata ? { metadata: campaignMetadata } : {}),
      };

      if (isEditMode && id) {
        const updatePayload: UpdateScheduledJobPayload = {
          ...finalPayload,
          updated_by: user?.user_id || 1,
        };
        await scheduledJobService.updateScheduledJob(Number(id), updatePayload);
        const jobDisplayName =
          (formData.name && formData.name.trim()) || "Scheduled job";
        showSuccess(
          "Job updated",
          `${jobDisplayName} has been updated successfully`,
        );
        // Add a small delay to ensure toast displays before navigation
        setTimeout(() => {
          navigate("/dashboard/scheduled-jobs");
        }, 500);
      } else {
        await scheduledJobService.createScheduledJob({
          ...finalPayload,
          created_by: created_by ?? (user?.user_id || 1),
        });
        const jobDisplayName =
          (formData.name && formData.name.trim()) || "Scheduled job";
        showSuccess(
          "Job created",
          `${jobDisplayName} has been created successfully`,
        );
        // Add a small delay to ensure toast displays before navigation
        setTimeout(() => {
          navigate("/dashboard/scheduled-jobs");
        }, 500);
      }
    } catch (err) {
      // Handle backend validation errors (duplicate name/code)
      let errorMessage = "Unknown error";

      if (err instanceof Error) {
        // Check if error message contains backend validation error
        if (err.message.includes("already exists")) {
          errorMessage = err.message;
        } else {
          errorMessage = err.message;
        }
      }

      // Also check if err has a data property with error details (common in axios responses)
      if (err && typeof err === 'object' && 'data' in err) {
        const errData = (err as { data?: unknown }).data as { error?: string } | undefined;
        if (errData?.error && typeof errData.error === 'string') {
          errorMessage = errData.error;
        }
      }

      // Use showToast directly to bypass VITE_SILENT_MODE (always display validation errors)
      showToast(
        "error",
        isEditMode ? "Failed to update job" : "Failed to create job",
        errorMessage,
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddTag = () => {
    const trimmed = newTag.trim();
    if (!trimmed) return;
    if (formData.tags?.includes(trimmed)) {
      showError(
        t("scheduledJob.duplicateTag", "Duplicate tag"),
        t(
          "scheduledJob.duplicateTagMessage",
          "This tag has already been added",
        ),
      );
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
        <div ref={basicInfoRef} className={`bg-white ${tw.rounded} border border-gray-200 p-6`}>
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
                    code: e.target.value,
                  })
                }
                className={`w-full ${tw.rounded} border px-3 py-2 text-sm ${
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
                Job Type <span className="text-red-500">*</span>
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
                    className={`relative w-full cursor-default ${tw.rounded} border ${
                      errors.job_type_id
                        ? "border-red-300 focus:border-red-500 focus:ring-red-500"
                        : "border-gray-300 focus:border-[#3b8169] focus:ring-[#3b8169]"
                    } bg-white py-2 pl-3 pr-10 text-left text-sm focus:outline-none focus:ring-1`}
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
                          `${active ? "bg-gray-100 text-gray-900" : "text-gray-900"} relative cursor-default select-none py-2 pl-10 pr-4`
                        }
                      >
                        {({ selected }) => (
                          <>
                            <span
                              className={`${selected ? "font-semibold" : "font-normal"} block truncate`}
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
                                className={`${selected ? "font-semibold" : "font-normal"} block truncate`}
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
              {errors.job_type_id && (
                <p className="mt-1 text-xs text-red-600">{errors.job_type_id}</p>
              )}
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

        {/* Campaign Configuration - Only shown for campaign jobs */}
        {isCampaignJob && (
          <div ref={campaignRef} className={`bg-white ${tw.rounded} border border-gray-200 p-6`}>
            <h2 className={`text-lg font-semibold ${tw.textPrimary} mb-4`}>
              Campaign Configuration
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Campaign Dropdown */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Campaign <span className="text-red-500">*</span>
                </label>
                <Listbox<number | null>
                  value={campaignMeta.campaign_id || null}
                  onChange={(value) => {
                    if (value) {
                      handleCampaignChange(value);
                    }
                  }}
                >
                  <div className="relative mt-1">
                    <Listbox.Button
                      className={`relative w-full cursor-default ${tw.rounded} border border-gray-300 bg-white py-2 pl-3 pr-10 text-left text-sm focus:border-[#3b8169] focus:outline-none focus:ring-1 focus:ring-[#3b8169]`}
                    >
                      <span className="block truncate">
                        {campaignMeta.campaign_id
                          ? campaigns.find(
                              (c) => c.id === campaignMeta.campaign_id,
                            )?.name || `Campaign #${campaignMeta.campaign_id}`
                          : "Select campaign"}
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
                                Select campaign
                              </span>
                              {selected ? (
                                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-[#3b8169]">
                                  <CheckIcon className="h-4 w-4" />
                                </span>
                              ) : null}
                            </>
                          )}
                        </Listbox.Option>
                        {campaigns.map((campaign) => (
                          <Listbox.Option
                            key={campaign.id}
                            value={campaign.id}
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
                                  className={`${selected ? "font-semibold" : "font-normal"} block truncate`}
                                >
                                  {campaign.name}
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
                {errors.campaign_id && (
                  <p className="mt-1 text-xs text-red-600">
                    {errors.campaign_id}
                  </p>
                )}
              </div>

              {/* Segment Dropdown */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Segments <span className="text-red-500">*</span>
                </label>
                {isLoadingSegments ? (
                  <div className="p-3 text-sm text-gray-600 border border-gray-300 rounded">
                    Loading segments...
                  </div>
                ) : availableSegments.length === 0 ? (
                  <div className="p-3 text-sm text-gray-600 border border-gray-300 rounded">
                    {campaignMeta.campaign_id
                      ? "No segments available for this campaign"
                      : "Select a campaign first"}
                  </div>
                ) : (
                  <Listbox<number[]>
                    value={selectedSegmentIds}
                    onChange={(newIds) => {
                      setSelectedSegmentIds(newIds);
                      // Initialize channels for newly selected segments as empty
                      newIds.forEach((id) => {
                        if (!segmentChannelCodes[id]) {
                          setSegmentChannelCodes((prev) => ({
                            ...prev,
                            [id]: [],
                          }));
                        }
                      });
                      // Clean up channels for deselected segments
                      Object.keys(segmentChannelCodes).forEach((key) => {
                        const keyNum = parseInt(key);
                        if (!newIds.includes(keyNum)) {
                          setSegmentChannelCodes((prev) => {
                            const newCodes = { ...prev };
                            delete newCodes[keyNum];
                            return newCodes;
                          });
                        }
                      });
                    }}
                    multiple
                  >
                    <div className="relative">
                      <Listbox.Button
                        className={`relative w-full cursor-default ${tw.rounded} border border-gray-300 bg-white py-2 pl-3 pr-10 text-left text-sm focus:border-[#3b8169] focus:outline-none focus:ring-1 focus:ring-[#3b8169]`}
                      >
                        <span className="block truncate">
                          {selectedSegmentIds.length === 0
                            ? "Select segments..."
                            : `${selectedSegmentIds.length} segment${selectedSegmentIds.length > 1 ? "s" : ""} selected`}
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
                          {availableSegments.map((segment) => (
                            <Listbox.Option
                              key={segment.segment_id}
                              value={segment.segment_id}
                              className={({ active }) =>
                                `${active ? "bg-gray-100 text-gray-900" : "text-gray-900"} relative cursor-default select-none py-2 pl-10 pr-4`
                              }
                            >
                              {({ selected }) => (
                                <>
                                  <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                      type="checkbox"
                                      checked={selected}
                                      onChange={() => {}}
                                      className="rounded border-gray-300 text-[#3b8169] focus:ring-[#3b8169]"
                                      onClick={(e) => e.stopPropagation()}
                                    />
                                    <span
                                      className={`${selected ? "font-semibold" : "font-normal"} block truncate`}
                                    >
                                      {segment.name}
                                    </span>
                                  </label>
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
                )}
                {errors.segments && (
                  <p className="mt-1 text-xs text-red-600">
                    {errors.segments}
                  </p>
                )}
              </div>

              {/* Channel Configuration per Segment */}
              {selectedSegmentIds.length > 0 && (
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Channels per Segment <span className="text-red-500">*</span>
                  </label>
                  <div className="space-y-3 border border-gray-300 rounded p-3">
                    {selectedSegmentIds.map((segmentId) => {
                      const segment = availableSegments.find(
                        (s) => s.segment_id === segmentId,
                      );
                      const channels = segmentChannelCodes[segmentId] || [];
                      const hasChannelError = channels.length === 0;
                      return (
                        <div
                          key={segmentId}
                          className={`flex items-center gap-4 pb-3 border-b border-gray-200 last:border-b-0 last:pb-0 ${
                            hasChannelError ? "bg-red-50 p-2 -m-2 rounded" : ""
                          }`}
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-4 mb-2">
                              <span className="text-sm font-medium text-gray-700 min-w-fit">
                                {segment?.name}:
                              </span>
                              <div className="flex gap-4">
                                {["EMAIL", "SMS", "PUSH"].map((channel) => (
                                  <label
                                    key={channel}
                                    className="flex items-center gap-2 cursor-pointer"
                                  >
                                    <input
                                      type="checkbox"
                                      checked={channels.includes(channel)}
                                      onChange={(e) => {
                                        const newChannels = e.target.checked
                                          ? [...channels, channel]
                                          : channels.filter(
                                              (ch) => ch !== channel,
                                            );
                                        setSegmentChannelCodes((prev) => ({
                                          ...prev,
                                          [segmentId]: newChannels,
                                        }));
                                      }}
                                      className="rounded border-gray-300 text-[#3b8169] focus:ring-[#3b8169]"
                                    />
                                    <span className="text-sm text-gray-700">
                                      {channel}
                                    </span>
                                  </label>
                                ))}
                              </div>
                            </div>
                            {hasChannelError && (
                              <p className="text-xs text-red-600 ml-0">
                                Select at least one channel
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  {errors.channel_codes && (
                    <p className="mt-1 text-xs text-red-600">
                      {errors.channel_codes}
                    </p>
                  )}
                </div>
              )}

              {/* Mode */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mode
                </label>
                <Listbox<string>
                  value={campaignMeta.mode}
                  onChange={(value) =>
                    setCampaignMeta((prev) => ({ ...prev, mode: value }))
                  }
                >
                  <div className="relative mt-1">
                    <Listbox.Button
                      className={`relative w-full cursor-default ${tw.rounded} border border-gray-300 bg-white py-2 pl-3 pr-10 text-left text-sm focus:border-[#3b8169] focus:outline-none focus:ring-1 focus:ring-[#3b8169]`}
                    >
                      <span className="block truncate">
                        {campaignMeta.mode}
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
                        {["immediate"].map((mode) => (
                          <Listbox.Option
                            key={mode}
                            value={mode}
                            className={({ active }) =>
                              `${active ? "bg-gray-100 text-gray-900" : "text-gray-900"} relative cursor-default select-none py-2 pl-10 pr-4`
                            }
                          >
                            {({ selected }) => (
                              <>
                                <span
                                  className={`${selected ? "font-semibold" : "font-normal"} block truncate`}
                                >
                                  {mode}
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

              {/* Batch Size */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Batch Size
                </label>
                <input
                  type="number"
                  min="1"
                  value={campaignMeta.batch_size}
                  onChange={(e) =>
                    setCampaignMeta((prev) => ({
                      ...prev,
                      batch_size: Number(e.target.value),
                    }))
                  }
                  className={`w-full ${tw.rounded} border border-gray-300 px-3 py-2 text-sm focus:border-[#3b8169] focus:outline-none focus:ring-1 focus:ring-[#3b8169]`}
                />
              </div>

              {/* Max Parallel Broadcasts */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Max Parallel Broadcasts
                </label>
                <input
                  type="number"
                  min="1"
                  value={campaignMeta.max_parallel_broadcasts}
                  onChange={(e) =>
                    setCampaignMeta((prev) => ({
                      ...prev,
                      max_parallel_broadcasts: Number(e.target.value),
                    }))
                  }
                  className={`w-full ${tw.rounded} border border-gray-300 px-3 py-2 text-sm focus:border-[#3b8169] focus:outline-none focus:ring-1 focus:ring-[#3b8169]`}
                />
              </div>
            </div>
          </div>
        )}

        {/* Schedule Configuration */}
        <div ref={scheduleConfigRef} className={`bg-white ${tw.rounded} border border-gray-200 p-6`}>
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
                  When to Run <span className="text-red-500">*</span>
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
                  className={`w-full ${tw.rounded} border px-3 py-2 text-sm ${
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
                  Use cron syntax to define when the job runs. Examples:{" "}
                  <span>0 0 * * *</span> = daily at midnight,
                  <span className="ml-1">0 */3 * * * *</span> = every 3 hours.
                </p>
              </div>
            )}

            {formData.schedule_type === "interval" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Repeat Every (seconds) <span className="text-red-500">*</span>
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
                <p className="mt-1 text-xs text-gray-500">
                  Enter the number of seconds between each job execution. For
                  example,
                  <span>300</span> means the job runs every 5 minutes.
                </p>
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
