import { buildApiUrl, getAuthHeaders } from "../../../shared/services/api";
import {
  Permission,
  PermissionListResult,
  CreatePermissionRequest,
  UpdatePermissionRequest,
  RoleListMeta,
} from "../types/role";

const BASE_URL = buildApiUrl("/permissions");

class PermissionService {
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
        `Invalid JSON response from permissions API. First 200 chars: ${responseText.substring(
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

  private extractPermissionList(response: unknown): PermissionListResult {
    if (Array.isArray(response)) {
      return { permissions: response as Permission[] };
    }

    if (response && typeof response === "object") {
      const withData = response as {
        data?: unknown;
        meta?: RoleListMeta;
        permissions?: unknown;
      };

      if (Array.isArray(withData.data)) {
        return {
          permissions: withData.data as Permission[],
          meta: withData.meta,
        };
      }

      if (Array.isArray(withData.permissions)) {
        return {
          permissions: withData.permissions as Permission[],
          meta: withData.meta,
        };
      }
    }

    throw new Error("Unexpected response shape from permissions API");
  }

  private extractPermission(response: unknown): Permission | null {
    if (!response || typeof response !== "object") {
      return null;
    }

    if (Array.isArray(response)) {
      return null;
    }

    const withData = response as { data?: unknown; permission?: unknown };
    if (withData.data && typeof withData.data === "object") {
      return withData.data as Permission;
    }

    if (withData.permission && typeof withData.permission === "object") {
      return withData.permission as Permission;
    }

    return response as Permission;
  }

  // GET Endpoints

  async listPermissions(query?: {
    limit?: number;
    offset?: number;
  }): Promise<PermissionListResult> {
    const queryString = this.buildQueryParams(query);
    const response = await this.request<unknown>(`${queryString}`);
    return this.extractPermissionList(response);
  }

  async getActivePermissions(query?: {
    limit?: number;
    offset?: number;
    skipCache?: boolean;
  }): Promise<Permission[]> {
    const queryString = this.buildQueryParams(query);
    const response = await this.request<unknown>(`/active${queryString}`);
    return this.extractPermissionList(response).permissions;
  }

  async getAssignablePermissions(query?: {
    limit?: number;
    offset?: number;
  }): Promise<Permission[]> {
    const queryString = this.buildQueryParams(query);
    const response = await this.request<unknown>(`/assignable${queryString}`);
    return this.extractPermissionList(response).permissions;
  }

  async getDeprecatedPermissions(query?: {
    limit?: number;
    offset?: number;
  }): Promise<Permission[]> {
    const queryString = this.buildQueryParams(query);
    const response = await this.request<unknown>(`/deprecated${queryString}`);
    return this.extractPermissionList(response).permissions;
  }

  async getSensitivePermissions(query?: {
    limit?: number;
    offset?: number;
  }): Promise<Permission[]> {
    const queryString = this.buildQueryParams(query);
    const response = await this.request<unknown>(`/sensitive${queryString}`);
    return this.extractPermissionList(response).permissions;
  }

  async getPermissionsRequiringMfa(query?: {
    limit?: number;
    offset?: number;
  }): Promise<Permission[]> {
    const queryString = this.buildQueryParams(query);
    const response = await this.request<unknown>(
      `/requiring-mfa${queryString}`
    );
    return this.extractPermissionList(response).permissions;
  }

  async getPermissionsRequiringJustification(query?: {
    limit?: number;
    offset?: number;
  }): Promise<Permission[]> {
    const queryString = this.buildQueryParams(query);
    const response = await this.request<unknown>(
      `/requiring-justification${queryString}`
    );
    return this.extractPermissionList(response).permissions;
  }

  async getSystemPermissions(query?: {
    activeOnly?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<Permission[]> {
    const queryString = this.buildQueryParams(query);
    const response = await this.request<unknown>(`/system${queryString}`);
    return this.extractPermissionList(response).permissions;
  }

  async getPermissionsNeedingMigration(query?: {
    limit?: number;
    offset?: number;
  }): Promise<Permission[]> {
    const queryString = this.buildQueryParams(query);
    const response = await this.request<unknown>(
      `/needing-migration${queryString}`
    );
    return this.extractPermissionList(response).permissions;
  }

  async searchPermissions(query: {
    q: string;
    activeOnly?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<PermissionListResult> {
    const queryString = this.buildQueryParams(query);
    const response = await this.request<unknown>(`/search${queryString}`);
    return this.extractPermissionList(response);
  }

  async getPermissionByCode(code: string): Promise<Permission> {
    const response = await this.request<unknown>(`/code/${code}`);
    const permission = this.extractPermission(response);
    if (!permission) {
      throw new Error(`Permission with code ${code} not found`);
    }
    return permission;
  }

  async getPermissionByName(name: string): Promise<Permission> {
    const response = await this.request<unknown>(`/name/${name}`);
    const permission = this.extractPermission(response);
    if (!permission) {
      throw new Error(`Permission with name ${name} not found`);
    }
    return permission;
  }

  async getPermissionById(
    id: number,
    query?: { skipCache?: boolean }
  ): Promise<Permission> {
    const queryString = this.buildQueryParams(query);
    const response = await this.request<unknown>(`/${id}${queryString}`);
    const permission = this.extractPermission(response);
    if (!permission) {
      throw new Error(`Permission ${id} not found`);
    }
    return permission;
  }

  async getReplacementPermission(id: number): Promise<Permission | null> {
    const response = await this.request<unknown>(`/${id}/replacement`);
    const withData = response as { data?: unknown; replacement_permission?: unknown };

    if (withData.data && typeof withData.data === "object") {
      const dataObj = withData.data as { replacement_permission?: unknown };
      if (dataObj.replacement_permission) {
        return dataObj.replacement_permission as Permission;
      }
    }

    if (withData.replacement_permission) {
      return withData.replacement_permission as Permission;
    }

    return this.extractPermission(response);
  }

  async getPermissionsByAction(
    action: string,
    query?: { activeOnly?: boolean; limit?: number; offset?: number }
  ): Promise<PermissionListResult> {
    const queryString = this.buildQueryParams(query);
    const response = await this.request<unknown>(
      `/action/${action}${queryString}`
    );
    return this.extractPermissionList(response);
  }

  async getPermissionsByResource(
    resourceId: number,
    query?: { activeOnly?: boolean; limit?: number; offset?: number }
  ): Promise<PermissionListResult> {
    const queryString = this.buildQueryParams(query);
    const response = await this.request<unknown>(
      `/resource/${resourceId}${queryString}`
    );
    return this.extractPermissionList(response);
  }

  async getPermissionsByResourceType(
    resourceTypeId: number,
    query?: { activeOnly?: boolean; limit?: number; offset?: number }
  ): Promise<PermissionListResult> {
    const queryString = this.buildQueryParams(query);
    const response = await this.request<unknown>(
      `/resource-type/${resourceTypeId}${queryString}`
    );
    return this.extractPermissionList(response);
  }

  async getPermissionsByResourceAndAction(
    resourceId: number,
    action: string,
    query?: { limit?: number; offset?: number }
  ): Promise<PermissionListResult> {
    const queryString = this.buildQueryParams(query);
    const response = await this.request<unknown>(
      `/resource/${resourceId}/action/${action}${queryString}`
    );
    return this.extractPermissionList(response);
  }

  async getPermissionsByResourceTypeAndAction(
    resourceTypeId: number,
    action: string,
    query?: { limit?: number; offset?: number }
  ): Promise<PermissionListResult> {
    const queryString = this.buildQueryParams(query);
    const response = await this.request<unknown>(
      `/resource-type/${resourceTypeId}/action/${action}${queryString}`
    );
    return this.extractPermissionList(response);
  }

  // POST Endpoints

  async createPermission(body: CreatePermissionRequest): Promise<Permission> {
    const response = await this.request<unknown>("/", {
      method: "POST",
      body: JSON.stringify(body),
    });
    const permission = this.extractPermission(response);
    if (!permission) {
      throw new Error("Failed to create permission");
    }
    return permission;
  }

  // PATCH Endpoints

  async updatePermission(
    id: number,
    body: UpdatePermissionRequest
  ): Promise<Permission | null> {
    const response = await this.request<unknown>(`/${id}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    });
    return this.extractPermission(response);
  }

  async deprecatePermission(
    id: number,
    body?: { replacement_permission_id?: number }
  ): Promise<Permission | null> {
    const response = await this.request<unknown>(`/${id}/deprecate`, {
      method: "PATCH",
      body: body ? JSON.stringify(body) : undefined,
    });
    return this.extractPermission(response);
  }

  async undeprecatePermission(id: number): Promise<Permission | null> {
    const response = await this.request<unknown>(`/${id}/undeprecate`, {
      method: "PATCH",
    });
    return this.extractPermission(response);
  }

  async markAsSensitive(
    id: number,
    body?: { requires_mfa?: boolean; requires_justification?: boolean }
  ): Promise<Permission | null> {
    const response = await this.request<unknown>(`/${id}/mark-sensitive`, {
      method: "PATCH",
      body: body ? JSON.stringify(body) : undefined,
    });
    return this.extractPermission(response);
  }

  async deactivatePermissionsByResource(
    resourceId: number
  ): Promise<{ success: boolean; message: string; count: number }> {
    const response = await this.request<unknown>(
      `/resource/${resourceId}/deactivate`,
      {
        method: "PATCH",
      }
    );
    return response as {
      success: boolean;
      message: string;
      count: number;
    };
  }

  async deactivatePermissionsByResourceType(
    resourceTypeId: number
  ): Promise<{ success: boolean; message: string; count: number }> {
    const response = await this.request<unknown>(
      `/resource-type/${resourceTypeId}/deactivate`,
      {
        method: "PATCH",
      }
    );
    return response as {
      success: boolean;
      message: string;
      count: number;
    };
  }

  async deactivatePermission(
    id: number,
    body?: { deactivationReason: string }
  ): Promise<Permission | null> {
    const response = await this.request<unknown>(`/${id}/deactivate`, {
      method: "PATCH",
      body: body ? JSON.stringify(body) : undefined,
    });
    return this.extractPermission(response);
  }

  async reactivatePermission(id: number): Promise<Permission | null> {
    const response = await this.request<unknown>(`/${id}/reactivate`, {
      method: "PATCH",
    });
    return this.extractPermission(response);
  }
}

export const permissionService = new PermissionService();
