import { useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import {
  Shield,
  Plus,
  Search,
  Edit,
  Trash2,
  Calendar,
  Users,
  Percent,
  Clock,
  MoreVertical,
  X,
  BarChart3,
} from "lucide-react";
import HeadlessSelect from "../../../shared/components/ui/HeadlessSelect";
import BackButton from "../../../shared/components/ui/BackButton";
import ProgressStepper, {
  Step,
} from "../../../shared/components/ui/ProgressStepper";
import { useLanguage } from "../../../contexts/LanguageContext";
import { color, tw } from "../../../shared/utils/utils";
import {
  UniversalControlGroup,
  UNIVERSAL_CONTROL_GROUPS,
} from "../../../shared/config/universalControlGroupsConfig";


export default function ControlGroupsPage() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "active" | "inactive" | "expired"
  >("all");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [controlGroupName, setControlGroupName] = useState("");
  const [nameError, setNameError] = useState("");
  const [controlGroupPercentage, setControlGroupPercentage] = useState(10);

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
  ];

  const statusFilterOptions = [
    { value: "all", label: "All Status" },
    { value: "active", label: "Active" },
    { value: "inactive", label: "Inactive" },
    { value: "expired", label: "Expired" },
  ];

  // Control groups from config
  const controlGroups: UniversalControlGroup[] = UNIVERSAL_CONTROL_GROUPS;

  const filteredGroups = controlGroups.filter((group) => {
    const matchesSearch =
      group.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      group.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || group.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return `bg-[${color.primary.action}]/10 text-[${color.primary.action}] border-[${color.primary.action}]/20`;
      case "inactive":
        return "bg-gray-100 text-gray-800 border-gray-200";
      case "expired":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getCustomerBaseLabel = (base: string) => {
    switch (base) {
      case "active_subscribers":
        return "Active Subscribers";
      case "all_customers":
        return "All Customers";
      case "saved_segments":
        return "Saved Segments";
      default:
        return base;
    }
  };

  const getRecurrenceLabel = (recurrence: string) => {
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
        return recurrence;
    }
  };

  const canNavigateToStep = (stepId: number) => {
    // Can always go to completed steps or current step
    if (stepId <= currentStep) return true;
    // To go to next step, current step must be valid
    if (stepId === currentStep + 1) {
      // Validate current step
      if (currentStep === 1 && controlGroupName.trim() === "") {
        return false;
      }
      return true;
    }
    return false;
  };

  const handleStepClick = (stepId: number) => {
    // Validate before navigating
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
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleCloseModal = () => {
    setShowCreateModal(false);
    setCurrentStep(1);
    setControlGroupName("");
    setNameError("");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center space-x-2 sm:space-x-4">
          <BackButton fallbackTo="/dashboard/configuration" />
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
              {t.controlGroups.title}
            </h1>
            <p className="text-gray-600 mt-1 text-sm">
              {t.controlGroups.subtitle}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 w-auto">
          <button
            onClick={() => setShowCreateModal(true)}
            className={`inline-flex items-center px-4 py-2 ${tw.rounded} text-sm font-medium text-white transition-colors hover:opacity-90 w-auto`}
            style={{ backgroundColor: color.primary.action }}
          >
            <Plus className="h-4 w-4 mr-2" />
            <span>{t.controlGroups.createControlGroup}</span>
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <div
          className={`bg-white ${tw.rounded} border border-gray-200 p-6 shadow-sm`}
        >
          <div className="flex items-center gap-2">
            <Shield
              className="h-5 w-5"
              style={{ color: color.primary.accent }}
            />
            <p className="text-sm font-medium text-gray-600">
              {t.controlGroups.totalGroups}
            </p>
          </div>
          <p className="mt-2 text-3xl font-bold text-gray-900">
            {controlGroups.length}
          </p>
        </div>

        <div
          className={`bg-white ${tw.rounded} border border-gray-200 p-6 shadow-sm`}
        >
          <div className="flex items-center gap-2">
            <Users
              className="h-5 w-5"
              style={{ color: color.primary.accent }}
            />
            <p className="text-sm font-medium text-gray-600">Active Groups</p>
          </div>
          <p className="mt-2 text-3xl font-bold text-gray-900">
            {controlGroups.filter((g) => g.status === "active").length}
          </p>
        </div>

        <div
          className={`bg-white ${tw.rounded} border border-gray-200 p-6 shadow-sm`}
        >
          <div className="flex items-center gap-2">
            <Percent
              className="h-5 w-5"
              style={{ color: color.primary.accent }}
            />
            <p className="text-sm font-medium text-gray-600">Avg Percentage</p>
          </div>
          <p className="mt-2 text-3xl font-bold text-gray-900">
            {controlGroups.length > 0
              ? (
                  controlGroups.reduce((sum, g) => sum + g.percentage, 0) /
                  controlGroups.length
                ).toFixed(1)
              : 0}
            %
          </p>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="">
        <div className="flex flex-col lg:flex-row lg:items-center space-y-4 lg:space-y-0 lg:space-x-4">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder={t.controlGroups.searchPlaceholder}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full pl-10 pr-4 py-2 border border-gray-300 ${tw.rounded} focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
            />
          </div>

          {/* Status Filter */}
          <div className="w-full lg:w-48">
            <HeadlessSelect
              options={statusFilterOptions}
              value={statusFilter}
              onChange={(value: string | number) =>
                setStatusFilter(
                  value as "all" | "active" | "inactive" | "expired",
                )
              }
              placeholder="Filter by status"
            />
          </div>
        </div>
      </div>

      {/* Control Groups Table */}
      <div
        className={` ${tw.rounded} border border-[${color.border.default}] overflow-hidden`}
      >
        {filteredGroups.length > 0 ? (
          <div className="overflow-x-auto">
            <table
              className="w-full min-w-[720px]"
              style={{ borderCollapse: "separate", borderSpacing: "0 8px" }}
            >
              <thead style={{ background: color.surface.tableHeader }}>
                <tr>
                  <th
                    className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider"
                    style={{ color: color.surface.tableHeaderText }}
                  >
                    Name
                  </th>
                  {/* <th
                    className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider"
                    style={{ color: color.surface.tableHeaderText }}
                  >
                    Description
                  </th> */}
                  <th
                    className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider"
                    style={{ color: color.surface.tableHeaderText }}
                  >
                    Status
                  </th>
                  <th
                    className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider"
                    style={{ color: color.surface.tableHeaderText }}
                  >
                    Generation Time
                  </th>
                  <th
                    className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider"
                    style={{ color: color.surface.tableHeaderText }}
                  >
                    Percentage
                  </th>
                  <th
                    className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider"
                    style={{ color: color.surface.tableHeaderText }}
                  >
                    Member Count
                  </th>
                  <th
                    className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider"
                    style={{ color: color.surface.tableHeaderText }}
                  >
                    Customer Base
                  </th>
                  <th
                    className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider"
                    style={{ color: color.surface.tableHeaderText }}
                  >
                    Recurrence
                  </th>
                  <th
                    className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider"
                    style={{ color: color.surface.tableHeaderText }}
                  >
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredGroups.map((group) => (
                  <tr key={group.id} className="transition-colors">
                    <td
                      className="px-6 py-4"
                      style={{ backgroundColor: color.surface.tablebodybg }}
                    >
                      <div
                        className={`font-semibold text-sm sm:text-base ${tw.textPrimary}`}
                      >
                        {group.name}
                      </div>
                    </td>
                    {/* <td
                      className={`px-6 py-4 text-sm ${tw.textMuted}`}
                      style={{ backgroundColor: color.surface.tablebodybg }}
                    >
                      {group.description || "-"}
                    </td> */}
                    <td
                      className={`px-6 py-4 text-sm font-medium ${tw.textPrimary}`}
                      style={{ backgroundColor: color.surface.tablebodybg }}
                    >
                      {group.status}
                    </td>
                    <td
                      className={`px-6 py-4 text-sm ${tw.textPrimary}`}
                      style={{ backgroundColor: color.surface.tablebodybg }}
                    >
                      {group.generationTime}
                    </td>
                    <td
                      className={`px-6 py-4 text-sm ${tw.textPrimary}`}
                      style={{ backgroundColor: color.surface.tablebodybg }}
                    >
                      {group.percentage}%
                    </td>
                    <td
                      className={`px-6 py-4 text-sm ${tw.textPrimary}`}
                      style={{ backgroundColor: color.surface.tablebodybg }}
                    >
                      {group.memberCount.toLocaleString()}
                    </td>
                    <td
                      className={`px-6 py-4 text-sm ${tw.textPrimary}`}
                      style={{ backgroundColor: color.surface.tablebodybg }}
                    >
                      {getCustomerBaseLabel(group.customerBase)}
                    </td>
                    <td
                      className={`px-6 py-4 text-sm ${tw.textPrimary}`}
                      style={{ backgroundColor: color.surface.tablebodybg }}
                    >
                      {getRecurrenceLabel(group.recurrence)}
                    </td>
                    <td
                      className="px-6 py-4 text-sm font-medium"
                      style={{ backgroundColor: color.surface.tablebodybg }}
                    >
                      <div className="flex items-center justify-end gap-2">
                        <button
                          className={`p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 ${tw.rounded} transition-all duration-200`}
                          title="Edit"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          className={`p-2 text-red-600 hover:text-red-700 hover:bg-red-50 ${tw.rounded} transition-all duration-200`}
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                        <button
                          className={`p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 ${tw.rounded} transition-all duration-200`}
                          title="More options"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No control groups found
            </h3>
            <p className="text-gray-500 mb-6">
              {searchTerm
                ? "Try adjusting your search terms"
                : "Create your first universal control group to get started"}
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className={`inline-flex items-center px-4 py-2 ${tw.primaryAction} ${tw.rounded} text-sm font-medium transition-colors hover:opacity-90`}
              style={{ backgroundColor: color.primary.action }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Control Group
            </button>
          </div>
        )}
      </div>

      {/* Universal Control Group Modal - Direct to Create */}
      {showCreateModal &&
        createPortal(
          <div className="p-6 fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]">
            <div
              className={`bg-white ${tw.rounded} shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden`}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Create Universal Control Group
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Step {currentStep} of 3
                  </p>
                </div>
                <button
                  onClick={handleCloseModal}
                  className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Progress Stepper */}
              <div className="px-6">
              <ProgressStepper
                steps={STEPS}
                currentStep={currentStep}
                onStepClick={handleStepClick}
                canNavigateToStep={canNavigateToStep}
                primaryColor={color.primary.action}
                textPrimary={tw.textPrimary}
                textMuted={tw.textMuted}
              />
              </div>

              {/* Content */}
              <div className="px-6 max-h-96 overflow-y-auto">
                <div className="space-y-6">
                  {/* Step 1: Control Group Name & Customer Base */}
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
                          style={
                            {
                              "--tw-ring-color": color.primary.action,
                            } as React.CSSProperties & {
                              "--tw-ring-color"?: string;
                            }
                          }
                          onFocus={(e) => {
                            e.target.style.borderColor = color.primary.action;
                          }}
                          onBlur={(e) => {
                            e.target.style.borderColor = "";
                          }}
                          placeholder="Enter control group name"
                        />
                        {nameError && (
                          <p className="text-red-600 text-sm mt-1">
                            {nameError}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 my-3">
                          Select the Customer Base for your Control Group
                        </label>
                        <div className="space-y-3">
                          <label
                            className={`flex items-start p-3 border border-gray-200 ${tw.rounded} cursor-pointer hover:bg-gray-50`}
                          >
                            <input
                              type="radio"
                              name="customerBase"
                              value="active_subscribers"
                              defaultChecked
                              className="mt-1 w-4 h-4 border-gray-300"
                              style={
                                {
                                  accentColor: color.primary.action,
                                  "--tw-ring-color": color.primary.action,
                                } as React.CSSProperties
                              }
                            />
                            <div className="ml-3">
                              <div className="font-medium text-sm text-gray-900">
                                Active Subscribers
                              </div>
                              <div className="text-xs text-gray-500">
                                Only active subscribers
                              </div>
                            </div>
                          </label>
                          <label
                            className={`flex items-start p-3 border border-gray-200 ${tw.rounded} cursor-pointer hover:bg-gray-50`}
                          >
                            <input
                              type="radio"
                              name="customerBase"
                              value="all_customers"
                              className="mt-1 w-4 h-4 border-gray-300"
                              style={
                                {
                                  accentColor: color.primary.action,
                                  "--tw-ring-color": color.primary.action,
                                } as React.CSSProperties
                              }
                            />
                            <div className="ml-3">
                              <div className="font-medium text-sm text-gray-900">
                                All Customers
                              </div>
                              <div className="text-xs text-gray-500">
                                All customers in the database
                              </div>
                            </div>
                          </label>
                          <label
                            className={`flex items-start p-3 border border-gray-200 ${tw.rounded} cursor-pointer hover:bg-gray-50`}
                          >
                            <input
                              type="radio"
                              name="customerBase"
                              value="saved_segments"
                              className="mt-1 w-4 h-4 border-gray-300"
                              style={
                                {
                                  accentColor: color.primary.action,
                                  "--tw-ring-color": color.primary.action,
                                } as React.CSSProperties
                              }
                            />
                            <div className="ml-3">
                              <div className="font-medium text-sm text-gray-900">
                                Saved Segments
                              </div>
                              <div className="text-xs text-gray-500">
                                Use predefined customer segments
                              </div>
                            </div>
                          </label>
                        </div>
                      </div>
                    </>
                  )}

                  {/* Step 2: Metrics */}
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
                            onChange={(e) => setControlGroupPercentage(Number(e.target.value))}
                            className="flex-1"
                            style={{
                              accentColor: color.primary.action,
                            }}
                          />
                          <span className="text-sm font-semibold text-gray-700 w-12">
                            {controlGroupPercentage}%
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-2">
                          Percentage of customers to include in the control
                          group (1-50%)
                        </p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Generation Method
                        </label>
                        <div className="space-y-2">
                          <label className="flex items-center p-3 border border-gray-200 rounded cursor-pointer hover:bg-gray-50">
                            <input
                              type="radio"
                              name="generationMethod"
                              value="random"
                              defaultChecked
                              className="w-4 h-4"
                              style={{ accentColor: color.primary.action }}
                            />
                            <span className="ml-3 text-sm font-medium text-gray-900">
                              Random Selection
                            </span>
                          </label>
                          <label className="flex items-center p-3 border border-gray-200 rounded cursor-pointer hover:bg-gray-50">
                            <input
                              type="radio"
                              name="generationMethod"
                              value="stratified"
                              className="w-4 h-4"
                              style={{ accentColor: color.primary.action }}
                            />
                            <span className="ml-3 text-sm font-medium text-gray-900">
                              Stratified Sampling
                            </span>
                          </label>
                        </div>
                      </div>
                    </>
                  )}

                  {/* Step 3: Scheduling */}
                  {currentStep === 3 && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Recurrence Pattern *
                        </label>
                        <div className="space-y-2">
                          <label className="flex items-center p-3 border border-gray-200 rounded cursor-pointer hover:bg-gray-50">
                            <input
                              type="radio"
                              name="recurrence"
                              value="once"
                              defaultChecked
                              className="w-4 h-4"
                              style={{ accentColor: color.primary.action }}
                            />
                            <span className="ml-3 text-sm font-medium text-gray-900">
                              One-time
                            </span>
                          </label>
                          <label className="flex items-center p-3 border border-gray-200 rounded cursor-pointer hover:bg-gray-50">
                            <input
                              type="radio"
                              name="recurrence"
                              value="daily"
                              className="w-4 h-4"
                              style={{ accentColor: color.primary.action }}
                            />
                            <span className="ml-3 text-sm font-medium text-gray-900">
                              Daily
                            </span>
                          </label>
                          <label className="flex items-center p-3 border border-gray-200 rounded cursor-pointer hover:bg-gray-50">
                            <input
                              type="radio"
                              name="recurrence"
                              value="weekly"
                              className="w-4 h-4"
                              style={{ accentColor: color.primary.action }}
                            />
                            <span className="ml-3 text-sm font-medium text-gray-900">
                              Weekly
                            </span>
                          </label>
                          <label className="flex items-center p-3 border border-gray-200 rounded cursor-pointer hover:bg-gray-50">
                            <input
                              type="radio"
                              name="recurrence"
                              value="monthly"
                              className="w-4 h-4"
                              style={{ accentColor: color.primary.action }}
                            />
                            <span className="ml-3 text-sm font-medium text-gray-900">
                              Monthly
                            </span>
                          </label>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Start Date
                        </label>
                        <input
                          type="date"
                          className={`w-full px-3 py-2 border border-gray-300 ${tw.rounded} focus:outline-none focus:ring-2 focus:ring-offset-0`}
                          style={
                            {
                              "--tw-ring-color": color.primary.action,
                            } as React.CSSProperties
                          }
                        />
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between px-6 py-4 ">
                <button
                  onClick={handleCloseModal}
                  className={`px-4 py-2 border text-sm border-gray-300 text-gray-700 ${tw.rounded} text-sm font-medium hover:bg-gray-50 transition-colors`}
                >
                  Cancel
                </button>
                <div className="flex space-x-3">
                  <button
                    onClick={handlePrev}
                    disabled={currentStep === 1}
                    className={`px-4 py-2 border text-sm border-gray-300 text-gray-700 ${tw.rounded} cursor-pointer disabled:text-gray-400 disabled:cursor-not-allowed`}
                  >
                    Previous
                  </button>
                  {currentStep === 3 ? (
                    <button
                      className={`px-4 py-2 ${tw.rounded} text-sm font-medium hover:opacity-90 transition-colors text-white`}
                      style={{ backgroundColor: color.primary.action }}
                      onClick={() => {
                        handleCloseModal();
                      }}
                    >
                      Create Control Group
                    </button>
                  ) : (
                    <button
                      onClick={handleNext}
                      className={`px-4 py-2 ${tw.rounded} text-sm font-medium hover:opacity-90 transition-colors text-white`}
                      style={{ backgroundColor: color.primary.action }}
                    >
                      Next
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
