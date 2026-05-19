import { useState, useEffect, useCallback } from "react";
import { Edit, Trash2, Plus, Loader2, Power, PowerOff } from "lucide-react";
import SearchInput from "../../../shared/components/ui/SearchInput";
import { color, tw } from "../../../shared/utils/utils";
import LoadingSpinner from "../../../shared/components/ui/LoadingSpinner";
import Pagination from "../../../shared/components/ui/Pagination";
import { useToast } from "../../../contexts/ToastContext";
import { useConfirm } from "../../../contexts/ConfirmContext";
import { useAuth } from "../../../contexts/AuthContext";
import { useLanguage } from "../../../contexts/LanguageContext";
import { roleService, Role } from "../../roles/services/roleService";
import RolesModal from "../components/RolesModal";
import BackButton from "../../../shared/components/ui/BackButton";

export default function TeamRolesPage() {
  const { success: showSuccess, error: showError } = useToast();
  const { confirm } = useConfirm();
  const { t } = useLanguage();
  const { user } = useAuth();

  const [roles, setRoles] = useState<Role[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [toggling, setToggling] = useState<number | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);

  const loadRoles = useCallback(async () => {
    setIsLoading(true);
    try {
      const { roles: data } = await roleService.listRoles({
        limit: 100,
        offset: 0,
      });
      setRoles(data || []);
    } catch (error) {
      showError("Failed to load roles");
      console.error(error);
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
      showError(
        "Failed to update role",
        error instanceof Error ? error.message : ""
      );
    } finally {
      setToggling(null);
    }
  };

  const handleDelete = async (role: Role) => {
    const confirmed = await confirm({
      title: "Delete Role",
      message: `Are you sure you want to delete "${role.name}"? This action cannot be undone.`,
      type: "danger",
      confirmText: "Delete",
      cancelText: "Cancel",
    });

    if (!confirmed) return;

    setDeleting(role.id);
    try {
      const userId = user?.user_id || 0;
      await roleService.deleteRole(role.id, { userId });
      setRoles((prev) => prev.filter((r) => r.id !== role.id));
      showSuccess("Role deleted successfully");
    } catch (error) {
      showError("Failed to delete role", error instanceof Error ? error.message : "");
    } finally {
      setDeleting(null);
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

  const startIndex = (currentPage - 1) * pageSize;
  const paginatedRoles = filteredRoles.slice(startIndex, startIndex + pageSize);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <BackButton
            fallbackTo="/dashboard"
            showBreadcrumb={true}
            parentLabel="Administration"
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
          onChange={(value) => {
            setSearchTerm(value);
            setCurrentPage(1);
          }}
        />
      </div>

      <div
        className={`${tw.rounded} border overflow-hidden`}
        style={{ borderColor: color.border.default }}
      >
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner variant="modern" size="lg" color="primary" className="mr-3" />
            <span className={`${tw.textSecondary}`}>Loading roles...</span>
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
          <div className="overflow-x-auto">
            <table
              className="w-full min-w-[720px]"
              style={{ borderCollapse: "separate", borderSpacing: "0 8px" }}
            >
              <thead>
                <tr>
                  <th
                    className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider"
                    style={{
                      color: color.surface.tableHeaderText,
                      backgroundColor: color.surface.tableHeader,
                      borderTopLeftRadius: "0.375rem",
                    }}
                  >
                    Name
                  </th>
                  <th
                    className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider"
                    style={{
                      color: color.surface.tableHeaderText,
                      backgroundColor: color.surface.tableHeader,
                    }}
                  >
                    Code
                  </th>
                  <th
                    className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider"
                    style={{
                      color: color.surface.tableHeaderText,
                      backgroundColor: color.surface.tableHeader,
                    }}
                  >
                    Description
                  </th>
                  <th
                    className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider"
                    style={{
                      color: color.surface.tableHeaderText,
                      backgroundColor: color.surface.tableHeader,
                    }}
                  >
                    Status
                  </th>
                  <th
                    className="px-6 py-4 text-center text-xs font-medium uppercase tracking-wider"
                    style={{
                      color: color.surface.tableHeaderText,
                      backgroundColor: color.surface.tableHeader,
                      borderTopRightRadius: "0.375rem",
                    }}
                  >
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {paginatedRoles.map((role) => (
                  <tr key={role.id} className="transition-colors">
                    <td
                      className="px-6 py-4"
                      style={{
                        backgroundColor: color.surface.tablebodybg,
                        borderTopLeftRadius: "0.375rem",
                        borderBottomLeftRadius: "0.375rem",
                      }}
                    >
                      <div className={`text-sm ${tw.textPrimary}`}>
                        {role.name}
                      </div>
                    </td>
                    <td
                      className="px-6 py-4"
                      style={{ backgroundColor: color.surface.tablebodybg }}
                    >
                      <div className={`text-sm ${tw.textSecondary} font-mono`}>
                        {role.code || "-"}
                      </div>
                    </td>
                    <td
                      className="px-6 py-4"
                      style={{ backgroundColor: color.surface.tablebodybg }}
                    >
                      <div className={`text-sm ${tw.textSecondary} max-w-md`}>
                        {role.description || "-"}
                      </div>
                    </td>
                    <td
                      className="px-6 py-4"
                      style={{ backgroundColor: color.surface.tablebodybg }}
                    >
                      <div className={`text-sm ${tw.textSecondary}`}>
                        {role.is_active ? "Active" : "Inactive"}
                      </div>
                    </td>
                    <td
                      className="px-6 py-4 text-center"
                      style={{
                        backgroundColor: color.surface.tablebodybg,
                        borderTopRightRadius: "0.375rem",
                        borderBottomRightRadius: "0.375rem",
                      }}
                    >
                      <div className="flex items-center justify-center space-x-2">
                        <button
                          onClick={() => handleOpenEditModal(role)}
                          className={`p-2 ${tw.rounded} transition-colors`}
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
                          onClick={() => handleToggleActive(role)}
                          disabled={toggling === role.id}
                          className={`p-2 ${tw.rounded} transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
                          style={{
                            color: role.is_active ? color.primary.action : "inherit",
                            backgroundColor: "transparent",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = `${color.primary.action}10`;
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = "transparent";
                          }}
                          title={role.is_active ? "Deactivate" : "Activate"}
                        >
                          {toggling === role.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : role.is_active ? (
                            <Power className="w-4 h-4" />
                          ) : (
                            <PowerOff className="w-4 h-4 text-red-600" />
                          )}
                        </button>
                        <button
                          onClick={() => handleDelete(role)}
                          disabled={deleting === role.id}
                          className={`p-2 text-red-600 hover:text-red-700 hover:bg-red-50 ${tw.rounded} transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
                          title="Delete"
                        >
                          {deleting === role.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4 text-red-600" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {!isLoading && filteredRoles.length > 0 && (
        <Pagination
          currentPage={currentPage}
          pageSize={pageSize}
          totalItems={filteredRoles.length}
          onPageChange={setCurrentPage}
        />
      )}

      <RolesModal
        isOpen={showModal}
        onClose={handleModalClose}
        onSubmit={handleModalSubmit}
        editingRole={editingRole}
      />
    </div>
  );
}
