import { useState } from "react";
import Input from '../../../shared/components/ui/Input';
import { createPortal } from "react-dom";
import { X, Users, Calendar, BarChart3 } from "lucide-react";

import { tw, zIndex } from "../../../shared/utils/utils";
import type { UniversalControlGroup } from "../configs/universalControlGroupsConfig";
import SegmentConditionsBuilder from "../../segments/components/SegmentConditionsBuilder";
import type { SegmentConditionGroup } from "../../segments/types/segment";
import SchedulingComponent from "../../../shared/components/SchedulingComponent";
import type { SchedulingData } from "../../../shared/types/scheduling";
import Radio from "../../../shared/components/ui/Radio";
import { formatDateWithTimezone } from "../../../shared/services/dateService";
import { getSettingsTimezoneOffset } from "../../../shared/utils/settingsHelper";

interface UniversalControlGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function UniversalControlGroupModal({
  isOpen,
  onClose,
}: UniversalControlGroupModalProps) {
  if (!isOpen) return null;

  return (
    <CreateControlGroupModal
      isOpen={isOpen}
      onClose={onClose}
      editingGroup={null}
      onSave={() => {
        onClose();
      }}
    />
  );
}

interface CreateControlGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingGroup?: UniversalControlGroup | null;
  onSave: (group: UniversalControlGroup) => void;
}

function CreateControlGroupModal({
  isOpen,
  onClose,
  editingGroup,
  onSave,
}: CreateControlGroupModalProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<Partial<UniversalControlGroup>>({
    name: editingGroup?.name || "",
    customerBase: editingGroup?.customerBase || "active_subscribers",
    sizeMethod: editingGroup?.sizeMethod || "percentage",
    percentage: editingGroup?.percentage || 10,
    outlierRemoval: editingGroup?.outlierRemoval || false,
    varianceCalculation: editingGroup?.varianceCalculation || false,
    recurrence: editingGroup?.recurrence || "monthly",
    status: editingGroup?.status || "active",
  });
  const [segmentConditions, setSegmentConditions] = useState<
    SegmentConditionGroup[]
  >([]);
  const [scheduling, setScheduling] = useState<SchedulingData>({
    type: "scheduled",
    time_zone: "(GMT+02:00) Sudan",
    start_date: new Date().toISOString().split("T")[0] + "T08:00",
    end_date: "",
    recurrence_pattern:
      editingGroup?.recurrence === "monthly"
        ? "monthly"
        : editingGroup?.recurrence === "daily"
          ? "daily"
          : "weekly",
    recurrence_interval: 1,
  });

  if (!isOpen) return null;

  const steps = [
    { id: 1, name: "Customer Base", icon: Users },
    { id: 2, name: "Metrics", icon: BarChart3 },
    { id: 3, name: "Scheduling", icon: Calendar },
  ];

  const canProceedToNextStep = () => {
    switch (currentStep) {
      case 1:
        return formData.name && formData.name.trim() !== "";
      case 2:
        return true;
      case 3:
        return true;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (currentStep < 3 && canProceedToNextStep()) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSave = () => {
    const mappedRecurrence: "once" | "daily" | "weekly" | "monthly" =
      scheduling.recurrence_pattern === "monthly"
        ? "monthly"
        : scheduling.recurrence_pattern === "daily"
          ? "daily"
          : "weekly";

    const newGroup: UniversalControlGroup = {
      id: editingGroup?.id || Date.now().toString(),
      name: formData.name || "",
      status: formData.status || "active",
      percentage: formData.percentage || 10,
      generationTime: scheduling.start_date
        ? formatDateWithTimezone(new Date(scheduling.start_date), getSettingsTimezoneOffset(), "default", true)
        : formatDateWithTimezone(new Date(), getSettingsTimezoneOffset(), "default", true),
      memberCount: Math.floor(Math.random() * 100000) + 50000,
      customerBase: formData.customerBase || "active_subscribers",
      sizeMethod: formData.sizeMethod || "percentage",
      outlierRemoval: formData.outlierRemoval || false,
      varianceCalculation: formData.varianceCalculation || false,
      recurrence: mappedRecurrence,
      createdAt: new Date().toISOString().split("T")[0],
    };
    onSave(newGroup);
  };

  return createPortal(
    <div
      className="fixed bg-black bg-opacity-50 flex items-center justify-center"
      style={{
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: "100vw",
        height: "100vh",
        zIndex: zIndex.modal,
      }}
    >
      <div
        className={`bg-white ${tw.rounded} shadow-xl w-full max-w-7xl h-[95vh] overflow-hidden`}
      >
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              {editingGroup
                ? "Edit Control Group"
                : "Create Universal Control Group"}
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              Step {currentStep} of {steps.length}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isActive = currentStep === step.id;
              const isCompleted = currentStep > step.id;

              return (
                <div key={step.id} className="flex items-center">
                  <div
                    className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${
                      isCompleted
                        ? "bg-blue-500 border-blue-500 text-white"
                        : isActive
                          ? "border-blue-500 text-blue-500 bg-white"
                          : "border-gray-300 text-gray-400 bg-white"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <span
                    className={`ml-2 text-sm font-medium ${
                      isActive
                        ? "text-[#588157]"
                        : isCompleted
                          ? "text-gray-900"
                          : "text-gray-500"
                    }`}
                  >
                    {step.name}
                  </span>
                  {index < steps.length - 1 && (
                    <div
                      className={`w-16 h-0.5 mx-4 ${
                        isCompleted ? "" : "bg-gray-300"
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="p-6 h-[calc(95vh-220px)] overflow-y-auto">
          {currentStep === 1 && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Control Group Name *
                </label>
                <Input
                  type="text"
                  value={formData.name}
                  onChange={(value) =>
                    setFormData({ ...formData, name: String(value) })
                  }
                  className={`w-full px-3 py-2 border border-gray-300 ${tw.rounded} focus:ring-1 focus:ring-[#588157] focus:border-[#588157]`}
                  placeholder="Enter control group name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Select the Customer Base for your Control Group
                </label>
                <div className="space-y-3">
                  {[
                    {
                      value: "active_subscribers",
                      label: "Active Subscribers",
                      description: "Only active subscribers",
                    },
                    {
                      value: "all_customers",
                      label: "All Customers",
                      description: "All customers in the database",
                    },
                    {
                      value: "saved_segments",
                      label: "Custom Segment",
                      description: "Define custom segment conditions",
                    },
                  ].map((option) => (
                    <label
                      key={option.value}
                      className={`flex items-start p-3 border border-gray-200 ${tw.rounded} cursor-pointer hover:bg-gray-50`}
                    >
                      <Radio name="customerBase"
                        value={option.value}
                        checked={formData.customerBase === option.value}
                        onChange={(value) =>
                          setFormData({
                            ...formData,
                            customerBase: String(value) as
                              | "active_subscribers"
                              | "all_customers"
                              | "saved_segments",
                          })
                        }
                        className="mt-1 w-4 h-4 text-[#588157] border-gray-300 focus:ring-[#588157]" />
                      <div className="ml-3">
                        <div className="font-medium text-gray-900">
                          {option.label}
                        </div>
                        <div className="text-sm text-gray-500">
                          {option.description}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {formData.customerBase === "saved_segments" && (
                <div>
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
          )}

          {currentStep === 2 && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Setup the Outlier for your Control Group's customer base
                </label>
                <div className="space-y-3">
                  <label className="flex items-center">
                    <Radio name="outlierRemoval"
                      checked={formData.outlierRemoval === true}
                      onChange={() =>
                        setFormData({ ...formData, outlierRemoval: true })
                      }
                      className="w-4 h-4 text-[#588157] border-gray-300 focus:ring-[#588157]" />
                    <span className="ml-2 text-sm text-gray-900">
                      Yes - Remove outliers
                    </span>
                  </label>
                  <label className="flex items-center">
                    <Radio name="outlierRemoval"
                      checked={formData.outlierRemoval === false}
                      onChange={() =>
                        setFormData({ ...formData, outlierRemoval: false })
                      }
                      className="w-4 h-4 text-[#588157] border-gray-300 focus:ring-[#588157]" />
                    <span className="ml-2 text-sm text-gray-900">
                      No - Keep all data
                    </span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Calculate Variance for Samples
                </label>
                <div className="space-y-3">
                  <label className="flex items-center">
                    <Radio name="varianceCalculation"
                      checked={formData.varianceCalculation === true}
                      onChange={() =>
                        setFormData({ ...formData, varianceCalculation: true })
                      }
                      className="w-4 h-4 text-[#588157] border-gray-300 focus:ring-[#588157]" />
                    <span className="ml-2 text-sm text-gray-900">
                      Yes - Calculate variance
                    </span>
                  </label>
                  <label className="flex items-center">
                    <Radio name="varianceCalculation"
                      checked={formData.varianceCalculation === false}
                      onChange={() =>
                        setFormData({ ...formData, varianceCalculation: false })
                      }
                      className="w-4 h-4 text-[#588157] border-gray-300 focus:ring-[#588157]" />
                    <span className="ml-2 text-sm text-gray-900">
                      No - Skip variance calculation
                    </span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <SchedulingComponent
              scheduling={scheduling}
              onSchedulingChange={setScheduling}
              title="Control Group Generation Schedule"
              subtitle="Configure when this universal control group is generated"
              showPreviewButton={false}
            />
          )}
        </div>

        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200">
          <button
            onClick={handlePrev}
            disabled={currentStep === 1}
            className={`px-4 py-2 border border-gray-300 text-gray-700 ${tw.rounded} hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            Previous
          </button>
          {currentStep === 3 ? (
            <button
              onClick={handleSave}
              className={`px-4 py-2 text-white ${tw.rounded}`}
              style={{ backgroundColor: "#588157" }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "#3A5A40";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "#588157";
              }}
            >
              {editingGroup ? "Update" : "Create"}
            </button>
          ) : (
            <button
              onClick={handleNext}
              disabled={!canProceedToNextStep()}
              className={`px-4 py-2 text-white ${tw.rounded} disabled:opacity-50 disabled:cursor-not-allowed`}
              style={{
                backgroundColor: !canProceedToNextStep() ? "#ccc" : "#588157",
              }}
              onMouseEnter={(e) => {
                if (!canProceedToNextStep()) return;
                e.currentTarget.style.backgroundColor = "#3A5A40";
              }}
              onMouseLeave={(e) => {
                if (!canProceedToNextStep()) return;
                e.currentTarget.style.backgroundColor = "#588157";
              }}
            >
              Next
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
