import { buildApiUrl, getAuthHeaders } from "../../../shared/services/api";
import {
  ApiSuccessResponse,
  AccountRequestType,
} from "../../account/types/account";

const BASE_URL = buildApiUrl("/user-onboarding-requests");

class UserOnboardingService {
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

  /**
   * POST /user-onboarding-requests - Create new onboarding request
   */
  async createOnboardingRequest(
    data: {
      username: string;
      email_address: string;
      first_name: string;
      last_name: string;
      department?: string;
      primary_role_id?: number;
    }
  ): Promise<ApiSuccessResponse<AccountRequestType>> {
    return this.request<ApiSuccessResponse<AccountRequestType>>("/", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  /**
   * GET /user-onboarding-requests - Get all onboarding requests (with pagination)
   */
  async getOnboardingRequests(
    _skipCache: boolean = true,
    limit?: number,
    offset?: number
  ): Promise<{
    success: boolean;
    data: AccountRequestType[];
    pagination?: { total: number; limit: number; offset: number };
  }> {
    const params = new URLSearchParams();
    params.append("skipCache", "true"); // Always skip cache
    if (limit) params.append("limit", limit.toString());
    if (offset) params.append("offset", offset.toString());
    const queryString = params.toString() ? `?${params.toString()}` : "";
    return this.request<{
      success: boolean;
      data: AccountRequestType[];
      pagination?: { total: number; limit: number; offset: number };
    }>(`${queryString}`);
  }

  
  async getPendingOnboardingRequests(
    skipCache?: boolean,
    limit?: number,
    offset?: number
  ): Promise<{
    success: boolean;
    data: AccountRequestType[];
    pagination?: { total: number; limit: number; offset: number };
  }> {
    const params = new URLSearchParams();
    if (skipCache) params.append("skipCache", "true");
    if (limit) params.append("limit", limit.toString());
    if (offset) params.append("offset", offset.toString());
    const queryString = params.toString() ? `?${params.toString()}` : "";
    return this.request<{
      success: boolean;
      data: AccountRequestType[];
      pagination?: { total: number; limit: number; offset: number };
    }>(`${queryString}`);
  }

  /**
   * GET /user-onboarding-requests/status/rejected - Get all rejected onboarding requests (with pagination)
   */
  async getRejectedOnboardingRequests(
    skipCache?: boolean,
    limit?: number,
    offset?: number
  ): Promise<{
    success: boolean;
    data: AccountRequestType[];
    pagination?: { total: number; limit: number; offset: number };
  }> {
    const params = new URLSearchParams();
    if (skipCache) params.append("skipCache", "true");
    if (limit) params.append("limit", limit.toString());
    if (offset) params.append("offset", offset.toString());
    const queryString = params.toString() ? `?${params.toString()}` : "";
    return this.request<{
      success: boolean;
      data: AccountRequestType[];
      pagination?: { total: number; limit: number; offset: number };
    }>(`/status/rejected${queryString}`);
  }

  /**
   * GET /user-onboarding-requests/status/submitted - Get all submitted onboarding requests (with pagination)
   */
  async getSubmittedRequests(
    skipCache?: boolean,
    limit?: number,
    offset?: number
  ): Promise<{
    success: boolean;
    data: AccountRequestType[];
    pagination?: { total: number; limit: number; offset: number };
  }> {
    const params = new URLSearchParams();
    if (skipCache) params.append("skipCache", "true");
    if (limit) params.append("limit", limit.toString());
    if (offset) params.append("offset", offset.toString());
    const queryString = params.toString() ? `?${params.toString()}` : "";
    return this.request<{
      success: boolean;
      data: AccountRequestType[];
      pagination?: { total: number; limit: number; offset: number };
    }>(`/status/submitted${queryString}`);
  }

  /**
   * GET /user-onboarding-requests/status/under_review - Get all requests under review (with pagination)
   */
  async getUnderReviewRequests(
    skipCache?: boolean,
    limit?: number,
    offset?: number
  ): Promise<{
    success: boolean;
    data: AccountRequestType[];
    pagination?: { total: number; limit: number; offset: number };
  }> {
    const params = new URLSearchParams();
    if (skipCache) params.append("skipCache", "true");
    if (limit) params.append("limit", limit.toString());
    if (offset) params.append("offset", offset.toString());
    const queryString = params.toString() ? `?${params.toString()}` : "";
    return this.request<{
      success: boolean;
      data: AccountRequestType[];
      pagination?: { total: number; limit: number; offset: number };
    }>(`/status/under_review${queryString}`);
  }

  /**
   * GET /user-onboarding-requests/status/pending_approval - Get all requests pending approval (with pagination)
   */
  async getPendingApprovalRequests(
    skipCache?: boolean,
    limit?: number,
    offset?: number
  ): Promise<{
    success: boolean;
    data: AccountRequestType[];
    pagination?: { total: number; limit: number; offset: number };
  }> {
    const params = new URLSearchParams();
    if (skipCache) params.append("skipCache", "true");
    if (limit) params.append("limit", limit.toString());
    if (offset) params.append("offset", offset.toString());
    const queryString = params.toString() ? `?${params.toString()}` : "";
    return this.request<{
      success: boolean;
      data: AccountRequestType[];
      pagination?: { total: number; limit: number; offset: number };
    }>(`/status/pending_approval${queryString}`);
  }

  /**
   * GET /user-onboarding-requests/approver/:approverId/pending - Get pending requests for a specific approver (with pagination)
   */
  async getApproverPendingRequests(
    approverId: number,
    skipCache?: boolean,
    limit?: number,
    offset?: number
  ): Promise<{
    success: boolean;
    data: AccountRequestType[];
    pagination?: { total: number; limit: number; offset: number };
  }> {
    const params = new URLSearchParams();
    if (skipCache) params.append("skipCache", "true");
    if (limit) params.append("limit", limit.toString());
    if (offset) params.append("offset", offset.toString());
    const queryString = params.toString() ? `?${params.toString()}` : "";
    return this.request<{
      success: boolean;
      data: AccountRequestType[];
      pagination?: { total: number; limit: number; offset: number };
    }>(`/approver/${approverId}/pending${queryString}`);
  }

  /**
   * GET /user-onboarding-requests/status/approved - Get all approved onboarding requests (with pagination)
   */
  async getApprovedRequests(
    skipCache?: boolean,
    limit?: number,
    offset?: number
  ): Promise<{
    success: boolean;
    data: AccountRequestType[];
    pagination?: { total: number; limit: number; offset: number };
  }> {
    const params = new URLSearchParams();
    if (skipCache) params.append("skipCache", "true");
    if (limit) params.append("limit", limit.toString());
    if (offset) params.append("offset", offset.toString());
    const queryString = params.toString() ? `?${params.toString()}` : "";
    return this.request<{
      success: boolean;
      data: AccountRequestType[];
      pagination?: { total: number; limit: number; offset: number };
    }>(`/status/approved${queryString}`);
  }

  /**
   * GET /user-onboarding-requests/status/cancelled - Get all cancelled onboarding requests (with pagination)
   */
  async getCancelledRequests(
    skipCache?: boolean,
    limit?: number,
    offset?: number
  ): Promise<{
    success: boolean;
    data: AccountRequestType[];
    pagination?: { total: number; limit: number; offset: number };
  }> {
    const params = new URLSearchParams();
    if (skipCache) params.append("skipCache", "true");
    if (limit) params.append("limit", limit.toString());
    if (offset) params.append("offset", offset.toString());
    const queryString = params.toString() ? `?${params.toString()}` : "";
    return this.request<{
      success: boolean;
      data: AccountRequestType[];
      pagination?: { total: number; limit: number; offset: number };
    }>(`/status/cancelled${queryString}`);
  }

  /**
   * GET /user-onboarding-requests/status/expired - Get all expired onboarding requests (with pagination)
   */
  async getExpiredRequests(
    skipCache?: boolean,
    limit?: number,
    offset?: number
  ): Promise<{
    success: boolean;
    data: AccountRequestType[];
    pagination?: { total: number; limit: number; offset: number };
  }> {
    const params = new URLSearchParams();
    if (skipCache) params.append("skipCache", "true");
    if (limit) params.append("limit", limit.toString());
    if (offset) params.append("offset", offset.toString());
    const queryString = params.toString() ? `?${params.toString()}` : "";
    return this.request<{
      success: boolean;
      data: AccountRequestType[];
      pagination?: { total: number; limit: number; offset: number };
    }>(`/status/expired${queryString}`);
  }

  /**
   * GET /user-onboarding-requests/recently-submitted - Get recently submitted requests (with pagination)
   */
  async getRecentlySubmittedRequests(
    skipCache?: boolean,
    limit?: number,
    offset?: number
  ): Promise<{
    success: boolean;
    data: AccountRequestType[];
    pagination?: { total: number; limit: number; offset: number };
  }> {
    const params = new URLSearchParams();
    if (skipCache) params.append("skipCache", "true");
    if (limit) params.append("limit", limit.toString());
    if (offset) params.append("offset", offset.toString());
    const queryString = params.toString() ? `?${params.toString()}` : "";
    return this.request<{
      success: boolean;
      data: AccountRequestType[];
      pagination?: { total: number; limit: number; offset: number };
    }>(`/recently-submitted${queryString}`);
  }

  /**
   * POST /user-onboarding-requests/:id/approve - Approve an onboarding request
   */
  async approveOnboardingRequest(
    id: number,
    approverId: number,
    notes?: string,
    createUserAccount?: boolean
  ): Promise<ApiSuccessResponse<AccountRequestType>> {
    return this.request<ApiSuccessResponse<AccountRequestType>>(
      `/${id}/approve`,
      {
        method: "POST",
        body: JSON.stringify({
          approver_id: approverId,
          ...(notes && { notes }),
          ...(createUserAccount !== undefined && { create_user_account: createUserAccount }),
        }),
      }
    );
  }

  /**
   * POST /user-onboarding-requests/:id/reject - Reject an onboarding request
   */
  async rejectOnboardingRequest(
    id: number,
    approverId: number,
    rejectionReason?: string
  ): Promise<ApiSuccessResponse<AccountRequestType>> {
    return this.request<ApiSuccessResponse<AccountRequestType>>(
      `/${id}/reject`,
      {
        method: "POST",
        body: JSON.stringify({
          approver_id: approverId,
          ...(rejectionReason && { rejection_reason: rejectionReason }),
        }),
      }
    );
  }

  /**
   * POST /user-onboarding-requests/:id/move-to-review - Move request to review status
   */
  async moveToReview(
    id: number
  ): Promise<ApiSuccessResponse<AccountRequestType>> {
    return this.request<ApiSuccessResponse<AccountRequestType>>(
      `/${id}/move-to-review`,
      {
        method: "POST",
        body: JSON.stringify({}),
      }
    );
  }

  /**
   * POST /user-onboarding-requests/:id/move-to-pending-approval - Move request to pending approval status
   */
  async moveToPendingApproval(
    id: number,
    approverId: number
  ): Promise<ApiSuccessResponse<AccountRequestType>> {
    return this.request<ApiSuccessResponse<AccountRequestType>>(
      `/${id}/move-to-pending-approval`,
      {
        method: "POST",
        body: JSON.stringify({
          approver_id: approverId,
        }),
      }
    );
  }
}

export const userOnboardingService = new UserOnboardingService();
