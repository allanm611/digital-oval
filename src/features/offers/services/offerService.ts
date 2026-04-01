import {
  CreateOfferRequest,
  UpdateOfferRequest,
  UpdateStatusRequest,
  SubmitApprovalRequest,
  ApproveOfferRequest,
  OfferResponse,
  OffersResponse,
  CreateOfferResponse,
  OfferStatsResponse,
  TypeDistributionResponse,
  CategoryPerformanceResponse,
  SearchParams,
  FilterParams,
  DateRangeParams,
  OfferProductsResponse,
  OfferStatusEnum,
  OfferTypeEnum,
  OfferProductLink,
  CreateOfferProductLinkRequest,
  BatchOfferProductLinkRequest,
  BatchDeleteRequest,
  OfferProductSearchParams,
  BaseResponse,
  PaginatedResponse,
} from "../types/offer";
import {
  API_CONFIG,
  buildApiUrl,
  getAuthHeaders,
} from "../../../shared/services/api";

const BASE_URL = buildApiUrl(API_CONFIG.ENDPOINTS.OFFERS);
const OFFER_PRODUCTS_BASE_URL = buildApiUrl(
  API_CONFIG.ENDPOINTS.OFFER_PRODUCTS
);

const OFFER_FIELD_DEFAULTS = {
  name: "Not specified",
  code: "Not specified",
  description: "Not specified",
  offer_type: "other" as const,
  status: "draft" as const,
};

class OfferService {
  private normalizeOffer(data: any): any {
    if (!data) {
      return {
        id: 0,
        name: OFFER_FIELD_DEFAULTS.name,
        code: OFFER_FIELD_DEFAULTS.code,
        description: OFFER_FIELD_DEFAULTS.description,
        offer_type: OFFER_FIELD_DEFAULTS.offer_type,
        category_id: null,
        primary_product_id: null,
        discount_percentage: null,
        discount_amount: null,
        bonus_value: null,
        eligibility_rules: null,
        min_spend: null,
        max_usage_per_customer: 0,
        valid_from: null,
        product_ids: [],
        valid_to: null,
        is_reusable: false,
        supports_multi_language: false,
        metadata: null,
        tags: [],
        status: OFFER_FIELD_DEFAULTS.status,
        approval_status: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        created_by: null,
        updated_by: null,
      };
    }

    return {
      id: data.id || 0,
      name: data.name || OFFER_FIELD_DEFAULTS.name,
      code: data.code || OFFER_FIELD_DEFAULTS.code,
      description: data.description || OFFER_FIELD_DEFAULTS.description,
      offer_type: data.offer_type || OFFER_FIELD_DEFAULTS.offer_type,
      category_id: data.category_id || null,
      primary_product_id: data.primary_product_id || null,
      discount_percentage: data.discount_percentage ?? null,
      discount_amount: data.discount_amount ?? null,
      bonus_value: data.bonus_value ?? null,
      eligibility_rules: data.eligibility_rules || null,
      min_spend: data.min_spend ?? null,
      max_usage_per_customer: data.max_usage_per_customer ?? 0,
      valid_from: data.valid_from || null,
      product_ids: Array.isArray(data.product_ids) ? data.product_ids : [],
      valid_to: data.valid_to || null,
      is_reusable: data.is_reusable ?? false,
      supports_multi_language: data.supports_multi_language ?? false,
      metadata: data.metadata || null,
      tags: Array.isArray(data.tags) ? data.tags : [],
      status: data.status || OFFER_FIELD_DEFAULTS.status,
      approval_status: data.approval_status || null,
      created_at: data.created_at || new Date().toISOString(),
      updated_at: data.updated_at || new Date().toISOString(),
      created_by: data.created_by || null,
      updated_by: data.updated_by || null,
    };
  }

  private normalizeOfferArray(offers: any[]): any[] {
    return Array.isArray(offers) ? offers.map((offer) => this.normalizeOffer(offer)) : [];
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    baseUrl: string = BASE_URL
  ): Promise<T> {
    const url = `${baseUrl}${endpoint}`;
    const response = await fetch(url, {
      headers: {
        ...getAuthHeaders(),
        "Content-Type": "application/json",
        ...options.headers,
      },
      ...options,
    });

    // Parse response
    const contentType = response.headers.get("content-type");
    let responseData: Record<string, unknown>;

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
          `HTTP error! status: ${response.status}, statusText: ${response.statusText}`
        );
      }
      // If response is ok but can't parse, return empty object
      responseData = {};
    }

    // Check if response has success: false (backend may return 200 with error)
    // This handles cases where backend returns 200 OK but with {success: false, error: "..."}
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
            : JSON.stringify(responseData.details)
        );
      }
      throw new Error("Operation failed");
    }

    // Handle HTTP error status codes (4xx, 5xx)
    if (!response.ok) {
      // Try to extract error message from response
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
            : JSON.stringify(errorData.details)
        );
      }
      // If we have data but no specific error message, show generic error
      throw new Error(
        `HTTP error! status: ${response.status}, details: ${JSON.stringify(
          errorData
        )}`
      );
    }

    return responseData;
  }

  // Analytics & Stats
  async getStats(skipCache: boolean = false): Promise<OfferStatsResponse> {
    const params = skipCache ? "?skipCache=true" : "";
    return this.request<OfferStatsResponse>(`/stats${params}`);
  }

  async getTypeDistribution(
    skipCache: boolean = false
  ): Promise<TypeDistributionResponse> {
    const params = skipCache ? "?skipCache=true" : "";
    return this.request<TypeDistributionResponse>(
      `/type-distribution${params}`
    );
  }

  async getCategoryPerformance(
    skipCache: boolean = false
  ): Promise<CategoryPerformanceResponse> {
    const params = skipCache ? "?skipCache=true" : "";
    return this.request<CategoryPerformanceResponse>(
      `/category-performance${params}`
    );
  }

  // Search & Filter
  async searchOffers(params: SearchParams): Promise<OffersResponse> {
    const queryParams = new URLSearchParams();

    // If we have a search term, use /search endpoint (only accepts basic params)
    const hasSearchTerm = params.search || params.searchTerm;

    let response: OffersResponse;

    if (hasSearchTerm) {
      // /search endpoint only accepts searchTerm, limit, offset, skipCache
      if (params.search) {
        queryParams.append("searchTerm", params.search);
      } else if (params.searchTerm) {
        queryParams.append("searchTerm", params.searchTerm);
      }

      // Handle pagination - convert page to offset if needed
      if (params.page && params.limit) {
        const offset = (params.page - 1) * params.limit;
        queryParams.append("offset", offset.toString());
        queryParams.append("limit", params.limit.toString());
      } else {
        if (params.limit) queryParams.append("limit", params.limit.toString());
        if (params.offset)
          queryParams.append("offset", params.offset.toString());
      }

      if (params.skipCache) queryParams.append("skipCache", "true");

      const queryString = queryParams.toString();
      response = await this.request<OffersResponse>(
        `/search${queryString ? `?${queryString}` : ""}`
      );
    } else {
      // No search term - use base /offers/ endpoint
      // Note: This endpoint doesn't support sortBy/sortDirection parameters
      // Handle pagination - convert page to offset if needed
      if (params.page && params.limit) {
        const offset = (params.page - 1) * params.limit;
        queryParams.append("offset", offset.toString());
        queryParams.append("limit", params.limit.toString());
      } else {
        if (params.limit) queryParams.append("limit", params.limit.toString());
        if (params.offset)
          queryParams.append("offset", params.offset.toString());
      }

      // Handle filters
      if (params.status) queryParams.append("status", params.status);
      // Note: categoryId is NOT supported by the backend on this endpoint
      // Use getOffersByCategory() method instead for category filtering

      // Handle cache
      if (params.skipCache) queryParams.append("skipCache", "true");

      const queryString = queryParams.toString();
      response = await this.request<OffersResponse>(
        `/${queryString ? `?${queryString}` : ""}`
      );
    }

    // Normalize all offers in paginated response
    if (response?.data && Array.isArray(response.data)) {
      return {
        ...response,
        data: this.normalizeOfferArray(response.data),
      };
    }
    return response;
  }

  async getActiveOffers(params: FilterParams = {}): Promise<OffersResponse> {
    const queryParams = new URLSearchParams();
    if (params.limit) queryParams.append("limit", params.limit.toString());
    if (params.offset) queryParams.append("offset", params.offset.toString());
    if (params.skipCache) queryParams.append("skipCache", "true");

    const response = await this.request<OffersResponse>(`/active?${queryParams.toString()}`);

    // Normalize all offers in paginated response
    if (response?.data && Array.isArray(response.data)) {
      return {
        ...response,
        data: this.normalizeOfferArray(response.data),
      };
    }
    return response;
  }

  async getCurrentOffers(params: FilterParams = {}): Promise<OffersResponse> {
    const queryParams = new URLSearchParams();
    if (params.limit) queryParams.append("limit", params.limit.toString());
    if (params.offset) queryParams.append("offset", params.offset.toString());
    if (params.skipCache) queryParams.append("skipCache", "true");

    const response = await this.request<OffersResponse>(`/current?${queryParams.toString()}`);

    // Normalize all offers in paginated response
    if (response?.data && Array.isArray(response.data)) {
      return {
        ...response,
        data: this.normalizeOfferArray(response.data),
      };
    }
    return response;
  }

  async getExpiredOffers(params: FilterParams = {}): Promise<OffersResponse> {
    const queryParams = new URLSearchParams();
    if (params.limit) queryParams.append("limit", params.limit.toString());
    if (params.offset) queryParams.append("offset", params.offset.toString());
    if (params.skipCache) queryParams.append("skipCache", "true");

    return this.request<OffersResponse>(`/expired?${queryParams.toString()}`);
  }

  async getUpcomingOffers(params: FilterParams = {}): Promise<OffersResponse> {
    const queryParams = new URLSearchParams();
    if (params.limit) queryParams.append("limit", params.limit.toString());
    if (params.offset) queryParams.append("offset", params.offset.toString());
    if (params.skipCache) queryParams.append("skipCache", "true");

    return this.request<OffersResponse>(`/upcoming?${queryParams.toString()}`);
  }

  async getPendingApprovalOffers(
    params: FilterParams = {}
  ): Promise<OffersResponse> {
    const queryParams = new URLSearchParams();
    if (params.limit) queryParams.append("limit", params.limit.toString());
    if (params.offset) queryParams.append("offset", params.offset.toString());
    if (params.skipCache) queryParams.append("skipCache", "true");

    return this.request<OffersResponse>(
      `/pending-approval?${queryParams.toString()}`
    );
  }

  async getApprovedOffers(params: FilterParams = {}): Promise<OffersResponse> {
    const queryParams = new URLSearchParams();
    if (params.limit) queryParams.append("limit", params.limit.toString());
    if (params.offset) queryParams.append("offset", params.offset.toString());
    if (params.skipCache) queryParams.append("skipCache", "true");

    return this.request<OffersResponse>(`/approved?${queryParams.toString()}`);
  }

  async getRejectedOffers(params: FilterParams = {}): Promise<OffersResponse> {
    const queryParams = new URLSearchParams();
    if (params.limit) queryParams.append("limit", params.limit.toString());
    if (params.offset) queryParams.append("offset", params.offset.toString());
    if (params.skipCache) queryParams.append("skipCache", "true");

    return this.request<OffersResponse>(`/rejected?${queryParams.toString()}`);
  }

  // Date & Range
  async getOffersByDateRange(params: DateRangeParams): Promise<OffersResponse> {
    const queryParams = new URLSearchParams();
    queryParams.append("startDate", params.startDate);
    queryParams.append("endDate", params.endDate);
    if (params.limit) queryParams.append("limit", params.limit.toString());
    if (params.offset) queryParams.append("offset", params.offset.toString());
    if (params.skipCache) queryParams.append("skipCache", "true");

    return this.request<OffersResponse>(
      `/date-range?${queryParams.toString()}`
    );
  }

  // Specific Lookups
  async getOffersByStatus(
    status: OfferStatusEnum,
    params: FilterParams = {}
  ): Promise<OffersResponse> {
    const queryParams = new URLSearchParams();
    if (params.limit) queryParams.append("limit", params.limit.toString());
    if (params.offset) queryParams.append("offset", params.offset.toString());
    if (params.skipCache) queryParams.append("skipCache", "true");

    return this.request<OffersResponse>(
      `/status/${status}?${queryParams.toString()}`
    );
  }

  async getOffersByType(
    type: OfferTypeEnum,
    params: FilterParams = {}
  ): Promise<OffersResponse> {
    const queryParams = new URLSearchParams();
    if (params.limit) queryParams.append("limit", params.limit.toString());
    if (params.offset) queryParams.append("offset", params.offset.toString());
    if (params.skipCache) queryParams.append("skipCache", "true");

    return this.request<OffersResponse>(
      `/type/${type}?${queryParams.toString()}`
    );
  }

  async getOffersByCategory(
    categoryId: number,
    params: FilterParams = {}
  ): Promise<OffersResponse> {
    const queryParams = new URLSearchParams();
    if (params.limit) queryParams.append("limit", params.limit.toString());
    if (params.offset) queryParams.append("offset", params.offset.toString());
    if (params.skipCache) queryParams.append("skipCache", "true");

    const response = await this.request<OffersResponse>(
      `/category/${categoryId}?${queryParams.toString()}`
    );

    // Normalize all offers in paginated response
    if (response?.data && Array.isArray(response.data)) {
      return {
        ...response,
        data: this.normalizeOfferArray(response.data),
      };
    }
    return response;
  }

  async getOffersByProduct(
    productId: number,
    params: FilterParams = {}
  ): Promise<OffersResponse> {
    const queryParams = new URLSearchParams();
    if (params.limit) queryParams.append("limit", params.limit.toString());
    if (params.offset) queryParams.append("offset", params.offset.toString());
    if (params.skipCache) queryParams.append("skipCache", "true");

    return this.request<OffersResponse>(
      `/product/${productId}?${queryParams.toString()}`
    );
  }

  async getOfferByUuid(
    uuid: string,
    skipCache: boolean = false
  ): Promise<OfferResponse> {
    const params = skipCache ? "?skipCache=true" : "";
    return this.request<OfferResponse>(`/uuid/${uuid}${params}`);
  }

  async getOfferByName(
    name: string,
    skipCache: boolean = false
  ): Promise<OfferResponse> {
    const params = skipCache ? "?skipCache=true" : "";
    return this.request<OfferResponse>(
      `/name/${encodeURIComponent(name)}${params}`
    );
  }

  async getOfferByCode(
    code: string,
    skipCache: boolean = false
  ): Promise<OfferResponse> {
    const params = skipCache ? "?skipCache=true" : "";
    return this.request<OfferResponse>(`/code/${code}${params}`);
  }

  // Write Operations
  async createOffer(offer: CreateOfferRequest): Promise<CreateOfferResponse> {
    const result = await this.request<CreateOfferResponse>("/", {
      method: "POST",
      body: JSON.stringify(offer),
    });
    return result;
  }

  async updateOfferStatus(
    id: number,
    request: UpdateStatusRequest
  ): Promise<OfferResponse> {
    const result = await this.request<OfferResponse>(`/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify(request),
    });
    return result;
  }

  async submitForApproval(
    id: number,
    request: SubmitApprovalRequest = {}
  ): Promise<OfferResponse> {
    // Use updateOfferStatus - backend sets approval_status automatically based on status
    const statusRequest: UpdateStatusRequest = {
      status: OfferStatusEnum.PENDING_APPROVAL,
      updated_by: request.updated_by,
    };
    return await this.updateOfferStatus(id, statusRequest);
  }

  async approveOffer(
    id: number,
    _request: ApproveOfferRequest = {}
  ): Promise<OfferResponse> {
    // Use updateOfferStatus - backend sets approval_status, approved_by, approved_at automatically
    const statusRequest: UpdateStatusRequest = {
      status: OfferStatusEnum.APPROVED,
    };
    return await this.updateOfferStatus(id, statusRequest);
  }

  // Nested Resources
  // Legacy method - uses new endpoint
  async getOfferProducts(
    id: number,
    skipCache: boolean = false
  ): Promise<OfferProductsResponse> {
    // Use the new getProductsByOffer endpoint
    const result = await this.getProductsByOffer(id, { skipCache });
    // Convert PaginatedResponse to OfferProductsResponse format
    return {
      success: result.success,
      data: result.data,
      source: result.source,
    };
  }

  // Basic CRUD
  async getOfferById(
    id: number,
    skipCache: boolean = false
  ): Promise<OfferResponse> {
    const params = skipCache ? "?skipCache=true" : "";
    const response = await this.request<OfferResponse>(`/${id}${params}`);

    // Normalize the offer
    if (response?.data) {
      return {
        ...response,
        data: this.normalizeOffer(response.data),
      };
    }
    return response;
  }

  async updateOffer(
    id: number,
    offer: UpdateOfferRequest
  ): Promise<OfferResponse> {
    const response = await this.request<OfferResponse>(`/${id}`, {
      method: "PUT",
      body: JSON.stringify(offer),
    });

    // Normalize the updated offer
    if (response?.data) {
      return {
        ...response,
        data: this.normalizeOffer(response.data),
      };
    }
    return response;
  }

  async deleteOffer(
    id: number
  ): Promise<{ success: boolean; message: string }> {
    return this.request<{ success: boolean; message: string }>(`/${id}`, {
      method: "DELETE",
    });
  }

  // Additional Status Operations
  async activateOffer(id: number): Promise<OfferResponse> {
    const statusRequest: UpdateStatusRequest = {
      status: OfferStatusEnum.ACTIVE,
    };
    return await this.updateOfferStatus(id, statusRequest);
  }

  async deactivateOffer(id: number): Promise<OfferResponse> {
    const statusRequest: UpdateStatusRequest = {
      status: OfferStatusEnum.DRAFT,
    };
    return await this.updateOfferStatus(id, statusRequest);
  }

  async pauseOffer(id: number): Promise<OfferResponse> {
    const statusRequest: UpdateStatusRequest = {
      status: OfferStatusEnum.PAUSED,
    };
    return await this.updateOfferStatus(id, statusRequest);
  }

  async archiveOffer(id: number): Promise<OfferResponse> {
    return await this.request<OfferResponse>(`/${id}/archive`, {
      method: "PATCH",
      body: JSON.stringify({}),
    });
  }

  async unarchiveOffer(id: number): Promise<OfferResponse> {
    return await this.request<OfferResponse>(`/${id}/unarchive`, {
      method: "PATCH",
      body: JSON.stringify({}),
    });
  }

  async expireOffer(id: number): Promise<OfferResponse> {
    const statusRequest: UpdateStatusRequest = {
      status: OfferStatusEnum.EXPIRED,
    };
    return await this.updateOfferStatus(id, statusRequest);
  }

  async requestApproval(id: number): Promise<OfferResponse> {
    // Use updateOfferStatus - backend sets approval_status automatically based on status
    const statusRequest: UpdateStatusRequest = {
      status: OfferStatusEnum.PENDING_APPROVAL,
    };
    return await this.updateOfferStatus(id, statusRequest);
  }

  async rejectOffer(
    id: number,
    _request?: { rejected_by?: number }
  ): Promise<OfferResponse> {
    // Use updateOfferStatus - backend sets approval_status, approved_by, approved_at automatically
    const statusRequest: UpdateStatusRequest = {
      status: OfferStatusEnum.REJECTED,
    };
    return await this.updateOfferStatus(id, statusRequest);
  }

  // ============================================
  // OFFER-PRODUCT LINKING ENDPOINTS
  // ============================================

  // 1. Link single product to offer
  async linkProductToOffer(
    request: CreateOfferProductLinkRequest
  ): Promise<{ success: boolean; data: OfferProductLink }> {
    // Ensure quantity defaults to 1 if not provided
    // Include created_by if provided (backend requires it in some cases)
    const requestWithDefaults = {
      ...request,
      quantity: request.quantity ?? 1,
      is_primary: request.is_primary ?? false,
    };
    return await this.request<{
      success: boolean;
      data: OfferProductLink;
    }>(
      `/`,
      {
        method: "POST",
        body: JSON.stringify(requestWithDefaults),
      },
      OFFER_PRODUCTS_BASE_URL
    );
  }

  // 2. Link multiple products to offers (batch)
  async linkProductsBatch(
    request: BatchOfferProductLinkRequest
  ): Promise<BaseResponse<{ links: OfferProductLink[]; count: number }>> {
    // Ensure defaults are applied to each link
    // Note: Batch endpoint has created_by at ROOT level, NOT in each link object
    const requestWithDefaults: BatchOfferProductLinkRequest = {
      links: request.links.map((link) => {
        // Remove created_by from link if it exists (shouldn't be there)
        const { created_by, ...linkWithoutCreatedBy } = link;
        return {
          ...linkWithoutCreatedBy,
          quantity: link.quantity ?? 1,
          is_primary: link.is_primary ?? false,
        };
      }),
      created_by: request.created_by, // Keep created_by at root level
    };

    // Validate created_by is present at root level
    if (!requestWithDefaults.created_by) {
      throw new Error(
        "created_by is required at root level for batch requests"
      );
    }

    return await this.request<
      BaseResponse<{ links: OfferProductLink[]; count: number }>
    >(
      `/batch`,
      {
        method: "POST",
        body: JSON.stringify(requestWithDefaults),
      },
      OFFER_PRODUCTS_BASE_URL
    );
  }

  // 3. Unlink product by link ID
  async unlinkProductById(
    linkId: number
  ): Promise<{ success: boolean; message: string }> {
    return await this.request<{ success: boolean; message: string }>(
      `/${linkId}`,
      {
        method: "DELETE",
      },
      OFFER_PRODUCTS_BASE_URL
    );
  }

  // 4. Unlink multiple products (batch)
  async unlinkProductsBatch(
    request: BatchDeleteRequest
  ): Promise<{ success: boolean; count: number }> {
    return await this.request<{ success: boolean; count: number }>(
      `/batch`,
      {
        method: "DELETE",
        body: JSON.stringify(request),
      },
      OFFER_PRODUCTS_BASE_URL
    );
  }

  // 5. Get all products for an offer
  async getProductsByOffer(
    offerId: number,
    params?: { limit?: number; offset?: number; skipCache?: boolean }
  ): Promise<PaginatedResponse<OfferProductLink>> {
    const queryParams = new URLSearchParams();
    if (params?.limit) queryParams.append("limit", params.limit.toString());
    if (params?.offset) queryParams.append("offset", params.offset.toString());
    if (params?.skipCache) queryParams.append("skipCache", "true");

    const queryString = queryParams.toString();
    return await this.request<PaginatedResponse<OfferProductLink>>(
      `/by-offer/${offerId}${queryString ? `?${queryString}` : ""}`,
      {},
      OFFER_PRODUCTS_BASE_URL
    );
  }

  // 6. Get all offers for a product
  async getOffersByProductId(
    productId: number,
    params?: { limit?: number; offset?: number; skipCache?: boolean }
  ): Promise<PaginatedResponse<OfferProductLink>> {
    const queryParams = new URLSearchParams();
    if (params?.limit) queryParams.append("limit", params.limit.toString());
    if (params?.offset) queryParams.append("offset", params.offset.toString());
    if (params?.skipCache) queryParams.append("skipCache", "true");

    const queryString = queryParams.toString();
    return await this.request<PaginatedResponse<OfferProductLink>>(
      `/by-product/${productId}${queryString ? `?${queryString}` : ""}`,
      {},
      OFFER_PRODUCTS_BASE_URL
    );
  }

  // 7. Get primary product for an offer
  async getPrimaryProductByOffer(
    offerId: number,
    skipCache: boolean = false
  ): Promise<BaseResponse<OfferProductLink>> {
    const params = skipCache ? "?skipCache=true" : "";
    return await this.request<BaseResponse<OfferProductLink>>(
      `/primary/${offerId}${params}`,
      {},
      OFFER_PRODUCTS_BASE_URL
    );
  }

  // 8. Check if offer has primary product
  async checkOfferHasPrimaryProduct(
    offerId: number,
    skipCache: boolean = false
  ): Promise<BaseResponse<{ hasPrimary: boolean }>> {
    const params = skipCache ? "?skipCache=true" : "";
    return await this.request<BaseResponse<{ hasPrimary: boolean }>>(
      `/check-primary/${offerId}${params}`,
      {},
      OFFER_PRODUCTS_BASE_URL
    );
  }

  // 9. Get offer-product link by ID
  async getOfferProductLinkById(
    linkId: number,
    skipCache: boolean = false
  ): Promise<BaseResponse<OfferProductLink>> {
    const params = skipCache ? "?skipCache=true" : "";
    return await this.request<BaseResponse<OfferProductLink>>(
      `/${linkId}${params}`,
      {},
      OFFER_PRODUCTS_BASE_URL
    );
  }

  // 10. Set primary product for an offer
  async setPrimaryProduct(
    offerId: number,
    productId: number | null
  ): Promise<BaseResponse<Offer>> {
    return await this.request<BaseResponse<Offer>>(
      `/${offerId}/set-primary-product`,
      {
        method: "POST",
        body: JSON.stringify({ product_id: productId }),
      },
      BASE_URL
    );
  }

  // 10. Get all offer-product links
  async getAllOfferProductLinks(params?: {
    limit?: number;
    offset?: number;
    skipCache?: boolean;
  }): Promise<PaginatedResponse<OfferProductLink>> {
    const queryParams = new URLSearchParams();
    if (params?.limit) queryParams.append("limit", params.limit.toString());
    if (params?.offset) queryParams.append("offset", params.offset.toString());
    if (params?.skipCache) queryParams.append("skipCache", "true");

    const queryString = queryParams.toString();
    return await this.request<PaginatedResponse<OfferProductLink>>(
      `/${queryString ? `?${queryString}` : ""}`,
      {},
      OFFER_PRODUCTS_BASE_URL
    );
  }

  // 11. Search offer-product links
  async searchOfferProductLinks(
    params: OfferProductSearchParams
  ): Promise<PaginatedResponse<OfferProductLink>> {
    const queryParams = new URLSearchParams();
    if (params.id) queryParams.append("id", params.id.toString());
    if (params.offer_id)
      queryParams.append("offer_id", params.offer_id.toString());
    if (params.product_id)
      queryParams.append("product_id", params.product_id.toString());
    if (params.is_primary !== undefined)
      queryParams.append("is_primary", params.is_primary.toString());
    if (params.quantity)
      queryParams.append("quantity", params.quantity.toString());
    if (params.created_by)
      queryParams.append("created_by", params.created_by.toString());
    if (params.updated_by)
      queryParams.append("updated_by", params.updated_by.toString());
    if (params.limit) queryParams.append("limit", params.limit.toString());
    if (params.offset) queryParams.append("offset", params.offset.toString());
    if (params.skipCache) queryParams.append("skipCache", "true");

    const queryString = queryParams.toString();
    return await this.request<PaginatedResponse<OfferProductLink>>(
      `/search${queryString ? `?${queryString}` : ""}`,
      {},
      OFFER_PRODUCTS_BASE_URL
    );
  }

  // 12. Get products for multiple offers (batch)
  async getProductsByOffersBatch(
    offerIds: number[],
    params?: { limit?: number; offset?: number; skipCache?: boolean }
  ): Promise<PaginatedResponse<OfferProductLink>> {
    const queryParams = new URLSearchParams();
    queryParams.append("offerIds", offerIds.join(","));
    if (params?.limit) queryParams.append("limit", params.limit.toString());
    if (params?.offset) queryParams.append("offset", params.offset.toString());
    if (params?.skipCache) queryParams.append("skipCache", "true");

    const queryString = queryParams.toString();
    return await this.request<PaginatedResponse<OfferProductLink>>(
      `/batch/by-offers?${queryString}`,
      {},
      OFFER_PRODUCTS_BASE_URL
    );
  }

  // 13. Get offers for multiple products (batch)
  async getOffersByProductsBatch(
    productIds: number[],
    params?: { limit?: number; offset?: number; skipCache?: boolean }
  ): Promise<PaginatedResponse<OfferProductLink>> {
    const queryParams = new URLSearchParams();
    queryParams.append("productIds", productIds.join(","));
    if (params?.limit) queryParams.append("limit", params.limit.toString());
    if (params?.offset) queryParams.append("offset", params.offset.toString());
    if (params?.skipCache) queryParams.append("skipCache", "true");

    const queryString = queryParams.toString();
    return await this.request<PaginatedResponse<OfferProductLink>>(
      `/batch/by-products?${queryString}`,
      {},
      OFFER_PRODUCTS_BASE_URL
    );
  }

  // Legacy method - kept for backward compatibility, uses new endpoint
  async linkProducts(
    id: number,
    productIds: number[],
    userId?: number
  ): Promise<{ success: boolean; message: string }> {
    // Use batch linking for multiple products
    if (!userId) {
      throw new Error("created_by (userId) is required for linking products");
    }
    // Note: Batch endpoint has created_by at ROOT level, NOT in each link
    const links = productIds.map((productId) => ({
      offer_id: id,
      product_id: productId,
      is_primary: false,
      quantity: 1, // Default quantity
    }));
    const result = await this.linkProductsBatch({
      links: links,
      created_by: userId, // Required at root level
    });
    return {
      success: result.success,
      message: `Linked ${result.data.count} product(s) to offer`,
    };
  }

  // History & Audit
  // TODO: Backend doesn't support these endpoints yet (404 Not Found)
  // async getLifecycleHistory(
  //   id: number,
  //   skipCache: boolean = false
  // ): Promise<{ success: boolean; data: unknown[] }> {
  //   const params = skipCache ? "?skipCache=true" : "";
  //   return this.request<{ success: boolean; data: unknown[] }>(
  //     `/${id}/lifecycle-history${params}`
  //   );
  // }

  // async getApprovalHistory(
  //   id: number,
  //   skipCache: boolean = false
  // ): Promise<{ success: boolean; data: unknown[] }> {
  //   const params = skipCache ? "?skipCache=true" : "";
  //   return this.request<{ success: boolean; data: unknown[] }>(
  //     `/${id}/approval-history${params}`
  //   );
  // }
}

export const offerService = new OfferService();
export default offerService;
