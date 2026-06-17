import { useState, useEffect, useCallback } from "react";
import { Edit, Trash2, Plus, Loader2, Power, PowerOff } from "lucide-react";
import SearchInput from "../../../shared/components/ui/SearchInput";
import { color, tw } from "../../../shared/utils/utils";
import LoadingSpinner from "../../../shared/components/ui/LoadingSpinner";
import Pagination, { DEFAULT_PAGE_SIZE } from "../../../shared/components/ui/Pagination";
import DeleteConfirmModal from "../../../shared/components/ui/DeleteConfirmModal";
import ActivateDeactivateButton from "../../../shared/components/ui/ActivateDeactivateButton";
import { useToast } from "../../../contexts/ToastContext";
import { extractBackendError } from "../../../shared/utils/errorHandler";;;
import { useAuth } from "../../../contexts/AuthContext";
import { useLanguage } from "../../../contexts/LanguageContext";
import { roleService, Role } from "../../roles/services/roleService";
import RolesModal from "../components/RolesModal";
import BackButton from "../../../shared/components/ui/BackButton";
import { useDeleteConfirm } from "../../../shared/hooks/useDeleteConfirm";
import { Table, useTable, type TableColumn } from "../../../shared/components/Table";

export default function TeamRolesPage() {
  const { success: showSuccess, error: showError } = useToast();
  const { t } = useLanguage();
  const { user } = useAuth();

  const [roles, setRoles] = useState<Role[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleToDelete, setRoleToDelete] = useState<Role | null>(null);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [toggling, setToggling] = useState<number | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);

  const { deleteConfirm, openDeleteConfirm, closeDeleteConfirm, handleDelete } = useDeleteConfirm({
    onDelete: async () => {
      await confirmDeleteRole();
    },
    itemLabel: "Role",
  });

  const loadRoles = useCallback(async () => {
    setIsLoading(true);
    try {
      const { roles: data } = await roleService.listRoles({
        limit: 100,
        offset: 0,
      });
      setRoles(data || []);
    } catch (error) {
      showError(extractBackendError(error, "Failed to load roles. Please try again."));
    } finally {
      setIsLoading(false);
    }
  }, [showError]);

  useEffect(() => {
    loadRoles();
  }, [loadRoles]);

  const handleToggleActive = async (role: Role) => {
    const nextStatus = !role.is_active;
    setToggling(role.id);
    try {
      const userId = user?.user_id || 0;
      await roleService.updateRole(role.id, {
        is_active: nextStatus,
        userId,
      });
      setRoles((prev) =>
        prev.map((r) =>
          r.id === role.id ? { ...r, is_active: nextStatus } : r
        )
      );
      showSuccess(
        `Role ${nextStatus ? "activated" : "deactivated"} successfully`
      );
    } catch (error) {
      showError("Failed to update role", extractBackendError(error, "Failed to update role. Please try again."));
    } finally {
      setToggling(null);
    }
  };

  const handleDeleteClick = (role: Role) => {
    setRoleToDelete(role);
    openDeleteConfirm(role.id, role.name);
  };

  const confirmDeleteRole = async () => {
    if (!roleToDelete) return;

    try {
      const userId = user?.user_id || 0;
      await roleService.deleteRole(roleToDelete.id, { userId });
      setRoles((prev) => prev.filter((r) => r.id !== roleToDelete.id));
      showSuccess("Role deleted successfully");
      setRoleToDelete(null);
    } catch (error) {
      showError("Failed to delete role", extractBackendError(error, "Failed to delete role. Please try again."));
    }
  };

  const handleOpenCreateModal = () => {
    setEditingRole(null);
    setShowModal(true);
  };

  const handleOpenEditModal = (role: Role) => {
    setEditingRole(role);
    setShowModal(true);
  };

  const handleModalClose = () => {
    setShowModal(false);
    setEditingRole(null);
  };

  const handleModalSubmit = async () => {
    await loadRoles();
    handleModalClose();
  };

  const filteredRoles = roles.filter(
    (role) =>
      role.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (role.code && role.code.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (role.description && role.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Table columns definition
  const defaultColumns: TableColumn<Role>[] = [
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
      id: "code",
      label: "Code",
      visible: true,
      render: (value) => (
        <div className={`text-sm ${tw.textSecondary} font-mono truncate`} title={value ? String(value) : "-"}>
          {value || "-"}
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
      id: "is_active",
      label: "Status",
      visible: true,
      render: (value) => (
        <span className={`text-sm ${value ? tw.success : tw.textMuted}`}>
          {value ? "Active" : "Inactive"}
        </span>
      ),
    },
    {
      id: "actions",
      label: "Actions",
      visible: true,
      sortable: false,
      render: (value, role) => (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => handleOpenEditModal(role)}
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
          <ActivateDeactivateButton
            isActive={role.is_active}
            onToggle={() => handleToggleActive(role)}
            disabled={toggling === role.id}
            isLoading={toggling === role.id}
            title={role.is_active ? "Deactivate" : "Activate"}
          />
          <button
            onClick={() => handleDeleteClick(role)}
            disabled={deleting === role.id}
            className={`p-2 text-red-600 hover:text-red-700 hover:bg-red-50 ${tw.rounded} transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
            title="Delete"
          >
            {deleting === role.id ? (
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
  } = useTable({
    tableId: "team-roles-table",
    defaultColumns,
    defaultPageSize: DEFAULT_PAGE_SIZE,
    persistToLocalStorage: true,
  });

  // Reset page when search changes
  useEffect(() => {
    tableHandlePageChange(1);
  }, [searchTerm, tableHandlePageChange]);

  const startIndex = (tableCurrentPage - 1) * tablePageSize;
  const paginatedRoles = filteredRoles.slice(startIndex, startIndex + tablePageSize);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <BackButton
           
            showBreadcrumb={true}
           
            currentLabel="Roles"
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
          Define and manage team roles and role assignments
        </p>
      </div>

      <div className="my-5">
        <SearchInput
          placeholder="Search roles by name, code, or description..."
          value={searchTerm}
          onChange={setSearchTerm}
        />
      </div>

      <div className={`${tw.rounded} overflow-hidden`}>
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner />
          </div>
        ) : filteredRoles.length === 0 ? (
          <div className="text-center py-12">
            <h3 className={`text-lg font-medium ${tw.textPrimary} mb-2`}>
              {searchTerm ? "No roles found" : "No roles yet"}
            </h3>
            <p className={`${tw.textMuted} mb-6`}>
              {searchTerm ? "Try adjusting your search terms" : "Create your first role"}
            </p>
            {!searchTerm && (
              <button
                onClick={handleOpenCreateModal}
                className={`inline-flex items-center px-4 py-2 ${tw.rounded} text-sm font-medium text-white transition-colors hover:opacity-90 mx-auto`}
                style={{ backgroundColor: color.primary.action }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Role
              </button>
            )}
          </div>
        ) : (
          <>
            <Table<Role>
              columns={columns}
              data={paginatedRoles}
              totalItems={filteredRoles.length}
              currentPage={tableCurrentPage}
              pageSize={tablePageSize}
              isLoading={isLoading}
              onPageChange={tableHandlePageChange}
                onPageSizeChange={tableHandlePageSizeChange}
              onSort={handleSort}
              sortConfigs={sortConfigs}
              style={{
                headerBackground: color.surface.tableHeader,
                headerTextColor: color.surface.tableHeaderText,
                rowBackground: color.surface.tablebodybg,
                rowSpacing: "0 8px",
              }}
            />

            {!isLoading && paginatedRoles.length > 0 && filteredRoles.length > 0 && (
              <div className="mt-4">
                <Pagination
                  currentPage={tableCurrentPage}
                  pageSize={tablePageSize}
                  totalItems={filteredRoles.length}
                  onPageChange={tableHandlePageChange}
                onPageSizeChange={tableHandlePageSizeChange}
                />
              </div>
            )}
          </>
        )}
      </div>

      <DeleteConfirmModal
        isOpen={deleteConfirm.id !== null}
        onClose={() => {
          closeDeleteConfirm();
          setRoleToDelete(null);
        }}
        onConfirm={handleDelete}
        title="Delete Role"
        description="This action cannot be undone."
        itemName={deleteConfirm.itemName || ""}
        isLoading={deleting}
      />

      <RolesModal
        isOpen={showModal}
        onClose={handleModalClose}
        onSubmit={handleModalSubmit}
        editingRole={editingRole}
      />
    </div>
  );
}
