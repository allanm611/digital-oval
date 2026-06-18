import { useState, useEffect, useCallback } from "react";
import { Edit, Trash2, Plus, Loader2 } from "lucide-react";
import SearchInput from "../../../shared/components/ui/SearchInput";
import BackButton from "../../../shared/components/ui/BackButton";
import { color, tw } from "../../../shared/utils/utils";
import LoadingSpinner from "../../../shared/components/ui/LoadingSpinner";
import Pagination, { DEFAULT_PAGE_SIZE } from "../../../shared/components/ui/Pagination";
import DeleteConfirmModal from "../../../shared/components/ui/DeleteConfirmModal";
import { useToast } from "../../../contexts/ToastContext";
import { extractBackendError } from "../../../shared/utils/errorHandler";;;
import { notificationTypeService, NotificationRule } from "../../../shared/services/notificationTypeService";
import { notificationCategoryService } from "../../notifications/services/notificationCategoryService";
import { useLanguage } from "../../../contexts/LanguageContext";
import NotificationTypeModal from "../components/NotificationTypeModal";
import { useDeleteConfirm } from "../../../shared/hooks/useDeleteConfirm";
import { Table, useTable, type TableColumn } from "../../../shared/components/Table";

export default function NotificationTypesPage() {
  const { success: showSuccess, error: showError } = useToast();
  const { t } = useLanguage();

  const [notificationRules, setNotificationRules] = useState<NotificationRule[]>([]);
  const [categoryMap, setCategoryMap] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showColumnPicker, setShowColumnPicker] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingRule, setEditingRule] = useState<NotificationRule | null>(null);

  const { deleteConfirm, isDeleting, openDeleteConfirm, closeDeleteConfirm, handleDelete: confirmDeleteRule } = useDeleteConfirm({
    onDelete: async (id) => {
      const numId = typeof id === "string" ? parseInt(id) : id;
      setNotificationRules((prev) => prev.filter((r) => r.id !== numId));
    },
    itemLabel: "Notification Type",
  });

  const loadNotificationRules = useCallback(async () => {
    setIsLoading(true);
    try {
      const [rules, categories] = await Promise.all([
        notificationTypeService.getAll(),
        notificationCategoryService.getNotificationCategories(),
      ]);
      setNotificationRules(rules || []);

      const map: Record<string, string> = {};
      (Array.isArray(categories) ? categories : []).forEach((cat: any) => {
        if (cat.id) {
          map[String(cat.id)] = cat.name || "";
        }
      });
      setCategoryMap(map);
    } catch (error) {
      showError(extractBackendError(error, "Failed to load notification types. Please try again."));
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }, [showError]);

  useEffect(() => {
    loadNotificationRules();
  }, [loadNotificationRules]);

  const handleDeleteClick = (rule: NotificationRule) => {
    openDeleteConfirm(rule.id, rule.name);
  };

  const handleOpenCreateModal = () => {
    setEditingRule(null);
    setShowModal(true);
  };

  const handleOpenEditModal = (rule: NotificationRule) => {
    setEditingRule(rule);
    setShowModal(true);
  };

  const handleModalClose = () => {
    setShowModal(false);
    setEditingRule(null);
  };

  const handleModalSubmit = async () => {
    await loadNotificationRules();
    handleModalClose();
  };

  const filteredRules = notificationRules.filter(
    (rule) =>
      rule.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (rule.description && rule.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
      rule.table_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rule.action_type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Table columns definition
  const defaultColumns: TableColumn<NotificationRule>[] = [
    {
      id: "name",
      label: "Name",
      visible: true,
      render: (value) => (
        <div className={`${tw.tableFirstColumn} ${tw.textPrimary} truncate`} title={value as string}>
          {value}
        </div>
      ),
    },
    {
      id: "table_name",
      label: "Table",
      visible: true,
      render: (value) => (
        <div className={`text-sm ${tw.textSecondary} truncate`} title={value as string}>
          {value}
        </div>
      ),
    },
    {
      id: "action_type",
      label: "Action Type",
      visible: true,
      render: (value) => (
        <div className={`text-sm ${tw.textSecondary} truncate`} title={value as string}>
          {value}
        </div>
      ),
    },
    {
      id: "category_id",
      label: "Category",
      visible: true,
      render: (value, rule) => (
        <div className={`text-sm ${tw.textSecondary} truncate`} title={rule.category_id ? categoryMap[String(rule.category_id)] || "-" : "-"}>
          {rule.category_id ? categoryMap[String(rule.category_id)] || "-" : "-"}
        </div>
      ),
    },
    {
      id: "description",
      label: "Description",
      visible: true,
      render: (value) => (
        <div className={`text-sm ${tw.textSecondary} max-w-md truncate`} title={value ? String(value) : "-"}>
          {value || "-"}
        </div>
      ),
    },
    {
      id: "actions",
      label: "Actions",
      visible: true,
      sortable: false,
      render: (value, rule) => (
        <div className="flex items-center justify-center space-x-2">
          <button
            onClick={() => handleOpenEditModal(rule)}
            className={`p-2 icon-delete ${tw.rounded} transition-colors`}
            style={{
              color: color.primary.action,
              backgroundColor: "transparent",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = `${color.primary.action}10`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "transparent";
            }}
            title="Edit"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleDeleteClick(rule)}
            disabled={isDeleting && deleteConfirm.id === rule.id}
            className={`p-2 text-red-600 hover:text-red-700 hover:bg-red-50 ${tw.rounded} transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
            title="Delete"
          >
            {isDeleting && deleteConfirm.id === rule.id ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Trash2 className="w-4 h-4" />
            )}
          </button>
        </div>
      ),
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
  } = useTable({
    tableId: "notification-types-table",
    defaultColumns,
    defaultPageSize: DEFAULT_PAGE_SIZE,
    persistToLocalStorage: true,
  });

  // Handle pagination slicing
  const paginatedRules = filteredRules.slice(
    (tableCurrentPage - 1) * tablePageSize,
    tableCurrentPage * tablePageSize
  );

  // Reset to page 1 when search changes
  useEffect(() => {
    tableHandlePageChange(1);
  }, [searchTerm, tableHandlePageChange]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <BackButton
           
            showBreadcrumb={true}
           
            currentLabel="Notification Types"
          />
          <button
            onClick={handleOpenCreateModal}
            className={`inline-flex items-center px-4 py-2 ${tw.rounded} text-sm font-medium text-white transition-colors hover:opacity-90`}
            style={{ backgroundColor: color.primary.action }}
          >
            <Plus className="h-4 w-4 mr-2" />
            Create
          </button>
        </div>
        <p className={`text-sm ${tw.textSecondary}`}>
          Manage notification rules and message templates for system events
        </p>
      </div>

      <div className="my-5">
        <SearchInput
          placeholder="Search notification types by name, table, action, or description..."
          value={searchTerm}
          onChange={(value) => setSearchTerm(value)}
        />
      </div>

      <div className={`${tw.rounded} overflow-hidden`}>
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner variant="modern" size="lg" color="primary" className="mr-3" />
            <span className={`${tw.textSecondary}`}>Loading notification types...</span>
          </div>
        ) : filteredRules.length === 0 ? (
          <div className="text-center py-12">
            <h3 className={`text-lg font-medium ${tw.textPrimary} mb-2`}>
              {searchTerm ? "No notification types found" : "No notification types yet"}
            </h3>
            <p className={`${tw.textMuted} mb-6`}>
              {searchTerm ? "Try adjusting your search terms" : "Create your first notification type"}
            </p>
            {!searchTerm && (
              <button
                onClick={handleOpenCreateModal}
                className={`inline-flex items-center px-4 py-2 ${tw.rounded} text-sm font-medium text-white transition-colors hover:opacity-90 mx-auto`}
                style={{ backgroundColor: color.primary.action }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Notification Type
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Table */}
            <Table<NotificationRule>
              columns={columns}
              data={paginatedRules}
              totalItems={filteredRules.length}
              currentPage={tableCurrentPage}
              pageSize={tablePageSize}
              isLoading={isLoading}
              onPageChange={tableHandlePageChange}
              onSort={handleSort}
              sortConfigs={sortConfigs}
              onHideColumn={toggleColumn}
              onManageColumnsClick={() => setShowColumnPicker(true)}
              style={{
                headerBackground: color.surface.tableHeader,
                headerTextColor: color.surface.tableHeaderText,
                rowBackground: color.surface.tablebodybg,
                rowSpacing: "0 8px",
              }}
            />

            {/* Pagination */}
            {!isLoading && paginatedRules.length > 0 && filteredRules.length > 0 && (
              <Pagination
                currentPage={tableCurrentPage}
                pageSize={tablePageSize}
                totalItems={filteredRules.length}
                onPageChange={tableHandlePageChange}
                onPageSizeChange={tableHandlePageSizeChange}
              />
            )}
          </>
        )}
      </div>

      <DeleteConfirmModal
        isOpen={deleteConfirm.id !== null}
        onClose={closeDeleteConfirm}
        onConfirm={async () => {
          try {
            await notificationTypeService.delete(deleteConfirm.id as number);
            await confirmDeleteRule(deleteConfirm.id);
            showSuccess("Notification type deleted successfully");
          } catch (error) {
            showError("Failed to delete notification type", extractBackendError(error, "Failed to delete notification type. Please try again."));
          }
        }}
        title="Delete Notification Type"
        description="This may affect active notifications."
        itemName={deleteConfirm.itemName || ""}
        isLoading={isDeleting}
      />

      <NotificationTypeModal
        isOpen={showModal}
        onClose={handleModalClose}
        onSubmit={handleModalSubmit}
        editingRule={editingRule}
      />
    </div>
  );
}
