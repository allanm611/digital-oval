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
import Pagination, { DEFAULT_PAGE_SIZE, getInitialPageSize } from "../../../shared/components/ui/Pagination";
import { useToast } from "../../../contexts/ToastContext";
import { useLanguage } from "../../../contexts/LanguageContext";
import { extractBackendError } from "../../../shared/utils/errorHandler";;;
import { controlGroupService } from "../services/controlGroupService";
import DeleteConfirmModal from "../../../shared/components/ui/DeleteConfirmModal";
import type { ControlGroupApiModel, ControlGroupStatistics } from "../types/controlGroup";
import { Table, useTable, type TableColumn } from "../../../shared/components/Table";
import { ColumnPickerModal } from "../../../shared/components/ColumnPickerModal";
import { PermissionGate } from "../../auth/components/PermissionGate";

export default function ControlGroupsPage() {
  const navigate = useNavigate();
  const { success: showSuccess, error: showError } = useToast();
  const { t } = useLanguage();
  const [controlGroups, setControlGroups] = useState<ControlGroupApiModel[]>([]);
  const [statistics, setStatistics] = useState<ControlGroupStatistics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [totalCount, setTotalCount] = useState(0);
  const [showColumnPicker, setShowColumnPicker] = useState(false);

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

  const defaultColumns: TableColumn<ControlGroupApiModel>[] = [
    {
      id: "name",
      label: t.controlGroups.groupName,
      visible: true,
      sortable: true,
      filterConfig: { type: "text" },
    },
    {
      id: "is_active",
      label: t.controlGroups.status,
      visible: true,
      sortable: true,
      filterConfig: { type: "select", options: ["true", "false"] },
    },
    {
      id: "kind",
      label: t.controlGroups.type,
      visible: true,
      sortable: true,
      filterConfig: { type: "select", options: ["universal", "standard"] },
    },
    {
      id: "percentage",
      label: t.controlGroups.percentage,
      visible: true,
      sortable: true,
      filterConfig: { type: "number" },
    },
    {
      id: "member_count",
      label: t.controlGroups.members,
      visible: true,
      sortable: true,
      filterConfig: { type: "number" },
    },
    {
      id: "customer_source_type",
      label: t.controlGroups.customerBase,
      visible: true,
      sortable: true,
    },
    {
      id: "recurrence_pattern",
      label: t.controlGroups.recurrence,
      visible: true,
      sortable: true,
    },
    {
      id: "actions",
      label: t.controlGroups.actions,
      visible: true,
      sortable: false,
      isActionColumn: true,
    },
  ];

  const {
    columns,
    currentPage: tableCurrentPage,
    pageSize: tablePageSize,
    handlePageChange: tableHandlePageChange,
    handlePageSizeChange: tableHandlePageSizeChange,
    sortConfigs,
    handleSort,
    toggleColumn,
    reorderColumns,
    resetToDefaults,
  } = useTable({
    tableId: "control-groups-table",
    defaultColumns,
    defaultPageSize: DEFAULT_PAGE_SIZE,
    persistToLocalStorage: true,
  });

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const apiOffset = (tableCurrentPage - 1) * tablePageSize;
      const apiLimit = tablePageSize;

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
      showError(t.controlGroups.failedToSaveGroup, extractBackendError(err, t.controlGroups.failedToSaveGroup));
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }, [tableCurrentPage, tablePageSize, searchTerm, statusFilter, typeFilter, showError]);

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
      showError(t.controlGroups.failedToDeleteGroup, extractBackendError(err, t.controlGroups.failedToDeleteGroup));
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
      showError(t.controlGroups.failedToSaveGroup, extractBackendError(err, t.controlGroups.failedToSaveGroup));
      console.error(error);
    } finally {
      setIsRunningScheduled(false);
    }
  };

  // Reset to page 1 when filters change
  useEffect(() => {
    tableHandlePageChange(1);
  }, [searchTerm, statusFilter, typeFilter, tableHandlePageChange]);

  const getCustomerBaseLabel = (base: string) => {
    switch (base) {
      case "active_subscribers":
        return t.controlGroups.activeSubscribers;
      case "all_customers":
        return t.controlGroups.allCustomers;
      case "saved_segment":
        return t.controlGroups.customConditions;
      default:
        return base;
    }
  };

  const getRecurrenceLabel = (recurrence: string | null) => {
    switch (recurrence) {
      case "one_time":
        return t.controlGroups.oneTime;
      case "daily":
        return t.controlGroups.daily;
      case "weekly":
        return t.controlGroups.weekly;
      case "monthly":
        return t.controlGroups.monthly;
      default:
        return recurrence || "-";
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-4">
          <BackButton
            showBreadcrumb={true}
            currentLabel={t.controlGroups.title}
          />
          <div className="flex gap-3">
            <button
              onClick={handleRunScheduled}
              disabled={isRunningScheduled}
              className={`inline-flex items-center px-4 py-2 ${tw.rounded} text-sm font-medium text-white transition-colors hover:opacity-90 w-auto disabled:opacity-50 disabled:cursor-not-allowed`}
              style={{ backgroundColor: "var(--c-primary-action)" }}
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
              style={{ backgroundColor: "var(--c-primary-action)" }}
            >
              <Plus className="h-4 w-4 mr-2" />
              <span>{t.controlGroups.createControlGroup}</span>
            </button>
          </div>
        </div>
        <p className="text-sm text-gray-600">{t.controlGroups.subtitle}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <div
          className={`bg-white ${tw.rounded} border border-gray-200 p-6 shadow-sm`}
        >
          <div className="flex items-center gap-2">
            <Shield
              className="h-5 w-5"
              style={{ color: "var(--c-primary-accent)" }}
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
              style={{ color: "var(--c-primary-accent)" }}
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
              style={{ color: "var(--c-primary-accent)" }}
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

      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <LoadingSpinner variant="modern" size="lg" color="primary" />
        </div>
      ) : (
        <div className={`${tw.rounded} overflow-hidden`}>
          <Table<ControlGroupApiModel>
            columns={columns.filter(col => col.visible).map((col) => {
              if (col.id === "is_active") {
                return {
                  ...col,
                  render: (value) => (
                    <span className="inline-flex items-center font-medium text-gray-900">
                      {value ? t.controlGroups.active : t.controlGroups.inactive}
                    </span>
                  ),
                };
              }
              if (col.id === "kind") {
                return {
                  ...col,
                  render: (value) => (
                    <span className="capitalize">{value || "standard"}</span>
                  ),
                };
              }
              if (col.id === "percentage") {
                return {
                  ...col,
                  render: (value) => (
                    <span>{value || "-"}%</span>
                  ),
                };
              }
              if (col.id === "member_count") {
                return {
                  ...col,
                  render: (value) => (
                    <span>{(value || 0).toLocaleString()}</span>
                  ),
                };
              }
              if (col.id === "customer_source_type") {
                return {
                  ...col,
                  render: (value) => (
                    <span>{getCustomerBaseLabel(value || "manual")}</span>
                  ),
                };
              }
              if (col.id === "recurrence_pattern") {
                return {
                  ...col,
                  render: (value) => (
                    <span>{getRecurrenceLabel(value)}</span>
                  ),
                };
              }
              if (col.id === "actions") {
                return {
                  ...col,
                  headerClassName: "text-right",
                  render: (_, group) => (
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() =>
                          navigate(
                            `/dashboard/control-groups/${group.id}`
                          )
                        }
                        className={`p-0 icon-edit ${tw.rounded} transition-all duration-200 disabled:opacity-50`}
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
                        className={`p-0 icon-edit ${tw.rounded} transition-all duration-200 disabled:opacity-50`}
                        disabled={isDeleting === group.id}
                        title={t.controlGroups.edit}
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteClick(group.id, group.name)}
                        disabled={isDeleting === group.id}
                        className={`p-0 icon-delete transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-80`}
                        title={t.controlGroups.delete}
                      >
                        {isDeleting === group.id ? (
                          <Loader2 className="h-4 w-4 animate-spin text-red-600" />
                        ) : (
                          <Trash2 className="h-4 w-4 " />
                        )}
                      </button>
                    </div>
                  ),
                };
              }
              return col;
            })}
            data={controlGroups}
            totalItems={totalCount}
            currentPage={tableCurrentPage}
            pageSize={tablePageSize}
            onPageChange={tableHandlePageChange}
            onHideColumn={toggleColumn}
            onManageColumnsClick={() => setShowColumnPicker(true)}
            sortConfigs={sortConfigs}
            onSort={handleSort}
            style={{
              headerBackground: color.surface.tableHeader,
              headerTextColor: color.surface.tableHeaderText,
              rowBackground: color.surface.tablebodybg,
              rowSpacing: "0 8px",
            }}
          />

          {/* Pagination */}
          {totalCount > 0 && (
            <div className="mt-4">
              <Pagination
                currentPage={tableCurrentPage}
                pageSize={tablePageSize}
                totalItems={totalCount}
                onPageChange={tableHandlePageChange}
                onPageSizeChange={tableHandlePageSizeChange}
              />
            </div>
          )}
        </div>
      )}

      {controlGroups.length === 0 && !isLoading && (
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
            style={{ backgroundColor: "var(--c-primary-action)" }}
          >
            <Plus className="h-4 w-4 mr-2" />
            {t.controlGroups.createControlGroup}
          </button>
        </div>
      )}

      {/* Column Manager Modal */}
      <ColumnPickerModal
        isOpen={showColumnPicker}
        columns={columns}
        onClose={() => setShowColumnPicker(false)}
        onToggleColumn={toggleColumn}
        onReorderColumns={reorderColumns}
        onResetToDefaults={resetToDefaults}
      />

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
