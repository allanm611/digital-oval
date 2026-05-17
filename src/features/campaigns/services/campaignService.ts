import {
  API_CONFIG,
  buildApiUrl,
  getAuthHeaders,
} from "../../../shared/services/api";
import { buildQueryString } from "../utils/buildQueryString";
import { extractErrorMessage, isHtmlError } from "../../../shared/utils/errorHandler";
import {
  BackendCampaignType,
  CampaignResponse,
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

const BASE_URL = buildApiUrl(API_CONFIG.ENDPOINTS.CAMPAIGNS);

// Default values for missing/null fields in categories
const CATEGORY_FIELD_DEFAULTS = {
  name: "—",
  description: "—",
};

// Default values for missing/null fields in campaigns
const CAMPAIGN_FIELD_DEFAULTS = {
  name: "—",
  code: "—",
  description: "—",
  objective: "—",
  category: "—",
  program_id: "—",
  timezone: "—",
  budget_allocated: "—",
  budget_spent: "—",
  max_participants: "—",
  current_participants: "—",
  target_reach: "—",
  target_conversion_rate: "—",
  target_revenue: "—",
  rejection_reason: "—",
  owner_team: "—",
  campaign_uuid: "—",
};

class CampaignService {
  // Normalize category data from API with type safety 
  private normalizeCategory(data: unknown) {
    const item = data as Record<string, unknown>;
    return {
      id: (item?.id as number) || 0,
      name: (item?.name as string) || CATEGORY_FIELD_DEFAULTS.name,
      description: (item?.description as string) || CATEGORY_FIELD_DEFAULTS.description,
      parent_category_id: (item?.parent_category_id as number | null) || null,
      display_order: (item?.display_order as number) ?? 0,
      is_active: (item?.is_active as boolean) ?? true,
      created_at: (item?.created_at as string) || new Date().toISOString(),
      updated_at: (item?.updated_at as string) || new Date().toISOString(),
    };
  }

  // Normalize campaign data from API with type safety
  private normalizeCampaign(data: unknown): BackendCampaignType {
    const item = data as Record<string, unknown>;

    return {
      id: item?.id as number,
      campaign_uuid: item?.campaign_uuid as string,
      name: item?.name as string,
      code: item?.code as string,
      objective: item?.objective as string,
      status: item?.status as "draft" | "active" | "paused" | "completed" | "cancelled" | "scheduled",
      approval_status: item?.approval_status as "pending" | "approved" | "rejected",
      control_group_enabled: (item?.control_group_enabled as boolean) ?? false,
      is_active: (item?.is_active as boolean) ?? false,
      created_at: item?.created_at as string,
      updated_at: item?.updated_at as string,
      tags: Array.isArray(item?.tags) ? (item.tags as string[]) : [],
      description: (item?.description as string) || CAMPAIGN_FIELD_DEFAULTS.description,
      timezone: (item?.timezone as string | null) || null,
      budget_allocated: (item?.budget_allocated as string | null) || null,
      budget_spent: (item?.budget_spent as string | null) || null,
      target_conversion_rate: (item?.target_conversion_rate as string | null) || null,
      target_revenue: (item?.target_revenue as string | null) || null,
      owner_team: (item?.owner_team as string | null) || null,
      rejection_reason: (item?.rejection_reason as string | null) || null,
      control_group_percentage: (item?.control_group_percentage as string | null) || null,
      start_date: (item?.start_date as string | null) || null,
      end_date: (item?.end_date as string | null) || null,
      approved_at: (item?.approved_at as string | null) || null,
      deleted_at: (item?.deleted_at as string | null) || null,
      category_id: (item?.category_id as number | null) || null,
      program_id: (item?.program_id as number | null) || null,
      max_participants: typeof item?.max_participants === "number" ? item.max_participants : null,
      current_participants: typeof item?.current_participants === "number" ? item.current_participants : null,
      target_reach: typeof item?.target_reach === "number" ? item.target_reach : null,
      campaign_manager_id: (item?.campaign_manager_id as number | null) || null,
      approved_by: (item?.approved_by as number | null) || null,
      created_by: (item?.created_by as number | null) || null,
      updated_by: (item?.updated_by as number | null) || null,
      deleted_by: (item?.deleted_by as number | null) || null,
      tenant_id: (item?.tenant_id as number | null) || null,
      client_id: (item?.client_id as number | null) || null,
      attribution_model_id: (item?.attribution_model_id as number | null) || null,
      metadata: (item?.metadata as Record<string, unknown>) || {},
      suppression_list_ids: Array.isArray(item?.suppression_list_ids) ? (item.suppression_list_ids as number[]) : null,
      priority: (item?.priority as string | null) || null,
      priority_rank: typeof item?.priority_rank === "number" ? item.priority_rank : null,
      line_of_business: (item?.line_of_business as string | null) || null,
      communication_policy: (item?.communication_policy as string | null) || null,
      department: (item?.department as string | null) || null,
      offer_count: typeof item?.offer_count === "number" ? item.offer_count : undefined,
      segment_count: typeof item?.segment_count === "number" ? item.segment_count : undefined,
      offers: Array.isArray(item?.offers) ? (item.offers as any[]) : undefined,
      segments: Array.isArray(item?.segments) ? (item.segments as any[]) : undefined,
    };
  }
  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
  ): Promise<T> {
    let url = `${BASE_URL}${endpoint}`;

    // Prevent id conflicts: remove ?id= query param since id is already in URL path
    try {
      const urlObj = new URL(url);
      if (urlObj.searchParams.has("id")) {
        urlObj.searchParams.delete("id");
        url = urlObj.toString();
      }
    } catch {
      // Fallback for relative URLs that can't be parsed as URL objects
      const queryIndex = url.indexOf("?");
      if (queryIndex !== -1) {
        const baseUrl = url.substring(0, queryIndex);
        const queryString = url.substring(queryIndex + 1);
        const params = new URLSearchParams(queryString);
        if (params.has("id")) {
          params.delete("id");
          const newQuery = params.toString();
          url = newQuery ? `${baseUrl}?${newQuery}` : baseUrl;
        
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
      const errorMessage = extractErrorMessage(errorBody, response.status);
      throw new Error(errorMessage);
    }

    return response.json();
  }

  // Fetch campaign list from API path with optional filters, then normalize each campaign object 
  private async getCollection(
    path: string,
    params?: Record<string, unknown>,
  ): Promise<CampaignCollection> {
    const query = buildQueryString(params);
    const response = await this.request<CampaignCollection>(`${path}${query}`);

    // Normalize all campaigns in the collection
    if (response && "data" in response && Array.isArray(response.data)) {
      return {
        ...response,
        data: response.data.map((campaign: unknown) => this.normalizeCampaign(campaign)),
      };
    }
    return response;
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
  ): Promise<BackendCampaignType> {
    const response = await this.request<any>(`/${id}`, {
      method: "PUT",
      body: JSON.stringify(request),
    });
    // Normalize the response data
    return this.normalizeCampaign(response.data || response);
  }

  async deleteCampaign(id: number, deletedBy?: number): Promise<void> {
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
  ): Promise<BackendCampaignType> {
    const params = new URLSearchParams();
    if (skipCache) params.append("skipCache", "true");
    const query = params.toString() ? `?${params.toString()}` : "";
    const response = await this.request<any>(`/${id}${query}`);
    // Normalize the response data
    return this.normalizeCampaign(response.data || response);
  }

  /** Get campaigns list with pagination and normalize each campaign */
  async getCampaigns(params?: {
    limit?: number;
    offset?: number;
    skipCache?: boolean;
  }): Promise<GetCampaignsResponse> {
    const queryParams = new URLSearchParams();

    const limit = params?.limit ?? 10;
    const offset = params?.offset ?? 0;
    const skipCache = params?.skipCache ?? true;

    queryParams.append("limit", String(limit));
    queryParams.append("offset", String(offset));
    queryParams.append("skipCache", String(skipCache));

    const query = queryParams.toString() ? `?${queryParams.toString()}` : "";
    const response = await this.request<GetCampaignsResponse>(`/${query}`);

    if (response && Array.isArray(response.data)) {
      return {
        ...response,
        data: response.data.map(campaign => this.normalizeCampaign(campaign)),
      };
    }
    return response;
  }

  /** Fetch all campaigns with advanced filters and normalize each campaign */
  async getAllCampaigns(params?: {
    search?: string;
    status?: string;
    approvalStatus?: string;
    categoryId?: number;
    programId?: number;
    startDateFrom?: string;
    startDateTo?: string;
    sortBy?: string;
    sortDirection?: "ASC" | "DESC";
    page?: number;
    pageSize?: number;
    skipCache?: boolean;
  }): Promise<CampaignResponse> {
    const queryParams = new URLSearchParams();

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

    const excludedParams = ["id", "limit", "offset"];

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (excludedParams.includes(key) || !allowedParams.includes(key)) {
          return;
        }

        if (value !== undefined && value !== null) {
          if (typeof value === "string" && value.trim() === "") {
            return;
          }

          if (typeof value === "boolean") {
            queryParams.append(key, value ? "true" : "false");
          } else if (
            (key === "categoryId" ||
              key === "programId" ||
              key === "page" ||
              key === "pageSize") &&
            typeof value === "number" &&
            !isNaN(value) &&
            isFinite(value)
          ) {
            queryParams.append(key, String(value));
          } else if (typeof value === "number") {
            if (!isNaN(value) && isFinite(value)) {
              queryParams.append(key, String(value));
            }
          } else if (typeof value === "string") {
            queryParams.append(key, value);
          }
        }
      });
    }

    const query = queryParams.toString() ? `?${queryParams.toString()}` : "";
    const response = await this.request<CampaignResponse>(`/all${query}`);

    if (response && Array.isArray(response.data)) {
      return {
        ...response,
        data: response.data.map((campaign: unknown) => this.normalizeCampaign(campaign)),
      };
    }
    return response;
  }

  async getCampaignStats(
    skipCache: boolean = true,
  ): Promise<CampaignStatsResponse> {
    const query = buildQueryString({ skipCache });
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

  async batchAssignCategory(
    campaignIds: number[],
    categoryId: number,
  ): Promise<{ success: boolean; message: string; updated_count: number }> {
    return this.request("/batch/category", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ campaign_ids: campaignIds, category_id: categoryId }),
    });
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
    const query = buildQueryString(params);
    return this.request<CampaignCollection>(`/search${query}`);
  }

  async superSearchCampaigns(
    params: CampaignSuperSearchQuery,
  ): Promise<CampaignCollection> {
    const query = buildQueryString(params);
    return this.request<CampaignCollection>(`/super-search${query}`);
  }

  async getCampaignsByDateRange(
    params: CampaignDateRangeQuery,
  ): Promise<CampaignCollection> {
    const query = buildQueryString(params);
    return this.request<CampaignCollection>(`/date-range${query}`);
  }

  async getCampaignsByBudgetRange(
    params: CampaignBudgetRangeQuery,
  ): Promise<CampaignCollection> {
    const query = buildQueryString(params);
    return this.request<CampaignCollection>(`/budget-range${query}`);
  }

  async getCampaignByUuid(
    uuid: string,
    skipCache: boolean = true,
  ): Promise<CampaignDetail> {
    const query = buildQueryString({ skipCache });
    return this.request<CampaignDetail>(`/uuid/${uuid}${query}`);
  }

  async getCampaignByName(
    name: string,
    skipCache: boolean = true,
  ): Promise<CampaignDetail> {
    const query = buildQueryString({ skipCache });
    return this.request<CampaignDetail>(
      `/name/${encodeURIComponent(name)}${query}`,
    );
  }

  async getCampaignByCode(
    code: string,
    skipCache: boolean = true,
  ): Promise<CampaignDetail> {
    const query = buildQueryString({ skipCache });
    return this.request<CampaignDetail>(
      `/code/${encodeURIComponent(code)}${query}`,
    );
  }

  async getCampaignSegments(
    id: number,
    skipCache: boolean = true,
  ): Promise<CampaignSegmentsResponse> {
    const query = buildQueryString({ skipCache });
    return this.request<CampaignSegmentsResponse>(`/${id}/segments${query}`);
  }

  async getCampaignPerformance(
    id: number,
    skipCache: boolean = true,
  ): Promise<CampaignPerformanceResponse> {
    const query = buildQueryString({ skipCache });
    return this.request<CampaignPerformanceResponse>(
      `/${id}/performance${query}`,
    );
  }

  async getCampaignBudgetUtilisation(
    id: number,
    skipCache: boolean = true,
  ): Promise<CampaignBudgetUtilResponse> {
    const query = buildQueryString({ skipCache });
    return this.request<CampaignBudgetUtilResponse>(
      `/${id}/budget-utilization${query}`,
    );
  }

  async getCampaignParticipantUtilisation(
    id: number,
    skipCache: boolean = true,
  ): Promise<CampaignParticipantUtilResponse> {
    const query = buildQueryString({ skipCache });
    return this.request<CampaignParticipantUtilResponse>(
      `/${id}/participant-utilization${query}`,
    );
  }

  async submitForApproval(
    id: number,
    updatedBy?: number,
  ): Promise<CampaignDetail> {
    return this.request<CampaignDetail>(`/${id}/submit-approval`, {
      method: "PATCH",
      body: JSON.stringify({
        updated_by: updatedBy,
      }),
    });
  }

  /** Approve a campaign with approver user ID (required) */
  async approveCampaign(
    id: number,
    payload: { approved_by: number; comments?: string } | number,
  ): Promise<CampaignDetail> {
    const approvedBy = typeof payload === "number" ? payload : payload.approved_by;

    if (!approvedBy) {
      throw new Error("approved_by is required");
    }

    return this.request<CampaignDetail>(`/${id}/approve`, {
      method: "PATCH",
      body: JSON.stringify({
        approved_by: approvedBy,
        approved_at: new Date().toISOString(),
      }),
    });
  }

  /** Reject a campaign with rejector user ID (required) */
  async rejectCampaign(
    id: number,
    payload: { rejected_by: number; comments?: string; rejection_reason?: string } | number,
    rejectionReason?: string,
  ): Promise<CampaignDetail> {
    let rejectedBy: number;
    let reason: string;

    if (typeof payload === "number") {
      rejectedBy = payload;
      reason = rejectionReason || "";
    } else {
      rejectedBy = payload.rejected_by;
      reason = payload.comments || payload.rejection_reason || "";
    }

    if (!rejectedBy) {
      throw new Error("rejected_by is required");
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
    updatedBy?: number,
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
    payloadOrUpdatedBy?: number | Record<string, unknown>,
  ): Promise<CampaignDetail> {
    const payload =
      typeof payloadOrUpdatedBy === "number"
        ? { updated_by: payloadOrUpdatedBy }
        : { ...payloadOrUpdatedBy };

    return this.request<CampaignDetail>(`/${id}/pause`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
  }

  async completeCampaign(
    id: number,
    updatedBy?: number,
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
    updatedBy?: number,
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
    updatedBy?: number,
  ): Promise<CampaignDetail> {
    return this.request<CampaignDetail>(`/${id}/archive`, {
      method: "PATCH",
      body: JSON.stringify({
        updated_by: updatedBy,
      }),
    });
  }

  async unarchiveCampaign(
    id: number,
    updatedBy?: number,
  ): Promise<CampaignDetail> {
    return this.request<CampaignDetail>(`/${id}/unarchive`, {
      method: "PATCH",
      body: JSON.stringify({
        updated_by: updatedBy,
      }),
    });
  }

  async updateCampaignStatus(
    id: number,
    status: CampaignStatus,
    updatedBy?: number,
  ): Promise<CampaignDetail> {
    return this.request<CampaignDetail>(`/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status, updated_by: updatedBy }),
    });
  }

  async updateCampaignBudget(
    id: number,
    budget_allocated: number,
    updatedBy?: number,
  ): Promise<CampaignDetail> {
    return this.request<CampaignDetail>(`/${id}/budget`, {
      method: "PATCH",
      body: JSON.stringify({ budget_allocated, updated_by: updatedBy }),
    });
  }

  async updateCampaignSpentBudget(
    id: number,
    budget_spent: number,
    updatedBy?: number,
  ): Promise<CampaignDetail> {
    return this.request<CampaignDetail>(`/${id}/spent-budget`, {
      method: "PATCH",
      body: JSON.stringify({ budget_spent, updated_by: updatedBy }),
    });
  }

  async updateCampaignParticipants(
    id: number,
    current_participants: number,
    updatedBy?: number,
  ): Promise<CampaignDetail> {
    return this.request<CampaignDetail>(`/${id}/participants`, {
      method: "PATCH",
      body: JSON.stringify({ current_participants, updated_by: updatedBy }),
    });
  }

  /** Update campaign control group settings with user ID (required) */
  async updateControlGroup(
    id: number,
    payload: {
      control_group_enabled: boolean;
      control_group_percentage?: number;
      updated_by: number;
    },
  ): Promise<CampaignDetail> {
    const body = {
      updated_by: payload.updated_by,
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

  /** Update control group configuration for a specific campaign segment */
  async updateSegmentControlGroup(
    campaignId: number,
    segmentId: number,
    payload: {
      control_group_type: "none" | "with_control" | "universal";
      config_method?: "fixed_percentage" | "fixed_number" | "advanced";
      percentage?: number;
      fixed_number?: number;
      advanced_params?: Record<string, unknown>;
      control_group_id?: number;
    },
  ): Promise<{ success: boolean; message: string }> {
    return this.request<{ success: boolean; message: string }>(
      `/${campaignId}/segments/${segmentId}/control-group`,
      {
        method: "PATCH",
        body: JSON.stringify(payload),
      },
    );
  }

  /** Generate control group members for a campaign segment */
  async generateControlGroupMembers(
    campaignId: number,
    segmentId: number,
    dryRun: boolean = false,
  ): Promise<{
    campaign_id: number;
    segment_id: number;
    control_group_type: "with_control" | "universal";
    control_group_id: number;
    segment_size?: number;
    target_count?: number;
    added_count?: number;
    skipped_count?: number;
    intersection_count?: number;
    intersection_subscriber_ids?: number[];
    dry_run: boolean;
    message: string;
  }> {
    const queryParams = dryRun ? "?dry_run=true" : "";
    return this.request(
      `/${campaignId}/segments/${segmentId}/generate-members${queryParams}`,
      {
        method: "POST",
      },
    );
  }

  /** Get campaign categories with pagination and normalize each category */
  async getCampaignCategories(params?: {
    limit?: number;
    offset?: number;
    search?: string;
    skipCache?: boolean;
  }): Promise<GetCampaignCategoriesResponse> {
    const queryParams = new URLSearchParams();

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
    const categoriesUrl = `${API_CONFIG.BASE_URL}/campaign-categories${query}`;

    const response = await fetch(categoriesUrl, {
      method: "GET",
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      const errorMessage = extractErrorMessage(errorBody, response.status);
      throw new Error(errorMessage);
    }

    const result = await response.json();

    if (result && Array.isArray(result.data)) {
      return {
        ...result,
        data: result.data.map((category: unknown) => this.normalizeCategory(category)),
      };
    }

    return result;
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
      const errorMessage = extractErrorMessage(errorBody, response.status);
      throw new Error(errorMessage);
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
      const errorBody = await response.text();
      const errorMessage = extractErrorMessage(errorBody, response.status);
      throw new Error(errorMessage);
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
      throw new Error(
        `Failed to delete category: ${response.status} - ${errorBody}`,
      );
    }

    // DELETE may not return a body, so we don't try to parse JSON
  }

  /** Get campaign category by ID */
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
      const errorMessage = extractErrorMessage(errorBody, response.status);
      throw new Error(errorMessage);
    }

    return response.json();
  }

  /** Get campaign category tree structure */
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
      const errorMessage = extractErrorMessage(errorBody, response.status);
      throw new Error(errorMessage);
    }

    return response.json();
  }

  /** Get child categories for a given category ID */
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
      const errorMessage = extractErrorMessage(errorBody, response.status);
      throw new Error(errorMessage);
    }

    return response.json();
  }

  /** Get active campaign categories */
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
      const errorMessage = extractErrorMessage(errorBody, response.status);
      throw new Error(errorMessage);
    }

    return response.json();
  }

  /** Get root level campaign categories */
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
      const errorMessage = extractErrorMessage(errorBody, response.status);
      throw new Error(errorMessage);
    }

    return response.json();
  }

  /** Search campaign categories by term */
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
      const errorMessage = extractErrorMessage(errorBody, response.status);
      throw new Error(errorMessage);
    }

    return response.json();
  }

  /** Get statistics for campaign categories */
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
      const errorMessage = extractErrorMessage(errorBody, response.status);
      throw new Error(errorMessage);
    }

    return response.json();
  }

  /** Get campaign category by name */
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
      const errorMessage = extractErrorMessage(errorBody, response.status);
      throw new Error(errorMessage);
    }

    return response.json();
  }

  /** Run a campaign */
  async runCampaign(
    request: CampaignExecutionRequestPayload,
  ): Promise<CampaignExecutionResponse> {
    return this.request<CampaignExecutionResponse>("/execute", {
      method: "POST",
      body: JSON.stringify(request),
    });
  }

  /** Duplicate a campaign */
  async duplicateCampaign(id: string): Promise<CampaignResponse> {
    return this.request<CampaignResponse>(`/${id}/duplicate`, {
      method: "POST",
    });
  }
}

export const campaignService = new CampaignService();
export default campaignService;
