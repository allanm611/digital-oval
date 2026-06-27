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
  Clock,
} from "lucide-react";
import SearchInput from "../../../shared/components/ui/SearchInput";
import HeadlessSelect from "../../../shared/components/ui/HeadlessSelect";
import BackButton from "../../../shared/components/ui/BackButton";
import { color, tw, button } from "../../../shared/utils/utils";
import LoadingSpinner from "../../../shared/components/ui/LoadingSpinner";
import Pagination, { getInitialPageSize } from "../../../shared/components/ui/Pagination";
import { useToast } from "../../../contexts/ToastContext";
import { useLanguage } from "../../../contexts/LanguageContext";
import { extractBackendError } from "../../../shared/utils/errorHandler";;;
import { controlGroupService } from "../services/controlGroupService";
import DeleteConfirmModal from "../../../shared/components/ui/DeleteConfirmModal";
import type { ControlGroupApiModel, ControlGroupStatistics } from "../types/controlGroup";

export default function ControlGroupsPage() {
  const navigate = useNavigate();
  const { success: showSuccess, error: showError } = useToast();
  const { t } = useLanguage();
  const [controlGroups, setControlGroups] = useState<ControlGroupApiModel[]>([]);
  const [statistics, setStatistics] = useState<ControlGroupStatistics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const statusFilterOptions = [
    { value: "all", label: t.controlGroups.allStatus },
    { value: "active", label: t.controlGroups.active },
    { value: "inactive", label: t.controlGroups.inactive },
  ];

  const typeFilterOptions = [
    { value: "all", label: t.controlGroups.allTypes },
    { value: "universal", label: t.controlGroups.universal },
    { value: "standard", label: t.controlGroups.standard },
  ];

  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [groupToDelete, setGroupToDelete] = useState<{ id: number; name: string } | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isRunningScheduled, setIsRunningScheduled] = useState(false);
  const [pageSize, setPageSize] = useState(getInitialPageSize());

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const apiOffset = (page - 1) * pageSize;
      const apiLimit = pageSize;

      // Check if any filters are applied
      const hasFilters =
        searchTerm.trim() ||
        (statusFilter !== "all") ||
        (typeFilter !== "all");

      // Build API parameters
      const apiParams: Record<string, any> = {
        limit: apiLimit,
        offset: apiOffset,
      };

      if (searchTerm.trim()) {
        apiParams.search = searchTerm.trim();
      }

      if (statusFilter !== "all") {
        apiParams.isActive = statusFilter === "active";
      }

      if (typeFilter !== "all") {
        apiParams.kind = typeFilter;
      }

      const [groupsResponse, statsResponse] = await Promise.all([
        controlGroupService.listControlGroups(apiParams),
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
  }, [page, pageSize, searchTerm, statusFilter, typeFilter, showError]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleDeleteClick = (id: number, name: string) => {
    setGroupToDelete({ id, name });
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!groupToDelete) return;

    setIsDeleting(groupToDelete.id);
    try {
      await controlGroupService.deleteControlGroup(groupToDelete.id);
      setControlGroups(controlGroups.filter((g) => g.id !== groupToDelete.id));
      setTotalCount(Math.max(0, totalCount - 1));
      showSuccess(t.controlGroups.deleteSuccess);
      setShowDeleteModal(false);
      setGroupToDelete(null);
    } catch (error) {
      showError(extractBackendError(error, "Failed to delete control group. Please try again."));
      console.error(error);
    } finally {
      setIsDeleting(null);
    }
  };

  const handleRunScheduled = async () => {
    setIsRunningScheduled(true);
    try {
      const result = await controlGroupService.runScheduled();
      showSuccess(t.controlGroups.updateSuccess);
      // Reload data to reflect any changes
      loadData();
    } catch (error) {
      showError(extractBackendError(error, "Failed to run scheduled control groups. Please try again."));
      console.error(error);
    } finally {
      setIsRunningScheduled(false);
    }
  };

  // Reset to page 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [searchTerm, statusFilter, typeFilter]);

  const getCustomerBaseLabel = (base: string) => {
    switch (base) {
      case "active_subscribers":
        return t.routes.customerBase.activeSubscribers;
      case "all_customers":
        return t.routes.customerBase.allCustomers;
      case "saved_segment":
        return t.routes.customerBase.customConditions;
      default:
        return base;
    }
  };

  const getRecurrenceLabel = (recurrence: string | null) => {
    switch (recurrence) {
      case "one_time":
        return t.routes.recurrence.oneTime;
      case "daily":
        return t.routes.recurrence.daily;
      case "weekly":
        return t.routes.recurrence.weekly;
      case "monthly":
        return t.routes.recurrence.monthly;
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

            currentLabel={t.controlGroups.title}
          />
          <div className="flex gap-3">
            <button
              onClick={handleRunScheduled}
              disabled={isRunningScheduled}
              className={`inline-flex items-center px-4 py-2 ${tw.rounded} text-sm font-medium text-white transition-colors hover:opacity-90 w-auto disabled:opacity-50 disabled:cursor-not-allowed`}
              style={{ backgroundColor: color.primary.accent }}
            >
              {isRunningScheduled ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Clock className="h-4 w-4 mr-2" />
              )}
              <span>{isRunningScheduled ? t.controlGroups.running : t.controlGroups.runScheduled}</span>
            </button>
            <button
              onClick={() => navigate("/dashboard/control-groups/create")}
              className={`inline-flex items-center px-4 py-2 ${tw.rounded} text-sm font-medium text-white transition-colors hover:opacity-90 w-auto`}
              style={{ backgroundColor: color.primary.action }}
            >
              <Plus className="h-4 w-4 mr-2" />
              <span>{t.controlGroups.createControlGroup}</span>
            </button>
          </div>
        </div>
        <p className="text-gray-600 text-sm">{t.controlGroups.subtitle}</p>
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
            <p className="text-sm font-medium text-gray-600">{t.controlGroups.totalGroups}</p>
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
            <p className="text-sm font-medium text-gray-600">{t.controlGroups.activeGroups}</p>
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
            <p className="text-sm font-medium text-gray-600">{t.controlGroups.totalMembers}</p>
          </div>
          <p className="mt-2 text-3xl font-bold text-gray-900">
            {isLoading ? "-" : (statistics?.total_members || 0).toLocaleString()}
          </p>
        </div>
      </div>

      <div>
        <div className="flex flex-col lg:flex-row lg:items-center space-y-4 lg:space-y-0 lg:space-x-4">
          <SearchInput
            placeholder={t.controlGroups.searchPlaceholder}
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
              placeholder={t.controlGroups.filterByStatus}
            />
          </div>

          <div className="w-full lg:w-48">
            <HeadlessSelect
              options={typeFilterOptions}
              value={typeFilter}
              onChange={(value: string | number) =>
                setTypeFilter(value as string)
              }
              placeholder={t.controlGroups.filterByType}
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
        ) : controlGroups.length > 0 ? (
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
                      {t.controlGroups.groupName}
                    </th>
                    <th
                      className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider"
                      style={{ color: color.surface.tableHeaderText }}
                    >
                      {t.controlGroups.status}
                    </th>
                    <th
                      className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider"
                      style={{ color: color.surface.tableHeaderText }}
                    >
                      {t.controlGroups.type}
                    </th>
                    <th
                      className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider"
                      style={{ color: color.surface.tableHeaderText }}
                    >
                      {t.controlGroups.percentage}
                    </th>
                    <th
                      className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider"
                      style={{ color: color.surface.tableHeaderText }}
                    >
                      {t.controlGroups.members}
                    </th>
                    <th
                      className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider"
                      style={{ color: color.surface.tableHeaderText }}
                    >
                      {t.controlGroups.customerBase}
                    </th>
                    <th
                      className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider"
                      style={{ color: color.surface.tableHeaderText }}
                    >
                      {t.controlGroups.recurrence}
                    </th>
                    <th
                      className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider"
                      style={{ color: color.surface.tableHeaderText }}
                    >
                      {t.controlGroups.actions}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {controlGroups.map((group) => (
                    <tr key={group.id} className="transition-colors">
                      <td
                        className="px-6 py-4"
                        style={{ backgroundColor: color.surface.tablebodybg }}
                      >
                        <div className={`${tw.tableFirstColumn} text-black`}>
                          {group.name}
                        </div>
                      </td>
                      <td
                        className="px-6 py-4 text-sm font-medium text-black"
                        style={{ backgroundColor: color.surface.tablebodybg }}
                      >
                        {group.is_active ? t.controlGroups.active : t.controlGroups.inactive}
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
                            className={`p-2 icon-edit ${tw.rounded} transition-all duration-200 disabled:opacity-50`}
                            disabled={isDeleting === group.id}
                            title={t.controlGroups.view}
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() =>
                              navigate(
                                `/dashboard/control-groups/${group.id}/edit`
                              )
                            }
                            className={`p-2 icon-edit ${tw.rounded} transition-all duration-200 disabled:opacity-50`}
                            disabled={isDeleting === group.id}
                            title={t.controlGroups.edit}
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteClick(group.id, group.name)}
                            disabled={isDeleting === group.id}
                            className={`p-2 icon-delete transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-80`}
                            title={t.controlGroups.delete}
                          >
                            {isDeleting === group.id ? (
                              <Loader2 className="h-4 w-4 animate-spin text-red-600" />
                            ) : (
                              <Trash2 className="h-4 w-4 " />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {!isLoading && controlGroups.length > 0 && totalCount > 0 && (
              <Pagination
                currentPage={page}
                pageSize={pageSize}
                totalItems={totalCount}
                onPageChange={setPage}
                onPageSizeChange={setPageSize}
              />
            )}
          </>
        ) : (
          <div className="text-center py-12">
            <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {t.controlGroups.noControlGroupsFound}
            </h3>
            <p className="text-gray-500 mb-6">
              {searchTerm
                ? t.controlGroups.tryAdjustingSearch
                : t.controlGroups.noGroups}
            </p>
            <button
              onClick={() => navigate("/dashboard/control-groups/create")}
              className={`inline-flex items-center px-4 py-2 ${tw.rounded} text-sm font-medium transition-colors hover:opacity-90 text-white`}
              style={{ backgroundColor: color.primary.action }}
            >
              <Plus className="h-4 w-4 mr-2" />
              {t.controlGroups.createControlGroup}
            </button>
          </div>
        )}
      </div>

      <DeleteConfirmModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setGroupToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
        title={t.controlGroups.deleteConfirmTitle}
        description={t.controlGroups.deleteConfirmMessage}
        itemName={groupToDelete?.name || ""}
        isLoading={isDeleting === groupToDelete?.id}
      />
    </div>
  );
}
