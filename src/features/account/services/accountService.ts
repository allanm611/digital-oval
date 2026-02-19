import { buildApiUrl, getAuthHeaders } from "../../../shared/services/api";
import {
  CreateAccountRequestRequest,
  RecordConsentsRequest,
  SubmitAccountRequestRequest,
  AssignApproverRequest,
  ApproveAccountRequestRequest,
  CreateDirectAccountRequest,
  ApiSuccessResponse,
  AccountRequestType,
} from "../types/account";

const BASE_URL = buildApiUrl("/accounts");

class AccountService {
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

    if (!responseText || responseText.trim() === "") {
      if (!response.ok) {
        throw new Error(
          `HTTP error! status: ${response.status}. Empty response from server.`
        );
      }
      throw new Error("Empty response from server");
    }

    if (!response.ok) {
      try {
        const errorData = JSON.parse(responseText);
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

  // ==================== ACCOUNT REQUEST ENDPOINTS (9 endpoints) ====================

  /**
   * GET /accounts/requests - Get all account requests (with pagination and filtering)
   */
  async getAccountRequests(
    skipCache?: boolean,
    status?: string,
    limit?: number,
    offset?: number
  ): Promise<{ success: boolean; data: AccountRequestType[]; pagination?: { total: number; limit: number; offset: number } }> {
    const params = new URLSearchParams();
    if (skipCache) params.append("skipCache", "true");
    if (status) params.append("status", status);
    if (limit) params.append("limit", limit.toString());
    if (offset) params.append("offset", offset.toString());
    const queryString = params.toString() ? `?${params.toString()}` : "";
    return this.request<{ success: boolean; data: AccountRequestType[]; pagination?: { total: number; limit: number; offset: number } }>(`/requests${queryString}`);
  }

  /**
   * POST /accounts/request - Create account request
   */
  async createAccountRequest(
    request: CreateAccountRequestRequest
  ): Promise<ApiSuccessResponse<AccountRequestType>> {
    return this.request<ApiSuccessResponse<AccountRequestType>>("/request", {
      method: "POST",
      body: JSON.stringify(request),
    });
  }

  /**
   * POST /accounts/request/:id/consents - Record request consents
   */
  async recordConsents(
    id: number,
    request: RecordConsentsRequest
  ): Promise<ApiSuccessResponse<AccountRequestType>> {
    return this.request<ApiSuccessResponse<AccountRequestType>>(
      `/request/${id}/consents`,
      {
        method: "POST",
        body: JSON.stringify(request),
      }
    );
  }

  /**
   * POST /accounts/request/:id/submit - Submit account request for approval
   */
  async submitAccountRequest(
    id: number,
    request?: SubmitAccountRequestRequest
  ): Promise<ApiSuccessResponse<AccountRequestType>> {
    return this.request<ApiSuccessResponse<AccountRequestType>>(
      `/request/${id}/submit`,
      {
        method: "POST",
        body: request ? JSON.stringify(request) : undefined,
      }
    );
  }

  /**
   * POST /accounts/request/:id/assign-approver - Assign approver to request
   */
  async assignApprover(
    id: number,
    request: AssignApproverRequest
  ): Promise<ApiSuccessResponse<AccountRequestType>> {
    return this.request<ApiSuccessResponse<AccountRequestType>>(
      `/request/${id}/assign-approver`,
      {
        method: "POST",
        body: JSON.stringify(request),
      }
    );
  }

  /**
   * POST /accounts/request/:id/approve - Approve account request
   */
  async approveAccountRequest(
    id: number,
    request?: ApproveAccountRequestRequest
  ): Promise<ApiSuccessResponse<AccountRequestType>> {
    return this.request<ApiSuccessResponse<AccountRequestType>>(
      `/request/${id}/approve`,
      {
        method: "POST",
        body: request ? JSON.stringify(request) : undefined,
      }
    );
  }

  /**
   * POST /accounts/create-direct - Create account directly (admin only)
   */
  async createDirectAccount(
    request: CreateDirectAccountRequest
  ): Promise<ApiSuccessResponse<AccountRequestType>> {
    return this.request<ApiSuccessResponse<AccountRequestType>>(
      "/create-direct",
      {
        method: "POST",
        body: JSON.stringify(request),
      }
    );
  }

  /**
   * POST /accounts/dev/hash-password - Hash password (dev only)
   */
  async hashPassword(
    password: string
  ): Promise<ApiSuccessResponse<{ hash: string }>> {
    return this.request<ApiSuccessResponse<{ hash: string }>>(
      "/dev/hash-password",
      {
        method: "POST",
        body: JSON.stringify({ password }),
      }
    );
  }
}

export const accountService = new AccountService();
