import { useState, useEffect, useMemo } from "react";
import { Check, Plus, Search, AlertCircle } from "lucide-react";
import { useToast } from "../../../contexts/ToastContext";
import { useAuth } from "../../../contexts/AuthContext";
import { Role, Permission } from "../types/role";
import { rolePermissionService } from "../services/rolePermissionService";
import { permissionService } from "../services/permissionService";
import { color } from "../../../shared/utils/utils";
import LoadingSpinner from "../../../shared/components/ui/LoadingSpinner";
import HeadlessSelect from "../../../shared/components/ui/HeadlessSelect";

interface AssignPermissionsModalProps {
  isOpen: boolean;
  rolesList: Role[];
  selectedRole?: Role;
  onRoleSelect: (role: Role | undefined) => void;
  onPermissionsChanged: () => void;
  userId?: number;
}

export default function AssignPermissionsModal({
  isOpen,
  rolesList,
  selectedRole,
  onRoleSelect,
  onPermissionsChanged,
  userId: propUserId,
}: AssignPermissionsModalProps) {
  const { success, error: showError } = useToast();
  const { user } = useAuth();

  const userId = propUserId || user?.user_id;

  useEffect(() => {
  }, [userId]);

  const [allPermissions, setAllPermissions] = useState<Permission[]>([]);
  const [assignedPermissions, setAssignedPermissions] = useState<Permission[]>(
    [],
  );
  const [isLoading, setIsLoading] = useState(false);
  const [isTogglingPermission, setIsTogglingPermission] = useState<
    number | null
  >(null);
  const [searchTerm, setSearchTerm] = useState("");

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
        setAllPermissions(
          Array.isArray(permissionsArray) ? permissionsArray : [],
        );
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

  useEffect(() => {
    if (!selectedRole || !isOpen) {
      setAssignedPermissions([]);
      return;
    }

    const loadAssignedPermissions = async () => {
      try {
        setIsLoading(true);
        const rolePermsResponse =
          await rolePermissionService.getRolePermissions(selectedRole.id, {
            limit: 100,
            offset: 0,
          });

        const rolePerms = Array.isArray(rolePermsResponse)
          ? rolePermsResponse
          : (rolePermsResponse as any)?.rolePermissions || [];

        const assigned = rolePerms
          .map((rp: any) => allPermissions.find((p: Permission) => p.id === rp.permission_id))
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
    };

    loadAssignedPermissions();
  }, [selectedRole, allPermissions, isOpen, showError]);

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
      } else {
        await rolePermissionService.assignPermissionToRole(selectedRole.id, {
          permissionIds: [permission.id],
          createdBy: userId,
        });
        setAssignedPermissions([...assignedPermissions, permission]);
        success("Success", `Permission assigned to role`);
      }

      onPermissionsChanged();
    } catch (err) {
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
                ...rolesList.map((role) => ({
                  value: String(role.id),
                  label: `${role.name} (Level ${role.role_level})`,
                })),
              ]}
              value={selectedRole?.id ? String(selectedRole.id) : ""}
              onChange={(value) => {
                const roleId = value === "" ? null : Number(value);
                const role = roleId
                  ? rolesList.find((r) => r.id === roleId)
                  : undefined;
                onRoleSelect(role);
                setSearchTerm("");
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
                      Assigned
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPermissions.map((permission) => {
                    const isAssigned = assignedIds.has(permission.id);
                    const isToggling = isTogglingPermission === permission.id;

                    return (
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
                          className="px-4 sm:px-6 py-3 sm:py-4 text-sm text-center"
                          style={{ backgroundColor: color.surface.tablebodybg }}
                        >
                          <button
                            onClick={() => handleTogglePermission(permission)}
                            disabled={isToggling}
                            className={`inline-flex items-center justify-center p-1.5 rounded transition-colors ${
                              isAssigned
                                ? "text-green-600 hover:bg-green-50"
                                : "text-gray-600 hover:bg-blue-50 hover:text-blue-600"
                            } disabled:opacity-50 disabled:cursor-not-allowed`}
                            title={
                              isAssigned ? "Click to remove" : "Click to assign"
                            }
                          >
                            {isToggling ? (
                              <LoadingSpinner />
                            ) : isAssigned ? (
                              <Check className="w-5 h-5" />
                            ) : (
                              <Plus className="w-5 h-5" />
                            )}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
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
