import { buildApiUrl, getAuthHeaders } from "../../../shared/services/api";
import {
  ListRolesQuery,
  Role,
  RoleListMeta,
  RoleListResult,
  RoleSearchQuery,
} from "../types/role";

const BASE_URL = buildApiUrl("/roles");

class RoleService {
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
      // Some PATCH endpoints may return 204
      return undefined as T;
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(responseText);
    } catch (_) {
      throw new Error(
        `Invalid JSON response from roles API. First 200 chars: ${responseText.substring(
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

  private extractRoleList(response: unknown): RoleListResult {
    if (Array.isArray(response)) {
      return { roles: response as Role[] };
    }

    if (response && typeof response === "object") {
      const withData = response as {
        data?: unknown;
        meta?: RoleListMeta;
        roles?: unknown;
      };

      if (Array.isArray(withData.data)) {
        return {
          roles: withData.data as Role[],
          meta: withData.meta,
        };
      }

      if (Array.isArray(withData.roles)) {
        return {
          roles: withData.roles as Role[],
          meta: withData.meta,
        };
      }
    }

    throw new Error("Unexpected response shape from roles API");
  }

  private extractRole(response: unknown): Role | null {
    if (!response || typeof response !== "object") {
      return null;
    }

    if (Array.isArray(response)) {
      return null;
    }

    const withData = response as { data?: unknown; role?: unknown };
    if (withData.data && typeof withData.data === "object") {
      return withData.data as Role;
    }

    if (withData.role && typeof withData.role === "object") {
      return withData.role as Role;
    }

    return response as Role;
  }

  async listRoles(query?: ListRolesQuery): Promise<RoleListResult> {
    const queryString = this.buildQueryParams(query);
    const response = await this.request<unknown>(`${queryString}`);
    return this.extractRoleList(response);
  }

  async getSystemRoles(query?: { skipCache?: boolean }): Promise<Role[]> {
    const queryString = this.buildQueryParams(query);
    const response = await this.request<unknown>(`/system${queryString}`);
    return this.extractRoleList(response).roles;
  }

  async getDefaultRole(query?: { skipCache?: boolean }): Promise<Role | null> {
    const queryString = this.buildQueryParams(query);
    const response = await this.request<unknown>(`/default${queryString}`);
    return this.extractRole(response);
  }

  async getRolesWithAvailableSlots(query?: {
    limit?: number;
    offset?: number;
    skipCache?: boolean;
  }): Promise<Role[]> {
    const queryString = this.buildQueryParams(query);
    const response = await this.request<unknown>(
      `/available-slots${queryString}`
    );
    return this.extractRoleList(response).roles;
  }

  async getRoleById(
    id: number,
    query?: { skipCache?: boolean }
  ): Promise<Role> {
    const queryString = this.buildQueryParams(query);
    const response = await this.request<unknown>(`/${id}${queryString}`);
    const role = this.extractRole(response);
    if (!role) {
      throw new Error(`Role ${id} not found`);
    }
    return role;
  }

  async getRoleChildren(
    id: number,
    query?: { skipCache?: boolean }
  ): Promise<Role[]> {
    const queryString = this.buildQueryParams(query);
    const response = await this.request<unknown>(
      `/${id}/children${queryString}`
    );
    return this.extractRoleList(response).roles;
  }

  async searchRoles(query: RoleSearchQuery): Promise<RoleListResult> {
    const queryString = this.buildQueryParams(query);
    const response = await this.request<unknown>(`/search${queryString}`);
    return this.extractRoleList(response);
  }

  async createRole(
    body: Partial<Role> & { name: string; code: string }
  ): Promise<Role> {
    const response = await this.request<unknown>("/", {
      method: "POST",
      body: JSON.stringify(body),
    });
    const role = this.extractRole(response);
    if (!role) {
      throw new Error("Failed to create role");
    }
    return role;
  }

  async updateRole(
    id: number,
    body: Partial<Role> & { updated_by?: number }
  ): Promise<Role | null> {
    const response = await this.request<unknown>(`/${id}`, {
      method: "PUT",
      body: JSON.stringify(body),
    });
    return this.extractRole(response);
  }

  async cloneRole(
    id: number,
    body: {
      name: string;
      code: string;
      include_permissions?: boolean;
      include_tags?: boolean;
      created_by?: number;
    }
  ): Promise<Role | null> {
    const response = await this.request<unknown>(`/${id}/clone`, {
      method: "POST",
      body: JSON.stringify(body),
    });
    return this.extractRole(response);
  }

  async reactivateRole(
    id: number,
    body?: { reactivated_by?: number }
  ): Promise<Role | null> {
    const response = await this.request<unknown>(`/${id}/reactivate`, {
      method: "PATCH",
      body: body ? JSON.stringify(body) : undefined,
    });
    return this.extractRole(response);
  }

  async deactivateRole(
    id: number,
    body?: { deactivated_by?: number; reason?: string }
  ): Promise<Role | null> {
    const response = await this.request<unknown>(`/${id}/deactivate`, {
      method: "PATCH",
      body: body ? JSON.stringify(body) : undefined,
    });
    return this.extractRole(response);
  }

  async setDefaultRole(
    id: number,
    body?: { updated_by?: number }
  ): Promise<Role | null> {
    const response = await this.request<unknown>(`/${id}/set-default`, {
      method: "PATCH",
      body: body ? JSON.stringify(body) : undefined,
    });
    return this.extractRole(response);
  }

  async incrementRoleUsers(
    id: number,
    body?: { increment_by?: number; updated_by?: number }
  ): Promise<Role | null> {
    const response = await this.request<unknown>(`/${id}/increment-users`, {
      method: "PATCH",
      body: body ? JSON.stringify(body) : undefined,
    });
    return this.extractRole(response);
  }

  async decrementRoleUsers(
    id: number,
    body?: { decrement_by?: number; updated_by?: number }
  ): Promise<Role | null> {
    const response = await this.request<unknown>(`/${id}/decrement-users`, {
      method: "PATCH",
      body: body ? JSON.stringify(body) : undefined,
    });
    return this.extractRole(response);
  }

  async deleteRole(id: number, body?: { deleted_by?: number }): Promise<void> {
    await this.request<void>(`/${id}`, {
      method: "DELETE",
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async isUserLimitReached(
    id: number,
    query?: { skipCache?: boolean }
  ): Promise<boolean> {
    const queryString = this.buildQueryParams(query);
    const response = await this.request<unknown>(
      `/${id}/user-limit-reached${queryString}`
    );

    if (typeof response === "boolean") {
      return response;
    }

    if (
      response &&
      typeof response === "object" &&
      "data" in response &&
      typeof (response as { data?: unknown }).data === "boolean"
    ) {
      return (response as { data: boolean }).data;
    }

    throw new Error("Unexpected response from user limit endpoint");
  }
}

export const roleService = new RoleService();
