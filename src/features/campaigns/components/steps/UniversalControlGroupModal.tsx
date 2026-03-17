import { useState } from "react";
import { createPortal } from "react-dom";
import DeleteConfirmModal from "../../../../shared/components/ui/DeleteConfirmModal";
import {
  X,
  Plus,
  Edit,
  Trash2,
  Settings,
  Users,
  Calendar,
  BarChart3,
} from "lucide-react";

import { tw, zIndex } from "../../../../shared/utils/utils";
import {
  UniversalControlGroup,
  UNIVERSAL_CONTROL_GROUPS,
} from "../../../../shared/config/universalControlGroupsConfig";

interface UniversalControlGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect?: (groupId: string) => void;
  selectionMode?: boolean;
}

export default function UniversalControlGroupModal({
  isOpen,
  onClose,
  onSelect,
  selectionMode = false,
}: UniversalControlGroupModalProps) {
  const [controlGroups, setControlGroups] =
    useState<UniversalControlGroup[]>(UNIVERSAL_CONTROL_GROUPS);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingGroup, setEditingGroup] =
    useState<UniversalControlGroup | null>(null);

  if (!isOpen) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "inactive":
        return "bg-gray-100 text-gray-800";
      case "expired":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const handleDelete = (id: string) => {
    // TODO: Implement delete confirmation modal
    setControlGroups((prev) => prev.filter((group) => group.id !== id));
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
        className={`bg-white ${tw.rounded} shadow-xl w-full max-w-6xl h-[90vh] flex flex-col`}
        style={{ zIndex: zIndex.modal }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Universal Control Groups
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Manage and configure universal control groups for campaigns
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowCreateModal(true)}
              className={`inline-flex items-center px-4 py-2 bg-blue-500 text-white ${tw.rounded} hover:bg-blue-600 transition-colors text-sm font-medium`}
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Control Group
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          {controlGroups.length === 0 ? (
            <div className="text-center py-12">
              <Settings className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No Control Groups
              </h3>
              <p className="text-gray-500 mb-6">
                Create your first universal control group to get started
              </p>
              <button
                onClick={() => setShowCreateModal(true)}
                className={`inline-flex items-center px-4 py-2 bg-blue-500 text-white ${tw.rounded} hover:bg-blue-600 transition-colors`}
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Control Group
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Table Header */}
              <div
                className={`grid grid-cols-12 gap-4 px-4 py-3 bg-gray-50 ${tw.rounded} text-sm font-medium text-gray-700`}
              >
                <div className="col-span-3">Control Group</div>
                <div className="col-span-2">Status</div>
                <div className="col-span-2">Generation Time</div>
                <div className="col-span-2">Percentage</div>
                <div className="col-span-2">Member Count</div>
                <div className="col-span-1">Actions</div>
              </div>

              {/* Table Rows */}
              {controlGroups.map((group) => (
                <div
                  key={group.id}
                  onClick={() => {
                    if (selectionMode && onSelect) {
                      onSelect(group.id);
                      onClose();
                    }
                  }}
                  className={`grid grid-cols-12 gap-4 px-4 py-4 bg-white border border-gray-200 ${tw.rounded} ${
                    selectionMode ? "cursor-pointer hover:bg-blue-50 hover:shadow-sm" : "hover:shadow-sm"
                  } transition-shadow`}
                >
                  <div className="col-span-3">
                    <div className="font-medium text-gray-900">
                      {group.name}
                    </div>
                    <div className="text-sm text-gray-500">
                      {group.customerBase}
                    </div>
                  </div>
                  <div className="col-span-2">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                        group.status
                      )}`}
                    >
                      {group.status.replace(/_/g, " ")}
                    </span>
                  </div>
                  <div className="col-span-2">
                    <div className="text-sm text-gray-900">
                      {group.generationTime}
                    </div>
                    <div className="text-xs text-gray-500">
                      Recurs {group.recurrence}
                    </div>
                  </div>
                  <div className="col-span-2">
                    <div className="text-sm font-medium text-gray-900">
                      {group.percentage}%
                    </div>
                  </div>
                  <div className="col-span-2">
                    <div className="flex items-center text-sm text-gray-900">
                      <Users className="w-4 h-4 mr-1 text-gray-400" />
                      {group.memberCount.toLocaleString()}
                    </div>
                  </div>
                  <div className="col-span-1">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setEditingGroup(group)}
                        className="p-1 text-gray-400 hover:text-[#588157] transition-colors"
                        title="Edit"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(group.id)}
                        className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
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
        return true; // No required fields in step 2
      case 3:
        return true; // No required fields in step 3
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
    const newGroup: UniversalControlGroup = {
      id: editingGroup?.id || Date.now().toString(),
      name: formData.name || "",
      status: formData.status || "active",
      percentage: formData.percentage || 10,
      generationTime: new Date().toLocaleString(),
      memberCount: Math.floor(Math.random() * 100000) + 50000,
      customerBase: formData.customerBase || "active_subscribers",
      sizeMethod: formData.sizeMethod || "percentage",
      outlierRemoval: formData.outlierRemoval || false,
      varianceCalculation: formData.varianceCalculation || false,
      recurrence: formData.recurrence || "monthly",
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
        zIndex: zIndexTokens.overlay,
      }}
    >
      <div
        className={`bg-white ${tw.rounded} shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden`}
      >
        {/* Header */}
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

        {/* Steps */}
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

        {/* Content */}
        <div className="p-6 max-h-96 overflow-y-auto">
          {currentStep === 1 && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Control Group Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
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
                      label: "Saved Segments",
                      description: "Use predefined customer segments",
                    },
                  ].map((option) => (
                    <label
                      key={option.value}
                      className={`flex items-start p-3 border border-gray-200 ${tw.rounded} cursor-pointer hover:bg-gray-50`}
                    >
                      <input
                        type="radio"
                        name="customerBase"
                        value={option.value}
                        checked={formData.customerBase === option.value}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            customerBase: e.target.value as
                              | "active_subscribers"
                              | "all_customers"
                              | "saved_segments",
                          })
                        }
                        className="mt-1 w-4 h-4 text-[#588157] border-gray-300 focus:ring-[#588157]"
                      />
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

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Select the size criteria for your Control Group's customer
                  base
                </label>
                <div className="space-y-3">
                  {[
                    {
                      value: "percentage",
                      label: "Base %",
                      description: "Percentage of customer base",
                    },
                    {
                      value: "fixed_value",
                      label: "Fixed Value",
                      description: "Fixed number of customers",
                    },
                    {
                      value: "advanced_parameters",
                      label: "Advanced Parameters",
                      description: "Statistical parameters",
                    },
                  ].map((option) => (
                    <label
                      key={option.value}
                      className={`flex items-start p-3 border border-gray-200 ${tw.rounded} cursor-pointer hover:bg-gray-50`}
                    >
                      <input
                        type="radio"
                        name="sizeMethod"
                        value={option.value}
                        checked={formData.sizeMethod === option.value}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            sizeMethod: e.target.value as
                              | "percentage"
                              | "fixed_value"
                              | "advanced_parameters",
                          })
                        }
                        className="mt-1 w-4 h-4 text-[#588157] border-gray-300 focus:ring-[#588157]"
                      />
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

                {formData.sizeMethod === "percentage" && (
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Size Percentage Value: {formData.percentage}%
                    </label>
                    <input
                      type="range"
                      min="1"
                      max="50"
                      step="1"
                      value={formData.percentage || 10}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          percentage: parseInt(e.target.value),
                        })
                      }
                      className="w-full"
                    />
                  </div>
                )}
              </div>
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
                    <input
                      type="radio"
                      name="outlierRemoval"
                      checked={formData.outlierRemoval === true}
                      onChange={() =>
                        setFormData({ ...formData, outlierRemoval: true })
                      }
                      className="w-4 h-4 text-[#588157] border-gray-300 focus:ring-[#588157]"
                    />
                    <span className="ml-2 text-sm text-gray-900">
                      Yes - Remove outliers
                    </span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="outlierRemoval"
                      checked={formData.outlierRemoval === false}
                      onChange={() =>
                        setFormData({ ...formData, outlierRemoval: false })
                      }
                      className="w-4 h-4 text-[#588157] border-gray-300 focus:ring-[#588157]"
                    />
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
                    <input
                      type="radio"
                      name="varianceCalculation"
                      checked={formData.varianceCalculation === true}
                      onChange={() =>
                        setFormData({ ...formData, varianceCalculation: true })
                      }
                      className="w-4 h-4 text-[#588157] border-gray-300 focus:ring-[#588157]"
                    />
                    <span className="ml-2 text-sm text-gray-900">
                      Yes - Calculate variance
                    </span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="varianceCalculation"
                      checked={formData.varianceCalculation === false}
                      onChange={() =>
                        setFormData({ ...formData, varianceCalculation: false })
                      }
                      className="w-4 h-4 text-[#588157] border-gray-300 focus:ring-[#588157]"
                    />
                    <span className="ml-2 text-sm text-gray-900">
                      No - Skip variance calculation
                    </span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Schedule the Date and Time for your Control Group generation
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">
                      Generation Date
                    </label>
                    <input
                      type="date"
                      className={`w-full px-3 py-2 border border-gray-300 ${tw.rounded} focus:ring-1 focus:ring-[#588157] focus:border-[#588157]`}
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">
                      Generation Time
                    </label>
                    <input
                      type="time"
                      className={`w-full px-3 py-2 border border-gray-300 ${tw.rounded} focus:ring-1 focus:ring-[#588157] focus:border-[#588157]`}
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Setup the Recurrence for your Control Group generation
                </label>
                <div className="space-y-3">
                  {[
                    {
                      value: "once",
                      label: "One Time",
                      description: "Generate once only",
                    },
                    {
                      value: "daily",
                      label: "Daily",
                      description: "Generate every day",
                    },
                    {
                      value: "weekly",
                      label: "Weekly",
                      description: "Generate every week",
                    },
                    {
                      value: "monthly",
                      label: "Monthly",
                      description: "Generate every month",
                    },
                  ].map((option) => (
                    <label
                      key={option.value}
                      className={`flex items-start p-3 border border-gray-200 ${tw.rounded} cursor-pointer hover:bg-gray-50`}
                    >
                      <input
                        type="radio"
                        name="recurrence"
                        value={option.value}
                        checked={formData.recurrence === option.value}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            recurrence: e.target.value as
                              | "once"
                              | "daily"
                              | "weekly"
                              | "monthly",
                          })
                        }
                        className="mt-1 w-4 h-4 text-[#588157] border-gray-300 focus:ring-[#588157]"
                      />
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
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200">
          <button
            onClick={handlePrev}
            disabled={currentStep === 1}
            className={`px-4 py-2 border border-gray-300 text-gray-700 ${tw.rounded} hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            Previous
          </button>
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className={`px-4 py-2 border border-gray-300 text-gray-700 ${tw.rounded} hover:bg-gray-50`}
            >
              Cancel
            </button>
            {currentStep === 3 ? (
              <button
                onClick={handleSave}
                className={`px-4 py-2  text-white ${tw.rounded} hover:bg-[#3A5A40]`}
              >
                {editingGroup ? "Update" : "Create"} Control Group
              </button>
            ) : (
              <button
                onClick={handleNext}
                disabled={!canProceedToNextStep()}
                className={`px-4 py-2  text-white ${tw.rounded} hover:bg-[#3A5A40] disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-400`}
              >
                Next
              </button>
            )}
          </div>
        </div>
      </div>
    </div>,
    <>
      <DeleteConfirmModal
        isOpen={showDeleteModal}
        onClose={handleCancelDelete}
        onConfirm={handleConfirmDelete}
        title="Delete Control Group"
        description="Are you sure you want to delete this control group? This action cannot be undone."
        itemName={
          controlGroups.find((g) => g.id === controlGroupToDelete)?.name || ""
        }
        isLoading={false}
        confirmText="Delete Control Group"
        cancelText="Cancel"
      />
    </>,
    document.body
  );
}
