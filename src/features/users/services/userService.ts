import { buildApiUrl, getAuthHeaders } from "../../../shared/services/api";
import {
  UserType,
  CreateUserRequest,
  UpdateUserRequest,
  SearchUsersQuery,
  AdvancedSearchUsersQuery,
  UserReportsQuery,
  BatchDeactivateRequest,
  BatchUpdateDepartmentRequest,
  ValidatePasswordResetTokenRequest,
  UserPermissionsResponse,
  UserPermissionsCheckResponse,
  UserPermissionsSummaryResponse,
  ActivateUserRequest,
  ChangeUserPasswordRequest,
  EnableMFARequest,
  AssignRoleRequest,
  UpdateDataAccessLevelRequest,
  GrantPIIAccessRequest,
  ApiSuccessResponse,
  PaginatedResponse,
} from "../types/user";

const BASE_URL = buildApiUrl("/system-users");

class UserService {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${BASE_URL}${endpoint}`;

    const response = await fetch(url, {
      headers: {
        ...getAuthHeaders(),
        "Content-Type": "application/json",
        ...options.headers,
      },
      ...options,
    });

    
    // Get response text first to check if it's valid JSON
    let responseText = "";
    try {
      responseText = await response.text();
    } catch (err) {
      throw new Error(
        `Failed to read response: ${
          err instanceof Error ? err.message : "Unknown error"
        }`
      );
    }

    // Handle empty responses
    if (!responseText || responseText.trim() === "") {
      if (!response.ok) {
        throw new Error(
          `HTTP error! status: ${response.status}. Empty response from server.`
        );
      }
      // Empty successful response
      throw new Error("Empty response from server");
    }

    if (!response.ok) {
      // Log error details for create user endpoint
      if (endpoint === "/" && options.method === "POST") {
        console.error(" ERROR RESPONSE:");
        console.error("Status:", response.status);
        console.error("Response Text:", responseText);
      }

      try {
        // Try to parse as JSON
        const errorData = JSON.parse(responseText);
        if (endpoint === "/" && options.method === "POST") {
          console.error("Parsed Error Data:", errorData);
        }
        if (errorData.error) {
          throw new Error(errorData.error);
        }
        if (errorData.message) {
          throw new Error(errorData.message);
        }
        if (errorData.details) {
          throw new Error(errorData.details);
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      } catch (err) {
        if (err instanceof SyntaxError) {
          // Response is not JSON, return the text as error
          console.error("Non-JSON error response:", responseText);
          throw new Error(
            `HTTP error! status: ${response.status}. ${
              responseText.length > 200
                ? responseText.substring(0, 200) + "..."
                : responseText
            }`
          );
        }
        if (err instanceof Error) {
          throw err;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    }

    // Try to parse the response as JSON
    try {
      const parsed = JSON.parse(responseText);
      return parsed;
    } catch (err) {
      if (err instanceof SyntaxError) {
        console.error("Invalid JSON response. URL:", url);
        console.error("Response text:", responseText.substring(0, 500));
        throw new Error(
          `Invalid JSON response from server. First 200 chars: ${responseText.substring(
            0,
            200
          )}`
        );
      }
      throw err;
    }
  }

  private buildQueryParams(params: Record<string, unknown>): string {
    const urlParams = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        if (Array.isArray(value)) {
          urlParams.append(key, value.join(","));
        } else if (typeof value === "boolean") {
          urlParams.append(key, value.toString());
        } else {
          urlParams.append(key, String(value));
        }
      }
    });

    const queryString = urlParams.toString();
    return queryString ? `?${queryString}` : "";
  }


  /**
   * GET /users/search - Search users
   */
  async searchUsers(
    query: SearchUsersQuery
  ): Promise<PaginatedResponse<UserType>> {
    const queryString = this.buildQueryParams(query);
    return this.request<PaginatedResponse<UserType>>(`/search${queryString}`);
  }

  /**
   * GET /users/advanced-search - Advanced search users
   */
  async advancedSearchUsers(
    query: AdvancedSearchUsersQuery
  ): Promise<PaginatedResponse<UserType>> {
    const queryString = this.buildQueryParams(query);
    return this.request<PaginatedResponse<UserType>>(
      `/advanced-search${queryString}`
    );
  }


  /**
   * GET /reports/status-counts - Get status counts
   */
  async getStatusCounts(
    query?: UserReportsQuery
  ): Promise<ApiSuccessResponse<Record<string, number>>> {
    const queryParams = { ...query, skipCache: true };
    const queryString = this.buildQueryParams(queryParams || {});
    return this.request<ApiSuccessResponse<Record<string, number>>>(
      `/reports/status-counts${queryString}`
    );
  }

  /**
   * GET /users/reports/department-counts - Get department counts
   */
  async getDepartmentCounts(
    query?: UserReportsQuery
  ): Promise<ApiSuccessResponse<Record<string, number>>> {
    const queryString = this.buildQueryParams(query || {});
    return this.request<ApiSuccessResponse<Record<string, number>>>(
      `/reports/department-counts${queryString}`
    );
  }

  /**
   * GET /users/reports/role-counts - Get role counts
   */
  async getRoleCounts(
    query?: UserReportsQuery
  ): Promise<ApiSuccessResponse<Record<string, number>>> {
    const queryString = this.buildQueryParams(query || {});
    return this.request<ApiSuccessResponse<Record<string, number>>>(
      `/reports/role-counts${queryString}`
    );
  }


  /**
   * GET /users/mfa/enabled - Get MFA enabled users
   */
  async getMFAEnabledUsers(
    query?: SearchUsersQuery
  ): Promise<PaginatedResponse<UserType>> {
    const queryString = this.buildQueryParams(query || {});
    return this.request<PaginatedResponse<UserType>>(
      `/mfa/enabled${queryString}`
    );
  }

  /**
   * GET /users/mfa/disabled - Get MFA disabled users
   */
  async getMFADisabledUsers(
    query?: SearchUsersQuery
  ): Promise<PaginatedResponse<UserType>> {
    const queryString = this.buildQueryParams(query || {});
    return this.request<PaginatedResponse<UserType>>(
      `/mfa/disabled${queryString}`
    );
  }


  /**
   * GET /users/expiring-passwords/:days - Get expiring passwords
   */
  async getExpiringPasswords(
    days: number,
    query?: SearchUsersQuery
  ): Promise<PaginatedResponse<UserType>> {
    const queryString = this.buildQueryParams(query || {});
    return this.request<PaginatedResponse<UserType>>(
      `/expiring-passwords/${days}${queryString}`
    );
  }

  /**
   * GET /users/expired-access - Get expired access
   */
  async getExpiredAccess(
    query?: SearchUsersQuery
  ): Promise<PaginatedResponse<UserType>> {
    const queryString = this.buildQueryParams(query || {});
    return this.request<PaginatedResponse<UserType>>(
      `/expired-access${queryString}`
    );
  }

  /**
   * GET /users/recent/:days - Get recent users
   */
  async getRecentUsers(
    days: number,
    query?: SearchUsersQuery
  ): Promise<PaginatedResponse<UserType>> {
    const queryString = this.buildQueryParams(query || {});
    return this.request<PaginatedResponse<UserType>>(
      `/recent/${days}${queryString}`
    );
  }

  /**
   * GET /users/inactive/:days - Get inactive users
   */
  async getInactiveUsers(
    days: number,
    query?: SearchUsersQuery
  ): Promise<PaginatedResponse<UserType>> {
    const queryString = this.buildQueryParams(query || {});
    return this.request<PaginatedResponse<UserType>>(
      `/inactive/${days}${queryString}`
    );
  }


  /**
   * GET /system-users/:id - Get user by ID
   */
  async getUserById(
    id: number,
    skipCache?: boolean
  ): Promise<ApiSuccessResponse<UserType>> {
    const queryString = this.buildQueryParams({ skipCache });
    return this.request<ApiSuccessResponse<UserType>>(
      `/${id}${queryString}`
    );
  }

  /**
   * GET /users/uuid/:uuid - Get user by UUID
   */
  async getUserByUUID(
    uuid: string,
    skipCache?: boolean
  ): Promise<ApiSuccessResponse<UserType>> {
    const queryString = this.buildQueryParams({ skipCache });
    return this.request<ApiSuccessResponse<UserType>>(
      `/uuid/${encodeURIComponent(uuid)}${queryString}`
    );
  }

  /**
   * GET /users/username/:username - Get user by username
   */
  async getUserByUsername(
    username: string,
    skipCache?: boolean
  ): Promise<ApiSuccessResponse<UserType>> {
    const queryString = this.buildQueryParams({ skipCache });
    return this.request<ApiSuccessResponse<UserType>>(
      `/username/${encodeURIComponent(username)}${queryString}`
    );
  }

  /**
   * GET /users/email/:email - Get user by email
   */
  async getUserByEmail(
    email: string,
    skipCache?: boolean
  ): Promise<ApiSuccessResponse<UserType>> {
    const queryString = this.buildQueryParams({ skipCache });
    return this.request<ApiSuccessResponse<UserType>>(
      `/email/${encodeURIComponent(email)}${queryString}`
    );
  }

  /**
   * GET /users/employee/:employeeId - Get user by employee ID
   */
  async getUserByEmployeeId(
    employeeId: string,
    skipCache?: boolean
  ): Promise<ApiSuccessResponse<UserType>> {
    const queryString = this.buildQueryParams({ skipCache });
    return this.request<ApiSuccessResponse<UserType>>(
      `/employee/${encodeURIComponent(employeeId)}${queryString}`
    );
  }

  /**
   * GET /users/status/:status - Get users by status
   */
  async getUsersByStatus(
    status: string,
    query?: SearchUsersQuery
  ): Promise<PaginatedResponse<UserType>> {
    const queryString = this.buildQueryParams(query || {});
    return this.request<PaginatedResponse<UserType>>(
      `/status/${encodeURIComponent(status)}${queryString}`
    );
  }

  /**
   * GET /users/department/:department - Get users by department
   */
  async getUsersByDepartment(
    department: string,
    query?: SearchUsersQuery
  ): Promise<PaginatedResponse<UserType>> {
    const queryString = this.buildQueryParams(query || {});
    return this.request<PaginatedResponse<UserType>>(
      `/department/${encodeURIComponent(department)}${queryString}`
    );
  }

  /**
   * GET /users/role/:roleId - Get users by role
   */
  async getUsersByRole(
    roleId: number,
    query?: SearchUsersQuery
  ): Promise<PaginatedResponse<UserType>> {
    const queryString = this.buildQueryParams(query || {});
    return this.request<PaginatedResponse<UserType>>(
      `/role/${roleId}${queryString}`
    );
  }


  /**
   * POST /users/batch/deactivate - Bulk deactivate users
   */
  async batchDeactivateUsers(
    request: BatchDeactivateRequest
  ): Promise<
    ApiSuccessResponse<{ success_count: number; failed_count: number }>
  > {
    return this.request<
      ApiSuccessResponse<{ success_count: number; failed_count: number }>
    >("/batch/deactivate", {
      method: "POST",
      body: JSON.stringify(request),
    });
  }

  /**
   * PUT /users/batch/department - Bulk update department
   */
  async batchUpdateDepartment(
    request: BatchUpdateDepartmentRequest
  ): Promise<
    ApiSuccessResponse<{ success_count: number; failed_count: number }>
  > {
    return this.request<
      ApiSuccessResponse<{ success_count: number; failed_count: number }>
    >("/batch/department", {
      method: "PUT",
      body: JSON.stringify(request),
    });
  }


  /**
   * POST /users/password-reset/validate - Validate password reset token
   */
  async validatePasswordResetToken(
    request: ValidatePasswordResetTokenRequest
  ): Promise<ApiSuccessResponse<{ valid: boolean; user_id?: number }>> {
    return this.request<
      ApiSuccessResponse<{ valid: boolean; user_id?: number }>
    >("/password-reset/validate", {
      method: "POST",
      body: JSON.stringify(request),
    });
  }


  /**
   * GET /users/:id/direct-reports - Get direct reports
   */
  async getDirectReports(id: number): Promise<ApiSuccessResponse<UserType[]>> {
    return this.request<ApiSuccessResponse<UserType[]>>(
      `/${id}/direct-reports`
    );
  }

  /**
   * GET /users/:id/all-reports - Get all reports (hierarchy)
   */
  async getAllReports(id: number): Promise<ApiSuccessResponse<UserType[]>> {
    return this.request<ApiSuccessResponse<UserType[]>>(`/${id}/all-reports`);
  }

  /**
   * GET /users/:id/manager-chain - Get manager chain
   */
  async getManagerChain(id: number): Promise<ApiSuccessResponse<UserType[]>> {
    return this.request<ApiSuccessResponse<UserType[]>>(`/${id}/manager-chain`);
  }

  /**
   * GET /users/:id/can-login - Check if user can login
   */
  async canUserLogin(
    id: number
  ): Promise<ApiSuccessResponse<{ can_login: boolean; reason?: string }>> {
    return this.request<
      ApiSuccessResponse<{ can_login: boolean; reason?: string }>
    >(`/${id}/can-login`);
  }

  /**
   * GET /users/:id/permissions - Get user permissions
   */
  async getUserPermissions(id: number): Promise<UserPermissionsResponse> {
    return this.request<UserPermissionsResponse>(`/${id}/permissions`);
  }

  /**
   * GET /users/:id/permissions/check/:code - Check specific permission
   */
  async checkUserPermission(
    id: number,
    code: string
  ): Promise<UserPermissionsCheckResponse> {
    return this.request<UserPermissionsCheckResponse>(
      `/${id}/permissions/check/${encodeURIComponent(code)}`
    );
  }

  /**
   * GET /users/:id/permissions/summary - Get permissions summary
   */
  async getUserPermissionsSummary(
    id: number
  ): Promise<UserPermissionsSummaryResponse> {
    return this.request<UserPermissionsSummaryResponse>(
      `/${id}/permissions/summary`
    );
  }


  /**
   * PUT /users/:id/activate - Activate user
   */
  async activateUser(
    id: number,
    request?: ActivateUserRequest
  ): Promise<ApiSuccessResponse<UserType>> {
    return this.request<ApiSuccessResponse<UserType>>(`/${id}/activate`, {
      method: "PUT",
      body: request ? JSON.stringify(request) : undefined,
    });
  }

  /**
   * PUT /users/:id/deactivate - Deactivate user
   */
  async deactivateUser(
    id: number,
    request?: ActivateUserRequest
  ): Promise<ApiSuccessResponse<UserType>> {
    return this.request<ApiSuccessResponse<UserType>>(`/${id}/deactivate`, {
      method: "PUT",
      body: request ? JSON.stringify(request) : undefined,
    });
  }

  /**
   * PUT /users/:id/suspend - Suspend user
   */
  async suspendUser(
    id: number,
    request?: ActivateUserRequest
  ): Promise<ApiSuccessResponse<UserType>> {
    return this.request<ApiSuccessResponse<UserType>>(`/${id}/suspend`, {
      method: "PUT",
      body: request ? JSON.stringify(request) : undefined,
    });
  }

  /**
   * PUT /users/:id/unsuspend - Unsuspend user
   */
  async unsuspendUser(
    id: number,
    request?: ActivateUserRequest
  ): Promise<ApiSuccessResponse<UserType>> {
    return this.request<ApiSuccessResponse<UserType>>(`/${id}/unsuspend`, {
      method: "PUT",
      body: request ? JSON.stringify(request) : undefined,
    });
  }

  /**
   * PUT /users/:id/unlock - Unlock user account
   */
  async unlockUser(id: number): Promise<ApiSuccessResponse<UserType>> {
    return this.request<ApiSuccessResponse<UserType>>(`/${id}/unlock`, {
      method: "PUT",
    });
  }


  /**
   * PUT /users/:id/password - Change user password
   */
  async changeUserPassword(
    id: number,
    request: ChangeUserPasswordRequest
  ): Promise<ApiSuccessResponse<{ success: boolean; message?: string }>> {
    return this.request<
      ApiSuccessResponse<{ success: boolean; message?: string }>
    >(`/${id}/password`, {
      method: "PUT",
      body: JSON.stringify(request),
    });
  }

  /**
   * POST /users/:id/password-reset-token - Generate password reset token
   */
  async generatePasswordResetToken(
    id: number
  ): Promise<ApiSuccessResponse<{ token: string; expires_at: string }>> {
    return this.request<
      ApiSuccessResponse<{ token: string; expires_at: string }>
    >(`/${id}/password-reset-token`, {
      method: "POST",
    });
  }


  /**
   * PUT /users/:id/mfa/enable - Enable MFA for user
   */
  async enableMFAForUser(
    id: number,
    request?: EnableMFARequest
  ): Promise<ApiSuccessResponse<UserType>> {
    return this.request<ApiSuccessResponse<UserType>>(`/${id}/mfa/enable`, {
      method: "PUT",
      body: request ? JSON.stringify(request) : undefined,
    });
  }

  /**
   * PUT /users/:id/mfa/disable - Disable MFA for user
   */
  async disableMFAForUser(id: number): Promise<ApiSuccessResponse<UserType>> {
    return this.request<ApiSuccessResponse<UserType>>(`/${id}/mfa/disable`, {
      method: "PUT",
    });
  }


  /**
   * PUT /users/:id/role - Assign primary role
   */
  async assignRole(
    id: number,
    request: AssignRoleRequest
  ): Promise<ApiSuccessResponse<UserType>> {
    return this.request<ApiSuccessResponse<UserType>>(`/${id}/role`, {
      method: "PUT",
      body: JSON.stringify(request),
    });
  }

  /**
   * DELETE /users/:id/role - Remove primary role
   */
  async removeRole(id: number): Promise<ApiSuccessResponse<UserType>> {
    return this.request<ApiSuccessResponse<UserType>>(`/${id}/role`, {
      method: "DELETE",
    });
  }

  /**
   * PUT /users/:id/data-access-level - Update data access level
   */
  async updateDataAccessLevel(
    id: number,
    request: UpdateDataAccessLevelRequest
  ): Promise<ApiSuccessResponse<UserType>> {
    return this.request<ApiSuccessResponse<UserType>>(
      `/${id}/data-access-level`,
      {
        method: "PUT",
        body: JSON.stringify(request),
      }
    );
  }

  /**
   * PUT /users/:id/pii-access/grant - Grant PII access
   */
  async grantPIIAccess(
    id: number,
    request?: GrantPIIAccessRequest
  ): Promise<ApiSuccessResponse<UserType>> {
    return this.request<ApiSuccessResponse<UserType>>(
      `/${id}/pii-access/grant`,
      {
        method: "PUT",
        body: request ? JSON.stringify(request) : undefined,
      }
    );
  }

  /**
   * PUT /users/:id/pii-access/revoke - Revoke PII access
   */
  async revokePIIAccess(id: number): Promise<ApiSuccessResponse<UserType>> {
    return this.request<ApiSuccessResponse<UserType>>(
      `/${id}/pii-access/revoke`,
      {
        method: "PUT",
      }
    );
  }


  /**
   * GET /users/:id - Get user by ID
   */
  async getUserById(
    id: number,
    skipCache?: boolean
  ): Promise<ApiSuccessResponse<UserType>> {
    const queryString = this.buildQueryParams({ skipCache });
    return this.request<ApiSuccessResponse<UserType>>(`/${id}${queryString}`);
  }

  /**
   * GET /users - Get all active users
   */
  async getUsers(
    query?: SearchUsersQuery
  ): Promise<PaginatedResponse<UserType>> {
    const queryString = this.buildQueryParams(query || {});
    return this.request<PaginatedResponse<UserType>>(`${queryString}`);
  }

  /**
   * POST /users - Create new user
   */
  async createUser(
    request: CreateUserRequest
  ): Promise<ApiSuccessResponse<UserType>> {

    return this.request<ApiSuccessResponse<UserType>>("/", {
      method: "POST",
      body: JSON.stringify(request),
    });
  }

  /**
   * PUT /users/:id - Update user
   */
  async updateUser(
    id: number,
    request: UpdateUserRequest
  ): Promise<ApiSuccessResponse<UserType>> {
    return this.request<ApiSuccessResponse<UserType>>(`/${id}`, {
      method: "PUT",
      body: JSON.stringify(request),
    });
  }

  /**
   * DELETE /users/:id - Delete user
   */
  async deleteUser(id: number, deletedBy: number): Promise<void> {
    return this.request<void>(`/${id}`, {
      method: "DELETE",
      body: JSON.stringify({ deleted_by: deletedBy }),
    });
  }
}

export const userService = new UserService();
