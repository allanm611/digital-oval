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
  ArrowLeft,
} from "lucide-react";
import HeadlessSelect from "../../../shared/components/ui/HeadlessSelect";
import { color, tw } from "../../../shared/utils/utils";

interface UniversalControlGroup {
  id: string;
  name: string;
  status: "active" | "inactive" | "expired";
  generationTime: string;
  percentage: number;
  memberCount: number;
  customerBase: "active_subscribers" | "all_customers" | "saved_segments";
  recurrence: "once" | "daily" | "weekly" | "monthly";
  lastGenerated: string;
  nextGeneration?: string;
  createdBy: string;
  description?: string;
}

export default function ControlGroupsPage() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "active" | "inactive" | "expired"
  >("all");
  const [showCreateModal, setShowCreateModal] = useState(false);

  const statusFilterOptions = [
    { value: "all", label: "All Status" },
    { value: "active", label: "Active" },
    { value: "inactive", label: "Inactive" },
    { value: "expired", label: "Expired" },
  ];

  // Mock data
  const controlGroups: UniversalControlGroup[] = [
    {
      id: "1",
      name: "Premium Customer Control",
      status: "active",
      generationTime: "2025-01-20 09:00",
      percentage: 15,
      memberCount: 12500,
      customerBase: "active_subscribers",
      recurrence: "weekly",
      lastGenerated: "2025-01-20",
      nextGeneration: "2025-01-27",
      createdBy: "Marketing Team",
      description: "Control group for premium customer campaigns",
    },
    {
      id: "2",
      name: "General Population Control",
      status: "active",
      generationTime: "2025-01-19 14:30",
      percentage: 10,
      memberCount: 25000,
      customerBase: "all_customers",
      recurrence: "monthly",
      lastGenerated: "2025-01-19",
      nextGeneration: "2025-02-19",
      createdBy: "Data Science Team",
      description: "Standard control group for all customer campaigns",
    },
    {
      id: "3",
      name: "Segment-Based Control",
      status: "inactive",
      generationTime: "2025-01-15 11:00",
      percentage: 20,
      memberCount: 8750,
      customerBase: "saved_segments",
      recurrence: "once",
      lastGenerated: "2025-01-15",
      createdBy: "Campaign Manager",
      description: "One-time control group for specific segment testing",
    },
  ];

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center space-x-2 sm:space-x-4">
          <button
            onClick={() => navigate("/dashboard/configuration")}
            className={`p-2 text-gray-600 hover:text-gray-800 ${tw.rounded} transition-colors`}
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
              Universal Control Groups
            </h1>
            <p className="text-gray-600 mt-1 text-sm">
              Configure and manage universal control groups for campaigns
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
            <span>Create Control Group</span>
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className={`bg-white ${tw.rounded} border border-gray-200 p-6`}>
          <div className="flex items-center">
            <div
              className={`p-3 ${tw.rounded}`}
              style={{ backgroundColor: `${color.primary.action}10` }}
            >
              <Shield
                className="h-6 w-6"
                style={{ color: color.primary.action }}
              />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">
                Total Control Groups
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {controlGroups.length}
              </p>
            </div>
          </div>
        </div>

        <div className={`bg-white ${tw.rounded} border border-gray-200 p-6`}>
          <div className="flex items-center">
            <div
              className={`p-3 ${tw.rounded}`}
              style={{ backgroundColor: `${color.primary.action}10` }}
            >
              <Users
                className="h-6 w-6"
                style={{ color: color.primary.action }}
              />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active Groups</p>
              <p className="text-2xl font-bold text-gray-900">
                {controlGroups.filter((g) => g.status === "active").length}
              </p>
            </div>
          </div>
        </div>

        <div className={`bg-white ${tw.rounded} border border-gray-200 p-6`}>
          <div className="flex items-center">
            <div className={`p-3 ${tw.rounded} bg-blue-100`}>
              <Percent className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">
                Avg Percentage
              </p>
              <p className="text-2xl font-bold text-gray-900">
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
              placeholder="Search control groups..."
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
                  value as "all" | "active" | "inactive" | "expired"
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
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div
                            className={`h-10 w-10 ${tw.rounded} flex items-center justify-center`}
                            style={{
                              backgroundColor: `${color.primary.action}10`,
                            }}
                          >
                            <Shield
                              className="h-5 w-5"
                              style={{ color: color.primary.action }}
                            />
                          </div>
                        </div>
                        <div className="ml-4">
                          <div
                            className={`font-semibold text-sm sm:text-base ${tw.textPrimary}`}
                          >
                            {group.name}
                          </div>
                          {group.description && (
                            <div
                              className={`text-xs sm:text-sm ${tw.textMuted} truncate mt-1`}
                            >
                              {group.description}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td
                      className="px-6 py-4"
                      style={{ backgroundColor: color.surface.tablebodybg }}
                    >
                      <span
                        className={`inline-flex items-center px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium border ${
                          group.status === "active"
                            ? ""
                            : group.status === "inactive"
                            ? "bg-gray-100 text-gray-800 border-gray-200"
                            : "bg-red-100 text-red-800 border-red-200"
                        }`}
                        style={
                          group.status === "active"
                            ? {
                                backgroundColor: `${color.primary.action}10`,
                                color: color.primary.action,
                                borderColor: `${color.primary.action}20`,
                              }
                            : undefined
                        }
                      >
                        {group.status}
                      </span>
                    </td>
                    <td
                      className={`px-6 py-4 text-sm ${tw.textPrimary}`}
                      style={{ backgroundColor: color.surface.tablebodybg }}
                    >
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                        {group.generationTime}
                      </div>
                    </td>
                    <td
                      className={`px-6 py-4 text-sm ${tw.textPrimary}`}
                      style={{ backgroundColor: color.surface.tablebodybg }}
                    >
                      <div className="flex items-center">
                        <Percent className="h-4 w-4 mr-2 text-gray-400" />
                        {group.percentage}%
                      </div>
                    </td>
                    <td
                      className={`px-6 py-4 text-sm ${tw.textPrimary}`}
                      style={{ backgroundColor: color.surface.tablebodybg }}
                    >
                      <div className="flex items-center">
                        <Users className="h-4 w-4 mr-2 text-gray-400" />
                        {group.memberCount.toLocaleString()}
                      </div>
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
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-2 text-gray-400" />
                        {getRecurrenceLabel(group.recurrence)}
                      </div>
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
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]">
            <div className={`bg-white ${tw.rounded} shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden`}>
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Create Universal Control Group
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">Step 1 of 3</p>
                </div>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Steps */}
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div
                      className="flex items-center justify-center w-8 h-8 rounded-full border-2 bg-white"
                      style={{
                        borderColor: color.primary.action,
                        color: color.primary.action,
                      }}
                    >
                      <Users className="w-4 h-4" />
                    </div>
                    <span
                      className="ml-2 text-sm font-medium"
                      style={{ color: color.primary.action }}
                    >
                      Customer Base
                    </span>
                    <div className="w-16 h-0.5 mx-4 bg-gray-300" />
                  </div>
                  <div className="flex items-center">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full border-2 border-gray-300 text-gray-400 bg-white">
                      <BarChart3 className="w-4 h-4" />
                    </div>
                    <span className="ml-2 text-sm font-medium text-gray-500">
                      Metrics
                    </span>
                    <div className="w-16 h-0.5 mx-4 bg-gray-300" />
                  </div>
                  <div className="flex items-center">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full border-2 border-gray-300 text-gray-400 bg-white">
                      <Calendar className="w-4 h-4" />
                    </div>
                    <span className="ml-2 text-sm font-medium text-gray-500">
                      Scheduling
                    </span>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="p-6 max-h-96 overflow-y-auto">
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Control Group Name *
                    </label>
                    <input
                      type="text"
                      className={`w-full px-3 py-2 border border-gray-300 ${tw.rounded} focus:outline-none focus:ring-2 focus:ring-offset-0`}
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
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Select the Customer Base for your Control Group
                    </label>
                    <div className="space-y-3">
                      <label className={`flex items-start p-3 border border-gray-200 ${tw.rounded} cursor-pointer hover:bg-gray-50`}>
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
                          <div className="font-medium text-gray-900">
                            Active Subscribers
                          </div>
                          <div className="text-sm text-gray-500">
                            Only active subscribers
                          </div>
                        </div>
                      </label>
                      <label className={`flex items-start p-3 border border-gray-200 ${tw.rounded} cursor-pointer hover:bg-gray-50`}>
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
                          <div className="font-medium text-gray-900">
                            All Customers
                          </div>
                          <div className="text-sm text-gray-500">
                            All customers in the database
                          </div>
                        </div>
                      </label>
                      <label className={`flex items-start p-3 border border-gray-200 ${tw.rounded} cursor-pointer hover:bg-gray-50`}>
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
                          <div className="font-medium text-gray-900">
                            Saved Segments
                          </div>
                          <div className="text-sm text-gray-500">
                            Use predefined customer segments
                          </div>
                        </div>
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200">
                <button
                  disabled
                  className={`px-4 py-2 border border-gray-300 text-gray-400 ${tw.rounded} cursor-not-allowed`}
                >
                  Previous
                </button>
                <div className="flex space-x-3">
                  <button
                    onClick={() => setShowCreateModal(false)}
                    className={`px-4 py-2 border border-gray-300 text-gray-700 ${tw.rounded} text-sm font-medium hover:bg-gray-50 transition-colors`}
                  >
                    Cancel
                  </button>
                  <button
                    className={`px-4 py-2 ${tw.primaryAction} ${tw.rounded} text-sm font-medium hover:opacity-90 transition-colors`}
                    style={{ backgroundColor: color.primary.action }}
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
