import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import {
  Check,
  Plus,
  Search,
  AlertCircle,
  // Square,
  // CheckSquare,
  X,
  Trash2,
} from "lucide-react";
import { useToast } from "../../../contexts/ToastContext";
import { useAuth } from "../../../contexts/AuthContext";
import { Role, Permission } from "../types/role";
import { rolePermissionService } from "../services/rolePermissionService";
import { permissionService } from "../services/permissionService";
import { color, tw } from "../../../shared/utils/utils";
import LoadingSpinner from "../../../shared/components/ui/LoadingSpinner";
import HeadlessSelect from "../../../shared/components/ui/HeadlessSelect";
import Pagination from "../../../shared/components/ui/Pagination";

interface AssignPermissionsModalProps {
  isOpen: boolean;
  rolesList: Role[];
  selectedRole?: Role;
  onRoleSelect: (role: Role | undefined) => void;
  onPermissionsChanged: () => void;
  userId?: number;
  isSelectionMode?: boolean;
  onSelectionModeChange?: (mode: boolean) => void;
}

export default function AssignPermissionsModal({
  isOpen,
  rolesList,
  selectedRole,
  onRoleSelect,
  onPermissionsChanged,
  userId: propUserId,
  isSelectionMode: propIsSelectionMode,
  onSelectionModeChange,
}: AssignPermissionsModalProps) {
  const { success, error: showError } = useToast();
  const { user, permissions: userPermissions, updatePermissions } = useAuth();

  const userId = propUserId || user?.user_id;

  useEffect(() => {}, [userId]);

  const [allPermissions, setAllPermissions] = useState<Permission[]>([]);
  const [assignedPermissions, setAssignedPermissions] = useState<Permission[]>(
    [],
  );
  const [isLoading, setIsLoading] = useState(false);
  const [isTogglingPermission, setIsTogglingPermission] = useState<
    number | null
  >(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPermissionIds, setSelectedPermissionIds] = useState<
    Set<number>
  >(new Set());
  const [isAssigning, setIsAssigning] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const headerCheckboxRef = useRef<HTMLInputElement | null>(null);
  const [localIsSelectionMode, setLocalIsSelectionMode] = useState(false);
  const [permissionsPaginationModel, setPermissionsPaginationModel] = useState({
    page: 0,
    pageSize: 20,
  });
  // Use prop if provided by parent, otherwise use local state
  const isSelectionMode =
    propIsSelectionMode !== undefined
      ? propIsSelectionMode
      : localIsSelectionMode;
  const handleSetSelectionMode = useCallback(
    (mode: boolean) => {
      if (onSelectionModeChange) {
        onSelectionModeChange(mode);
      } else {
        setLocalIsSelectionMode(mode);
      }
    },
    [onSelectionModeChange],
  );

  // Log current user's role information
  useEffect(() => {
    if (selectedRole && selectedRole.id === user?.user_id) {
      // User is modifying their own role
    }
  }, [selectedRole, user]);

  useEffect(() => {
    if (!isOpen) return;

    const loadPermissions = async () => {
      try {
        setIsLoading(true);

        const permissionsArray = await permissionService.getActivePermissions({
          limit: 100,
          offset: 0,
          skipCache: true,
        });

        const permsToSet = Array.isArray(permissionsArray)
          ? permissionsArray
          : [];
        setAllPermissions(permsToSet);
      } catch (err) {
        showError(
          "Error",
          err instanceof Error ? err.message : "Failed to load permissions",
        );
      } finally {
        setIsLoading(false);
      }
    };

    loadPermissions();
  }, [isOpen, showError]);

  const loadAssignedPermissions = useCallback(async () => {
    if (!selectedRole) return;

    try {
      setIsLoading(true);

      const rolePermsResponse = await rolePermissionService.getRolePermissions(
        selectedRole.id,
        {
          limit: 100,
          offset: 0,
          skipCache: true, // Force fresh data, don't use cached response
        },
      );

      // Handle both 'permissions' and 'rolePermissions' keys from API
      let rolePerms = [];
      if (Array.isArray(rolePermsResponse)) {
        rolePerms = rolePermsResponse;
      } else if (rolePermsResponse && typeof rolePermsResponse === "object") {
        // Try 'permissions' key first (what the API returns)
        if ((rolePermsResponse as any)?.permissions) {
          rolePerms = (rolePermsResponse as any).permissions;
        }
        // Fall back to 'rolePermissions' key
        else if ((rolePermsResponse as any)?.rolePermissions) {
          rolePerms = (rolePermsResponse as any).rolePermissions;
        }
      }

      // Handle two response formats:
      // 1. Permission objects with 'id' directly: {id: 1, name: "...", ...}
      // 2. RolePermission objects with 'permission_id': {permission_id: 1, ...}
      const assigned = rolePerms
        .map((rp: any) => {
          const permId = rp.id || rp.permission_id;

          // If it's already a full Permission object, use it directly
          if (rp.name && rp.code) {
            return rp as Permission;
          }
          // Otherwise find it in allPermissions
          return allPermissions.find((p: Permission) => p.id === permId);
        })
        .filter((p: Permission | undefined) => p !== undefined) as Permission[];

      setAssignedPermissions(assigned);
    } catch (err) {
      showError(
        "Error",
        err instanceof Error
          ? err.message
          : "Failed to load assigned permissions",
      );
    } finally {
      setIsLoading(false);
    }
  }, [selectedRole, allPermissions, showError]);

  useEffect(() => {
    if (!selectedRole || !isOpen) {
      setAssignedPermissions([]);
      handleSetSelectionMode(false);
      setSelectedPermissionIds(new Set());
      return;
    }

    loadAssignedPermissions();
  }, [selectedRole, isOpen, loadAssignedPermissions, handleSetSelectionMode]);

  // Reset pagination when search term changes
  useEffect(() => {
    setPermissionsPaginationModel({ page: 0, pageSize: 20 });
  }, [searchTerm]);

  const handleTogglePermission = async (permission: Permission) => {
    if (!selectedRole) {
      showError("Error", "Role not selected. Please select a role first.");
      return;
    }

    if (!userId) {
      showError("Error", "User ID not found. Please refresh the page.");
      return;
    }

    const isAssigned = assignedPermissions.some((p) => p.id === permission.id);

    try {
      setIsTogglingPermission(permission.id);

      if (isAssigned) {
        await rolePermissionService.removePermissionsFromRole(selectedRole.id, {
          permissionIds: [permission.id],
        });
        setAssignedPermissions(
          assignedPermissions.filter((p) => p.id !== permission.id),
        );
        success("Success", `Permission removed from role`);

        // If user has this role, remove the permission from their context
        if (selectedRole.id === user?.user_id) {
          const updatedUserPermissions = userPermissions.filter(
            (p) => p !== permission.code,
          );
          updatePermissions(updatedUserPermissions);
        }
      } else {
        await rolePermissionService.assignPermissionToRole(selectedRole.id, {
          permissionIds: [permission.id],
          createdBy: userId,
        });
        setAssignedPermissions([...assignedPermissions, permission]);
        success("Success", `Permission assigned to role`);

        // If user has this role, add the permission to their context
        if (selectedRole.id === user?.user_id) {
          if (!userPermissions.includes(permission.code)) {
            updatePermissions([...userPermissions, permission.code]);
          }
        }
      }

      // Reload assigned permissions to show the actual state from backend
      await loadAssignedPermissions();

      onPermissionsChanged();
    } catch (err) {
      console.error("Error toggling permission:", err);
      showError(
        "Error",
        err instanceof Error ? err.message : "Failed to toggle permission",
      );
    } finally {
      setIsTogglingPermission(null);
    }
  };

  const assignedIds = useMemo(
    () => new Set(assignedPermissions.map((p) => p.id)),
    [assignedPermissions],
  );

  const filteredRoles = useMemo(() => {
    // Display all roles including system roles
    // return rolesList.filter((role) => !role.is_system_role);
    return rolesList;
  }, [rolesList]);

  const filteredPermissions = useMemo(() => {
    if (!searchTerm) return allPermissions;
    const term = searchTerm.toLowerCase();
    return allPermissions.filter(
      (p) =>
        p.name.toLowerCase().includes(term) ||
        p.code.toLowerCase().includes(term) ||
        p.action.toLowerCase().includes(term),
    );
  }, [allPermissions, searchTerm]);

  const paginatedPermissions = useMemo(() => {
    const start =
      permissionsPaginationModel.page * permissionsPaginationModel.pageSize;
    const end = start + permissionsPaginationModel.pageSize;
    return filteredPermissions.slice(start, end);
  }, [filteredPermissions, permissionsPaginationModel]);

  const visibleIds = useMemo(
    () => filteredPermissions.map((p) => p.id),
    [filteredPermissions],
  );

  // Only consider unassigned visible permissions for selection state
  const unassignedVisibleIds = useMemo(
    () => visibleIds.filter((id) => !assignedIds.has(id)),
    [visibleIds, assignedIds],
  );

  // Get assigned visible permissions (for context-aware select all)
  const assignedVisibleIds = useMemo(
    () => visibleIds.filter((id) => assignedIds.has(id)),
    [visibleIds, assignedIds],
  );

  // Context-aware: if there are unassigned visible, use those; otherwise use assigned visible
  const contextVisibleIds =
    unassignedVisibleIds.length > 0 ? unassignedVisibleIds : assignedVisibleIds;

  const allVisibleSelected =
    contextVisibleIds.length > 0 &&
    contextVisibleIds.every((id) => selectedPermissionIds.has(id));

  const someVisibleSelected = contextVisibleIds.some((id) =>
    selectedPermissionIds.has(id),
  );

  useEffect(() => {
    if (headerCheckboxRef.current) {
      headerCheckboxRef.current.indeterminate =
        someVisibleSelected && !allVisibleSelected;
    }
  }, [someVisibleSelected, allVisibleSelected]);

  // Auto-select all unassigned permissions when entering selection mode
  useEffect(() => {
    if (isSelectionMode && selectedPermissionIds.size === 0 && selectedRole) {
      // Auto-select all unassigned permissions
      const allUnassigned = allPermissions.filter(
        (p) => !assignedIds.has(p.id),
      );
      if (allUnassigned.length > 0) {
        setSelectedPermissionIds(new Set(allUnassigned.map((p) => p.id)));
      }
    }
  }, [isSelectionMode, selectedRole]);

  // Check if all selected permissions are already assigned
  const hasUnassignedSelected = useMemo(() => {
    const selectedArray = Array.from(selectedPermissionIds);
    return selectedArray.some((id) => !assignedIds.has(id));
  }, [selectedPermissionIds, assignedIds]);

  // Check if we have any assigned permissions selected (for remove)
  const hasAssignedSelected = useMemo(() => {
    const selectedArray = Array.from(selectedPermissionIds);
    return selectedArray.some((id) => assignedIds.has(id));
  }, [selectedPermissionIds, assignedIds]);

  // Count how many visible permissions are assigned vs unassigned
  const visibleAssignedCount = useMemo(
    () => assignedVisibleIds.length,
    [assignedVisibleIds],
  );

  const visibleUnassignedCount = useMemo(
    () => unassignedVisibleIds.length,
    [unassignedVisibleIds],
  );

  // Determine button visibility based on visible permissions
  const showOnlyAssignButton = useMemo(
    () => visibleUnassignedCount > 0 && visibleAssignedCount === 0,
    [visibleUnassignedCount, visibleAssignedCount],
  );

  const showOnlyRemoveButton = useMemo(
    () => visibleAssignedCount > 0 && visibleUnassignedCount === 0,
    [visibleAssignedCount, visibleUnassignedCount],
  );

  const showBothButtons = useMemo(
    () => visibleAssignedCount > 0 && visibleUnassignedCount > 0,
    [visibleAssignedCount, visibleUnassignedCount],
  );

  const togglePermissionSelection = (id: number) => {
    setSelectedPermissionIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleSelectAllVisible = () => {
    if (contextVisibleIds.length === 0) return;

    setSelectedPermissionIds((prev) => {
      const next = new Set(prev);
      const allContextSelected = contextVisibleIds.every((id) => next.has(id));

      if (allContextSelected) {
        // Deselect all in context
        contextVisibleIds.forEach((id) => next.delete(id));
      } else {
        // Select all in context
        contextVisibleIds.forEach((id) => next.add(id));
      }
      return next;
    });
  };

  const handleBulkAssign = async () => {
    if (!selectedRole || !userId || selectedPermissionIds.size === 0) return;

    // Filter out permissions that are already assigned
    const idsArray = Array.from(selectedPermissionIds);
    const unassignedIds = idsArray.filter((id) => !assignedIds.has(id));

    if (unassignedIds.length === 0) {
      showError(
        "No Action Needed",
        "All selected permissions are already assigned to this role",
      );
      return;
    }

    setIsAssigning(true);
    try {
      const response = await rolePermissionService.assignPermissionToRole(
        selectedRole.id,
        {
          permissionIds: unassignedIds,
          createdBy: userId,
        },
      );

      // response is the list of RolePermission[] that were assigned
      const assignedCount = response.length;

      // Update local state - add all newly assigned permissions
      const newlyAssigned = allPermissions.filter((p) =>
        response.some((rp: any) => rp.permission_id === p.id),
      );

      setAssignedPermissions((prev) => [...prev, ...newlyAssigned]);

      if (assignedCount > 0) {
        
        success(
          "Permissions Assigned",
          `${assignedCount} permission(s) assigned to ${selectedRole.name}`,
        );
      } else {
        showError(
          "No Permissions Assigned",
          "All selected permissions were already assigned to this role",
        );
      }

      // Clear selection and exit selection mode
      setSelectedPermissionIds(new Set());
      handleSetSelectionMode(false);

      // Reload assigned permissions to show accurate count
      await loadAssignedPermissions();

      // Notify parent to refresh if needed
      onPermissionsChanged();
    } catch (err) {
      showError(
        "Assignment Failed",
        err instanceof Error ? err.message : "Failed to assign permissions",
      );
    } finally {
      setIsAssigning(false);
    }
  };

  const handleBulkRemove = async () => {
    if (!selectedRole || selectedPermissionIds.size === 0) return;

    // Filter to only include permissions that are assigned
    const idsArray = Array.from(selectedPermissionIds);
    const assignedToRemove = idsArray.filter((id) => assignedIds.has(id));

    if (assignedToRemove.length === 0) {
      showError(
        "No Action Needed",
        "No assigned permissions selected to remove",
      );
      return;
    }

    setIsRemoving(true);
    try {
      await rolePermissionService.removePermissionsFromRole(selectedRole.id, {
        permissionIds: assignedToRemove,
      });

      // Update local state - remove the permissions from assignedPermissions
      const removedIds = new Set(assignedToRemove);
      setAssignedPermissions((prev) =>
        prev.filter((p) => !removedIds.has(p.id)),
      );

      success(
        "Permissions Removed",
        `${assignedToRemove.length} permission(s) removed from ${selectedRole.name}`,
      );

      // Clear selection and exit selection mode
      setSelectedPermissionIds(new Set());
      handleSetSelectionMode(false);

      // Reload assigned permissions to show accurate count
      await loadAssignedPermissions();

      // Notify parent to refresh if needed
      onPermissionsChanged();
    } catch (err) {
      showError(
        "Removal Failed",
        err instanceof Error ? err.message : "Failed to remove permissions",
      );
    } finally {
      setIsRemoving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="space-y-4">
      {/* Role Selector */}
      <div className="border border-gray-200 rounded-lg p-0">
        <div className="flex flex-row gap-3 items-center p-4">
          <label className="text-sm font-medium text-gray-700 whitespace-nowrap">
            Select Role
          </label>
          <div className="w-1/2">
            <HeadlessSelect
              options={[
                { value: "", label: "Select a role..." },
                ...filteredRoles.map((role) => ({
                  value: String(role.id),
                  label: `${role.name} (Level ${role.role_level})`,
                })),
              ]}
              value={selectedRole?.id ? String(selectedRole.id) : ""}
              onChange={(value) => {
                const roleId = value === "" ? null : Number(value);
                const role = roleId
                  ? filteredRoles.find((r) => r.id === roleId)
                  : undefined;
                onRoleSelect(role);
                setSearchTerm("");
                // Clear selection when role changes
                setSelectedPermissionIds(new Set());
              }}
            />
          </div>

          {selectedRole && (
            <div
              className="px-3 py-2 rounded-md text-sm font-semibold border whitespace-nowrap"
              style={{
                backgroundColor: color.primary.action + "10",
                borderColor: color.primary.action,
                color: color.primary.action,
              }}
            >
              {assignedIds.size}/{allPermissions.length} assigned
            </div>
          )}
        </div>
      </div>

      {/* Permissions Table */}
      {selectedRole ? (
        <div className="space-y-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search permissions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Bulk Actions Toolbar */}
          {isSelectionMode && selectedPermissionIds.size > 0 && (
            <div className="flex items-center justify-between rounded border border-gray-200 bg-white px-4 py-3 mb-4">
              {/* Left: Count + Clear */}
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-700">
                  {selectedPermissionIds.size} permission(s) selected
                </span>
                <button
                  onClick={() => setSelectedPermissionIds(new Set())}
                  className="text-gray-500 hover:text-gray-700 transition-colors"
                  title="Clear selection"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Right: Bulk Actions */}
              <div className="flex items-center gap-2">
                {/* Show Assign button if there are unassigned permissions */}
                {(showOnlyAssignButton || showBothButtons) && (
                  <button
                    onClick={handleBulkAssign}
                    disabled={
                      isAssigning ||
                      isRemoving ||
                      !selectedRole ||
                      !hasUnassignedSelected
                    }
                    title={
                      !hasUnassignedSelected
                        ? "All selected permissions are already assigned"
                        : "Assign selected permissions to role"
                    }
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ backgroundColor: color.primary.action }}
                  >
                    {isAssigning && <LoadingSpinner />}
                    <Plus size={14} />
                    Assign Selected
                  </button>
                )}

                {/* Show Remove button if there are assigned permissions */}
                {(showOnlyRemoveButton || showBothButtons) && (
                  <button
                    onClick={handleBulkRemove}
                    disabled={
                      isAssigning ||
                      isRemoving ||
                      !selectedRole ||
                      !hasAssignedSelected
                    }
                    title={
                      !hasAssignedSelected
                        ? "No assigned permissions selected to remove"
                        : "Remove selected permissions from role"
                    }
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{
                      backgroundColor: color.status.danger || "#dc2626",
                    }}
                  >
                    {isRemoving && <LoadingSpinner />}
                    <Trash2 size={14} />
                    Remove Selected
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Table */}
          {isLoading ? (
            <div className="flex justify-center py-8">
              <LoadingSpinner />
            </div>
          ) : (
            <div className="overflow-x-auto border border-gray-200 rounded-lg">
              <table
                className="w-full min-w-[800px]"
                style={{ borderCollapse: "separate", borderSpacing: "0 8px" }}
              >
                <thead style={{ background: color.surface.tableHeader }}>
                  <tr>
                    {isSelectionMode && (
                      <th
                        className="px-4 py-3 sm:py-4 text-left"
                        style={{ color: color.surface.tableHeaderText }}
                      >
                        <input
                          ref={headerCheckboxRef}
                          type="checkbox"
                          checked={allVisibleSelected}
                          onChange={toggleSelectAllVisible}
                          aria-label="Select all visible permissions"
                          className="cursor-pointer w-4 h-4"
                        />
                      </th>
                    )}
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
                      className="px-4 sm:px-6 py-3 sm:py-4 text-center text-xs font-medium uppercase tracking-wider"
                      style={{ color: color.surface.tableHeaderText }}
                    >
                      Assign/Unassign
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedPermissions.map((permission) => {
                    const isAssigned = assignedIds.has(permission.id);
                    const isToggling = isTogglingPermission === permission.id;
                    const isSelected = selectedPermissionIds.has(permission.id);

                    return (
                      <tr key={permission.id} className="transition-colors">
                        {isSelectionMode && (
                          <td
                            className="px-4 py-3 sm:py-4 text-sm"
                            style={{
                              backgroundColor: color.surface.tablebodybg,
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              disabled={isAssigned}
                              onChange={(e) => {
                                e.stopPropagation();
                                togglePermissionSelection(permission.id);
                              }}
                              aria-label={`Select ${permission.name}`}
                              className={`cursor-pointer w-4 h-4 ${
                                isAssigned
                                  ? "opacity-50 cursor-not-allowed"
                                  : ""
                              }`}
                            />
                            {isAssigned && (
                              <span
                                className="ml-2 text-xs font-medium"
                                style={{ color: color.primary.accent }}
                              >
                                (Already assigned)
                              </span>
                            )}
                          </td>
                        )}
                        <td
                          className="px-4 sm:px-6 py-3 sm:py-4 text-sm text-gray-900 font-medium"
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
                          className="px-4 sm:px-6 py-3 sm:py-4 text-sm"
                          style={{ backgroundColor: color.surface.tablebodybg }}
                        >
                          <span
                            className={`text-sm font-medium ${
                              permission.is_sensitive
                                ? "text-red-600"
                                : "text-gray-600"
                            }`}
                          >
                            {permission.is_sensitive ? "Yes" : "No"}
                          </span>
                        </td>
                        <td
                          className="px-4 sm:px-6 py-3 sm:py-4 text-sm text-center"
                          style={{ backgroundColor: color.surface.tablebodybg }}
                        >
                          <div className="inline-flex items-center gap-2">
                            {/* Assign Button - Action style (filled) */}
                            <button
                              onClick={() => handleTogglePermission(permission)}
                              disabled={isToggling || isAssigned}
                              className="px-4 py-2 text-sm font-medium rounded-md text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                              style={{
                                backgroundColor: color.primary.action,
                              }}
                              title={
                                isAssigned
                                  ? "Already assigned"
                                  : "Click to assign"
                              }
                            >
                              {isToggling && !isAssigned ? (
                                <LoadingSpinner />
                              ) : (
                                "Assign"
                              )}
                            </button>

                            {/* Unassign Button - Bordered style */}
                            <button
                              onClick={() => handleTogglePermission(permission)}
                              disabled={isToggling || !isAssigned}
                              className="px-4 py-2 text-sm font-medium rounded-md border transition-colors bg-transparent disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0 hover:text-white"
                              style={{
                                borderColor: isAssigned
                                  ? color.primary.action
                                  : "#D1D5DB",
                                color: isAssigned
                                  ? color.primary.action
                                  : "#9CA3AF",
                              }}
                              title={
                                isAssigned
                                  ? "Click to unassign"
                                  : "Not assigned"
                              }
                            >
                              {isToggling && isAssigned ? (
                                <LoadingSpinner />
                              ) : (
                                "Unassign"
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
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
      ) : (
        <div
          className="border-2 border-dashed rounded-lg p-8 text-center"
          style={{
            borderColor: color.primary.action + "40",
            backgroundColor: color.primary.action + "08",
          }}
        >
          <div className="flex justify-center mb-3">
            <AlertCircle
              className="w-6 h-6"
              style={{ color: color.primary.action }}
            />
          </div>
          <p
            className="text-sm font-medium"
            style={{ color: color.primary.action }}
          >
            Select a role to manage its permissions
          </p>
        </div>
      )}
    </div>
  );
}
