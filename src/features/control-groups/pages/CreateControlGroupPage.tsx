import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Users, BarChart3, Calendar, Eye, Loader2 } from "lucide-react";
import { color, tw } from "../../../shared/utils/utils";
import BackButton from "../../../shared/components/ui/BackButton";
import ProgressStepper, {
  Step,
} from "../../../shared/components/ui/ProgressStepper";
import SegmentConditionsBuilder from "../../segments/components/SegmentConditionsBuilder";
import type { SegmentConditionGroup, SegmentPayload, SourceLayer, LayerCondition, LayerColumnRef } from "../../segments/types/segment";
import { convertConditionsToPayload } from "../../segments/utils/conditionPayloadBuilder";
import SchedulingComponent from "../../../shared/components/SchedulingComponent";
import type { SchedulingData } from "../../../shared/types/scheduling";
import { useToast } from "../../../contexts/ToastContext";
import { extractBackendError } from "../../../shared/utils/errorHandler";;;
import Radio from "../../../shared/components/ui/Radio";
import { controlGroupService } from "../services/controlGroupService";
import type { CreateControlGroupRequest, TargetRenderTime } from "../types/controlGroup";
import Checkbox from "../../../shared/components/ui/Checkbox";
import Input from "../../../shared/components/ui/Input";

export default function CreateControlGroupPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { success: showToast, error: showError } = useToast();
  const isEditMode = !!id;

  const [currentStep, setCurrentStep] = useState(1);
  const [controlGroupCode, setControlGroupCode] = useState("");
  const [controlGroupName, setControlGroupName] = useState("");
  const [controlGroupDescription, setControlGroupDescription] = useState("");
  const [nameError, setNameError] = useState("");
  const [codeError, setCodeError] = useState("");
  const [percentageError, setPercentageError] = useState("");
  const [generationMethodError, setGenerationMethodError] = useState("");
  const [customerBaseError, setCustomerBaseError] = useState("");
  const [scheduleDateError, setScheduleDateError] = useState("");
  const [controlGroupPercentage, setControlGroupPercentage] = useState(10);
  const [generationMethod, setGenerationMethod] = useState<
    "random" | "stratified" | ""
  >("");
  const [selectedCustomerBase, setSelectedCustomerBase] =
    useState<string>("");
  const [isCreating, setIsCreating] = useState(false);
  const [isLoading, setIsLoading] = useState(isEditMode);
  const [segmentConditions, setSegmentConditions] = useState<
    SegmentConditionGroup[]
  >([]);
  const [scheduling, setScheduling] = useState<SchedulingData>({
    type: "scheduled",
    time_zone: "(GMT+02:00) Sudan",
    start_date: new Date().toISOString().split("T")[0] + "T08:00",
    end_date: "",
    recurrence_pattern: "monthly",
    recurrence_interval: 1,
  });
  const [isUniversal, setIsUniversal] = useState(true);
  const [isActive, setIsActive] = useState(true);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  useEffect(() => {
    if (isEditMode && id) {
      loadControlGroup(Number(id));
    }
  }, [id, isEditMode]);

  const loadControlGroup = async (groupId: number) => {
    try {
      const group = await controlGroupService.getControlGroupById(groupId);
      setControlGroupCode(group.code);
      setControlGroupName(group.name);
      setControlGroupDescription(group.description || "");
      setControlGroupPercentage(group.percentage || 10);
      setGenerationMethod((group.generation_method as "random" | "stratified") || "random");
      setSelectedCustomerBase(group.customer_source_type || "active_subscribers");
      setIsUniversal(group.is_universal || false);
      setIsActive(group.is_active !== false);

      if (group.start_date) {
        setScheduling({
          type: "scheduled",
          time_zone: "(GMT+02:00) Sudan",
          start_date: group.start_date,
          end_date: group.end_date || "",
          recurrence_pattern: (group.recurrence_pattern || "monthly") as "one_time" | "daily" | "weekly" | "monthly",
          recurrence_interval: 1,
        });
      }
    } catch (error) {
      console.error("Failed to load control group:", error);
      showError(extractBackendError(error, "Failed to load control group data. Please try again."));
      navigate("/dashboard/control-groups");
    } finally {
      setIsLoading(false);
    }
  };

  const STEPS: Step[] = [
    {
      id: 1,
      name: "Basic Info",
      description: "Control group details",
      icon: Users,
    },
    {
      id: 2,
      name: "Configuration",
      description: "Percentage & generation method",
      icon: BarChart3,
    },
    {
      id: 3,
      name: "Scheduling",
      description: "Set recurrence pattern",
      icon: Calendar,
    },
    {
      id: 4,
      name: "Preview",
      description: "Review before create",
      icon: Eye,
    },
  ];

  const getCustomerBaseLabel = (base: string) => {
    switch (base) {
      case "active_subscribers":
        return "Active Subscribers";
      case "all_customers":
        return "All Customers";
      case "custom_conditions":
        return "Custom Conditions";
      default:
        return base;
    }
  };

  const getRecurrenceLabel = (recurrence?: string) => {
    switch (recurrence) {
      case "once":
        return "One-time";
      case "daily":
        return "Daily";
      case "weekly":
        return "Weekly";
      case "monthly":
        return "Monthly";
      default:
        return recurrence || "-";
    }
  };

  const getScheduleSummary = () => {
    const scheduleType =
      scheduling.type === "immediate" ? "Immediate" : "Scheduled";
    const interval = scheduling.recurrence_interval || 1;
    const recurrence = scheduling.recurrence_pattern || "weekly";
    const startDate = scheduling.start_date
      ? scheduling.start_date.replace("T", " ")
      : "not set";
    const timeZone = scheduling.time_zone || "not set";

    let cadence = "";
    if (recurrence === "daily") {
      cadence = `every ${interval} day${interval > 1 ? "s" : ""}`;
    } else if (recurrence === "weekly") {
      const dayMap = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      const days = (scheduling.selected_days || [])
        .map((d: number) => dayMap[d])
        .filter(Boolean)
        .join(", ");
      cadence = `every ${interval} week${interval > 1 ? "s" : ""}${days ? ` on ${days}` : ""}`;
    } else {
      const monthlyRuleLabel =
        scheduling.monthly_rule === "last_day"
          ? "last day"
          : scheduling.monthly_rule === "day_of_month"
            ? `day ${scheduling.monthly_day_of_month || 1}`
            : "first day";
      cadence = `every ${interval} month${interval > 1 ? "s" : ""} on ${monthlyRuleLabel}`;
    }

    const endText = scheduling.end_date
      ? `, ending ${scheduling.end_date.replace("T", " ")}`
      : ", no end date";

    return `${scheduleType}: starts ${startDate}, ${cadence} (${timeZone})${endText}.`;
  };

  const canNavigateToStep = (stepId: number) => {
    if (stepId <= currentStep) return true;

    if (stepId === currentStep + 1) {
      if (currentStep === 1) {
        if (controlGroupName.trim() === "") return false;
        if (!selectedCustomerBase) return false;
        if (selectedCustomerBase === "custom_conditions" && segmentConditions.length === 0) return false;
      }
      if (currentStep === 2 && (controlGroupPercentage < 1 || controlGroupPercentage > 100 || !generationMethod)) {
        return false;
      }
      if (currentStep === 3 && !scheduling.start_date) {
        return false;
      }
      return true;
    }

    return false;
  };

  const handleStepClick = (stepId: number) => {
    if (currentStep === 1) {
      if (controlGroupName.trim() === "") {
        setNameError("Control group name is required");
        return;
      }
      if (!selectedCustomerBase) {
        setCustomerBaseError("Please select a customer base");
        return;
      }
      if (selectedCustomerBase === "custom_conditions" && segmentConditions.length === 0) {
        setCustomerBaseError("Please add at least one custom condition");
        return;
      }
    }

    if (currentStep === 2) {
      if (controlGroupPercentage < 1 || controlGroupPercentage > 100) {
        setPercentageError("Percentage must be between 1 and 100");
        return;
      }
      if (!generationMethod) {
        setGenerationMethodError("Generation method is required");
        return;
      }
    }

    if (currentStep === 3) {
      if (!scheduling.start_date) {
        setScheduleDateError("Schedule date is required");
        return;
      }
    }

    if (canNavigateToStep(stepId)) {
      setNameError("");
      setCustomerBaseError("");
      setPercentageError("");
      setGenerationMethodError("");
      setScheduleDateError("");
      setCurrentStep(stepId);
    }
  };

  const handleNext = () => {
    if (currentStep === 1) {
      if (controlGroupName.trim() === "") {
        setNameError("Control group name is required");
        return;
      }
      if (!selectedCustomerBase) {
        setCustomerBaseError("Please select a customer base");
        return;
      }
      if (selectedCustomerBase === "custom_conditions" && segmentConditions.length === 0) {
        setCustomerBaseError("Please add at least one custom condition");
        return;
      }
    }

    if (currentStep === 2) {
      if (controlGroupPercentage < 1 || controlGroupPercentage > 100) {
        setPercentageError("Percentage must be between 1 and 100");
        return;
      }
      if (!generationMethod) {
        setGenerationMethodError("Generation method is required");
        return;
      }
    }

    if (currentStep === 3) {
      if (!scheduling.start_date) {
        setScheduleDateError("Schedule date is required");
        return;
      }
    }

    setNameError("");
    setCustomerBaseError("");
    setPercentageError("");
    setGenerationMethodError("");
    setScheduleDateError("");
    if (currentStep < STEPS.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const isNextButtonDisabled = () => {
    if (currentStep === 1) {
      return controlGroupCode.trim() === "" || controlGroupName.trim() === "" || !selectedCustomerBase ||
             (selectedCustomerBase === "custom_conditions" && segmentConditions.length === 0);
    }
    if (currentStep === 2) {
      return controlGroupPercentage < 1 || controlGroupPercentage > 100 || !generationMethod;
    }
    if (currentStep === 3) {
      return !scheduling.start_date;
    }
    return false;
  };

  // Use shared utility for converting conditions to payload
  // (same logic used by both SegmentModal and CreateControlGroupPage)

  const handleCreate = async () => {
    // Final validation
    if (controlGroupCode.trim() === "") {
      setCodeError("Control group code is required");
      return;
    }
    if (controlGroupName.trim() === "") {
      setNameError("Control group name is required");
      return;
    }
    if (controlGroupPercentage < 1 || controlGroupPercentage > 100) {
      setPercentageError("Percentage must be between 1 and 100");
      return;
    }
    if (!generationMethod) {
      setGenerationMethodError("Generation method is required");
      return;
    }

    setIsCreating(true);
    try {
      let customConditions: SegmentPayload | undefined;

      if (selectedCustomerBase === "custom_conditions") {
        if (segmentConditions.length === 0) {
          showError("Please add at least one condition");
          setIsCreating(false);
          return;
        }
        customConditions = convertConditionsToPayload(segmentConditions);
      }

      const targetRenderConfig: TargetRenderTime = {
        mode: "pre_render",
        hours_before_start: 1,
      };

      const payload: CreateControlGroupRequest = {
        code: controlGroupCode,
        name: controlGroupName,
        ...(controlGroupDescription && { description: controlGroupDescription }),
        type: "manual",
        percentage: controlGroupPercentage,
        customer_source_type: selectedCustomerBase as "active_subscribers" | "all_customers" | "saved_segment" | "manual",
        generation_method: generationMethod as "random" | "stratified",
        recurrence_pattern: scheduling.recurrence_pattern as "one_time" | "daily" | "weekly" | "monthly",
        start_date: scheduling.start_date,
        ...(scheduling.end_date && { end_date: scheduling.end_date }),
        is_universal: isUniversal,
        is_active: isActive,
        target_render_config: targetRenderConfig,
        ...(customConditions && { definition: customConditions }),
      };

      if (isEditMode && id) {
        await controlGroupService.updateControlGroup(Number(id), payload);
        showToast("Control group updated successfully");
      } else {
        await controlGroupService.createControlGroup(payload);
        showToast("Control group created successfully");
      }

      navigate("/dashboard/control-groups");
    } catch (error) {
      console.error("Failed to save control group:", error);
      showError(
        error instanceof Error ? error.message : "Failed to save control group"
      );
    } finally {
      setIsCreating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: color.primary.action }} />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div
        className="bg-white rounded-md border p-4"
        style={{ borderColor: color.border.default }}
      >
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between pb-3">
            <BackButton
              fallbackTo="/dashboard/control-groups"
              showBreadcrumb={true}
              currentLabel={isEditMode ? `Edit ${controlGroupName || "Control Group"}` : "Create Control Group"}
            />
          </div>

          <ProgressStepper
            steps={STEPS}
            currentStep={currentStep}
            onStepClick={handleStepClick}
            canNavigateToStep={canNavigateToStep}
            primaryColor={color.primary.action}
            textPrimary={tw.textPrimary}
            textMuted={tw.textMuted}
          />

          <div className="py-4 space-y-6">
            {currentStep === 1 && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Name *
                    </label>
                    <Input
                      placeholder="Enter control group name"
                      value={controlGroupName}
                      onChange={(value) => {
                        setControlGroupName(value);
                        if (nameError) setNameError("");
                      }}
                      variant="medium"
                      hasError={!!nameError}
                    />
                    {nameError && (
                      <p className="text-red-600 text-sm mt-1">{nameError}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Code *
                    </label>
                    <Input
                      placeholder="Enter control group code"
                      value={controlGroupCode}
                      onChange={(value) => {
                        setControlGroupCode(value);
                        if (codeError) setCodeError("");
                      }}
                      variant="medium"
                      hasError={!!codeError}
                    />
                    {codeError && (
                      <p className="text-red-600 text-sm mt-1">{codeError}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    placeholder="Enter control group description"
                    value={controlGroupDescription}
                    onChange={(e) => setControlGroupDescription(e.target.value)}
                    className={`w-full px-3 text-sm py-2 border ${tw.rounded} transition-all outline-none resize-none ${
                      focusedField === "description"
                        ? "border-blue-500 ring-2 ring-blue-500/20"
                        : "border-gray-300"
                    }`}
                    onFocus={() => setFocusedField("description")}
                    onBlur={() => setFocusedField(null)}

                    rows={3}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 my-3">
                    Select the Customer Base for your Control Group
                  </label>
                  <div className="space-y-3">
                    <div
                      className={`flex items-start p-3 border border-gray-200 ${tw.rounded} cursor-pointer hover:bg-gray-50`}
                      onClick={() => {
                        setSelectedCustomerBase("active_subscribers");
                        if (customerBaseError) setCustomerBaseError("");
                      }}
                    >
                      <Radio
                        name="customerBase"
                        value="active_subscribers"
                        checked={selectedCustomerBase === "active_subscribers"}
                        onChange={() => {
                          setSelectedCustomerBase("active_subscribers");
                          if (customerBaseError) setCustomerBaseError("");
                        }}
                        className="mt-1"
                      />
                      <div className="ml-3">
                        <div className="font-medium text-sm text-gray-900">
                          Active Subscribers
                        </div>
                        <div className="text-xs text-gray-500">
                          Only active subscribers
                        </div>
                      </div>
                    </div>

                    <div
                      className={`flex items-start p-3 border border-gray-200 ${tw.rounded} cursor-pointer hover:bg-gray-50`}
                      onClick={() => {
                        setSelectedCustomerBase("all_customers");
                        if (customerBaseError) setCustomerBaseError("");
                      }}
                    >
                      <Radio
                        name="customerBase"
                        value="all_customers"
                        checked={selectedCustomerBase === "all_customers"}
                        onChange={() => {
                          setSelectedCustomerBase("all_customers");
                          if (customerBaseError) setCustomerBaseError("");
                        }}
                        className="mt-1"
                      />
                      <div className="ml-3">
                        <div className="font-medium text-sm text-gray-900">
                          All Customers
                        </div>
                        <div className="text-xs text-gray-500">
                          All customers in the database
                        </div>
                      </div>
                    </div>

                    <div
                      className={`flex items-start p-3 border border-gray-200 ${tw.rounded} cursor-pointer hover:bg-gray-50`}
                      onClick={() => {
                        setSelectedCustomerBase("custom_conditions");
                        if (customerBaseError) setCustomerBaseError("");
                      }}
                    >
                      <Radio
                        name="customerBase"
                        value="custom_conditions"
                        checked={selectedCustomerBase === "custom_conditions"}
                        onChange={() => {
                          setSelectedCustomerBase("custom_conditions");
                          if (customerBaseError) setCustomerBaseError("");
                        }}
                        className="mt-1"
                      />
                      <div className="ml-3">
                        <div className="font-medium text-sm text-gray-900">
                          Custom Conditions
                        </div>
                        <div className="text-xs text-gray-500">
                          Define custom segment conditions
                        </div>
                      </div>
                    </div>
                  </div>

                  {selectedCustomerBase === "custom_conditions" && (
                    <div className="mt-6">
                      <label className="block text-sm font-medium text-gray-700 mb-3">
                        Define Custom Conditions
                      </label>
                      <SegmentConditionsBuilder
                        conditions={segmentConditions}
                        onChange={setSegmentConditions}
                      />
                    </div>
                  )}
                  {customerBaseError && (
                    <p className="text-red-600 text-sm mt-3">{customerBaseError}</p>
                  )}
                </div>

                <div className="mt-4 flex items-center gap-6">
                  <div className="flex items-center gap-2 cursor-pointer" onClick={() => setIsUniversal(!isUniversal)}>
                    <Checkbox
                      id="universal-control-group"
                      checked={isUniversal}
                      onChange={() => setIsUniversal(!isUniversal)}
                    />
                    <span className="text-sm font-medium text-gray-700">
                      Mark as Universal Control Group
                    </span>
                  </div>
                  <div className="flex items-center gap-2 cursor-pointer" onClick={() => setIsActive(!isActive)}>
                    <Checkbox
                      id="control-group-active"
                      checked={isActive}
                      onChange={() => setIsActive(!isActive)}
                    />
                    <span className="text-sm font-medium text-gray-700">
                      Active
                    </span>
                  </div>
                </div>
              </>
            )}

            {currentStep === 2 && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Control Group Percentage *
                  </label>
                  <div className="flex items-center space-x-4">
                    <Input
                      type="range"
                      min="1"
                      max="100"
                      value={controlGroupPercentage}
                      onChange={(value) => {
                        setControlGroupPercentage(Number(String(value)));
                        if (percentageError) setPercentageError("");
                      }}
                      className="flex-1"
                      style={{ accentColor: color.primary.action }}
                    />
                    <span className="text-sm font-semibold text-gray-700 w-12">
                      {controlGroupPercentage}%
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Percentage of customers to include in the control group
                    (1-100%)
                  </p>
                  {percentageError && (
                    <p className="text-red-600 text-sm mt-1">{percentageError}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Generation Method *
                  </label>
                  <div className="space-y-2">
                    <div
                      className="flex items-center p-3 border border-gray-200 rounded cursor-pointer hover:bg-gray-50"
                      onClick={() => {
                        setGenerationMethod("random");
                        if (generationMethodError) setGenerationMethodError("");
                      }}
                    >
                      <Radio
                        name="generationMethod"
                        value="random"
                        checked={generationMethod === "random"}
                        onChange={() => {
                          setGenerationMethod("random");
                          if (generationMethodError) setGenerationMethodError("");
                        }}
                      />
                      <span className="ml-3 text-sm font-medium text-gray-900">
                        Random Selection
                      </span>
                    </div>

                    <div
                      className="flex items-center p-3 border border-gray-200 rounded cursor-pointer hover:bg-gray-50"
                      onClick={() => {
                        setGenerationMethod("stratified");
                        if (generationMethodError) setGenerationMethodError("");
                      }}
                    >
                      <Radio
                        name="generationMethod"
                        value="stratified"
                        checked={generationMethod === "stratified"}
                        onChange={() => {
                          setGenerationMethod("stratified");
                          if (generationMethodError) setGenerationMethodError("");
                        }}
                      />
                      <span className="ml-3 text-sm font-medium text-gray-900">
                        Stratified Sampling
                      </span>
                    </div>
                  </div>
                  {generationMethodError && (
                    <p className="text-red-600 text-sm mt-2">{generationMethodError}</p>
                  )}
                </div>
              </>
            )}

            {currentStep === 3 && (
              <>
                <SchedulingComponent
                  scheduling={scheduling}
                  onSchedulingChange={(newScheduling) => {
                    setScheduling(newScheduling);
                    if (scheduleDateError && newScheduling.start_date) {
                      setScheduleDateError("");
                    }
                  }}
                  title="Control Group Generation Schedule"
                  subtitle="Configure when this control group is generated"
                  showPreviewButton={false}
                />
                {scheduleDateError && (
                  <p className="text-red-600 text-sm mt-3">{scheduleDateError}</p>
                )}
              </>
            )}

            {currentStep === 4 && (
              <div className="space-y-4">
                <h3 className="text-base font-semibold text-gray-900">
                  Review Control Group Setup
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className={`border border-gray-200 ${tw.rounded} p-4 md:col-span-2`}>
                    <p className="text-xs text-gray-500 mb-2">Code & Name</p>
                    <p className="text-sm font-medium text-gray-900">
                      {controlGroupCode && controlGroupName ? `${controlGroupCode} - ${controlGroupName}` : controlGroupName || controlGroupCode || "-"}
                    </p>
                    {controlGroupDescription && (
                      <p className="text-sm text-gray-600 mt-2">
                        {controlGroupDescription}
                      </p>
                    )}
                  </div>
                  <div className={`border border-gray-200 ${tw.rounded} p-4`}>
                    <p className="text-xs text-gray-500 mb-1">Universal Control Group</p>
                    <p className="text-sm font-medium text-gray-900">
                      {isUniversal ? "Yes" : "No"}
                    </p>
                  </div>
                  <div className={`border border-gray-200 ${tw.rounded} p-4`}>
                    <p className="text-xs text-gray-500 mb-1">Status</p>
                    <p className="text-sm font-medium text-gray-900">
                      {isActive ? "Active" : "Inactive"}
                    </p>
                  </div>
                  <div className={`border border-gray-200 ${tw.rounded} p-4`}>
                    <p className="text-xs text-gray-500 mb-1">Customer Base</p>
                    <p className="text-sm font-medium text-gray-900">
                      {getCustomerBaseLabel(selectedCustomerBase)}
                    </p>
                  </div>
                  <div className={`border border-gray-200 ${tw.rounded} p-4`}>
                    <p className="text-xs text-gray-500 mb-1">
                      Control Percentage
                    </p>
                    <p className="text-sm font-medium text-gray-900">
                      {controlGroupPercentage}%
                    </p>
                  </div>
                  <div className={`border border-gray-200 ${tw.rounded} p-4`}>
                    <p className="text-xs text-gray-500 mb-1">
                      Generation Method
                    </p>
                    <p className="text-sm font-medium text-gray-900 capitalize">
                      {generationMethod === "random" ? "Random Selection" : "Stratified Sampling"}
                    </p>
                  </div>
                  <div className={`border border-gray-200 ${tw.rounded} p-4`}>
                    <p className="text-xs text-gray-500 mb-1">Recurrence</p>
                    <p className="text-sm font-medium text-gray-900">
                      {getRecurrenceLabel(scheduling.recurrence_pattern)}
                    </p>
                  </div>
                  <div className={`border border-gray-200 ${tw.rounded} p-4`}>
                    <p className="text-xs text-gray-500 mb-1">Start Date</p>
                    <p className="text-sm font-medium text-gray-900">
                      {scheduling.start_date || "-"}
                    </p>
                  </div>
                  <div className={`border border-gray-200 ${tw.rounded} p-4`}>
                    <p className="text-xs text-gray-500 mb-1">Time Zone</p>
                    <p className="text-sm font-medium text-gray-900">
                      {scheduling.time_zone || "-"}
                    </p>
                  </div>
                  {scheduling.end_date && (
                    <div className={`border border-gray-200 ${tw.rounded} p-4`}>
                      <p className="text-xs text-gray-500 mb-1">End Date</p>
                      <p className="text-sm font-medium text-gray-900">
                        {scheduling.end_date || "-"}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="sticky bottom-12 bg-white py-4 shadow-sm mt-8">
              <div className="flex justify-between items-center">
                {currentStep > 1 ? (
                  <button
                    onClick={handlePrev}
                    disabled={isCreating}
                    className={`inline-flex items-center px-4 py-2 border border-gray-300 text-gray-700 ${tw.rounded} text-sm font-medium hover:bg-gray-50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    Previous
                  </button>
                ) : (
                  <div />
                )}

                <div className="flex-1" />

                {currentStep === STEPS.length ? (
                  <button
                    onClick={handleCreate}
                    disabled={isCreating}
                    className={`inline-flex items-center gap-2 px-5 py-2 text-sm font-medium ${tw.rounded} text-white disabled:opacity-50 disabled:cursor-not-allowed`}
                    style={{ backgroundColor: color.primary.action }}
                  >
                    {isCreating && <Loader2 className="w-4 h-4 animate-spin" />}
                    {isCreating ? (isEditMode ? "Updating..." : "Creating...") : (isEditMode ? "Update Control Group" : "Create Control Group")}
                  </button>
                ) : (
                  <button
                    onClick={handleNext}
                    disabled={isCreating || isNextButtonDisabled()}
                    className={`inline-flex items-center px-5 py-2 text-sm font-medium ${tw.rounded} text-white disabled:opacity-50 disabled:cursor-not-allowed`}
                    style={{ backgroundColor: color.primary.action }}
                  >
                    Next
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
