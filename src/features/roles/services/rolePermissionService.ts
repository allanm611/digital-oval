import { buildApiUrl, getAuthHeaders } from "../../../shared/services/api";
import {
  RolePermission,
  RolePermissionListResult,
  Permission,
  PermissionListResult,
  Role,
  RoleListMeta,
  AssignPermissionRequest,
  SyncPermissionsRequest,
  RemovePermissionRequest,
  PermissionCountResponse,
  RolePermissionCheckResponse,
  RolePermissionCheckAnyResponse,
  RolePermissionCheckAllResponse,
  PermissionCountByRoleResponse,
} from "../types/role";

const BASE_URL = buildApiUrl("/role-permissions");

class RolePermissionService {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${BASE_URL}${endpoint}`;
    const response = await fetch(url, {
      headers: {
        ...getAuthHeaders(),
        ...options.headers,
      },
      ...options,
    });

    const responseText = await response.text();
    if (!responseText) {
      if (!response.ok) {
        throw new Error(`HTTP ${response.status} ${response.statusText}`);
      }
      return undefined as T;
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(responseText);
    } catch (_) {
      throw new Error(
        `Invalid JSON response from role-permissions API. First 200 chars: ${responseText.substring(
          0,
          200
        )}`
      );
    }

    if (!response.ok) {
      const errorMessage =
        (parsed as { error?: string; message?: string })?.error ||
        (parsed as { message?: string })?.message ||
        response.statusText ||
        "Unknown error";
      throw new Error(errorMessage);
    }

    return parsed as T;
  }

  private buildQueryParams(params?: Record<string, unknown>): string {
    if (!params) return "";
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value === undefined || value === null || value === "") {
        return;
      }
      if (Array.isArray(value)) {
        value.forEach((v) => searchParams.append(key, String(v)));
        return;
      }
      searchParams.append(key, String(value));
    });

    const queryString = searchParams.toString();
    return queryString ? `?${queryString}` : "";
  }

  private extractRolePermissionList(response: unknown): RolePermissionListResult {
    if (Array.isArray(response)) {
      return { rolePermissions: response as RolePermission[] };
    }

    if (response && typeof response === "object") {
      const withData = response as {
        data?: unknown;
        meta?: RoleListMeta;
        rolePermissions?: unknown;
        role_permissions?: unknown;
      };

      if (Array.isArray(withData.data)) {
        return {
          rolePermissions: withData.data as RolePermission[],
          meta: withData.meta,
        };
      }

      if (Array.isArray(withData.rolePermissions)) {
        return {
          rolePermissions: withData.rolePermissions as RolePermission[],
          meta: withData.meta,
        };
      }

      if (Array.isArray(withData.role_permissions)) {
        return {
          rolePermissions: withData.role_permissions as RolePermission[],
          meta: withData.meta,
        };
      }
    }

    throw new Error("Unexpected response shape from role-permissions API");
  }

  private extractPermissionList(response: unknown): Permission[] {
    if (Array.isArray(response)) {
      return response as Permission[];
    }

    if (response && typeof response === "object") {
      const withData = response as {
        data?: unknown;
        permissions?: unknown;
      };

      if (Array.isArray(withData.data)) {
        return withData.data as Permission[];
      }

      if (Array.isArray(withData.permissions)) {
        return withData.permissions as Permission[];
      }
    }

    throw new Error("Unexpected response shape from role-permissions API");
  }

  private extractRoleList(response: unknown): Role[] {
    if (Array.isArray(response)) {
      return response as Role[];
    }

    if (response && typeof response === "object") {
      const withData = response as {
        data?: unknown;
        roles?: unknown;
      };

      if (Array.isArray(withData.data)) {
        return withData.data as Role[];
      }

      if (Array.isArray(withData.roles)) {
        return withData.roles as Role[];
      }
    }

    throw new Error("Unexpected response shape from role-permissions API");
  }

  // GET Endpoints

  async listRolePermissions(query?: {
    limit?: number;
    offset?: number;
    skipCache?: boolean;
  }): Promise<RolePermissionListResult> {
    const queryString = this.buildQueryParams(query);
    const response = await this.request<unknown>(`${queryString}`);
    return this.extractRolePermissionList(response);
  }

  async searchRolePermissions(query?: {
    roleId?: number;
    permissionId?: number;
    createdBy?: number;
    createdAfter?: string;
    createdBefore?: string;
    limit?: number;
    offset?: number;
  }): Promise<RolePermissionListResult> {
    const queryString = this.buildQueryParams(query);
    const response = await this.request<unknown>(`/search${queryString}`);
    return this.extractRolePermissionList(response);
  }

  async getRolePermissions(
    roleId: number,
    query?: { limit?: number; offset?: number; skipCache?: boolean }
  ): Promise<PermissionListResult> {
    const queryString = this.buildQueryParams(query);
    const response = await this.request<unknown>(
      `/roles/${roleId}/permissions${queryString}`
    );

    if (response && typeof response === "object") {
      const withData = response as {
        data?: unknown;
        permissions?: unknown;
        meta?: RoleListMeta;
      };

      const permissions = Array.isArray(withData.data)
        ? (withData.data as Permission[])
        : Array.isArray(withData.permissions)
          ? (withData.permissions as Permission[])
          : Array.isArray(response)
            ? (response as Permission[])
            : [];

      return { permissions, meta: withData.meta };
    }

    if (Array.isArray(response)) {
      return { permissions: response as Permission[] };
    }

    throw new Error("Unexpected response from getRolePermissions");
  }

  async getRoleActivePermissions(roleId: number, query?: { skipCache?: boolean }): Promise<Permission[]> {
    const queryString = this.buildQueryParams(query);
    const response = await this.request<unknown>(
      `/roles/${roleId}/permissions/active${queryString}`
    );
    return this.extractPermissionList(response);
  }

  async getRoleSensitivePermissions(roleId: number, query?: { skipCache?: boolean }): Promise<Permission[]> {
    const queryString = this.buildQueryParams(query);
    const response = await this.request<unknown>(
      `/roles/${roleId}/permissions/sensitive${queryString}`
    );
    return this.extractPermissionList(response);
  }

  async getRoleMfaRequiredPermissions(roleId: number, query?: { skipCache?: boolean }): Promise<Permission[]> {
    const queryString = this.buildQueryParams(query);
    const response = await this.request<unknown>(
      `/roles/${roleId}/permissions/mfa-required${queryString}`
    );
    return this.extractPermissionList(response);
  }

  async getPermissionCountForRole(
    roleId: number,
    query?: { skipCache?: boolean }
  ): Promise<PermissionCountResponse> {
    const queryString = this.buildQueryParams(query);
    const response = await this.request<unknown>(
      `/roles/${roleId}/permissions/count${queryString}`
    );

    if (response && typeof response === "object") {
      const withData = response as { data?: unknown };
      if (withData.data && typeof withData.data === "object") {
        return withData.data as PermissionCountResponse;
      }
    }

    return response as PermissionCountResponse;
  }

  async checkRoleHasPermission(
    roleId: number,
    permissionId: number,
    query?: { skipCache?: boolean }
  ): Promise<RolePermissionCheckResponse> {
    const queryString = this.buildQueryParams(query);
    const response = await this.request<unknown>(
      `/roles/${roleId}/permissions/${permissionId}${queryString}`
    );

    if (response && typeof response === "object") {
      const withData = response as { data?: unknown };
      if (withData.data && typeof withData.data === "object") {
        return withData.data as RolePermissionCheckResponse;
      }
    }

    return response as RolePermissionCheckResponse;
  }

  async checkRoleHasAnyPermission(
    roleId: number,
    permissionIds: number[],
    query?: { skipCache?: boolean }
  ): Promise<RolePermissionCheckAnyResponse> {
    const queryString = this.buildQueryParams({
      permissionIds: permissionIds.join(","),
      ...query,
    });
    const response = await this.request<unknown>(
      `/roles/${roleId}/permissions/check-any${queryString}`
    );

    if (response && typeof response === "object") {
      const withData = response as { data?: unknown };
      if (withData.data && typeof withData.data === "object") {
        return withData.data as RolePermissionCheckAnyResponse;
      }
    }

    return response as RolePermissionCheckAnyResponse;
  }

  async checkRoleHasAllPermissions(
    roleId: number,
    permissionIds: number[],
    query?: { skipCache?: boolean }
  ): Promise<RolePermissionCheckAllResponse> {
    const queryString = this.buildQueryParams({
      permissionIds: permissionIds.join(","),
      ...query,
    });
    const response = await this.request<unknown>(
      `/roles/${roleId}/permissions/check-all${queryString}`
    );

    if (response && typeof response === "object") {
      const withData = response as { data?: unknown };
      if (withData.data && typeof withData.data === "object") {
        return withData.data as RolePermissionCheckAllResponse;
      }
    }

    return response as RolePermissionCheckAllResponse;
  }

  async getPermissionRoles(
    permissionId: number,
    query?: { limit?: number; offset?: number }
  ): Promise<PermissionListResult> {
    const queryString = this.buildQueryParams(query);
    const response = await this.request<unknown>(
      `/permissions/${permissionId}/roles${queryString}`
    );

    if (response && typeof response === "object") {
      const withData = response as {
        data?: unknown;
        permissions?: unknown;
        roles?: unknown;
        meta?: RoleListMeta;
      };

      const roles = Array.isArray(withData.data)
        ? (withData.data as Role[])
        : Array.isArray(withData.roles)
          ? (withData.roles as Role[])
          : Array.isArray(response)
            ? (response as Role[])
            : [];

      return { permissions: roles as unknown as Permission[], meta: withData.meta };
    }

    if (Array.isArray(response)) {
      return { permissions: response as unknown as Permission[] };
    }

    throw new Error("Unexpected response from getPermissionRoles");
  }

  async getPermissionActiveRoles(permissionId: number): Promise<Role[]> {
    const response = await this.request<unknown>(
      `/permissions/${permissionId}/roles/active`
    );
    return this.extractRoleList(response);
  }

  async getPermissionRoleCount(
    permissionId: number
  ): Promise<PermissionCountByRoleResponse> {
    const response = await this.request<unknown>(
      `/permissions/${permissionId}/roles/count`
    );

    if (response && typeof response === "object") {
      const withData = response as { data?: unknown };
      if (withData.data && typeof withData.data === "object") {
        return withData.data as PermissionCountByRoleResponse;
      }
    }

    return response as PermissionCountByRoleResponse;
  }

  // POST Endpoints

  async assignPermissionToRole(
    roleId: number,
    body: AssignPermissionRequest
  ): Promise<RolePermission[]> {
    const response = await this.request<unknown>(
      `/roles/${roleId}/permissions`,
      {
        method: "POST",
        body: JSON.stringify(body),
      }
    );

    // Handle the API response format: {success: true, data: {assigned, skipped, ...}}
    // For now, return an array with the assigned count to indicate success
    if (response && typeof response === "object") {
      const withData = response as { data?: unknown; success?: boolean };
      if (withData.data && typeof withData.data === "object") {
        const data = withData.data as { assigned?: number; skipped?: number };

        // Create dummy RolePermission objects equal to the assigned count
        // This allows the handler to count how many were successfully assigned
        if (data.assigned && data.assigned > 0) {
          return Array(data.assigned).fill(null).map((_, i) => ({
            id: i,
            role_id: roleId,
            permission_id: i,
            created_at: new Date().toISOString(),
            created_by: body.createdBy,
          } as any));
        } else {
          return [];
        }
      }
    }

    // If response is already an array of RolePermission objects, extract normally
    try {
      const extracted = this.extractRolePermissionList(response).rolePermissions;
      return extracted;
    } catch (err) {
      // If extraction fails, return empty array (nothing assigned)
      return [];
    }
  }

  async syncRolePermissions(
    roleId: number,
    body: SyncPermissionsRequest
  ): Promise<{
    role_id: number;
    added: number[];
    removed: number[];
    total_permissions: number;
  }> {
    const response = await this.request<unknown>(
      `/roles/${roleId}/permissions/sync`,
      {
        method: "POST",
        body: JSON.stringify(body),
      }
    );

    if (response && typeof response === "object") {
      const withData = response as { data?: unknown };
      if (withData.data && typeof withData.data === "object") {
        return withData.data as {
          role_id: number;
          added: number[];
          removed: number[];
          total_permissions: number;
        };
      }
    }

    return response as {
      role_id: number;
      added: number[];
      removed: number[];
      total_permissions: number;
    };
  }

  async copyPermissionsFromRole(
    roleId: number,
    sourceRoleId: number,
    body?: { createdBy?: number }
  ): Promise<{
    target_role_id: number;
    source_role_id: number;
    permissions_copied: number;
    total_permissions_now: number;
  }> {
    const response = await this.request<unknown>(
      `/roles/${roleId}/permissions/copy-from/${sourceRoleId}`,
      {
        method: "POST",
        body: body ? JSON.stringify(body) : undefined,
      }
    );

    if (response && typeof response === "object") {
      const withData = response as { data?: unknown };
      if (withData.data && typeof withData.data === "object") {
        return withData.data as {
          target_role_id: number;
          source_role_id: number;
          permissions_copied: number;
          total_permissions_now: number;
        };
      }
    }

    return response as {
      target_role_id: number;
      source_role_id: number;
      permissions_copied: number;
      total_permissions_now: number;
    };
  }

  async migrateDeprecatedPermissions(
    roleId: number,
    body?: { createdBy?: number }
  ): Promise<{
    role_id: number;
    migrated: Array<{
      from_permission_id: number;
      from_permission_code: string;
      to_permission_id: number;
      to_permission_code: string;
    }>;
    total_migrated: number;
  }> {
    const response = await this.request<unknown>(
      `/roles/${roleId}/permissions/migrate-deprecated`,
      {
        method: "POST",
        body: body ? JSON.stringify(body) : undefined,
      }
    );

    if (response && typeof response === "object") {
      const withData = response as { data?: unknown };
      if (withData.data && typeof withData.data === "object") {
        return withData.data as {
          role_id: number;
          migrated: Array<{
            from_permission_id: number;
            from_permission_code: string;
            to_permission_id: number;
            to_permission_code: string;
          }>;
          total_migrated: number;
        };
      }
    }

    return response as {
      role_id: number;
      migrated: Array<{
        from_permission_id: number;
        from_permission_code: string;
        to_permission_id: number;
        to_permission_code: string;
      }>;
      total_migrated: number;
    };
  }

  // DELETE Endpoints

  async removePermissionFromRole(
    roleId: number,
    permissionId: number
  ): Promise<{ success: boolean; message: string; remaining_permissions: number }> {
    const response = await this.request<unknown>(
      `/roles/${roleId}/permissions/${permissionId}`,
      {
        method: "DELETE",
      }
    );

    if (response && typeof response === "object") {
      const withData = response as { data?: unknown };
      if (withData.data && typeof withData.data === "object") {
        return withData.data as {
          success: boolean;
          message: string;
          remaining_permissions: number;
        };
      }
    }

    return response as {
      success: boolean;
      message: string;
      remaining_permissions: number;
    };
  }

  async removePermissionsFromRole(
    roleId: number,
    body: RemovePermissionRequest
  ): Promise<{
    success: boolean;
    message: string;
    removed_count: number;
    remaining_permissions: number;
  }> {
    const response = await this.request<unknown>(
      `/roles/${roleId}/permissions`,
      {
        method: "DELETE",
        body: JSON.stringify(body),
      }
    );

    if (response && typeof response === "object") {
      const withData = response as { data?: unknown };
      if (withData.data && typeof withData.data === "object") {
        return withData.data as {
          success: boolean;
          message: string;
          removed_count: number;
          remaining_permissions: number;
        };
      }
    }

    return response as {
      success: boolean;
      message: string;
      removed_count: number;
      remaining_permissions: number;
    };
  }
}

export const rolePermissionService = new RolePermissionService();
