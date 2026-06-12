import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Shield,
  Plus,
  Edit,
  Trash2,
  Users,
  Percent,
  MoreVertical,
  Loader2,
  Eye,
} from "lucide-react";
import SearchInput from "../../../shared/components/ui/SearchInput";
import HeadlessSelect from "../../../shared/components/ui/HeadlessSelect";
import BackButton from "../../../shared/components/ui/BackButton";
import { color, tw, button } from "../../../shared/utils/utils";
import LoadingSpinner from "../../../shared/components/ui/LoadingSpinner";
import Pagination from "../../../shared/components/ui/Pagination";
import { useToast } from "../../../contexts/ToastContext";
import { extractBackendError } from "../../../shared/utils/errorHandler";;;
import { controlGroupService } from "../services/controlGroupService";
import DeleteConfirmModal from "../../../shared/components/ui/DeleteConfirmModal";
import type { ControlGroupApiModel, ControlGroupStatistics } from "../types/controlGroup";
import { useDeleteConfirm } from "../../../shared/hooks/useDeleteConfirm";

export default function ControlGroupsPage() {
  const navigate = useNavigate();
  const { success: showSuccess, error: showError } = useToast();
  const [controlGroups, setControlGroups] = useState<ControlGroupApiModel[]>([]);
  const [statistics, setStatistics] = useState<ControlGroupStatistics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);

  const statusFilterOptions = [
    { value: "all", label: "All Status" },
    { value: "active", label: "Active" },
    { value: "inactive", label: "Inactive" },
  ];

  const typeFilterOptions = [
    { value: "all", label: "All Types" },
    { value: "universal", label: "Universal" },
    { value: "standard", label: "Standard" },
  ];

  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [groupToDelete, setGroupToDelete] = useState<{ id: number; name: string } | null>(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [groupsResponse, statsResponse] = await Promise.all([
        controlGroupService.listControlGroups({
          limit: pageSize,
          offset: (page - 1) * pageSize,
        }),
        controlGroupService.getStatistics(),
      ]);

      setControlGroups(groupsResponse.control_groups || []);
      setTotalCount(groupsResponse.total_count || 0);
      setStatistics(statsResponse);
    } catch (error) {
      showError(extractBackendError(error, "Failed to load control groups. Please try again."));
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }, [page, pageSize, showError]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleDeleteClick = (id: number, name: string) => {
    setGroupToDelete({ id, name });
    openDeleteConfirm(item?.id || 0, item?.name || "");
  };

  const handleConfirmDelete = async () => {
    if (!groupToDelete) return;

    setIsDeleting(groupToDelete.id);
    try {
      await controlGroupService.deleteControlGroup(groupToDelete.id);
      setControlGroups(controlGroups.filter((g) => g.id !== groupToDelete.id));
      setTotalCount(Math.max(0, totalCount - 1));
      showSuccess("Control group deleted successfully");
      closeDeleteConfirm();
      setGroupToDelete(null);
    } catch (error) {
      showError(extractBackendError(error, "Failed to delete control group. Please try again."));
      console.error(error);
    } finally {
      setIsDeleting(null);
    }
  };

  const filteredGroups = controlGroups.filter((group) => {
    const matchesSearch =
      group.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (group.description?.toLowerCase() || "").includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && group.is_active) ||
      (statusFilter === "inactive" && !group.is_active);
    const matchesType =
      typeFilter === "all" ||
      (typeFilter === "universal" && group.kind === "universal") ||
      (typeFilter === "standard" && group.kind === "standard");
    return matchesSearch && matchesStatus && matchesType;
  });

  const getCustomerBaseLabel = (base: string) => {
    switch (base) {
      case "active_subscribers":
        return "Active Subscribers";
      case "all_customers":
        return "All Customers";
      case "saved_segment":
        return "Custom Conditions";
      default:
        return base;
    }
  };

  const getRecurrenceLabel = (recurrence: string | null) => {
    switch (recurrence) {
      case "one_time":
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <BackButton
           
            showBreadcrumb={true}
           
            currentLabel="Universal Control Groups"
          />
          <button
            onClick={() => navigate("/dashboard/control-groups/create")}
            className={`inline-flex items-center px-4 py-2 ${tw.rounded} text-sm font-medium text-white transition-colors hover:opacity-90 w-auto`}
            style={{ backgroundColor: color.primary.action }}
          >
            <Plus className="h-4 w-4 mr-2" />
            <span>Create Control Group</span>
          </button>
        </div>
        <p className="text-gray-600 text-sm">Create and manage control groups to measure campaign effectiveness and customer behavior</p>
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
            {isLoading ? "-" : statistics?.total_control_groups || 0}
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
            {isLoading ? "-" : statistics?.active_groups || 0}
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
            <p className="text-sm font-medium text-gray-600">Total Members</p>
          </div>
          <p className="mt-2 text-3xl font-bold text-gray-900">
            {isLoading ? "-" : (statistics?.total_members || 0).toLocaleString()}
          </p>
        </div>
      </div>

      <div>
        <div className="flex flex-col lg:flex-row lg:items-center space-y-4 lg:space-y-0 lg:space-x-4">
          <SearchInput
            placeholder="Search control groups"
            value={searchTerm}
            onChange={setSearchTerm}
          />

          <div className="w-full lg:w-48">
            <HeadlessSelect
              options={statusFilterOptions}
              value={statusFilter}
              onChange={(value: string | number) =>
                setStatusFilter(value as string)
              }
              placeholder="Filter by status"
            />
          </div>

          <div className="w-full lg:w-48">
            <HeadlessSelect
              options={typeFilterOptions}
              value={typeFilter}
              onChange={(value: string | number) =>
                setTypeFilter(value as string)
              }
              placeholder="Filter by type"
            />
          </div>
        </div>
      </div>

      <div
        className={`${tw.rounded} border border-gray-200 overflow-hidden`}
      >
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <LoadingSpinner variant="modern" size="lg" color="primary" />
          </div>
        ) : filteredGroups.length > 0 ? (
          <>
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
                      Type
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
                      Members
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
                        <div className="font-semibold text-sm sm:text-base text-black">
                          {group.name}
                        </div>
                      </td>
                      <td
                        className="px-6 py-4 text-sm font-medium text-black"
                        style={{ backgroundColor: color.surface.tablebodybg }}
                      >
                        {group.is_active ? "Active" : "Inactive"}
                      </td>
                      <td
                        className="px-6 py-4 text-sm text-black"
                        style={{ backgroundColor: color.surface.tablebodybg }}
                      >
                        <span className="capitalize">{group.kind || "standard"}</span>
                      </td>
                      <td
                        className="px-6 py-4 text-sm text-black"
                        style={{ backgroundColor: color.surface.tablebodybg }}
                      >
                        {group.percentage || "-"}%
                      </td>
                      <td
                        className="px-6 py-4 text-sm text-black"
                        style={{ backgroundColor: color.surface.tablebodybg }}
                      >
                        {(group.member_count || 0).toLocaleString()}
                      </td>
                      <td
                        className="px-6 py-4 text-sm text-black"
                        style={{ backgroundColor: color.surface.tablebodybg }}
                      >
                        {getCustomerBaseLabel(
                          group.customer_source_type || "manual"
                        )}
                      </td>
                      <td
                        className="px-6 py-4 text-sm text-black"
                        style={{ backgroundColor: color.surface.tablebodybg }}
                      >
                        {getRecurrenceLabel(group.recurrence_pattern)}
                      </td>
                      <td
                        className="px-6 py-4 text-sm font-medium"
                        style={{ backgroundColor: color.surface.tablebodybg }}
                      >
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() =>
                              navigate(
                                `/dashboard/control-groups/${group.id}`
                              )
                            }
                            className={`p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 ${tw.rounded} transition-all duration-200 disabled:opacity-50`}
                            disabled={isDeleting === group.id}
                            title="View"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() =>
                              navigate(
                                `/dashboard/control-groups/${group.id}/edit`
                              )
                            }
                            className={`p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 ${tw.rounded} transition-all duration-200 disabled:opacity-50`}
                            disabled={isDeleting === group.id}
                            title="Edit"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteClick(group.id, group.name)}
                            disabled={isDeleting === group.id}
                            className={`p-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-80`}
                            title="Delete"
                          >
                            {isDeleting === group.id ? (
                              <Loader2 className="h-4 w-4 animate-spin text-red-600" />
                            ) : (
                              <Trash2 className="h-4 w-4 text-red-600" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {totalCount > pageSize && (
              <div className="px-6 py-4 border-t border-gray-200">
                <Pagination
                  currentPage={page}
                  pageSize={pageSize}
                  totalItems={totalCount}
                  onPageChange={setPage}
                />
              </div>
            )}
          </>
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
              className={`inline-flex items-center px-4 py-2 ${tw.rounded} text-sm font-medium transition-colors hover:opacity-90 text-white`}
              style={{ backgroundColor: color.primary.action }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Control Group
            </button>
          </div>
        )}
      </div>

      <DeleteConfirmModal
        isOpen={deleteConfirm.id !== null}
        onClose={() => {
          closeDeleteConfirm();
          setGroupToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
        title="Delete Control Group"
        description="This action cannot be undone. All members in this control group will be unassigned."
        itemName={groupToDelete?.name || ""}
        isLoading={isDeleting === groupToDelete?.id}
      />
    </div>
  );
}
