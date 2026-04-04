import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Shield,
  Plus,
  Search,
  Edit,
  Trash2,
  Users,
  Percent,
  MoreVertical,
} from "lucide-react";
import HeadlessSelect from "../../../shared/components/ui/HeadlessSelect";
import BackButton from "../../../shared/components/ui/BackButton";
import { color, tw } from "../../../shared/utils/utils";
import {
  UniversalControlGroup,
  UNIVERSAL_CONTROL_GROUPS,
} from "../configs/universalControlGroupsConfig";

export default function ControlGroupsPage() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "active" | "inactive" | "expired"
  >("all");

  const statusFilterOptions = [
    { value: "all", label: "All Status" },
    { value: "active", label: "Active" },
    { value: "inactive", label: "Inactive" },
    { value: "expired", label: "Expired" },
  ];

  const controlGroups: UniversalControlGroup[] = UNIVERSAL_CONTROL_GROUPS;

  const filteredGroups = controlGroups.filter((group) => {
    const matchesSearch =
      group.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      group.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || group.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

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
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="space-y-3">
          <BackButton fallbackTo="/dashboard/configuration" />
          <div>
            <p className="text-gray-600 mt-1 text-sm">Control Groups</p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-auto">
          <button
            onClick={() => navigate("/dashboard/control-groups/create")}
            className={`inline-flex items-center px-4 py-2 ${tw.rounded} text-sm font-medium text-white transition-colors hover:opacity-90 w-auto`}
            style={{ backgroundColor: color.primary.action }}
          >
            <Plus className="h-4 w-4 mr-2" />
            <span>Create Control Group</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <div
          className={`bg-white ${tw.rounded} border border-gray-200 p-6 shadow-sm`}
        >
          <div className="flex items-center gap-2">
            <Shield
              className="h-5 w-5"
              style={{ color: color.primary.accent }}
            />
            <p className="text-sm font-medium text-gray-600">Total Groups</p>
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

      <div>
        <div className="flex flex-col lg:flex-row lg:items-center space-y-4 lg:space-y-0 lg:space-x-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search control groups"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full pl-10 pr-4 py-2 border border-gray-300 ${tw.rounded} focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
            />
          </div>

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

      <div
        className={`${tw.rounded} border border-[${color.border.default}] overflow-hidden`}
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
                      <div
                        className={`font-semibold text-sm sm:text-base ${tw.textPrimary}`}
                      >
                        {group.name}
                      </div>
                    </td>
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
                : "Create your first control group to get started"}
            </p>
            <button
              onClick={() => navigate("/dashboard/control-groups/create")}
              className={`inline-flex items-center px-4 py-2 ${tw.primaryAction} ${tw.rounded} text-sm font-medium transition-colors hover:opacity-90`}
              style={{ backgroundColor: color.primary.action }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Control Group
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
