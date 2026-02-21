import {
  API_CONFIG,
  buildApiUrl,
  getAuthHeaders,
} from "../../../shared/services/api";
import {
  Campaign,
  GetCampaignsResponse,
  GetCampaignCategoriesResponse,
  CampaignCollection,
  CampaignDetail,
  CampaignStatsResponse,
  CampaignPerformanceResponse,
  CampaignBudgetUtilResponse,
  CampaignParticipantUtilResponse,
  CampaignSegmentsResponse,
  CampaignExecutionRequestPayload,
  CampaignExecutionResponse,
  CampaignStatus,
  CampaignSearchQuery,
  CampaignSuperSearchQuery,
  CampaignListQuery,
  CampaignDateRangeQuery,
  CampaignBudgetRangeQuery,
} from "../types/campaign";
import {
  CreateCampaignRequest,
  CreateCampaignResponse,
} from "../types/createCampaign";

export interface CampaignResponse {
  success: boolean;
  data: unknown[];
  meta: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
}

const BASE_URL = buildApiUrl(API_CONFIG.ENDPOINTS.CAMPAIGNS);

class CampaignService {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
  ): Promise<T> {
    let url = `${BASE_URL}${endpoint}`;

    // Ensure no 'id' parameter is accidentally included in the URL
    try {
      const urlObj = new URL(url);
      if (urlObj.searchParams.has("id")) {
        urlObj.searchParams.delete("id");
        url = urlObj.toString();
        console.warn(
          `Removed 'id' parameter from campaign service URL: ${endpoint}`,
        );
      }
    } catch {
      // If URL parsing fails (relative URL), manually check and clean query string
      const queryIndex = url.indexOf("?");
      if (queryIndex !== -1) {
        const baseUrl = url.substring(0, queryIndex);
        const queryString = url.substring(queryIndex + 1);
        const params = new URLSearchParams(queryString);
        if (params.has("id")) {
          params.delete("id");
          const newQuery = params.toString();
          url = newQuery ? `${baseUrl}?${newQuery}` : baseUrl;
          console.warn(
            `Removed 'id' parameter from campaign service URL: ${endpoint}`,
          );
        }
      }
    }

    const response = await fetch(url, {
      ...options,
      headers: {
        ...getAuthHeaders(),
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error("API Error Response:", {
        status: response.status,
        statusText: response.statusText,
        body: errorBody,
        url,
        params: options.body,
      });

      // Try to parse error message from JSON response
      let errorMessage = `HTTP error! status: ${response.status}`;
      try {
        const errorData = JSON.parse(errorBody);
        if (errorData.error) {
          errorMessage = errorData.error;
        } else if (errorData.message) {
          errorMessage = errorData.message;
        } else {
          errorMessage = `HTTP error! status: ${response.status}, details: ${errorBody}`;
        }
      } catch {
        // If not JSON, use the raw error body
        errorMessage = errorBody || `HTTP error! status: ${response.status}`;
      }

      throw new Error(errorMessage);
    }

    return response.json();
  }

  private buildQueryString(params?: Record<string, unknown>): string {
    if (!params) {
      return "";
    }

    const searchParams = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
      if (value === undefined || value === null) {
        return;
      }

      if (Array.isArray(value)) {
        value.forEach((item) => {
          searchParams.append(key, String(item));
        });
      } else if (typeof value === "boolean") {
        searchParams.append(key, value ? "true" : "false");
      } else {
        searchParams.append(key, String(value));
      }
    });

    const query = searchParams.toString();
    return query ? `?${query}` : "";
  }

  private getCollection(
    path: string,
    params?: Record<string, unknown>,
  ): Promise<CampaignCollection> {
    const query = this.buildQueryString(params);
    return this.request<CampaignCollection>(`${path}${query}`);
  }

  async createCampaign(
    request: CreateCampaignRequest,
  ): Promise<CreateCampaignResponse> {
    const response = await this.request<CreateCampaignResponse>("/", {
      method: "POST",
      body: JSON.stringify(request),
    });

    return response;
  }

  async updateCampaign(
    id: number,
    request: Partial<CreateCampaignRequest>,
  ): Promise<Campaign> {
    return this.request<Campaign>(`/${id}`, {
      method: "PUT",
      body: JSON.stringify(request),
    });
  }

  async deleteCampaign(id: number, deletedBy: number = 1): Promise<void> {
    return this.request<void>(`/${id}`, {
      method: "DELETE",
      body: JSON.stringify({
        deleted_by: deletedBy,
      }),
    });
  }

  async getCampaignById(
    id: string | number,
    skipCache?: boolean,
  ): Promise<Campaign> {
    const params = new URLSearchParams();
    if (skipCache) params.append("skipCache", "true");
    const query = params.toString() ? `?${params.toString()}` : "";
    return this.request<Campaign>(`/${id}${query}`);
  }

  /**
   * Get campaigns list with pagination from new backend
   */
  async getCampaigns(params?: {
    limit?: number;
    offset?: number;
    skipCache?: boolean;
  }): Promise<GetCampaignsResponse> {
    const queryParams = new URLSearchParams();

    // Set defaults
    const limit = params?.limit ?? 10;
    const offset = params?.offset ?? 0;
    const skipCache = params?.skipCache ?? true;

    queryParams.append("limit", String(limit));
    queryParams.append("offset", String(offset));
    queryParams.append("skipCache", String(skipCache));

    const query = queryParams.toString() ? `?${queryParams.toString()}` : "";
    return this.request<GetCampaignsResponse>(`/${query}`);
  }

  async getAllCampaigns(params?: {
    search?: string;
    status?: string;
    approvalStatus?: string; // camelCase
    categoryId?: number; // camelCase
    programId?: number; // camelCase
    startDateFrom?: string; // camelCase
    startDateTo?: string; // camelCase
    sortBy?: string; // camelCase
    sortDirection?: "ASC" | "DESC"; // camelCase
    page?: number;
    pageSize?: number; // camelCase
    skipCache?: boolean; // camelCase
  }): Promise<CampaignResponse> {
    const queryParams = new URLSearchParams();

    // Define allowed parameters to prevent sending invalid ones like 'id', 'limit', 'offset'
    const allowedParams = [
      "search",
      "status",
      "approvalStatus",
      "categoryId",
      "programId",
      "startDateFrom",
      "startDateTo",
      "page",
      "pageSize",
      "skipCache",
    ];

    // Explicitly exclude these parameters that should never be sent
    const excludedParams = ["id", "limit", "offset"];

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        // Explicitly skip 'id' and other disallowed/excluded parameters
        if (excludedParams.includes(key) || !allowedParams.includes(key)) {
          return;
        }

        if (value !== undefined && value !== null) {
          // Skip empty strings
          if (typeof value === "string" && value.trim() === "") {
            return;
          }

          // Convert boolean to string "true"/"false"
          if (typeof value === "boolean") {
            queryParams.append(key, value ? "true" : "false");
          }
          // Ensure numeric parameters (categoryId, programId, page, pageSize) are valid numbers
          else if (
            (key === "categoryId" ||
              key === "programId" ||
              key === "page" ||
              key === "pageSize") &&
            typeof value === "number" &&
            !isNaN(value) &&
            isFinite(value)
          ) {
            queryParams.append(key, String(value));
          }
          // For other numeric values, ensure they're valid numbers
          else if (typeof value === "number") {
            if (!isNaN(value) && isFinite(value)) {
              queryParams.append(key, String(value));
            }
          }
          // Keep strings as strings
          else if (typeof value === "string") {
            queryParams.append(key, value);
          }
        }
      });
    }

    const query = queryParams.toString() ? `?${queryParams.toString()}` : "";
    return this.request<CampaignResponse>(`/all${query}`);
  }

  async getCampaignStats(
    skipCache: boolean = true,
  ): Promise<CampaignStatsResponse> {
    const query = this.buildQueryString({ skipCache });
    return this.request<CampaignStatsResponse>(`/stats${query}`);
  }

  async getCampaignsActive(
    params?: CampaignListQuery,
  ): Promise<CampaignCollection> {
    return this.getCollection("/active", params);
  }

  async getCampaignsExpired(
    params?: CampaignListQuery,
  ): Promise<CampaignCollection> {
    return this.getCollection("/expired", params);
  }

  async getCampaignsUpcoming(
    params?: CampaignListQuery & { days?: number },
  ): Promise<CampaignCollection> {
    return this.getCollection("/upcoming", params);
  }

  async getCampaignsByStatus(
    status: CampaignStatus,
    params?: CampaignListQuery,
  ): Promise<CampaignCollection> {
    return this.getCollection(`/status/${status}`, params);
  }

  async getPendingApprovalCampaigns(
    params?: CampaignListQuery,
  ): Promise<CampaignCollection> {
    return this.getCollection("/pending-approval", params);
  }

  async getApprovedCampaigns(
    params?: CampaignListQuery,
  ): Promise<CampaignCollection> {
    return this.getCollection("/approved", params);
  }

  async getRejectedCampaigns(
    params?: CampaignListQuery,
  ): Promise<CampaignCollection> {
    return this.getCollection("/rejected", params);
  }

  async getCampaignsByCategory(
    categoryId: number,
    params?: CampaignListQuery,
  ): Promise<CampaignCollection> {
    return this.getCollection(`/category/${categoryId}`, params);
  }

  async getCampaignsByProgram(
    programId: number,
    params?: CampaignListQuery,
  ): Promise<CampaignCollection> {
    return this.getCollection(`/program/${programId}`, params);
  }

  async getCampaignsByManager(
    managerId: number,
    params?: CampaignListQuery,
  ): Promise<CampaignCollection> {
    return this.getCollection(`/manager/${managerId}`, params);
  }

  async searchCampaigns(
    params: CampaignSearchQuery,
  ): Promise<CampaignCollection> {
    const query = this.buildQueryString(params);
    return this.request<CampaignCollection>(`/search${query}`);
  }

  async superSearchCampaigns(
    params: CampaignSuperSearchQuery,
  ): Promise<CampaignCollection> {
    const query = this.buildQueryString(params);
    return this.request<CampaignCollection>(`/super-search${query}`);
  }

  async getCampaignsByDateRange(
    params: CampaignDateRangeQuery,
  ): Promise<CampaignCollection> {
    const query = this.buildQueryString(params);
    return this.request<CampaignCollection>(`/date-range${query}`);
  }

  async getCampaignsByBudgetRange(
    params: CampaignBudgetRangeQuery,
  ): Promise<CampaignCollection> {
    const query = this.buildQueryString(params);
    return this.request<CampaignCollection>(`/budget-range${query}`);
  }

  async getCampaignByUuid(
    uuid: string,
    skipCache: boolean = true,
  ): Promise<CampaignDetail> {
    const query = this.buildQueryString({ skipCache });
    return this.request<CampaignDetail>(`/uuid/${uuid}${query}`);
  }

  async getCampaignByName(
    name: string,
    skipCache: boolean = true,
  ): Promise<CampaignDetail> {
    const query = this.buildQueryString({ skipCache });
    return this.request<CampaignDetail>(
      `/name/${encodeURIComponent(name)}${query}`,
    );
  }

  async getCampaignByCode(
    code: string,
    skipCache: boolean = true,
  ): Promise<CampaignDetail> {
    const query = this.buildQueryString({ skipCache });
    return this.request<CampaignDetail>(
      `/code/${encodeURIComponent(code)}${query}`,
    );
  }

  async getCampaignSegments(
    id: number,
    skipCache: boolean = true,
  ): Promise<CampaignSegmentsResponse> {
    const query = this.buildQueryString({ skipCache });
    return this.request<CampaignSegmentsResponse>(`/${id}/segments${query}`);
  }

  async getCampaignPerformance(
    id: number,
    skipCache: boolean = true,
  ): Promise<CampaignPerformanceResponse> {
    const query = this.buildQueryString({ skipCache });
    return this.request<CampaignPerformanceResponse>(
      `/${id}/performance${query}`,
    );
  }

  async getCampaignBudgetUtilisation(
    id: number,
    skipCache: boolean = true,
  ): Promise<CampaignBudgetUtilResponse> {
    const query = this.buildQueryString({ skipCache });
    return this.request<CampaignBudgetUtilResponse>(
      `/${id}/budget-utilization${query}`,
    );
  }

  async getCampaignParticipantUtilisation(
    id: number,
    skipCache: boolean = true,
  ): Promise<CampaignParticipantUtilResponse> {
    const query = this.buildQueryString({ skipCache });
    return this.request<CampaignParticipantUtilResponse>(
      `/${id}/participant-utilization${query}`,
    );
  }

  async submitForApproval(
    id: number,
    updatedBy: number = 1,
  ): Promise<CampaignDetail> {
    return this.request<CampaignDetail>(`/${id}/submit-approval`, {
      method: "PATCH",
      body: JSON.stringify({
        updated_by: updatedBy,
      }),
    });
  }

  async approveCampaign(
    id: number,
    payload: { approved_by?: number; comments?: string } | number = 1,
  ): Promise<CampaignDetail> {
    // Support both old signature (number) and new signature (object)
    const approvedBy =
      typeof payload === "number" ? payload : (payload.approved_by ?? 1);

    return this.request<CampaignDetail>(`/${id}/approve`, {
      method: "PATCH",
      body: JSON.stringify({
        approved_by: approvedBy,
        approved_at: new Date().toISOString(),
      }),
    });
  }

  async rejectCampaign(
    id: number,
    payload:
      | { rejected_by?: number; comments?: string; rejection_reason?: string }
      | number,
    rejectionReason?: string,
  ): Promise<CampaignDetail> {
    // Support multiple signatures:
    // 1. rejectCampaign(id, { comments: "...", rejected_by: 1 })
    // 2. rejectCampaign(id, rejectedBy, rejectionReason) - old signature
    let rejectedBy: number;
    let reason: string;

    if (typeof payload === "number") {
      // Old signature: rejectCampaign(id, rejectedBy, rejectionReason)
      rejectedBy = payload;
      reason = rejectionReason || "";
    } else {
      // New signature: rejectCampaign(id, { comments, rejected_by })
      rejectedBy = payload.rejected_by ?? 1;
      reason = payload.comments || payload.rejection_reason || "";
    }

    if (!reason.trim()) {
      throw new Error("Rejection reason or comments is required");
    }

    return this.request<CampaignDetail>(`/${id}/reject`, {
      method: "PATCH",
      body: JSON.stringify({
        rejected_by: rejectedBy,
        rejection_reason: reason,
        rejected_at: new Date().toISOString(),
      }),
    });
  }

  async activateCampaign(
    id: number,
    updatedBy: number = 1,
  ): Promise<CampaignDetail> {
    return this.request<CampaignDetail>(`/${id}/activate`, {
      method: "PATCH",
      body: JSON.stringify({
        updated_by: updatedBy,
      }),
    });
  }

  async pauseCampaign(
    id: number,
    payloadOrUpdatedBy: number | Record<string, unknown> = 1,
  ): Promise<CampaignDetail> {
    const payload =
      typeof payloadOrUpdatedBy === "number"
        ? { updated_by: payloadOrUpdatedBy }
        : { updated_by: 1, ...payloadOrUpdatedBy };

    return this.request<CampaignDetail>(`/${id}/pause`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
  }

  async completeCampaign(
    id: number,
    updatedBy: number = 1,
  ): Promise<CampaignDetail> {
    return this.request<CampaignDetail>(`/${id}/complete`, {
      method: "PATCH",
      body: JSON.stringify({
        updated_by: updatedBy,
      }),
    });
  }

  async resumeCampaign(
    id: number,
    updatedBy: number = 1,
  ): Promise<CampaignDetail> {
    // Resume by updating status to "active" or using activate endpoint
    return this.request<CampaignDetail>(`/${id}/activate`, {
      method: "PATCH",
      body: JSON.stringify({
        updated_by: updatedBy,
      }),
    });
  }

  async archiveCampaign(
    id: number,
    updatedBy: number = 1,
  ): Promise<CampaignDetail> {
    return this.request<CampaignDetail>(`/${id}/archive`, {
      method: "PATCH",
      body: JSON.stringify({
        updated_by: updatedBy,
      }),
    });
  }

  async updateCampaignStatus(
    id: number,
    status: CampaignStatus,
    updatedBy: number = 1,
  ): Promise<CampaignDetail> {
    return this.request<CampaignDetail>(`/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status, updated_by: updatedBy }),
    });
  }

  async updateCampaignBudget(
    id: number,
    budget_allocated: number,
    updatedBy: number = 1,
  ): Promise<CampaignDetail> {
    return this.request<CampaignDetail>(`/${id}/budget`, {
      method: "PATCH",
      body: JSON.stringify({ budget_allocated, updated_by: updatedBy }),
    });
  }

  async updateCampaignSpentBudget(
    id: number,
    budget_spent: number,
    updatedBy: number = 1,
  ): Promise<CampaignDetail> {
    return this.request<CampaignDetail>(`/${id}/spent-budget`, {
      method: "PATCH",
      body: JSON.stringify({ budget_spent, updated_by: updatedBy }),
    });
  }

  async updateCampaignParticipants(
    id: number,
    current_participants: number,
    updatedBy: number = 1,
  ): Promise<CampaignDetail> {
    return this.request<CampaignDetail>(`/${id}/participants`, {
      method: "PATCH",
      body: JSON.stringify({ current_participants, updated_by: updatedBy }),
    });
  }

  async updateControlGroup(
    id: number,
    payload: {
      control_group_enabled: boolean;
      control_group_percentage?: number;
      updated_by?: number;
    },
  ): Promise<CampaignDetail> {
    const body = {
      updated_by: payload.updated_by ?? 1,
      control_group_enabled: payload.control_group_enabled,
      control_group_percentage: payload.control_group_percentage,
    };
    return this.request<CampaignDetail>(`/${id}/control-group`, {
      method: "PATCH",
      body: JSON.stringify(body),
    });
  }

  async addCampaignSegment(
    id: number,
    payload: {
      segment_id: number;
      is_primary?: boolean;
      include_exclude?: "include" | "exclude";
      created_by?: number;
    },
  ): Promise<Record<string, unknown>> {
    return this.request<Record<string, unknown>>(`/${id}/segments`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  /**
   * Get Campaigns catalogs from new backend endpoint
   */
  async getCampaignCategories(params?: {
    limit?: number;
    offset?: number;
    search?: string;
    skipCache?: boolean;
  }): Promise<GetCampaignCategoriesResponse> {
    const queryParams = new URLSearchParams();

    // Set defaults
    const limit = params?.limit ?? 50;
    const offset = params?.offset ?? 0;
    const skipCache = params?.skipCache ?? false;

    queryParams.append("limit", String(limit));
    queryParams.append("offset", String(offset));
    if (skipCache) queryParams.append("skipCache", "true");

    if (params?.search) {
      queryParams.append("search", params.search);
    }

    const query = queryParams.toString() ? `?${queryParams.toString()}` : "";

    // Use campaign-categories endpoint instead of /categories
    const categoriesUrl = `${API_CONFIG.BASE_URL}/campaign-categories${query}`;

    const response = await fetch(categoriesUrl, {
      method: "GET",
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error("API Error Response:", {
        status: response.status,
        statusText: response.statusText,
        body: errorBody,
        url: categoriesUrl,
      });
      throw new Error(
        `HTTP error! status: ${response.status}, details: ${errorBody}`,
      );
    }

    return response.json();
  }

  async createCampaignCategory(request: {
    name: string;
    description: string;
    parent_category_id?: number | null;
    display_order?: number;
    is_active?: boolean;
    created_by: number;
  }): Promise<Record<string, unknown>> {
    const categoriesUrl = `${API_CONFIG.BASE_URL}/campaign-categories`;

    const response = await fetch(categoriesUrl, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error("API Error Response:", {
        status: response.status,
        statusText: response.statusText,
        body: errorBody,
        url: categoriesUrl,
      });
      throw new Error(
        `HTTP error! status: ${response.status}, details: ${errorBody}`,
      );
    }

    return response.json();
  }

  async updateCampaignCategory(
    id: number,
    request: { name?: string; description?: string; is_active?: boolean },
  ): Promise<Record<string, unknown>> {
    const categoriesUrl = `${API_CONFIG.BASE_URL}/campaign-categories/${id}`;

    const response = await fetch(categoriesUrl, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      try {
        const errorData = await response.json();
        // Extract error message from response
        if (errorData.error) {
          throw new Error(errorData.error);
        }
        if (errorData.message) {
          throw new Error(errorData.message);
        }
        if (errorData.details) {
          throw new Error(errorData.details);
        }
        // Fallback to status code if no error message
        throw new Error(`Failed to update category: ${response.status}`);
      } catch (err) {
        // If JSON parsing fails, try text
        if (err instanceof Error && err.message.includes("JSON")) {
          const errorText = await response.text();
          throw new Error(
            errorText || `Failed to update category: ${response.status}`,
          );
        }
        if (err instanceof Error) {
          throw err;
        }
        throw new Error(`Failed to update category: ${response.status}`);
      }
    }

    // Check if response has content
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      return response.json();
    }

    // Return empty object if no JSON content
    return {};
  }

  async deleteCampaignCategory(id: number): Promise<void> {
    const categoriesUrl = `${API_CONFIG.BASE_URL}/campaign-categories/${id}`;

    const response = await fetch(categoriesUrl, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error("API Error Response:", {
        status: response.status,
        statusText: response.statusText,
        body: errorBody,
        url: categoriesUrl,
      });
      throw new Error(
        `Failed to delete category: ${response.status} - ${errorBody}`,
      );
    }

    // DELETE may not return a body, so we don't try to parse JSON
  }

  /**
   * Get campaign category by ID
   */
  async getCampaignCategoryById(
    id: number,
    skipCache: boolean = false,
  ): Promise<Record<string, unknown>> {
    const categoriesUrl = `${API_CONFIG.BASE_URL}/campaign-categories/${id}${
      skipCache ? "?skipCache=true" : ""
    }`;

    const response = await fetch(categoriesUrl, {
      method: "GET",
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error("API Error Response:", {
        status: response.status,
        statusText: response.statusText,
        body: errorBody,
        url: categoriesUrl,
      });
      throw new Error(
        `HTTP error! status: ${response.status}, details: ${errorBody}`,
      );
    }

    return response.json();
  }

  /**
   * Get campaign category tree
   */
  async getCampaignCategoryTree(
    skipCache: boolean = false,
  ): Promise<Record<string, unknown>> {
    const categoriesUrl = `${API_CONFIG.BASE_URL}/campaign-categories/tree${
      skipCache ? "?skipCache=true" : ""
    }`;

    const response = await fetch(categoriesUrl, {
      method: "GET",
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error("API Error Response:", {
        status: response.status,
        statusText: response.statusText,
        body: errorBody,
        url: categoriesUrl,
      });
      throw new Error(
        `HTTP error! status: ${response.status}, details: ${errorBody}`,
      );
    }

    return response.json();
  }

  /**
   * Get category children
   */
  async getCampaignCategoryChildren(
    id: number,
    skipCache: boolean = false,
  ): Promise<Record<string, unknown>> {
    const categoriesUrl = `${
      API_CONFIG.BASE_URL
    }/campaign-categories/${id}/children${skipCache ? "?skipCache=true" : ""}`;

    const response = await fetch(categoriesUrl, {
      method: "GET",
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error("API Error Response:", {
        status: response.status,
        statusText: response.statusText,
        body: errorBody,
        url: categoriesUrl,
      });
      throw new Error(
        `HTTP error! status: ${response.status}, details: ${errorBody}`,
      );
    }

    return response.json();
  }

  /**
   * Get active Campaigns catalogs
   */
  async getActiveCampaignCategories(params?: {
    limit?: number;
    offset?: number;
    skipCache?: boolean;
  }): Promise<Record<string, unknown>> {
    const queryParams = new URLSearchParams();
    if (params?.limit) queryParams.append("limit", String(params.limit));
    if (params?.offset) queryParams.append("offset", String(params.offset));
    if (params?.skipCache) queryParams.append("skipCache", "true");
    const query = queryParams.toString() ? `?${queryParams.toString()}` : "";
    const categoriesUrl = `${API_CONFIG.BASE_URL}/campaign-categories/active${query}`;

    const response = await fetch(categoriesUrl, {
      method: "GET",
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(
        `HTTP error! status: ${response.status}, details: ${errorBody}`,
      );
    }

    return response.json();
  }

  /**
   * Get root Campaigns catalogs
   */
  async getRootCampaignCategories(params?: {
    limit?: number;
    offset?: number;
    skipCache?: boolean;
  }): Promise<Record<string, unknown>> {
    const queryParams = new URLSearchParams();
    if (params?.limit) queryParams.append("limit", String(params.limit));
    if (params?.offset) queryParams.append("offset", String(params.offset));
    if (params?.skipCache) queryParams.append("skipCache", "true");
    const query = queryParams.toString() ? `?${queryParams.toString()}` : "";
    const categoriesUrl = `${API_CONFIG.BASE_URL}/campaign-categories/roots${query}`;

    const response = await fetch(categoriesUrl, {
      method: "GET",
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(
        `HTTP error! status: ${response.status}, details: ${errorBody}`,
      );
    }

    return response.json();
  }

  /**
   * Search Campaigns catalogs
   */
  async searchCampaignCategories(
    searchTerm: string,
    params?: {
      limit?: number;
      offset?: number;
      skipCache?: boolean;
    },
  ): Promise<Record<string, unknown>> {
    const queryParams = new URLSearchParams();
    queryParams.append("searchTerm", searchTerm);
    if (params?.limit) queryParams.append("limit", String(params.limit));
    if (params?.offset) queryParams.append("offset", String(params.offset));
    if (params?.skipCache) queryParams.append("skipCache", "true");
    const query = queryParams.toString() ? `?${queryParams.toString()}` : "";
    const categoriesUrl = `${API_CONFIG.BASE_URL}/campaign-categories/search${query}`;

    const response = await fetch(categoriesUrl, {
      method: "GET",
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(
        `HTTP error! status: ${response.status}, details: ${errorBody}`,
      );
    }

    return response.json();
  }

  /**
   * Get campaign category statistics
   */
  async getCampaignCategoryStats(
    skipCache: boolean = false,
  ): Promise<Record<string, unknown>> {
    const categoriesUrl = `${API_CONFIG.BASE_URL}/campaign-categories/stats${
      skipCache ? "?skipCache=true" : ""
    }`;

    const response = await fetch(categoriesUrl, {
      method: "GET",
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(
        `HTTP error! status: ${response.status}, details: ${errorBody}`,
      );
    }

    return response.json();
  }

  /**
   * Get campaign category by name
   */
  async getCampaignCategoryByName(
    name: string,
    skipCache: boolean = false,
  ): Promise<Record<string, unknown>> {
    const categoriesUrl = `${
      API_CONFIG.BASE_URL
    }/campaign-categories/name/${encodeURIComponent(name)}${
      skipCache ? "?skipCache=true" : ""
    }`;

    const response = await fetch(categoriesUrl, {
      method: "GET",
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(
        `HTTP error! status: ${response.status}, details: ${errorBody}`,
      );
    }

    return response.json();
  }

  /**
   * Execute a campaign
   */
  async executeCampaign(
    request: CampaignExecutionRequestPayload,
  ): Promise<CampaignExecutionResponse> {
    return this.request<CampaignExecutionResponse>("/execute", {
      method: "POST",
      body: JSON.stringify(request),
    });
  }
}

export const campaignService = new CampaignService();
export default campaignService;
