import Input from '../../../shared/components/ui/Input';
import BackButton from '../../../shared/components/ui/BackButton';
import React, { useState, useCallback, useEffect, useMemo } from "react";
import {
  Trash2,
  Edit,
  Copy,
  Power,
  PowerOff,
  Play,
  Shield,
  Key,
  Lock,
  Search,
  Square,
  CheckSquare,
} from "lucide-react";
import { color, tw } from "../../../shared/utils/utils";
import { useToast } from "../../../contexts/ToastContext";
import { useAuth } from "../../../contexts/AuthContext";
import { useLanguage } from "../../../contexts/LanguageContext";
import HeadlessSelect from "../../../shared/components/ui/HeadlessSelect";
import Pagination from "../../../shared/components/ui/Pagination";
import CreateButton from "../../../shared/components/ui/CreateButton";
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
import Checkbox from "../../../shared/components/ui/Checkbox";

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



export default function TeamRolesPermissionsPage() {
  const { success, error: showError } = useToast();
  const { user } = useAuth();
  const { t } = useLanguage();

  const userId = user?.user_id;

  useEffect(() => {}, [userId]);

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
  const [cloningRoleId, setCloningRoleId] = useState<number | null>(null);
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
      pageSize: 20, // Display 20 per page in frontend
    });

  // Backend fetches 100 at a time for permissions table
  const PERMISSIONS_BACKEND_LIMIT = 100;

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
  const [isSelectionMode, setIsSelectionMode] = useState(false);

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
  const [cascadeToChildren, setCascadeToChildren] = useState(false);
  const [deactivatingRoleId, setDeactivatingRoleId] = useState<number | null>(
    null,
  );

  // Role clone modal state
  const [cloneModalOpen, setCloneModalOpen] = useState(false);
  const [roleToClone, setRoleToClone] = useState<Role | null>(null);
  const [cloneFormData, setCloneFormData] = useState({
    name: "",
    code: "",
    description: "",
  });

  // Permission deactivation state
  const [deactivatingPermissionId, setDeactivatingPermissionId] = useState<
    number | null
  >(null);

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
        t.common.error,
        err instanceof Error ? err.message : t.analytics.failedToLoad,
        true,
      );
    } finally {
      setRolesLoading(false);
    }
  }, [activeTab, rolesPaginationModel, showError, t]);

  useEffect(() => {
    if (activeTab === "roles") {
      fetchRoles();
    }
  }, [activeTab, rolesPaginationModel, fetchRoles]);

  // Reset page when search or filter changes
  useEffect(() => {
    setRolesPaginationModel((prev) => ({ ...prev, page: 0 }));
  }, [rolesSearch, rolesLevelFilter, rolesDataAccessFilter]);

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

  const paginatedRoles = useMemo(() => {
    const start = rolesPaginationModel.page * rolesPaginationModel.pageSize;
    const end = start + rolesPaginationModel.pageSize;
    return filteredRoles.slice(start, end);
  }, [filteredRoles, rolesPaginationModel]);

  const roleLevelOptions = useMemo(() => {
    const uniqueLevels = Array.from(new Set(roles.map((r) => r.role_level))).sort(
      (a, b) => a - b,
    );
    return uniqueLevels.map((level) => ({
      value: String(level),
      label: `Level ${level}`,
    }));
  }, [roles]);

  const dataAccessLevelOptions = useMemo(() => {
    const uniqueLevels = Array.from(
      new Set(roles.map((r) => r.data_access_level).filter(Boolean)),
    );
    return uniqueLevels.map((level) => ({
      value: level,
      label: level.charAt(0).toUpperCase() + level.slice(1),
    }));
  }, [roles]);

  const permissionActionOptions = useMemo(() => {
    const uniqueActions = Array.from(
      new Set(permissions.map((p) => p.action).filter(Boolean)),
    );
    return uniqueActions.map((action) => ({
      value: action,
      label: action.charAt(0).toUpperCase() + action.slice(1),
    }));
  }, [permissions]);

  const handleCreateRole = () => {
    setEditingRole(undefined);
    setRoleFormOpen(true);
  };

  const handleEditRole = (role: Role) => {
    setEditingRole(role);
    setRoleFormOpen(true);
  };

  const handleCloneRole = (role: Role) => {
    setRoleToClone(role);
    setCloneFormData({
      name: role.name,
      code: role.code,
      description: role.description || "",
    });
    setCloneModalOpen(true);
  };

  const handleConfirmClone = async () => {
    if (!roleToClone || !userId) return;

    if (!cloneFormData.name.trim() || !cloneFormData.code.trim()) {
      showError(t.common.error, "Name and Code are required", true);
      return;
    }

    try {
      setCloningRoleId(roleToClone.id);
      await roleService.cloneRole(roleToClone.id, {
        newCode: cloneFormData.code,
        newName: cloneFormData.name,
        userId,
      } as CloneRoleRequest);
      success("Success", `Role "${roleToClone.name}" has been cloned`);
      setCloneModalOpen(false);
      setRoleToClone(null);
      // Refresh to show the newly cloned role
      fetchRoles();
    } catch (err) {
      showError(
        t.common.error,
        err instanceof Error ? err.message : t.common.failedToPerformAction,
        true,
      );
    } finally {
      setCloningRoleId(null);
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
      showError(t.common.error, t.common.fieldRequired, true);
      return;
    }

    try {
      setDeactivatingRoleId(roleToDeactivate.id);
      await roleService.deactivateRole(roleToDeactivate.id, userId, {
        deactivationReason: roleDeactivationReason.trim(),
        cascadeToChildren,
      });
      success(
        "Success",
        `Role "${roleToDeactivate.name}" has been deactivated`,
      );
      setDeactivateRoleModalOpen(false);
      setRoleToDeactivate(null);
      setRoleDeactivationReason("");
      setCascadeToChildren(false);
      // Update the specific role in the list instead of reloading
      setRoles(
        roles.map((r) =>
          r.id === roleToDeactivate.id ? { ...r, is_active: false } : r,
        ),
      );
    } catch (err) {
      showError(
        t.common.error,
        err instanceof Error ? err.message : t.common.failedToPerformAction,
        true,
      );
    } finally {
      setDeactivatingRoleId(null);
    }
  };

  const confirmReactivateRole = async (role: Role) => {
    try {
      setTogglingRoleId(role.id);
      await roleService.reactivateRole(role.id, { userId });
      success("Success", `Role "${role.name}" has been reactivated`);
      // Update the specific role in the list instead of reloading
      setRoles(
        roles.map((r) => (r.id === role.id ? { ...r, is_active: true } : r)),
      );
    } catch (err) {
      showError(
        t.common.error,
        err instanceof Error ? err.message : t.common.failedToPerformAction,
        true,
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

    if (!userId) {
      showError(t.common.error, "User ID is required to delete a role", true);
      return;
    }

    try {
      setIsDeleting(true);
      const role = roles.find((r) => r.id === deleteTarget.id);
      await roleService.deleteRole(deleteTarget.id, {
        userId: userId,
      });
      success("Deleted", `Role "${role?.name}" has been deleted`);
      setDeleteConfirmOpen(false);
      setDeleteTarget(null);
      // Remove the role from the local list instead of reloading from server
      setRoles(roles.filter((r) => r.id !== deleteTarget.id));
    } catch (err) {
      showError(
        t.common.error,
        err instanceof Error ? err.message : t.common.failedToPerformAction,
        true,
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

      // Calculate which backend batch we need based on current page
      const currentBackendPage = Math.floor(
        (permissionsPaginationModel.page *
          permissionsPaginationModel.pageSize) /
          PERMISSIONS_BACKEND_LIMIT,
      );

      const permissionsArray = await permissionService.getActivePermissions({
        limit: PERMISSIONS_BACKEND_LIMIT, // Always fetch 100 from backend
        offset: currentBackendPage * PERMISSIONS_BACKEND_LIMIT,
        skipCache: true,
      });

      setPermissions(Array.isArray(permissionsArray) ? permissionsArray : []);
      setPermissionsTotal(permissionsArray?.length || 0);
    } catch (err) {
      console.error("Failed to load permissions:", err);
      showError(
        t.common.error,
        err instanceof Error ? err.message : t.analytics.failedToLoad,
        true,
      );
      setPermissions([]);
    } finally {
      setPermissionsLoading(false);
    }
  }, [activeTab, permissionsPaginationModel, showError, t]);

  useEffect(() => {
    if (activeTab === "permissions") {
      fetchPermissions();
    }
  }, [activeTab, permissionsPaginationModel, fetchPermissions]);

  // Reset page when search or filter changes
  useEffect(() => {
    setPermissionsPaginationModel((prev) => ({ ...prev, page: 0 }));
  }, [permissionsSearch, permissionsActionFilter]);

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

  const paginatedPermissions = useMemo(() => {
    const start =
      permissionsPaginationModel.page * permissionsPaginationModel.pageSize;
    const end = start + permissionsPaginationModel.pageSize;
    return filteredPermissions.slice(start, end);
  }, [filteredPermissions, permissionsPaginationModel]);

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
      setDeactivatingPermissionId(permission.id);
      if (permission.is_active) {
        await permissionService.deactivatePermission(permission.id);
        success(
          "Success",
          `Permission "${permission.name}" has been deactivated`,
        );
      } else {
        await permissionService.reactivatePermission(permission.id);
        success(
          "Success",
          `Permission "${permission.name}" has been reactivated`,
        );
      }
      // Update the specific permission in the list instead of reloading
      setPermissions(
        permissions.map((p) =>
          p.id === permission.id ? { ...p, is_active: !p.is_active } : p,
        ),
      );
    } catch (err) {
      showError(
        t.common.error,
        err instanceof Error ? err.message : t.common.failedToPerformAction,
        true,
      );
    } finally {
      setDeactivatingPermissionId(null);
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
          <BackButton
            fallbackTo="/dashboard/administration"
            showBreadcrumb={true}
            parentLabel="Admin Hub"
            currentLabel="Access Control"
          />
          {/* <h1 className={`${tw.mainHeading} ${tw.textPrimary}`}>
            Access Control
          </h1> */}
          <p className={`${tw.textSecondary} mt-6 text-sm`}>
            Manage roles, permissions, and access control
          </p>
        </div>
        {activeTab === "assign" && selectedRoleForAssign && (
          <button
            onClick={() => {
              if (!isSelectionMode) {
                setIsSelectionMode(true);
              } else {
                setIsSelectionMode(false);
              }
            }}
            disabled={!selectedRoleForAssign}
            className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors whitespace-nowrap flex-shrink-0 ${
              isSelectionMode
                ? "text-white"
                : "border text-gray-700 bg-transparent hover:border-gray-400"
            } disabled:opacity-50 disabled:cursor-not-allowed`}
            style={{
              backgroundColor: isSelectionMode
                ? color.primary.action
                : "transparent",
              borderColor: isSelectionMode
                ? "transparent"
                : color.primary.action + "40",
              color: isSelectionMode ? "white" : color.primary.action,
            }}
          >
            {isSelectionMode ? (
              <>
                <CheckSquare className="w-4 h-4" />
                Exit Selection
              </>
            ) : (
              <>
                <Square className="w-4 h-4" />
                Select Multiple
              </>
            )}
          </button>
        )}
        {activeTab !== "assign" && (
          <CreateButton
            onClick={
              activeTab === "roles" ? handleCreateRole : handleCreatePermission
            }
            label={activeTab === "roles" ? "Create Role" : "Create Permission"}
          />
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
              <Input
                type="text"
                placeholder="Search roles..."
                value={rolesSearch}
                onChange={(value) => setRolesSearch(String(value))}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="w-48">
              <HeadlessSelect
                options={[{ value: "", label: "All Levels" }, ...roleLevelOptions]}
                value={rolesLevelFilter}
                onChange={(value) => setRolesLevelFilter(String(value))}
                placeholder="Filter by level"
              />
            </div>

            <div className="w-48">
              <HeadlessSelect
                options={[
                  { value: "", label: "All Data Access" },
                  ...dataAccessLevelOptions,
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
                  {paginatedRoles.map((role) => (
                    <tr key={role.id} className="transition-colors">
                      <td
                        className="px-4 sm:px-6 py-3 sm:py-4 text-sm text-black font-medium"
                        style={{ backgroundColor: color.surface.tablebodybg }}
                      >
                        {role.name}
                      </td>
                      <td
                        className="px-4 sm:px-6 py-3 sm:py-4 text-sm text-black font-mono"
                        style={{ backgroundColor: color.surface.tablebodybg }}
                      >
                        {role.code}
                      </td>
                      <td
                        className="px-4 sm:px-6 py-3 sm:py-4 text-sm text-black"
                        style={{ backgroundColor: color.surface.tablebodybg }}
                      >
                        {role.role_level}
                      </td>
                      <td
                        className="px-4 sm:px-6 py-3 sm:py-4 text-sm text-black"
                        style={{ backgroundColor: color.surface.tablebodybg }}
                      >
                        {role.data_access_level || "—"}
                      </td>
                      <td
                        className="px-4 sm:px-6 py-3 sm:py-4 text-sm text-black"
                        style={{ backgroundColor: color.surface.tablebodybg }}
                      >
                        {role.current_user_count || 0}
                      </td>
                      <td
                        className="px-4 sm:px-6 py-3 sm:py-4 text-sm text-black"
                        style={{ backgroundColor: color.surface.tablebodybg }}
                      >
                        {role.is_active ? "Active" : "Inactive"}
                      </td>
                      <td
                        className="px-4 sm:px-6 py-3 sm:py-4 text-sm"
                        style={{ backgroundColor: color.surface.tablebodybg }}
                      >
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleEditRole(role)}
                            // disabled={role.is_system_role}
                            className={`p-1.5 rounded transition-colors ${
                              // role.is_system_role
                              //   ? "opacity-50 cursor-not-allowed text-gray-400"
                              //   :
                              "text-gray-600"
                            }`}
                            title={
                              // role.is_system_role
                              //   ? "Cannot modify system roles"
                              //   :
                              "Edit"
                            }
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleCloneRole(role)}
                            disabled={cloningRoleId === role.id}
                            className={`p-1.5 rounded transition-colors ${
                              cloningRoleId === role.id
                                ? "opacity-50 cursor-not-allowed text-gray-400"
                                : "text-gray-600"
                            }`}
                            title="Clone"
                          >
                            {cloningRoleId === role.id ? (
                              <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </button>
                          <button
                            onClick={() => handleToggleRoleActive(role)}
                            disabled={
                              togglingRoleId === role.id ||
                              (role.is_active &&
                                (role.is_system_role || role.is_default))
                            }
                            className={`p-1.5 rounded transition-colors ${
                              togglingRoleId === role.id ||
                              (role.is_active &&
                                (role.is_system_role || role.is_default))
                                ? "opacity-50 cursor-not-allowed text-gray-400"
                                : "text-gray-600"
                            }`}
                            title={
                              role.is_active
                                ? role.is_system_role
                                  ? "Cannot deactivate system roles"
                                  : role.is_default
                                    ? "Cannot deactivate default roles"
                                    : "Deactivate"
                                : "Reactivate"
                            }
                          >
                            {togglingRoleId === role.id ? (
                              <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
                            ) : role.is_active ? (
                              <PowerOff className="w-4 h-4" />
                            ) : (
                              <Play className="w-4 h-4" />
                            )}
                          </button>
                          <button
                            onClick={() => handleDeleteRole(role)}
                            disabled={isDeleting}
                            className={`p-1.5 rounded transition-colors ${
                              isDeleting
                                ? "opacity-50 cursor-not-allowed text-gray-400"
                                : "text-red-600"
                            }`}
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
              {/* Pagination Controls */}
              {filteredRoles.length > 0 && (
                <Pagination
                  currentPage={rolesPaginationModel.page + 1}
                  pageSize={rolesPaginationModel.pageSize}
                  totalItems={filteredRoles.length}
                  onPageChange={(page) =>
                    setRolesPaginationModel({
                      page: page - 1,
                      pageSize: rolesPaginationModel.pageSize,
                    })
                  }
                  onPageSizeChange={(pageSize) =>
                    setRolesPaginationModel({
                      page: 0,
                      pageSize,
                    })
                  }
                />
              )}
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
              <Input
                type="text"
                placeholder="Search permissions..."
                value={permissionsSearch}
                onChange={(value) => setPermissionsSearch(String(value))}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="w-48">
              <HeadlessSelect
                options={[
                  { value: "", label: "All Actions" },
                  ...permissionActionOptions,
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
                  {paginatedPermissions.map((permission) => (
                    <tr key={permission.id} className="transition-colors">
                      <td
                        className="px-4 sm:px-6 py-3 sm:py-4 text-sm text-black font-medium"
                        style={{ backgroundColor: color.surface.tablebodybg }}
                      >
                        {permission.name}
                      </td>
                      <td
                        className="px-4 sm:px-6 py-3 sm:py-4 text-sm text-black font-mono"
                        style={{ backgroundColor: color.surface.tablebodybg }}
                      >
                        {permission.code}
                      </td>
                      <td
                        className="px-4 sm:px-6 py-3 sm:py-4 text-sm text-black"
                        style={{ backgroundColor: color.surface.tablebodybg }}
                      >
                        {permission.action}
                      </td>
                      <td
                        className="px-4 sm:px-6 py-3 sm:py-4 text-sm text-black"
                        style={{ backgroundColor: color.surface.tablebodybg }}
                      >
                        {permission.is_sensitive ? "Yes" : "No"}
                      </td>
                      <td
                        className="px-4 sm:px-6 py-3 sm:py-4 text-sm text-black"
                        style={{ backgroundColor: color.surface.tablebodybg }}
                      >
                        {permission.requires_mfa ? "Yes" : "No"}
                      </td>
                      <td
                        className="px-4 sm:px-6 py-3 sm:py-4 text-sm text-black"
                        style={{ backgroundColor: color.surface.tablebodybg }}
                      >
                        {permission.is_active ? "Active" : "Inactive"}
                      </td>
                      <td
                        className="px-4 sm:px-6 py-3 sm:py-4 text-sm"
                        style={{ backgroundColor: color.surface.tablebodybg }}
                      >
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleEditPermission(permission)}
                            className="p-1.5 text-gray-600 rounded transition-colors"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() =>
                              handleTogglePermissionActive(permission)
                            }
                            disabled={deactivatingPermissionId === permission.id}
                            className={`p-1.5 rounded transition-colors ${
                              deactivatingPermissionId === permission.id
                                ? "opacity-50 cursor-not-allowed text-gray-400"
                                : "text-gray-600"
                            }`}
                            title={
                              permission.is_active ? "Deactivate" : "Reactivate"
                            }
                          >
                            {deactivatingPermissionId === permission.id ? (
                              <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
                            ) : permission.is_active ? (
                              <PowerOff className="w-4 h-4" />
                            ) : (
                              <Play className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {/* Pagination Controls */}
              {filteredPermissions.length > 0 && (
                <Pagination
                  currentPage={permissionsPaginationModel.page + 1}
                  pageSize={permissionsPaginationModel.pageSize}
                  totalItems={filteredPermissions.length}
                  onPageChange={(page) =>
                    setPermissionsPaginationModel({
                      page: page - 1,
                      pageSize: permissionsPaginationModel.pageSize,
                    })
                  }
                  onPageSizeChange={(pageSize) =>
                    setPermissionsPaginationModel({
                      page: 0,
                      pageSize,
                    })
                  }
                />
              )}
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
          onRoleSelect={(role) => {
            setSelectedRoleForAssign(role);
            // Clear selection mode when changing roles
            setIsSelectionMode(false);
          }}
          onPermissionsChanged={fetchPermissions}
          userId={userId}
          isSelectionMode={isSelectionMode}
          onSelectionModeChange={setIsSelectionMode}
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
              <div
                className="flex items-center gap-2 cursor-pointer"
                onClick={() => deactivatingRoleId === null && setCascadeToChildren(!cascadeToChildren)}
              >
                <Checkbox
                  id="cascadeToChildren"
                  checked={cascadeToChildren}
                  onChange={() => deactivatingRoleId === null && setCascadeToChildren(!cascadeToChildren)}
                  disabled={deactivatingRoleId !== null}
                />
                <span className="text-sm text-gray-700">Deactivate child roles too</span>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => {
                  setDeactivateRoleModalOpen(false);
                  setRoleToDeactivate(null);
                  setRoleDeactivationReason("");
                  setCascadeToChildren(false);
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

      {/* Clone Role Modal */}
      {cloneModalOpen && roleToClone && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
            <h2 className={`text-lg font-semibold ${tw.textPrimary} mb-4`}>
              Copy Role
            </h2>

            {/* Form Fields */}
            <div className="space-y-4">
              {/* Name */}
              <div>
                <label className={`block text-sm font-medium ${tw.textPrimary} mb-1`}>
                  Role Name
                </label>
                <Input
                  type="text"
                  value={cloneFormData.name}
                  onChange={(value) =>
                    setCloneFormData({ ...cloneFormData, name: String(value) })
                  }
                  placeholder="Enter role name"
                  className={`w-full px-3 py-2 border border-gray-300 text-sm rounded focus:outline-none focus:ring-2 focus:ring-blue-500`}
                />
              </div>

              {/* Code */}
              <div>
                <label className={`block text-sm font-medium ${tw.textPrimary} mb-1`}>
                  Role Code
                </label>
                <Input
                  type="text"
                  value={cloneFormData.code}
                  onChange={(value) =>
                    setCloneFormData({ ...cloneFormData, code: String(value) })
                  }
                  placeholder="Enter role code"
                  className={`w-full px-3 py-2 border border-gray-300 text-sm rounded focus:outline-none focus:ring-2 focus:ring-blue-500`}
                />
              </div>

              {/* Description */}
              <div>
                <label className={`block text-sm font-medium ${tw.textPrimary} mb-1`}>
                  Description
                </label>
                <textarea
                  value={cloneFormData.description}
                  onChange={(e) =>
                    setCloneFormData({ ...cloneFormData, description: e.target.value })
                  }
                  placeholder="Enter description"
                  rows={3}
                  className={`w-full px-3 py-2 border border-gray-300 text-sm rounded focus:outline-none focus:ring-2 focus:ring-blue-500`}
                />
              </div>

            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 justify-end mt-6">
              <button
                onClick={() => {
                  setCloneModalOpen(false);
                  setRoleToClone(null);
                }}
                className="px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmClone}
                disabled={cloningRoleId !== null}
                className="px-4 py-2 text-white font-medium rounded hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                style={{ backgroundColor: color.primary.action }}
              >
                {cloningRoleId !== null && <LoadingSpinner />}
                Copy
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
