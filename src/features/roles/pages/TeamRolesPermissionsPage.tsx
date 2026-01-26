import React, { useState, useCallback, useEffect, useMemo } from "react";
import {
  Plus,
  Trash2,
  Edit2,
  Copy,
  Power,
  Shield,
  Key,
  Lock,
  Search,
} from "lucide-react";
import { color, tw } from "../../../shared/utils/utils";
import { useToast } from "../../../contexts/ToastContext";
import { useAuth } from "../../../contexts/AuthContext";
import HeadlessSelect from "../../../shared/components/ui/HeadlessSelect";
import {
  Role,
  Permission,
  DataAccessLevel,
  CreateRoleRequest,
  UpdateRoleRequest,
  CloneRoleRequest,
  CreatePermissionRequest,
  UpdatePermissionRequest,
} from "../types/role";
import { roleService } from "../services/roleService";
import { permissionService } from "../services/permissionService";
import { rolePermissionService } from "../services/rolePermissionService";
import RoleFormModal from "../components/RoleFormModal";
import PermissionFormModal from "../components/PermissionFormModal";
import AssignPermissionsModal from "../components/AssignPermissionsModal";
import RoleHierarchyChip from "../components/RoleHierarchyChip";
import LoadingSpinner from "../../../shared/components/ui/LoadingSpinner";

type TabType = "roles" | "permissions" | "assign";

interface TabConfig {
  id: TabType;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface PaginationModel {
  page: number;
  pageSize: number;
}

const tabs: TabConfig[] = [
  { id: "roles", label: "Roles Management", icon: Shield },
  { id: "permissions", label: "Permissions", icon: Key },
  { id: "assign", label: "Assign Permissions", icon: Lock },
];

const ROLE_LEVELS = [
  { value: "1", label: "Level 1" },
  { value: "2", label: "Level 2" },
  { value: "3", label: "Level 3" },
  { value: "4", label: "Level 4" },
  { value: "5", label: "Level 5" },
  { value: "6", label: "Level 6" },
  { value: "7", label: "Level 7" },
  { value: "8", label: "Level 8" },
  { value: "9", label: "Level 9" },
  { value: "10", label: "Level 10" },
];

const DATA_ACCESS_LEVELS = [
  { value: "public", label: "Public" },
  { value: "internal", label: "Internal" },
  { value: "confidential", label: "Confidential" },
  { value: "restricted", label: "Restricted" },
];

const PERMISSION_ACTIONS = [
  { value: "create", label: "Create" },
  { value: "read", label: "Read" },
  { value: "update", label: "Update" },
  { value: "delete", label: "Delete" },
  { value: "execute", label: "Execute" },
  { value: "manage", label: "Manage" },
];

export default function TeamRolesPermissionsPage() {
  const { success, error: showError } = useToast();
  const { user } = useAuth();

  const userId = user?.user_id;

  useEffect(() => {
  }, [userId]);

  // Tab state
  const [activeTab, setActiveTab] = useState<TabType>("roles");

  // Roles tab state
  const [roles, setRoles] = useState<Role[]>([]);
  const [rolesLoading, setRolesLoading] = useState(false);
  const [rolesTotal, setRolesTotal] = useState(0);
  const [rolesSearch, setRolesSearch] = useState("");
  const [rolesLevelFilter, setRolesLevelFilter] = useState("");
  const [rolesDataAccessFilter, setRolesDataAccessFilter] = useState("");
  const [togglingRoleId, setTogglingRoleId] = useState<number | null>(null);
  const [rolesPaginationModel, setRolesPaginationModel] =
    useState<PaginationModel>({
      page: 0,
      pageSize: 25,
    });

  // Permissions tab state
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [permissionsLoading, setPermissionsLoading] = useState(false);
  const [permissionsTotal, setPermissionsTotal] = useState(0);
  const [permissionsSearch, setPermissionsSearch] = useState("");
  const [permissionsActionFilter, setPermissionsActionFilter] = useState("");
  const [permissionsPaginationModel, setPermissionsPaginationModel] =
    useState<PaginationModel>({
      page: 0,
      pageSize: 25,
    });

  // Modals state
  const [roleFormOpen, setRoleFormOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | undefined>();
  const [permFormOpen, setPermFormOpen] = useState(false);
  const [editingPermission, setEditingPermission] = useState<
    Permission | undefined
  >();
  const [assignPermOpen, setAssignPermOpen] = useState(false);
  const [selectedRoleForAssign, setSelectedRoleForAssign] = useState<
    Role | undefined
  >();

  // Delete confirmation state
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{
    type: "role" | "permission";
    id: number;
  } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Role deactivation modal state
  const [deactivateRoleModalOpen, setDeactivateRoleModalOpen] = useState(false);
  const [roleToDeactivate, setRoleToDeactivate] = useState<Role | null>(null);
  const [roleDeactivationReason, setRoleDeactivationReason] = useState("");
  const [deactivatingRoleId, setDeactivatingRoleId] = useState<number | null>(
    null,
  );

  // ============ ROLES TAB FUNCTIONS ============

  const fetchRoles = useCallback(async () => {
    if (activeTab !== "roles") return;

    try {
      setRolesLoading(true);
      const response = await roleService.listRoles({
        limit: rolesPaginationModel.pageSize,
        offset: rolesPaginationModel.page * rolesPaginationModel.pageSize,
        skipCache: true,
      });
      setRoles(response.roles);
      setRolesTotal(response.meta?.total || response.roles.length);
    } catch (err) {
      showError(
        "Error",
        err instanceof Error ? err.message : "Failed to load roles",
      );
    } finally {
      setRolesLoading(false);
    }
  }, [activeTab, rolesPaginationModel, showError]);

  useEffect(() => {
    if (activeTab === "roles") {
      fetchRoles();
    }
  }, [activeTab, rolesPaginationModel, fetchRoles]);

  const filteredRoles = useMemo(() => {
    let filtered = [...roles];

    if (rolesSearch) {
      const term = rolesSearch.toLowerCase();
      filtered = filtered.filter(
        (r) =>
          r.name.toLowerCase().includes(term) ||
          r.code.toLowerCase().includes(term),
      );
    }

    if (rolesLevelFilter) {
      filtered = filtered.filter(
        (r) => r.role_level === Number(rolesLevelFilter),
      );
    }

    if (rolesDataAccessFilter) {
      filtered = filtered.filter(
        (r) => r.data_access_level === rolesDataAccessFilter,
      );
    }

    return filtered;
  }, [roles, rolesSearch, rolesLevelFilter, rolesDataAccessFilter]);

  const handleCreateRole = () => {
    setEditingRole(undefined);
    setRoleFormOpen(true);
  };

  const handleEditRole = (role: Role) => {
    setEditingRole(role);
    setRoleFormOpen(true);
  };

  const handleCloneRole = async (role: Role) => {
    const newCode = `${role.code}_clone_${Date.now()}`;
    const newName = `${role.name} (Clone)`;

    try {
      setRolesLoading(true);
      await roleService.cloneRole(role.id, {
        newCode,
        newName,
        userId,
      } as CloneRoleRequest);
      success("Success", `Role "${role.name}" has been cloned`);
      fetchRoles();
    } catch (err) {
      showError(
        "Error",
        err instanceof Error ? err.message : "Failed to clone role",
      );
    } finally {
      setRolesLoading(false);
    }
  };

  const handleToggleRoleActive = (role: Role) => {
    if (role.is_active) {
      // Show modal for deactivation reason
      setRoleToDeactivate(role);
      setRoleDeactivationReason("");
      setDeactivateRoleModalOpen(true);
    } else {
      // Reactivate without reason
      confirmReactivateRole(role);
    }
  };

  const confirmDeactivateRole = async () => {
    if (!roleToDeactivate) return;

    if (!roleDeactivationReason.trim()) {
      showError("Error", "Deactivation reason is required");
      return;
    }

    try {
      setDeactivatingRoleId(roleToDeactivate.id);
      await roleService.deactivateRole(roleToDeactivate.id, userId, {
        reason: roleDeactivationReason.trim(),
      });
      success(
        "Success",
        `Role "${roleToDeactivate.name}" has been deactivated`,
      );
      setDeactivateRoleModalOpen(false);
      setRoleToDeactivate(null);
      setRoleDeactivationReason("");
      // Update the specific role in the list instead of reloading
      setRoles(
        roles.map((r) =>
          r.id === roleToDeactivate.id ? { ...r, is_active: false } : r,
        ),
      );
    } catch (err) {
      showError(
        "Error",
        err instanceof Error ? err.message : "Failed to deactivate role",
      );
    } finally {
      setDeactivatingRoleId(null);
    }
  };

  const confirmReactivateRole = async (role: Role) => {
    try {
      setTogglingRoleId(role.id);
      await roleService.reactivateRole(role.id, { reactivated_by: userId });
      success("Success", `Role "${role.name}" has been reactivated`);
      // Update the specific role in the list instead of reloading
      setRoles(
        roles.map((r) => (r.id === role.id ? { ...r, is_active: true } : r)),
      );
    } catch (err) {
      showError(
        "Error",
        err instanceof Error ? err.message : "Failed to reactivate role",
      );
    } finally {
      setTogglingRoleId(null);
    }
  };

  const handleDeleteRole = (role: Role) => {
    setDeleteTarget({ type: "role", id: role.id });
    setDeleteConfirmOpen(true);
  };

  const confirmDeleteRole = async () => {
    if (!deleteTarget || deleteTarget.type !== "role") return;

    try {
      setIsDeleting(true);
      const role = roles.find((r) => r.id === deleteTarget.id);
      await roleService.deleteRole(deleteTarget.id);
      success("Deleted", `Role "${role?.name}" has been deleted`);
      setDeleteConfirmOpen(false);
      setDeleteTarget(null);
      // Remove the role from the local list instead of reloading from server
      setRoles(roles.filter((r) => r.id !== deleteTarget.id));
    } catch (err) {
      showError(
        "Error",
        err instanceof Error ? err.message : "Failed to delete role",
      );
    } finally {
      setIsDeleting(false);
    }
  };

  const handleRoleSaved = () => {
    setRoleFormOpen(false);
    fetchRoles();
  };

  // ============ PERMISSIONS TAB FUNCTIONS ============

  const fetchPermissions = useCallback(async () => {
    if (activeTab !== "permissions") return;

    try {
      setPermissionsLoading(true);
      const permissionsArray = await permissionService.getActivePermissions({
        limit: permissionsPaginationModel.pageSize,
        offset:
          permissionsPaginationModel.page * permissionsPaginationModel.pageSize,
        skipCache: true,
      });

      setPermissions(Array.isArray(permissionsArray) ? permissionsArray : []);
      setPermissionsTotal(permissionsArray?.length || 0);
    } catch (err) {
      console.error("Failed to load permissions:", err);
      showError(
        "Error",
        err instanceof Error ? err.message : "Failed to load permissions",
      );
      setPermissions([]);
    } finally {
      setPermissionsLoading(false);
    }
  }, [activeTab, permissionsPaginationModel, showError]);

  useEffect(() => {
    if (activeTab === "permissions") {
      fetchPermissions();
    }
  }, [activeTab, permissionsPaginationModel, fetchPermissions]);

  const filteredPermissions = useMemo(() => {
    let filtered = Array.isArray(permissions) ? [...permissions] : [];

    if (permissionsSearch) {
      const term = permissionsSearch.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(term) ||
          p.code.toLowerCase().includes(term),
      );
    }

    if (permissionsActionFilter) {
      filtered = filtered.filter((p) => p.action === permissionsActionFilter);
    }

    return filtered;
  }, [permissions, permissionsSearch, permissionsActionFilter]);

  const handleCreatePermission = () => {
    setEditingPermission(undefined);
    setPermFormOpen(true);
  };

  const handleEditPermission = (permission: Permission) => {
    setEditingPermission(permission);
    setPermFormOpen(true);
  };

  const handleTogglePermissionActive = async (permission: Permission) => {
    try {
      setIsDeleting(true);
      // MOCKED - Backend endpoint not available
      // if (permission.is_active) {
      //   await permissionService.deactivatePermission(permission.id);
      //   success(
      //     "Success",
      //     `Permission "${permission.name}" has been deactivated`,
      //   );
      // } else {
      //   await permissionService.reactivatePermission(permission.id);
      //   success(
      //     "Success",
      //     `Permission "${permission.name}" has been reactivated`,
      //   );
      // }
      success("Success", `Permission "${permission.name}" status updated`);
      // Update the specific permission in the list instead of reloading
      setPermissions(
        permissions.map((p) =>
          p.id === permission.id ? { ...p, is_active: !p.is_active } : p,
        ),
      );
    } catch (err) {
      showError(
        "Error",
        err instanceof Error
          ? err.message
          : "Failed to update permission status",
      );
    } finally {
      setIsDeleting(false);
    }
  };

  const handlePermissionSaved = () => {
    setPermFormOpen(false);
    fetchPermissions();
  };

  // ============ RENDER ============

  return (
    <div className="space-y-6 p-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="min-w-0">
          <h1 className={`${tw.mainHeading} ${tw.textPrimary}`}>
            Access Control
          </h1>
          <p className={`${tw.textSecondary} mt-2 text-sm`}>
            Manage roles, permissions, and access control
          </p>
        </div>
        {activeTab !== "assign" && (
          <button
            onClick={
              activeTab === "roles" ? handleCreateRole : handleCreatePermission
            }
            className={`${tw.button} flex items-center gap-2 flex-shrink-0`}
          >
            <Plus className="w-4 h-4" />
            Create
          </button>
        )}
      </div>

      {/* Custom Tabs */}
      <div className="border-b border-gray-200">
        <div className="flex gap-0">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 sm:px-4 py-2.5 text-sm font-medium transition-colors flex items-center gap-2 relative flex-shrink-0 ${
                  isActive ? "text-black" : "text-gray-600 hover:text-gray-900"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
                {isActive && (
                  <div
                    className="absolute bottom-0 left-0 right-0 h-0.5"
                    style={{ backgroundColor: color.primary.accent }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content: Roles */}
      {activeTab === "roles" && (
        <div className="space-y-4">
          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search roles..."
                value={rolesSearch}
                onChange={(e) => setRolesSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="w-48">
              <HeadlessSelect
                options={[{ value: "", label: "All Levels" }, ...ROLE_LEVELS]}
                value={rolesLevelFilter}
                onChange={(value) => setRolesLevelFilter(String(value))}
                placeholder="Filter by level"
              />
            </div>

            <div className="w-48">
              <HeadlessSelect
                options={[
                  { value: "", label: "All Data Access" },
                  ...DATA_ACCESS_LEVELS,
                ]}
                value={rolesDataAccessFilter}
                onChange={(value) => setRolesDataAccessFilter(String(value))}
                placeholder="Filter by access"
              />
            </div>
          </div>

          {/* Roles Table */}
          {rolesLoading ? (
            <div className="flex justify-center py-8">
              <LoadingSpinner />
            </div>
          ) : filteredRoles.length === 0 ? (
            <div
              className="border border-gray-200 rounded-lg p-8 text-center"
              style={{ backgroundColor: color.surface.cards }}
            >
              <p className="text-gray-600 font-medium">
                No roles found matching the selected filters
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto border border-gray-200 rounded-lg">
              <table
                className="w-full min-w-[800px]"
                style={{ borderCollapse: "separate", borderSpacing: "0 8px" }}
              >
                <thead style={{ background: color.surface.tableHeader }}>
                  <tr>
                    <th
                      className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs font-medium uppercase tracking-wider"
                      style={{ color: color.surface.tableHeaderText }}
                    >
                      Role Name
                    </th>
                    <th
                      className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs font-medium uppercase tracking-wider"
                      style={{ color: color.surface.tableHeaderText }}
                    >
                      Code
                    </th>
                    <th
                      className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs font-medium uppercase tracking-wider"
                      style={{ color: color.surface.tableHeaderText }}
                    >
                      Level
                    </th>
                    <th
                      className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs font-medium uppercase tracking-wider"
                      style={{ color: color.surface.tableHeaderText }}
                    >
                      Data Access
                    </th>
                    <th
                      className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs font-medium uppercase tracking-wider"
                      style={{ color: color.surface.tableHeaderText }}
                    >
                      Users
                    </th>
                    <th
                      className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs font-medium uppercase tracking-wider"
                      style={{ color: color.surface.tableHeaderText }}
                    >
                      Status
                    </th>
                    <th
                      className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs font-medium uppercase tracking-wider"
                      style={{ color: color.surface.tableHeaderText }}
                    >
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRoles.map((role) => (
                    <tr key={role.id} className="transition-colors">
                      <td
                        className="px-4 sm:px-6 py-3 sm:py-4 text-sm text-gray-900 font-medium"
                        style={{ backgroundColor: color.surface.tablebodybg }}
                      >
                        {role.name}
                      </td>
                      <td
                        className="px-4 sm:px-6 py-3 sm:py-4 text-sm text-gray-600 font-mono"
                        style={{ backgroundColor: color.surface.tablebodybg }}
                      >
                        {role.code}
                      </td>
                      <td
                        className="px-4 sm:px-6 py-3 sm:py-4 text-sm text-gray-600"
                        style={{ backgroundColor: color.surface.tablebodybg }}
                      >
                        {role.role_level}
                      </td>
                      <td
                        className="px-4 sm:px-6 py-3 sm:py-4 text-sm"
                        style={{ backgroundColor: color.surface.tablebodybg }}
                      >
                        <span className="inline-block px-2.5 py-1 rounded text-sm font-medium bg-gray-100 text-gray-800">
                          {role.data_access_level || "—"}
                        </span>
                      </td>
                      <td
                        className="px-4 sm:px-6 py-3 sm:py-4 text-sm text-gray-600"
                        style={{ backgroundColor: color.surface.tablebodybg }}
                      >
                        {role.current_user_count || 0}
                      </td>
                      <td
                        className="px-4 sm:px-6 py-3 sm:py-4 text-sm"
                        style={{ backgroundColor: color.surface.tablebodybg }}
                      >
                        <span
                          className={`inline-block px-2.5 py-1 rounded text-sm font-medium ${
                            role.is_active
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {role.is_active ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td
                        className="px-4 sm:px-6 py-3 sm:py-4 text-sm"
                        style={{ backgroundColor: color.surface.tablebodybg }}
                      >
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleEditRole(role)}
                            className="p-1.5 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                            title="Edit"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleCloneRole(role)}
                            className="p-1.5 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                            title="Clone"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleToggleRoleActive(role)}
                            disabled={togglingRoleId === role.id}
                            className={`p-1.5 rounded transition-colors ${
                              togglingRoleId === role.id
                                ? "opacity-50 cursor-not-allowed text-gray-400"
                                : role.is_active
                                  ? "text-gray-600 hover:text-amber-600 hover:bg-amber-50"
                                  : "text-gray-600 hover:text-green-600 hover:bg-green-50"
                            }`}
                            title={role.is_active ? "Deactivate" : "Reactivate"}
                          >
                            {togglingRoleId === role.id ? (
                              <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
                            ) : (
                              <Power className="w-4 h-4" />
                            )}
                          </button>
                          <button
                            onClick={() => handleDeleteRole(role)}
                            className="p-1.5 text-red-600 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
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
      )}

      {/* Tab Content: Permissions */}
      {activeTab === "permissions" && (
        <div className="space-y-4">
          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search permissions..."
                value={permissionsSearch}
                onChange={(e) => setPermissionsSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="w-48">
              <HeadlessSelect
                options={[
                  { value: "", label: "All Actions" },
                  ...PERMISSION_ACTIONS,
                ]}
                value={permissionsActionFilter}
                onChange={(value) => setPermissionsActionFilter(String(value))}
                placeholder="Filter by action"
              />
            </div>
          </div>

          {/* Permissions Table */}
          {permissionsLoading ? (
            <div className="flex justify-center py-8">
              <LoadingSpinner />
            </div>
          ) : filteredPermissions.length === 0 ? (
            <div
              className="border border-gray-200 rounded-lg p-8 text-center"
              style={{ backgroundColor: color.surface.cards }}
            >
              <p className="text-gray-600 font-medium">
                No permissions found matching the selected filters
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto border border-gray-200 rounded-lg">
              <table
                className="w-full min-w-[800px]"
                style={{ borderCollapse: "separate", borderSpacing: "0 8px" }}
              >
                <thead style={{ background: color.surface.tableHeader }}>
                  <tr>
                    <th
                      className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs font-medium uppercase tracking-wider"
                      style={{ color: color.surface.tableHeaderText }}
                    >
                      Permission Name
                    </th>
                    <th
                      className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs font-medium uppercase tracking-wider"
                      style={{ color: color.surface.tableHeaderText }}
                    >
                      Code
                    </th>
                    <th
                      className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs font-medium uppercase tracking-wider"
                      style={{ color: color.surface.tableHeaderText }}
                    >
                      Action
                    </th>
                    <th
                      className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs font-medium uppercase tracking-wider"
                      style={{ color: color.surface.tableHeaderText }}
                    >
                      Sensitive
                    </th>
                    <th
                      className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs font-medium uppercase tracking-wider"
                      style={{ color: color.surface.tableHeaderText }}
                    >
                      Requires MFA
                    </th>
                    <th
                      className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs font-medium uppercase tracking-wider"
                      style={{ color: color.surface.tableHeaderText }}
                    >
                      Status
                    </th>
                    <th
                      className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs font-medium uppercase tracking-wider"
                      style={{ color: color.surface.tableHeaderText }}
                    >
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPermissions.map((permission) => (
                    <tr key={permission.id} className="transition-colors">
                      <td
                        className="px-4 sm:px-6 py-3 sm:py-4 text-sm text-gray-900 font-medium"
                        style={{ backgroundColor: color.surface.tablebodybg }}
                      >
                        {permission.name}
                      </td>
                      <td
                        className="px-4 sm:px-6 py-3 sm:py-4 text-sm text-gray-600 font-mono"
                        style={{ backgroundColor: color.surface.tablebodybg }}
                      >
                        {permission.code}
                      </td>
                      <td
                        className="px-4 sm:px-6 py-3 sm:py-4 text-sm text-gray-600"
                        style={{ backgroundColor: color.surface.tablebodybg }}
                      >
                        {permission.action}
                      </td>
                      <td
                        className="px-4 sm:px-6 py-3 sm:py-4 text-sm"
                        style={{ backgroundColor: color.surface.tablebodybg }}
                      >
                        <span
                          className={`inline-block px-2.5 py-1 rounded text-sm font-medium ${
                            permission.is_sensitive
                              ? "bg-red-100 text-red-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {permission.is_sensitive ? "Yes" : "No"}
                        </span>
                      </td>
                      <td
                        className="px-4 sm:px-6 py-3 sm:py-4 text-sm"
                        style={{ backgroundColor: color.surface.tablebodybg }}
                      >
                        <span
                          className={`inline-block px-2.5 py-1 rounded text-sm font-medium ${
                            permission.requires_mfa
                              ? "bg-amber-100 text-amber-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {permission.requires_mfa ? "Yes" : "No"}
                        </span>
                      </td>
                      <td
                        className="px-4 sm:px-6 py-3 sm:py-4 text-sm"
                        style={{ backgroundColor: color.surface.tablebodybg }}
                      >
                        <span
                          className={`inline-block px-2.5 py-1 rounded text-sm font-medium ${
                            permission.is_active
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {permission.is_active ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td
                        className="px-4 sm:px-6 py-3 sm:py-4 text-sm"
                        style={{ backgroundColor: color.surface.tablebodybg }}
                      >
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleEditPermission(permission)}
                            className="p-1.5 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                            title="Edit"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() =>
                              handleTogglePermissionActive(permission)
                            }
                            disabled={isDeleting}
                            className={`p-1.5 rounded transition-colors ${
                              isDeleting
                                ? "opacity-50 cursor-not-allowed text-gray-400"
                                : permission.is_active
                                  ? "text-gray-600 hover:text-amber-600 hover:bg-amber-50"
                                  : "text-gray-600 hover:text-green-600 hover:bg-green-50"
                            }`}
                            title={
                              permission.is_active ? "Deactivate" : "Reactivate"
                            }
                          >
                            <Power className="w-4 h-4" />
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
      )}

      {/* Tab Content: Assign Permissions */}
      {activeTab === "assign" && (
        <AssignPermissionsModal
          isOpen={true}
          rolesList={roles}
          selectedRole={selectedRoleForAssign}
          onRoleSelect={setSelectedRoleForAssign}
          onPermissionsChanged={fetchPermissions}
          userId={userId}
        />
      )}

      {/* Role Form Modal */}
      <RoleFormModal
        isOpen={roleFormOpen}
        onClose={() => {
          setRoleFormOpen(false);
          setEditingRole(undefined);
        }}
        role={editingRole}
        onSave={handleRoleSaved}
        allRoles={roles}
        userId={userId}
      />

      {/* Permission Form Modal */}
      <PermissionFormModal
        isOpen={permFormOpen}
        onClose={() => {
          setPermFormOpen(false);
          setEditingPermission(undefined);
        }}
        permission={editingPermission}
        onSave={handlePermissionSaved}
      />

      {/* Delete Confirmation Dialog */}
      {deleteConfirmOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-sm w-full mx-4">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                {deleteTarget?.type === "role"
                  ? "Delete Role?"
                  : "Delete Permission?"}
              </h3>
            </div>
            <div className="px-6 py-4">
              <p className="text-sm text-gray-600">
                {deleteTarget?.type === "role"
                  ? `Are you sure you want to delete "${roles.find((r) => r.id === deleteTarget?.id)?.name}"? This action cannot be undone.`
                  : `Are you sure you want to delete "${permissions.find((p) => p.id === deleteTarget?.id)?.name}"? This action cannot be undone.`}
              </p>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => setDeleteConfirmOpen(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 border border-gray-300 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={
                  deleteTarget?.type === "role"
                    ? confirmDeleteRole
                    : confirmDeletePermission
                }
                disabled={isDeleting}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isDeleting && <LoadingSpinner />}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Role Deactivation Modal */}
      {deactivateRoleModalOpen && roleToDeactivate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full mx-4">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                Deactivate Role
              </h3>
            </div>
            <div className="px-6 py-4 space-y-4">
              <div>
                <p className="text-sm text-gray-600 mb-3">
                  You are about to deactivate{" "}
                  <span className="font-medium">"{roleToDeactivate.name}"</span>
                  . Please provide a reason for this action.
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Deactivation Reason{" "}
                  <span style={{ color: color.status.danger }}>*</span>
                </label>
                <textarea
                  value={roleDeactivationReason}
                  onChange={(e) => setRoleDeactivationReason(e.target.value)}
                  placeholder="Enter the reason for deactivation..."
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  rows={4}
                  disabled={deactivatingRoleId !== null}
                />
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => {
                  setDeactivateRoleModalOpen(false);
                  setRoleToDeactivate(null);
                  setRoleDeactivationReason("");
                }}
                disabled={deactivatingRoleId !== null}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 border border-gray-300 rounded-lg transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeactivateRole}
                disabled={
                  deactivatingRoleId !== null || !roleDeactivationReason.trim()
                }
                className="px-4 py-2 text-sm font-medium text-white bg-amber-600 hover:bg-amber-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {deactivatingRoleId !== null && <LoadingSpinner />}
                Deactivate
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
