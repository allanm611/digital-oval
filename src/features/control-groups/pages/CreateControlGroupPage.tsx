import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Users, BarChart3, Calendar, Eye } from "lucide-react";
import { color, tw } from "../../../shared/utils/utils";
import BackButton from "../../../shared/components/ui/BackButton";
import ProgressStepper, {
  Step,
} from "../../../shared/components/ui/ProgressStepper";
import SegmentConditionsBuilder from "../../segments/components/SegmentConditionsBuilder";
import type { SegmentConditionGroup } from "../../segments/types/segment";
import SchedulingComponent from "../../../shared/components/SchedulingComponent";
import type { SchedulingData } from "../../../shared/types/scheduling";
import { useToast } from "../../../contexts/ToastContext";
import Radio from "../../../shared/components/ui/Radio";

export default function CreateControlGroupPage() {
  const navigate = useNavigate();
  const { success: showToast } = useToast();

  const [currentStep, setCurrentStep] = useState(1);
  const [controlGroupName, setControlGroupName] = useState("");
  const [nameError, setNameError] = useState("");
  const [controlGroupPercentage, setControlGroupPercentage] = useState(10);
  const [generationMethod, setGenerationMethod] = useState<
    "random" | "stratified"
  >("random");
  const [selectedCustomerBase, setSelectedCustomerBase] =
    useState<string>("active_subscribers");
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

  const STEPS: Step[] = [
    {
      id: 1,
      name: "Customer Base",
      description: "Select customer source",
      icon: Users,
    },
    {
      id: 2,
      name: "Metrics",
      description: "Configure group percentage",
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
      case "saved_segments":
        return "Custom Segments";
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
      if (currentStep === 1 && controlGroupName.trim() === "") {
        return false;
      }
      return true;
    }

    return false;
  };

  const handleStepClick = (stepId: number) => {
    if (currentStep === 1 && controlGroupName.trim() === "") {
      setNameError("Control group name is required");
      return;
    }

    if (canNavigateToStep(stepId)) {
      setNameError("");
      setCurrentStep(stepId);
    }
  };

  const handleNext = () => {
    if (currentStep === 1 && controlGroupName.trim() === "") {
      setNameError("Control group name is required");
      return;
    }

    setNameError("");
    if (currentStep < STEPS.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleCreate = () => {
    showToast("Control group created successfully");
    navigate("/dashboard/control-groups");
  };

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
              currentLabel="Create Control Group"
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
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Control Group Name *
                  </label>
                  <input
                    type="text"
                    value={controlGroupName}
                    onChange={(e) => {
                      setControlGroupName(e.target.value);
                      if (nameError) setNameError("");
                    }}
                    className={`w-full px-3 text-sm py-2 border border-gray-300 ${tw.rounded} focus:outline-none focus:ring-2 focus:ring-offset-0`}
                    style={{
                      // Uses theme color for ring and focus border on the input.
                      ["--tw-ring-color" as string]: color.primary.action,
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = color.primary.action;
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = "";
                    }}
                    placeholder="Enter control group name"
                  />
                  {nameError && (
                    <p className="text-red-600 text-sm mt-1">{nameError}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 my-3">
                    Select the Customer Base for your Control Group
                  </label>
                  <div className="space-y-3">
                    <div
                      className={`flex items-start p-3 border border-gray-200 ${tw.rounded} cursor-pointer hover:bg-gray-50`}
                    >
                      <Radio
                        name="customerBase"
                        value="active_subscribers"
                        checked={selectedCustomerBase === "active_subscribers"}
                        onChange={() =>
                          setSelectedCustomerBase("active_subscribers")
                        }
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
                    >
                      <Radio
                        name="customerBase"
                        value="all_customers"
                        checked={selectedCustomerBase === "all_customers"}
                        onChange={() =>
                          setSelectedCustomerBase("all_customers")
                        }
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
                    >
                      <Radio
                        name="customerBase"
                        value="saved_segments"
                        checked={selectedCustomerBase === "saved_segments"}
                        onChange={() =>
                          setSelectedCustomerBase("saved_segments")
                        }
                        className="mt-1"
                      />
                      <div className="ml-3">
                        <div className="font-medium text-sm text-gray-900">
                          Custom Segments
                        </div>
                        <div className="text-xs text-gray-500">
                          Define custom segment conditions
                        </div>
                      </div>
                    </div>
                  </div>

                  {selectedCustomerBase === "saved_segments" && (
                    <div className="mt-6">
                      <label className="block text-sm font-medium text-gray-700 mb-3">
                        Define Custom Segment Conditions
                      </label>
                      <SegmentConditionsBuilder
                        conditions={segmentConditions}
                        onChange={setSegmentConditions}
                      />
                    </div>
                  )}
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
                    <input
                      type="range"
                      min="1"
                      max="50"
                      value={controlGroupPercentage}
                      onChange={(e) =>
                        setControlGroupPercentage(Number(e.target.value))
                      }
                      className="flex-1"
                      style={{ accentColor: color.primary.action }}
                    />
                    <span className="text-sm font-semibold text-gray-700 w-12">
                      {controlGroupPercentage}%
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Percentage of customers to include in the control group
                    (1-50%)
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Generation Method
                  </label>
                  <div className="space-y-2">
                    <div className="flex items-center p-3 border border-gray-200 rounded cursor-pointer hover:bg-gray-50">
                      <Radio
                        name="generationMethod"
                        value="random"
                        checked={generationMethod === "random"}
                        onChange={() => setGenerationMethod("random")}
                      />
                      <span className="ml-3 text-sm font-medium text-gray-900">
                        Random Selection
                      </span>
                    </div>

                    <div className="flex items-center p-3 border border-gray-200 rounded cursor-pointer hover:bg-gray-50">
                      <Radio
                        name="generationMethod"
                        value="stratified"
                        checked={generationMethod === "stratified"}
                        onChange={() => setGenerationMethod("stratified")}
                      />
                      <span className="ml-3 text-sm font-medium text-gray-900">
                        Stratified Sampling
                      </span>
                    </div>
                  </div>
                </div>
              </>
            )}

            {currentStep === 3 && (
              <SchedulingComponent
                scheduling={scheduling}
                onSchedulingChange={setScheduling}
                title="Control Group Generation Schedule"
                subtitle="Configure when this control group is generated"
                showPreviewButton={false}
              />
            )}

            {currentStep === 4 && (
              <div className="space-y-4">
                <h3 className="text-base font-semibold text-gray-900">
                  Review Control Group Setup
                </h3>
                <div
                  className={`border border-gray-200 ${tw.rounded} p-4 bg-gray-50`}
                >
                  <p className="text-xs text-gray-500 mb-1">
                    Selected Schedule
                  </p>
                  <p className="text-sm font-medium text-gray-900">
                    {getScheduleSummary()}
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className={`border border-gray-200 ${tw.rounded} p-4`}>
                    <p className="text-xs text-gray-500 mb-1">Group Name</p>
                    <p className="text-sm font-medium text-gray-900">
                      {controlGroupName || "-"}
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
                      {generationMethod}
                    </p>
                  </div>
                  <div className={`border border-gray-200 ${tw.rounded} p-4`}>
                    <p className="text-xs text-gray-500 mb-1">Schedule Type</p>
                    <p className="text-sm font-medium text-gray-900 capitalize">
                      {scheduling.type || "-"}
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
                </div>
              </div>
            )}

            <div className="sticky bottom-12 bg-white py-4 shadow-sm mt-8">
              <div className="flex justify-between items-center">
                {currentStep > 1 ? (
                  <button
                    onClick={handlePrev}
                    className={`inline-flex items-center px-4 py-2 border border-gray-300 text-gray-700 ${tw.rounded} text-sm font-medium hover:bg-gray-50 transition-all duration-200`}
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
                    className={`inline-flex items-center px-5 py-2 text-sm font-medium ${tw.rounded} text-white`}
                    style={{ backgroundColor: color.primary.action }}
                  >
                    Create Control Group
                  </button>
                ) : (
                  <button
                    onClick={handleNext}
                    className={`inline-flex items-center px-5 py-2 text-sm font-medium ${tw.rounded} text-white`}
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
