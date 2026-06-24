import {
  SegmentType,
  SegmentCategoryType,
  SegmentRuleType,
  SegmentMemberType,
  SegmentCriteriaType,
  CreateSegmentRequest,
  UpdateSegmentRequest,
  CreateSegmentCategoryRequest,
  UpdateSegmentCategoryRequest,
  AddSegmentMembersRequest,
  DeleteSegmentMembersRequest,
  CreateSegmentRuleRequest,
  UpdateSegmentRuleRequest,
  DuplicateSegmentRequest,
  ValidateCriteriaRequest,
  ValidateRulesRequest,
  ComputeSegmentRequest,
  BatchComputeRequest,
  PreviewSegmentRequest,
  SearchSegmentMembersRequest,
  CustomExportRequest,
  SearchSegmentsQuery,
  GetSegmentsQuery,
  GetSegmentMembersQuery,
  ApiSuccessResponse,
  PaginatedResponse,
  // SegmentResponse,
  SegmentCategoriesResponse,
  // SegmentMembersResponse,
  ComputationStatusResponse,
  ExportStatusResponse,
  PreviewResponse,
  PreviewSampleResponse,
  ExportSegmentQuery,
  // ExportFormatEnum,
  // New Analytics Types
  HealthSummaryResponse,
  CreationTrendResponse,
  TypeDistributionResponse,
  CategoryDistributionResponse,
  LargestSegmentsResponse,
  StaleSegmentsResponse,
  // Advanced Types
  SegmentHierarchyResponse,
  GrowthTrendResponse,
  PerformanceMetricsResponse,
  UsageInCampaignsResponse,
  SegmentOverlapResponse,
  // Activation Types
  BatchActivationRequest,
  BatchActivationResponse,
  // Advanced Search
  AdvancedSearchQuery,
  // Tag Management
  TagManagementRequest,
  TagManagementResponse,
  // Query Management
  QueryUpdateRequest,
  QueryValidationResponse,
  // Size Estimation
  SizeEstimateRequest,
  SizeEstimateResponse,
  // Segmentation Fields API
  SegmentationFieldsResponse,
  GenerateQueryPreviewRequest,
  GenerateQueryPreviewResponse,
  SegmentPayload,
} from "../types/segment";
import {
  API_CONFIG,
  buildApiUrl,
  getAuthHeaders,
} from "../../../shared/services/api";

const BASE_URL = buildApiUrl(API_CONFIG.ENDPOINTS.SEGMENTS || "/segments");
const CATEGORIES_BASE_URL = buildApiUrl("/segment-categories");
const MEMBERS_BASE_URL = buildApiUrl("/segment-members");

const SEGMENT_FIELD_DEFAULTS = {
  name: "Not specified",
  code: "Not specified",
  description: "Not specified",
  type: "static" as const,
  visibility: "private" as const,
};

const SEGMENT_CATEGORY_FIELD_DEFAULTS = {
  name: "Not specified",
  description: "Not specified",
};

class SegmentService {
  private normalizeSegment(data: any): SegmentType {
    if (!data) {
      return {
        id: 0,
        name: SEGMENT_FIELD_DEFAULTS.name,
        code: SEGMENT_FIELD_DEFAULTS.code,
        type: SEGMENT_FIELD_DEFAULTS.type,
        category: null,
        parent_segment: null,
        description: SEGMENT_FIELD_DEFAULTS.description,
        definition: null,
        query: null,
        count_query: null,
        size_estimate: null,
        last_computed_at: null,
        tags: [],
        is_active: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        updated_by: null,
        visibility: SEGMENT_FIELD_DEFAULTS.visibility,
        created_by_user_id: null,
      };
    }

    return {
      id: data.id || 0,
      name: data.name || SEGMENT_FIELD_DEFAULTS.name,
      code: data.code || SEGMENT_FIELD_DEFAULTS.code,
      type: data.type || SEGMENT_FIELD_DEFAULTS.type,
      category: data.category || null,
      parent_segment: data.parent_segment || null,
      description: data.description || SEGMENT_FIELD_DEFAULTS.description,
      definition: data.definition || null,
      query: data.query || null,
      count_query: data.count_query || null,
      size_estimate: data.size_estimate || null,
      last_computed_at: data.last_computed_at || null,
      tags: Array.isArray(data.tags) ? data.tags : [],
      is_active: data.is_active ?? false,
      created_at: data.created_at || new Date().toISOString(),
      updated_at: data.updated_at || new Date().toISOString(),
      updated_by: data.updated_by || null,
      visibility: data.visibility || SEGMENT_FIELD_DEFAULTS.visibility,
      created_by_user_id: data.created_by_user_id || null,
      segment_type_id: data.segment_type_id || undefined,
      segment_type_label: data.segment_type_label || undefined,
      customer_identity_field_mapping: data.customer_identity_field_mapping || undefined,
      unique_identifier: data.unique_identifier || undefined,
    };
  }

  private normalizeSegmentCategory(data: any): SegmentCategoryType {
    if (!data) {
      return {
        id: 0,
        name: SEGMENT_CATEGORY_FIELD_DEFAULTS.name,
        description: SEGMENT_CATEGORY_FIELD_DEFAULTS.description,
        parent_category_id: null,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
    }

    return {
      id: data.id || 0,
      name: data.name || SEGMENT_CATEGORY_FIELD_DEFAULTS.name,
      description:
        data.description || SEGMENT_CATEGORY_FIELD_DEFAULTS.description,
      parent_category_id: data.parent_category_id || null,
      is_active: data.is_active ?? true,
      created_at: data.created_at || new Date().toISOString(),
      updated_at: data.updated_at || new Date().toISOString(),
    };
  }

  private normalizeSegmentArray(segments: any[]): SegmentType[] {
    return Array.isArray(segments)
      ? segments.map((seg) => this.normalizeSegment(seg))
      : [];
  }

  private normalizeSegmentCategoryArray(
    categories: any[],
  ): SegmentCategoryType[] {
    return Array.isArray(categories)
      ? categories.map((cat) => this.normalizeSegmentCategory(cat))
      : [];
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
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

    // Parse response first
    const contentType = response.headers.get("content-type");
    let responseData: any;

    try {
      if (contentType && contentType.includes("application/json")) {
        responseData = await response.json();
      } else {
        const text = await response.text();
        responseData = text ? JSON.parse(text) : {};
      }
    } catch (_) {
      // If parsing fails, handle based on response status
      if (!response.ok) {
        throw new Error(
          `HTTP error! status: ${response.status}, statusText: ${response.statusText}`,
        );
      }
      responseData = {};
    }

    // Check if response has success: false (backend may return 200 with error)
    if (responseData && responseData.success === false) {
      if (responseData.error) {
        throw new Error(responseData.error);
      }
      if (responseData.message) {
        throw new Error(responseData.message);
      }
      if (responseData.details) {
        throw new Error(
          typeof responseData.details === "string"
            ? responseData.details
            : JSON.stringify(responseData.details),
        );
      }
      throw new Error("Operation failed");
    }

    // Handle HTTP error status codes (4xx, 5xx)
    if (!response.ok) {
      try {
        const errorData = responseData || {};

        if (errorData.error) {
          throw new Error(errorData.error);
        }
        if (errorData.message) {
          throw new Error(errorData.message);
        }
        if (errorData.details) {
          throw new Error(
            typeof errorData.details === "string"
              ? errorData.details
              : JSON.stringify(errorData.details),
          );
        }
        throw new Error(
          `HTTP error! status: ${response.status}, statusText: ${response.statusText}`,
        );
      } catch (err) {
        if (err instanceof Error && !err.message.includes("HTTP error")) {
          throw err;
        }
        throw new Error(
          `HTTP error! status: ${response.status}, statusText: ${response.statusText}`,
        );
      }
    }

    return responseData;
  }

  private async requestCategories<T>(
    endpoint: string,
    options: RequestInit = {},
  ): Promise<T> {
    const url = `${CATEGORIES_BASE_URL}${endpoint}`;

    const response = await fetch(url, {
      headers: {
        ...getAuthHeaders(),
        "Content-Type": "application/json",
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      try {
        const errorData = await response.json();
        // Handle different error response formats
        if (errorData.error) {
          throw new Error(errorData.error);
        }
        if (errorData.message) {
          throw new Error(errorData.message);
        }
        if (errorData.details) {
          throw new Error(errorData.details);
        }
        // If error is a string directly
        if (typeof errorData === "string") {
          throw new Error(errorData);
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      } catch (err) {
        if (err instanceof Error) {
          throw err;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    }

    return response.json();
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

  // ==================== segment catalogs (8 endpoints) ====================

  /**
   * GET /segment-categories/root - Get all categories
   */
  async getSegmentCategories(
    search?: string,
    skipCache: boolean = true,
  ): Promise<SegmentCategoriesResponse> {
    const queryString = this.buildQueryParams({ search, skipCache });
    const response = await this.requestCategories<SegmentCategoriesResponse>(
      `/root${queryString}`,
    );

    // Normalize all categories in response
    if (response?.data && Array.isArray(response.data)) {
      return {
        ...response,
        data: response.data.map((cat) => this.normalizeSegmentCategory(cat)),
      };
    }
    return response;
  }

  /**
   * GET /segment-categories/search - Search by name
   */
  async searchSegmentCategories(
    query: string,
    skipCache: boolean = true,
  ): Promise<SegmentCategoriesResponse> {
    const queryString = this.buildQueryParams({ searchTerm: query, skipCache });
    return this.requestCategories<SegmentCategoriesResponse>(
      `/search${queryString}`,
    );
  }

  /**
   * GET /segment-categories/super-search - Advanced search with multiple filters
   */
  async superSearchSegmentCategories(
    filters: AdvancedSearchQuery,
    skipCache: boolean = true,
  ): Promise<SegmentCategoriesResponse> {
    const queryString = this.buildQueryParams({
      ...filters,
      skip_cache: skipCache,
    });
    return this.requestCategories<SegmentCategoriesResponse>(
      `/super-search${queryString}`,
    );
  }

  /**
   * GET /segment-categories/check-name - Check if name exists
   */
  async checkSegmentCategoryName(
    name: string,
    excludeId?: number,
  ): Promise<ApiSuccessResponse<{ exists: boolean; available: boolean }>> {
    const queryString = this.buildQueryParams({ name, exclude_id: excludeId });
    return this.requestCategories<
      ApiSuccessResponse<{ exists: boolean; available: boolean }>
    >(`/check-name${queryString}`);
  }

  /**
   * GET /segment-categories/:id - Get category by ID
   */
  async getSegmentCategoryById(
    id: number,
    skipCache: boolean = true,
  ): Promise<ApiSuccessResponse<SegmentCategoryType>> {
    const queryString = this.buildQueryParams({ skipCache });
    const response = await this.requestCategories<
      ApiSuccessResponse<SegmentCategoryType>
    >(`/${id}${queryString}`);

    // Normalize the category
    if (response?.data) {
      return {
        ...response,
        data: this.normalizeSegmentCategory(response.data),
      };
    }
    return response;
  }

  /**
   * POST /segment-categories/ - Create category
   */
  async createSegmentCategory(
    request: CreateSegmentCategoryRequest,
  ): Promise<ApiSuccessResponse<SegmentCategoryType>> {
    const response = await this.requestCategories<
      ApiSuccessResponse<SegmentCategoryType>
    >("", {
      method: "POST",
      body: JSON.stringify(request),
    });

    // Normalize the created category
    if (response?.data) {
      return {
        ...response,
        data: this.normalizeSegmentCategory(response.data),
      };
    }
    return response;
  }

  /**
   * PUT /segment-categories/:id - Update category
   */
  async updateSegmentCategory(
    id: number,
    request: UpdateSegmentCategoryRequest,
  ): Promise<ApiSuccessResponse<SegmentCategoryType>> {
    const response = await this.requestCategories<
      ApiSuccessResponse<SegmentCategoryType>
    >(`/${id}`, {
      method: "PUT",
      body: JSON.stringify(request),
    });

    // Normalize the updated category
    if (response?.data) {
      return {
        ...response,
        data: this.normalizeSegmentCategory(response.data),
      };
    }
    return response;
  }

  /**
   * DELETE /segment-categories/:id - Delete category
   */
  async deleteSegmentCategory(id: number): Promise<void> {
    return this.requestCategories<void>(`/${id}`, {
      method: "DELETE",
    });
  }

  // ==================== CORE SEGMENTS (8 endpoints) ====================

  /**
   * GET /segments/ - Get all segments (with pagination/filtering)
   */
  async getSegments(
    filters?: GetSegmentsQuery,
  ): Promise<PaginatedResponse<SegmentType>> {
    const queryString = this.buildQueryParams({
      search: filters?.search,
      categoryId: filters?.categoryId,
      type: filters?.type,
      page: filters?.page,
      limit: filters?.pageSize,
      sortBy: filters?.sortBy,
      sortDirection: filters?.sortDirection,
      skipCache: filters?.skipCache,
    });

    const response = await this.request<PaginatedResponse<SegmentType>>(
      `/${queryString}`,
    );

    // Normalize all segments in paginated response
    if (response?.data && Array.isArray(response.data)) {
      return {
        ...response,
        data: response.data.map((segment) => this.normalizeSegment(segment)),
      };
    }
    return response;
  }

  /**
   * POST /segments/ - Create segment
   */
  async createSegment(
    segment: CreateSegmentRequest,
  ): Promise<ApiSuccessResponse<SegmentType>> {
    const response = await this.request<ApiSuccessResponse<SegmentType>>("/", {
      method: "POST",
      body: JSON.stringify(segment),
    });

    // Normalize the created segment - backend returns data as array
    if (response?.data) {
      const rawData = response.data as unknown;
      const segmentData = Array.isArray(rawData) ? rawData[0] : rawData;
      return {
        ...response,
        data: this.normalizeSegment(segmentData),
      };
    }
    return response;
  }

  /**
   * GET /segments/:id - Get segment by ID
   */
  async getSegmentById(
    id: number,
    skipCache: boolean = true,
  ): Promise<ApiSuccessResponse<SegmentType>> {
    const queryString = this.buildQueryParams({ skipCache });
    const response = await this.request<ApiSuccessResponse<SegmentType>>(
      `/${id}${queryString}`,
    );

    // Normalize the segment
    if (response?.data) {
      return {
        ...response,
        data: this.normalizeSegment(response.data),
      };
    }
    return response;
  }

  /**
   * PUT /segments/:id - Update segment
   */
  async updateSegment(
    id: number,
    segment: Partial<UpdateSegmentRequest>,
  ): Promise<ApiSuccessResponse<SegmentType>> {
    const response = await this.request<ApiSuccessResponse<SegmentType>>(
      `/${id}`,
      {
        method: "PUT",
        body: JSON.stringify(segment),
      },
    );

    // Normalize the updated segment - backend may return data as array
    if (response?.data) {
      const rawData = response.data as unknown;
      const segmentData = Array.isArray(rawData) ? rawData[0] : rawData;
      return {
        ...response,
        data: this.normalizeSegment(segmentData),
      };
    }
    return response;
  }

  /**
   * DELETE /segments/:id - Delete segment
   */
  async deleteSegment(id: number): Promise<void> {
    return this.request<void>(`/${id}`, {
      method: "DELETE",
    });
  }

  /**
   * POST /segments/:id/duplicate - Duplicate segment
   * NOTE: Endpoint not implemented on backend - removed to avoid confusion
   */
  // async duplicateSegment(
  //   id: number,
  //   request: DuplicateSegmentRequest
  // ): Promise<ApiSuccessResponse<SegmentType>> {
  //   return this.request<ApiSuccessResponse<SegmentType>>(`/${id}/duplicate`, {
  //     method: "POST",
  //     body: JSON.stringify(request),
  //   });
  // }

  /**
   * GET /segments/search - Search segments
   */
  async searchSegments(
    query: SearchSegmentsQuery,
  ): Promise<PaginatedResponse<SegmentType>> {
    const queryString = this.buildQueryParams({
      searchTerm: query.q,
      category: query.category,
      type: query.type,
      visibility: query.visibility,
      tags: query.tags,
      skipCache: query.skipCache !== false ? true : false,
    });

    const response = await this.request<PaginatedResponse<SegmentType>>(
      `/search${queryString}`,
    );

    // Normalize all segments in paginated response
    if (response?.data && Array.isArray(response.data)) {
      return {
        ...response,
        data: this.normalizeSegmentArray(response.data),
      };
    }
    return response;
  }

  /**
   * POST /segments/validate-criteria - Validate segment criteria
   */
  async validateCriteria(
    request: ValidateCriteriaRequest,
  ): Promise<ApiSuccessResponse<{ valid: boolean; errors?: string[] }>> {
    return this.request<
      ApiSuccessResponse<{ valid: boolean; errors?: string[] }>
    >("/validate-criteria", {
      method: "POST",
      body: JSON.stringify(request),
    });
  }

  // ==================== ANALYTICS ENDPOINTS (7 endpoints) ====================

  /**
   * GET /segments/stats/health-summary - Get health summary
   */
  async getHealthSummary(): Promise<ApiSuccessResponse<HealthSummaryResponse>> {
    const queryString = this.buildQueryParams({ skipCache: true });
    return this.request<ApiSuccessResponse<HealthSummaryResponse>>(
      `/stats/health-summary${queryString}`,
    );
  }

  /**
   * GET /segments/stats/creation-trend - Get creation trend
   * Parameters: skipCache (optional, default false)
   * Note: Does not accept period or days parameters
   */
  async getCreationTrend(): Promise<ApiSuccessResponse<CreationTrendResponse>> {
    const queryString = this.buildQueryParams({
      skipCache: true, // Always skip cache for analytics
    });
    return this.request<ApiSuccessResponse<CreationTrendResponse>>(
      `/stats/creation-trend${queryString}`,
    );
  }

  /**
   * GET /segments/stats/type-distribution - Get type distribution
   */
  async getTypeDistribution(): Promise<
    ApiSuccessResponse<TypeDistributionResponse>
  > {
    const queryString = this.buildQueryParams({ skipCache: true });
    return this.request<ApiSuccessResponse<TypeDistributionResponse>>(
      `/stats/type-distribution${queryString}`,
    );
  }

  /**
   * GET /segments/stats/category-distribution - Get category distribution
   */
  async getCategoryDistribution(
    skipCache: boolean = true,
  ): Promise<ApiSuccessResponse<CategoryDistributionResponse[]>> {
    const endpoint = `/stats/category-distribution${
      skipCache ? "?skipCache=true" : ""
    }`;
    return this.request<ApiSuccessResponse<CategoryDistributionResponse[]>>(
      endpoint,
    );
  }

  /**
   * GET /segments/stats/largest - Get largest segments
   */
  async getLargestSegments(
    limit: number = 10,
  ): Promise<ApiSuccessResponse<LargestSegmentsResponse[]>> {
    const queryString = this.buildQueryParams({ limit, skipCache: true });
    return this.request<ApiSuccessResponse<LargestSegmentsResponse[]>>(
      `/stats/largest${queryString}`,
    );
  }

  /**
   * GET /segments/stats/stale - Get stale segments
   */
  async getStaleSegments(): Promise<
    ApiSuccessResponse<StaleSegmentsResponse[]>
  > {
    const queryString = this.buildQueryParams({ skipCache: true });
    return this.request<ApiSuccessResponse<StaleSegmentsResponse[]>>(
      `/stats/stale${queryString}`,
    );
  }

  /**
   * GET /segments/stats - Get general segment statistics
   */
  async getSegmentStats(
    skipCache: boolean = true,
  ): Promise<ApiSuccessResponse<Record<string, unknown>>> {
    const queryString = this.buildQueryParams({ skipCache });
    return this.request<ApiSuccessResponse<Record<string, unknown>>>(
      `/stats${queryString}`,
    );
  }

  // ==================== QUERY GENERATION ENDPOINTS (2 endpoints) ====================

  /**
   * POST /segments/generate-query/preview - Generate segment query preview
   */
  async generateQueryPreview(request: {
    criteria: SegmentCriteriaType;
  }): Promise<ApiSuccessResponse<{ query: string; preview: PreviewResponse }>> {
    return this.request<
      ApiSuccessResponse<{ query: string; preview: PreviewResponse }>
    >("/generate-query/preview", {
      method: "POST",
      body: JSON.stringify(request),
    });
  }

  /**
   * POST /segments/recompute-segment-members - Recompute segment members
   * Note: Only accepts a single segment_id, not bulk
   */
  async recomputeSegmentMembers(request: {
    segment_id: number;
    force?: boolean;
  }): Promise<ApiSuccessResponse<{ recomputed: number; message: string }>> {
    return this.request<
      ApiSuccessResponse<{ recomputed: number; message: string }>
    >("/recompute-segment-members", {
      method: "POST",
      body: JSON.stringify(request),
    });
  }

  /**
   * POST /segments/batch/refresh - Bulk refresh segments (lighter operation)
   * Supports 1-50 segments
   */
  async batchRefreshSegments(request: {
    segmentIds: number[];
  }): Promise<ApiSuccessResponse<{ refreshed: number; message: string }>> {
    return this.request<
      ApiSuccessResponse<{ refreshed: number; message: string }>
    >("/batch/refresh", {
      method: "POST",
      body: JSON.stringify(request),
    });
  }

  /**
   * PATCH /segments/batch/category - Batch assign segments to a category
   * Supports up to 500 segments per request
   */
  async batchAssignCategory(
    segmentIds: number[],
    categoryId: number,
  ): Promise<{ success: boolean; message: string; updated_count: number }> {
    return this.request("/batch/category", {
      method: "PATCH",
      body: JSON.stringify({ segment_ids: segmentIds, category_id: categoryId }),
    });
  }

  // ==================== CATEGORIES (NESTED UNDER /segments) (6 endpoints) ====================

  /**
   * GET /segments/categories/name/:name - Get category by name
   */
  async getSegmentCategoryByNameNested(
    name: string,
    skipCache: boolean = true,
  ): Promise<ApiSuccessResponse<SegmentCategoryType>> {
    const queryString = this.buildQueryParams({ skipCache });
    return this.request<ApiSuccessResponse<SegmentCategoryType>>(
      `/categories/name/${encodeURIComponent(name)}${queryString}`,
    );
  }

  /**
   * GET /segments/categories/:id - Get category by ID
   */
  async getSegmentCategoryByIdNested(
    id: number,
    skipCache: boolean = true,
  ): Promise<ApiSuccessResponse<SegmentCategoryType>> {
    const queryString = this.buildQueryParams({ skipCache });
    return this.request<ApiSuccessResponse<SegmentCategoryType>>(
      `/categories/${id}${queryString}`,
    );
  }

  /**
   * GET /segments/categories - Get all categories
   */
  async getSegmentCategoriesNested(
    skipCache: boolean = true,
  ): Promise<SegmentCategoriesResponse> {
    const queryString = this.buildQueryParams({ skipCache });
    return this.request<SegmentCategoriesResponse>(`/categories${queryString}`);
  }

  /**
   * POST /segments/categories - Create category
   */
  async createSegmentCategoryNested(
    request: CreateSegmentCategoryRequest,
  ): Promise<ApiSuccessResponse<SegmentCategoryType>> {
    return this.request<ApiSuccessResponse<SegmentCategoryType>>(
      "/categories",
      {
        method: "POST",
        body: JSON.stringify(request),
      },
    );
  }

  /**
   * PUT /segments/categories/:id - Update category
   */
  async updateSegmentCategoryNested(
    id: number,
    request: UpdateSegmentCategoryRequest,
  ): Promise<ApiSuccessResponse<SegmentCategoryType>> {
    return this.request<ApiSuccessResponse<SegmentCategoryType>>(
      `/categories/${id}`,
      {
        method: "PUT",
        body: JSON.stringify(request),
      },
    );
  }

  /**
   * DELETE /segments/categories/:id - Delete category
   */
  async deleteSegmentCategoryNested(id: number): Promise<void> {
    return this.request<void>(`/categories/${id}`, {
      method: "DELETE",
    });
  }

  // ==================== ACTIVATION ENDPOINTS (4 endpoints) ====================
  // COMMENTED OUT: Activate/Deactivate functionality temporarily disabled

  /**
   * PATCH /segments/:id/activate - Activate segment
   */
  // async activateSegment(id: number): Promise<ApiSuccessResponse<SegmentType>> {
  //   return this.request<ApiSuccessResponse<SegmentType>>(`/${id}/activate`, {
  //     method: "PATCH",
  //   });
  // }

  /**
   * PATCH /segments/:id/deactivate - Deactivate segment
   */
  // async deactivateSegment(
  //   id: number
  // ): Promise<ApiSuccessResponse<SegmentType>> {
  //   return this.request<ApiSuccessResponse<SegmentType>>(`/${id}/deactivate`, {
  //     method: "PATCH",
  //     body: JSON.stringify({}),
  //     headers: {
  //       "Content-Type": "application/json",
  //     },
  //   });
  // }

  /**
   * POST /segments/batch/activate - Batch activate segments
   */
  // async batchActivateSegments(
  //   request: BatchActivationRequest
  // ): Promise<ApiSuccessResponse<BatchActivationResponse>> {
  //   return this.request<ApiSuccessResponse<BatchActivationResponse>>(
  //     "/batch/activate",
  //     {
  //       method: "POST",
  //       body: JSON.stringify(request),
  //     }
  //   );
  // }

  /**
   * POST /segments/batch/deactivate - Batch deactivate segments
   */
  // async batchDeactivateSegments(
  //   request: BatchActivationRequest
  // ): Promise<ApiSuccessResponse<BatchActivationResponse>> {
  //   return this.request<ApiSuccessResponse<BatchActivationResponse>>(
  //     "/batch/deactivate",
  //     {
  //       method: "POST",
  //       body: JSON.stringify(request),
  //     }
  //   );
  // }

  // ==================== ADVANCED ENDPOINTS (12 endpoints) ====================

  /**
   * GET /segments/active - Get active segments
   */
  async getActiveSegments(
    filters?: GetSegmentsQuery,
  ): Promise<PaginatedResponse<SegmentType>> {
    const queryString = this.buildQueryParams(filters || {});
    const response = await this.request<PaginatedResponse<SegmentType>>(
      `/active${queryString}`,
    );

    // Normalize all segments in paginated response
    if (response?.data && Array.isArray(response.data)) {
      return {
        ...response,
        data: this.normalizeSegmentArray(response.data),
      };
    }
    return response;
  }

  /**
   * GET /segments/parents - Get parent segments
   */
  async getParentSegments(
    skipCache: boolean = true,
    filters?: GetSegmentsQuery,
  ): Promise<PaginatedResponse<SegmentType>> {
    const queryString = this.buildQueryParams({ ...filters, skipCache });
    const response = await this.request<PaginatedResponse<SegmentType>>(
      `/parents${queryString}`,
    );

    // Normalize all segments in paginated response
    if (response?.data && Array.isArray(response.data)) {
      return {
        ...response,
        data: this.normalizeSegmentArray(response.data),
      };
    }
    return response;
  }

  /**
   * GET /segments/empty - Get empty segments
   */
  async getEmptySegments(
    filters?: GetSegmentsQuery,
  ): Promise<PaginatedResponse<SegmentType>> {
    const queryString = this.buildQueryParams(filters || {});
    const response = await this.request<PaginatedResponse<SegmentType>>(
      `/empty${queryString}`,
    );

    // Normalize all segments in paginated response
    if (response?.data && Array.isArray(response.data)) {
      return {
        ...response,
        data: this.normalizeSegmentArray(response.data),
      };
    }
    return response;
  }

  /**
   * GET /segments/most-used - Get most used segments
   */
  async getMostUsedSegments(
    limit: number = 10,
    skipCache: boolean = true,
  ): Promise<ApiSuccessResponse<SegmentType[]>> {
    const queryString = this.buildQueryParams({ limit, skipCache });
    const response = await this.request<ApiSuccessResponse<SegmentType[]>>(
      `/most-used${queryString}`,
    );

    // Normalize all segments in response
    if (response?.data && Array.isArray(response.data)) {
      return {
        ...response,
        data: this.normalizeSegmentArray(response.data),
      };
    }
    return response;
  }

  /**
   * GET /segments/needing-refresh - Get segments needing refresh
   */
  async getSegmentsNeedingRefresh(
    filters?: GetSegmentsQuery,
  ): Promise<PaginatedResponse<SegmentType>> {
    const queryString = this.buildQueryParams(filters || {});
    const response = await this.request<PaginatedResponse<SegmentType>>(
      `/needing-refresh${queryString}`,
    );

    // Normalize all segments in paginated response
    if (response?.data && Array.isArray(response.data)) {
      return {
        ...response,
        data: this.normalizeSegmentArray(response.data),
      };
    }
    return response;
  }

  /**
   * GET /segments/code/:code - Get segment by code
   */
  async getSegmentByCode(
    code: string,
    skipCache: boolean = true,
  ): Promise<ApiSuccessResponse<SegmentType>> {
    const queryString = this.buildQueryParams({ skipCache });
    const response = await this.request<ApiSuccessResponse<SegmentType>>(
      `/code/${code}${queryString}`,
    );

    // Normalize the segment
    if (response?.data) {
      return {
        ...response,
        data: this.normalizeSegment(response.data),
      };
    }
    return response;
  }

  /**
   * GET /segments/name/:name - Get segment by name
   */
  async getSegmentByName(
    name: string,
    skipCache: boolean = true,
  ): Promise<ApiSuccessResponse<SegmentType>> {
    const queryString = this.buildQueryParams({ skipCache });
    const response = await this.request<ApiSuccessResponse<SegmentType>>(
      `/name/${name}${queryString}`,
    );

    // Normalize the segment
    if (response?.data) {
      return {
        ...response,
        data: this.normalizeSegment(response.data),
      };
    }
    return response;
  }

  /**
   * GET /segments/type/:type - Get segments by type
   */
  async getSegmentsByType(
    type: "static" | "dynamic" | "trigger",
    filters?: GetSegmentsQuery,
  ): Promise<PaginatedResponse<SegmentType>> {
    const queryString = this.buildQueryParams(filters || {});
    const response = await this.request<PaginatedResponse<SegmentType>>(
      `/type/${type}${queryString}`,
    );

    // Normalize all segments in paginated response
    if (response?.data && Array.isArray(response.data)) {
      return {
        ...response,
        data: this.normalizeSegmentArray(response.data),
      };
    }
    return response;
  }

  /**
   * GET /segments/category/:categoryId - Get segments by category
   */
  async getSegmentsByCategory(
    categoryId: number,
    filters?: GetSegmentsQuery,
  ): Promise<PaginatedResponse<SegmentType>> {
    const queryString = this.buildQueryParams(filters || {});
    const response = await this.request<PaginatedResponse<SegmentType>>(
      `/category/${categoryId}${queryString}`,
    );

    // Normalize all segments in paginated response
    if (response?.data && Array.isArray(response.data)) {
      return {
        ...response,
        data: this.normalizeSegmentArray(response.data),
      };
    }
    return response;
  }

  /**
   * GET /segments/visibility/:visibility - Get segments by visibility
   */
  async getSegmentsByVisibility(
    visibility: "private" | "public",
    filters?: GetSegmentsQuery,
  ): Promise<PaginatedResponse<SegmentType>> {
    const queryString = this.buildQueryParams(filters || {});
    const response = await this.request<PaginatedResponse<SegmentType>>(
      `/visibility/${visibility}${queryString}`,
    );

    // Normalize all segments in paginated response
    if (response?.data && Array.isArray(response.data)) {
      return {
        ...response,
        data: this.normalizeSegmentArray(response.data),
      };
    }
    return response;
  }

  /**
   * GET /segments/creator/:creatorId - Get segments by creator
   */
  async getSegmentsByCreator(
    creatorId: number,
    filters?: GetSegmentsQuery,
  ): Promise<PaginatedResponse<SegmentType>> {
    const queryString = this.buildQueryParams(filters || {});
    const response = await this.request<PaginatedResponse<SegmentType>>(
      `/creator/${creatorId}${queryString}`,
    );

    // Normalize all segments in paginated response
    if (response?.data && Array.isArray(response.data)) {
      return {
        ...response,
        data: this.normalizeSegmentArray(response.data),
      };
    }
    return response;
  }

  /**
   * GET /segments/tag/:tag - Get segments by tag
   */
  async getSegmentsByTag(
    tag: string,
    filters?: GetSegmentsQuery,
  ): Promise<PaginatedResponse<SegmentType>> {
    const queryString = this.buildQueryParams(filters || {});
    const response = await this.request<PaginatedResponse<SegmentType>>(
      `/tag/${tag}${queryString}`,
    );

    // Normalize all segments in paginated response
    if (response?.data && Array.isArray(response.data)) {
      return {
        ...response,
        data: this.normalizeSegmentArray(response.data),
      };
    }
    return response;
  }

  // ==================== SEGMENT-SPECIFIC OPERATIONS (15 endpoints) ====================

  /**
   * GET /segments/:id/children - Get segment children
   */
  async getSegmentChildren(
    id: number,
    filters?: GetSegmentsQuery,
    skipCache: boolean = true,
  ): Promise<PaginatedResponse<SegmentType>> {
    const queryString = this.buildQueryParams({
      ...(filters || {}),
      skipCache,
    });
    const response = await this.request<PaginatedResponse<SegmentType>>(
      `/${id}/children${queryString}`,
    );

    // Normalize all segments in paginated response
    if (response?.data && Array.isArray(response.data)) {
      return {
        ...response,
        data: this.normalizeSegmentArray(response.data),
      };
    }
    return response;
  }

  /**
   * GET /segments/:id/hierarchy - Get segment hierarchy
   */
  async getSegmentHierarchy(
    id: number,
    skipCache: boolean = true,
  ): Promise<ApiSuccessResponse<SegmentHierarchyResponse>> {
    const queryString = this.buildQueryParams({ skipCache });
    return this.request<ApiSuccessResponse<SegmentHierarchyResponse>>(
      `/${id}/hierarchy${queryString}`,
    );
  }

  /**
   * GET /segments/:id/growth-trend - Get segment growth trend
   */
  async getSegmentGrowthTrend(
    id: number,
    skipCache: boolean = true,
    period?: string,
    days?: number,
  ): Promise<ApiSuccessResponse<GrowthTrendResponse>> {
    const queryString = this.buildQueryParams({ skipCache, period, days });
    return this.request<ApiSuccessResponse<GrowthTrendResponse>>(
      `/${id}/growth-trend${queryString}`,
    );
  }

  /**
   * GET /segments/:id/performance-metrics - Get segment performance metrics
   */
  async getSegmentPerformanceMetrics(
    id: number,
    skipCache: boolean = true,
  ): Promise<ApiSuccessResponse<PerformanceMetricsResponse>> {
    const queryString = this.buildQueryParams({ skipCache });
    return this.request<ApiSuccessResponse<PerformanceMetricsResponse>>(
      `/${id}/performance-metrics${queryString}`,
    );
  }

  /**
   * GET /segments/:id/usage-in-campaigns - Get segment usage in campaigns
   */
  async getSegmentUsageInCampaigns(
    id: number,
  ): Promise<ApiSuccessResponse<UsageInCampaignsResponse[]>> {
    return this.request<ApiSuccessResponse<UsageInCampaignsResponse[]>>(
      `/${id}/usage-in-campaigns`,
    );
  }

  /**
   * GET /segments/:id1/overlap/:id2 - Get segment overlap
   */
  async getSegmentOverlap(
    id1: number,
    id2: number,
  ): Promise<ApiSuccessResponse<SegmentOverlapResponse>> {
    return this.request<ApiSuccessResponse<SegmentOverlapResponse>>(
      `/${id1}/overlap/${id2}`,
    );
  }

  /**
   * POST /segments/:id/refresh - Refresh segment
   */
  async refreshSegment(
    id: number,
    request?: { force?: boolean },
  ): Promise<ApiSuccessResponse<ComputationStatusResponse>> {
    return this.request<ApiSuccessResponse<ComputationStatusResponse>>(
      `/${id}/refresh`,
      {
        method: "POST",
        body: JSON.stringify(request || {}),
      },
    );
  }

  /**
   * POST /segments/:id/compute-size - Compute segment size
   */
  async computeSegmentSize(
    id: number,
    request?: SizeEstimateRequest,
  ): Promise<ApiSuccessResponse<SizeEstimateResponse>> {
    return this.request<ApiSuccessResponse<SizeEstimateResponse>>(
      `/${id}/compute-size`,
      {
        method: "POST",
        body: JSON.stringify(request || {}),
      },
    );
  }

  /**
   * POST /segments/:id/validate-query - Validate segment query
   */
  async validateSegmentQuery(
    id: number,
    request?: QueryUpdateRequest,
  ): Promise<ApiSuccessResponse<QueryValidationResponse>> {
    return this.request<ApiSuccessResponse<QueryValidationResponse>>(
      `/${id}/validate-query`,
      {
        method: "POST",
        body: JSON.stringify(request || {}),
      },
    );
  }

  /**
   * POST /segments/:id/tags - Update segment tags
   */
  async updateSegmentTags(
    id: number,
    request: TagManagementRequest,
  ): Promise<ApiSuccessResponse<TagManagementResponse>> {
    return this.request<ApiSuccessResponse<TagManagementResponse>>(
      `/${id}/tags`,
      {
        method: "POST",
        body: JSON.stringify(request),
      },
    );
  }

  /**
   * PATCH /segments/:id/query - Update segment query
   */
  async updateSegmentQuery(
    id: number,
    request: QueryUpdateRequest,
  ): Promise<ApiSuccessResponse<SegmentType>> {
    return this.request<ApiSuccessResponse<SegmentType>>(`/${id}/query`, {
      method: "PATCH",
      body: JSON.stringify(request),
    });
  }

  /**
   * PATCH /segments/:id/size-estimate - Update segment size estimate
   */
  async updateSegmentSizeEstimate(
    id: number,
    sizeEstimate: number,
  ): Promise<ApiSuccessResponse<SegmentType>> {
    return this.request<ApiSuccessResponse<SegmentType>>(
      `/${id}/size-estimate`,
      {
        method: "PATCH",
        body: JSON.stringify({ size_estimate: sizeEstimate }),
      },
    );
  }

  /**
   * PATCH /segments/:id/last-computed - Update last computed timestamp
   */
  async updateSegmentLastComputed(
    id: number,
    timestamp?: string,
  ): Promise<ApiSuccessResponse<SegmentType>> {
    const body = timestamp
      ? { last_computed_at: timestamp }
      : { last_computed_at: new Date().toISOString() };
    return this.request<ApiSuccessResponse<SegmentType>>(
      `/${id}/last-computed`,
      {
        method: "PATCH",
        body: JSON.stringify(body),
      },
    );
  }

  /**
   * PATCH /segments/:id/parent - Update segment parent
   */
  async updateSegmentParent(
    id: number,
    parentId: number | null,
  ): Promise<ApiSuccessResponse<SegmentType>> {
    return this.request<ApiSuccessResponse<SegmentType>>(`/${id}/parent`, {
      method: "PATCH",
      body: JSON.stringify({ parentId }),
    });
  }

  /**
   * DELETE /segments/:id/tags/:tag - Delete specific tag
   */
  async deleteSegmentTag(
    id: number,
    tag: string,
  ): Promise<ApiSuccessResponse<TagManagementResponse>> {
    return this.request<ApiSuccessResponse<TagManagementResponse>>(
      `/${id}/tags/${encodeURIComponent(tag)}`,
      {
        method: "DELETE",
      },
    );
  }

  // ==================== SEGMENT RULES (5 endpoints) ====================

  /**
   * GET /segments/:id/rules - Get segment rules
   * NOTE: This endpoint doesn't exist in the backend - disabled
   */
  async getSegmentRules(
    _segmentId: number,
  ): Promise<ApiSuccessResponse<SegmentRuleType[]>> {
    // Endpoint doesn't exist - return empty array
    console.warn("getSegmentRules endpoint doesn't exist in backend");
    return Promise.resolve({ success: true, data: [] });
  }

  /**
   * POST /segments/:id/rules - Create segment rule
   */
  async createSegmentRule(
    segmentId: number,
    request: CreateSegmentRuleRequest,
  ): Promise<ApiSuccessResponse<SegmentRuleType>> {
    return this.request<ApiSuccessResponse<SegmentRuleType>>(
      `/${segmentId}/srules`,
      {
        method: "POST",
        body: JSON.stringify(request),
      },
    );
  }

  /**
   * PUT /segments/:id/rules/:rule_id - Update segment rule
   */
  async updateSegmentRule(
    segmentId: number,
    ruleId: number,
    request: UpdateSegmentRuleRequest,
  ): Promise<ApiSuccessResponse<SegmentRuleType>> {
    return this.request<ApiSuccessResponse<SegmentRuleType>>(
      `/${segmentId}/rules/${ruleId}`,
      {
        method: "PUT",
        body: JSON.stringify(request),
      },
    );
  }

  /**
   * DELETE /segments/:id/rules/:rule_id - Delete segment rule
   */
  async deleteSegmentRule(segmentId: number, ruleId: number): Promise<void> {
    return this.request<void>(`/${segmentId}/rules/${ruleId}`, {
      method: "DELETE",
    });
  }

  /**
   * POST /segments/rules/validate - Validate rules
   */
  async validateRules(
    request: ValidateRulesRequest,
  ): Promise<ApiSuccessResponse<{ valid: boolean; errors?: string[] }>> {
    return this.request<
      ApiSuccessResponse<{ valid: boolean; errors?: string[] }>
    >("/rules/validate", {
      method: "POST",
      body: JSON.stringify(request),
    });
  }

  // ==================== SEGMENT COMPUTATION (3 endpoints) ====================

  /**
   * POST /segments/:id/compute - Compute segment
   * NOTE: Endpoint not implemented on backend - removed to avoid confusion
   */
  // async computeSegment(
  //   id: number,
  //   request?: ComputeSegmentRequest
  // ): Promise<ApiSuccessResponse<ComputationStatusResponse>> {
  //   return this.request<ApiSuccessResponse<ComputationStatusResponse>>(
  //     `/${id}/compute`,
  //     {
  //       method: "POST",
  //       body: JSON.stringify(request || {}),
  //     }
  //   );
  // }

  /**
   * GET /segments/:id/computation-status/:jobid - Get computation status
   */
  async getComputationStatus(
    segmentId: number,
    jobId: string,
  ): Promise<ApiSuccessResponse<ComputationStatusResponse>> {
    return this.request<ApiSuccessResponse<ComputationStatusResponse>>(
      `/${segmentId}/computation-status/${jobId}`,
    );
  }

  /**
   * POST /segments/batch-compute - Batch compute segments
   */
  async batchCompute(
    request: BatchComputeRequest,
  ): Promise<ApiSuccessResponse<ComputationStatusResponse>> {
    return this.request<ApiSuccessResponse<ComputationStatusResponse>>(
      "/batch-compute",
      {
        method: "POST",
        body: JSON.stringify(request),
      },
    );
  }

  // ==================== SEGMENT PREVIEW (3 endpoints) ====================

  /**
   * POST /segments/:id/preview - Preview segment
   */
  async previewSegment(
    id: number,
    request?: PreviewSegmentRequest,
  ): Promise<ApiSuccessResponse<PreviewResponse>> {
    return this.request<ApiSuccessResponse<PreviewResponse>>(`/${id}/preview`, {
      method: "POST",
      body: JSON.stringify(request || {}),
    });
  }

  /**
   * GET /segments/:id/preview/count - Get preview count
   */
  async getPreviewCount(
    id: number,
    criteriaOverride?: SegmentCriteriaType,
  ): Promise<ApiSuccessResponse<{ count: number }>> {
    const queryString = criteriaOverride
      ? this.buildQueryParams({
          criteria_override: JSON.stringify(criteriaOverride),
        })
      : "";
    return this.request<ApiSuccessResponse<{ count: number }>>(
      `/${id}/preview/count${queryString}`,
    );
  }

  /**
   * POST /segments/:id/preview/sample/:preview_id - Get preview sample
   */
  async getPreviewSample(
    segmentId: number,
    previewId: string,
  ): Promise<ApiSuccessResponse<PreviewSampleResponse>> {
    return this.request<ApiSuccessResponse<PreviewSampleResponse>>(
      `/${segmentId}/preview/sample/${previewId}`,
      {
        method: "POST",
      },
    );
  }

  // ==================== SEGMENT MEMBERS (5 endpoints) ====================

  /**
   * GET /segment-members/segment/:segmentId - Get segment members
   * Supports: limit (50 default, max 100), offset (0 default), orderBy, orderDirection, skipCache
   */
  async getSegmentMembers(
    id: number,
    query?: GetSegmentMembersQuery,
  ): Promise<PaginatedResponse<SegmentMemberType>> {
    // Use offset-based pagination (not page-based)
    const limit = Math.min(query?.pageSize || 50, 100); // Max 100
    const offset =
      query?.offset ?? (query?.page ? (query.page - 1) * limit : 0);
    const skipCache = query?.skipCache !== false ? "true" : "false";

    const queryString = this.buildQueryParams({
      limit,
      offset,
      orderBy: query?.sortBy || "created_at",
      orderDirection: query?.sortDirection || "DESC",
      skipCache,
    });

    const url = `${MEMBERS_BASE_URL}/segment/${id}${queryString}`;
    const response = await fetch(url, {
      headers: {
        ...getAuthHeaders(),
        "Content-Type": "application/json",
      },
    });
    if (!response.ok) {
      throw new Error(
        `Failed to fetch segment members: ${response.statusText}`,
      );
    }
    const data = await response.json();

    // Backend returns paginated results directly
    const members = Array.isArray(data) ? data : data.data || [];
    const total = data.meta?.total || (Array.isArray(data) ? data.length : 0);
    const page = Math.floor(offset / limit) + 1;

    return {
      data: members,
      meta: {
        total,
        page,
        pageSize: limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * POST /segment-members or POST /segment-members/bulk - Add member(s) to segment
   * For single member: { segmentId: number, subscriberId: number }
   * For bulk: { segmentId: number, subscriberIds: number[] }
   */
  async addSegmentMembers(
    id: number,
    request: AddSegmentMembersRequest,
  ): Promise<ApiSuccessResponse<{ added_count: number }>> {
    // Use bulk endpoint for multiple members
    const isBulk = request.subscriberIds && request.subscriberIds.length > 0;
    const endpoint = isBulk ? "/bulk" : "";

    // Build payload
    const payload = {
      ...request,
      segmentId: request.segmentId || id,
    };

    const url = `${MEMBERS_BASE_URL}${endpoint}`;
    const response = await fetch(url, {
      method: "POST",
      headers: {
        ...getAuthHeaders(),
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      throw new Error(`Failed to add segment members: ${response.statusText}`);
    }
    return response.json();
  }

  /**
   * DELETE /segment-members/segment/:segmentId - Delete segment members
   */
  async deleteSegmentMembers(
    id: number,
    request: DeleteSegmentMembersRequest,
  ): Promise<ApiSuccessResponse<{ removed_count: number }>> {
    const url = `${MEMBERS_BASE_URL}/segment/${id}`;
    const response = await fetch(url, {
      method: "DELETE",
      headers: {
        ...getAuthHeaders(),
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
    });
    if (!response.ok) {
      throw new Error(
        `Failed to delete segment members: ${response.statusText}`,
      );
    }
    return response.json();
  }

  /**
   * GET /segment-members/segments/counts?segmentIds=:id - Get members count
   */
  async getSegmentMembersCount(
    id: number,
    skipCache: boolean = true,
  ): Promise<ApiSuccessResponse<{ count: number }>> {
    const queryString = this.buildQueryParams({
      segmentIds: id.toString(),
      skipCache,
    });
    const url = `${MEMBERS_BASE_URL}/segments/counts${queryString}`;
    const response = await fetch(url, {
      headers: {
        ...getAuthHeaders(),
        "Content-Type": "application/json",
      },
    });
    if (!response.ok) {
      // If endpoint fails, return 0 count instead of throwing
      console.warn(
        `Failed to fetch segment members count: ${response.statusText}`,
      );
      return Promise.resolve({ success: true, data: { count: 0 } });
    }
    const data = await response.json();
    // Handle response format - might be array or object
    if (Array.isArray(data) && data.length > 0) {
      return { success: true, data: { count: data[0].count || 0 } };
    }
    if (data.count !== undefined) {
      return { success: true, data: { count: data.count } };
    }
    return { success: true, data: { count: 0 } };
  }

  /**
   * POST /segment-members/segment/:segmentId/search - Search segment members
   * Supports: limit (50 default, max 100), offset (0 default), minScore, maxScore, orderBy, orderDirection, skipCache
   */
  async searchSegmentMembers(
    id: number,
    request: SearchSegmentMembersRequest,
  ): Promise<PaginatedResponse<SegmentMemberType>> {
    // Use offset-based pagination (not page-based)
    const limit = Math.min(request.pageSize || 50, 100); // Max 100
    const offset =
      request.offset ?? (request.page ? (request.page - 1) * limit : 0);
    const skipCache = request.skipCache !== false ? "true" : "false";

    const queryString = this.buildQueryParams({
      limit,
      offset,
      minScore: request.minScore,
      maxScore: request.maxScore,
      orderBy: request.orderBy || "created_at",
      orderDirection: request.orderDirection || "DESC",
      skipCache,
    });

    const url = `${MEMBERS_BASE_URL}/segment/${id}/search${queryString}`;
    const response = await fetch(url, {
      method: "POST",
      headers: {
        ...getAuthHeaders(),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: request.query,
        filters: request.filters,
      }),
    });

    if (!response.ok) {
      throw new Error(
        `Failed to search segment members: ${response.statusText}`,
      );
    }
    const data = await response.json();

    // Backend returns filtered & paginated results directly
    const members = Array.isArray(data) ? data : data.data || [];
    const total = data.meta?.total || (Array.isArray(data) ? data.length : 0);
    const page = Math.floor(offset / limit) + 1;

    return {
      data: members,
      meta: {
        total,
        page,
        pageSize: limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // ==================== SEGMENT EXPORT (3 endpoints) ====================

  /**
   * GET /segments/:id/export - Export segment
   * NOTE: Endpoint not implemented on backend - removed to avoid confusion
   */
  // async exportSegment(id: number, query?: ExportSegmentQuery): Promise<Blob> {
  //   const queryString = this.buildQueryParams({ format: query?.format });
  //   const url = `${BASE_URL}/${id}/export${queryString}`;

  //   const response = await fetch(url, {
  //     headers: getAuthHeaders(),
  //   });

  //   if (!response.ok) {
  //     const errorData = await response.json().catch(() => ({}));
  //     throw new Error(
  //       errorData.error || `HTTP error! status: ${response.status}`
  //     );
  //   }

  //   return response.blob();
  // }

  /**
   * POST /segments/:id/export/custom - Custom export
   */
  async customExport(
    id: number,
    request: CustomExportRequest,
  ): Promise<ApiSuccessResponse<ExportStatusResponse>> {
    return this.request<ApiSuccessResponse<ExportStatusResponse>>(
      `/${id}/export/custom`,
      {
        method: "POST",
        body: JSON.stringify(request),
      },
    );
  }

  /**
   * GET /segments/:id/export-status/:jobid - Get export status
   */
  async getExportStatus(
    segmentId: number,
    jobId: string,
  ): Promise<ApiSuccessResponse<ExportStatusResponse>> {
    return this.request<ApiSuccessResponse<ExportStatusResponse>>(
      `/${segmentId}/export-status/${jobId}`,
    );
  }

  // ==================== SEGMENTATION FIELDS (2 endpoints) ====================

  /**
   * GET /segmentation-fields/profile - Get all available fields and operators for segmentation
   * This endpoint returns the field configuration that users can use to build segment conditions
   */
  async getSegmentationFields(
    skipCache: boolean = true,
  ): Promise<SegmentationFieldsResponse> {
    const params: Record<string, unknown> = { skipCache };

    // Add timestamp parameter when skipCache is true to force fresh requests
    if (skipCache) {
      params._t = Date.now();
    }

    const queryString = this.buildQueryParams(params);
    const url = `${buildApiUrl("/segmentation-fields")}/profile${queryString}`;

    const headers: Record<string, string> = {
      ...getAuthHeaders(),
      "Content-Type": "application/json",
    };

    const response = await fetch(url, {
      headers,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.error || `HTTP error! status: ${response.status}`,
      );
    }

    return response.json();
  }

  /**
   * POST /segments/generate-query/preview - Generate SQL query preview from layer-based conditions (v2.0)
   * This endpoint takes the user's segment conditions and returns the generated SQL queries
   */
  async generateSegmentQueryPreview(
    request: SegmentPayload,
  ): Promise<GenerateQueryPreviewResponse> {
    const url = `${BASE_URL}/generate-query/preview`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        ...getAuthHeaders(),
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.error || `HTTP error! status: ${response.status}`,
      );
    }

    return response.json();
  }

  /**
   * POST /segments/preview-sql - Preview a direct SQL query
   * This endpoint takes a raw SQL query and returns the count and execution time
   * TODO: Replace with actual backend endpoint when ready
   */
  async previewSqlQuery(sqlQuery: string): Promise<{
    success: boolean;
    data?: { count: number; executionTime: number };
    error?: string;
  }> {
    // Mock response - simulate backend delay
    await new Promise(resolve => setTimeout(resolve, 800));

    // Validate SQL has SELECT statement
    if (!sqlQuery.trim().toUpperCase().includes("SELECT")) {
      return {
        success: false,
        error: "Query must contain a SELECT statement",
      };
    }

    // Mock success response with random customer count
    const mockCount = Math.floor(Math.random() * 50000) + 100;
    const mockExecutionTime = Math.floor(Math.random() * 500) + 50;

    return {
      success: true,
      data: {
        count: mockCount,
        executionTime: mockExecutionTime,
      },
    };

    // Actual backend call (uncomment when endpoint is ready):
    // const url = `${BASE_URL}/preview-sql`;
    // const response = await fetch(url, {
    //   method: "POST",
    //   headers: {
    //     ...getAuthHeaders(),
    //     "Content-Type": "application/json",
    //   },
    //   body: JSON.stringify({ sql_query: sqlQuery }),
    // });
    // if (!response.ok) {
    //   const errorData = await response.json().catch(() => ({}));
    //   return {
    //     success: false,
    //     error: errorData.error || `HTTP error! status: ${response.status}`,
    //   };
    // }
    // const data = await response.json();
    // return {
    //   success: true,
    //   data: data.data || data,
    // };
  }

  /**
   * POST /segments/preview-count
   * Get segment subscriber count based on conditions
   * Payload: { layer_filters, limit }
   * Response: { data: { count: number } }
   */
  async previewSegmentCount(
    payload: any
  ): Promise<{ count: number } | null> {
    try {
      return await this.request(`/preview-count`, {
        method: "POST",
        body: JSON.stringify(payload),
      });
    } catch (error) {
      console.error("Error previewing segment count:", error);
      throw error;
    }
  }
}

export const segmentService = new SegmentService();
