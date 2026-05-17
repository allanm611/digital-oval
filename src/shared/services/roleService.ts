import { extractErrorMessage } from "../utils/errorHandler";
import { fetchWithAuthInterceptor } from "./fetchInterceptor";
import { ApiResponse } from "../types/api";
import { buildApiUrl } from "./api";

export interface Role {
  id: number;
  name: string;
  description?: string;
  is_active?: boolean;
  isActive?: boolean;
  created_at?: string;
  updated_at?: string;
}

export type CreateRoleRequest = Omit<Role, "id" | "created_at" | "updated_at">;
export type UpdateRoleRequest = Partial<CreateRoleRequest>;

class RoleService {
  private baseUrl = buildApiUrl("/roles");

  private async request<T>(
    endpoint: string,
    options?: RequestInit
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = {
      "Content-Type": "application/json",
      ...options?.headers,
    };

    const response = await fetchWithAuthInterceptor(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errorBody = await response.text();
      const errorMessage = extractErrorMessage(errorBody, response.status);
      throw new Error(errorMessage);
    }

    return response.json();
  }

  async getAllRoles(): Promise<Role[]> {
    const data = await this.request<ApiResponse<Role[]>>("");
    if (data && Array.isArray(data.data)) {
      return data.data;
    }
    return [];
  }

  async getSystemRoles(): Promise<Role[]> {
    const data = await this.request<ApiResponse<Role[]>>("/system");
    if (data && Array.isArray(data.data)) {
      return data.data;
    }
    return [];
  }

  async getDefaultRole(): Promise<Role> {
    const data = await this.request<ApiResponse<Role>>("/default");
    if (data && data.data) {
      return data.data;
    }
    return {} as Role;
  }

  async getAvailableSlots(): Promise<Role[]> {
    const data = await this.request<ApiResponse<Role[]>>("/available-slots");
    if (data && Array.isArray(data.data)) {
      return data.data;
    }
    return [];
  }

  async getRootRoles(): Promise<Role[]> {
    const data = await this.request<ApiResponse<Role[]>>("/roots");
    if (data && Array.isArray(data.data)) {
      return data.data;
    }
    return [];
  }

  async getRoleById(id: number): Promise<Role> {
    const data = await this.request<ApiResponse<Role>>(`/${id}`);
    if (data && data.data) {
      return data.data;
    }
    return {} as Role;
  }

  async createRole(payload: CreateRoleRequest): Promise<Role> {
    const data = await this.request<ApiResponse<Role>>("", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    if (data && data.data) {
      return data.data;
    }
    return {} as Role;
  }

  async updateRole(id: number, payload: UpdateRoleRequest): Promise<Role> {
    const data = await this.request<ApiResponse<Role>>(`/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
    if (data && data.data) {
      return data.data;
    }
    return {} as Role;
  }

  async deleteRole(id: number): Promise<void> {
    await this.request<void>(`/${id}`, {
      method: "DELETE",
    });
  }
}

export const roleService = new RoleService();
